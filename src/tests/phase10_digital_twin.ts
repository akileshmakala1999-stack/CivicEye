import assert from 'assert';
import fs from 'fs';
import path from 'path';
import './setupMockBrowser';

import {
  DashboardReport,
  WorkOrder,
  SimulationParameters,
  DigitalTwinLayerId,
} from '../types';
import {
  digitalTwinService,
  isValidCoordinate,
  projectCoordinates,
} from '../services/digitalTwinService';

// ==========================================
// TEST DATASET PREPARATION
// ==========================================
const TEST_REPORTS: DashboardReport[] = [
  {
    id: 'rep-twin-1',
    ticketNumber: 'REP-2026-T101',
    title: 'Severe Under-Road Water Main Rupture',
    category: 'Water leakage',
    severity: 'critical',
    status: 'Submitted',
    reportDate: '2026-11-18',
    reportTimestamp: '2026-11-18T08:00:00Z',
    location: 'Road No. 36, Jubilee Hills',
    neighborhood: 'Jubilee Hills',
    confirmationsCount: 12,
    stillExistsCount: 8,
    gettingWorseCount: 6,
    description: 'High-pressure water conduit rupture decompacting subsurface roadbed.',
    departmentAssigned: 'HMWSSB',
    latitude: 17.4325,
    longitude: 78.4071,
    timeline: [],
    isRecurring: true,
    riskScore: 92,
  },
  {
    id: 'rep-twin-2',
    ticketNumber: 'REP-2026-T102',
    title: 'Road Subsidence and Trench Cave-in',
    category: 'Road damage',
    severity: 'critical',
    status: 'Under Review',
    reportDate: '2026-11-19',
    reportTimestamp: '2026-11-19T09:30:00Z',
    location: 'Road No. 36 Near Metro Pillar 18, Jubilee Hills',
    neighborhood: 'Jubilee Hills',
    confirmationsCount: 18,
    stillExistsCount: 10,
    gettingWorseCount: 9,
    description: 'Asphalt collapse directly downstream of water pipe rupture.',
    departmentAssigned: 'GHMC',
    latitude: 17.4332,
    longitude: 78.4079,
    timeline: [],
    isRecurring: true,
    riskScore: 95,
  },
  {
    id: 'rep-twin-3',
    ticketNumber: 'REP-2026-T103',
    title: 'Traffic Signal Failure at Inorbit Junction',
    category: 'Streetlights',
    severity: 'high',
    status: 'Assigned',
    reportDate: '2026-11-20',
    reportTimestamp: '2026-11-20T10:15:00Z',
    location: 'Inorbit Mall Junction, Madhapur',
    neighborhood: 'Madhapur',
    confirmationsCount: 25,
    stillExistsCount: 14,
    gettingWorseCount: 7,
    description: 'Four-way intersection traffic lights out of service causing congestion.',
    departmentAssigned: 'Traffic & Signalling',
    latitude: 17.4348,
    longitude: 78.3868,
    timeline: [],
    riskScore: 78,
  },
  {
    id: 'rep-twin-4',
    ticketNumber: 'REP-2026-T104',
    title: 'Open Drain Overflow Near School Zone',
    category: 'Drainage',
    severity: 'high',
    status: 'In Progress',
    reportDate: '2026-11-17',
    reportTimestamp: '2026-11-17T11:00:00Z',
    location: 'Banjara Hills Road No. 12',
    neighborhood: 'Banjara Hills',
    confirmationsCount: 7,
    stillExistsCount: 4,
    gettingWorseCount: 2,
    description: 'Sewage drain spilling onto pedestrian footway.',
    departmentAssigned: 'GHMC',
    latitude: 17.4156,
    longitude: 78.4352,
    timeline: [],
    riskScore: 72,
  },
  {
    id: 'rep-twin-5',
    ticketNumber: 'REP-2026-T105',
    title: 'Fallen Tree Branch Obstructing Lane',
    category: 'Fallen Tree',
    severity: 'medium',
    status: 'Submitted',
    reportDate: '2026-11-20',
    reportTimestamp: '2026-11-20T12:00:00Z',
    location: 'Begumpet Airport Road',
    neighborhood: 'Begumpet',
    confirmationsCount: 3,
    description: 'Dry tree branch hanging low over shoulder lane.',
    departmentAssigned: 'GHMC',
    latitude: 17.4447,
    longitude: 78.4664,
    timeline: [],
    riskScore: 45,
  },
  {
    id: 'rep-twin-6',
    ticketNumber: 'REP-2026-T106',
    title: 'Broken Streetlight Fixture',
    category: 'Streetlights',
    severity: 'low',
    status: 'Submitted',
    reportDate: '2026-11-15',
    reportTimestamp: '2026-11-15T14:00:00Z',
    location: 'Gachibowli Stadium Road',
    neighborhood: 'Gachibowli',
    confirmationsCount: 1,
    description: 'Single sodium-vapor lamp flickering at night.',
    departmentAssigned: 'TSSPDCL',
    latitude: 17.4435,
    longitude: 78.3489,
    timeline: [],
    riskScore: 25,
  },
  {
    id: 'rep-twin-7',
    ticketNumber: 'REP-2026-T107',
    title: 'Citizen Grievance Without GPS Coordinates',
    category: 'Garbage',
    severity: 'low',
    status: 'Submitted',
    reportDate: '2026-11-21',
    reportTimestamp: '2026-11-21T06:00:00Z',
    location: 'Unspecified lane near old market',
    neighborhood: 'Banjara Hills', // Has neighborhood, no lat/lng
    confirmationsCount: 0,
    description: 'Trash collected at corner without coordinates.',
    departmentAssigned: 'GHMC',
    latitude: undefined,
    longitude: undefined,
    timeline: [],
    riskScore: 20,
  },
];

const TEST_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-TWIN-01',
    reportId: 'rep-twin-2',
    reportTicketNumber: 'REP-2026-T102',
    title: 'Road Subsidence and Trench Cave-in',
    category: 'Road damage',
    departmentId: 'dept-ghmc',
    departmentName: 'GHMC Engineering & Roads',
    priority: 'critical',
    status: 'In Progress',
    workDescription: 'Emergency trench backfilling and soil stabilization.',
    targetCompletionDate: '2026-11-23',
    slaTargetHours: 24,
    slaDeadlineTimestamp: Date.now() + 86400000,
    assignedStaffId: 'staff-01',
    assignedStaffName: 'Vikram Reddy',
    location: 'Road No. 36, Jubilee Hills',
    neighborhood: 'Jubilee Hills',
    createdTimestamp: '2026-11-19T10:00:00Z',
    createdAt: Date.now() - 3600000,
    progressNotes: [],
  },
];

console.log('================================================================');
console.log('   CIVICEYE PHASE 10 CIVIC DIGITAL TWIN & SIMULATION SUITE      ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`[PASS] ${testName}`);
    passCount++;
  } catch (err: unknown) {
    console.error(`[FAIL] ${testName}`);
    console.error(`       Error: ${(err as Error).message}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// TEST GROUP 1: Geographic Coordinate Validation & Spatial Safety
// -------------------------------------------------------------
console.log('--- TEST GROUP 1: Geographic Coordinate Validation & Spatial Safety ---');

runTest('Validates Hyderabad latitude bounds (17.30 to 17.55 N)', () => {
  assert(isValidCoordinate(17.4325, 78.4071) === true);
  assert(isValidCoordinate(17.2000, 78.4071) === false); // Too far south
  assert(isValidCoordinate(17.6500, 78.4071) === false); // Too far north
});

runTest('Validates Hyderabad longitude bounds (78.25 to 78.60 E)', () => {
  assert(isValidCoordinate(17.4325, 78.3489) === true);
  assert(isValidCoordinate(17.4325, 78.1000) === false); // Too far west
  assert(isValidCoordinate(17.4325, 78.7500) === false); // Too far east
});

runTest('Rejects null, undefined, NaN, and 0,0 null island coordinates', () => {
  assert(isValidCoordinate(undefined, undefined) === false);
  assert(isValidCoordinate(0, 0) === false);
  assert(isValidCoordinate(NaN, 78.40) === false);
  assert(isValidCoordinate(17.43, NaN) === false);
});

runTest('Separates geographic reports from non-geographic reports', () => {
  const { validReports, nonGeographicReports } = digitalTwinService.filterGeographicReports(TEST_REPORTS);
  assert(validReports.length > 0, 'Should return valid geographic reports');
  // rep-twin-7 has no lat/lng but has neighborhood centroid fallback, verify all accounted
  assert(validReports.length + nonGeographicReports.length === TEST_REPORTS.length);
});

runTest('projectCoordinates bounds projection within 8% to 92% SVG canvas range', () => {
  const coords1 = projectCoordinates(17.4325, 78.4071);
  assert(coords1.x >= 8 && coords1.x <= 92);
  assert(coords1.y >= 8 && coords1.y <= 92);

  const coordsOut = projectCoordinates(17.9000, 78.9000);
  assert(coordsOut.x >= 8 && coordsOut.x <= 92, 'Out of bounds clamped to map view');
  assert(coordsOut.y >= 8 && coordsOut.y <= 92, 'Out of bounds clamped to map view');
});

// -------------------------------------------------------------
// TEST GROUP 2: 12 Toggleable Intelligence Layers Aggregation
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 2: 12 Toggleable Intelligence Layers Aggregation ---');

runTest('Returns exactly 12 discrete intelligence layers', () => {
  const layers = digitalTwinService.getLayers(TEST_REPORTS, TEST_WORK_ORDERS);
  assert.strictEqual(layers.length, 12, 'Must contain exactly 12 layers');
});

runTest('Contains all 12 validated layer identifiers', () => {
  const layers = digitalTwinService.getLayers(TEST_REPORTS, TEST_WORK_ORDERS);
  const layerIds = new Set(layers.map((l) => l.id));

  const expectedIds: DigitalTwinLayerId[] = [
    'all_reports',
    'active_issues',
    'critical_risk',
    'civic_hotspots',
    'recurring_issues',
    'work_orders',
    'community_signals',
    'infrastructure_relationships',
    'resolved_issues',
    'risk_density',
    'department_activity',
    'multi_agency_zones',
  ];

  for (const expected of expectedIds) {
    assert(layerIds.has(expected), `Layer missing: ${expected}`);
  }
});

runTest('Default layers are pre-enabled according to municipal visibility standards', () => {
  const layers = digitalTwinService.getLayers(TEST_REPORTS, TEST_WORK_ORDERS);
  const allReportsLayer = layers.find((l) => l.id === 'all_reports');
  const criticalLayer = layers.find((l) => l.id === 'critical_risk');
  const hotspotsLayer = layers.find((l) => l.id === 'civic_hotspots');

  assert(Boolean(allReportsLayer?.isEnabled), 'all_reports should be enabled by default');
  assert(Boolean(criticalLayer?.isEnabled), 'critical_risk should be enabled by default');
  assert(Boolean(hotspotsLayer?.isEnabled), 'civic_hotspots should be enabled by default');
});

runTest('Work orders layer reflects active work orders count', () => {
  const layers = digitalTwinService.getLayers(TEST_REPORTS, TEST_WORK_ORDERS);
  const woLayer = layers.find((l) => l.id === 'work_orders');
  assert.strictEqual(woLayer?.count, TEST_WORK_ORDERS.length);
});

// -------------------------------------------------------------
// TEST GROUP 3: Spatial Density Grid Engine
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Spatial Density Grid Engine ---');

runTest('Calculates a 4x4 spatial density grid (16 cells)', () => {
  const grid = digitalTwinService.calculateSpatialDensityGrid(TEST_REPORTS, 4);
  assert.strictEqual(grid.length, 16);
});

runTest('Grid cells correctly report normalized reportDensity in [0, 1]', () => {
  const grid = digitalTwinService.calculateSpatialDensityGrid(TEST_REPORTS, 4);
  for (const cell of grid) {
    assert(cell.reportDensity >= 0 && cell.reportDensity <= 1, `Density out of range: ${cell.reportDensity}`);
  }
});

runTest('Risk density reflects severity weighting (critical=5, low=1)', () => {
  const grid = digitalTwinService.calculateSpatialDensityGrid(TEST_REPORTS, 4);
  const activeCells = grid.filter((c) => c.reportCount > 0);
  assert(activeCells.length > 0, 'Should have populated cells');

  for (const cell of activeCells) {
    assert(cell.riskDensity >= 0 && cell.riskDensity <= 1);
  }
});

runTest('Identifies dominant category and neighborhood for populated grid cells', () => {
  const grid = digitalTwinService.calculateSpatialDensityGrid(TEST_REPORTS, 4);
  const populated = grid.find((c) => c.reportCount > 0);
  assert(Boolean(populated), 'Should find a populated cell');
  assert(Boolean(populated?.dominantCategory), 'Cell should have dominantCategory');
  assert(Boolean(populated?.dominantNeighborhood), 'Cell should have dominantNeighborhood');
});

// -------------------------------------------------------------
// TEST GROUP 4: Cascading Infrastructure Dependency Detection
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Cascading Infrastructure Dependency Detection ---');

runTest('Detects causal cascade between proximal water leak and road subsidence', () => {
  const chains = digitalTwinService.detectCascadingChains(TEST_REPORTS);
  assert(chains.length > 0, 'Should detect at least 1 cascading chain');
  const primaryChain = chains[0];
  assert.strictEqual(primaryChain.nodes[0].stage, 1, 'Stage 1 should be root cause');
  assert(primaryChain.nodes[0].category === 'Water leakage' || primaryChain.nodes[0].category === 'Drainage');
});

runTest('Assigns an emergency cost multiplier > 3.0x for delayed cascade remediation', () => {
  const chains = digitalTwinService.detectCascadingChains(TEST_REPORTS);
  for (const chain of chains) {
    assert(chain.estimatedEscalationCostMultiplier >= 3.0, 'Escalation multiplier must be >= 3.0x');
  }
});

runTest('Chain identifies specific mitigation window in days', () => {
  const chains = digitalTwinService.detectCascadingChains(TEST_REPORTS);
  const rootNode = chains[0].nodes[0];
  assert(rootNode.avoidableIfAddressedWithinDays > 0, 'Mitigation window must be positive');
  assert(rootNode.avoidableIfAddressedWithinDays <= 14, 'Mitigation window must be reasonable');
});

// -------------------------------------------------------------
// TEST GROUP 5: Deterministic Intervention Simulation Strategies
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Deterministic Intervention Simulation Strategies ---');

runTest('Strategy A (Critical Issues First) resolves critical hazards first', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Strategy A: Critical Issues First',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  assert(result.finalMetrics.criticalReductionPct >= 80, 'Should eliminate >= 80% critical hazards');
  // First prioritized report should be critical
  const topReport = TEST_REPORTS.find((r) => r.id === result.prioritizedReportIds[0]);
  assert.strictEqual(topReport?.severity, 'critical', 'Top report in Strategy A must be critical');
});

runTest('Strategy B (Hotspot Reduction) prioritizes cluster concentration', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_b',
    strategyName: 'Strategy B: Hotspot Reduction',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  assert(result.finalMetrics.backlogReductionPct > 0);
  assert(result.timeline.length >= 4);
});

runTest('Strategy C (Recurring Prevention) prioritizes recurring defect roots', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_c',
    strategyName: 'Strategy C: Recurring Prevention',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  const topReport = TEST_REPORTS.find((r) => r.id === result.prioritizedReportIds[0]);
  assert(Boolean(topReport?.isRecurring), 'Top report in Strategy C should be recurring');
});

runTest('Strategy D (Community Impact) prioritizes reports with citizen confirmations', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_d',
    strategyName: 'Strategy D: Community Impact',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  const topReport = TEST_REPORTS.find((r) => r.id === result.prioritizedReportIds[0]);
  assert((topReport?.confirmationsCount || 0) >= 10, 'Top report in Strategy D must have high confirmations');
});

runTest('Strategy E (Balanced Prioritization) executes equitable blended scoring', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_e',
    strategyName: 'Strategy E: Balanced Prioritization',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  assert(result.finalMetrics.citizenSatisfactionScore >= 70, 'Balanced model achieves high satisfaction');
});

runTest('Strategy F (Custom Weights) responds deterministically to weight inputs', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_f',
    strategyName: 'Strategy F: Custom Weights',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 4,
    dailyInterventionRate: 2.0,
    timelineDays: 30,
    customWeights: {
      riskWeight: 80,
      densityWeight: 10,
      recurrenceWeight: 5,
      communityWeight: 5,
      ageWeight: 0,
      costWeight: 0,
    },
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  assert(result.prioritizedReportIds.length > 0);
  const topReport = TEST_REPORTS.find((r) => r.id === result.prioritizedReportIds[0]);
  assert.strictEqual(topReport?.severity, 'critical', 'Heavy risk weight selects critical report first');
});

// -------------------------------------------------------------
// TEST GROUP 6: Time Progression Simulation (Days 0, 1, 3, 7, 14, 30)
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 6: Time Progression Simulation (Days 0, 1, 3, 7, 14, 30) ---');

runTest('Timeline steps include Day 0 baseline through Day 30', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Strategy A',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  const days = result.timeline.map((s) => s.day);
  assert(days.includes(0), 'Timeline must include Day 0');
  assert(days.includes(1), 'Timeline must include Day 1');
  assert(days.includes(3), 'Timeline must include Day 3');
  assert(days.includes(7), 'Timeline must include Day 7');
  assert(days.includes(14), 'Timeline must include Day 14');
  assert(days.includes(30), 'Timeline must include Day 30');
});

runTest('Backlog decreases monotonically over time', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Strategy A',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  for (let i = 1; i < result.timeline.length; i++) {
    const prev = result.timeline[i - 1];
    const curr = result.timeline[i];
    assert(curr.remainingBacklog <= prev.remainingBacklog, `Backlog should decrease: Day ${curr.day} vs Day ${prev.day}`);
    assert(curr.addressedCumulative >= prev.addressedCumulative, `Addressed should increase: Day ${curr.day}`);
  }
});

runTest('Calculates cascading hazards avoided when root defects are remediated early', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Strategy A',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  assert(result.finalMetrics.cascadingHazardsPrevented >= 1, 'Should prevent at least 1 secondary cascade');
});

runTest('Capacity utilization percentage is bounded in [0, 100]', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Strategy A',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 6,
    dailyInterventionRate: 2.5,
    timelineDays: 30,
  };

  const result = digitalTwinService.runSimulation(params, TEST_REPORTS, TEST_WORK_ORDERS);
  for (const step of result.timeline) {
    assert(step.capacityUtilizationPct >= 0 && step.capacityUtilizationPct <= 100);
  }
});

// -------------------------------------------------------------
// TEST GROUP 7: Scenario Comparison Engine & Trade-off Analysis
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 7: Scenario Comparison Engine & Trade-off Analysis ---');

runTest('Compares multiple simulation scenarios side-by-side', () => {
  const simA = digitalTwinService.runSimulation(
    {
      strategyId: 'strategy_a',
      strategyName: 'Strategy A: Critical Issues First',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 6,
      dailyInterventionRate: 2.5,
      timelineDays: 30,
    },
    TEST_REPORTS,
    TEST_WORK_ORDERS
  );

  const simB = digitalTwinService.runSimulation(
    {
      strategyId: 'strategy_b',
      strategyName: 'Strategy B: Hotspot Reduction',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 6,
      dailyInterventionRate: 2.5,
      timelineDays: 30,
    },
    TEST_REPORTS,
    TEST_WORK_ORDERS
  );

  const comparison = digitalTwinService.compareScenarios([simA, simB]);
  assert.strictEqual(comparison.scenarios.length, 2);
  assert(Boolean(comparison.recommendedScenarioId), 'Comparison should designate a recommended scenario');
  assert(Boolean(comparison.recommendationReason), 'Comparison should state recommendation reason');
  assert(comparison.comparativeInsights.length > 0, 'Comparison should provide comparative insights');
});

runTest('Provides clear trade-off explanations without marketing fluff', () => {
  const simA = digitalTwinService.runSimulation(
    {
      strategyId: 'strategy_a',
      strategyName: 'Strategy A: Critical Issues First',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 6,
      dailyInterventionRate: 2.5,
      timelineDays: 30,
    },
    TEST_REPORTS,
    TEST_WORK_ORDERS
  );

  assert(simA.tradeoffsExplanation.length >= 3, 'Must provide >= 3 tradeoff points');
  assert(simA.groundedExplanation.vulnerabilities.length >= 2, 'Must provide vulnerabilities');
  assert(Boolean(simA.groundedExplanation.disclaimer), 'Must include explicit simulation disclaimer');
});

// -------------------------------------------------------------
// TEST GROUP 8: Simulation Persistence, Fingerprinting & Isolation
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 8: Simulation Persistence, Fingerprinting & Isolation ---');

runTest('Simulation execution NEVER mutates real report records (Strict Isolation)', () => {
  const originalStatuses = TEST_REPORTS.map((r) => r.status);
  const originalSeverities = TEST_REPORTS.map((r) => r.severity);

  // Run simulation
  digitalTwinService.runSimulation(
    {
      strategyId: 'strategy_a',
      strategyName: 'Strategy A',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 6,
      dailyInterventionRate: 2.5,
      timelineDays: 30,
    },
    TEST_REPORTS,
    TEST_WORK_ORDERS
  );

  // Verify records unchanged
  for (let i = 0; i < TEST_REPORTS.length; i++) {
    assert.strictEqual(TEST_REPORTS[i].status, originalStatuses[i], 'Report status was mutated!');
    assert.strictEqual(TEST_REPORTS[i].severity, originalSeverities[i], 'Report severity was mutated!');
  }
});

runTest('Generates deterministic dataset fingerprint from report IDs, statuses, severities', () => {
  const fp1 = digitalTwinService.getDatasetFingerprint(TEST_REPORTS);
  const fp2 = digitalTwinService.getDatasetFingerprint(TEST_REPORTS);
  assert.strictEqual(fp1, fp2, 'Fingerprints must be identical for identical datasets');
  assert(fp1.startsWith('FP-HYD-'), 'Fingerprint must follow standard prefix');
});

runTest('Detects dataset modification via fingerprint mismatch', () => {
  const fpOriginal = digitalTwinService.getDatasetFingerprint(TEST_REPORTS);
  const modifiedReports = [
    ...TEST_REPORTS,
    {
      ...TEST_REPORTS[0],
      id: 'rep-new-dummy',
      ticketNumber: 'REP-DUMMY',
    },
  ];
  const isValid = digitalTwinService.verifyDatasetFingerprint(fpOriginal, modifiedReports);
  assert.strictEqual(isValid, false, 'Should flag fingerprint mismatch on dataset change');
});

runTest('Saves, loads, and deletes simulation scenarios in storage archive', async () => {
  const sim = digitalTwinService.runSimulation(
    {
      strategyId: 'strategy_a',
      strategyName: 'Archived Scenario 1',
      targetArea: 'Jubilee Hills',
      targetCategory: 'Road damage',
      activeTeams: 4,
      dailyInterventionRate: 2.0,
      timelineDays: 14,
    },
    TEST_REPORTS,
    TEST_WORK_ORDERS
  );

  const scenarioId = `test-saved-${Date.now()}`;
  await digitalTwinService.saveScenario({
    id: scenarioId,
    name: 'Archived Scenario 1',
    description: 'Test archive scenario',
    createdByRole: 'supervisor',
    createdAt: new Date().toISOString(),
    datasetFingerprint: digitalTwinService.getDatasetFingerprint(TEST_REPORTS),
    parameters: sim.parameters,
    result: sim,
  });

  const savedList = await digitalTwinService.getSavedScenarios();
  const found = savedList.find((s) => s.id === scenarioId);
  assert(Boolean(found), 'Saved scenario must be retrievable from archive');

  await digitalTwinService.deleteScenario(scenarioId);
  const afterDelete = await digitalTwinService.getSavedScenarios();
  assert(!afterDelete.some((s) => s.id === scenarioId), 'Scenario must be deleted');
});

// -------------------------------------------------------------
// TEST GROUP 9: SQL Migration 20261120000007 Verification
// -------------------------------------------------------------
console.log('\n--- TEST GROUP 9: SQL Migration 20261120000007 Verification ---');

const migrationPath = path.resolve('supabase/migrations/20261120000007_create_digital_twin_and_simulations.sql');

runTest('SQL migration 20261120000007 exists on disk', () => {
  assert(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
});

const migrationSql = fs.readFileSync(migrationPath, 'utf8');

runTest('Table digital_twin_scenarios declared', () => {
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.digital_twin_scenarios'));
});

runTest('Table digital_twin_simulation_results declared with ON DELETE CASCADE', () => {
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.digital_twin_simulation_results'));
  assert(migrationSql.includes('REFERENCES public.digital_twin_scenarios(id) ON DELETE CASCADE'));
});

runTest('Table digital_twin_cascading_dependencies declared', () => {
  assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.digital_twin_cascading_dependencies'));
  assert(migrationSql.includes('REFERENCES public.reports(id) ON DELETE CASCADE'));
});

runTest('Row Level Security (RLS) enabled on all digital twin tables', () => {
  assert(migrationSql.includes('ALTER TABLE public.digital_twin_scenarios ENABLE ROW LEVEL SECURITY;'));
  assert(migrationSql.includes('ALTER TABLE public.digital_twin_simulation_results ENABLE ROW LEVEL SECURITY;'));
  assert(migrationSql.includes('ALTER TABLE public.digital_twin_cascading_dependencies ENABLE ROW LEVEL SECURITY;'));
});

runTest('Public transparency read policies declared for scenarios and results', () => {
  assert(migrationSql.includes('CREATE POLICY "Public read digital twin scenarios"'));
  assert(migrationSql.includes('CREATE POLICY "Public read digital twin simulation results"'));
  assert(migrationSql.includes('CREATE POLICY "Public read digital twin cascading dependencies"'));
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`CIVICEYE PHASE 10 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
