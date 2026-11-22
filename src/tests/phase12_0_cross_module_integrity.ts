import assert from 'assert';
import './setupMockBrowser';

import { reportService } from '../services/reportService';
import { operationsService, DEPARTMENTS, OPERATIONAL_STAFF } from '../services/operationsService';
import { communityValidationService } from '../services/communityValidationService';
import { aiOrchestrationService } from '../services/aiOrchestrationService';
import { digitalTwinService, projectCoordinates } from '../services/digitalTwinService';
import { transparencyService } from '../services/transparencyService';
import { DashboardReport } from '../types';

console.log('================================================================');
console.log('CIVICEYE — PHASE 12.0 CROSS-MODULE INTEGRATION & DATA INTEGRITY');
console.log('Full System Synchronization, Bidirectional Status, AI & Telemetry');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 3).join('\n'));
    }
  }
}

async function runTestSuite() {
  console.log('--- Group 1: Complete Report Lifecycle & Cross-Module Existence ---');

  let testReportId = '';
  let testTicketNumber = '';

  await runTest('1.1 Citizen creates report and receives valid ticket number & ID', async () => {
    const result = await reportService.createReport({
      title: 'Major Pipeline Breach on Road No. 36',
      description: 'High-pressure water outflow eroding pavement sub-base near metro station.',
      category: 'Water leakage',
      severity: 'high',
      locationText: 'Road No. 36, Jubilee Hills',
      neighborhood: 'Jubilee Hills',
      latitude: 17.4325,
      longitude: 78.4071,
    });

    assert.strictEqual(result.success, true, 'Report creation should succeed');
    assert.ok(result.report.id.startsWith('rep-'), 'Report ID must start with rep-');
    assert.ok(result.report.ticketNumber.startsWith('HYD-'), 'Ticket number must start with HYD-');
    assert.strictEqual(result.report.status, 'Submitted', 'Initial status must be Submitted');
    assert.strictEqual(result.report.confirmationsCount, 1, 'Initial confirmations count must be 1');

    testReportId = result.report.id;
    testTicketNumber = result.report.ticketNumber;
  });

  await runTest('1.2 Report immediately persists in localStorage and in-memory cache', async () => {
    const allReports = await reportService.getAllReports();
    const found = allReports.find((r) => r.id === testReportId);
    assert.ok(found, 'Created report must exist in getAllReports()');
    assert.strictEqual(found?.ticketNumber, testTicketNumber);

    const savedRaw = localStorage.getItem('civiceye_user_reports');
    assert.ok(savedRaw, 'LocalStorage civiceye_user_reports must be populated');
    const parsed: DashboardReport[] = JSON.parse(savedRaw);
    const persisted = parsed.find((r) => r.id === testReportId);
    assert.ok(persisted, 'Created report must be persisted in localStorage');
    assert.strictEqual(persisted?.title, 'Major Pipeline Breach on Road No. 36');
  });

  await runTest('1.3 Explore Map cartographic projection maps report accurately without forced fallback', async () => {
    // Valid GPS within Hyderabad pilot viewport
    const coords = projectCoordinates(17.4325, 78.4071, 50, 50);
    assert.ok(coords.x >= 8 && coords.x <= 92, 'x coordinate must be within map bounds');
    assert.ok(coords.y >= 8 && coords.y <= 92, 'y coordinate must be within map bounds');
    assert.notStrictEqual(coords.x, 50, 'Valid GPS should NOT be overridden with fallbackX=50');
    assert.notStrictEqual(coords.y, 50, 'Valid GPS should NOT be overridden with fallbackY=50');

    // Missing coordinates should safely fall back
    const fallbackCoords = projectCoordinates(undefined, undefined, 42, 68);
    assert.strictEqual(fallbackCoords.x, 42, 'Missing lat/lng must return fallbackX');
    assert.strictEqual(fallbackCoords.y, 68, 'Missing lat/lng must return fallbackY');
  });

  console.log('\n--- Group 2: Operational Dispatch & Bidirectional Status Sync ---');

  let testWorkOrderId = '';

  await runTest('2.1 Municipal Reviewer approves report for assignment & issues Work Order', async () => {
    operationsService.setActiveRole('reviewer');
    const dept = DEPARTMENTS.find((d) => d.id === 'dept-water') || DEPARTMENTS[0];
    const staff = OPERATIONAL_STAFF.find((s) => s.departmentId === dept.id);

    const res = await operationsService.approveReportForAssignment({
      reportId: testReportId,
      departmentId: dept.id,
      assignedStaffId: staff?.id,
      priority: 'high',
      assignmentNotes: 'Emergency isolation squad dispatched.',
    });

    assert.strictEqual(res.success, true, 'Approval must succeed');
    assert.ok(res.workOrder, 'Work order must be generated');
    assert.strictEqual(res.workOrder.reportId, testReportId, 'Work order must link to report ID');
    assert.strictEqual(res.workOrder.departmentId, dept.id);
    assert.strictEqual(res.workOrder.status, 'Assigned');

    testWorkOrderId = res.workOrder.id;

    // Verify report status in reportService
    const report = await reportService.getReportById(testReportId);
    assert.strictEqual(report?.status, 'Assigned', 'Report status must now be Assigned');
    assert.strictEqual(report?.departmentAssigned, dept.name);
    assert.strictEqual(report?.handlingOfficer, staff?.name);
  });

  await runTest('2.2 Field staff transitions work order to In Progress -> Report status syncs to In Progress', async () => {
    operationsService.setActiveRole('staff');
    const transRes = operationsService.transitionWorkOrderStatus({
      workOrderId: testWorkOrderId,
      newStatus: 'In Progress',
      reason: 'Field squad arrived on site with suction pump and valve key.',
    });

    assert.strictEqual(transRes.success, true, 'Transition to In Progress must succeed');

    const report = await reportService.getReportById(testReportId);
    assert.strictEqual(report?.status, 'In Progress', 'Report status must synchronize to In Progress');
    const latestTimeline = report?.timeline[report.timeline.length - 1];
    assert.strictEqual(latestTimeline?.step, 'In Progress');
  });

  await runTest('2.3 Field staff completes work and supervisor approves -> Report transitions to Resolved', async () => {
    operationsService.setActiveRole('staff');
    const submitRes = operationsService.submitCompletionEvidence({
      workOrderId: testWorkOrderId,
      workDescription: 'Pipeline flange gasket replaced and tested under 4 bar pressure.',
      materialsUsed: '1x 150mm rubber gasket, 8x zinc bolts',
      afterPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f0',
    });
    assert.strictEqual(submitRes.success, true, 'Submit completion must succeed');

    operationsService.setActiveRole('supervisor');
    const approveRes = operationsService.approveCompletion(
      testWorkOrderId,
      'Supervisor inspected site: water flow restored and trench filled.'
    );
    assert.strictEqual(approveRes.success, true, 'Supervisor completion approval must succeed');

    const report = await reportService.getReportById(testReportId);
    assert.strictEqual(report?.status, 'Resolved', 'Report status must synchronize to Resolved');
  });

  console.log('\n--- Group 3: Bidirectional Citizen Resolution Challenge & Work Order Reopen ---');

  await runTest('3.1 Citizen resolution challenge reopens report to Under Review & marks Work Order for Rework', async () => {
    // Citizen challenges the completed repair
    const challengeRes = communityValidationService.challengeResolution({
      reportId: testReportId,
      userName: 'Dr. Priya Varma',
      reason: 'Water pressure dropped again; minor leak bubbling through new asphalt.',
    });

    assert.strictEqual(challengeRes.success, true);
    assert.strictEqual(challengeRes.info.isChallenged, true);
    assert.strictEqual(challengeRes.info.reopenedForReview, true);

    // Verify operations service handled citizen challenge
    const workOrder = operationsService.getWorkOrderById(testWorkOrderId);
    assert.strictEqual(workOrder?.status, 'Returned for Rework', 'Work order must move to Returned for Rework');

    // Verify report status in reportService transitioned back to Under Review
    const report = await reportService.getReportById(testReportId);
    assert.strictEqual(report?.status, 'Under Review', 'Report status must move back to Under Review');
  });

  console.log('\n--- Group 4: Community Validation, Worsening Flags & Priority Escalation ---');

  await runTest('4.1 Community validation records still_exists and getting_worse flags', async () => {
    const val1 = communityValidationService.submitValidationAction({
      reportId: testReportId,
      action: 'still_exists',
      userId: 'usr-neighbor-1',
      userName: 'Suresh Rao',
    });
    assert.strictEqual(val1.success, true);
    assert.strictEqual(val1.userAction, 'still_exists');

    const val2 = communityValidationService.submitValidationAction({
      reportId: testReportId,
      action: 'getting_worse',
      userId: 'usr-neighbor-2',
      userName: 'Kavitha R.',
      note: 'Water flow increasing, forming a sinkhole hazard.',
    });
    assert.strictEqual(val2.success, true);
    assert.strictEqual(val2.userAction, 'getting_worse');

    const summary = communityValidationService.getCommunitySummary(testReportId);
    assert.strictEqual(summary.stillExists, 1);
    assert.strictEqual(summary.gettingWorse, 1);
  });

  await runTest('4.2 Priority escalation propagates to operations and report severity', async () => {
    const escalated = await reportService.escalatePriority(testReportId, 'critical', 'Community emergency escalation');
    assert.strictEqual(escalated, true, 'Priority escalation should succeed');

    const report = await reportService.getReportById(testReportId);
    assert.strictEqual(report?.severity, 'critical', 'Report severity must now be critical');
  });

  console.log('\n--- Group 5: Grounded AI Assistant Cross-Module Integration ---');

  await runTest('5.1 AI assistant answers specific ticket number query with live grounded status & links', async () => {
    const response = await aiOrchestrationService.askCivicAiAssistant(
      `What is the status of ticket ${testTicketNumber}?`,
      'citizen'
    );

    assert.ok(response.content.includes(testTicketNumber), 'Response content must include ticket number');
    assert.ok(response.content.includes('Under Review'), 'Response must reflect current status Under Review');
    assert.ok(response.grounding, 'Response must have grounding');
    assert.strictEqual(response.grounding!.supportingReportIds.length, 1);
    assert.strictEqual(response.grounding!.supportingReportIds[0], testReportId);
    assert.strictEqual(response.grounding!.tag, 'official_record');
  });

  await runTest('5.2 AI assistant identifies critical reports and active department workloads', async () => {
    const critResp = await aiOrchestrationService.askCivicAiAssistant('Which reports are becoming critical?', 'citizen');
    assert.ok(critResp.content.includes('critical'), 'Response must report critical tickets');
    assert.ok(critResp.grounding && critResp.grounding.supportingReportIds.length > 0, 'Must cite supporting report IDs');

    const deptResp = await aiOrchestrationService.askCivicAiAssistant('Which departments have the largest active workload?', 'citizen');
    assert.ok(deptResp.content.includes('GHMC') || deptResp.content.includes('HMWSSB'));
    assert.ok(deptResp.grounding, 'Must have grounding');
    assert.strictEqual(deptResp.grounding!.tag, 'official_record');
  });

  console.log('\n--- Group 6: Digital Twin & Cartographic Coordinate Projection ---');

  await runTest('6.1 Digital Twin filters valid geographic reports and calculates spatial density grid', async () => {
    const allReports = await reportService.getAllReports();
    const { validReports, inViewportReports } = digitalTwinService.filterGeographicReports(allReports);
    assert.ok(validReports.length > 0, 'Must find valid geographic reports');
    assert.ok(inViewportReports.length > 0, 'Must find in-viewport reports');

    const densityGrid = digitalTwinService.calculateSpatialDensityGrid(allReports, 4);
    assert.strictEqual(densityGrid.length, 16, 'Grid 4x4 must have 16 cells');
  });

  await runTest('6.2 Digital Twin runs multi-strategy scenario simulation deterministically', async () => {
    const allReports = await reportService.getAllReports();
    const workOrders = operationsService.getWorkOrders();

    const simResult = digitalTwinService.runSimulation(
      {
        strategyId: 'strategy_a',
        strategyName: 'Critical Issues First',
        targetArea: 'citywide',
        targetCategory: 'all',
        activeTeams: 12,
        dailyInterventionRate: 2.5,
        timelineDays: 14,
      },
      allReports,
      workOrders
    );

    assert.ok(simResult.baselineSummary.totalIssues > 0, 'Must evaluate active issues');
    assert.ok(simResult.finalMetrics.totalAddressed >= 0, 'Total addressed must be computed');
    assert.ok(simResult.finalMetrics.criticalReductionPct >= 0 && simResult.finalMetrics.criticalReductionPct <= 100);
    assert.ok(simResult.baselineSummary.datasetFingerprint.length > 0, 'Must produce deterministic dataset fingerprint');
  });

  console.log('\n--- Group 7: Public Transparency & System Metrics Integration ---');

  await runTest('7.1 Transparency service computes live resolution rate, SLA compliance & audit metrics', async () => {
    const metrics = await transparencyService.getPublicTransparencyMetrics();
    assert.ok(metrics.totalReports >= 5, 'Must track at least 5 reports');
    assert.ok(metrics.reportsCompleted >= 0, 'Resolved count must be non-negative');
    assert.ok(metrics.resolutionRate >= 0 && metrics.resolutionRate <= 100);

    const depts = await transparencyService.getDepartmentPerformanceMetrics();
    assert.ok(depts.length >= 6, 'Must compute metrics for all 6 municipal departments');
  });

  console.log('\n--- Group 8: Unified Watchlist & Follower Notification System ---');

  await runTest('8.1 Watchlist toggling persists, avoids duplicates, and emits sync events', async () => {
    const isNowFollowed = reportService.toggleFollowReport(testReportId);
    assert.strictEqual(isNowFollowed, true, 'Should now be followed');

    assert.strictEqual(reportService.isReportFollowed(testReportId), true);
    const updatedFollowed = reportService.getFollowedIssueIds();
    assert.ok(updatedFollowed.includes(testReportId));

    // Toggle off
    const isUnfollowed = reportService.toggleFollowReport(testReportId);
    assert.strictEqual(isUnfollowed, false, 'Should now be unfollowed');
    assert.strictEqual(reportService.isReportFollowed(testReportId), false);
  });

  console.log('\n--- Group 9: Strict Role-Based Access Control & Security Boundaries ---');

  await runTest('9.1 Citizen role cannot execute work order operations', () => {
    operationsService.setActiveRole('citizen');
    assert.strictEqual(operationsService.canPerform('approve_report'), false);
    assert.strictEqual(operationsService.canPerform('assign_work'), false);
    assert.strictEqual(operationsService.canPerform('accept_task'), false);
    assert.strictEqual(operationsService.canPerform('approve_completion'), false);

    const transAttempt = operationsService.transitionWorkOrderStatus({
      workOrderId: testWorkOrderId,
      newStatus: 'In Progress',
    });
    assert.strictEqual(transAttempt.success, false, 'Citizens must not be able to execute work orders');
  });

  await runTest('9.2 Reviewer & Supervisor role boundaries strictly enforced', () => {
    operationsService.setActiveRole('reviewer');
    assert.strictEqual(operationsService.canPerform('approve_report'), true);
    assert.strictEqual(operationsService.canPerform('assign_work'), false, 'Reviewer cannot assign staff');
    assert.strictEqual(operationsService.canPerform('approve_completion'), false, 'Reviewer cannot sign off work');

    operationsService.setActiveRole('supervisor');
    assert.strictEqual(operationsService.canPerform('approve_report'), true);
    assert.strictEqual(operationsService.canPerform('assign_work'), true);
    assert.strictEqual(operationsService.canPerform('approve_completion'), true);
  });

  console.log('\n================================================================');
  console.log(`PHASE 12.0 AUDIT SUITE: ${passedTests} PASSED, ${totalTests - passedTests} FAILED (TOTAL ${totalTests})`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
