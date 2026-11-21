export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'reviewed' | 'assigned' | 'in_progress' | 'resolved' | 'verified';

export type DashboardReportStatus = 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved';

// ==========================================
// Phase 6: Municipal Operations & Resolution
// ==========================================
export type OperationalRole =
  | 'citizen'
  | 'reviewer'
  | 'staff'
  | 'dispatcher'
  | 'supervisor'
  | 'admin';

export type WorkOrderStatus =
  | 'Pending Assignment'
  | 'Assigned'
  | 'Accepted'
  | 'In Progress'
  | 'Blocked'
  | 'Submitted for Review'
  | 'Returned for Rework'
  | 'Completed'
  | 'Cancelled';

export interface WorkOrderCompletionEvidence {
  beforePhotoUrl?: string;
  afterPhotoUrl: string;
  workDescription: string;
  materialsUsed?: string;
  completedAt: string;
  submittedByStaffName: string;
  submittedByStaffId: string;
  supervisorNotes?: string;
  supervisorApprovedAt?: string;
}

export interface WorkOrderProgressNote {
  id: string;
  timestamp: string;
  author: string;
  note: string;
  photoUrl?: string;
}

export interface WorkOrder {
  id: string; // e.g. WO-HYD-2026-0811
  reportId: string;
  reportTicketNumber: string;
  title: string;
  category: IssueCategory;
  departmentId: string;
  departmentName: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  priority: IssueSeverity;
  status: WorkOrderStatus;
  workDescription: string;
  targetCompletionDate: string;
  slaTargetHours: number;
  slaDeadlineTimestamp: number;
  location: string;
  neighborhood: HyderabadNeighborhood;
  createdTimestamp: string;
  createdAt: number;
  assignedTimestamp?: string;
  startedTimestamp?: string;
  blockedTimestamp?: string;
  blockedReason?: string;
  completedTimestamp?: string;
  completionEvidence?: WorkOrderCompletionEvidence;
  reworkNotes?: string;
  cancellationReason?: string;
  progressNotes: WorkOrderProgressNote[];
}

export interface OperationsAuditLog {
  id: string;
  timestamp: string;
  createdAt: number;
  actorId: string;
  actorName: string;
  actorRole: OperationalRole;
  action:
    | 'report_reviewed'
    | 'report_approved'
    | 'report_rejected'
    | 'report_reclassified'
    | 'work_order_created'
    | 'work_order_assigned'
    | 'work_order_reassigned'
    | 'work_order_accepted'
    | 'work_order_started'
    | 'work_order_blocked'
    | 'work_order_resumed'
    | 'evidence_submitted'
    | 'completion_approved'
    | 'rework_returned'
    | 'work_order_cancelled';
  entityType: 'report' | 'work_order';
  entityId: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface OperationalStaffMember {
  id: string;
  name: string;
  role: OperationalRole;
  departmentId: string;
  departmentName: string;
  title: string;
  activeWorkload: number;
  completedTasks: number;
  phone: string;
  status: 'available' | 'on_site' | 'off_duty';
}

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  headOfficer: string;
  contactNumber: string;
  defaultSlaHours: Record<IssueSeverity, number>;
  activeWorkload: number;
  completedWorkCount: number;
  onTimePercentage: number;
}

export type CommunityValidationAction =
  | 'still_exists'
  | 'getting_worse'
  | 'appears_fixed'
  | 'incorrect_report';

export type IssueConditionType =
  | 'Unchanged'
  | 'Deteriorated'
  | 'Partially Repaired'
  | 'Hazard Cleared';

export type ActivityEventType =
  | 'report_submitted'
  | 'community_confirmation'
  | 'issue_worsening'
  | 'evidence_added'
  | 'report_resolved'
  | 'resolution_challenged'
  | 'reopened_verification';

export interface CommunityValidationRecord {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userRole: 'citizen' | 'authority';
  action: CommunityValidationAction;
  timestamp: string;
  createdAt: number;
  note?: string;
  evidencePhotoUrl?: string;
}

export interface AdditionalEvidenceRecord {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  photoUrl?: string;
  description: string;
  condition: IssueConditionType;
  locationNote?: string;
  timestamp: string;
  createdAt: number;
}

export interface CommunityActivityEvent {
  id: string;
  reportId: string;
  eventType: ActivityEventType;
  actorType: 'citizen' | 'community' | 'official' | 'ai';
  actorName: string;
  title: string;
  description: string;
  timestamp: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface ResolutionVerificationInfo {
  reportId: string;
  isChallenged: boolean;
  challengedAt?: string;
  challengeReason?: string;
  challengePhotoUrl?: string;
  challengedBy?: string;
  confirmedFixedCount: number;
  challengeCount: number;
  reopenedForReview?: boolean;
}

export type IssueCategory =
  | 'Road damage'
  | 'Drainage'
  | 'Garbage'
  | 'Streetlights'
  | 'Water leakage'
  | 'Damaged footpaths'
  | 'Electrical Hazard'
  | 'Fallen Tree'
  | 'Public Safety'
  | 'Accessibility'
  | 'Water Supply'
  | 'Other';

export type HyderabadNeighborhood = 'Jubilee Hills' | 'Banjara Hills' | 'Madhapur' | 'Gachibowli' | 'Kondapur' | 'Begumpet';

export interface CivicIssue {
  id: string;
  title: string;
  category: IssueCategory;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
    mapXPercent: number;
    mapYPercent: number;
  };
  status: IssueStatus;
  severity: IssueSeverity;
  peopleImpactScore?: number;
  reportedTime: string;
  confirmationsCount: number;
  hasUserConfirmed?: boolean;
  description: string;
  departmentAssigned?: string;
  assignedOfficer?: string;
  resolvedTime?: string;
  imageUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  reportedBy?: string;
  duplicateCandidateOf?: string;
}

export interface TimelineEvent {
  step: DashboardReportStatus;
  label: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
  detail?: string;
}

export interface DashboardReport {
  id: string;
  ticketNumber: string;
  title: string;
  category: IssueCategory;
  reportDate: string;
  reportTimestamp: string;
  location: string;
  neighborhood: HyderabadNeighborhood;
  severity: IssueSeverity;
  status: DashboardReportStatus;
  confirmationsCount: number;
  description: string;
  departmentAssigned: string;
  handlingOfficer?: string;
  thumbnailUrl?: string;
  images?: string[];
  evidenceNote?: string;
  latitude?: number;
  longitude?: number;
  isRemotePersisted?: boolean;
  timeline: TimelineEvent[];
  // Phase 5: Community Validation & Collective Evidence
  stillExistsCount?: number;
  gettingWorseCount?: number;
  appearsFixedCount?: number;
  incorrectReportCount?: number;
  resolutionStatus?: ResolutionVerificationInfo;
  additionalEvidence?: AdditionalEvidenceRecord[];
  userValidationAction?: CommunityValidationAction | null;
  createdAt?: string;
  riskScore?: number;
  priorityScore?: number;
  isRecurring?: boolean;
  isChallenged?: boolean;
  tags?: string[];
}

export interface NearbyCommunityIssue {
  id: string;
  title: string;
  category: IssueCategory;
  approximateLocation: string;
  neighborhood: HyderabadNeighborhood;
  severity: IssueSeverity;
  status: DashboardReportStatus;
  confirmationsCount: number;
  reportedTime: string;
  description: string;
  actionTaken?: 'still_exists' | 'getting_worse' | null;
}

export interface CommunityActivityItem {
  id: string;
  description: string;
  relatedIssue: string;
  time: string;
  neighborhood: HyderabadNeighborhood;
  activityType: 'new_report' | 'confirmation' | 'status_change' | 'resolved' | 'evidence';
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'status_update' | 'assignment' | 'confirmation' | 'resolution' | 'advisory';
  relatedReportId?: string;
}

export interface CivicStatistic {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  suffix?: string;
  changeRate?: string;
  description: string;
}

export interface HotspotCluster {
  id: string;
  title: string;
  category: IssueCategory;
  incidentCount: number;
  timeframe: string;
  neighborhood: string;
  description: string;
  riskLevel: 'moderate' | 'elevated' | 'high';
}

export interface ResolutionStory {
  id: string;
  title: string;
  category: IssueCategory;
  location: string;
  duration: string;
  verifiedByCount: number;
  resolvedDate: string;
  summary: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'citizen' | 'authority' | 'reviewer' | 'staff' | 'supervisor' | 'admin';
  operationalRole?: OperationalRole;
  title?: string;
  department?: string;
  trustScore: number;
  ward: string;
  reportsSubmitted: number;
  confirmationsGiven: number;
  verificationsCompleted: number;
}

// ==========================================
// Phase 7: Citywide Civic Intelligence
// ==========================================
export type HotspotClassification = 'Low' | 'Moderate' | 'High' | 'Critical';
export type EarlyWarningRiskLevel = 'Watch' | 'Elevated' | 'High Risk';

export interface HotspotData {
  id: string;
  title: string;
  primaryCategory: IssueCategory;
  categories: { category: IssueCategory; count: number }[];
  incidentCount: number;
  activeCount: number;
  resolvedCount: number;
  recurringCount: number;
  neighborhood: HyderabadNeighborhood;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  hotspotScore: number; // 0-100
  classification: HotspotClassification;
  trendText: string;
  oldestUnresolvedDays: number;
  communityCitations: number;
  preventiveRecommendation: string;
  recommendedDepartment: string;
  reportIds: string[];
}

export interface RecurringProblem {
  id: string;
  location: string;
  neighborhood: HyderabadNeighborhood;
  category: IssueCategory;
  occurrenceCount: number;
  firstReportDate: string;
  latestReportDate: string;
  avgRecurrenceIntervalDays: number;
  previousResolutionsCount: number;
  currentStatus: DashboardReportStatus;
  reportIds: string[];
  associatedWorkOrderIds: string[];
  rootCauseHypothesis: string;
}

export interface EarlyWarningSignal {
  id: string;
  title: string;
  location: string;
  neighborhood: HyderabadNeighborhood;
  category: IssueCategory;
  level: EarlyWarningRiskLevel;
  incidentCount: number;
  velocityIncreasePercent: number;
  timeframe: string;
  reason: string;
  confidenceScore: number;
  linkedReportIds: string[];
  preventiveAction: string;
}

export interface WardComparisonMetric {
  ward: HyderabadNeighborhood;
  totalReports: number;
  activeReports: number;
  criticalReports: number;
  recurringReports: number;
  resolutionRate: number;
  avgResolutionHours: number;
  overdueCount: number;
  communityEngagementScore: number;
  dominantCategory: IssueCategory;
}

export interface TemporalTrendPoint {
  dateLabel: string;
  incoming: number;
  resolved: number;
  backlog: number;
}

// ==========================================
// Phase 8: Civic Trust, Transparency & Accountability
// ==========================================
export interface PublicLifecycleEvent {
  id: string;
  reportId: string;
  eventType: string;
  stepNumber: number;
  label: string;
  actorTitle: string;
  timestamp: string;
  detail: string;
  status: 'completed' | 'current' | 'pending';
  evidencePhotoUrl?: string;
  isPublic: boolean;
}

export interface PublicReportStatusExplanation {
  status: DashboardReportStatus | 'Approved' | 'BLOCKED' | 'COMPLETION SUBMITTED' | 'AWAITING CITIZEN VERIFICATION' | 'REOPENED';
  title: string;
  description: string;
  nextAction: string;
  estimatedWindow?: string;
  color: string;
}

export interface ResolutionQualityFeedback {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5 stars
  completeness: 'fully_fixed' | 'partially_fixed' | 'still_broken' | 'worsened';
  hasRecurred: boolean;
  feedbackComment?: string;
  evidencePhotoUrl?: string;
  submittedAt: string;
  createdAt: number;
}

export interface DepartmentPerformanceMetric {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  reportsReceived: number;
  reportsReviewed: number;
  reportsAssigned: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  overdueCount: number;
  avgReviewHours: number;
  avgAssignmentHours: number;
  avgResolutionHours: number;
  citizenVerificationRate: number; // percentage
  reworkRate: number; // percentage
  reopenedCount: number;
  onTimePercentage: number;
  dataSufficiency: 'High' | 'Moderate' | 'Limited Data (Demo Calibration)';
  topCategory: IssueCategory;
}

export interface ResponseTimeIntervalMetric {
  stageKey: string;
  fromStage: string;
  toStage: string;
  avgHours: number;
  medianHours: number;
  fastestHours: number;
  slowestHours: number;
  completedSamplesCount: number;
  ongoingCount: number;
  dataSufficiencyNote: string;
}

export interface TransparencyScorecardItem {
  key: string;
  indicator: string;
  score: number; // 0-100
  benchmarkTarget: string;
  formula: string;
  sampleCount: number;
  description: string;
  status: 'optimal' | 'acceptable' | 'needs_attention';
}

export interface PublicAuditRecord {
  id: string;
  timestamp: string;
  createdAt: number;
  actorRole: OperationalRole;
  actorDisplayTitle: string; // Sanitized public title (e.g. "Roads Field Squad Lead")
  actionLabel: string;
  entityType: 'report' | 'work_order';
  entityTicket: string;
  previousState?: string;
  newState?: string;
  publicExplanation?: string;
  departmentName?: string;
}

export interface PublicAccountabilityReport {
  id: string;
  title: string;
  periodLabel: string;
  reportType: 'weekly' | 'monthly' | 'department_audit' | 'citizen_verification';
  generatedDate: string;
  totalIntake: number;
  resolvedCount: number;
  verificationRate: number;
  slaAdherenceRate: number;
  topHazardWards: string[];
  highlights: string[];
  keyGapsIdentified: string[];
}

// ==========================================
// Phase 9: AI Multi-Agency Orchestration & Decision Support
// ==========================================

export type InfrastructureRelationshipType =
  | 'Possible shared cause'
  | 'Spatially related'
  | 'Temporally related'
  | 'Recurring issue'
  | 'Infrastructure dependency'
  | 'Unconfirmed relationship';

export interface InfrastructureRelationship {
  id: string;
  reportIdA: string;
  reportIdB: string;
  classification: InfrastructureRelationshipType;
  confidence: number;
  distanceMeters: number;
  explanation: string;
  detectedAt: string;
}

export type MultiAgencyProposalStatus =
  | 'AI Proposed'
  | 'Awaiting Human Review'
  | 'Approved'
  | 'Rejected'
  | 'Planning'
  | 'In Progress'
  | 'Blocked'
  | 'Completed'
  | 'Cancelled';

export interface SupportingDepartmentInvolvement {
  departmentId: string;
  departmentName: string;
  reason: string;
  dependencyOrder: number;
  riskIfDelayed: string;
  requiredEvidence: string;
  status: 'pending' | 'acknowledged' | 'active' | 'cleared' | 'blocked';
}

export interface CoordinationApprovalEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: OperationalRole;
  action:
    | 'proposed'
    | 'reviewed'
    | 'approved'
    | 'rejected'
    | 'modified'
    | 'status_changed'
    | 'note_added';
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
}

export interface MultiAgencyCoordinationPlan {
  id: string;
  primaryReportId: string;
  primaryReportTicket: string;
  relatedReportIds: string[];
  title: string;
  primaryDepartmentId: string;
  primaryDepartmentName: string;
  supportingDepartments: SupportingDepartmentInvolvement[];
  recommendedSequence: string[];
  proposedNextActions: string[];
  aiConfidence: number;
  priority: IssueSeverity;
  status: MultiAgencyProposalStatus;
  targetTimelineHours: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  auditTrail: CoordinationApprovalEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface PreventiveCivicAction {
  id: string;
  patternTitle: string;
  problemPattern: string;
  evidenceSummary: string;
  relatedReportIds: string[];
  trendPeriod: string;
  potentialImpact: string;
  suggestedAction: string;
  recommendedDepartmentId: string;
  recommendedDepartmentName: string;
  confidence: number;
  limitations: string[];
  status: 'proposed' | 'reviewed' | 'scheduled' | 'dismissed';
  createdAt: string;
}

export interface OperationsDecisionRecommendation {
  id: string;
  type:
    | 'critical_investigation'
    | 'hotspot_mitigation'
    | 'cross_dept_coordination'
    | 'incomplete_resolution_audit'
    | 'accessibility_priority'
    | 'workload_balancing';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  recommendation: string;
  whyRecommended: string;
  supportingData: string;
  impactIfDelayed: string;
  confidence: number;
  limitations: string[];
  suggestedAction: string;
  targetDepartmentId?: string;
  relatedReportId?: string;
  relatedWorkOrderId?: string;
}

export interface EvidenceComparisonResult {
  reportId: string;
  hasBeforePhoto: boolean;
  hasAfterPhoto: boolean;
  isAvailable: boolean;
  visibleDifferences: string[];
  improvementStatus:
    | 'substantially_improved'
    | 'partially_improved'
    | 'defect_still_visible'
    | 'inconclusive'
    | 'unavailable';
  summary: string;
  confidence: number;
  limitations: string[];
  locationMatchConfidence: number;
}

export interface GroundedAiGrounding {
  supportingReportIds: string[];
  dataSource: string;
  dateRangeAnalyzed: string;
  recordsAnalyzedCount: number;
  confidenceLevel: number;
  limitations: string[];
  tag: 'official_record' | 'citizen_reported' | 'ai_inference';
  suggestedActions?: string[];
  insufficientData?: boolean;
}

export interface GroundedAiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  grounding?: GroundedAiGrounding;
}

export interface NaturalLanguageFilterResult {
  rawQuery: string;
  interpretedFilters: {
    category?: string;
    status?: string;
    neighborhood?: string;
    severity?: string;
    minBlockedDays?: number;
    isRecurring?: boolean;
    isChallenged?: boolean;
    departmentId?: string;
  };
  appliedFilterLabels: string[];
  matchedReports: DashboardReport[];
  explanation: string;
}

// ==========================================
// Phase 10: Civic Digital Twin & City Simulation Engine
// ==========================================

export type DigitalTwinLayerId =
  | 'all_reports'
  | 'active_issues'
  | 'critical_risk'
  | 'civic_hotspots'
  | 'recurring_issues'
  | 'work_orders'
  | 'community_signals'
  | 'infrastructure_relationships'
  | 'resolved_issues'
  | 'risk_density'
  | 'department_activity'
  | 'multi_agency_zones';

export interface DigitalTwinLayerConfig {
  id: DigitalTwinLayerId;
  name: string;
  category: 'base' | 'risk' | 'operations' | 'coordination';
  description: string;
  color: string;
  icon: string;
  count: number;
  isEnabled: boolean;
  isDefault: boolean;
}

export interface SpatialDensityCell {
  id: string;
  gridX: number;
  gridY: number;
  centerLat: number;
  centerLng: number;
  reportCount: number;
  criticalCount: number;
  recurringCount: number;
  reportDensity: number; // 0 to 1 normalized
  riskDensity: number; // 0 to 1 normalized based on severity weights
  dominantCategory: IssueCategory;
  dominantNeighborhood: HyderabadNeighborhood;
}

export type SimulationStrategyId =
  | 'strategy_a' // Critical Issues First
  | 'strategy_b' // Hotspot Reduction
  | 'strategy_c' // Recurring Issue Prevention
  | 'strategy_d' // Community Impact
  | 'strategy_e' // Balanced Prioritization
  | 'strategy_f'; // Custom Weights

export interface SimulationWeights {
  riskWeight: number; // 0-100
  densityWeight: number; // 0-100
  recurrenceWeight: number; // 0-100
  communityWeight: number; // 0-100
  ageWeight: number; // 0-100
  costWeight: number; // 0-100
}

export interface SimulationParameters {
  strategyId: SimulationStrategyId;
  strategyName: string;
  targetArea: string; // 'citywide' or specific neighborhood
  targetCategory: string; // 'all' or specific category
  activeTeams: number; // 1 to 25
  dailyInterventionRate: number; // 1.0 to 5.0 issues per team/day
  timelineDays: number; // 7, 14, or 30 days
  customWeights?: SimulationWeights;
}

export interface SimulationStepResult {
  day: number; // 0, 1, 3, 7, 14, 30
  addressedCumulative: number;
  remainingBacklog: number;
  criticalRemaining: number;
  criticalResolved: number;
  cascadingAvoided: number;
  capacityUtilizationPct: number;
  projectedSatisfactionIndex: number; // 0-100
}

export interface SimulationCategoryDelta {
  initial: number;
  resolved: number;
  remaining: number;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  label: string;
  isApproximate: boolean;
}

export type CoordinateAccuracyLevel =
  | 'verified_gps'
  | 'approximate_centroid'
  | 'ward_centroid_approximation'
  | 'user_selected_approximate'
  | 'location_unavailable'
  | 'invalid_coordinates'
  | 'missing';

export type CalibrationStatus =
  | 'DATA-DERIVED'
  | 'RULE-BASED'
  | 'MODEL ASSUMPTION'
  | 'EMPIRICALLY CALIBRATED';

export type CascadeLinkCertainty = 'recorded' | 'data_supported' | 'ai_inference' | 'hypothetical';

export interface PrioritizationFactorContribution {
  factorName: string;
  rawValue: string | number;
  normalizedValue: number; // 0-100
  weightPct: number;
  weightedScore: number;
  calibrationStatus: CalibrationStatus;
  assumptionNote?: string;
}

export interface PrioritizationReason {
  reportId: string;
  ticketNumber: string;
  rank: number;
  normalizedScore: number;
  primaryCalibrationStatus?: CalibrationStatus;
  factorContributions?: PrioritizationFactorContribution[];
  topContributingFactors: string[];
  estimatedEffortShifts: number;
  department: string;
}

export interface SimulationResult {
  id: string;
  scenarioName: string;
  createdAt: string;
  parameters: SimulationParameters;
  baselineSummary: {
    totalIssues: number;
    criticalCount: number;
    hotspotCount: number;
    recurringCount: number;
    averageRiskScore: number;
    datasetFingerprint: string;
    totalReportsWithGps: number;
    reportsWithoutGps: number;
    reportsOutsideViewport?: number;
  };
  timeline: SimulationStepResult[];
  finalMetrics: {
    totalAddressed: number;
    criticalReductionPct: number;
    backlogReductionPct: number;
    cascadingHazardsPrevented: number;
    resourceEfficiencyScore: number;
    estimatedDaysToTarget: number;
    citizenSatisfactionScore: number;
    totalEffortConsumedShifts?: number;
    totalAvailableShifts?: number;
  };
  prioritizedReportIds: string[];
  resolvedReportIdsByDay: Record<number, string[]>;
  categoryBreakdown: Record<string, SimulationCategoryDelta>;
  tradeoffsExplanation: string[];
  groundedExplanation: {
    summary: string;
    keyStrengths: string[];
    vulnerabilities: string[];
    assumptions: string[];
    disclaimer: string;
  };
  explainabilityAudit?: {
    datasetSampleSize: number;
    totalReportsEvaluated: number;
    reportsWithGps: number;
    reportsOutsideViewport: number;
    reportsMissingCoordinates: number;
    effortModelAssumptions: {
      criticalEffortShifts: number;
      highEffortShifts: number;
      mediumEffortShifts: number;
      lowEffortShifts: number;
    };
    totalCapacityShifts: number;
    totalCapacityConsumedShifts: number;
    prioritizationReasons: PrioritizationReason[];
  };
}

export interface CascadingImpactNode {
  id: string;
  reportId: string;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  stage: 1 | 2 | 3 | 4; // 1: Root Fault, 2: Ground Erosion, 3: Road Subsidence, 4: Gridlock/Hazard
  stageLabel: string;
  probabilityOfChainReaction: number; // percentage
  avoidableIfAddressedWithinDays: number;
  dependentReportIds: string[];
  certainty?: CascadeLinkCertainty;
}

export interface CascadingDependencyChain {
  chainId: string;
  rootReportId: string;
  corridorName: string;
  neighborhood: HyderabadNeighborhood;
  nodes: CascadingImpactNode[];
  estimatedEscalationCostMultiplier: number;
  linkCertainty?: CascadeLinkCertainty;
  preventionStatus: 'pending' | 'partially_mitigated' | 'avoided';
  isEmpiricallyDerived?: boolean;
  multiplierAssumptionNote?: string;
}

export interface SavedSimulationScenario {
  id: string;
  name: string;
  description: string;
  createdByRole: OperationalRole;
  createdAt: string;
  datasetFingerprint: string;
  parameters: SimulationParameters;
  result: SimulationResult;
  isPublished?: boolean;
  publishedAt?: string;
  publishedBy?: string;
}




