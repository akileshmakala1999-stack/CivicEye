/**
 * CivicEye — Resilient, Typed, Fault-Isolated Event Bus
 * Phase 12.1 / Remediation 4 Implementation
 *
 * Provides typed inter-module communication with:
 * 1. Subscriber error boundaries (failures in one subscriber cannot crash other subscribers or publisher)
 * 2. Event payload validation
 * 3. Event deduplication and loop detection (50ms debounce for identical event signatures)
 * 4. Backward-compatible bridge to window CustomEvents
 */

import { DashboardReport, WorkOrder, DashboardReportStatus, IssueSeverity } from '../types';

export interface CivicEyeEventMap {
  'civiceye:report_created': { report: DashboardReport };
  'civiceye:report_updated': { reportId: string; status?: DashboardReportStatus; severity?: IssueSeverity; report?: DashboardReport };
  'civiceye:work_order_updated': { workOrder: WorkOrder };
  'civiceye:resolution_challenged': { reportId: string; reason: string };
  'civiceye:resolution_verified': { reportId: string; verifierCount: number };
  'civiceye:sync_flushed': { syncedCount: number; pendingCount: number };
  'civiceye:watchlist_updated': { followedIds: string[] };
  'civiceye:notification': { id: string; title: string; message: string; [key: string]: unknown };
}

export type CivicEyeEventType = keyof CivicEyeEventMap;
export type CivicEyeEventHandler<T extends CivicEyeEventType> = (payload: CivicEyeEventMap[T]) => void;

interface EventRecord {
  signature: string;
  timestamp: number;
}

class ResilientEventBus {
  private subscribers: Map<string, Set<Function>> = new Map();
  private recentEvents: EventRecord[] = [];
  private deduplicationWindowMs = 50;

  constructor() {
    // Forward legacy CustomEvents to the typed bus if running in browser
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('civiceye_reports_updated', (e: Event) => {
        const customEvt = e as CustomEvent;
        this.publish('civiceye:report_updated', {
          reportId: 'all',
          report: customEvt.detail?.[0],
        });
      });

      window.addEventListener('civiceye_watchlist_updated', (e: Event) => {
        const customEvt = e as CustomEvent;
        this.publish('civiceye:watchlist_updated', {
          followedIds: customEvt.detail || [],
        });
      });
    }
  }

  /**
   * Subscribe to a typed event with automatic error isolation.
   * Returns an unsubscribe function.
   */
  public subscribe<T extends CivicEyeEventType>(
    eventType: T,
    handler: CivicEyeEventHandler<T>
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    const handlers = this.subscribers.get(eventType)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Publish a typed event to all active subscribers.
   * Enforces deduplication and subscriber error boundaries.
   */
  public publish<T extends CivicEyeEventType>(eventType: T, payload: CivicEyeEventMap[T]): boolean {
    if (!payload || typeof payload !== 'object') {
      console.warn(`[EventBus] Invalid event payload for ${eventType}`);
      return false;
    }

    // Deduplication check: compute lightweight event signature
    const signature = `${eventType}:${JSON.stringify(payload)}`;
    const now = Date.now();
    this.cleanRecentEvents(now);

    const isDuplicate = this.recentEvents.some(
      (e) => e.signature === signature && now - e.timestamp < this.deduplicationWindowMs
    );

    if (isDuplicate) {
      // Deduplicated within window to prevent cascading loops
      return false;
    }

    this.recentEvents.push({ signature, timestamp: now });

    // Also dispatch to DOM window if available for components listening via CustomEvents
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      try {
        window.dispatchEvent(new CustomEvent(eventType, { detail: payload }));
      } catch (domErr) {
        console.warn(`[EventBus] DOM CustomEvent dispatch failed for ${eventType}:`, domErr);
      }
    }

    // Notify registered subscribers with strict try/catch isolation
    const handlers = this.subscribers.get(eventType);
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (subErr) {
          // Fault isolation: one subscriber throwing an error must NOT crash others or the publisher
          console.error(`[EventBus] Subscriber failed on event "${eventType}":`, subErr);
        }
      });
    }

    return true;
  }

  /**
   * Cleans expired events outside deduplication window
   */
  private cleanRecentEvents(now: number): void {
    if (this.recentEvents.length > 50) {
      this.recentEvents = this.recentEvents.filter(
        (e) => now - e.timestamp < this.deduplicationWindowMs * 2
      );
    }
  }

  /**
   * Clear all subscribers (useful for test resets)
   */
  public clearAll(): void {
    this.subscribers.clear();
    this.recentEvents = [];
  }

  public getSubscriberCount(eventType: CivicEyeEventType): number {
    return this.subscribers.get(eventType)?.size || 0;
  }
}

export const eventBus = new ResilientEventBus();
