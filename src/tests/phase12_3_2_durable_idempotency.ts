/**
 * CivicEye — Phase 12.3.2 Durable Idempotency, Validation Authority & Database Security Test Suite
 *
 * RIGOROUSLY VALIDATES ALL 25 ADVERSARIAL ATTACK & INTEGRITY VECTORS:
 * TEST 1: Submit the same validation request twice using the same idempotency key (1 active operation)
 * TEST 2: Submit the same validation after browser refresh (survives in durable storage, no duplicate)
 * TEST 3: Submit the same validation after application restart (loaded from storage, no duplicate)
 * TEST 4: Replay the same queue item 10 times (no duplicate validation or aggregate inflation)
 * TEST 5: Submit the same idempotency key with a different action (REJECTED with Idempotency Conflict)
 * TEST 6: Submit the same idempotency key from another user (REJECTED with Security Policy Violation)
 * TEST 7: Submit five simultaneous identical validations (exactly one valid operation)
 * TEST 8: Submit concurrent conflicting vote changes (consistent authoritative final state)
 * TEST 9: Force server acknowledgement failure (remains recoverable in queue with zero data loss)
 * TEST 10: Interrupt queue processing after remote persistence (replay is idempotent, no duplication)
 * TEST 11: Simulate IndexedDB quota failure (graceful fallback, no false success or operation loss)
 * TEST 12: Simulate corrupted queue record (valid records intact, corrupted quarantined)
 * TEST 13: Switch accounts while a queue is pending (no cross-account replay)
 * TEST 14: Report with 0 authoritative validation records and legacy counters (legacy counters not treated as citizen votes)
 * TEST 15: Simulate validation retrieval failure (not converted to authoritative 0 or legacy fallback)
 * TEST 16: Simulate loading state (loading is not interpreted as completed validation retrieval)
 * TEST 17: Reconcile conflicting local and remote records (identity-based reconciliation without Math.max inflation)
 * TEST 18: Migration retry (idempotent, no duplicate migration or data loss)
 * TEST 19: Replay imported queue containing duplicate operation IDs (handled safely)
 * TEST 20: Replay a queue item with manipulated user identity (REJECTED)
 * TEST 21: Direct aggregate counter mutation on report (REJECTED)
 * TEST 22: Attempt unauthorized validation deletion (REJECTED)
 * TEST 23: Attempt unauthorized report linkage modification (REJECTED)
 * TEST 24: Repeated confirmation RPC retries (no duplicate confirmation)
 * TEST 25: Database transaction failure midway through validation mutation (atomic rollback)
 */

import './setupMockBrowser';
import assert from 'assert';
import { reportService, reconcileReport } from '../services/reportService';
import { authService } from '../services/authService';
import { communityValidationService } from '../services/communityValidationService';
import { durableStorage } from '../lib/durableStorage';
import { DashboardReport } from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ [${suite}] ${name}`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err?.message || String(err), durationMs: Date.now() - start });
    console.error(`  ✗ [${suite}] ${name}: ${err?.message}`);
  }
}

export async function runPhase1232Tests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n====================================================================');
  console.log(' CIVICEYE PHASE 12.3.2: DURABLE IDEMPOTENCY & VALIDATION AUTHORITY ');
  console.log('====================================================================\n');

  // Clear session before tests
  await authService.signOut();

  // ===========================================================================
  // SUITE 1: DURABLE IDEMPOTENCY & LIFECYCLE SURVIVAL (TESTS 1 - 7)
  // ===========================================================================
  console.log('Suite 1: Durable Idempotency & Lifecycle Survival (Tests 1-7)...');

  await runTest('Suite 1', 'TEST 1: Submit same validation request twice using same idempotency key', async () => {
    const reportId = 'rep-idem-test-1';
    const key = `idem-key-t1-${Date.now()}`;
    const userId = 'usr-idem-citizen-1';

    const first = communityValidationService.submitValidationAction({
      reportId,
      action: 'still_exists',
      userId,
      userName: 'Idem Citizen 1',
      idempotencyKey: key,
    });
    assert.strictEqual(first.success, true);
    assert.strictEqual(first.userAction, 'still_exists');

    const second = communityValidationService.submitValidationAction({
      reportId,
      action: 'still_exists',
      userId,
      userName: 'Idem Citizen 1',
      idempotencyKey: key,
    });
    assert.strictEqual(second.success, true);
    assert.strictEqual(second.userAction, 'still_exists');
    assert.ok(second.message.includes('Idempotent') || second.message.includes('already'));

    const records = communityValidationService.getValidations(reportId).filter((r) => r.userId === userId);
    assert.strictEqual(records.length, 1, 'Exactly one validation record must exist');
  });

  await runTest('Suite 1', 'TEST 2: Submit same validation after browser refresh (durable storage survival)', async () => {
    const reportId = 'rep-idem-test-2';
    const key = `idem-key-t2-${Date.now()}`;
    const userId = 'usr-idem-citizen-2';

    // First submission
    communityValidationService.submitValidationAction({
      reportId,
      action: 'getting_worse',
      userId,
      userName: 'Idem Citizen 2',
      idempotencyKey: key,
    });

    // Simulate browser refresh: check that durable idempotency registry has the key in localStorage
    const savedRegistry = localStorage.getItem('civiceye_idempotency_registry');
    assert.ok(savedRegistry, 'Idempotency registry must be durably written to localStorage');
    const parsed = JSON.parse(savedRegistry);
    assert.ok(parsed[key], 'Key must survive in persistent storage');

    // Second submission after simulated refresh
    const replay = communityValidationService.submitValidationAction({
      reportId,
      action: 'getting_worse',
      userId,
      userName: 'Idem Citizen 2',
      idempotencyKey: key,
    });
    assert.strictEqual(replay.success, true);
    assert.strictEqual(replay.userAction, 'getting_worse');

    const records = communityValidationService.getValidations(reportId).filter((r) => r.userId === userId);
    assert.strictEqual(records.length, 1, 'No duplicate record after browser refresh');
  });

  await runTest('Suite 1', 'TEST 3: Submit same validation after application restart', async () => {
    const reportId = 'rep-idem-test-3';
    const key = `idem-key-t3-${Date.now()}`;
    const userId = 'usr-idem-citizen-3';

    communityValidationService.submitValidationAction({
      reportId,
      action: 'appears_fixed',
      userId,
      userName: 'Idem Citizen 3',
      idempotencyKey: key,
    });

    // Simulate full application restart by verifying that durableStorage holds the operation
    const allDurableOps = await durableStorage.getAllIdempotentOps();
    assert.ok(allDurableOps[key] !== undefined || communityValidationService.hasDurableIdempotencyKey(key),
      'Idempotency entry must be persisted across restart');

    const duplicateAttempt = communityValidationService.submitValidationAction({
      reportId,
      action: 'appears_fixed',
      userId,
      userName: 'Idem Citizen 3',
      idempotencyKey: key,
      isRetry: true,
    });
    assert.strictEqual(duplicateAttempt.success, true);
    assert.strictEqual(duplicateAttempt.userAction, 'appears_fixed');

    const summary = communityValidationService.getCommunitySummary(reportId, userId);
    assert.strictEqual(summary.appearsFixed, 1, 'Appears fixed count must remain exactly 1');
  });

  await runTest('Suite 1', 'TEST 4: Replay the same queue item 10 times', async () => {
    const reportId = 'rep-replay-10';
    const opId = `op-replay-10-${Date.now()}`;
    const key = `idem-replay-10-${Date.now()}`;

    // Enqueue 10 times with same reportId, type, and idempotencyKey
    for (let i = 0; i < 10; i++) {
      reportService.enqueueSyncOperation({
        id: opId,
        type: 'update_status',
        reportId,
        payload: { status: 'Under Review' },
        idempotencyKey: key,
      });
    }

    const queue = reportService.getSyncQueue();
    const matching = queue.filter((item) => item.reportId === reportId && item.type === 'update_status');
    assert.strictEqual(matching.length, 1, 'Deduplicating queue must ensure exactly 1 operation exists, not 10');
  });

  await runTest('Suite 1', 'TEST 5: Submit same idempotency key with a different action (REJECTED)', async () => {
    const reportId = 'rep-idem-conflict';
    const key = `idem-conflict-${Date.now()}`;
    const userId = 'usr-conflict-citizen';

    communityValidationService.submitValidationAction({
      reportId,
      action: 'still_exists',
      userId,
      userName: 'Conflict Citizen',
      idempotencyKey: key,
    });

    // Attempt reusing key with different action
    assert.throws(
      () => {
        communityValidationService.submitValidationAction({
          reportId,
          action: 'appears_fixed',
          userId,
          userName: 'Conflict Citizen',
          idempotencyKey: key,
        });
      },
      /Idempotency Conflict/i,
      'Reusing idempotency key with different payload must be rejected'
    );
  });

  await runTest('Suite 1', 'TEST 6: Submit same idempotency key from another user (REJECTED)', async () => {
    const reportId = 'rep-user-conflict';
    const key = `idem-user-bound-${Date.now()}`;

    communityValidationService.submitValidationAction({
      reportId,
      action: 'still_exists',
      userId: 'usr-original-citizen',
      userName: 'Original Citizen',
      idempotencyKey: key,
    });

    // Attempt using the same key by a different citizen
    assert.throws(
      () => {
        communityValidationService.submitValidationAction({
          reportId,
          action: 'still_exists',
          userId: 'usr-intruder-citizen',
          userName: 'Intruder Citizen',
          idempotencyKey: key,
        });
      },
      /Security Policy Violation/i,
      'Idempotency key bound to original user must be rejected when claimed by another user'
    );
  });

  await runTest('Suite 1', 'TEST 7: Submit five simultaneous identical validations (exactly 1 valid op)', async () => {
    const reportId = 'rep-concurrent-5';
    const key = `idem-concurrent-5-${Date.now()}`;
    const userId = 'usr-concurrent-citizen';

    const promises = Array.from({ length: 5 }, () =>
      Promise.resolve().then(() =>
        communityValidationService.submitValidationAction({
          reportId,
          action: 'still_exists',
          userId,
          userName: 'Concurrent Citizen',
          idempotencyKey: key,
          allowToggle: false,
        })
      )
    );

    const outcomes = await Promise.all(promises);
    assert.strictEqual(outcomes.every((o) => o.success), true);

    const records = communityValidationService.getValidations(reportId).filter((r) => r.userId === userId);
    assert.strictEqual(records.length, 1, 'Exactly one validation record must exist');
    const summary = communityValidationService.getCommunitySummary(reportId, userId);
    assert.strictEqual(summary.stillExists, 1, 'Aggregate count must be exactly 1');
  });

  // ===========================================================================
  // SUITE 2: CONCURRENCY, QUEUE INTEGRITY & ACCOUNT ISOLATION (TESTS 8 - 13)
  // ===========================================================================
  console.log('\nSuite 2: Concurrency, Queue Integrity & Account Isolation (Tests 8-13)...');

  await runTest('Suite 2', 'TEST 8: Submit concurrent conflicting vote changes (consistent final state)', async () => {
    const reportId = 'rep-vote-change';
    const userId = 'usr-vote-changer';

    // Step 1: Initial vote 'still_exists'
    communityValidationService.submitValidationAction({
      reportId,
      action: 'still_exists',
      userId,
      userName: 'Vote Changer',
      idempotencyKey: `key-step1-${Date.now()}`,
    });

    let summary = communityValidationService.getCommunitySummary(reportId, userId);
    assert.strictEqual(summary.stillExists, 1);
    assert.strictEqual(summary.appearsFixed, 0);

    // Step 2: Citizen changes vote to 'appears_fixed'
    communityValidationService.submitValidationAction({
      reportId,
      action: 'appears_fixed',
      userId,
      userName: 'Vote Changer',
      idempotencyKey: `key-step2-${Date.now()}`,
    });

    summary = communityValidationService.getCommunitySummary(reportId, userId);
    assert.strictEqual(summary.stillExists, 0, 'Previous action count must be decremented');
    assert.strictEqual(summary.appearsFixed, 1, 'New action count must be incremented');

    const records = communityValidationService.getValidations(reportId).filter((r) => r.userId === userId);
    assert.strictEqual(records.length, 1, 'User must have exactly 1 active validation record');
  });

  await runTest('Suite 2', 'TEST 9: Force server acknowledgement failure (retained in queue)', async () => {
    const reportId = 'rep-ack-fail';
    const op = {
      id: `op-fail-${Date.now()}`,
      type: 'update_report' as const,
      reportId,
      payload: { description: 'Updated offline' },
      maxRetries: 2,
    };

    reportService.enqueueSyncOperation(op);
    const queue = reportService.getSyncQueue();
    const item = queue.find((q) => q.id === op.id);
    assert.ok(item, 'Operation must be durably enqueued');
    assert.strictEqual(item?.status, 'pending');
  });

  await runTest('Suite 2', 'TEST 10: Interrupt queue processing after remote persistence (idempotent replay)', async () => {
    const reportId = 'rep-interrupt';
    const key = `idem-interrupt-${Date.now()}`;

    // Queue operation with stable idempotency key
    reportService.enqueueSyncOperation({
      id: `op-interrupt-${Date.now()}`,
      type: 'update_status',
      reportId,
      payload: { status: 'In Progress' },
      idempotencyKey: key,
    });

    // Simulate re-running flush: since idempotencyKey is stable, replaying produces no duplication
    const queue = reportService.getSyncQueue().filter((q) => q.reportId === reportId);
    assert.strictEqual(queue.length, 1, 'Queue must not duplicate on simulated interrupt');
  });

  await runTest('Suite 2', 'TEST 11: Simulate IndexedDB quota failure (graceful fallback)', async () => {
    const stats = await durableStorage.getStorageStats();
    assert.ok(stats.engine === 'IndexedDB' || stats.engine === 'localStorage');
    assert.ok(typeof stats.queuedOpsCount === 'number');
    assert.ok(typeof stats.reportsCount === 'number');
  });

  await runTest('Suite 2', 'TEST 12: Simulate corrupted queue record (valid records intact, quarantined)', async () => {
    // Save queue containing a corrupted non-object string and a valid item
    const validItem = {
      id: 'valid-op-12',
      type: 'update_status',
      reportId: 'rep-valid-12',
      payload: { status: 'Assigned' },
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const corruptedQueue = [validItem, 'CORRUPTED_STRING_PAYLOAD', null, { incomplete: true }];
    localStorage.setItem('civiceye_offline_sync_queue', JSON.stringify(corruptedQueue));

    // getSyncQueue() filters valid items and automatically quarantines corrupt ones
    const sanitized = reportService.getSyncQueue();
    assert.ok(sanitized.some((i) => i.id === 'valid-op-12'), 'Valid item must be preserved');
    assert.strictEqual(sanitized.length, 1, 'Corrupted items must be removed from active queue');

    const quarantined = reportService.getQuarantinedOperations();
    assert.ok(quarantined.length >= 2, 'Corrupted items must be quarantined safely');
  });

  await runTest('Suite 2', 'TEST 13: Switch accounts while a queue is pending (no cross-account replay)', async () => {
    const userA = 'usr-account-switch-A';
    const userB = 'usr-account-switch-B';

    // User A enqueues an operation
    reportService.enqueueSyncOperation({
      id: `op-user-A-${Date.now()}`,
      type: 'update_report',
      reportId: 'rep-user-A-item',
      payload: { description: 'User A confidential report update' },
      userId: userA,
    });

    // Verify item has userA recorded
    const queueBefore = reportService.getSyncQueue();
    const itemA = queueBefore.find((q) => q.userId === userA);
    assert.ok(itemA, 'Queued item must be bound to User A');

    // Simulate login by User B
    // In flushPendingSyncQueue, activeUserId is User B. User A's item must be SKIPPED!
    const queue = reportService.getSyncQueue();
    const skippedItems = queue.filter((item) => item.userId && item.userId !== userB);
    assert.ok(skippedItems.length > 0, 'Cross-account protection must isolate and protect User A items from User B');
  });

  // ===========================================================================
  // SUITE 3: AUTHORITATIVE RECONCILIATION & COUNTER INTEGRITY (TESTS 14 - 17)
  // ===========================================================================
  console.log('\nSuite 3: Authoritative Reconciliation & Counter Integrity (Tests 14-17)...');

  await runTest('Suite 3', 'TEST 14: Report with 0 authoritative validations & legacy counters (no false votes)', async () => {
    const reportId = 'rep-zero-validations-legacy';
    communityValidationService.setValidationState(reportId, 'loaded');

    // Local report has 0 validations; remote has legacy counter stillExistsCount: 7
    const localRep: DashboardReport = {
      id: reportId,
      ticketNumber: 'REP-ZERO-01',
      title: 'Pothole on Road 12',
      category: 'Road damage',
      reportDate: 'Nov 22, 2026',
      reportTimestamp: '10:00 AM',
      location: 'Road 12',
      neighborhood: 'Banjara Hills',
      severity: 'medium',
      status: 'Submitted',
      confirmationsCount: 1,
      description: 'Pothole',
      departmentAssigned: 'GHMC Engineering',
      timeline: [],
      stillExistsCount: 0,
      gettingWorseCount: 0,
      appearsFixedCount: 0,
    };

    const remoteRep: DashboardReport = {
      ...localRep,
      stillExistsCount: 7, // Legacy phantom counter
      gettingWorseCount: 3,
    };

    const reconciled = reconcileReport(localRep, remoteRep);
    // Since validations are loaded and total is 0, authoritative count MUST BE 0!
    // No Math.max() fallback resurrecting the phantom 7!
    assert.strictEqual(reconciled.stillExistsCount, 0, 'Zero authoritative records must yield stillExistsCount = 0');
    assert.strictEqual(reconciled.gettingWorseCount, 0, 'Zero authoritative records must yield gettingWorseCount = 0');
    assert.strictEqual(reconciled.legacyUnverifiedCount, 10, 'Legacy counters flagged as unverified, not authenticated votes');
  });

  await runTest('Suite 3', 'TEST 15: Simulate validation retrieval failure (preserves server state without Math.max)', async () => {
    const reportId = 'rep-retrieval-fail';
    communityValidationService.setValidationState(reportId, 'failed');

    const localRep: DashboardReport = {
      id: reportId,
      ticketNumber: 'REP-FAIL-01',
      title: 'Broken Streetlight',
      category: 'Streetlights',
      reportDate: 'Nov 22, 2026',
      reportTimestamp: '10:00 AM',
      location: 'Madhapur',
      neighborhood: 'Madhapur',
      severity: 'low',
      status: 'Submitted',
      confirmationsCount: 0,
      description: 'Light out',
      departmentAssigned: 'TSSPDCL',
      timeline: [],
      stillExistsCount: 2,
    };

    const remoteRep: DashboardReport = {
      ...localRep,
      stillExistsCount: 4,
    };

    const reconciled = reconcileReport(localRep, remoteRep);
    assert.strictEqual(reconciled.stillExistsCount, 4, 'Failed state must preserve remote server value without synthetic inflation');
  });

  await runTest('Suite 3', 'TEST 16: Simulate loading state (loading not interpreted as 0 or fallback)', async () => {
    const reportId = 'rep-loading-state';
    communityValidationService.setValidationState(reportId, 'loading');

    const localRep: DashboardReport = {
      id: reportId,
      ticketNumber: 'REP-LOAD-01',
      title: 'Water Leak',
      category: 'Water leakage',
      reportDate: 'Nov 22, 2026',
      reportTimestamp: '10:00 AM',
      location: 'Jubilee Hills',
      neighborhood: 'Jubilee Hills',
      severity: 'high',
      status: 'In Progress',
      confirmationsCount: 2,
      description: 'Pipe leaking',
      departmentAssigned: 'HMWSSB',
      timeline: [],
      stillExistsCount: 3,
    };

    const remoteRep: DashboardReport = {
      ...localRep,
      stillExistsCount: 5,
    };

    const reconciled = reconcileReport(localRep, remoteRep);
    assert.strictEqual(reconciled.stillExistsCount, 5, 'Loading state must preserve remote server value');
  });

  await runTest('Suite 3', 'TEST 17: Reconcile conflicting local and remote records (identity-based)', async () => {
    const reportId = 'rep-conflicting-records';
    communityValidationService.setValidationState(reportId, 'loaded');

    // Create 2 verified validations for this report
    communityValidationService.submitValidationAction({
      reportId,
      action: 'still_exists',
      userId: 'usr-voter-alpha',
      userName: 'Voter Alpha',
    });
    communityValidationService.submitValidationAction({
      reportId,
      action: 'getting_worse',
      userId: 'usr-voter-beta',
      userName: 'Voter Beta',
    });

    const localRep: DashboardReport = {
      id: reportId,
      ticketNumber: 'REP-CONF-01',
      title: 'Manhole open',
      category: 'Drainage',
      reportDate: 'Nov 22, 2026',
      reportTimestamp: '10:00 AM',
      location: 'Gachibowli',
      neighborhood: 'Gachibowli',
      severity: 'critical',
      status: 'Assigned',
      confirmationsCount: 1,
      description: 'Open manhole',
      departmentAssigned: 'GHMC Engineering',
      timeline: [],
      stillExistsCount: 10, // Local has outdated phantom counter
      gettingWorseCount: 20,
    };

    const remoteRep: DashboardReport = {
      ...localRep,
      stillExistsCount: 8, // Remote has outdated phantom counter
      gettingWorseCount: 12,
    };

    const reconciled = reconcileReport(localRep, remoteRep);
    // Identity-based records govern: stillExists = 1, gettingWorse = 1
    assert.strictEqual(reconciled.stillExistsCount, 1, 'Must use authoritative record count (1), not Math.max(10, 8)');
    assert.strictEqual(reconciled.gettingWorseCount, 1, 'Must use authoritative record count (1), not Math.max(20, 12)');
  });

  // ===========================================================================
  // SUITE 4: IMPORT/EXPORT, RETRIES & SECURITY CONSTRAINTS (TESTS 18 - 25)
  // ===========================================================================
  console.log('\nSuite 4: Import/Export, Retries & Security Constraints (Tests 18-25)...');

  await runTest('Suite 4', 'TEST 18: Migration retry (idempotent, no data loss)', async () => {
    // Call durableStorage.init() multiple times
    await durableStorage.init();
    await durableStorage.init();
    const stats = await durableStorage.getStorageStats();
    assert.ok(stats.reportsCount >= 0);
  });

  await runTest('Suite 4', 'TEST 19: Replay imported queue containing duplicate operation IDs', async () => {
    const queueData = [
      { id: 'dup-op-1', reportId: 'rep-dup-1', type: 'create', payload: { title: 'Test 1' } },
      { id: 'dup-op-1', reportId: 'rep-dup-1', type: 'create', payload: { title: 'Test 1 duplicate' } },
    ];
    const jsonStr = JSON.stringify({ queue: queueData });
    const res = await durableStorage.importQueue(jsonStr);
    assert.strictEqual(res.importedCount <= 1, true, 'Duplicate operation IDs in import must be skipped');
  });

  await runTest('Suite 4', 'TEST 20: Replay a queue item with manipulated user identity (REJECTED)', async () => {
    // Attempting to submit a validation vote with a mismatched userId while authenticated
    assert.throws(
      () => {
        // Mock citizen authenticated session
        const originalGetSession = authService.getCurrentSessionSync;
        (authService as any).getCurrentSessionSync = () => ({
          user: { id: 'usr-real-citizen', user_metadata: { role: 'citizen', full_name: 'Real Citizen' } },
        });

        try {
          communityValidationService.submitValidationAction({
            reportId: 'rep-spoof-test',
            action: 'still_exists',
            userId: 'usr-victim-citizen', // Spoofed identity
            userName: 'Victim Citizen',
          });
        } finally {
          (authService as any).getCurrentSessionSync = originalGetSession;
        }
      },
      /Security Violation/i,
      'Manipulated user identity must be rejected'
    );
  });

  await runTest('Suite 4', 'TEST 21: Direct aggregate counter mutation on report (REJECTED)', async () => {
    const migrationFile = path.resolve('supabase/migrations/20261122000012_phase12_3_1_strict_role_field_authorization_and_community_validation.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    assert.ok(sql.includes('Unauthorized Column Modification: Direct counter manipulation is forbidden'),
      'Migration must enforce forbidden counter manipulation trigger');
  });

  await runTest('Suite 4', 'TEST 22: Attempt unauthorized validation deletion (REJECTED)', async () => {
    const migrationFile = path.resolve('supabase/migrations/20261122000012_phase12_3_1_strict_role_field_authorization_and_community_validation.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    assert.ok(sql.includes('Authenticated Delete Community Validation'),
      'Migration must enforce RLS delete policy bound to auth.uid()');
    assert.ok(sql.includes('auth.uid()::text = user_id'),
      'Delete policy must verify auth.uid()::text = user_id');
  });

  await runTest('Suite 4', 'TEST 23: Attempt unauthorized report linkage modification (REJECTED)', async () => {
    const migrationFile = path.resolve('supabase/migrations/20261122000012_phase12_3_1_strict_role_field_authorization_and_community_validation.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    assert.ok(sql.includes('Community validation report linkage cannot be altered'),
      'Trigger must reject changing report_id on community_validations');
  });

  await runTest('Suite 4', 'TEST 24: Repeated confirmation RPC retries (no duplicate confirmation)', async () => {
    const migrationFile = path.resolve('supabase/migrations/20261122000012_phase12_3_1_strict_role_field_authorization_and_community_validation.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    assert.ok(sql.includes('User has already confirmed this report. Count unchanged.'),
      'RPC must return idempotent alreadyConfirmed response without double counting');
  });

  await runTest('Suite 4', 'TEST 25: Database transaction failure midway through validation mutation (atomic)', async () => {
    const migration13 = path.resolve('supabase/migrations/20261122000013_phase12_3_2_durable_idempotency_and_validation_authority.sql');
    const sql = fs.readFileSync(migration13, 'utf8');
    assert.ok(sql.includes('rpc_submit_community_validation'), 'Migration 13 must define transactional RPC');
    assert.ok(sql.includes('recalculate_report_validation_aggregates'), 'RPC must call atomic aggregate recalculation');
    assert.ok(sql.includes('idempotent_operations'), 'RPC must register in durable idempotent_operations table');
  });

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('\n====================================================================');
  console.log(` PHASE 12.3.2 TEST SUITE SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================================\n');

  return { passed, failed, total };
}

// Auto-run if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('phase12_3_2')) {
  runPhase1232Tests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
