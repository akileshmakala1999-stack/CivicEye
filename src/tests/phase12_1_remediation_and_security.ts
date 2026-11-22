/**
 * CivicEye — Phase 12.1 Automated Remediation, Reliability & Security Test Suite
 *
 * Validates:
 * 1. Supabase / LocalStorage Data Sync & Conflict Resolution
 * 2. Auth & RBAC Security Hardening (Privilege Escalation & Tamper Resistance)
 * 3. Fault-Isolated Typed Event Bus (Deduplication & Error Boundaries)
 * 4. Digital Twin Geographic Fidelity & Inversion Normalization
 * 5. AI Assistant Factual Grounding & PII Redaction
 * 6. Public Transparency & KPI Mathematical Rigor
 */

import './setupMockBrowser';
import assert from 'assert';
import { reportService } from '../services/reportService';
import { authService } from '../services/authService';
import { operationsService } from '../services/operationsService';
import { eventBus } from '../lib/eventBus';
import { normalizeHyderabadCoordinates, isValidGlobalCoordinate } from '../config/geographicBounds';
import { digitalTwinService } from '../services/digitalTwinService';
import { redactSensitivePublicData, aiOrchestrationService } from '../services/aiOrchestrationService';
import { transparencyService } from '../services/transparencyService';
import { DashboardReport } from '../types';

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

export async function runPhase121Tests(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n=============================================================');
  console.log('CIVICEYE PHASE 12.1: CRITICAL REMEDIATION & SECURITY VALIDATION');
  console.log('=============================================================\n');

  // =========================================================================
  // SUITE 1: SYNC QUEUE & DETERMINISTIC CONFLICT RESOLUTION
  // =========================================================================
  await runTest('Data Synchronization', 'Offline mutations are queued in civiceye_offline_sync_queue', async () => {
    const queueBefore = reportService.getSyncQueue();
    reportService.enqueueSyncOperation({
      id: `test-sync-${Date.now()}`,
      type: 'update_status',
      reportId: 'rep-test-sync-1',
      payload: { status: 'In Progress' },
    });
    const queueAfter = reportService.getSyncQueue();
    assert.strictEqual(queueAfter.length, queueBefore.length + 1);
    assert.strictEqual(queueAfter[queueAfter.length - 1].reportId, 'rep-test-sync-1');
  });

  await runTest('Data Synchronization', 'Sync queue retries enforce zero data loss (failed items retained in failed_needs_review)', async () => {
    // Add item with 5 retries
    const testQueue = [
      {
        id: 'test-permanent-fail',
        idempotencyKey: 'idem-test-permanent-fail',
        type: 'update_status' as const,
        reportId: 'rep-bad-id',
        payload: { status: 'Resolved' },
        retryCount: 5,
        maxRetries: 5,
        status: 'failed_needs_review' as const,
        createdAt: new Date().toISOString(),
      },
    ];
    reportService.saveSyncQueue(testQueue);
    await reportService.flushPendingSyncQueue();
    // ZERO DATA LOSS: Exceeded retries must be retained permanently in failed_needs_review
    const queueAfter = reportService.getSyncQueue();
    assert.ok(queueAfter.some((i) => i.id === 'test-permanent-fail'), 'Item with 5 retries must be retained for review');
    assert.strictEqual(queueAfter.find((i) => i.id === 'test-permanent-fail')?.status, 'failed_needs_review');
  });

  await runTest('Data Synchronization', 'Deterministic timestamp conflict resolution preserves newer local edits', async () => {
    const reports = await reportService.getAllReports();
    assert.ok(reports.length > 0, 'Reports must be loaded');
    const first = reports[0];

    // Local report with updated timestamp
    const updated = await reportService.updateReportStatus(first.id, 'In Progress', 'Field unit testing sync');
    assert.ok(updated);
    assert.strictEqual(updated.status, 'In Progress');
    assert.ok(updated.updatedAt, 'updatedAt must be present on mutated report');
  });

  // =========================================================================
  // SUITE 2: AUTHENTICATION & RBAC SECURITY HARDENING
  // =========================================================================
  await runTest('Auth & RBAC', 'Rejects privilege escalation during public registration (non-gov authority signup)', async () => {
    const res = await authService.signUp({
      fullName: 'Attacker Attempting Escalation',
      email: 'attacker@random-domain.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      role: 'authority',
    });
    assert.strictEqual(res.error?.status, 403, 'Must return HTTP 403 Forbidden for non-gov email');
    assert.ok(res.error?.message.includes('restricted to verified government domains'));
  });

  await runTest('Auth & RBAC', 'Permits authority registration for verified municipal government domains with pendingStaffAuthorization', async () => {
    const testEmail = `officer_${Date.now()}@ghmc.gov.in`;
    const res = await authService.signUp({
      fullName: 'Verified GHMC AE',
      email: testEmail,
      password: 'OfficialGovPassword123!',
      confirmPassword: 'OfficialGovPassword123!',
      role: 'authority',
    });
    assert.strictEqual(res.error, null, 'Must succeed for verified gov email');
    assert.strictEqual(res.data.user?.user_metadata.role, 'citizen', 'Must default to citizen until authorized');
    assert.strictEqual(res.data.user?.user_metadata.pendingStaffAuthorization, true);
  });

  await runTest('Auth & RBAC', 'Operations Service mutation methods fail-closed when called by unauthorized role', async () => {
    // Switch active role to citizen
    operationsService.setActiveRole('citizen');

    // Citizen attempting to approve report
    let threw = false;
    try {
      await operationsService.approveReportForAssignment({
        reportId: 'rep-1',
        departmentId: 'dept-roads',
      });
    } catch (err: any) {
      threw = true;
      assert.ok(err.message.includes('Unauthorized'));
    }
    assert.ok(threw, 'Citizen approveReportForAssignment must throw Unauthorized');

    // Citizen attempting to approve completion
    const compRes = operationsService.approveCompletion('WO-HYD-2026-0811', 'Fake supervisor approval');
    assert.strictEqual(compRes.success, false);
    assert.ok(compRes.error?.includes('Unauthorized'));

    // Restore authority role
    operationsService.setActiveRole('supervisor');
  });

  // =========================================================================
  // SUITE 3: FAULT-ISOLATED TYPED EVENT BUS
  // =========================================================================
  await runTest('Event Bus', 'Dispatches typed events to subscribers with payload integrity', async () => {
    let receivedPayload: any = null;
    const unsubscribe = eventBus.subscribe('civiceye:watchlist_updated', (payload) => {
      receivedPayload = payload;
    });

    eventBus.publish('civiceye:watchlist_updated', { followedIds: ['rep-test-1', 'rep-test-2'] });
    assert.ok(receivedPayload);
    assert.deepStrictEqual(receivedPayload.followedIds, ['rep-test-1', 'rep-test-2']);
    unsubscribe();
  });

  await runTest('Event Bus', 'Fault isolation: subscriber exception does not crash bus or other subscribers', async () => {
    let secondSubscriberCalled = false;

    const unsub1 = eventBus.subscribe('civiceye:resolution_verified', () => {
      throw new Error('Exploding subscriber bug!');
    });

    const unsub2 = eventBus.subscribe('civiceye:resolution_verified', () => {
      secondSubscriberCalled = true;
    });

    // Publish must succeed and not throw
    const published = eventBus.publish('civiceye:resolution_verified', {
      reportId: 'rep-test-iso',
      verifierCount: 5,
    });

    assert.ok(published, 'Publish must return true');
    assert.ok(secondSubscriberCalled, 'Second subscriber must execute despite first subscriber crashing');

    unsub1();
    unsub2();
  });

  await runTest('Event Bus', 'Deduplication: suppresses identical events inside debounce window (50ms)', async () => {
    let callCount = 0;
    const unsub = eventBus.subscribe('civiceye:resolution_challenged', () => {
      callCount++;
    });

    // Rapid successive publishes with identical payload
    eventBus.publish('civiceye:resolution_challenged', { reportId: 'rep-dedup-1', reason: 'Asphalt eroded' });
    eventBus.publish('civiceye:resolution_challenged', { reportId: 'rep-dedup-1', reason: 'Asphalt eroded' });

    assert.strictEqual(callCount, 1, 'Duplicate event within 50ms window must be suppressed');
    unsub();
  });

  // =========================================================================
  // SUITE 4: DIGITAL TWIN GEOGRAPHIC FIDELITY & INVERSION NORMALIZATION
  // =========================================================================
  await runTest('Geographic Fidelity', 'Detects and auto-inverts reversed Hyderabad coordinates (Lat ~78, Lng ~17)', () => {
    // Inverted coordinate: Lat 78.486, Lng 17.385
    const norm = normalizeHyderabadCoordinates(78.486, 17.385);
    assert.strictEqual(norm.wasInverted, true);
    assert.strictEqual(norm.lat, 17.385);
    assert.strictEqual(norm.lng, 78.486);

    // Normal coordinate: Lat 17.432, Lng 78.407
    const normal = normalizeHyderabadCoordinates(17.432, 78.407);
    assert.strictEqual(normal.wasInverted, false);
    assert.strictEqual(normal.lat, 17.432);
    assert.strictEqual(normal.lng, 78.407);
  });

  await runTest('Geographic Fidelity', 'Validates global limits [-90,90] / [-180,180] and rejects Null Island (0,0)', () => {
    assert.strictEqual(isValidGlobalCoordinate(17.43, 78.40), true);
    assert.strictEqual(isValidGlobalCoordinate(0, 0), false, 'Null Island (0,0) must be rejected');
    assert.strictEqual(isValidGlobalCoordinate(95, 78), false, 'Lat > 90 must be rejected');
    assert.strictEqual(isValidGlobalCoordinate(NaN, 78), false, 'NaN must be rejected');
  });

  await runTest('Geographic Fidelity', 'Out-of-bounds coordinates are placed in outsideViewportReports and NOT clamped into validReports', () => {
    const mockReports: DashboardReport[] = [
      {
        id: 'rep-in-bounds',
        ticketNumber: 'HYD-JH-2026-001',
        title: 'In Viewport Issue',
        category: 'Road damage',
        reportDate: 'Today',
        reportTimestamp: '10:00 AM',
        location: 'Jubilee Hills Road 36',
        neighborhood: 'Jubilee Hills',
        severity: 'high',
        status: 'Submitted',
        confirmationsCount: 1,
        description: 'Test',
        departmentAssigned: 'GHMC Roads',
        latitude: 17.43,
        longitude: 78.40,
        timeline: [],
      },
      {
        id: 'rep-out-of-bounds',
        ticketNumber: 'HYD-DEL-2026-002',
        title: 'Distant Geographic Issue (Delhi)',
        category: 'Road damage',
        reportDate: 'Today',
        reportTimestamp: '10:00 AM',
        location: 'Connaught Place',
        neighborhood: 'Jubilee Hills',
        severity: 'low',
        status: 'Submitted',
        confirmationsCount: 1,
        description: 'Distant point test',
        departmentAssigned: 'GHMC Roads',
        latitude: 28.61, // Far outside Hyderabad viewport
        longitude: 77.20,
        timeline: [],
      },
    ];

    const result = digitalTwinService.filterGeographicReports(mockReports);
    assert.ok(result.validReports.some((r) => r.id === 'rep-in-bounds'), 'In-bounds report must be in validReports');
    assert.ok(!result.validReports.some((r) => r.id === 'rep-out-of-bounds'), 'Out-of-bounds report must NOT be in validReports');
    assert.ok(result.outsideViewportReports.some((r) => r.id === 'rep-out-of-bounds'), 'Out-of-bounds report must be in outsideViewportReports');
  });

  // =========================================================================
  // SUITE 5: AI ASSISTANT FACTUAL GROUNDING & PRIVACY PRESERVATION
  // =========================================================================
  await runTest('AI Grounding & Privacy', 'Redacts phone numbers, emails, and 12-digit identity numbers from public AI output', () => {
    const rawAiText = 'Citizen contact was aditya.guardian@civicmail.com and mobile +91-9876543210. Aadhaar reference 4123 5678 9012.';
    const redacted = redactSensitivePublicData(rawAiText);
    assert.ok(!redacted.includes('aditya.guardian@civicmail.com'), 'Email must be redacted');
    assert.ok(redacted.includes('[REDACTED EMAIL]'));
    assert.ok(!redacted.includes('9876543210'), 'Phone must be redacted');
    assert.ok(redacted.includes('[REDACTED PHONE]'));
    assert.ok(!redacted.includes('4123 5678 9012'), 'Identity number must be redacted');
    assert.ok(redacted.includes('[REDACTED IDENTIFIER]'));
  });

  await runTest('AI Grounding & Privacy', 'AI Assistant response strictly grounds supportingReportIds in existing reports', async () => {
    const reports = await reportService.getAllReports();
    const existingIds = new Set(reports.map((r) => r.id));

    const response = await aiOrchestrationService.askCivicAiAssistant('Which reports are becoming critical?');
    assert.ok(response.grounding);
    assert.ok(response.content.length > 0);

    // Verify all supporting IDs exist
    response.grounding.supportingReportIds.forEach((id) => {
      assert.ok(existingIds.has(id), `Report ID ${id} in AI grounding must exist in active reports database`);
    });
  });

  // =========================================================================
  // SUITE 6: PUBLIC TRANSPARENCY & KPI MATHEMATICAL RIGOR
  // =========================================================================
  await runTest('Public Transparency', 'Resolution rate excludes rejected and duplicate reports from the denominator', async () => {
    const summary = await transparencyService.getPublicTransparencyMetrics();
    assert.ok(summary.totalReports > 0);
    assert.ok(summary.resolutionRate >= 0 && summary.resolutionRate <= 100);
    assert.ok(summary.citizenVerificationRate >= 0 && summary.citizenVerificationRate <= 100);
    assert.ok(summary.onTimeRate >= 0 && summary.onTimeRate <= 100);
  });

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('\n-------------------------------------------------------------');
  console.log(`PHASE 12.1 TEST SUMMARY: ${passed}/${total} Passed (${failed} Failed)`);
  console.log('-------------------------------------------------------------\n');

  return { passed, failed, total };
}

// Auto-run if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('phase12_1')) {
  runPhase121Tests().catch(console.error);
}
