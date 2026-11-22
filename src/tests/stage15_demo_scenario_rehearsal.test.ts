/**
 * CIVICEYE — STAGE 15: DEMO SCENARIO REHEARSAL & PRESENTATION RELIABILITY TEST SUITE
 * 
 * Verifies the complete 18-step civic lifecycle for the Hyderabad demonstration scenario:
 * "Major Road Crater & Choked Storm Drain on Rd 36 Jubilee Hills near Peddamma Temple"
 * 
 * Verifications:
 * 1. Baseline dataset integrity audit (reports, departments, work orders, coordinates)
 * 2. Scenario initialization & duplicate prevention (idempotency guard)
 * 3. Step 1 & 2: Citizen report creation & dashboard reflection (HYD-JH-2026-999)
 * 4. Step 3: AI triage, severity, SLA target & infrastructure relationship detection
 * 5. Step 4: Community validation & condition worsening report
 * 6. Step 5 & 6: Review queue elevation & municipal department assignment (dept-roads)
 * 7. Step 7 & 8: Staff field execution & repair evidence submission
 * 8. Step 9: Supervisor physical inspection approval & resolution sign-off
 * 9. Step 10: Citizen satisfaction verification & quality rating
 * 10. Step 11: Digital Twin simulation reflection & deterministic projection
 * 11. Cross-module data consistency across all views
 * 12. Safe, non-destructive reset restoring baseline without data loss
 * 13. Rehearsal repeatability with zero duplicate tickets
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import './setupMockBrowser';

import { demoScenarioService, HYDERABAD_DEMO_SCENARIO } from '../services/demoScenarioService';
import { reportService } from '../services/reportService';
import { operationsService } from '../services/operationsService';
import { communityValidationService } from '../services/communityValidationService';
import { transparencyService } from '../services/transparencyService';
import { isValidGlobalCoordinate, isInGeographicBounds } from '../config/geographicBounds';

describe('Stage 15: Demo Readiness & Scenario Rehearsal Verification', () => {
  beforeEach(async () => {
    // Reset scenario to ensure clean starting baseline for each test
    await demoScenarioService.resetDemoScenario();
  });

  it('Test 1: Baseline dataset integrity audit verifies core reports and coordinates', async () => {
    const reports = await reportService.getAllReports();
    assert.ok(reports.length >= 5, `Expected at least 5 baseline reports, found ${reports.length}`);

    // Verify initial seed reports exist
    const rep1 = reports.find((r) => r.id === 'rep-1');
    assert.ok(rep1, 'rep-1 must be present in baseline dataset');
    assert.equal(rep1?.neighborhood, 'Jubilee Hills');

    // Verify scenario configuration coordinates are valid within Hyderabad
    assert.ok(isValidGlobalCoordinate(HYDERABAD_DEMO_SCENARIO.latitude, HYDERABAD_DEMO_SCENARIO.longitude));
    assert.ok(isInGeographicBounds(HYDERABAD_DEMO_SCENARIO.latitude, HYDERABAD_DEMO_SCENARIO.longitude));

    // Verify departments and staff
    const workOrders = operationsService.getWorkOrders();
    assert.ok(workOrders.length >= 3, 'Baseline work orders must be present');
  });

  it('Test 2: Duplicate prevention guard ensures clean baseline before scenario run', async () => {
    // Run duplicate prevention
    await demoScenarioService.preventDuplicates();
    const reports = await reportService.getAllReports();
    const scenarioReport = reports.find((r) => r.id === HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(scenarioReport, undefined, 'Scenario report should not exist before initialization');

    const status = await demoScenarioService.getScenarioStatus();
    assert.equal(status.isInitialized, false);
    assert.equal(status.currentStepNumber, 0);
  });

  it('Test 3: Step 1 & 2 - Citizen submission and dashboard reflection', async () => {
    const report = await demoScenarioService.step1_submitCitizenReport();
    assert.equal(report.id, HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(report.ticketNumber, HYDERABAD_DEMO_SCENARIO.ticketNumber);
    assert.equal(report.status, 'Submitted');
    assert.equal(report.severity, 'critical');
    assert.equal(report.neighborhood, 'Jubilee Hills');

    // Dashboard reflection check
    const check = await demoScenarioService.step2_verifyInDashboard();
    assert.equal(check.verified, true);
    assert.equal(check.report.ticketNumber, 'HYD-JH-2026-999');

    // Verify coordinate correctness
    assert.ok(isValidGlobalCoordinate(check.report.latitude!, check.report.longitude!));
    assert.ok(isInGeographicBounds(check.report.latitude!, check.report.longitude!));
  });

  it('Test 4: Step 3 - AI triage, severity, and SLA target calculation', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    const triage = await demoScenarioService.step3_aiTriageAndPriority();

    assert.equal(triage.category, 'Road damage');
    assert.equal(triage.severity, 'critical');
    assert.equal(triage.slaHours, 4, 'Critical hazard on arterial corridor must target 4h SLA');
  });

  it('Test 5: Step 4 - Community validation and worsening condition report', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    const valResult = await demoScenarioService.step4_communityValidation();

    assert.ok(valResult.confirmations >= 2, 'Should record at least 2 citizen confirmations');
    assert.equal(valResult.condition, 'getting_worse');

    const summary = communityValidationService.getCommunitySummary(HYDERABAD_DEMO_SCENARIO.reportId);
    assert.ok(summary.stillExists + summary.gettingWorse >= 2);
  });

  it('Test 6: Step 5 & 6 - Review queue elevation and work order dispatch to Roads dept', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    await demoScenarioService.step4_communityValidation();

    // Elevate to review queue
    const underReview = await demoScenarioService.step5_elevateToReviewQueue();
    assert.equal(underReview.status, 'Under Review');

    // Reviewer dispatches work order
    const wo = await demoScenarioService.step6_dispatchWorkOrder();
    assert.equal(wo.id, HYDERABAD_DEMO_SCENARIO.workOrderId);
    assert.equal(wo.departmentId, 'dept-roads');
    assert.equal(wo.assignedStaffId, 'staff-venkat');
    assert.equal(wo.priority, 'critical');

    // Check report status transitioned to Assigned
    const rep = await reportService.getReportById(HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(rep?.status, 'Assigned');
  });

  it('Test 7: Step 7 & 8 - Staff field execution and repair proof submission', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    await demoScenarioService.step4_communityValidation();
    await demoScenarioService.step5_elevateToReviewQueue();
    await demoScenarioService.step6_dispatchWorkOrder();

    // Field staff marks In Progress
    const inProgWo = await demoScenarioService.step7_advanceWorkOrderToInProgress();
    assert.equal(inProgWo.status, 'In Progress');

    const inProgRep = await reportService.getReportById(HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(inProgRep?.status, 'In Progress');

    // Field staff submits repair evidence
    const proofWo = await demoScenarioService.step8_submitRepairEvidence();
    assert.equal(proofWo.status, 'Submitted for Review');
    assert.ok(proofWo.completionEvidence?.afterPhotoUrl);
    assert.ok(proofWo.completionEvidence?.materialsUsed);
  });

  it('Test 8: Step 9 - Supervisor physical inspection and completion approval', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    await demoScenarioService.step4_communityValidation();
    await demoScenarioService.step5_elevateToReviewQueue();
    await demoScenarioService.step6_dispatchWorkOrder();
    await demoScenarioService.step7_advanceWorkOrderToInProgress();
    await demoScenarioService.step8_submitRepairEvidence();

    // Supervisor inspection approval
    const approvedWo = await demoScenarioService.step9_supervisorApproval();
    assert.equal(approvedWo.status, 'Completed');
    assert.ok(approvedWo.completionEvidence?.supervisorApprovedAt);

    // Synchronized report must be Resolved
    const rep = await reportService.getReportById(HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(rep?.status, 'Resolved');
  });

  it('Test 9: Step 10 - Citizen verification and 5-star resolution feedback', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    await demoScenarioService.step4_communityValidation();
    await demoScenarioService.step5_elevateToReviewQueue();
    await demoScenarioService.step6_dispatchWorkOrder();
    await demoScenarioService.step7_advanceWorkOrderToInProgress();
    await demoScenarioService.step8_submitRepairEvidence();
    await demoScenarioService.step9_supervisorApproval();

    // Citizen verification
    const citizenCheck = await demoScenarioService.step10_citizenVerification();
    assert.equal(citizenCheck.rating, 5);
    assert.equal(citizenCheck.completeness, 'fully_fixed');
    assert.equal(citizenCheck.verified, true);

    const feedback = transparencyService.getResolutionFeedback(HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(feedback.length, 1);
    assert.equal(feedback[0].rating, 5);
  });

  it('Test 10: Step 11 - Digital Twin simulation reflects spatial hazard elimination', async () => {
    await demoScenarioService.step1_submitCitizenReport();
    await demoScenarioService.step4_communityValidation();
    await demoScenarioService.step5_elevateToReviewQueue();
    await demoScenarioService.step6_dispatchWorkOrder();
    await demoScenarioService.step7_advanceWorkOrderToInProgress();
    await demoScenarioService.step8_submitRepairEvidence();
    await demoScenarioService.step9_supervisorApproval();
    await demoScenarioService.step10_citizenVerification();

    const sim = await demoScenarioService.step11_digitalTwinSimulation();
    assert.ok(sim.backlogReductionPercent >= 0);
    assert.ok(sim.projectedCompletionDays > 0);
    assert.ok(sim.criticalReductionPercent >= 0);
  });

  it('Test 11: Cross-module data consistency guarantees zero contradictory data points', async () => {
    // Run full scenario
    const runResult = await demoScenarioService.executeFullScenario();
    assert.equal(runResult.success, true);

    // Check cross-module consistency
    const consistency = await demoScenarioService.verifyCrossModuleConsistency();
    assert.equal(consistency.consistent, true, `Inconsistencies detected: ${consistency.discrepancies.join(', ')}`);
    assert.equal(consistency.discrepancies.length, 0);
    assert.equal(consistency.checkedFields.ticketMatch, true);
    assert.equal(consistency.checkedFields.statusMatch, true);
    assert.equal(consistency.checkedFields.coordinateValidity, true);
    assert.equal(consistency.checkedFields.departmentMatch, true);
  });

  it('Test 12: Safe, non-destructive reset restores baseline without touching unrelated data', async () => {
    // Run full scenario
    await demoScenarioService.executeFullScenario();

    const beforeResetReports = await reportService.getAllReports();
    assert.ok(beforeResetReports.some((r) => r.id === HYDERABAD_DEMO_SCENARIO.reportId));

    // Reset scenario
    const resetResult = await demoScenarioService.resetDemoScenario();
    assert.equal(resetResult.success, true);

    const afterResetReports = await reportService.getAllReports();
    const scenarioReport = afterResetReports.find((r) => r.id === HYDERABAD_DEMO_SCENARIO.reportId);
    assert.equal(scenarioReport, undefined, 'Scenario report must be safely removed on reset');

    // Verify baseline reports (rep-1 through rep-5) are 100% intact
    ['rep-1', 'rep-2', 'rep-3', 'rep-4', 'rep-5'].forEach((id) => {
      const exists = afterResetReports.some((r) => r.id === id);
      assert.ok(exists, `Baseline report ${id} must remain intact after reset`);
    });

    // Check scenario work order removed
    const wo = operationsService.getWorkOrders().find((w) => w.id === HYDERABAD_DEMO_SCENARIO.workOrderId);
    assert.equal(wo, undefined, 'Scenario work order must be cleanly removed on reset');

    // Baseline work orders intact
    assert.ok(operationsService.getWorkOrders().length >= 3, 'Baseline work orders must remain intact');
  });

  it('Test 13: Scenario repeatability guarantees repeated runs execute without duplicates', async () => {
    // Run 1
    const run1 = await demoScenarioService.executeFullScenario();
    assert.equal(run1.success, true);
    assert.equal(run1.report.ticketNumber, 'HYD-JH-2026-999');

    // Run 2 directly without manual reset (idempotency guard handles it)
    const run2 = await demoScenarioService.executeFullScenario();
    assert.equal(run2.success, true);
    assert.equal(run2.report.ticketNumber, 'HYD-JH-2026-999');

    // Confirm EXACTLY 1 instance exists in reports list (no duplicate tickets)
    const reports = await reportService.getAllReports();
    const matching = reports.filter((r) => r.ticketNumber === 'HYD-JH-2026-999');
    assert.equal(matching.length, 1, 'Should have exactly 1 ticket HYD-JH-2026-999, never duplicates');

    // Confirm EXACTLY 1 work order exists
    const wos = operationsService.getWorkOrders().filter((w) => w.reportTicketNumber === 'HYD-JH-2026-999');
    assert.equal(wos.length, 1, 'Should have exactly 1 work order for ticket HYD-JH-2026-999');
  });
});
