import { DashboardReport, IssueCategory, IssueSeverity, HyderabadNeighborhood } from '../types';
import { getIndianState } from '../config/indiaLocations';
import { INITIAL_USER_REPORTS, INITIAL_NEARBY_ISSUES } from '../data/dashboardMockData';
import { supabase, isSupabaseConfigured, REPORT_EVIDENCE_BUCKET } from '../lib/supabase';
import { eventBus } from '../lib/eventBus';
import { durableStorage, DurableStorageStats } from '../lib/durableStorage';
import { communityValidationService } from './communityValidationService';
import { authService } from './authService';

const LOCAL_STORAGE_KEY = 'civiceye_user_reports';
const OFFLINE_SYNC_QUEUE_KEY = 'civiceye_offline_sync_queue';
const OFFLINE_SYNC_QUARANTINE_KEY = 'civiceye_offline_sync_quarantine';

let isFlushingSyncQueue = false;
let flushPromise: Promise<{ synced: number; failed: number; remaining: number }> | null = null;

export interface QueuedSyncOperation {
  id: string;
  idempotencyKey?: string;
  userId?: string;
  type: 'create' | 'update_status' | 'update_report' | 'escalate';
  reportId: string;
  payload: Record<string, unknown>;
  payloadHash?: string;
  retryCount: number;
  maxRetries?: number;
  status?: 'pending' | 'retrying' | 'failed_needs_review' | 'synced';
  createdAt: string;
  lastAttemptAt?: string;
  lastError?: string;
}

import { computePayloadHash as canonicalPayloadHash, canonicalizePayload } from '../lib/canonicalHash';
export { canonicalizePayload };

export function computePayloadHash(payload: unknown): string {
  try {
    return canonicalPayloadHash(payload);
  } catch (err: any) {
    throw new Error(`Failed to compute payload hash: ${err?.message || 'invalid payload structure'}`);
  }
}

export interface QueueValidationResult {
  isValid: boolean;
  action: 'proceed' | 'defer' | 'quarantine';
  reason?: string;
}

export function validateQueuedSyncOperation(
  item: QueuedSyncOperation,
  activeUserId: string | null | undefined
): QueueValidationResult {
  // 1. Operation identity check
  if (!item || typeof item !== 'object') {
    return { isValid: false, action: 'quarantine', reason: 'Corrupt queue item: not an object' };
  }
  if (!item.id || typeof item.id !== 'string' || item.id.trim().length === 0) {
    return { isValid: false, action: 'quarantine', reason: 'Missing or invalid operation ID' };
  }

  // 2. Idempotency key check (Bound, format & whitespace check)
  if (!item.idempotencyKey || typeof item.idempotencyKey !== 'string') {
    return { isValid: false, action: 'quarantine', reason: 'Missing or invalid idempotency key' };
  }
  const IDEM_KEY_REGEX = /^[a-zA-Z0-9_-]{6,128}$/;
  if (!IDEM_KEY_REGEX.test(item.idempotencyKey.trim()) || item.idempotencyKey !== item.idempotencyKey.trim()) {
    return { isValid: false, action: 'quarantine', reason: 'Malformed idempotency key: must be 6-128 alphanumeric, underscore, or hyphen characters without whitespace' };
  }

  // 3. Operation type check
  const ALLOWED_TYPES = ['create', 'update_status', 'update_report', 'escalate'];
  if (!item.type || !ALLOWED_TYPES.includes(item.type)) {
    return { isValid: false, action: 'quarantine', reason: `Disallowed operation type: ${item.type}` };
  }

  // 4. Report ID check
  if (!item.reportId || typeof item.reportId !== 'string' || item.reportId.trim().length === 0 || item.reportId.length > 64) {
    return { isValid: false, action: 'quarantine', reason: 'Missing or invalid report ID' };
  }

  // 5. User ID presence check (Fail-closed)
  if (!item.userId || typeof item.userId !== 'string' || item.userId.trim().length === 0) {
    return { isValid: false, action: 'defer', reason: 'Missing originating user ID' };
  }

  // 6. Malformed User ID check
  const USER_ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;
  if (!USER_ID_REGEX.test(item.userId)) {
    return { isValid: false, action: 'quarantine', reason: `Malformed user ID: ${item.userId}` };
  }

  // 7. Active session presence check (Fail-closed)
  if (!activeUserId || typeof activeUserId !== 'string' || activeUserId.trim().length === 0) {
    return { isValid: false, action: 'defer', reason: 'No active authenticated session' };
  }

  // 8. Account matching check (Fail-closed isolation)
  if (item.userId !== activeUserId) {
    return { isValid: false, action: 'defer', reason: `Queued user ID (${item.userId}) does not match active session (${activeUserId})` };
  }

  // 9. Payload presence and structure check
  if (!item.payload || typeof item.payload !== 'object' || Array.isArray(item.payload) || Object.keys(item.payload).length === 0) {
    return { isValid: false, action: 'quarantine', reason: 'Missing or empty payload' };
  }

  // 10. Mandatory payload integrity hash verification (Strict Phase 12.3.4 Closure)
  // Missing or legacy payloadHash must NOT be accepted for normal mutation replay
  if (!item.payloadHash || typeof item.payloadHash !== 'string' || item.payloadHash.trim().length === 0) {
    return { isValid: false, action: 'quarantine', reason: 'Missing mandatory payloadHash: unverified legacy mutations cannot be replayed automatically' };
  }

  const HASH_REGEX = /^[a-f0-9]{64}$/;
  if (!HASH_REGEX.test(item.payloadHash)) {
    return { isValid: false, action: 'quarantine', reason: 'Malformed payloadHash: must be a 64-character lowercase hex digest' };
  }

  try {
    const currentHash = computePayloadHash(item.payload);
    if (currentHash !== item.payloadHash) {
      return { isValid: false, action: 'quarantine', reason: 'Payload integrity check failed: payload modified after enqueue' };
    }
  } catch (err: any) {
    return { isValid: false, action: 'quarantine', reason: `Payload integrity verification failed: ${err?.message || 'serialization error'}` };
  }

  // 11. Strict Business & Payload Schema Validation (Phase 12.3.5)
  const payload = item.payload as Record<string, unknown>;
  const VALID_STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
  const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

  if (item.type === 'create') {
    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
      return { isValid: false, action: 'quarantine', reason: 'Invalid payload schema: title must be at least 3 characters' };
    }
    if (payload.severity && !VALID_SEVERITIES.includes(payload.severity as string)) {
      return { isValid: false, action: 'quarantine', reason: `Invalid payload schema: disallowed severity "${payload.severity}"` };
    }
    if (payload.status && !VALID_STATUSES.includes(payload.status as string)) {
      return { isValid: false, action: 'quarantine', reason: `Invalid payload schema: disallowed status "${payload.status}"` };
    }
  } else if (item.type === 'update_status') {
    if (!payload.status || typeof payload.status !== 'string' || !VALID_STATUSES.includes(payload.status)) {
      return { isValid: false, action: 'quarantine', reason: `Invalid payload schema: status must be one of ${VALID_STATUSES.join(', ')}` };
    }
  } else if (item.type === 'escalate') {
    if (!payload.severity || typeof payload.severity !== 'string' || !VALID_SEVERITIES.includes(payload.severity)) {
      return { isValid: false, action: 'quarantine', reason: `Invalid payload schema: severity must be one of ${VALID_SEVERITIES.join(', ')}` };
    }
  }

  return { isValid: true, action: 'proceed' };
}

export interface CreateReportInput {
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  locationText: string;
  neighborhood: HyderabadNeighborhood;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  imageFiles?: File[];
  imagePreviews?: string[];
}

export interface CreateReportResult {
  success: boolean;
  report: DashboardReport;
  isRemotePersisted: boolean;
  error?: string;
}

export interface SimilarityCandidate {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  location: string;
  distanceMeters?: number;
  similarityReason: string;
  confirmationsCount: number;
}

function getInitialReports(): DashboardReport[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read reports from localStorage', e);
  }
  return INITIAL_USER_REPORTS;
}

// In-memory cache synced with localStorage
let cachedReports: DashboardReport[] = getInitialReports();

function saveReportsLocally(reports: DashboardReport[]): void {
  cachedReports = reports;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('civiceye_reports_updated', { detail: reports }));
  } catch (e) {
    console.error('Failed to save reports locally', e);
  }
  durableStorage.saveReports(reports).catch(() => {});
}

/**
 * Deterministic Field-Level Conflict Reconciliation:
 * Reconciles concurrent local and remote mutations without data loss.
 * - Adopts authoritative municipal workflow status, assignments, and revisions from remote.
 * - Preserves citizen community validations, local validation actions, and new evidence photos.
 */
export function reconcileReport(local: DashboardReport, remote: DashboardReport): DashboardReport {
  const localVersion = local.version || 1;
  const remoteVersion = remote.version || 1;
  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;

  const adoptRemoteWorkflow = remoteVersion > localVersion || remoteTime >= localTime;
  const mergedConfirmations = Math.max(local.confirmationsCount || 0, remote.confirmationsCount || 0);

  const evidenceMap = new Map<string, any>();
  (remote.additionalEvidence || []).forEach((ev) => evidenceMap.set(ev.id, ev));
  (local.additionalEvidence || []).forEach((ev) => evidenceMap.set(ev.id, ev));
  const mergedEvidence = Array.from(evidenceMap.values());

  const preferredDescription =
    localTime > remoteTime && local.status === 'Submitted' ? local.description : remote.description;

  // Authoritative identity-based validation reconciliation (Phase 12.3.2)
  // Replaces unsafe Math.max() fallback.
  // Distinguishes: (A) Loaded with zero validations (authoritative 0),
  // (B) Loaded with validations (authoritative count),
  // (C) Loading (preserves current state without Math.max inflation),
  // (D) Failed/Uninitialized (preserves server state without Math.max inflation).
  const valState = communityValidationService?.getValidationState
    ? communityValidationService.getValidationState(remote.id)
    : 'loaded';
  const summary = communityValidationService?.getCommunitySummary
    ? communityValidationService.getCommunitySummary(remote.id)
    : null;

  let resolvedStillExists: number;
  let resolvedGettingWorse: number;
  let resolvedAppearsFixed: number;
  let legacyUnverified: number | undefined = undefined;

  if (valState === 'loaded' && summary) {
    // State A & B: Validation records are authoritative (even when 0)
    resolvedStillExists = summary.stillExists;
    resolvedGettingWorse = summary.gettingWorse;
    resolvedAppearsFixed = summary.appearsFixed;

    // Distinguish legacy unverified counters from verified citizen votes
    const rawLegacy = (remote.stillExistsCount || 0) + (remote.gettingWorseCount || 0);
    if (summary.total === 0 && rawLegacy > 0) {
      legacyUnverified = rawLegacy;
    }
  } else if (valState === 'loading') {
    // State C: Still loading — preserve remote server count without blind Math.max inflation
    resolvedStillExists = remote.stillExistsCount ?? local.stillExistsCount ?? 0;
    resolvedGettingWorse = remote.gettingWorseCount ?? local.gettingWorseCount ?? 0;
    resolvedAppearsFixed = remote.appearsFixedCount ?? local.appearsFixedCount ?? 0;
  } else if (valState === 'failed') {
    // State D: Failed — preserve remote server count without blind Math.max inflation
    resolvedStillExists = remote.stillExistsCount ?? local.stillExistsCount ?? 0;
    resolvedGettingWorse = remote.gettingWorseCount ?? local.gettingWorseCount ?? 0;
    resolvedAppearsFixed = remote.appearsFixedCount ?? local.appearsFixedCount ?? 0;
  } else {
    // State E: Uninitialized / offline report with legacy counters
    resolvedStillExists = Math.max(local.stillExistsCount || 0, remote.stillExistsCount || 0);
    resolvedGettingWorse = Math.max(local.gettingWorseCount || 0, remote.gettingWorseCount || 0);
    resolvedAppearsFixed = Math.max(local.appearsFixedCount || 0, remote.appearsFixedCount || 0);
  }

  return {
    ...(adoptRemoteWorkflow ? remote : local),
    id: remote.id,
    ticketNumber: remote.ticketNumber,
    version: Math.max(remoteVersion, localVersion),
    status: adoptRemoteWorkflow ? remote.status : local.status,
    departmentAssigned: adoptRemoteWorkflow ? remote.departmentAssigned : local.departmentAssigned,
    handlingOfficer: adoptRemoteWorkflow ? remote.handlingOfficer : local.handlingOfficer,
    confirmationsCount: mergedConfirmations,
    stillExistsCount: resolvedStillExists,
    gettingWorseCount: resolvedGettingWorse,
    appearsFixedCount: resolvedAppearsFixed,
    legacyUnverifiedCount: legacyUnverified,
    additionalEvidence: mergedEvidence.length > 0 ? mergedEvidence : undefined,
    userValidationAction: local.userValidationAction || remote.userValidationAction,
    description: preferredDescription,
    updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
  };
}

export const reportService = {
  isRemotePersisted(): boolean {
    return isSupabaseConfigured;
  },

  reconcileReport(local: DashboardReport, remote: DashboardReport): DashboardReport {
    return reconcileReport(local, remote);
  },

  // ==========================================
  // OFFLINE SYNC QUEUE MANAGEMENT (ZERO DATA LOSS)
  // ==========================================
  getSyncQueue(): QueuedSyncOperation[] {
    try {
      const saved = localStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validItems: QueuedSyncOperation[] = [];
          const quarantined: unknown[] = [];

          for (const item of parsed) {
            if (item && typeof item === 'object' && typeof item.id === 'string' && typeof item.reportId === 'string') {
              validItems.push({
                ...item,
                status: item.status || (item.retryCount >= (item.maxRetries || 5) ? 'failed_needs_review' : 'pending'),
                maxRetries: item.maxRetries || 5,
                idempotencyKey: item.idempotencyKey || `idem-${item.id}`,
              });
            } else {
              quarantined.push(item);
            }
          }

          if (quarantined.length > 0) {
            this.quarantineCorruptedRecords(quarantined);
            this.saveSyncQueue(validItems);
          }
          return validItems;
        }
      }
    } catch (e) {
      console.warn('Could not read offline sync queue', e);
    }
    return [];
  },

  quarantineCorruptedRecords(records: unknown[]): void {
    try {
      const existing = this.getQuarantinedOperations();
      const combined = [...existing, ...records];
      localStorage.setItem(OFFLINE_SYNC_QUARANTINE_KEY, JSON.stringify(combined));
    } catch (e) {
      console.error('Failed to quarantine corrupted offline sync records', e);
    }
    durableStorage.quarantineRecords(records).catch(() => {});
  },

  getQuarantinedOperations(): unknown[] {
    try {
      const saved = localStorage.getItem(OFFLINE_SYNC_QUARANTINE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveSyncQueue(queue: QueuedSyncOperation[]): void {
    try {
      localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save sync queue', e);
    }
    durableStorage.saveQueue(queue).catch(() => {});
  },

  async exportSyncQueue(): Promise<string> {
    return durableStorage.exportQueue();
  },

  async importSyncQueue(jsonString: string): Promise<{ importedCount: number; error?: string }> {
    const res = await durableStorage.importQueue(jsonString);
    if (res.importedCount > 0) {
      const q = await durableStorage.getQueue();
      this.saveSyncQueue(q);
    }
    return res;
  },

  async getDurableStorageStats(): Promise<DurableStorageStats> {
    return durableStorage.getStorageStats();
  },

  enqueueSyncOperation(op: {
    id: string;
    type: 'create' | 'update_status' | 'update_report' | 'escalate';
    reportId: string;
    payload: Record<string, unknown>;
    idempotencyKey?: string;
    userId?: string;
    maxRetries?: number;
  }): void {
    const queue = this.getSyncQueue();
    const existingIndex = queue.findIndex(
      (item) => item.reportId === op.reportId && item.type === op.type
    );

    const activeUserId = authService.getCurrentSessionSync()?.user?.id;
    const queuedItem: QueuedSyncOperation = {
      id: op.id,
      idempotencyKey: op.idempotencyKey || `idem-${op.reportId}-${op.type}-${Date.now()}`,
      userId: op.userId || activeUserId || 'usr-aditya',
      type: op.type,
      reportId: op.reportId,
      payload: op.payload,
      payloadHash: computePayloadHash(op.payload),
      retryCount: 0,
      maxRetries: op.maxRetries || 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = queuedItem;
    } else {
      queue.push(queuedItem);
    }

    this.saveSyncQueue(queue);
  },

  getFailedOperations(): QueuedSyncOperation[] {
    return this.getSyncQueue().filter((item) => item.status === 'failed_needs_review');
  },

  async retryFailedOperations(): Promise<{ synced: number; failed: number; remaining: number }> {
    const queue = this.getSyncQueue();
    let resetCount = 0;
    for (const item of queue) {
      if (item.status === 'failed_needs_review') {
        item.status = 'retrying';
        item.retryCount = 0;
        resetCount++;
      }
    }
    if (resetCount > 0) {
      this.saveSyncQueue(queue);
    }
    return this.flushPendingSyncQueue();
  },

  /**
   * Flushes pending offline sync operations to Supabase with concurrency locking
   * and ZERO data loss guarantee: failed items are marked 'failed_needs_review'
   * and permanently preserved for administrative inspection or manual recovery.
   */
  async flushPendingSyncQueue(): Promise<{ synced: number; failed: number; remaining: number }> {
    // Concurrency lock: return active promise if already flushing
    if (isFlushingSyncQueue && flushPromise) {
      return flushPromise;
    }

    isFlushingSyncQueue = true;
    flushPromise = (async () => {
      try {
        const queue = this.getSyncQueue();
        const activeQueue = queue.filter(
          (item) => item.status === 'pending' || item.status === 'retrying'
        );
        const retainedFailures = queue.filter((item) => item.status === 'failed_needs_review');

        if (!isSupabaseConfigured || !supabase) {
          return { synced: 0, failed: retainedFailures.length, remaining: queue.length };
        }

        if (activeQueue.length === 0) {
          return { synced: 0, failed: retainedFailures.length, remaining: retainedFailures.length };
        }

        // Strict Fail-Closed Authentication Check:
        // A valid active session is strictly required to replay ANY offline mutations.
        const currentSession = authService.getCurrentSessionSync();
        const activeUserId = currentSession?.user?.id;

        if (!currentSession || !activeUserId) {
          // No active session (logged out, expired session, or unauthenticated)
          // FAIL CLOSED: Preserve all queued operations safely, do not execute.
          return { synced: 0, failed: retainedFailures.length, remaining: queue.length };
        }

        let synced = 0;
        let failed = retainedFailures.length;
        const preservedQueue: QueuedSyncOperation[] = [...retainedFailures];
        const quarantinedItems: unknown[] = [];

        for (const item of activeQueue) {
          // Session expiration check mid-flush: if auth expired during execution, fail-closed
          const liveSession = authService.getCurrentSessionSync();
          if (!liveSession || !liveSession.user || liveSession.user.id !== activeUserId) {
            preservedQueue.push(item);
            continue;
          }

          // Strict 10-point fail-closed validation guard
          const validation = validateQueuedSyncOperation(item, activeUserId);

          if (validation.action === 'quarantine') {
            item.status = 'failed_needs_review';
            item.lastError = validation.reason || 'Security validation failed';
            quarantinedItems.push(item);
            failed++;
            continue;
          }

          if (validation.action === 'defer') {
            // Operation belongs to another user or needs authentic matching context: preserve safely
            preservedQueue.push(item);
            continue;
          }

          try {
            if (item.type === 'create') {
              const payload = item.payload as any;
              const { error } = await supabase.from('reports').upsert(payload);
              if (error) throw error;
            } else if (item.type === 'update_status' || item.type === 'update_report' || item.type === 'escalate') {
              const payload = item.payload as any;
              const { error } = await supabase.from('reports').update(payload).eq('id', item.reportId);
              if (error) throw error;
            }

            // Mark report as persisted remotely in cached reports
            const rep = cachedReports.find((r) => r.id === item.reportId);
            if (rep) {
              rep.isRemotePersisted = true;
              saveReportsLocally([...cachedReports]);
            }
            synced++;
          } catch (err: any) {
            item.retryCount += 1;
            item.lastAttemptAt = new Date().toISOString();
            item.lastError = err?.message || 'Network sync error';

            // ZERO DATA LOSS: Never delete or prune after max retries.
            // Retain permanently with failed_needs_review status.
            if (item.retryCount >= (item.maxRetries || 5)) {
              item.status = 'failed_needs_review';
            } else {
              item.status = 'retrying';
            }
            preservedQueue.push(item);
            failed++;
          }
        }

        if (quarantinedItems.length > 0) {
          this.quarantineCorruptedRecords(quarantinedItems);
        }

        this.saveSyncQueue(preservedQueue);

        eventBus.publish('civiceye:sync_flushed', {
          syncedCount: synced,
          pendingCount: preservedQueue.length,
        });

        return { synced, failed, remaining: preservedQueue.length };
      } finally {
        isFlushingSyncQueue = false;
        flushPromise = null;
      }
    })();

    return flushPromise;
  },

  // ==========================================
  // FETCH & CONFLICT-RESOLVED MERGE
  // ==========================================
  async getAllReports(): Promise<DashboardReport[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const remoteReports: DashboardReport[] = data.map((row) => ({
            id: row.id,
            ticketNumber: row.ticket_number,
            title: row.title,
            category: row.category as IssueCategory,
            reportDate: new Date(row.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            reportTimestamp: new Date(row.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            location: row.location_text,
            neighborhood: (row.neighborhood as HyderabadNeighborhood) || 'Jubilee Hills',
            severity: row.severity as IssueSeverity,
            status: row.status,
            confirmationsCount: row.confirmations_count || 0,
            description: row.description,
            departmentAssigned: row.department_assigned || 'GHMC Civic Operations',
            handlingOfficer: row.handling_officer || undefined,
            thumbnailUrl: row.images?.[0] || undefined,
            images: row.images || [],
            latitude: row.latitude,
            longitude: row.longitude,
            isRemotePersisted: true,
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at,
            version: row.version || 1,
            timeline: [
              {
                step: 'Submitted',
                label: 'Report Submitted',
                timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                completed: true,
                current: row.status === 'Submitted',
                detail: 'Citizen filed civic issue with verified GPS coordinates and photographic documentation.',
              },
            ],
          }));

          // Deterministic Conflict Resolution with Optimistic Versioning & Field-Level Reconciliation:
          const merged: DashboardReport[] = [];
          const remoteMap = new Map<string, DashboardReport>();
          remoteReports.forEach((r) => remoteMap.set(r.id, r));

          const processedIds = new Set<string>();

          for (const local of cachedReports) {
            processedIds.add(local.id);
            const remote = remoteMap.get(local.id);
            if (!remote) {
              // Local only record
              merged.push(local);
            } else {
              merged.push(reconcileReport(local, remote));
            }
          }

          // Add any remote records that weren't in local cache
          for (const remote of remoteReports) {
            if (!processedIds.has(remote.id)) {
              merged.push(remote);
            }
          }

          cachedReports = merged;
          saveReportsLocally(cachedReports);
          return cachedReports;
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local storage', e);
      }
    }
    return cachedReports;
  },

  async getReportById(id: string): Promise<DashboardReport | undefined> {
    const list = await this.getAllReports();
    return list.find((r) => r.id === id);
  },

  // ==========================================
  // CREATE REPORT
  // ==========================================
  async createReport(input: CreateReportInput): Promise<CreateReportResult> {
    const timestamp = new Date();
    const id = `rep-${Date.now()}`;

    let statePrefix = 'HYD';
    if (input.state) {
      const stateObj = getIndianState(input.state);
      statePrefix = stateObj ? stateObj.code : input.state.slice(0, 3).toUpperCase();
    } else if (['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kondapur', 'Begumpet'].includes(input.neighborhood)) {
      statePrefix = 'HYD';
    }

    let wardCode = 'LOC';
    if (input.neighborhood === 'Jubilee Hills') wardCode = 'JH';
    else if (input.neighborhood === 'Banjara Hills') wardCode = 'BH';
    else if (input.neighborhood === 'Madhapur') wardCode = 'MD';
    else if (input.neighborhood === 'Gachibowli') wardCode = 'GB';
    else if (input.neighborhood === 'Kondapur') wardCode = 'KP';
    else if (input.neighborhood === 'Begumpet') wardCode = 'BP';
    else {
      wardCode = input.neighborhood.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'LOC';
    }

    const randNum = Math.floor(100 + Math.random() * 900);
    const ticketNumber = `${statePrefix}-${wardCode}-${timestamp.getFullYear()}-${randNum}`;

    let uploadedImageUrls: string[] = input.imagePreviews || [];

    // Attempt remote upload if Supabase is connected
    let isRemote = false;
    const client = supabase;
    if (isSupabaseConfigured && client && input.imageFiles && input.imageFiles.length > 0) {
      try {
        const uploadPromises = input.imageFiles.map(async (file, idx) => {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const filePath = `${id}-${idx}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await client.storage
            .from(REPORT_EVIDENCE_BUCKET)
            .upload(filePath, file, { contentType: file.type });

          if (!uploadError) {
            const { data } = client.storage.from(REPORT_EVIDENCE_BUCKET).getPublicUrl(filePath);
            return data.publicUrl;
          }
          return input.imagePreviews?.[idx] || '';
        });

        const results = await Promise.all(uploadPromises);
        uploadedImageUrls = results.filter(Boolean);
      } catch (e) {
        console.warn('Image upload to Supabase storage failed, using local previews', e);
      }
    }

    const newReport: DashboardReport = {
      id,
      ticketNumber,
      title: input.title.trim(),
      category: input.category,
      reportDate: 'Today',
      reportTimestamp: timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      location: input.locationText.trim(),
      neighborhood: input.neighborhood,
      state: input.state,
      city: input.city,
      severity: input.severity,
      status: 'Submitted',
      confirmationsCount: 1,
      description: input.description.trim(),
      departmentAssigned: getDepartment(input.category),
      handlingOfficer: undefined,
      thumbnailUrl: uploadedImageUrls[0] || undefined,
      images: uploadedImageUrls,
      latitude: input.latitude,
      longitude: input.longitude,
      isRemotePersisted: false,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
      version: 1,
      evidenceNote: uploadedImageUrls.length > 0 ? `${uploadedImageUrls.length} field photo(s) captured by citizen` : undefined,
      timeline: [
        {
          step: 'Submitted',
          label: 'Report Submitted',
          timestamp: 'Just now',
          completed: true,
          current: true,
          detail: 'Citizen filed civic issue with verified GPS coordinates and photographic documentation.',
        },
        {
          step: 'Under Review',
          label: 'Community Validation',
          timestamp: 'Awaiting Consensus',
          completed: false,
          current: false,
          detail: 'Neighborhood residents can confirm condition presence via Ward Watch.',
        },
        {
          step: 'Assigned',
          label: 'Department Assigned',
          timestamp: 'Pending Routing',
          completed: false,
          current: false,
          detail: `Will be routed to ${getDepartment(input.category)}.`,
        },
        {
          step: 'In Progress',
          label: 'Work In Progress',
          timestamp: 'Pending Dispatch',
          completed: false,
          current: false,
          detail: 'Awaiting field crew dispatch.',
        },
        {
          step: 'Resolved',
          label: 'Resolution Evidence Added',
          timestamp: 'Pending Completion',
          completed: false,
          current: false,
          detail: 'Field repair evidence will be recorded here.',
        },
      ],
    };

    const supabasePayload = {
      id: newReport.id,
      ticket_number: newReport.ticketNumber,
      title: newReport.title,
      description: newReport.description,
      category: newReport.category,
      severity: newReport.severity,
      status: newReport.status,
      latitude: newReport.latitude ?? null,
      longitude: newReport.longitude ?? null,
      location_text: newReport.location,
      neighborhood: newReport.neighborhood,
      images: newReport.images,
      confirmations_count: newReport.confirmationsCount,
      reporter_name: 'Citizen Reporter',
      version: 1,
    };

    // If Supabase is connected, attempt remote insert
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reports').insert(supabasePayload);
        if (!error) {
          isRemote = true;
          newReport.isRemotePersisted = true;
        } else {
          console.warn('Supabase DB insert error, queued for offline sync:', error.message);
          this.enqueueSyncOperation({
            id: `sync-create-${newReport.id}`,
            type: 'create',
            reportId: newReport.id,
            payload: supabasePayload,
          });
        }
      } catch (e: any) {
        console.warn('Network exception inserting to Supabase, queued for offline sync:', e);
        this.enqueueSyncOperation({
          id: `sync-create-${newReport.id}`,
          type: 'create',
          reportId: newReport.id,
          payload: supabasePayload,
        });
      }
    } else {
      // Offline mode: queue for eventual sync
      this.enqueueSyncOperation({
        id: `sync-create-${newReport.id}`,
        type: 'create',
        reportId: newReport.id,
        payload: supabasePayload,
      });
    }

    // Always persist to local cache and localStorage
    const updated = [newReport, ...cachedReports];
    saveReportsLocally(updated);

    // Publish to fault-isolated event bus
    eventBus.publish('civiceye:report_created', { report: newReport });

    return {
      success: true,
      report: newReport,
      isRemotePersisted: isRemote,
    };
  },

  // ==========================================
  // UPDATE REPORT STATUS
  // ==========================================
  async updateReportStatus(
    reportId: string,
    status: DashboardReport['status'],
    detailNote?: string,
    departmentAssigned?: string,
    handlingOfficer?: string,
    priority?: IssueSeverity
  ): Promise<DashboardReport | null> {
    const list = await this.getAllReports();
    const index = list.findIndex((r) => r.id === reportId);
    if (index === -1) return null;

    const rep = { ...list[index] };
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isoNow = new Date().toISOString();

    rep.status = status;
    rep.updatedAt = isoNow;
    rep.version = (rep.version || 1) + 1;
    if (departmentAssigned) rep.departmentAssigned = departmentAssigned;
    if (handlingOfficer) rep.handlingOfficer = handlingOfficer;
    if (priority) rep.severity = priority;

    const existingTimeline = [...rep.timeline];
    existingTimeline.forEach((t) => {
      t.current = false;
    });

    const stepLabel =
      status === 'Submitted'
        ? 'Report Submitted'
        : status === 'Under Review'
        ? 'Community Validation / Review'
        : status === 'Assigned'
        ? 'Department Assigned'
        : status === 'In Progress'
        ? 'Work In Progress'
        : 'Report Resolved';

    existingTimeline.push({
      step: status,
      label: stepLabel,
      timestamp: nowStr,
      completed: true,
      current: true,
      detail: detailNote || `Status transitioned to ${status}.`,
    });

    rep.timeline = existingTimeline;
    list[index] = rep;
    saveReportsLocally(list);

    const updatePayload = {
      status: rep.status,
      department_assigned: rep.departmentAssigned ?? null,
      handling_officer: rep.handlingOfficer ?? null,
      severity: rep.severity,
      updated_at: isoNow,
      version: rep.version,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reports').update(updatePayload).eq('id', rep.id);
        if (!error) {
          rep.isRemotePersisted = true;
        } else {
          this.enqueueSyncOperation({
            id: `sync-status-${rep.id}-${Date.now()}`,
            type: 'update_status',
            reportId: rep.id,
            payload: updatePayload,
          });
        }
      } catch (e) {
        this.enqueueSyncOperation({
          id: `sync-status-${rep.id}-${Date.now()}`,
          type: 'update_status',
          reportId: rep.id,
          payload: updatePayload,
        });
      }
    } else {
      this.enqueueSyncOperation({
        id: `sync-status-${rep.id}-${Date.now()}`,
        type: 'update_status',
        reportId: rep.id,
        payload: updatePayload,
      });
    }

    eventBus.publish('civiceye:report_updated', {
      reportId: rep.id,
      status: rep.status,
      severity: rep.severity,
      report: rep,
    });

    return rep;
  },

  // ==========================================
  // UPDATE REPORT (GENERIC)
  // ==========================================
  async updateReport(
    reportId: string,
    updates: Partial<DashboardReport>
  ): Promise<DashboardReport | null> {
    const list = await this.getAllReports();
    const index = list.findIndex((r) => r.id === reportId);
    if (index === -1) return null;

    const isoNow = new Date().toISOString();
    const currentVersion = list[index].version || 1;
    const updatedRep: DashboardReport = {
      ...list[index],
      ...updates,
      updatedAt: isoNow,
      version: currentVersion + 1,
    };
    list[index] = updatedRep;
    saveReportsLocally(list);

    const payload: Record<string, unknown> = {
      updated_at: isoNow,
      version: updatedRep.version,
    };
    if (updates.status) payload.status = updates.status;
    if (updates.severity) payload.severity = updates.severity;
    if (updates.departmentAssigned) payload.department_assigned = updates.departmentAssigned;
    if (updates.handlingOfficer) payload.handling_officer = updates.handlingOfficer;
    if (updates.confirmationsCount !== undefined) payload.confirmations_count = updates.confirmationsCount;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reports').update(payload).eq('id', reportId);
        if (!error) {
          updatedRep.isRemotePersisted = true;
        } else {
          this.enqueueSyncOperation({
            id: `sync-update-${reportId}-${Date.now()}`,
            type: 'update_report',
            reportId,
            payload,
          });
        }
      } catch (e) {
        this.enqueueSyncOperation({
          id: `sync-update-${reportId}-${Date.now()}`,
          type: 'update_report',
          reportId,
          payload,
        });
      }
    } else {
      this.enqueueSyncOperation({
        id: `sync-update-${reportId}-${Date.now()}`,
        type: 'update_report',
        reportId,
        payload,
      });
    }

    eventBus.publish('civiceye:report_updated', {
      reportId,
      status: updatedRep.status,
      severity: updatedRep.severity,
      report: updatedRep,
    });

    return updatedRep;
  },

  async escalatePriority(reportId: string, targetSeverity: IssueSeverity, reason?: string): Promise<boolean> {
    const list = await this.getAllReports();
    const rep = list.find((r) => r.id === reportId);
    if (!rep) return false;

    const rank: Record<IssueSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    if (rank[targetSeverity] > rank[rep.severity]) {
      rep.severity = targetSeverity;
      rep.updatedAt = new Date().toISOString();
      rep.version = (rep.version || 1) + 1;
      if (reason) {
        rep.timeline.push({
          step: rep.status,
          label: 'Priority Escalated',
          timestamp: 'Just now',
          completed: true,
          current: true,
          detail: reason,
        });
      }
      saveReportsLocally([...list]);

      const payload = { severity: targetSeverity, updated_at: rep.updatedAt, version: rep.version };
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('reports').update(payload).eq('id', reportId);
        } catch {
          this.enqueueSyncOperation({
            id: `sync-escalate-${reportId}-${Date.now()}`,
            type: 'escalate',
            reportId,
            payload,
          });
        }
      } else {
        this.enqueueSyncOperation({
          id: `sync-escalate-${reportId}-${Date.now()}`,
          type: 'escalate',
          reportId,
          payload,
        });
      }

      eventBus.publish('civiceye:report_updated', {
        reportId,
        severity: targetSeverity,
        status: rep.status,
        report: rep,
      });
      return true;
    }
    return false;
  },

  getFollowedIssueIds(): string[] {
    try {
      const saved = localStorage.getItem('civiceye_followed_issues');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read followed issues from localStorage', e);
    }
    return ['nb-jh-2'];
  },

  isReportFollowed(reportId: string): boolean {
    return this.getFollowedIssueIds().includes(reportId);
  },

  toggleFollowReport(reportId: string): boolean {
    const current = this.getFollowedIssueIds();
    const isFollowed = current.includes(reportId);
    const updated = isFollowed ? current.filter((id) => id !== reportId) : [...current, reportId];
    try {
      localStorage.setItem('civiceye_followed_issues', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('civiceye_watchlist_updated', { detail: updated }));
    } catch (e) {
      console.error('Failed to save followed issues to localStorage', e);
    }

    eventBus.publish('civiceye:watchlist_updated', { followedIds: updated });
    return !isFollowed;
  },

  async findReport(query: string): Promise<DashboardReport | undefined> {
    const normalized = query.trim().toLowerCase();
    const list = await this.getAllReports();
    return list.find(
      (r) =>
        r.id.toLowerCase() === normalized ||
        r.ticketNumber.toLowerCase() === normalized ||
        r.ticketNumber.toLowerCase().includes(normalized) ||
        normalized.includes(r.ticketNumber.toLowerCase()) ||
        normalized.includes(r.id.toLowerCase())
    );
  },

  // Check if an issue with similar category or location exists nearby
  checkSimilarity(
    category: IssueCategory,
    locationText: string,
    lat?: number,
    lng?: number
  ): SimilarityCandidate[] {
    const candidates: SimilarityCandidate[] = [];
    const normalizedLoc = locationText.toLowerCase();

    // Check existing reports
    for (const report of cachedReports) {
      if (report.category === category) {
        let isSimilar = false;
        let reason = '';

        if (normalizedLoc.length > 4 && report.location.toLowerCase().includes(normalizedLoc.slice(0, 8))) {
          isSimilar = true;
          reason = `Similar ${category.toLowerCase()} report nearby on ${report.location}`;
        } else if (lat && lng && report.latitude && report.longitude) {
          const dist = calculateDistance(lat, lng, report.latitude, report.longitude);
          if (dist < 400) {
            isSimilar = true;
            reason = `Reported approximately ${Math.round(dist)} meters away in the same category`;
          }
        }

        if (isSimilar) {
          candidates.push({
            id: report.id,
            ticketNumber: report.ticketNumber,
            title: report.title,
            category: report.category,
            location: report.location,
            similarityReason: reason,
            confirmationsCount: report.confirmationsCount,
          });
        }
      }
    }

    // Check nearby community issues
    for (const issue of INITIAL_NEARBY_ISSUES) {
      if (issue.category === category) {
        if (normalizedLoc.length > 4 && issue.approximateLocation.toLowerCase().includes(normalizedLoc.slice(0, 8))) {
          candidates.push({
            id: issue.id,
            ticketNumber: `HYD-${issue.id.toUpperCase()}`,
            title: issue.title,
            category: issue.category,
            location: issue.approximateLocation,
            similarityReason: `Active neighborhood hazard matching category on ${issue.approximateLocation}`,
            confirmationsCount: issue.confirmationsCount,
          });
        }
      }
    }

    return candidates.slice(0, 2);
  },

  /**
   * Non-destructive removal of a specific report (used for demo scenario resets)
   */
  removeReport(id: string): boolean {
    const initialLen = cachedReports.length;
    cachedReports = cachedReports.filter((r) => r.id !== id && (r as any).scenarioId !== id);
    if (cachedReports.length !== initialLen) {
      saveReportsLocally(cachedReports);
      return true;
    }
    return false;
  },

  /**
   * Upsert a report directly into local cache and persistence (used for scenario initialization)
   */
  upsertReport(report: DashboardReport): DashboardReport {
    const existingIndex = cachedReports.findIndex(
      (r) => r.id === report.id || r.ticketNumber === report.ticketNumber
    );
    if (existingIndex >= 0) {
      cachedReports[existingIndex] = { ...cachedReports[existingIndex], ...report };
    } else {
      cachedReports = [report, ...cachedReports];
    }
    saveReportsLocally(cachedReports);
    eventBus.publish('civiceye:report_created', { report });
    return report;
  },

  /**
   * Reset reports state safely: restores initial baseline while preserving unrelated entries
   */
  resetScenarioReports(scenarioId: string): { removed: number; remaining: number } {
    const beforeCount = cachedReports.length;
    cachedReports = cachedReports.filter((r) => (r as any).scenarioId !== scenarioId && r.id !== scenarioId);
    const removed = beforeCount - cachedReports.length;
    if (removed > 0) {
      saveReportsLocally(cachedReports);
    }
    return { removed, remaining: cachedReports.length };
  },
};

// Auto-flush pending queue when internet connection is restored
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('online', () => {
    reportService.flushPendingSyncQueue();
  });
}

function getDepartment(category: IssueCategory): string {
  switch (category) {
    case 'Road damage':
      return 'GHMC Engineering (Roads & Bridges)';
    case 'Water leakage':
    case 'Water Supply':
      return 'HMWSSB (Water Supply & Drainage)';
    case 'Garbage':
      return 'GHMC Solid Waste Management (Sanitation)';
    case 'Streetlights':
    case 'Electrical Hazard':
      return 'GHMC Electrical & Public Lighting';
    case 'Damaged footpaths':
    case 'Accessibility':
      return 'GHMC Town Planning & Sidewalk Maintenance';
    case 'Drainage':
      return 'GHMC Stormwater Drainage Wing';
    case 'Fallen Tree':
      return 'GHMC Urban Biodiversity & Disaster Response';
    default:
      return 'GHMC Municipal Engineering Services';
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
