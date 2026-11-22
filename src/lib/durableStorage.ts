/**
 * CivicEye — Durable Storage Layer (Phase 12.3)
 *
 * Implements resilient, persistent browser storage using IndexedDB with automatic
 * localStorage fallback, atomic queue writes, quota failure recovery, and
 * transparent background migration.
 */

const DB_NAME = 'CivicEye_DurableDB';
const DB_VERSION = 2;

export interface DurableStorageStats {
  engine: 'IndexedDB' | 'localStorage' | 'memory';
  isPersisted: boolean;
  reportsCount: number;
  queuedOpsCount: number;
  quarantinedCount: number;
  storageQuotaBytes?: number;
  storageUsedBytes?: number;
}

class DurableStorageManager {
  private static instance: DurableStorageManager;
  private db: IDBDatabase | null = null;
  private isIndexedDbAvailable: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.isIndexedDbAvailable = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  public static getInstance(): DurableStorageManager {
    if (!DurableStorageManager.instance) {
      DurableStorageManager.instance = new DurableStorageManager();
    }
    return DurableStorageManager.instance;
  }

  /**
   * Initializes the IndexedDB database schema and initiates background migration
   */
  public async init(): Promise<void> {
    if (!this.isIndexedDbAvailable) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('reports')) {
            db.createObjectStore('reports', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sync_queue')) {
            const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            queueStore.createIndex('status', 'status', { unique: false });
            queueStore.createIndex('reportId', 'reportId', { unique: false });
          }
          if (!db.objectStoreNames.contains('quarantine')) {
            db.createObjectStore('quarantine', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('idempotency_registry')) {
            const idemStore = db.createObjectStore('idempotency_registry', { keyPath: 'idempotencyKey' });
            idemStore.createIndex('userId', 'userId', { unique: false });
            idemStore.createIndex('reportId', 'reportId', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.requestPersistentStorage();
          this.migrateFromLocalStorage();
          resolve();
        };

        request.onerror = () => {
          console.warn('[DurableStorage] IndexedDB initialization failed. Falling back to localStorage.');
          this.isIndexedDbAvailable = false;
          resolve();
        };
      } catch (err) {
        console.warn('[DurableStorage] IndexedDB error:', err);
        this.isIndexedDbAvailable = false;
        resolve();
      }
    });

    return this.initPromise;
  }

  /**
   * Requests persistent storage permission from the browser where supported
   */
  private async requestPersistentStorage(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        return isPersisted;
      }
    } catch {
      // Best-effort
    }
    return false;
  }

  /**
   * Transparently migrates existing localStorage queue & report data into IndexedDB
   */
  private async migrateFromLocalStorage(): Promise<void> {
    if (!this.db) return;

    try {
      // 1. Check if migration already executed
      const metaTx = this.db.transaction('meta', 'readonly');
      const metaStore = metaTx.objectStore('meta');
      const getReq = metaStore.get('migration_completed');

      getReq.onsuccess = async () => {
        if (getReq.result) {
          return; // Already migrated
        }

        // Migrate reports
        const savedReports = localStorage.getItem('civiceye_user_reports');
        if (savedReports) {
          try {
            const parsed = JSON.parse(savedReports);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await this.saveReports(parsed);
            }
          } catch (e) {
            console.warn('[DurableStorage] Could not parse reports during migration', e);
          }
        }

        // Migrate offline queue
        const savedQueue = localStorage.getItem('civiceye_offline_sync_queue');
        if (savedQueue) {
          try {
            const parsedQueue = JSON.parse(savedQueue);
            if (Array.isArray(parsedQueue) && parsedQueue.length > 0) {
              await this.saveQueue(parsedQueue);
            }
          } catch (e) {
            console.warn('[DurableStorage] Could not parse queue during migration', e);
          }
        }

        // Mark migration completed
        if (this.db) {
          const writeMetaTx = this.db.transaction('meta', 'readwrite');
          writeMetaTx.objectStore('meta').put({ key: 'migration_completed', timestamp: new Date().toISOString() });
        }
      };
    } catch (e) {
      console.warn('[DurableStorage] Migration exception:', e);
    }
  }

  /**
   * Atomically saves all queued sync operations to IndexedDB and mirrors to localStorage
   */
  public async saveQueue(queue: any[]): Promise<void> {
    // Always mirror to localStorage for instant synchronous access
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('civiceye_offline_sync_queue', JSON.stringify(queue));
      }
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError') {
        console.warn('[DurableStorage] LocalStorage quota exceeded. Relying on IndexedDB.');
      }
    }

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');

        // Clear and rewrite atomically
        store.clear();
        for (const item of queue) {
          store.put(item);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          console.warn('[DurableStorage] Failed writing queue to IndexedDB');
          resolve();
        };
      } catch {
        resolve();
      }
    });
  }

  /**
   * Retrieves the offline sync queue from IndexedDB (or fallback)
   */
  public async getQueue(): Promise<any[]> {
    if (this.db) {
      try {
        return await new Promise((resolve) => {
          const tx = this.db!.transaction('sync_queue', 'readonly');
          const store = tx.objectStore('sync_queue');
          const req = store.getAll();

          req.onsuccess = () => {
            if (Array.isArray(req.result) && req.result.length > 0) {
              resolve(req.result);
            } else {
              // Fallback to localStorage if empty
              resolve(this.getQueueFromLocalStorage());
            }
          };

          req.onerror = () => resolve(this.getQueueFromLocalStorage());
        });
      } catch {
        return this.getQueueFromLocalStorage();
      }
    }
    return this.getQueueFromLocalStorage();
  }

  private getQueueFromLocalStorage(): any[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('civiceye_offline_sync_queue');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  }

  /**
   * Saves reports collection to durable storage
   */
  public async saveReports(reports: any[]): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('civiceye_user_reports', JSON.stringify(reports));
      }
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError') {
        console.warn('[DurableStorage] LocalStorage quota exceeded saving reports.');
      }
    }

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');
        store.clear();
        for (const r of reports) {
          store.put(r);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Quarantines corrupted records into persistent storage
   */
  public async quarantineRecords(records: unknown[]): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('quarantine', 'readwrite');
      const store = tx.objectStore('quarantine');
      for (const rec of records) {
        store.put({ data: rec, timestamp: new Date().toISOString() });
      }
    } catch {
      // Best-effort
    }
  }

  /**
   * Saves an idempotent operation record durably to IndexedDB and mirrors to localStorage
   */
  public async saveIdempotentOp(op: any): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = 'civiceye_idempotency_registry';
        const saved = localStorage.getItem(key);
        const map = saved ? JSON.parse(saved) : {};
        map[op.idempotencyKey] = op;
        localStorage.setItem(key, JSON.stringify(map));
      }
    } catch {
      // Fallback
    }

    if (!this.db) return;
    try {
      const tx = this.db.transaction('idempotency_registry', 'readwrite');
      tx.objectStore('idempotency_registry').put(op);
    } catch {
      // Best-effort
    }
  }

  /**
   * Retrieves all durable idempotency records
   */
  public async getAllIdempotentOps(): Promise<Record<string, any>> {
    const fromLocal: Record<string, any> = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('civiceye_idempotency_registry');
        if (saved) Object.assign(fromLocal, JSON.parse(saved));
      }
    } catch {
      // Fallback
    }

    if (this.db) {
      try {
        return await new Promise((resolve) => {
          const tx = this.db!.transaction('idempotency_registry', 'readonly');
          const store = tx.objectStore('idempotency_registry');
          const req = store.getAll();
          req.onsuccess = () => {
            if (Array.isArray(req.result) && req.result.length > 0) {
              const res: Record<string, any> = { ...fromLocal };
              for (const item of req.result) {
                if (item && item.idempotencyKey) {
                  res[item.idempotencyKey] = item;
                }
              }
              resolve(res);
            } else {
              resolve(fromLocal);
            }
          };
          req.onerror = () => resolve(fromLocal);
        });
      } catch {
        return fromLocal;
      }
    }
    return fromLocal;
  }

  /**
   * Exports the complete offline sync queue for manual administrative inspection or backup
   */
  public async exportQueue(): Promise<string> {
    const queue = await this.getQueue();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '12.3',
        itemCount: queue.length,
        queue,
      },
      null,
      2
    );
  }

  /**
   * Imports and merges a sync queue backup, preventing duplicate operations via idempotency keys
   */
  public async importQueue(jsonString: string): Promise<{ importedCount: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      const incoming: any[] = Array.isArray(parsed) ? parsed : parsed.queue;
      if (!Array.isArray(incoming)) {
        return { importedCount: 0, error: 'Invalid backup format: queue must be an array.' };
      }

      const current = await this.getQueue();
      const existingKeys = new Set(current.map((i) => i.idempotencyKey || i.id));
      let added = 0;

      for (const item of incoming) {
        if (item && item.id && item.reportId) {
          const key = item.idempotencyKey || item.id;
          if (!existingKeys.has(key)) {
            current.push(item);
            existingKeys.add(key);
            added++;
          }
        }
      }

      if (added > 0) {
        await this.saveQueue(current);
      }

      return { importedCount: added };
    } catch (err: any) {
      return { importedCount: 0, error: err?.message || 'Failed to parse import queue json.' };
    }
  }

  /**
   * Returns storage telemetry and quota health
   */
  public async getStorageStats(): Promise<DurableStorageStats> {
    let isPersisted = false;
    let quota: number | undefined;
    let used: number | undefined;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota;
        used = estimate.usage;
        if (navigator.storage.persisted) {
          isPersisted = await navigator.storage.persisted();
        }
      } catch {
        // Fallback
      }
    }

    const queue = this.getQueueFromLocalStorage();
    const reports = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('civiceye_user_reports') : null;
    const reportsCount = reports ? JSON.parse(reports).length : 0;
    const quarantine = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('civiceye_offline_sync_quarantine') : null;
    const quarantinedCount = quarantine ? JSON.parse(quarantine).length : 0;

    return {
      engine: this.isIndexedDbAvailable && this.db ? 'IndexedDB' : 'localStorage',
      isPersisted,
      reportsCount,
      queuedOpsCount: queue.length,
      quarantinedCount,
      storageQuotaBytes: quota,
      storageUsedBytes: used,
    };
  }
}

export const durableStorage = DurableStorageManager.getInstance();

// Auto-initialize on browser load
if (typeof window !== 'undefined') {
  durableStorage.init();
}
