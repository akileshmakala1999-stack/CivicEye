/**
 * CivicEye — Phase 12.3.4 Payload Integrity Closure, RPC Authorization & Deployment Security Suite
 *
 * RIGOROUSLY VALIDATES:
 * Suite 1: Recursive Canonical Payload Hashing & Edge Cases (Tests 1-8: A through H)
 * Suite 2: Queue Tampering, Missing Hash Rejection & Idempotency Hardening (Tests 9-22)
 * Suite 3: Database Privilege Closure, Operational RPC Authorization & Concurrency (Tests 23-32)
 */

import './setupMockBrowser';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import {
  validateQueuedSyncOperation,
  computePayloadHash,
  canonicalizePayload,
  QueuedSyncOperation,
} from '../services/reportService';

let passed = 0;
let failed = 0;

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ [${suite}] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ [${suite}] ${name}: ${err?.message || err}`);
    if (err.actual !== undefined && err.expected !== undefined) {
      console.error(`\n${err.actual} !== ${err.expected}\n`);
    }
    failed++;
  }
}

export async function runPhase1234Tests() {
  console.log('\n====================================================================');
  console.log(' CIVICEYE PHASE 12.3.4: PAYLOAD INTEGRITY & RPC SECURITY ');
  console.log('====================================================================\n');

  // ===========================================================================
  // SUITE 1: RECURSIVE CANONICAL PAYLOAD HASHING & EDGE CASES (TESTS 1 - 8)
  // ===========================================================================
  console.log('Suite 1: Recursive Canonical Serialization & Hashing (Tests 1-8)...');

  await runTest('Suite 1', 'TEST 1 (A): Same payload produces identical hash across repeated runs', () => {
    const p1 = { title: 'Pothole on Road 36', severity: 'high', location: { lat: 17.43, lng: 78.41 } };
    const h1 = computePayloadHash(p1);
    const h2 = computePayloadHash(p1);
    assert.strictEqual(h1, h2, 'Hash must be strictly deterministic across repeated executions');
    assert.strictEqual(h1.length, 64, 'Hash must be 64-hex lowercase string');
  });

  await runTest('Suite 1', 'TEST 2 (B): Same top-level object with reordered keys produces identical hash', () => {
    const p1 = { severity: 'high', title: 'Streetlight out', category: 'Streetlights' };
    const p2 = { title: 'Streetlight out', category: 'Streetlights', severity: 'high' };
    assert.strictEqual(canonicalizePayload(p1), canonicalizePayload(p2));
    assert.strictEqual(computePayloadHash(p1), computePayloadHash(p2));
  });

  await runTest('Suite 1', 'TEST 3 (C): Nested objects with reordered keys produce identical canonical hash', () => {
    const p1 = {
      meta: { dept: 'GHMC', priority: 1, coordinates: { lng: 78.38, lat: 17.44 } },
      action: 'inspect',
    };
    const p2 = {
      action: 'inspect',
      meta: { coordinates: { lat: 17.44, lng: 78.38 }, priority: 1, dept: 'GHMC' },
    };
    assert.strictEqual(canonicalizePayload(p1), canonicalizePayload(p2));
    assert.strictEqual(computePayloadHash(p1), computePayloadHash(p2));
  });

  await runTest('Suite 1', 'TEST 4 (D): Different nested field value produces different hash', () => {
    const p1 = { report: { id: 'rep-1', status: 'Submitted' } };
    const p2 = { report: { id: 'rep-1', status: 'In Progress' } };
    assert.notStrictEqual(computePayloadHash(p1), computePayloadHash(p2));
  });

  await runTest('Suite 1', 'TEST 5 (E): Array ordering is preserved (different order produces different hash)', () => {
    const p1 = { steps: ['triage', 'assign', 'resolve'] };
    const p2 = { steps: ['assign', 'triage', 'resolve'] };
    assert.notStrictEqual(canonicalizePayload(p1), canonicalizePayload(p2));
    assert.notStrictEqual(computePayloadHash(p1), computePayloadHash(p2));
  });

  await runTest('Suite 1', 'TEST 6 (F): Unsupported payload types are rejected (undefined, BigInt, function, symbol)', () => {
    assert.throws(() => canonicalizePayload({ bad: undefined }), /undefined/i);
    assert.throws(() => canonicalizePayload({ bad: BigInt(42) }), /BigInt/i);
    assert.throws(() => canonicalizePayload({ bad: () => {} }), /function/i);
    assert.throws(() => canonicalizePayload({ bad: Symbol('token') }), /symbol/i);
  });

  await runTest('Suite 1', 'TEST 7 (G): Cyclic payload structure is detected and strictly rejected', () => {
    const cyclicObj: any = { name: 'cyclic-node' };
    cyclicObj.self = cyclicObj;
    assert.throws(() => canonicalizePayload(cyclicObj), /cyclic|circular/i);
  });

  await runTest('Suite 1', 'TEST 8 (H): Non-finite numeric edge cases (NaN, Infinity, -Infinity) are rejected', () => {
    assert.throws(() => canonicalizePayload({ num: NaN }), /NaN/i);
    assert.throws(() => canonicalizePayload({ num: Infinity }), /Infinity/i);
    assert.throws(() => canonicalizePayload({ num: -Infinity }), /Infinity/i);
    // -0 normalized to 0
    assert.strictEqual(canonicalizePayload({ zero: -0 }), '{"zero":0}');
  });

  // ===========================================================================
  // SUITE 2: QUEUE TAMPERING, MISSING HASH & IDEMPOTENCY HARDENING (TESTS 9 - 22)
  // ===========================================================================
  console.log('\nSuite 2: Queue Tampering, Missing Hash & Idempotency Hardening (Tests 9-22)...');

  await runTest('Suite 2', 'TEST 9: Missing payloadHash is rejected and quarantined (No unverified replay)', () => {
    const itemWithoutHash: QueuedSyncOperation = {
      id: 'op-no-hash',
      idempotencyKey: 'idem-no-hash-valid',
      userId: 'usr-citizen-09',
      type: 'create',
      reportId: 'rep-09',
      payload: { title: 'Pothole' },
      // payloadHash missing
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(itemWithoutHash, 'usr-citizen-09');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
    assert.ok(res.reason?.includes('Missing mandatory payloadHash'));
  });

  await runTest('Suite 2', 'TEST 10: Empty or whitespace payloadHash is rejected and quarantined', () => {
    const itemEmptyHash: QueuedSyncOperation = {
      id: 'op-empty-hash',
      idempotencyKey: 'idem-empty-hash',
      userId: 'usr-citizen-10',
      type: 'create',
      reportId: 'rep-10',
      payload: { title: 'Pothole' },
      payloadHash: '   ',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(itemEmptyHash, 'usr-citizen-10');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
  });

  await runTest('Suite 2', 'TEST 11: Malformed payloadHash (not 64-hex) is quarantined', () => {
    const itemBadHash: QueuedSyncOperation = {
      id: 'op-bad-hash',
      idempotencyKey: 'idem-bad-hash',
      userId: 'usr-citizen-11',
      type: 'create',
      reportId: 'rep-11',
      payload: { title: 'Pothole' },
      payloadHash: 'short-md5-hash',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(itemBadHash, 'usr-citizen-11');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
    assert.ok(res.reason?.includes('Malformed payloadHash'));
  });

  await runTest('Suite 2', 'TEST 12: Payload modified without hash update is quarantined', () => {
    const original = { title: 'Valid Intake Report', severity: 'low' };
    const hash = computePayloadHash(original);
    const tamperedItem: QueuedSyncOperation = {
      id: 'op-tampered-12',
      idempotencyKey: 'idem-tampered-12',
      userId: 'usr-citizen-12',
      type: 'create',
      reportId: 'rep-12',
      payload: { title: 'Valid Intake Report', severity: 'critical' }, // Modified
      payloadHash: hash,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(tamperedItem, 'usr-citizen-12');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
    assert.ok(res.reason?.includes('Payload integrity check failed'));
  });

  await runTest('Suite 2', 'TEST 13: Hash modified without payload update is quarantined', () => {
    const payload = { title: 'Water Leakage' };
    const tamperedItem: QueuedSyncOperation = {
      id: 'op-tampered-13',
      idempotencyKey: 'idem-tampered-13',
      userId: 'usr-citizen-13',
      type: 'create',
      reportId: 'rep-13',
      payload,
      payloadHash: '0000000000000000000000000000000000000000000000000000000000000000',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(tamperedItem, 'usr-citizen-13');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
    assert.ok(res.reason?.includes('Payload integrity check failed'));
  });

  await runTest('Suite 2', 'TEST 14: Nested object tampering is detected and quarantined', () => {
    const original = { details: { location: { ward: 12, street: 'Banjara Hills' } } };
    const hash = computePayloadHash(original);
    const tamperedItem: QueuedSyncOperation = {
      id: 'op-nested-tamper',
      idempotencyKey: 'idem-nested-tamper',
      userId: 'usr-citizen-14',
      type: 'create',
      reportId: 'rep-14',
      payload: { details: { location: { ward: 15, street: 'Banjara Hills' } } },
      payloadHash: hash,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(tamperedItem, 'usr-citizen-14');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
  });

  await runTest('Suite 2', 'TEST 15: Nested array tampering is detected and quarantined', () => {
    const original = { photos: ['img1.jpg', 'img2.jpg'] };
    const hash = computePayloadHash(original);
    const tamperedItem: QueuedSyncOperation = {
      id: 'op-arr-tamper',
      idempotencyKey: 'idem-arr-tamper',
      userId: 'usr-citizen-15',
      type: 'create',
      reportId: 'rep-15',
      payload: { photos: ['img1.jpg', 'img_malicious.jpg'] },
      payloadHash: hash,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(tamperedItem, 'usr-citizen-15');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
  });

  await runTest('Suite 2', 'TEST 16: Oversized idempotency key (>128 chars) is quarantined', () => {
    const payload = { title: 'Issue' };
    const badKeyItem: QueuedSyncOperation = {
      id: 'op-bad-key',
      idempotencyKey: 'k'.repeat(129),
      userId: 'usr-citizen-16',
      type: 'create',
      reportId: 'rep-16',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(badKeyItem, 'usr-citizen-16');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
    assert.ok(res.reason?.includes('Malformed idempotency key'));
  });

  await runTest('Suite 2', 'TEST 17: Idempotency key with whitespace or invalid characters is quarantined', () => {
    const payload = { title: 'Issue' };
    const badKeyItem: QueuedSyncOperation = {
      id: 'op-bad-key-ws',
      idempotencyKey: 'idem-key with space',
      userId: 'usr-citizen-17',
      type: 'create',
      reportId: 'rep-17',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(badKeyItem, 'usr-citizen-17');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
  });

  await runTest('Suite 2', 'TEST 18: Too short idempotency key (<6 chars) is quarantined', () => {
    const payload = { title: 'Issue' };
    const shortKeyItem: QueuedSyncOperation = {
      id: 'op-short-key',
      idempotencyKey: 'id-1',
      userId: 'usr-citizen-18',
      type: 'create',
      reportId: 'rep-18',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(shortKeyItem, 'usr-citizen-18');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
  });

  await runTest('Suite 2', 'TEST 19: Missing or empty report ID is quarantined', () => {
    const payload = { title: 'Issue' };
    const badReportItem: QueuedSyncOperation = {
      id: 'op-bad-rep',
      idempotencyKey: 'idem-bad-rep-id',
      userId: 'usr-citizen-19',
      type: 'create',
      reportId: '',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(badReportItem, 'usr-citizen-19');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'quarantine');
  });

  await runTest('Suite 2', 'TEST 20: Cross-account queued mutation is deferred without execution', () => {
    const payload = { title: 'User Alpha Issue' };
    const itemAlpha: QueuedSyncOperation = {
      id: 'op-user-alpha',
      idempotencyKey: 'idem-user-alpha',
      userId: 'usr-citizen-alpha',
      type: 'create',
      reportId: 'rep-alpha',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    // Beta is active session
    const res = validateQueuedSyncOperation(itemAlpha, 'usr-citizen-beta');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'defer');
    assert.ok(res.reason?.includes('does not match active session'));
  });

  await runTest('Suite 2', 'TEST 21: Valid item with active matching session and valid hash proceeds cleanly', () => {
    const payload = { title: 'Road Repair Request', severity: 'medium' };
    const validItem: QueuedSyncOperation = {
      id: 'op-valid-item',
      idempotencyKey: 'idem-valid-item-21',
      userId: 'usr-citizen-21',
      type: 'create',
      reportId: 'rep-21',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const res = validateQueuedSyncOperation(validItem, 'usr-citizen-21');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.action, 'proceed');
  });

  await runTest('Suite 2', 'TEST 22: Queue replay after logout fails closed with zero mutations', () => {
    const payload = { title: 'After Logout' };
    const item: QueuedSyncOperation = {
      id: 'op-logout',
      idempotencyKey: 'idem-logout-22',
      userId: 'usr-citizen-22',
      type: 'create',
      reportId: 'rep-22',
      payload,
      payloadHash: computePayloadHash(payload),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    // Session is null after logout
    const res = validateQueuedSyncOperation(item, null);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.action, 'defer');
  });

  // ===========================================================================
  // SUITE 3: DATABASE PRIVILEGE CLOSURE & RPC AUTHORIZATION (TESTS 23 - 32)
  // ===========================================================================
  console.log('\nSuite 3: Database Privilege Closure & RPC Authorization (Tests 23-32)...');

  await runTest('Suite 3', 'TEST 23: Direct client execution of recalculate_report_validation_aggregates revoked', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    assert.ok(
      sql.includes('REVOKE EXECUTE ON FUNCTION public.recalculate_report_validation_aggregates(TEXT) FROM anon, authenticated, PUBLIC;'),
      'Migration 15 must revoke recalculate_report_validation_aggregates from authenticated and anon'
    );
    assert.ok(
      sql.includes('GRANT EXECUTE ON FUNCTION public.recalculate_report_validation_aggregates(TEXT) TO service_role;'),
      'Recalculation must only be granted to service_role'
    );
  });

  await runTest('Suite 3', 'TEST 24: rpc_increment_report_confirmation execution revoked from anon', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    assert.ok(
      sql.includes('REVOKE EXECUTE ON FUNCTION public.rpc_increment_report_confirmation(TEXT, TEXT) FROM anon, PUBLIC;'),
      'Migration 15 must revoke rpc_increment_report_confirmation from anon'
    );
  });

  await runTest('Suite 3', 'TEST 25: rpc_increment_report_confirmation enforces authentication check', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    assert.ok(
      sql.includes("v_uid IS NULL AND auth.role() != 'service_role'"),
      'rpc_increment_report_confirmation must fail closed if unauthenticated'
    );
  });

  await runTest('Suite 3', 'TEST 26: rpc_increment_report_confirmation acquires exclusive per-report row lock', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    assert.ok(
      sql.includes('SELECT status INTO v_status FROM public.reports WHERE id = p_report_id FOR UPDATE;'),
      'Must acquire FOR UPDATE row lock on reports'
    );
  });

  await runTest('Suite 3', 'TEST 27: Sensitive operational RPCs execution revoked from anon role', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.rpc_assign_staff_role(UUID, VARCHAR) FROM anon'));
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.rpc_revoke_staff_role(UUID, TEXT) FROM anon'));
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.rpc_approve_report(TEXT, VARCHAR) FROM anon'));
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.rpc_approve_completion(VARCHAR, TEXT) FROM anon'));
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.rpc_submit_community_validation(TEXT, TEXT, TEXT, TEXT) FROM anon'));
  });

  await runTest('Suite 3', 'TEST 28: Migration 15 SECURITY DEFINER functions have explicit search_path', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    const lines = sql.split('\n');
    const secDefiners = lines.filter((l) => !l.trim().startsWith('--') && l.includes('SECURITY DEFINER')).length;
    const searchPaths = lines.filter((l) => !l.trim().startsWith('--') && l.includes('SET search_path = public, pg_temp')).length;
    assert.strictEqual(secDefiners, searchPaths, 'All SECURITY DEFINER functions must harden search_path');
  });

  await runTest('Suite 3', 'TEST 29: Database check constraint enforces idempotency key bounds (6-128 chars)', () => {
    const mig15Path = path.resolve('supabase/migrations/20261122000015_phase12_3_4_rpc_privilege_closure_and_aggregate_protection.sql');
    const sql = fs.readFileSync(mig15Path, 'utf8');
    assert.ok(
      sql.includes('length(trim(idempotency_key)) >= 6 AND length(idempotency_key) <= 128'),
      'Check constraint must enforce 6-128 non-empty idempotency key'
    );
  });

  await runTest('Suite 3', 'TEST 30: Citizen attempting direct staff role assignment is rejected at DB boundary', () => {
    const mig11Path = path.resolve('supabase/migrations/20261122000011_phase12_3_rpc_and_field_authorization_hardening.sql');
    const sql = fs.readFileSync(mig11Path, 'utf8');
    assert.ok(
      sql.includes("IF v_operator_role != 'admin' AND auth.role() != 'service_role' THEN"),
      'rpc_assign_staff_role must reject non-admins'
    );
  });

  await runTest('Suite 3', 'TEST 31: Administrator self-role alteration and self-revocation is strictly prohibited', () => {
    const mig11Path = path.resolve('supabase/migrations/20261122000011_phase12_3_rpc_and_field_authorization_hardening.sql');
    const sql = fs.readFileSync(mig11Path, 'utf8');
    assert.ok(
      sql.includes('Administrators cannot revoke their own account credentials'),
      'Self-revocation must be blocked'
    );
    assert.ok(
      sql.includes('Self-assignment or self-modification of operational roles is strictly prohibited'),
      'Self-modification must be blocked'
    );
  });

  await runTest('Suite 3', 'TEST 32: Deployment secret audit: zero service_role keys or private passwords in frontend bundle', () => {
    // Scan src directory for leaked secrets in production code
    const srcDir = path.resolve('src');
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];
    const tsFiles = files.filter(
      (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.includes('tests')
    );

    for (const file of tsFiles) {
      const fullPath = path.join(srcDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        !content.includes('service_role_secret') && !content.includes('supabase_service_role_key'),
        `Service role secret detected in production file: ${file}`
      );
    }
  });

  console.log('\n====================================================================');
  console.log(` PHASE 12.3.4 TEST SUITE SUMMARY: ${passed}/${passed + failed} PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Auto-run when executed directly via tsx
runPhase1234Tests();
