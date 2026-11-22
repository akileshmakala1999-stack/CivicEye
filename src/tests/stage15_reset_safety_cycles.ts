import './setupMockBrowser';
import { demoScenarioService, HYDERABAD_DEMO_SCENARIO } from '../services/demoScenarioService';
import { reportService } from '../services/reportService';
import { operationsService } from '../services/operationsService';
import { communityValidationService } from '../services/communityValidationService';
import { transparencyService } from '../services/transparencyService';
import assert from 'node:assert/strict';

export async function runResetSafetyCycles() {
  console.log('======================================================');
  console.log('STAGE 15 CLOSURE: 3 CONSECUTIVE DEMO RESET/REPLAY CYCLES');
  console.log('======================================================');

  // Initial baseline cleanup
  await demoScenarioService.resetDemoScenario();

  // Create an unrelated user report to verify it is NOT deleted during reset
  const userCustomReport = {
    id: 'rep-user-custom-001',
    ticketNumber: 'HYD-CUSTOM-999',
    title: 'Unrelated citizen reported broken bench in KBR park',
    category: 'Parks & Recreation' as any,
    severity: 'low' as any,
    status: 'Submitted' as any,
    location: 'KBR Park Gate 2',
    neighborhood: 'Jubilee Hills' as any,
    reportDate: '22 Nov 2026',
    reportTimestamp: '22 Nov 2026, 12:00 PM',
    departmentAssigned: 'GHMC Urban Biodiversity',
    confirmationsCount: 3,
    description: 'Wooden slats broken on seating bench near jogging track.',
    version: 1,
    isRemotePersisted: false,
    timeline: [
      {
        step: 'Submitted' as any,
        label: 'Citizen Report Filed',
        timestamp: '12:00 PM',
        completed: true,
        current: true,
        detail: 'Logged by park visitor.',
      },
    ],
  };
  reportService.upsertReport(userCustomReport);

  const initialReports = await reportService.getAllReports();
  const initialWorkOrders = operationsService.getWorkOrders();
  const initialFeedback = transparencyService.getResolutionFeedback(HYDERABAD_DEMO_SCENARIO.reportId);

  const baselineReportsCount = initialReports.length;
  const baselineWorkOrdersCount = initialWorkOrders.length;
  const baselineFeedbackCount = initialFeedback.length;

  console.log(`\nINITIAL BASELINE COUNTS (with unrelated custom report included):`);
  console.log(`- Reports: ${baselineReportsCount}`);
  console.log(`- Work Orders: ${baselineWorkOrdersCount}`);
  console.log(`- Feedback for Scenario: ${baselineFeedbackCount}`);
  console.log(`- Custom Report present: ${initialReports.some((r) => r.id === 'rep-user-custom-001')}`);

  for (let cycle = 1; cycle <= 3; cycle++) {
    console.log(`\n------------------------------------------------------`);
    console.log(`CYCLE ${cycle}: EXECUTE FULL SCENARIO -> RESET`);
    console.log(`------------------------------------------------------`);

    // 1. Execute Full Scenario
    const runResult = await demoScenarioService.executeFullScenario();
    assert.equal(runResult.success, true, `Cycle ${cycle} execution must succeed`);

    const midReports = await reportService.getAllReports();
    const midWorkOrders = operationsService.getWorkOrders();
    const midSummary = communityValidationService.getCommunitySummary(HYDERABAD_DEMO_SCENARIO.reportId);
    const midFeedback = transparencyService.getResolutionFeedback(HYDERABAD_DEMO_SCENARIO.reportId);

    console.log(`[Cycle ${cycle} Post-Execution Counts]:`);
    console.log(`  - Total Reports: ${midReports.length} (Expected: ${baselineReportsCount + 1})`);
    console.log(`  - Total Work Orders: ${midWorkOrders.length} (Expected: ${baselineWorkOrdersCount + 1})`);
    console.log(`  - Scenario Validations: ${midSummary.stillExists + midSummary.gettingWorse} (Expected: >= 2)`);
    console.log(`  - Scenario Feedback: ${midFeedback.length} (Expected: 1)`);
    console.log(`  - Custom Report Preserved: ${midReports.some((r) => r.id === 'rep-user-custom-001')}`);

    // Verify exactly 1 instance of scenario ticket exists (no duplicate tickets)
    const matchingTickets = midReports.filter((r) => r.ticketNumber === HYDERABAD_DEMO_SCENARIO.ticketNumber);
    assert.equal(matchingTickets.length, 1, `Cycle ${cycle}: Exactly 1 ticket ${HYDERABAD_DEMO_SCENARIO.ticketNumber} must exist`);

    const matchingWOs = midWorkOrders.filter((w) => w.id === HYDERABAD_DEMO_SCENARIO.workOrderId);
    assert.equal(matchingWOs.length, 1, `Cycle ${cycle}: Exactly 1 work order ${HYDERABAD_DEMO_SCENARIO.workOrderId} must exist`);

    // 2. Execute Non-Destructive Reset
    const resetResult = await demoScenarioService.resetDemoScenario();
    assert.equal(resetResult.success, true, `Cycle ${cycle} reset must succeed`);

    const postReports = await reportService.getAllReports();
    const postWorkOrders = operationsService.getWorkOrders();
    const postSummary = communityValidationService.getCommunitySummary(HYDERABAD_DEMO_SCENARIO.reportId);
    const postFeedback = transparencyService.getResolutionFeedback(HYDERABAD_DEMO_SCENARIO.reportId);

    console.log(`[Cycle ${cycle} Post-Reset Counts]:`);
    console.log(`  - Total Reports: ${postReports.length} (Baseline: ${baselineReportsCount})`);
    console.log(`  - Total Work Orders: ${postWorkOrders.length} (Baseline: ${baselineWorkOrdersCount})`);
    console.log(`  - Scenario Validations: ${postSummary.stillExists + postSummary.gettingWorse} (Expected: 0)`);
    console.log(`  - Scenario Feedback: ${postFeedback.length} (Expected: 0)`);
    console.log(`  - Custom Report Preserved: ${postReports.some((r) => r.id === 'rep-user-custom-001')}`);

    // Exact count assertion
    assert.equal(postReports.length, baselineReportsCount, `Cycle ${cycle}: Post-reset reports count must match baseline`);
    assert.equal(postWorkOrders.length, baselineWorkOrdersCount, `Cycle ${cycle}: Post-reset work orders count must match baseline`);
    assert.equal(postSummary.stillExists + postSummary.gettingWorse, 0, `Cycle ${cycle}: Scenario validations must be 0`);
    assert.equal(postFeedback.length, 0, `Cycle ${cycle}: Scenario feedback must be 0`);

    // Verify scenario report and work order are completely gone
    assert.equal(postReports.some((r) => r.id === HYDERABAD_DEMO_SCENARIO.reportId), false);
    assert.equal(postWorkOrders.some((w) => w.id === HYDERABAD_DEMO_SCENARIO.workOrderId), false);

    // Verify baseline seed reports (rep-1 .. rep-5) are 100% intact
    for (const seedId of ['rep-1', 'rep-2', 'rep-3', 'rep-4', 'rep-5']) {
      assert.ok(postReports.some((r) => r.id === seedId), `Baseline report ${seedId} must remain intact`);
    }

    // Verify custom user report is 100% intact
    assert.ok(postReports.some((r) => r.id === 'rep-user-custom-001'), `Custom user report must survive reset`);
  }

  // Cleanup custom report
  reportService.removeReport('rep-user-custom-001');

  console.log('\n======================================================');
  console.log('VERDICT: 3 CONSECUTIVE CYCLES PASSED PERFECTLY');
  console.log('Zero duplicate records created, baseline and user data preserved.');
  console.log('======================================================\n');
}

runResetSafetyCycles().catch((err) => {
  console.error('Reset safety cycles failed:', err);
  process.exit(1);
});
