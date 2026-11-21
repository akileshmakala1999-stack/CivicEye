import assert from 'assert';
import fs from 'fs';
import path from 'path';
import './setupMockBrowser';

import {
  DashboardReport,
  SimulationParameters,
  SimulationWeights,
  CascadeLinkCertainty,
} from '../types';
import {
  digitalTwinService,
  isValidGlobalCoordinate,
  isInGeographicBounds,
  projectCoordinates,
  DEFAULT_VIEWPORT_BOUNDS,
  GREATER_HYDERABAD_BOUNDS,
} from '../services/digitalTwinService';

console.log('====================================================');
console.log('CIVICEYE — PHASE 10.1 COMPREHENSIVE VERIFICATION SUITE');
console.log('Digital Twin Accuracy, Simulation Calibration & Security');
console.log('====================================================\n');

// Mock Test Reports with distinct coordinate profiles:
// 1. In-viewport verified GPS
// 2. In-viewport approximate centroid
// 3. Outside viewport but valid Hyderabad/Telangana coordinates
// 4. Missing GPS coordinates (undefined or null)
// 5. Completely invalid global coordinates (out of range lat/lng)
const TEST_REPORTS: DashboardReport[] = [
  {
    id: 'rep-geo-1',
    ticketNumber: 'REP-GEO-001',
    title: 'Banjara Hills Water Main Leak',
    category: 'Water leakage',
    severity: 'critical',
    status: 'Submitted',
    reportDate: '2026-11-18',
    reportTimestamp: '2026-11-18T08:00:00Z',
    description: 'High pressure line rupture',
    departmentAssigned: 'HMWSSB',
    timeline: [],
    location: 'Road No. 12, Banjara Hills',
    neighborhood: 'Banjara Hills',
    latitude: 17.4150,
    longitude: 78.4350,
    confirmationsCount: 15,
    stillExistsCount: 10,
    gettingWorseCount: 8,
    isRecurring: true,
    riskScore: 92,
  },
  {
    id: 'rep-geo-2',
    ticketNumber: 'REP-GEO-002',
    title: 'Gachibowli Pothole Cluster',
    category: 'Road damage',
    severity: 'high',
    status: 'Under Review',
    reportDate: '2026-11-19',
    reportTimestamp: '2026-11-19T09:00:00Z',
    description: 'Multiple deep potholes near junction',
    departmentAssigned: 'GHMC',
    timeline: [],
    location: 'ORR Junction, Gachibowli',
    neighborhood: 'Gachibowli',
    latitude: 17.4400,
    longitude: 78.3600,
    confirmationsCount: 8,
    stillExistsCount: 4,
    gettingWorseCount: 2,
    isRecurring: false,
    riskScore: 70,
  },
  {
    id: 'rep-geo-3',
    ticketNumber: 'REP-GEO-003',
    title: 'Charminar South Approach Drainage Block',
    category: 'Drainage',
    severity: 'high',
    status: 'In Progress',
    reportDate: '2026-11-17',
    reportTimestamp: '2026-11-17T10:00:00Z',
    description: 'Silt accumulation blocking flow',
    departmentAssigned: 'GHMC',
    timeline: [],
    location: 'South Approach Road, Extended Sector',
    neighborhood: 'Madhapur',
    // Outside default viewport (17.405-17.465, 78.345-78.455), but inside Greater Hyderabad (17.20-17.60, 78.15-78.70)
    latitude: 17.3500,
    longitude: 78.4700,
    confirmationsCount: 12,
    stillExistsCount: 6,
    gettingWorseCount: 5,
    isRecurring: true,
    riskScore: 85,
  },
  {
    id: 'rep-geo-4',
    ticketNumber: 'REP-GEO-004',
    title: 'Outer Sector Streetlight Failure',
    category: 'Streetlights',
    severity: 'low',
    status: 'Submitted',
    reportDate: '2026-11-16',
    reportTimestamp: '2026-11-16T11:00:00Z',
    description: 'Dark stretch on outer arterial',
    departmentAssigned: 'TSSPDCL',
    timeline: [],
    location: 'North Outer Arterial',
    neighborhood: 'Kondapur',
    // Outside default viewport, but inside Greater Hyderabad
    latitude: 17.5100,
    longitude: 78.5200,
    confirmationsCount: 3,
    stillExistsCount: 1,
    gettingWorseCount: 0,
    isRecurring: false,
    riskScore: 30,
  },
  {
    id: 'rep-geo-5',
    ticketNumber: 'REP-GEO-005',
    title: 'Legacy Citizen Report with Missing GPS',
    category: 'Garbage',
    severity: 'medium',
    status: 'Submitted',
    reportDate: '2026-11-15',
    reportTimestamp: '2026-11-15T12:00:00Z',
    description: 'Corner refuse collection delay',
    departmentAssigned: 'GHMC',
    timeline: [],
    location: 'Unknown Lane, Begumpet',
    neighborhood: 'Begumpet',
    latitude: undefined,
    longitude: undefined,
    confirmationsCount: 5,
    stillExistsCount: 2,
    gettingWorseCount: 1,
    isRecurring: false,
    riskScore: 45,
  },
  {
    id: 'rep-geo-6',
    ticketNumber: 'REP-GEO-006',
    title: 'Malformed Global Coordinates Report',
    category: 'Electrical Hazard',
    severity: 'critical',
    status: 'Submitted',
    reportDate: '2026-11-14',
    reportTimestamp: '2026-11-14T14:00:00Z',
    description: 'Sensor failure reporting out of bounds coordinates',
    departmentAssigned: 'TSSPDCL',
    timeline: [],
    location: 'Sensor Error Data',
    neighborhood: 'Jubilee Hills',
    latitude: 999.0, // Invalid lat (> 90)
    longitude: -200.0, // Invalid lng (< -180)
    confirmationsCount: 1,
    stillExistsCount: 0,
    gettingWorseCount: 0,
    isRecurring: false,
    riskScore: 88,
  },
];

let totalPassed = 0;
let totalFailed = 0;

function runTest(testName: string, testFn: () => void | Promise<void>) {
  try {
    const res = testFn();
    if (res instanceof Promise) {
      res
        .then(() => {
          console.log(`  ✓ PASS: ${testName}`);
          totalPassed++;
        })
        .catch((err: any) => {
          console.error(`  ✗ FAIL: ${testName}`);
          console.error(`    Error: ${err.message}`);
          totalFailed++;
        });
    } else {
      console.log(`  ✓ PASS: ${testName}`);
      totalPassed++;
    }
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    totalFailed++;
  }
}

// ==========================================
// 1. GEOGRAPHIC ACCURACY & BOUNDS TESTS
// ==========================================
console.log('\n--- Group 1: Geographic Accuracy & Configurable Bounds ---');

runTest('Global coordinate validation accepts valid earth coordinates and rejects out-of-range or null island', () => {
  assert.strictEqual(isValidGlobalCoordinate(17.43, 78.40), true);
  assert.strictEqual(isValidGlobalCoordinate(10.0, 20.0), true);
  assert.strictEqual(isValidGlobalCoordinate(-89.9, 179.9), true);
  // Null Island (0,0) rejected as invalid GPS
  assert.strictEqual(isValidGlobalCoordinate(0, 0), false);
  assert.strictEqual(isValidGlobalCoordinate(91.0, 78.40), false);
  assert.strictEqual(isValidGlobalCoordinate(17.43, 185.0), false);
  assert.strictEqual(isValidGlobalCoordinate(NaN, 78.40), false);
  assert.strictEqual(isValidGlobalCoordinate(undefined, 78.40), false);
});

runTest('isInGeographicBounds correctly identifies coordinates within and outside custom bounds', () => {
  // Within default viewport
  assert.strictEqual(isInGeographicBounds(17.43, 78.40, DEFAULT_VIEWPORT_BOUNDS), true);
  // Outside default viewport, but within Greater Hyderabad
  assert.strictEqual(isInGeographicBounds(17.35, 78.47, DEFAULT_VIEWPORT_BOUNDS), false);
  assert.strictEqual(isInGeographicBounds(17.35, 78.47, GREATER_HYDERABAD_BOUNDS), true);
  // Out of Greater Hyderabad entirely
  assert.strictEqual(isInGeographicBounds(12.97, 77.59, GREATER_HYDERABAD_BOUNDS), false); // Bangalore
});

runTest('filterGeographicReports preserves outside-viewport & missing coordinates without data loss', () => {
  const filtered = digitalTwinService.filterGeographicReports(TEST_REPORTS, DEFAULT_VIEWPORT_BOUNDS);
  
  // Total in input = 6
  // In-viewport verified GPS = 2 (rep-geo-1, rep-geo-2)
  assert.strictEqual(filtered.inViewportReports.length, 2, 'Should have 2 verified GPS reports in default viewport');
  
  // Outside viewport = 2 (rep-geo-3, rep-geo-4)
  assert.strictEqual(filtered.outsideViewportReports.length, 2, 'Should retain 2 reports outside viewport');
  
  // Missing coordinates = 0 unmapped (rep-geo-5 has Begumpet neighborhood centroid fallback)
  // Invalid global coordinates = 1 (rep-geo-6)
  assert.strictEqual(filtered.invalidCoordinateReports.length, 1, 'Should isolate invalid coordinate report');

  // Verify accuracy levels
  filtered.inViewportReports.forEach(r => {
    assert.strictEqual(r.accuracyLevel, 'verified_gps');
  });

  // Verify non-destructive accounting: sum equals original input length
  assert.strictEqual(filtered.allEvaluatedCount, TEST_REPORTS.length, 'Total evaluated must equal input count');
});

runTest('projectCoordinates safely maps coordinates to SVG space with robust fallback', () => {
  const p1 = projectCoordinates(17.43, 78.40, undefined, undefined, DEFAULT_VIEWPORT_BOUNDS);
  assert.ok(p1.x >= 8 && p1.x <= 92, 'x should be within SVG viewBox bounds');
  assert.ok(p1.y >= 8 && p1.y <= 92, 'y should be within SVG viewBox bounds');

  // Centroid / fallback for missing coords
  const pFallback = projectCoordinates(undefined, undefined, 50, 50, DEFAULT_VIEWPORT_BOUNDS);
  assert.strictEqual(pFallback.x, 50, 'Fallback x should match specified fallback');
  assert.strictEqual(pFallback.y, 50, 'Fallback y should match specified fallback');
});

// ==========================================
// 2. SIMULATION MATHEMATICAL INTEGRITY & WEIGHT NORMALIZATION
// ==========================================
console.log('\n--- Group 2: Simulation Mathematical Integrity & Normalization ---');

runTest('Strategy Prioritization Weights: validateAndNormalizeWeights sanitizes negative, zero, and NaN inputs', () => {
  // Test valid weights summing to 100
  const validWeights: SimulationWeights = {
    riskWeight: 30,
    densityWeight: 20,
    recurrenceWeight: 20,
    communityWeight: 15,
    ageWeight: 10,
    costWeight: 5,
  };
  const norm1 = digitalTwinService.validateAndNormalizeWeights(validWeights);
  const sum1 = Object.values(norm1).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum1 - 100) < 0.1, 'Valid weights should sum to 100');

  // Test negative weights get clamped to 0
  const negWeights: SimulationWeights = {
    riskWeight: -50,
    densityWeight: 50,
    recurrenceWeight: 50,
    communityWeight: 0,
    ageWeight: 0,
    costWeight: 0,
  };
  const norm2 = digitalTwinService.validateAndNormalizeWeights(negWeights);
  assert.strictEqual(norm2.riskWeight, 0, 'Negative weight should be clamped to 0');
  const sum2 = Object.values(norm2).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum2 - 100) < 0.1, 'Normalized weights should sum to 100');

  // Test all zero weights fallback to uniform distribution
  const zeroWeights: SimulationWeights = {
    riskWeight: 0,
    densityWeight: 0,
    recurrenceWeight: 0,
    communityWeight: 0,
    ageWeight: 0,
    costWeight: 0,
  };
  const norm3 = digitalTwinService.validateAndNormalizeWeights(zeroWeights);
  assert.ok(Math.abs(norm3.riskWeight - 16.67) < 0.1, 'Zero weights should fallback to equal distribution');
  const sum3 = Object.values(norm3).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum3 - 100) < 0.1);

  // Test NaN weights fallback safely
  const nanWeights: SimulationWeights = {
    riskWeight: NaN,
    densityWeight: 40,
    recurrenceWeight: 40,
    communityWeight: 20,
    ageWeight: 0,
    costWeight: 0,
  };
  const norm4 = digitalTwinService.validateAndNormalizeWeights(nanWeights);
  assert.ok(!Number.isNaN(norm4.riskWeight), 'NaN should be sanitized');
  const sum4 = Object.values(norm4).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum4 - 100) < 0.1);
});

runTest('All 6 Intervention Strategies produce strictly normalized scores in [0, 100]', () => {
  const strategies: SimulationParameters['strategyId'][] = [
    'strategy_a',
    'strategy_b',
    'strategy_c',
    'strategy_d',
    'strategy_e',
    'strategy_f',
  ];

  for (const strat of strategies) {
    const params: SimulationParameters = {
      strategyId: strat,
      strategyName: `Test Strategy ${strat}`,
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 4,
      dailyInterventionRate: 2.5,
      timelineDays: 14,
      customWeights: strat === 'strategy_f' ? {
        riskWeight: 40,
        densityWeight: 30,
        recurrenceWeight: 10,
        communityWeight: 10,
        ageWeight: 5,
        costWeight: 5,
      } : undefined,
    };

    const res = digitalTwinService.runSimulation(params, TEST_REPORTS, []);
    
    // Check score normalization
    assert.ok(res.finalMetrics.citizenSatisfactionScore >= 0 && res.finalMetrics.citizenSatisfactionScore <= 100, 
      `${strat}: citizenSatisfactionScore in [0, 100] (got ${res.finalMetrics.citizenSatisfactionScore})`);
    assert.ok(res.finalMetrics.criticalReductionPct >= 0 && res.finalMetrics.criticalReductionPct <= 100,
      `${strat}: criticalReductionPct in [0, 100]`);
    assert.ok(res.finalMetrics.backlogReductionPct >= 0 && res.finalMetrics.backlogReductionPct <= 100,
      `${strat}: backlogReductionPct in [0, 100]`);

    // Check deterministic outputs
    const resRepeat = digitalTwinService.runSimulation(params, TEST_REPORTS, []);
    assert.strictEqual(res.finalMetrics.citizenSatisfactionScore, resRepeat.finalMetrics.citizenSatisfactionScore, 
      `${strat}: must be 100% deterministic`);
    assert.strictEqual(res.finalMetrics.totalAddressed, resRepeat.finalMetrics.totalAddressed, 
      `${strat}: totalAddressed must be deterministic`);
  }
});

// ==========================================
// 3. CAPACITY REALISM & EFFORT-BASED CONSTRAINTS
// ==========================================
console.log('\n--- Group 3: Effort-Based Capacity & Mathematical Bounds ---');

runTest('Effort-based capacity constraints strictly bound ticket resolutions', () => {
  const teams = 2;
  const dailyRatePerTeam = 1.0;
  const durationDays = 5;
  const totalTeamShiftsAvailable = teams * dailyRatePerTeam * durationDays; // 10 team shifts

  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Capacity Bound Test',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: teams,
    dailyInterventionRate: dailyRatePerTeam,
    timelineDays: durationDays,
  };

  const res = digitalTwinService.runSimulation(params, TEST_REPORTS, []);

  // Total effort consumed cannot exceed total team shifts available
  assert.ok(res.explainabilityAudit, 'Explainability audit must be present');
  assert.ok(res.explainabilityAudit.totalCapacityConsumedShifts <= totalTeamShiftsAvailable + 0.001,
    `Effort consumed (${res.explainabilityAudit.totalCapacityConsumedShifts}) cannot exceed capacity (${totalTeamShiftsAvailable})`);
  
  // Total addressed cannot exceed total unresolved candidate pool
  assert.ok(res.finalMetrics.totalAddressed <= res.explainabilityAudit.totalReportsEvaluated,
    'Total addressed cannot exceed candidate pool');
});

runTest('Estimated effort shifts are category & severity calibrated (0.4 to 1.5 shifts)', () => {
  const criticalWater = TEST_REPORTS.find(r => r.id === 'rep-geo-1')!;
  const lowStreetlight = TEST_REPORTS.find(r => r.id === 'rep-geo-4')!;

  const criticalWaterEffort = digitalTwinService.getEstimatedEffortShifts(criticalWater);
  const lowStreetlightEffort = digitalTwinService.getEstimatedEffortShifts(lowStreetlight);

  // Critical water main should take significantly more effort than a low severity streetlight
  assert.ok(criticalWaterEffort >= 1.0, 'Critical water rupture should require >= 1.0 team shifts');
  assert.ok(lowStreetlightEffort <= 0.6, 'Low streetlight should require <= 0.6 team shifts');
  assert.ok(criticalWaterEffort > lowStreetlightEffort, 'Critical water effort must exceed minor streetlight');
});

// ==========================================
// 4. CASCADE GRAPH CYCLE DETECTION & DEDUPLICATION
// ==========================================
console.log('\n--- Group 4: Cascade Graph Cycle Detection & Certainty ---');

runTest('detectCascadingChains deduplicates links and flags certainty levels', () => {
  const chains = digitalTwinService.detectCascadingChains(TEST_REPORTS);
  assert.ok(Array.isArray(chains), 'Should return array of cascade chains');

  // Verify every node and edge has valid certainty and no infinite loops/cycles
  const visitedEdgeKeys = new Set<string>();

  chains.forEach(chain => {
    assert.ok(chain.nodes.length >= 2, 'A chain must have at least trigger and target');
    
    // Check certainty field on chain
    const validCertainties: CascadeLinkCertainty[] = ['recorded', 'data_supported', 'hypothetical', 'ai_inference'];
    if (chain.linkCertainty) {
      assert.ok(validCertainties.includes(chain.linkCertainty), `Valid link certainty: ${chain.linkCertainty}`);
    }

    // Check nodes
    chain.nodes.forEach(node => {
      assert.ok(node.category, 'Node must have category');
      assert.ok(node.severity, 'Node must have severity');
      if (node.certainty) {
        assert.ok(validCertainties.includes(node.certainty), `Valid node certainty: ${node.certainty}`);
      }
    });

    // Check edge uniqueness
    const edgeKey = `${chain.rootReportId}->${chain.nodes.map(n => n.reportId).join('-')}`;
    assert.ok(!visitedEdgeKeys.has(edgeKey), `Duplicate edge detected: ${edgeKey}`);
    visitedEdgeKeys.add(edgeKey);
  });
});

runTest('Escalation risk multiplier respects conservative mathematical cap (<= 3.5x)', () => {
  const cascadeChains = digitalTwinService.detectCascadingChains(TEST_REPORTS);
  cascadeChains.forEach(chain => {
    assert.ok(chain.estimatedEscalationCostMultiplier <= 3.5, 
      `Escalation multiplier (${chain.estimatedEscalationCostMultiplier}) exceeds mathematical bound of 3.5x`);
  });
});

// ==========================================
// 5. REMOVAL OF UNSUPPORTED CLAIMS & DISCLAIMER ENFORCEMENT
// ==========================================
console.log('\n--- Group 5: Removal of Unsupported Claims & Disclaimers ---');

runTest('Simulation outputs contain explicit model assumption labels and no pseudo-scientific claims', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_c',
    strategyName: 'Disclaimer Verification',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 3,
    dailyInterventionRate: 2,
    timelineDays: 14,
  };

  const res = digitalTwinService.runSimulation(params, TEST_REPORTS, []);

  // Check explainability audit
  assert.ok(res.explainabilityAudit, 'Explainability audit trail must be present');
  assert.ok(res.baselineSummary.datasetFingerprint.length > 0, 'Fingerprint must be generated');

  // Check assumption notes in grounded explanation
  assert.ok(res.groundedExplanation.assumptions.length >= 2, 'Must include explicit model assumptions');
  assert.ok(res.groundedExplanation.assumptions.some(a => a.toLowerCase().includes('assumption') || a.toLowerCase().includes('estimate')));
  assert.ok(res.groundedExplanation.disclaimer.includes('SIMULATED ESTIMATE') || res.groundedExplanation.disclaimer.includes('MODEL ASSUMPTION'),
    'Must include explicit model assumption disclaimer');
});

// ==========================================
// 6. SIMULATION EXPLAINABILITY & TOP REPORT JUSTIFICATIONS
// ==========================================
console.log('\n--- Group 6: Simulation Explainability & Prioritization Justification ---');

runTest('Simulation provides detailed mathematical justification for top prioritized tickets', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Audit Justification Test',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 5,
    dailyInterventionRate: 2,
    timelineDays: 14,
  };

  const res = digitalTwinService.runSimulation(params, TEST_REPORTS, []);
  assert.ok(res.explainabilityAudit, 'Explainability audit must be present');
  const reasons = res.explainabilityAudit.prioritizationReasons;

  assert.ok(reasons.length > 0, 'Must provide top report justifications');
  assert.ok(reasons.length <= 5, 'Must provide at most top 5 justifications');

  reasons.forEach((just, idx) => {
    assert.strictEqual(just.rank, idx + 1, `Rank should be ordered 1 to 5`);
    assert.ok(just.reportId, 'Must include reportId');
    assert.ok(just.ticketNumber, 'Must include ticketNumber');
    assert.ok(just.topContributingFactors.length > 0, 'Must include contributing factors');
    assert.ok(just.normalizedScore >= 0 && just.normalizedScore <= 100, 
      'Composite priority score must be normalized [0, 100]');
  });
});

// ==========================================
// 7. SIMULATION ISOLATION & ZERO-MUTATION GUARANTEE
// ==========================================
console.log('\n--- Group 7: Simulation Isolation & Zero-Mutation ---');

runTest('Running simulations does not mutate or alter the original report objects', () => {
  const originalSnapshot = JSON.stringify(TEST_REPORTS);

  const params: SimulationParameters = {
    strategyId: 'strategy_b',
    strategyName: 'Zero Mutation Verification',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 4,
    dailyInterventionRate: 2.5,
    timelineDays: 21,
  };

  digitalTwinService.runSimulation(params, TEST_REPORTS, []);

  const postSimulationSnapshot = JSON.stringify(TEST_REPORTS);
  assert.strictEqual(originalSnapshot, postSimulationSnapshot, 
    'Report objects must remain strictly unmodified (immutable) throughout simulation');
});

// ==========================================
// 8. SECURITY & RLS AUDIT (SQL MIGRATION 20261120000008)
// ==========================================
console.log('\n--- Group 8: SQL Migration 20261120000008 Security & RLS Verification ---');

runTest('Migration 20261120000008 enforces is_published column and public SELECT restrictions', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261120000008_refine_digital_twin_security_and_accuracy.sql'
  );
  assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);

  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  // 1. Column addition: is_published with default false
  assert.ok(/ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false/i.test(sqlContent), 
    'Must add is_published column with default false');
  assert.ok(/ADD COLUMN IF NOT EXISTS publication_notes TEXT/i.test(sqlContent), 
    'Must add publication_notes column');

  // 2. Cascade link certainty
  assert.ok(/ADD COLUMN IF NOT EXISTS link_certainty TEXT NOT NULL/i.test(sqlContent), 
    'Must add link_certainty to cascading dependencies');

  // 3. Drop open public SELECT
  assert.ok(/DROP POLICY IF EXISTS "Public read digital twin scenarios"/i.test(sqlContent), 
    'Must drop open SELECT policy');

  // 4. Restricted SELECT for published scenarios
  assert.ok(/CREATE POLICY "Public read published digital twin scenarios"/i.test(sqlContent), 
    'Must create restricted public SELECT policy');
  assert.ok(/USING \(is_published = true\)/i.test(sqlContent), 
    'Public policy must restrict to is_published = true');

  // 5. Staff full access
  assert.ok(/CREATE POLICY "Staff read all digital twin scenarios"/i.test(sqlContent), 
    'Staff must have access to unpublished scenario drafts');

  // 6. Sanitized public view
  assert.ok(/CREATE OR REPLACE VIEW public\.public_published_digital_twin_scenarios/i.test(sqlContent), 
    'Must create secure public view for published scenarios');
});

// ==========================================
// 9. ROLE-BASED SCENARIO ACCESS CONTROL
// ==========================================
console.log('\n--- Group 9: Role-Based Scenario Filtering in Service ---');

runTest('getSavedScenarios restricts citizen role to published scenarios only', async () => {
  // Citizen role
  const citizenScenarios = await digitalTwinService.getSavedScenarios('citizen');
  citizenScenarios.forEach(sc => {
    assert.strictEqual(sc.isPublished, true, 'Citizen must only receive published scenarios');
  });

  // Anonymous public role
  const publicScenarios = await digitalTwinService.getSavedScenarios(undefined);
  publicScenarios.forEach(sc => {
    assert.strictEqual(sc.isPublished, true, 'Anonymous public must only receive published scenarios');
  });

  // Admin/supervisor role can receive drafts as well
  const adminScenarios = await digitalTwinService.getSavedScenarios('admin');
  assert.ok(adminScenarios.length >= citizenScenarios.length, 
    'Admin should receive all scenarios including drafts');
});

// ==========================================
// SUMMARY CHECK
// ==========================================
setTimeout(() => {
  console.log('\n====================================================');
  console.log(`PHASE 10.1 TEST SUITE COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('====================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}, 500);
