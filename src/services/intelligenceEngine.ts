import {
  DashboardReport,
  IssueCategory,
  IssueSeverity,
  NearbyCommunityIssue,
} from '../types';

export interface FactorBreakdown {
  name: string;
  weightPercent: number;
  contributedPoints: number;
  evidence: string;
}

export interface DuplicateMatch {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  location: string;
  distanceMeters?: number;
  similarityPercent: number;
  similarityReason: string;
  confirmationsCount: number;
  status: string;
}

export interface ReportIntelligence {
  reportId: string;
  detectedIssueType: string;
  suggestedCategory: IssueCategory;
  citizenSeverity: IssueSeverity;
  aiAssessedRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number; // 0-100
  civicPriorityScore: number; // 0-100
  publicSafetyConcern: string;
  accessibilityImpact: string;
  potentialPublicImpact: string;
  suggestedDepartment: string;
  alternativeDepartment?: string;
  departmentReason: string;
  departmentConfidence: number;
  recommendedAction: string;
  confidenceLevel: number;
  reasoning: string;
  missingInformation: string[];
  evidenceLimitations: string[];
  factors: FactorBreakdown[];
  whatCouldChangeScore: string[];
  duplicateMatches: DuplicateMatch[];
  analysisTimestamp: string;
  analysisSource: 'ai_cloud' | 'heuristic_deterministic';
}

// In-memory cache to avoid repeated AI / computation calls for unchanged reports
const intelligenceCache = new Map<string, ReportIntelligence>();

export const intelligenceEngine = {
  /**
   * Performs structured civic intelligence analysis on a report
   */
  async analyzeReport(
    report: DashboardReport,
    allReports: (DashboardReport | NearbyCommunityIssue)[] = []
  ): Promise<ReportIntelligence> {
    const cacheKey = `${report.id}-${report.severity}-${report.confirmationsCount}-${report.status}-${report.title}`;
    if (intelligenceCache.has(cacheKey)) {
      return intelligenceCache.get(cacheKey)!;
    }

    // 1. Calculate Deterministic Risk Score (0-100)
    const { riskScore, riskLevel, riskFactors } = calculateRiskScore(report);

    // 2. Calculate Deterministic Civic Priority Score (0-100)
    const { priorityScore, priorityFactors, whatCouldChange } = calculatePriorityScore(
      report,
      riskScore
    );

    // 3. Department Recommendation
    const departmentInfo = recommendDepartment(report.category, report.title, report.description);

    // 4. Duplicate / Similarity Detection
    const duplicateMatches = detectDuplicates(report, allReports);

    // 5. Evidence Limitations and Missing Information
    const { missingInformation, evidenceLimitations } = assessEvidenceQuality(report);

    // 6. Public Impact Assessment
    const impactInfo = assessImpacts(report);

    const intelligence: ReportIntelligence = {
      reportId: report.id,
      detectedIssueType: `${report.category} • ${report.title.split(' ')[0] || 'Infrastructure'} Anomaly`,
      suggestedCategory: report.category,
      citizenSeverity: report.severity,
      aiAssessedRisk: riskLevel,
      riskScore,
      civicPriorityScore: priorityScore,
      publicSafetyConcern: impactInfo.safetyConcern,
      accessibilityImpact: impactInfo.accessibilityImpact,
      potentialPublicImpact: impactInfo.publicImpact,
      suggestedDepartment: departmentInfo.primary,
      alternativeDepartment: departmentInfo.alternative,
      departmentReason: departmentInfo.reason,
      departmentConfidence: departmentInfo.confidence,
      recommendedAction: getRecommendedAction(riskLevel, report.category),
      confidenceLevel: report.thumbnailUrl || (report.images && report.images.length > 0) ? 0.94 : 0.78,
      reasoning: generateReasoning(report, riskLevel, riskScore, priorityScore),
      missingInformation,
      evidenceLimitations,
      factors: [...riskFactors, ...priorityFactors],
      whatCouldChangeScore: whatCouldChange,
      duplicateMatches,
      analysisTimestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      analysisSource: 'heuristic_deterministic',
    };

    intelligenceCache.set(cacheKey, intelligence);
    return intelligence;
  },

  /**
   * Invalidate cache to force re-analysis
   */
  clearCacheForReport(reportId: string): void {
    for (const key of intelligenceCache.keys()) {
      if (key.startsWith(reportId)) {
        intelligenceCache.delete(key);
      }
    }
  },
};

/**
 * Deterministic Risk Scoring Model (0-100)
 * Evaluates physical hazard potential, structural severity, and safety concerns.
 */
function calculateRiskScore(report: DashboardReport): {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskFactors: FactorBreakdown[];
} {
  // A. Severity Baseline (Weight: 35%)
  let severityScore = 20;
  if (report.severity === 'critical') severityScore = 95;
  else if (report.severity === 'high') severityScore = 75;
  else if (report.severity === 'medium') severityScore = 45;
  const severityPoints = Math.round(severityScore * 0.35);

  // B. Safety Hazard Potential (Weight: 25%)
  let hazardScore = 45;
  const cat = report.category;
  if (cat === 'Electrical Hazard' || cat === 'Water leakage' || cat === 'Road damage') {
    hazardScore = report.severity === 'critical' ? 95 : 80;
  } else if (cat === 'Drainage' || cat === 'Public Safety' || cat === 'Fallen Tree') {
    hazardScore = 75;
  } else if (cat === 'Damaged footpaths' || cat === 'Streetlights') {
    hazardScore = 60;
  }
  const hazardPoints = Math.round(hazardScore * 0.25);

  // C. Accessibility Impact (Weight: 15%)
  let accessScore = 40;
  if (cat === 'Damaged footpaths' || cat === 'Accessibility' || cat === 'Road damage') {
    accessScore = 80;
  }
  const accessPoints = Math.round(accessScore * 0.15);

  // D. Physical Evidence Reliability (Weight: 15%)
  let evidenceScore = 50;
  const hasPhoto = report.thumbnailUrl || (report.images && report.images.length > 0);
  const hasGPS = report.latitude && report.longitude;
  if (hasPhoto && hasGPS) evidenceScore = 90;
  else if (hasPhoto || hasGPS) evidenceScore = 70;
  else evidenceScore = 40;
  const evidencePoints = Math.round(evidenceScore * 0.15);

  // E. Corridor Impact (Weight: 10%)
  const loc = (report.location || '').toLowerCase();
  let corridorScore = 50;
  if (loc.includes('road no') || loc.includes('junction') || loc.includes('metro') || loc.includes('corr')) {
    corridorScore = 85;
  }
  const corridorPoints = Math.round(corridorScore * 0.1);

  const rawScore = severityPoints + hazardPoints + accessPoints + evidencePoints + corridorPoints;
  const riskScore = Math.min(98, Math.max(12, rawScore));

  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'moderate';
  if (riskScore >= 80) riskLevel = 'critical';
  else if (riskScore >= 65) riskLevel = 'high';
  else if (riskScore >= 40) riskLevel = 'moderate';
  else riskLevel = 'low';

  const riskFactors: FactorBreakdown[] = [
    {
      name: 'Reported Physical Severity',
      weightPercent: 35,
      contributedPoints: severityPoints,
      evidence: `Classified as ${report.severity.toUpperCase()} by reporting citizen.`,
    },
    {
      name: 'Hazard & Secondary Risk Type',
      weightPercent: 25,
      contributedPoints: hazardPoints,
      evidence: `${cat} condition exhibits active collision, erosion, or trip hazards.`,
    },
    {
      name: 'Pedestrian & Mobility Vulnerability',
      weightPercent: 15,
      contributedPoints: accessPoints,
      evidence: `Sidewalk and carriage lane access impediment factor.`,
    },
    {
      name: 'Evidence Reliability Baseline',
      weightPercent: 15,
      contributedPoints: evidencePoints,
      evidence: hasPhoto ? 'Geotagged photographic documentation present.' : 'Photographic verification pending.',
    },
  ];

  return { riskScore, riskLevel, riskFactors };
}

/**
 * Deterministic Civic Priority Scoring Model (0-100)
 * Evaluates queue urgency for municipal dispatch based on risk, community validation, corridor importance, and time.
 */
function calculatePriorityScore(
  report: DashboardReport,
  riskScore: number
): {
  priorityScore: number;
  priorityFactors: FactorBreakdown[];
  whatCouldChange: string[];
} {
  // 1. Risk Score Foundation (Weight: 40%)
  const riskPoints = Math.round(riskScore * 0.4);

  // 2. Community Validations Consensus (Weight: 30%)
  const count = report.confirmationsCount || 0;
  let validationScore = 25;
  if (count >= 25) validationScore = 95;
  else if (count >= 15) validationScore = 85;
  else if (count >= 5) validationScore = 70;
  else if (count >= 1) validationScore = 45;
  const validationPoints = Math.round(validationScore * 0.3);

  // 3. Transit Corridor Criticality (Weight: 20%)
  const loc = (report.location || '').toLowerCase();
  let transitScore = 45;
  if (loc.includes('metro') || loc.includes('junction') || loc.includes('flyover') || loc.includes('road no. 36')) {
    transitScore = 90;
  } else if (loc.includes('road') || loc.includes('avenue') || loc.includes('enclosure')) {
    transitScore = 65;
  }
  const transitPoints = Math.round(transitScore * 0.2);

  // 4. SLA Age & Turnaround Urgency (Weight: 10%)
  let ageScore = 55;
  if (report.status === 'Submitted') ageScore = 65;
  else if (report.status === 'In Progress') ageScore = 80;
  const agePoints = Math.round(ageScore * 0.1);

  // Phase 5: Community Deterioration Escalation Boost
  let worseningBoost = 0;
  if (report.gettingWorseCount && report.gettingWorseCount > 0) {
    worseningBoost = Math.min(15, report.gettingWorseCount * 6);
  }
  if (report.resolutionStatus?.isChallenged) {
    worseningBoost += 12;
  }

  const rawPriority = riskPoints + validationPoints + transitPoints + agePoints + worseningBoost;
  const priorityScore = Math.min(99, Math.max(15, rawPriority));

  const priorityFactors: FactorBreakdown[] = [
    {
      name: 'Physical Risk Foundation',
      weightPercent: 40,
      contributedPoints: riskPoints,
      evidence: `Weighted from calculated 0-100 risk score of ${riskScore}.`,
    },
    {
      name: 'Ward Community Validations',
      weightPercent: 30,
      contributedPoints: validationPoints + worseningBoost,
      evidence: worseningBoost > 0
        ? `${count} confirmations, including ${report.gettingWorseCount || 0} worsening flags and resolution challenges (+${worseningBoost} boost).`
        : `${count} neighborhood residents validated this hazard on site.`,
    },
    {
      name: 'Transit Corridor Criticality',
      weightPercent: 20,
      contributedPoints: transitPoints,
      evidence: `Location profile: ${report.location}.`,
    },
    {
      name: 'SLA Escalation Window',
      weightPercent: 10,
      contributedPoints: agePoints,
      evidence: `Current workflow phase: ${report.status}.`,
    },
  ];

  const whatCouldChange: string[] = [
    `+5 community confirmations will increase priority score by ~6-8 points.`,
    `A report of condition "Getting Worse" activates emergency escalation.`,
    `Attaching additional geotagged field photos increases evidence confidence to 98%.`,
    `Formal municipal work order issuance advances status to "In Progress".`,
  ];

  return { priorityScore, priorityFactors, whatCouldChange };
}

/**
 * Recommends municipal department and alternative
 */
function recommendDepartment(
  category: IssueCategory,
  title: string,
  desc: string
): {
  primary: string;
  alternative?: string;
  reason: string;
  confidence: number;
} {
  const t = (title + ' ' + desc).toLowerCase();

  switch (category) {
    case 'Road damage':
      return {
        primary: 'GHMC Engineering (Roads & Bridges)',
        alternative: 'Hyderabad Traffic Police (Traffic Management Wing)',
        reason: 'Bituminous surface breakdown and vehicular carriage way depression requires civil road engineering overlay.',
        confidence: 0.96,
      };

    case 'Water leakage':
    case 'Water Supply':
      return {
        primary: 'HMWSSB (Water Supply & Sewerage Board)',
        alternative: 'GHMC Engineering (Road Restoration Wing)',
        reason: 'Pressurized potable drinking water pipeline joint defect under municipal water board purview.',
        confidence: 0.98,
      };

    case 'Garbage':
      return {
        primary: 'GHMC Solid Waste Management (Sanitation)',
        alternative: 'Zonal Health & Sanitation Inspection Desk',
        reason: 'Uncontained solid waste accumulation exceeding container volume threshold.',
        confidence: 0.95,
      };

    case 'Streetlights':
    case 'Electrical Hazard':
      return {
        primary: 'GHMC Electrical & Public Lighting Wing',
        alternative: 'TSSPDCL Power Distribution Corporation',
        reason: t.includes('transformer') || t.includes('high tension')
          ? 'High-voltage grid distribution transformer falls under TSSPDCL power mandate.'
          : 'Street fixture illumination failure across public thoroughfare.',
        confidence: 0.93,
      };

    case 'Damaged footpaths':
    case 'Accessibility':
      return {
        primary: 'GHMC Town Planning & Sidewalk Maintenance',
        alternative: 'Zonal Road Infrastructure Maintenance Division',
        reason: 'Pedestrian sidewalk pavers, curb ramps, or missing chamber cover requires pedestrian pathway remediation.',
        confidence: 0.92,
      };

    case 'Drainage':
      return {
        primary: 'GHMC Stormwater Drainage & Flood Control',
        alternative: 'HMWSSB Sewerage Operations',
        reason: 'Culvert siltation and stormwater runoff channel overflow.',
        confidence: 0.94,
      };

    case 'Fallen Tree':
      return {
        primary: 'GHMC Urban Biodiversity & Disaster Management',
        alternative: 'GHMC Traffic & Roads Emergency Squad',
        reason: 'Heavy branch / tree fallen across carriage road requires urban forestry emergency clearance.',
        confidence: 0.97,
      };

    default:
      return {
        primary: 'GHMC General Civic Maintenance Desk',
        alternative: 'Zonal Grievance Redressal Cell',
        reason: 'General civic infrastructure condition logged for administrative triage routing.',
        confidence: 0.85,
      };
  }
}

/**
 * Detects possible duplicate/similar reports using distance, category, and text similarity
 */
function detectDuplicates(
  target: DashboardReport,
  candidates: (DashboardReport | NearbyCommunityIssue)[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const targetTitle = (target.title || '').toLowerCase();
  const targetDesc = (target.description || '').toLowerCase();

  for (const item of candidates) {
    if (item.id === target.id) continue;

    let distance: number | undefined;
    let distanceScore = 0;

    // Check coordinates if both present
    if (target.latitude && target.longitude && 'latitude' in item && item.latitude && item.longitude) {
      distance = Math.round(
        calculateDistance(target.latitude, target.longitude, item.latitude, item.longitude)
      );
      if (distance < 150) distanceScore = 50;
      else if (distance < 350) distanceScore = 35;
      else if (distance < 600) distanceScore = 15;
    }

    // Category match
    const categoryMatch = target.category === item.category ? 30 : 0;

    // Text token match
    const itemTitle = (item.title || '').toLowerCase();
    const words1 = targetTitle.split(/\s+/).filter((w) => w.length > 3);
    const sharedWords = words1.filter((w) => itemTitle.includes(w) || targetDesc.includes(w));
    const textScore = Math.min(25, sharedWords.length * 10);

    const totalSimilarity = distanceScore + categoryMatch + textScore;

    // If similarity threshold >= 55%, flag as possible duplicate match
    if (totalSimilarity >= 55) {
      let reason = 'Same issue category and matching street vicinity';
      if (distance !== undefined) {
        reason = `Located ~${distance}m away with matching ${target.category.toLowerCase()} category`;
      } else if (sharedWords.length > 0) {
        reason = `Matching keywords ("${sharedWords.join(', ')}") in same ward`;
      }

      matches.push({
        id: item.id,
        ticketNumber: 'ticketNumber' in item ? item.ticketNumber : `HYD-${item.id.toUpperCase()}`,
        title: item.title,
        category: item.category,
        location: 'approximateLocation' in item ? item.approximateLocation : item.location,
        distanceMeters: distance,
        similarityPercent: Math.min(95, totalSimilarity),
        similarityReason: reason,
        confirmationsCount: item.confirmationsCount,
        status: item.status,
      });
    }
  }

  return matches.slice(0, 2);
}

/**
 * Assesses missing information and evidence limitations
 */
function assessEvidenceQuality(report: DashboardReport): {
  missingInformation: string[];
  evidenceLimitations: string[];
} {
  const missingInformation: string[] = [];
  const evidenceLimitations: string[] = [];

  const hasPhoto = report.thumbnailUrl || (report.images && report.images.length > 0);
  const hasGPS = report.latitude && report.longitude;

  if (!hasPhoto) {
    missingInformation.push('No photographic evidence attached to verify physical defect dimensions.');
    evidenceLimitations.push('Assessment derived from citizen description without optical verification.');
  } else {
    evidenceLimitations.push('Photo captures surface appearance; subsurface foundation status unverified.');
  }

  if (!hasGPS) {
    missingInformation.push('Exact GPS latitude/longitude unavailable; relying on approximate street address.');
    evidenceLimitations.push('Spatial proximity radius comparison disabled due to missing coordinates.');
  }

  if (report.description.length < 25) {
    missingInformation.push('Brief description; lack of depth, duration, or traffic flow impact details.');
  }

  if (report.confirmationsCount === 0 || report.confirmationsCount === 1) {
    missingInformation.push('Single citizen observation; awaiting secondary neighbor confirmations.');
  }

  return { missingInformation, evidenceLimitations };
}

/**
 * Assesses public safety, accessibility, and public transit impacts
 */
function assessImpacts(report: DashboardReport): {
  safetyConcern: string;
  accessibilityImpact: string;
  publicImpact: string;
} {
  const cat = report.category;
  const isHigh = report.severity === 'critical' || report.severity === 'high';

  let safetyConcern = 'Low immediate physical risk under normal operating conditions.';
  let accessibilityImpact = 'Minor impediment to regular pedestrian passage.';
  let publicImpact = 'Localized neighborhood inconvenience.';

  if (cat === 'Road damage') {
    safetyConcern = isHigh
      ? 'Severe collision, tire puncture, and two-wheeler loss-of-balance risk in active vehicular lane.'
      : 'Vehicular slowing and minor ride discomfort.';
    accessibilityImpact = 'Forces two-wheelers and cyclists onto lane edges or pedestrian pathways.';
    publicImpact = 'Slows peak commuter transit flow; creates sudden braking hazards.';
  } else if (cat === 'Water leakage') {
    safetyConcern = 'Pressurized water jet erodes bituminous road sub-base, creating sinkhole risk.';
    accessibilityImpact = 'Street waterlogging prevents safe pedestrian curbside walking.';
    publicImpact = 'Potable municipal water loss and localized carriage road flooding.';
  } else if (cat === 'Garbage') {
    safetyConcern = 'Sanitation hazard attracting stray dogs and rodents onto active thoroughfare.';
    accessibilityImpact = 'Sidewalk obstructed for 10-15 meters, forcing pedestrians into vehicular road.';
    publicImpact = 'Aesthetic degradation, foul odor, and environmental hygiene hazard.';
  } else if (cat === 'Streetlights') {
    safetyConcern = 'Nighttime visibility zero for pedestrians, cyclists, and stationary road obstacles.';
    accessibilityImpact = 'Unlit walkways pose severe hazard for seniors and night-shift commuters.';
    publicImpact = 'Heightens corridor transit vulnerability and safety perception.';
  } else if (cat === 'Damaged footpaths' || cat === 'Accessibility') {
    safetyConcern = 'Open utility pit / missing chamber paver poses severe foot fracture risk.';
    accessibilityImpact = 'Completely impassable for wheelchairs, strollers, and mobility-impaired residents.';
    publicImpact = 'Diverts pedestrian corridor traffic into moving vehicular transit.';
  } else if (cat === 'Electrical Hazard') {
    safetyConcern = 'Live exposed conductor or sparking junction box poses fatal electrocution hazard.';
    accessibilityImpact = 'Pedestrian sidewalk must be cordoned off immediately.';
    publicImpact = 'Threatens pedestrian corridor safety and local commercial power stability.';
  }

  return { safetyConcern, accessibilityImpact, publicImpact };
}

function getRecommendedAction(
  riskLevel: 'low' | 'moderate' | 'high' | 'critical',
  category: IssueCategory
): string {
  if (riskLevel === 'critical') {
    return `Issue emergency ${category.toLowerCase()} municipal dispatch order within 24-hour SLA. Barricade site immediately.`;
  }
  if (riskLevel === 'high') {
    return `Schedule expedited ${category.toLowerCase()} field crew deployment within 48-hour municipal turnaround cycle.`;
  }
  if (riskLevel === 'moderate') {
    return `Queue for standard cyclical ${category.toLowerCase()} ward maintenance and routine material requisition.`;
  }
  return `Assign to weekly sanitation/road surface maintenance sweep in ward sector.`;
}

function generateReasoning(
  report: DashboardReport,
  riskLevel: string,
  riskScore: number,
  priorityScore: number
): string {
  return `Civic Intelligence classified this incident with a Risk Score of ${riskScore}/100 (${riskLevel.toUpperCase()}) and Priority Score of ${priorityScore}/100 based on ${report.severity} severity, ${report.confirmationsCount} community confirmations, and ${report.category} hazard characteristics.`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
