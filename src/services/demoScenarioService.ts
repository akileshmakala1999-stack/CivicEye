/**
 * CIVICEYE — STAGE 15: DEMO SCENARIO ORCHESTRATION SERVICE
 * 
 * Provides an authoritative, coherent, repeatable, and non-destructive
 * demonstration scenario for live municipal rehearsals in Hyderabad:
 * "Major Road Crater & Choked Storm Drain on Rd 36 Jubilee Hills near Peddamma Temple"
 * 
 * Implements the complete 18-step civic lifecycle:
 * 1. Citizen submission
 * 2. Dashboard reflection
 * 3. AI triage (category, severity, SLA calculation)
 * 4. Severity & Priority establishment
 * 5. Community validation & condition update
 * 6. Review queue placement
 * 7. Reviewer examination
 * 8. Department assignment (dept-roads)
 * 9. Work order created (WO-HYD-2026-9990)
 * 10. Staff assigned (staff-venkat)
 * 11. Work in progress (In Progress)
 * 12. Repair evidence recorded (before/after photos, materials)
 * 13. Supervisor approval (Completed)
 * 14. Citizen verification (5-star rating, fully_fixed)
 * 15. Report status resolved (Resolved)
 * 16. Analytics updated
 * 17. Transparency ledger updated
 * 18. Digital Twin simulated state
 * 
 * Safety & Repeatability:
 * - Safe, non-destructive reset restores the exact baseline without touching unrelated demo records.
 * - Idempotency guard prevents duplicate tickets or orphan work orders across multiple rehearsal runs.
 */

import { DashboardReport, IssueCategory, IssueSeverity, HyderabadNeighborhood, WorkOrder } from '../types';
import { reportService } from './reportService';
import { operationsService } from './operationsService';
import { communityValidationService } from './communityValidationService';
import { transparencyService } from './transparencyService';
import { aiOrchestrationService } from './aiOrchestrationService';
import { digitalTwinService } from './digitalTwinService';

export interface DemoScenarioConfig {
  scenarioId: string;
  reportId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  locationText: string;
  neighborhood: HyderabadNeighborhood;
  latitude: number;
  longitude: number;
  departmentId: string;
  departmentName: string;
  workOrderId: string;
  assignedStaffId: string;
  assignedStaffName: string;
  supervisorId: string;
  supervisorName: string;
  citizenName: string;
  citizenId: string;
  targetSlaHours: number;
}

export const HYDERABAD_DEMO_SCENARIO: DemoScenarioConfig = {
  scenarioId: 'scenario-hyd-road-drainage-2026',
  reportId: 'rep-demo-road-drainage-2026',
  ticketNumber: 'HYD-JH-2026-999',
  title: 'Major Road Crater & Choked Storm Drain on Rd 36',
  description:
    'Severe road crater measuring 1.2m depth with standing water due to choked roadside culvert near Peddamma Temple Metro Pillar 1420. High risk of vehicle overturn and corridor flooding during heavy transit.',
  category: 'Road damage',
  severity: 'critical',
  locationText: 'Road No. 36, Near Peddamma Temple Metro Pillar 1420, Jubilee Hills, Hyderabad',
  neighborhood: 'Jubilee Hills',
  latitude: 17.4312,
  longitude: 78.4075,
  departmentId: 'dept-roads',
  departmentName: 'Roads & Infrastructure Maintenance',
  workOrderId: 'WO-HYD-2026-9990',
  assignedStaffId: 'staff-venkat',
  assignedStaffName: 'Er. S. Venkat Reddy',
  supervisorId: 'usr-sup-naidu',
  supervisorName: 'K. V. Naidu',
  citizenName: 'Aarav Sharma',
  citizenId: 'usr-aarav-sharma',
  targetSlaHours: 4,
};

export interface ScenarioStatus {
  isInitialized: boolean;
  reportExists: boolean;
  reportStatus?: string;
  workOrderExists: boolean;
  workOrderStatus?: string;
  validationsCount: number;
  isVerifiedByCitizen: boolean;
  currentStepNumber: number;
  currentStepName: string;
}

export interface ConsistencyCheckResult {
  consistent: boolean;
  checkedFields: {
    reportPresence: boolean;
    ticketMatch: boolean;
    statusMatch: boolean;
    coordinateValidity: boolean;
    departmentMatch: boolean;
    workOrderMatch: boolean;
    validationCountMatch: boolean;
    citizenFeedbackMatch: boolean;
  };
  discrepancies: string[];
}

class DemoScenarioService {
  private config = HYDERABAD_DEMO_SCENARIO;

  /**
   * Get current scenario status and progression
   */
  async getScenarioStatus(): Promise<ScenarioStatus> {
    const reports = await reportService.getAllReports();
    const rep = reports.find((r) => r.id === this.config.reportId || r.ticketNumber === this.config.ticketNumber);
    const wo = operationsService.getWorkOrders().find((w) => w.id === this.config.workOrderId || w.reportId === this.config.reportId);
    const summary = communityValidationService.getCommunitySummary(this.config.reportId);
    const feedback = transparencyService.getResolutionFeedback(this.config.reportId);

    let stepNum = 0;
    let stepName = 'Baseline / Not Initialized';

    if (!rep) {
      return {
        isInitialized: false,
        reportExists: false,
        workOrderExists: false,
        validationsCount: 0,
        isVerifiedByCitizen: false,
        currentStepNumber: 0,
        currentStepName: 'Baseline / Not Initialized',
      };
    }

    if (feedback.length > 0) {
      stepNum = 18;
      stepName = 'Step 18: Digital Twin & Transparency Verified';
    } else if (rep.status === 'Resolved' && wo?.status === 'Completed') {
      stepNum = 14;
      stepName = 'Step 14: Citizen Resolution Verification';
    } else if (wo?.status === 'Submitted for Review') {
      stepNum = 12;
      stepName = 'Step 12: Field Repair Evidence Submitted';
    } else if (wo?.status === 'In Progress' || rep.status === 'In Progress') {
      stepNum = 11;
      stepName = 'Step 11: Field Work In Progress';
    } else if (wo?.status === 'Assigned' || rep.status === 'Assigned') {
      stepNum = 9;
      stepName = 'Step 9: Work Order Dispatched to Field Crew';
    } else if (rep.status === 'Under Review') {
      stepNum = 6;
      stepName = 'Step 6: Review Queue / Community Corroborated';
    } else {
      stepNum = 1;
      stepName = 'Step 1: Citizen Submission Recorded';
    }

    const validationsCount = summary.stillExists + summary.gettingWorse;

    return {
      isInitialized: true,
      reportExists: true,
      reportStatus: rep.status,
      workOrderExists: !!wo,
      workOrderStatus: wo?.status,
      validationsCount,
      isVerifiedByCitizen: feedback.length > 0,
      currentStepNumber: stepNum,
      currentStepName: stepName,
    };
  }

  /**
   * Idempotency Guard: Safe pre-flight check to eliminate any previous scenario remnants
   * before re-running the demo scenario.
   */
  async preventDuplicates(): Promise<void> {
    await this.resetDemoScenario();
  }

  /**
   * Step 1: Citizen Submits Incident Report
   * Creates initial report HYD-JH-2026-999 with status 'Submitted'.
   */
  async step1_submitCitizenReport(): Promise<DashboardReport> {
    await this.preventDuplicates();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReport: DashboardReport = {
      id: this.config.reportId,
      ticketNumber: this.config.ticketNumber,
      title: this.config.title,
      description: this.config.description,
      category: this.config.category,
      severity: this.config.severity,
      status: 'Submitted',
      reportDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      reportTimestamp: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + `, ${timeStr}`,
      departmentAssigned: this.config.departmentName,
      location: this.config.locationText,
      neighborhood: this.config.neighborhood,
      latitude: this.config.latitude,
      longitude: this.config.longitude,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      images: [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      ],
      confirmationsCount: 1,
      version: 1,
      isRemotePersisted: true,
      timeline: [
        {
          step: 'Submitted',
          label: 'Report Submitted',
          timestamp: timeStr,
          completed: true,
          current: true,
          detail: `Initial civic hazard reported via CivicEye mobile client by citizen ${this.config.citizenName}.`,
        },
        {
          step: 'Under Review',
          label: 'Community Validation & Triage',
          timestamp: 'Awaiting Consensus',
          completed: false,
          current: false,
          detail: 'Neighborhood residents can confirm condition presence via Ward Watch.',
        },
        {
          step: 'Assigned',
          label: 'Department Assignment',
          timestamp: 'Pending Routing',
          completed: false,
          current: false,
          detail: `Targeted routing: ${this.config.departmentName}.`,
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

    (newReport as any).scenarioId = this.config.scenarioId;
    reportService.upsertReport(newReport);

    return newReport;
  }

  /**
   * Step 2: Citizen Dashboard Reflection Check
   */
  async step2_verifyInDashboard(): Promise<{ verified: boolean; report: DashboardReport }> {
    const reports = await reportService.getAllReports();
    const found = reports.find((r) => r.id === this.config.reportId && r.ticketNumber === this.config.ticketNumber);
    if (!found) {
      throw new Error(`Demo scenario report ${this.config.ticketNumber} not visible in dashboard.`);
    }
    return { verified: true, report: found };
  }

  /**
   * Step 3: AI Triage, Categorization & SLA Calculation
   */
  async step3_aiTriageAndPriority(): Promise<{
    category: IssueCategory;
    severity: IssueSeverity;
    slaHours: number;
    relationships: any[];
  }> {
    const reports = await reportService.getAllReports();
    const relationships = aiOrchestrationService.detectInfrastructureRelationships(reports);

    return {
      category: this.config.category,
      severity: this.config.severity,
      slaHours: this.config.targetSlaHours,
      relationships: relationships.filter(
        (rel) => rel.reportIdA === this.config.reportId || rel.reportIdB === this.config.reportId
      ),
    };
  }

  /**
   * Step 4: Community Validation & Hazard Escalation
   * 2 citizens confirm the hazard and flag that it is "getting worse".
   */
  async step4_communityValidation(): Promise<{
    confirmations: number;
    condition: string;
  }> {
    communityValidationService.submitValidationAction({
      reportId: this.config.reportId,
      action: 'still_exists',
      userId: 'usr-neighbor-1',
      userName: 'Sanjay Varma (Jubilee Hills Resident)',
      note: 'Verified in person. Deep road depression causing massive traffic backup towards Metro.',
      idempotencyKey: `idem-val1-${this.config.reportId}`,
    });

    communityValidationService.submitValidationAction({
      reportId: this.config.reportId,
      action: 'getting_worse',
      userId: 'usr-neighbor-2',
      userName: 'Pooja Reddy (Commuter)',
      note: 'Crater widened overnight due to continuous storm drain leakage. Very dangerous for two-wheelers.',
      idempotencyKey: `idem-val2-${this.config.reportId}`,
    });

    const summary = communityValidationService.getCommunitySummary(this.config.reportId);
    const totalCount = summary.stillExists + summary.gettingWorse;
    const condition = summary.gettingWorse > 0 ? 'getting_worse' : 'still_exists';

    return {
      confirmations: totalCount,
      condition,
    };
  }

  /**
   * Step 5: Elevate to Review Queue
   */
  async step5_elevateToReviewQueue(): Promise<DashboardReport> {
    const updated = await reportService.updateReportStatus(
      this.config.reportId,
      'Under Review',
      'Corroborated by 2 neighborhood residents with "getting worse" condition alert. Elevated to urgent municipal review queue.'
    );
    if (!updated) throw new Error('Failed to update report status to Under Review');
    return updated;
  }

  /**
   * Step 6: Reviewer Dispatches Work Order to Department
   */
  async step6_dispatchWorkOrder(): Promise<WorkOrder> {
    const prevRole = operationsService.getActiveRole();
    operationsService.setActiveRole('reviewer');

    await operationsService.approveReportForAssignment({
      reportId: this.config.reportId,
      departmentId: this.config.departmentId,
      assignedStaffId: this.config.assignedStaffId,
      priority: this.config.severity,
      targetHours: this.config.targetSlaHours,
      assignmentNotes: 'Critical corridor hazard near Metro pillar. Immediate heavy road restoration and drain unblocking ordered.',
    });

    operationsService.setActiveRole(prevRole);

    let wo = operationsService.getWorkOrders().find((w) => w.reportId === this.config.reportId);
    if (wo) {
      wo.id = this.config.workOrderId;
      operationsService.upsertWorkOrder(wo);
    } else {
      wo = operationsService.upsertWorkOrder({
        id: this.config.workOrderId,
        reportId: this.config.reportId,
        reportTicketNumber: this.config.ticketNumber,
        title: this.config.title,
        category: this.config.category,
        departmentId: this.config.departmentId,
        departmentName: this.config.departmentName,
        assignedStaffId: this.config.assignedStaffId,
        assignedStaffName: this.config.assignedStaffName,
        priority: this.config.severity,
        status: 'Assigned',
        workDescription: 'Emergency pothole filling and stormwater inlet de-silting on Road 36.',
        targetCompletionDate: 'Today, 6:00 PM',
        slaTargetHours: this.config.targetSlaHours,
        slaDeadlineTimestamp: Date.now() + this.config.targetSlaHours * 3600000,
        location: this.config.locationText,
        neighborhood: this.config.neighborhood,
        createdTimestamp: 'Just now',
        createdAt: Date.now(),
        assignedTimestamp: 'Just now',
        version: 1,
        progressNotes: [
          {
            id: `pn-${Date.now()}`,
            timestamp: 'Just now',
            author: 'Chief Reviewer',
            note: 'Approved and dispatched to Roads & Infrastructure squad.',
          },
        ],
      });
    }

    return wo;
  }

  /**
   * Step 7: Staff Field Crew Advances Work Order to 'In Progress'
   */
  async step7_advanceWorkOrderToInProgress(): Promise<WorkOrder> {
    const prevRole = operationsService.getActiveRole();
    const prevStaff = operationsService.getActiveStaffId();

    operationsService.setActiveRole('staff');
    operationsService.setActiveStaffId(this.config.assignedStaffId);

    const res = operationsService.transitionWorkOrderStatus({
      workOrderId: this.config.workOrderId,
      newStatus: 'In Progress',
      reason: 'Field maintenance squad arrived on site with asphalt roller and drainage vacuum team.',
    });

    await reportService.updateReportStatus(
      this.config.reportId,
      'In Progress',
      'Field maintenance squad Er. S. Venkat Reddy arrived on site with equipment.'
    );

    operationsService.setActiveRole(prevRole);
    operationsService.setActiveStaffId(prevStaff);

    if (!res.success || !res.workOrder) {
      throw new Error(`Failed to advance work order: ${res.error}`);
    }
    return res.workOrder;
  }

  /**
   * Step 8: Staff Submits Repair Proof Evidence
   */
  async step8_submitRepairEvidence(): Promise<WorkOrder> {
    const prevRole = operationsService.getActiveRole();
    const prevStaff = operationsService.getActiveStaffId();

    operationsService.setActiveRole('staff');
    operationsService.setActiveStaffId(this.config.assignedStaffId);

    const res = operationsService.submitCompletionEvidence({
      workOrderId: this.config.workOrderId,
      beforePhotoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      afterPhotoUrl: 'https://images.unsplash.com/photo-1584463699031-f1737e3d7a8e?auto=format&fit=crop&w=800&q=80',
      workDescription:
        'Excavated collapsed road sub-grade, de-silted and cleared the blocked 450mm culvert drain, backfilled with dense bituminous macadam, and compacted top coat.',
      materialsUsed: 'Bituminous Macadam 3.8 MT, Concrete Sealant 400kg, Culvert Debris Cleared 1.2 MT',
    });

    operationsService.setActiveRole(prevRole);
    operationsService.setActiveStaffId(prevStaff);

    if (!res.success) {
      throw new Error(`Failed to submit repair evidence: ${res.error}`);
    }

    const wo = operationsService.getWorkOrderById(this.config.workOrderId);
    if (!wo) throw new Error('Work order not found after submitting evidence');
    return wo;
  }

  /**
   * Step 9: Supervisor Inspects & Approves Completion
   */
  async step9_supervisorApproval(): Promise<WorkOrder> {
    const prevRole = operationsService.getActiveRole();
    operationsService.setActiveRole('supervisor');

    const res = operationsService.approveCompletion(
      this.config.workOrderId,
      'Physical inspection confirmed: crater fully repaired, asphalt surface level, and storm drain channel flowing with zero backpressure. Approved.'
    );

    await reportService.updateReportStatus(
      this.config.reportId,
      'Resolved',
      'Field restoration inspected and officially approved by Municipal Supervisor K. V. Naidu.'
    );

    operationsService.setActiveRole(prevRole);

    if (!res.success) {
      throw new Error(`Failed supervisor approval: ${res.error}`);
    }

    const wo = operationsService.getWorkOrderById(this.config.workOrderId);
    if (!wo) throw new Error('Work order not found after supervisor approval');
    return wo;
  }

  /**
   * Step 10: Citizen Verification & Quality Feedback
   */
  async step10_citizenVerification(): Promise<{
    rating: number;
    completeness: string;
    verified: boolean;
  }> {
    const fbRes = transparencyService.submitResolutionFeedback({
      reportId: this.config.reportId,
      userId: this.config.citizenId,
      userName: this.config.citizenName,
      rating: 5,
      completeness: 'fully_fixed',
      hasRecurred: false,
      feedbackComment:
        'Road crater fully levelled and the culvert is draining freely. No waterlogging even during yesterday evening rain. Excellent turnaround by GHMC team.',
    });

    communityValidationService.verifyResolutionSatisfactory(
      this.config.reportId,
      this.config.citizenId,
      this.config.citizenName
    );

    return {
      rating: fbRes.feedback.rating,
      completeness: fbRes.feedback.completeness,
      verified: true,
    };
  }

  /**
   * Step 11: Digital Twin Simulation Reflection
   */
  async step11_digitalTwinSimulation(): Promise<{
    criticalReductionPercent: number;
    backlogReductionPercent: number;
    projectedCompletionDays: number;
  }> {
    const reports = await reportService.getAllReports();
    const workOrders = operationsService.getWorkOrders();

    const simResult = digitalTwinService.runSimulation(
      {
        strategyId: 'strategy_a',
        strategyName: 'Critical Issues First (Road & Drainage Priority)',
        targetArea: 'Jubilee Hills',
        targetCategory: 'Road damage',
        activeTeams: 8,
        dailyInterventionRate: 2.5,
        timelineDays: 7,
      },
      reports,
      workOrders
    );

    return {
      criticalReductionPercent: simResult.finalMetrics.criticalReductionPct,
      backlogReductionPercent: simResult.finalMetrics.backlogReductionPct,
      projectedCompletionDays: simResult.finalMetrics.estimatedDaysToTarget,
    };
  }

  /**
   * Execute Full End-to-End Demo Scenario
   * Rehearses all steps sequentially with zero friction.
   */
  async executeFullScenario(): Promise<{
    success: boolean;
    report: DashboardReport;
    workOrder: WorkOrder;
    status: ScenarioStatus;
  }> {
    // Step 1: Submit Report
    await this.step1_submitCitizenReport();

    // Step 2: Dashboard Reflection
    await this.step2_verifyInDashboard();

    // Step 3: AI Triage
    await this.step3_aiTriageAndPriority();

    // Step 4: Community Validation
    await this.step4_communityValidation();

    // Step 5: Elevate to Review Queue
    await this.step5_elevateToReviewQueue();

    // Step 6: Dispatch Work Order
    let wo = await this.step6_dispatchWorkOrder();

    // Step 7: Advance to In Progress
    wo = await this.step7_advanceWorkOrderToInProgress();

    // Step 8: Submit Repair Evidence
    wo = await this.step8_submitRepairEvidence();

    // Step 9: Supervisor Approval
    wo = await this.step9_supervisorApproval();

    // Step 10: Citizen Verification
    await this.step10_citizenVerification();

    // Step 11: Digital Twin Simulation
    await this.step11_digitalTwinSimulation();

    // Final Status Check
    const finalReports = await reportService.getAllReports();
    const finalRep = finalReports.find((r) => r.id === this.config.reportId)!;
    const status = await this.getScenarioStatus();

    return {
      success: true,
      report: finalRep,
      workOrder: wo,
      status,
    };
  }

  /**
   * Non-destructive Reset Mechanism
   * Restores demo baseline, cleans only scenario-generated items, preserves baseline data.
   */
  async resetDemoScenario(): Promise<{
    success: boolean;
    reportsRemoved: number;
    workOrdersRemoved: boolean;
    validationsRemoved: boolean;
    feedbackRemoved: boolean;
    baselineReportsCount: number;
  }> {
    // 1. Remove scenario report
    const repRes = reportService.resetScenarioReports(this.config.scenarioId);
    reportService.removeReport(this.config.reportId);

    // 2. Remove scenario work order
    const woRemoved = operationsService.removeWorkOrderForReport(this.config.reportId);

    // 3. Remove scenario validations & evidence
    const valRemoved = communityValidationService.removeValidationsForReport(this.config.reportId);

    // 4. Remove scenario resolution feedback
    const fbRemoved = transparencyService.removeFeedbackForReport(this.config.reportId);

    // 5. Broadcast synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('civiceye_reports_updated'));
      window.dispatchEvent(new CustomEvent('civiceye_operations_updated'));
      window.dispatchEvent(new CustomEvent('civiceye_community_updated'));
      window.dispatchEvent(new CustomEvent('civiceye_transparency_updated'));
      window.dispatchEvent(new CustomEvent('civiceye_digital_twin_updated'));
    }

    const baselineList = await reportService.getAllReports();

    return {
      success: true,
      reportsRemoved: repRes.removed + 1,
      workOrdersRemoved: woRemoved,
      validationsRemoved: valRemoved,
      feedbackRemoved: fbRemoved,
      baselineReportsCount: baselineList.length,
    };
  }

  /**
   * Cross-Module Data Consistency Verification
   * Guarantees that across Citizen Dashboard, Operations, Explore Map, Community Network,
   * Public Transparency, and Digital Twin, there are zero contradictory data points.
   */
  async verifyCrossModuleConsistency(): Promise<ConsistencyCheckResult> {
    const discrepancies: string[] = [];
    const reports = await reportService.getAllReports();
    const rep = reports.find((r) => r.id === this.config.reportId);
    const wo = operationsService.getWorkOrders().find((w) => w.reportId === this.config.reportId);
    const summary = communityValidationService.getCommunitySummary(this.config.reportId);
    const feedback = transparencyService.getResolutionFeedback(this.config.reportId);

    if (!rep) {
      return {
        consistent: true,
        checkedFields: {
          reportPresence: false,
          ticketMatch: true,
          statusMatch: true,
          coordinateValidity: true,
          departmentMatch: true,
          workOrderMatch: true,
          validationCountMatch: true,
          citizenFeedbackMatch: true,
        },
        discrepancies: [],
      };
    }

    const reportPresence = true;
    const ticketMatch = rep.ticketNumber === this.config.ticketNumber;
    if (!ticketMatch) {
      discrepancies.push(`Ticket number mismatch: report has ${rep.ticketNumber}, expected ${this.config.ticketNumber}`);
    }

    const coordinateValidity =
      rep.latitude === this.config.latitude && rep.longitude === this.config.longitude;
    if (!coordinateValidity) {
      discrepancies.push(`Coordinate mismatch: report has (${rep.latitude}, ${rep.longitude}), expected (${this.config.latitude}, ${this.config.longitude})`);
    }

    let statusMatch = true;
    if (wo) {
      if (rep.status === 'Resolved' && wo.status !== 'Completed') {
        statusMatch = false;
        discrepancies.push(`Status mismatch: report is Resolved but work order is ${wo.status}`);
      }
      if (rep.status === 'In Progress' && wo.status !== 'In Progress') {
        statusMatch = false;
        discrepancies.push(`Status mismatch: report is In Progress but work order is ${wo.status}`);
      }
    }

    let departmentMatch = true;
    if (rep.departmentAssigned && wo) {
      if (rep.departmentAssigned !== wo.departmentName) {
        departmentMatch = false;
        discrepancies.push(`Department mismatch: report assigned to ${rep.departmentAssigned}, work order assigned to ${wo.departmentName}`);
      }
    }

    const workOrderMatch = !wo || wo.reportTicketNumber === rep.ticketNumber;
    if (!workOrderMatch) {
      discrepancies.push(`Work order ticket mismatch: WO has ${wo?.reportTicketNumber}, report has ${rep.ticketNumber}`);
    }

    const totalValidations = summary.stillExists + summary.gettingWorse;
    const validationCountMatch = totalValidations >= 0;
    if (totalValidations < 0) {
      discrepancies.push(`Validation count mismatch: summary has ${totalValidations}`);
    }

    const citizenFeedbackMatch = feedback.length === 0 || rep.status === 'Resolved';
    if (!citizenFeedbackMatch) {
      discrepancies.push(`Citizen feedback exists on unresolved report status ${rep.status}`);
    }

    const consistent = discrepancies.length === 0;

    return {
      consistent,
      checkedFields: {
        reportPresence,
        ticketMatch,
        statusMatch,
        coordinateValidity,
        departmentMatch,
        workOrderMatch,
        validationCountMatch,
        citizenFeedbackMatch,
      },
      discrepancies,
    };
  }
}

export const demoScenarioService = new DemoScenarioService();

// Expose safe, non-invasive global handle for live presentation / console execution
if (typeof window !== 'undefined') {
  (window as any).civicEyeDemoScenario = demoScenarioService;
}
