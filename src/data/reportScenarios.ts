import { IssueCategory, IssueSeverity, HyderabadNeighborhood } from '../types';

export interface ReportScenarioPreset {
  id: string;
  name: string;
  category: IssueCategory;
  neighborhood: HyderabadNeighborhood;
  location: string;
  landmark: string;
  detectedHazard: string;
  confidence: number;
  recommendedSeverity: IssueSeverity;
  peopleImpactScore: number;
  department: string;
  description: string;
  estimatedDimensions: string;
  trafficRisk: string;
  transcription: string;
  thumbnailUrl: string;
  isDuplicateCandidate?: boolean;
  duplicateCandidateTitle?: string;
  duplicateCandidateDistance?: string;
}

export const REPORT_SCENARIO_PRESETS: ReportScenarioPreset[] = [
  {
    id: 'preset-pothole',
    name: 'Asphalt Crater (Jubilee Hills)',
    category: 'Road damage',
    neighborhood: 'Jubilee Hills',
    location: 'Road No. 36, Near Peddamma Temple Metro Pillar 1420',
    landmark: 'Opposite Metro Pillar 1420, Westbound Lane',
    detectedHazard: 'Severe Structural Asphalt Crater with Sub-base Collapse',
    confidence: 96.8,
    recommendedSeverity: 'critical',
    peopleImpactScore: 88,
    department: 'GHMC Roads & Maintenance Division (Khairatabad Zone)',
    description:
      'Extensive asphalt depression and pothole trap expanding along the main vehicular lane. Causes vehicles and two-wheelers to swerve abruptly into oncoming traffic.',
    estimatedDimensions: 'Depth: 8-10 inches • Diameter: ~3.4 feet',
    trafficRisk: 'High two-wheeler collision risk during peak morning transit',
    transcription:
      'Deep pothole crater right before the Peddamma temple metro pillar curve. Two-wheelers are losing balance in the morning rush.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    isDuplicateCandidate: true,
    duplicateCandidateTitle: 'Deep pothole near Jubilee Hills Road No. 36 (#HYD-JH-2026-081)',
    duplicateCandidateDistance: '140 meters away (18 community confirmations)',
  },
  {
    id: 'preset-garbage',
    name: 'Waste Overspill (Banjara Hills)',
    category: 'Garbage',
    neighborhood: 'Banjara Hills',
    location: 'Road No. 12, Ministers Quarters Enclosure',
    landmark: 'Adjacent to Bus Shelter, Road No. 12',
    detectedHazard: 'Uncontained Commercial Solid Waste & Secondary Bin Overspill',
    confidence: 94.2,
    recommendedSeverity: 'high',
    peopleImpactScore: 76,
    department: 'GHMC Solid Waste Management (Central Zone)',
    description:
      'Compactor unit overfilled with commercial and organic waste. Refuse spilling onto the pedestrian sidewalk for over 15 meters, attracting strays.',
    estimatedDimensions: 'Area: ~15 sq meters • Estimated Volume: 2.5 metric tons',
    trafficRisk: 'Pedestrians forced into vehicular traffic lane',
    transcription:
      'Garbage has not been lifted for two days on Road No. 12. Stray dogs are scattering waste across the road and the smell is unbearable.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80',
    isDuplicateCandidate: false,
  },
  {
    id: 'preset-water',
    name: 'Water Pipe Burst (Madhapur)',
    category: 'Water leakage',
    neighborhood: 'Madhapur',
    location: '100ft Road, Near YSR Statue Junction, Madhapur',
    landmark: 'Between Cyber Towers and Avasa Hotel',
    detectedHazard: 'High-Pressure Potable Water Main Joint Rupture',
    confidence: 98.1,
    recommendedSeverity: 'critical',
    peopleImpactScore: 92,
    department: 'HMWSSB (Hyderabad Metropolitan Water Supply & Sewerage Board)',
    description:
      'Treated municipal drinking water gushing up through road asphalt seams, eroding the bituminous foundation and flooding 2 lanes.',
    estimatedDimensions: 'Flow Rate: ~120 Liters/min • Flooding Spread: 40 meters',
    trafficRisk: 'Severe hydroplaning and localized foundation collapse risk',
    transcription:
      'Underground water line has burst on the 100ft road near Cyber Towers junction. Clean water is flooding the street and creating a massive bottleneck.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    isDuplicateCandidate: true,
    duplicateCandidateTitle: 'Underground drinking water pipeline joint leakage (#HYD-MD-2026-119)',
    duplicateCandidateDistance: '80 meters away (51 community confirmations)',
  },
  {
    id: 'preset-streetlight',
    name: 'Dark Corridor (Gachibowli)',
    category: 'Streetlights',
    neighborhood: 'Gachibowli',
    location: 'ORR Slip Road adjacent to Gachibowli Stadium',
    landmark: 'Pole Array #GB-108-41 through #GB-108-48',
    detectedHazard: 'Consecutive High-Mast Luminaire Circuit Power Failure',
    confidence: 91.5,
    recommendedSeverity: 'high',
    peopleImpactScore: 84,
    department: 'TSSPDCL Electrical & GHMC Streetlight Division',
    description:
      'Seven consecutive 120W LED fixtures inactive for 350 meters. Leaves busy tech commuter corridor in complete darkness after dusk.',
    estimatedDimensions: 'Corridor Length: ~350 meters • Inactive Poles: 7 units',
    trafficRisk: 'Zero pedestrian visibility for night-shift tech workforce',
    transcription:
      'All streetlights on the Gachibowli stadium slip road are completely dark tonight. Commuters cannot see pedestrians crossing.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    isDuplicateCandidate: false,
  },
];

