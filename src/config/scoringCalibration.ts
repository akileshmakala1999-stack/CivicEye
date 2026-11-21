import {
  CalibrationStatus,
  CascadeLinkCertainty,
  DashboardReport,
} from '../types';

/**
 * ==============================================================================
 * SIMULATION SCORING CALIBRATION & FACTOR REGISTRY
 * Phase 10.2: Transparent Calibration Status & Model Assumption Accountability
 * ==============================================================================
 *
 * CALIBRATION CLASSIFICATION RULES:
 * 1. DATA-DERIVED: Directly computed from verified report fields (e.g. confirmations, timestamps).
 * 2. RULE-BASED: Computed using documented deterministic business logic (e.g. municipal severity matrix).
 * 3. MODEL ASSUMPTION: Uses heuristic constants, thresholds, or uncalibrated crew parameters.
 * 4. EMPIRICALLY CALIBRATED: ONLY used when tested against ground-truth municipal historical outcomes.
 */

export interface ScoringFactorSpec {
  factorId: string;
  name: string;
  purpose: string;
  inputData: string;
  formula: string;
  normalizationRange: [number, number];
  calibrationStatus: CalibrationStatus;
  assumptions: string[];
  limitations: string[];
}

export const SCORING_FACTORS_SPEC: Record<string, ScoringFactorSpec> = {
  hazard_severity: {
    factorId: 'hazard_severity',
    name: 'Hazard Severity Index',
    purpose: 'Prioritizes immediate physical risks to public health and safety.',
    inputData: 'report.severity (critical, high, medium, low)',
    formula: 'critical=100, high=75, medium=50, low=25',
    normalizationRange: [25, 100],
    calibrationStatus: 'RULE-BASED',
    assumptions: ['Standard GHMC 4-tier incident triage classification matrix.'],
    limitations: ['Subject to citizen initial severity perception until triage inspection.'],
  },
  risk_score: {
    factorId: 'risk_score',
    name: 'AI Risk & Infrastructure Vulnerability',
    purpose: 'Assesses multi-modal vulnerability combining image, text, and environmental risk.',
    inputData: 'report.riskScore (0-100)',
    formula: 'Math.min(100, Math.max(0, report.riskScore || severityFallback))',
    normalizationRange: [0, 100],
    calibrationStatus: 'DATA-DERIVED',
    assumptions: ['Risk engine evaluates multi-modal evidence and proximity factors.'],
    limitations: ['Confidence bounded when photographic evidence is missing.'],
  },
  spatial_density: {
    factorId: 'spatial_density',
    name: 'Cluster Concentration Density',
    purpose: 'Prioritizes issues clustered in geographic proximity for route efficiency.',
    inputData: 'Spatial cluster membership & hotspot radius count',
    formula: 'isHotspot ? min(100, 50 + count * 5) : 20',
    normalizationRange: [20, 100],
    calibrationStatus: 'DATA-DERIVED',
    assumptions: ['Spatial co-location suggests shared environmental or subgrade strain.'],
    limitations: ['Clusters reflect reporting volume which may be higher in dense wards.'],
  },
  recurrence: {
    factorId: 'recurrence',
    name: 'Chronic Recurrence Score',
    purpose: 'Identifies systemic faults that repeatedly fail post-repair.',
    inputData: 'report.isRecurring, historical neighborhood cluster frequency',
    formula: 'HistoricalRepeat: 50 + min(40, count * 10); BooleanFlag: 80; Isolated: 15',
    normalizationRange: [15, 90],
    calibrationStatus: 'MODEL ASSUMPTION',
    assumptions: [
      'Model Assumption: Persistent recurring defects represent structural subgrade failure rather than cosmetic damage.',
    ],
    limitations: [
      'Multi-year historical work order ledger is not integrated; single-season reports use heuristic assumption.',
    ],
  },
  community_impact: {
    factorId: 'community_impact',
    name: 'Citizen Validation Signal',
    purpose: 'Measures human impact through community confirmations and escalation flags.',
    inputData: 'confirmationsCount, gettingWorseCount',
    formula: 'min(100, confirmations * 8 + gettingWorse * 15)',
    normalizationRange: [0, 100],
    calibrationStatus: 'DATA-DERIVED',
    assumptions: ['Community engagement correlates with user-facing inconvenience and pedestrian traffic.'],
    limitations: ['Varies by neighborhood digital connectivity.'],
  },
  backlog_age: {
    factorId: 'backlog_age',
    name: 'Backlog Aging Priority',
    purpose: 'Prevents low/medium issues from starving indefinitely in the queue.',
    inputData: 'report.createdAt timestamp',
    formula: 'min(100, max(5, round((ageDays / timelineDays) * 100)))',
    normalizationRange: [5, 100],
    calibrationStatus: 'DATA-DERIVED',
    assumptions: ['Linear escalation of priority as ticket approaches configured planning horizon.'],
    limitations: ['Does not differentiate cosmetic aging from structural aging.'],
  },
  cascade_potential: {
    factorId: 'cascade_potential',
    name: 'Infrastructure Cascade Potential',
    purpose: 'Evaluates risk of upstream fault triggering secondary infrastructure collapse.',
    inputData: 'Upstream water/drainage proximity to roadbed or electrical assets',
    formula: 'recorded=90, data_supported=75, hypothetical=45, isolated=10',
    normalizationRange: [10, 90],
    calibrationStatus: 'MODEL ASSUMPTION',
    assumptions: [
      'Model Assumption: Water leakage within 300m of road failure causes subgrade erosion leading to asphalt collapse.',
    ],
    limitations: ['Proximity does not prove hydraulic continuity without subsurface utility maps.'],
  },
  crew_effort: {
    factorId: 'crew_effort',
    name: 'Modeled Municipal Crew Effort',
    purpose: 'Limits daily resolution capacity by team-shifts instead of count of tickets.',
    inputData: 'category, severity',
    formula: 'baseShifts(severity) * categoryModifier',
    normalizationRange: [0.4, 1.8],
    calibrationStatus: 'MODEL ASSUMPTION',
    assumptions: [
      'Model Assumption: A critical road collapse requires ~1.5 team-shifts with 20% trenching overhead; a streetlight requires ~0.4.',
    ],
    limitations: ['Weather, traffic stoppage, and parts availability can alter actual team productivity.'],
  },
};

/**
 * Computes recurrence score with explicit calibration status.
 * Dynamically evaluates historical neighborhood density if candidate list is available.
 */
export function computeRecurrenceScore(
  report: DashboardReport,
  candidatePool: DashboardReport[] = []
): { score: number; status: CalibrationStatus; reason: string } {
  // Check if historical repeat occurrences exist in candidate dataset
  const sameCategoryInWard = candidatePool.filter(
    (r) =>
      r.id !== report.id &&
      r.category === report.category &&
      r.neighborhood === report.neighborhood
  );

  if (sameCategoryInWard.length >= 2) {
    const dynamicScore = Math.min(90, 50 + sameCategoryInWard.length * 10);
    return {
      score: dynamicScore,
      status: 'DATA-DERIVED',
      reason: `Data-Derived: ${sameCategoryInWard.length} corroborating ${report.category} defects recorded in ${report.neighborhood} corridor.`,
    };
  }

  if (report.isRecurring || report.tags?.includes('recurring')) {
    return {
      score: 80,
      status: 'MODEL ASSUMPTION',
      reason: 'Model Assumption: Citizen-flagged recurring defect without multi-year longitudinal audit.',
    };
  }

  return {
    score: 15,
    status: 'MODEL ASSUMPTION',
    reason: 'Model Assumption: Single isolated occurrence baseline.',
  };
}

/**
 * Computes cascade score with explicit certainty and calibration status.
 */
export function computeCascadeScore(
  isCascadeRoot: boolean,
  certainty: CascadeLinkCertainty = 'data_supported'
): { score: number; status: CalibrationStatus; reason: string } {
  if (!isCascadeRoot) {
    return {
      score: 10,
      status: 'MODEL ASSUMPTION',
      reason: 'Model Assumption: No upstream dependency link detected.',
    };
  }

  switch (certainty) {
    case 'recorded':
      return {
        score: 90,
        status: 'RULE-BASED',
        reason: 'Rule-Based: Empirically documented causal infrastructure link.',
      };
    case 'data_supported':
      return {
        score: 75,
        status: 'MODEL ASSUMPTION',
        reason: 'Model Assumption: Spatial proximity (<300m) between pressurized utility and roadbed subgrade.',
      };
    case 'hypothetical':
    case 'ai_inference':
    default:
      return {
        score: 45,
        status: 'MODEL ASSUMPTION',
        reason: 'Model Assumption: Hypothetical secondary infrastructure cascade.',
      };
  }
}
