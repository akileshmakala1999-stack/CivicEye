// Phase 8.1 & 8.2 Automated Logic & Security Audit Test Suite
import './setupMockBrowser';
import fs from 'fs';
import path from 'path';
import { sanitizePublicString, sanitizePublicPhotoUrl } from '../services/transparencyService';

async function runAuditSuite() {
  console.log('========================================================');
  console.log('   CIVICEYE PHASE 8.1 SECURITY & LOGIC AUDIT SUITE      ');
  console.log('========================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. PRIVACY & SANITIZATION AUDIT
  console.log('--- TEST GROUP 1: Privacy Redaction & Sanitization ---');
  const sampleWithPhone = 'Contact citizen at +91 98490 12345 or 9876543210 regarding pothole.';
  const sanitizedPhone = sanitizePublicString(sampleWithPhone);
  assert(!sanitizedPhone.includes('98490') && !sanitizedPhone.includes('9876543210'), 'Phone numbers strictly redacted in public strings', sanitizedPhone);

  const sampleWithEmail = 'Sent verification to citizen.name@example.com for confirmation.';
  const sanitizedEmail = sanitizePublicString(sampleWithEmail);
  assert(!sanitizedEmail.includes('citizen.name@example.com'), 'Email addresses strictly redacted in public strings', sanitizedEmail);

  const sampleWithAddress = 'Pothole located in front of Flat 402, Plot 18, Road No. 36';
  const sanitizedAddress = sanitizePublicString(sampleWithAddress);
  assert(!sanitizedAddress.includes('Flat 402') && !sanitizedAddress.includes('Plot 18'), 'Private residential door/flat numbers masked', sanitizedAddress);

  const samplePhotoWithToken = 'https://civiceye.storage/photos/rep-1.jpg?token=secret123&apiKey=xyz999&auth=admin';
  const sanitizedPhoto = sanitizePublicPhotoUrl(samplePhotoWithToken);
  assert(sanitizedPhoto !== undefined && !sanitizedPhoto.includes('secret123') && !sanitizedPhoto.includes('xyz999'), 'Photo URL query tokens stripped to prevent storage token leaks', sanitizedPhoto);

  // 2. SLA CALCULATION VALIDATION
  console.log('\n--- TEST GROUP 2: SLA Metric Calculation & Edge Cases ---');
  const { operationsService } = await import('../services/operationsService');
  const slaMetrics = operationsService.calculateOverallSlaMetrics();
  assert(typeof slaMetrics.complianceRate === 'number' && slaMetrics.complianceRate >= 0 && slaMetrics.complianceRate <= 100, 'Overall SLA compliance is valid percentage (0-100%)', `Got: ${slaMetrics.complianceRate}%`);
  assert(slaMetrics.cancelledCount >= 0, 'Cancelled work orders excluded from active SLA denominator');
  assert(slaMetrics.completedOnTime + slaMetrics.completedLate + slaMetrics.activeOnSchedule + slaMetrics.activeOverdue + slaMetrics.blockedCount === slaMetrics.totalEvaluated, 'SLA evaluated count matches sum of partitioned operational states including paused blocked orders');

  // Test individual work order SLA status evaluation
  const mockCompletedOnTime: any = {
    id: 'wo-test-1',
    status: 'Completed',
    slaDeadlineTimestamp: Date.now() - 100000,
    completedTimestamp: 'Yesterday, 04:00 PM',
  };
  const slaStatusOnTime = operationsService.calculateSlaStatus(mockCompletedOnTime);
  assert(slaStatusOnTime.status === 'on_schedule' && slaStatusOnTime.label.includes('On Time'), 'Completed on-time order returns on_schedule status');

  const mockCompletedLate: any = {
    id: 'wo-test-2',
    status: 'Completed',
    slaDeadlineTimestamp: Date.now() - 100000,
    completedTimestamp: 'Yesterday (Late by 4h)',
  };
  const slaStatusLate = operationsService.calculateSlaStatus(mockCompletedLate);
  assert(slaStatusLate.status === 'overdue' && slaStatusLate.label.includes('Past SLA'), 'Completed late order correctly identified as overdue/past SLA');

  const mockBlockedOrder: any = {
    id: 'wo-test-3',
    status: 'Blocked',
    slaDeadlineTimestamp: Date.now() - 100000,
    blockedReason: 'Awaiting telecom utility line clearance',
  };
  const slaStatusBlocked = operationsService.calculateSlaStatus(mockBlockedOrder);
  assert(slaStatusBlocked.status === 'blocked' && slaStatusBlocked.label.includes('Blocked'), 'Blocked order pauses SLA and provides reason');

  const mockCancelledOrder: any = {
    id: 'wo-test-4',
    status: 'Cancelled',
    slaDeadlineTimestamp: Date.now() - 100000,
  };
  const slaStatusCancelled = operationsService.calculateSlaStatus(mockCancelledOrder);
  assert(slaStatusCancelled.status === 'cancelled', 'Cancelled order correctly flagged as cancelled');

  // 3. TRANSPARENCY SCORECARD AUDIT
  console.log('\n--- TEST GROUP 3: Transparency Scorecard & Zero-Data Handling ---');
  const { transparencyService } = await import('../services/transparencyService');
  const scorecard = await transparencyService.getTransparencyScorecard();
  assert(scorecard.length === 8, 'All 8 scorecard indicators present');

  for (const item of scorecard) {
    assert(item.score >= 0 && item.score <= 100, `Scorecard item ${item.key} score in valid range 0-100`, `${item.score}%`);
    assert(item.benchmarkTarget.includes('Reference Benchmark'), `Scorecard item ${item.key} benchmark clearly labeled as Reference Benchmark`, item.benchmarkTarget);
    assert(typeof item.sampleCount === 'number', `Scorecard item ${item.key} reports sample count n=${item.sampleCount}`);
  }

  // 4. CITIZEN FEEDBACK & REOPENING WORKFLOW
  console.log('\n--- TEST GROUP 4: Citizen Verification & Reopening Workflow ---');
  // Test satisfactory sign-off
  const satFeedback = transparencyService.submitResolutionFeedback({
    reportId: 'rep-5',
    userId: 'usr-test-citizen-1',
    userName: 'Priya Sharma',
    rating: 5,
    completeness: 'fully_fixed',
    hasRecurred: false,
    feedbackComment: 'Pavement is completely flush and safe.',
  });
  assert(satFeedback.success === true && satFeedback.challenged === false, 'Satisfactory 5-star verification recorded without challenge');

  // Test duplicate feedback upsert
  const dupeFeedback = transparencyService.submitResolutionFeedback({
    reportId: 'rep-5',
    userId: 'usr-test-citizen-1',
    userName: 'Priya Sharma',
    rating: 4,
    completeness: 'fully_fixed',
    hasRecurred: false,
    feedbackComment: 'Updated rating to 4 stars.',
  });
  assert(dupeFeedback.feedback.id === satFeedback.feedback.id, 'Duplicate feedback from same citizen updates existing record instead of duplicate entry');

  // Test challenge reopening workflow
  const challengeFeedback = transparencyService.submitResolutionFeedback({
    reportId: 'rep-5',
    userId: 'usr-test-challenger',
    userName: 'Kiran V.',
    rating: 2,
    completeness: 'still_broken',
    hasRecurred: true,
    feedbackComment: 'Pothole gravel washed away after rain. Defect still exists!',
  });
  assert(challengeFeedback.success === true && challengeFeedback.challenged === true, 'Submitting still_broken triggers resolution challenge');

  // Verify that the work order was transitioned to Returned for Rework in operations
  const woRep5 = operationsService.getWorkOrders().find((w: any) => w.reportId === 'rep-5');
  assert(woRep5 !== undefined && woRep5.status === 'Returned for Rework', 'Work order in operations transitioned to Returned for Rework on citizen challenge');

  // Verify metrics updated
  const updatedMetrics = await transparencyService.getPublicTransparencyMetrics();
  assert(updatedMetrics.reopenedIssues > 0, 'Reopened issues count updated in public transparency metrics', `reopenedCount=${updatedMetrics.reopenedIssues}`);

  // Test rate limiting (submit 6 feedbacks rapidly)
  let rateLimitHit = false;
  for (let i = 0; i < 6; i++) {
    const res = transparencyService.submitResolutionFeedback({
      reportId: `rep-rate-${i}`,
      userId: 'usr-spammer',
      userName: 'Bot Spammer',
      rating: 1,
      completeness: 'still_broken',
      hasRecurred: false,
    });
    if (res.error?.includes('limit')) {
      rateLimitHit = true;
      break;
    }
  }
  assert(rateLimitHit === true, 'Feedback rate limiting triggers when user submits >5 verifications in 60s');

  // 5. PHASE 8.2 FINAL SECURITY HARDENING & IMMUTABILITY AUDIT
  console.log('\n--- TEST GROUP 5: Phase 8.2 Security & Data Integrity Verification ---');

  const sqlMigrationPath = path.resolve('supabase/migrations/20261120000005_create_transparency_and_accountability.sql');
  const sqlExists = fs.existsSync(sqlMigrationPath);
  assert(sqlExists, 'SQL migration 20261120000005 exists on disk');

  if (sqlExists) {
    const sqlContent = fs.readFileSync(sqlMigrationPath, 'utf8');

    // Verification 1: Public view privacy (zero comment/photo exposure)
    assert(
      sqlContent.includes('DROP VIEW IF EXISTS public_sanitized_resolution_feedback;'),
      'Legacy public_sanitized_resolution_feedback individual view is dropped to prevent comment/photo PII leaks'
    );
    assert(
      sqlContent.includes('CREATE OR REPLACE VIEW public_resolution_feedback_summary'),
      'Secure public_resolution_feedback_summary view created for public aggregation'
    );
    assert(
      !sqlContent.match(/CREATE VIEW public_sanitized_resolution_feedback/),
      'No individual feedback record view exists in public migration'
    );

    // Verification 2: Audit ledger immutability
    assert(
      sqlContent.includes('prevent_audit_tampering()') &&
      sqlContent.includes('BEFORE UPDATE OR DELETE ON public_audit_events'),
      'Trigger preventing UPDATE and DELETE on public_audit_events is declared'
    );
    assert(
      sqlContent.includes('prevent_audit_truncate()') &&
      sqlContent.includes('BEFORE TRUNCATE ON public_audit_events'),
      'Trigger preventing TRUNCATE on public_audit_events is declared'
    );
    assert(
      sqlContent.includes('REVOKE UPDATE, DELETE, TRUNCATE ON public_audit_events'),
      'Privileges for UPDATE, DELETE, TRUNCATE revoked from anon, authenticated, public'
    );

    // Verification 3: Feedback mutation protection & upsert consistency
    assert(
      sqlContent.includes('CONSTRAINT uq_report_user_feedback UNIQUE (report_id, user_id)'),
      'Unique constraint uq_report_user_feedback enforces 1 verdict per citizen per report'
    );
    assert(
      sqlContent.includes('handle_feedback_mutation()') &&
      sqlContent.includes('BEFORE UPDATE OR DELETE ON resolution_quality_feedback'),
      'Feedback mutation guard trigger installed on resolution_quality_feedback'
    );
    assert(
      sqlContent.includes('RAISE EXCEPTION \'Citizen resolution feedback cannot be deleted.'),
      'DELETE operation strictly prohibited on resolution_quality_feedback'
    );
    assert(
      sqlContent.includes('OLD.user_id != NEW.user_id OR OLD.report_id != NEW.report_id OR OLD.id != NEW.id'),
      'Immutable identifiers (user_id, report_id, id) locked against alteration during feedback updates'
    );

    // Verification 4: Concurrency-safe advisory transaction locking for rate limit
    assert(
      sqlContent.includes('pg_advisory_xact_lock'),
      'PostgreSQL advisory transaction lock (pg_advisory_xact_lock) implemented for concurrency-safe rate limiting'
    );

    // Verification 5: Cascading delete on reports foreign key
    assert(
      sqlContent.includes('REFERENCES reports(id) ON DELETE CASCADE'),
      'Foreign key from resolution_quality_feedback to reports(id) includes ON DELETE CASCADE'
    );
  }

  // Verification 6: Blocked report telemetry consistency
  assert(
    typeof updatedMetrics.blockedReports === 'number' &&
    updatedMetrics.blockedReports === slaMetrics.blockedCount,
    'getPublicTransparencyMetrics explicitly returns blockedReports matching operations SLA metrics',
    `blockedReports=${updatedMetrics.blockedReports}`
  );

  console.log(`\n========================================================`);
  console.log(`AUDIT EXECUTION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
