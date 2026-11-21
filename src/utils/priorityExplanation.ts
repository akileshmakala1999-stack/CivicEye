import { IssueSeverity, IssueCategory } from '../types';

export interface PriorityExplanationData {
  severity: IssueSeverity;
  severityLabel: string;
  factors: string[];
  explanation: string;
  safetyConsideration: string;
  publicImpact: string;
  communityConfirmationsText: string;
}

export function getPriorityExplanation(issue: {
  severity: IssueSeverity;
  category: IssueCategory;
  confirmationsCount: number;
  title?: string;
  description?: string;
  location?: string;
}): PriorityExplanationData {
  const { severity, category, confirmationsCount } = issue;

  const severityUpper = severity.toUpperCase();
  const confirmationsText =
    confirmationsCount > 0
      ? `${confirmationsCount} community citizen confirmations recorded in active ward registry.`
      : 'Initial report awaiting further community confirmations.';

  let safetyConsideration = 'Insufficient data to assess this factor.';
  let publicImpact = 'Insufficient data to assess this factor.';
  const factors: string[] = [];
  let explanation = '';

  // Rule-based classification factors based on existing issue data
  if (category === 'Road damage') {
    safetyConsideration =
      severity === 'critical' || severity === 'high'
        ? 'Direct collision, tire damage, and two-wheeler loss-of-balance risk along vehicular carriage road.'
        : 'Potential pedestrian tripping or vehicular discomfort under normal operating speeds.';
    publicImpact = 'Impacts daily vehicular traffic flow, commuter commute times, and road transit reliability.';
    factors.push('Physical road surface deformation or subsidence in active transit lane');
  } else if (category === 'Water leakage') {
    safetyConsideration =
      'High-pressure water outflow can erode underlying road sub-base foundation and create hydroplaning hazards.';
    publicImpact = 'Potable drinking water wastage and localized street waterlogging impacting neighborhood access.';
    factors.push('Pressurized utility pipeline defect with localized street runoff');
  } else if (category === 'Garbage') {
    safetyConsideration =
      severity === 'high' || severity === 'critical'
        ? 'Sanitation hazard; spilled waste obstructs pedestrian sidewalk and attracts stray animals into traffic.'
        : 'Aesthetic degradation and odor nuisance in residential or commercial vicinity.';
    publicImpact = 'Environmental hygiene and neighborhood public cleanliness degradation.';
    factors.push('Solid waste accumulation exceeding container volume threshold');
  } else if (category === 'Streetlights') {
    safetyConsideration =
      'Complete darkness reduces driver night-time visibility of pedestrians, cyclists, and stationary road obstacles.';
    publicImpact = 'Pedestrian route safety and nighttime transit security along public thoroughfare.';
    factors.push('Illumination failure across active corridor or intersection');
  } else if (category === 'Damaged footpaths') {
    safetyConsideration =
      'Pedestrian trip hazard; open chamber or displaced pavers expose pedestrians and seniors to falling injuries.';
    publicImpact = 'Forces pedestrian sidewalk traffic into adjacent vehicular roadways.';
    factors.push('Pedestrian walkway structural integrity compromised');
  } else if (category === 'Drainage') {
    safetyConsideration =
      'Choked storm drain culvert creates sudden water backflow and pre-flood hazard during rain events.';
    publicImpact = 'Water stagnation, mosquito vector breeding, and carriage road submersion.';
    factors.push('Stormwater runoff channel or culvert silt obstruction');
  } else {
    factors.push('Civic infrastructure defect logged in neighborhood grid');
  }

  // Add confirmation factor
  if (confirmationsCount >= 20) {
    factors.push(`High community consensus (${confirmationsCount} resident confirmations)`);
  } else if (confirmationsCount > 5) {
    factors.push(`Multiple community confirmations (${confirmationsCount} citizens validating presence)`);
  } else {
    factors.push('Single or initial community report pending wider consensus');
  }

  // Add severity specific factor & explanation
  switch (severity) {
    case 'critical':
      factors.push('Immediate intervention required under municipal emergency SLA (< 24 hours)');
      explanation = `Classified as CRITICAL because the ${category.toLowerCase()} condition presents an active safety hazard coupled with ${confirmationsCount} community confirmations, escalating its position in the municipal rapid response queue.`;
      break;

    case 'high':
      factors.push('Prioritized for expedited field division dispatch within standard municipal cycle');
      explanation = `Classified as HIGH priority due to active civic disruption, potential secondary hazard progression, and verified citizen reports (${confirmationsCount} confirmations) in this ward.`;
      break;

    case 'medium':
      factors.push('Scheduled for routine municipal maintenance work order sequence');
      explanation = `Classified as MEDIUM priority because the condition requires civil repair but does not present an immediate catastrophic hazard to public transit.`;
      break;

    case 'low':
      factors.push('Assigned to standard cyclical neighborhood sanitation or maintenance sweep');
      explanation = `Classified as LOW priority as it represents localized, non-hazardous maintenance with minimal impediment to everyday neighborhood mobility.`;
      break;
  }

  return {
    severity,
    severityLabel: severityUpper,
    factors,
    explanation,
    safetyConsideration,
    publicImpact,
    communityConfirmationsText: confirmationsText,
  };
}
