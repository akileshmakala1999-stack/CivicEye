import assert from 'assert';
import fs from 'fs';
import path from 'path';
import './setupMockBrowser';

import {
  DashboardReport,
  SimulationParameters,
} from '../types';
import {
  digitalTwinService,
  isValidGlobalCoordinate,
  isInGeographicBounds,
  projectCoordinates,
  DEFAULT_VIEWPORT_BOUNDS,
  METROPOLITAN_COVERAGE_BOUNDS,
  OFFICIAL_MUNICIPAL_BOUNDARY_SPEC,
  AUTHENTIC_WARD_CENTROIDS,
  resolveReportLocation,
  SCORING_FACTORS_SPEC,
  computeRecurrenceScore,
  computeCascadeScore,
} from '../services/digitalTwinService';

console.log('================================================================');
console.log('CIVICEYE — PHASE 10.2 COMPREHENSIVE VERIFICATION SUITE');
console.log('Final Security, Geographic Accuracy & Model Calibration Audit');
console.log('================================================================\n');

// Mock Reports with varying geographic and recurrence profiles
const TEST_REPORTS: DashboardReport[] = [
  {
    id: 'rep-p10-1',
    ticketNumber: 'REP-2026-A101',
    title: 'Severe Under-Road Water Conduit Leak',
    category: 'Water leakage',
    severity: 'critical',
    status: 'Submitted',
    reportDate: '2026-11-18',
    reportTimestamp: '2026-11-18T08:00:00Z',
    description: 'High-pressure pipe rupture near Road 36',
    departmentAssigned: 'HMWSSB',
    timeline: [],
    location: 'Road No. 36, Jubilee Hills',
    neighborhood: 'Jubilee Hills',
    latitude: 17.4325,
    longitude: 78.4071,
    confirmationsCount: 15,
    stillExistsCount: 10,
    gettingWorseCount: 8,
    isRecurring: true,
    riskScore: 92,
  },
  {
    id: 'rep-p10-2',
    ticketNumber: 'REP-2026-A102',
    title: 'Asphalt Subsidence and Trench Cave-in',
    category: 'Road damage',
    severity: 'critical',
    status: 'Under Review',
    reportDate: '2026-11-19',
    reportTimestamp: '2026-11-19T09:30:00Z',
    description: 'Subsurface erosion collapse downstream of pipeline break',
    departmentAssigned: 'GHMC',
    timeline: [],
    location: 'Road No. 36 Near Metro, Jubilee Hills',
    neighborhood: 'Jubilee Hills',
    latitude: 17.4332,
    longitude: 78.4080,
    confirmationsCount: 18,
    stillExistsCount: 12,
    gettingWorseCount: 9,
    isRecurring: false,
    riskScore: 90,
  },
  {
    id: 'rep-p10-3',
    ticketNumber: 'REP-2026-A103',
    title: 'Regional Drainage Silt Blockage',
    category: 'Drainage',
    severity: 'high',
    status: 'In Progress',
    reportDate: '2026-11-17',
    reportTimestamp: '2026-11-17T10:00:00Z',
    description: 'Outflow blocked by silt accumulation',
    departmentAssigned: 'GHMC',
    timeline: [],
    location: 'Outer Ring Corridor',
    neighborhood: 'Madhapur',
    // Outside central viewport, inside metropolitan envelope
    latitude: 17.3600,
    longitude: 78.4800,
    confirmationsCount: 8,
    stillExistsCount: 4,
    gettingWorseCount: 2,
    isRecurring: false,
    riskScore: 75,
  },
  {
    id: 'rep-p10-4',
    ticketNumber: 'REP-2026-A104',
    title: 'Neighborhood Refuse Delay with Missing GPS',
    category: 'Garbage',
    severity: 'medium',
    status: 'Submitted',
    reportDate: '2026-11-16',
    reportTimestamp: '2026-11-16T11:00:00Z',
    description: 'Waste collection delayed for 3 days',
    departmentAssigned: 'GHMC',
    timeline: [],
    location: 'Begumpet Sector Lane',
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
    id: 'rep-p10-5',
    ticketNumber: 'REP-2026-A105',
    title: 'Corrupted Coordinate Report',
    category: 'Electrical Hazard',
    severity: 'critical',
    status: 'Submitted',
    reportDate: '2026-11-15',
    reportTimestamp: '2026-11-15T12:00:00Z',
    description: 'GPS antenna failure reporting out of range coordinates',
    departmentAssigned: 'TSSPDCL',
    timeline: [],
    location: 'Unknown Sensor Field',
    neighborhood: 'Kondapur',
    latitude: 999.0, // Invalid lat (> 90)
    longitude: -250.0, // Invalid lng (< -180)
    confirmationsCount: 1,
    stillExistsCount: 0,
    gettingWorseCount: 0,
    isRecurring: false,
    riskScore: 80,
  },
  {
    id: 'rep-p10-6',
    ticketNumber: 'REP-2026-A106',
    title: 'Report with Unknown Neighborhood and No GPS',
    category: 'Streetlights',
    severity: 'low',
    status: 'Submitted',
    reportDate: '2026-11-14',
    reportTimestamp: '2026-11-14T14:00:00Z',
    description: 'Streetlight pole dark on unlisted lane',
    departmentAssigned: 'TSSPDCL',
    timeline: [],
    location: 'Unlisted Village Periphery',
    neighborhood: undefined as any,
    latitude: undefined,
    longitude: undefined,
    confirmationsCount: 2,
    stillExistsCount: 1,
    gettingWorseCount: 0,
    isRecurring: false,
    riskScore: 25,
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

// ==============================================================================
// 1. SECURITY & DATABASE RLS AUTHORIZATION TESTS
// ==============================================================================
console.log('\n--- Group 1: Staff Authorization & Database RLS Security ---');

runTest('Citizens and anonymous users CANNOT read unpublished scenarios', async () => {
  // Save an unpublished draft scenario
  const draftId = `draft-${Date.now()}`;
  await digitalTwinService.saveScenario({
    id: draftId,
    name: 'Internal Scratchpad Draft Scenario',
    description: 'Unpublished crew optimization study',
    createdByRole: 'supervisor',
    createdAt: new Date().toISOString(),
    datasetFingerprint: 'test-hash',
    parameters: {
      strategyId: 'strategy_a',
      strategyName: 'Draft Sim',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 3,
      dailyInterventionRate: 2,
      timelineDays: 14,
    },
    result: {} as any,
    isPublished: false, // UNPUBLISHED DRAFT
  });

  // Citizen role must NOT receive the unpublished draft
  const citizenScenarios = await digitalTwinService.getSavedScenarios('citizen');
  assert.strictEqual(
    citizenScenarios.some((s) => s.id === draftId),
    false,
    'Citizen must not be able to retrieve unpublished draft scenarios'
  );

  // Anonymous public must NOT receive the unpublished draft
  const publicScenarios = await digitalTwinService.getSavedScenarios(undefined);
  assert.strictEqual(
    publicScenarios.some((s) => s.id === draftId),
    false,
    'Anonymous public must not be able to retrieve unpublished draft scenarios'
  );

  // Municipal supervisor role CAN view the draft
  const supervisorScenarios = await digitalTwinService.getSavedScenarios('supervisor');
  assert.strictEqual(
    supervisorScenarios.some((s) => s.id === draftId),
    true,
    'Supervisor must have access to unpublished draft scenarios'
  );
});

runTest('Citizens and field staff are strictly prohibited from publishing scenarios', async () => {
  const testScenarioId = `draft-publish-${Date.now()}`;
  await digitalTwinService.saveScenario({
    id: testScenarioId,
    name: 'Draft for Publish Gate Test',
    description: 'Testing authorization gate',
    createdByRole: 'staff',
    createdAt: new Date().toISOString(),
    datasetFingerprint: 'test-hash',
    parameters: {
      strategyId: 'strategy_a',
      strategyName: 'Draft Sim',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 3,
      dailyInterventionRate: 2,
      timelineDays: 14,
    },
    result: {} as any,
    isPublished: false,
  });

  // Citizen attempting to publish must throw an authorization error
  await assert.rejects(
    async () => {
      await digitalTwinService.publishScenario(testScenarioId, 'Malicious Citizen', 'citizen');
    },
    /Unauthorized.*supervisors or administrators/i,
    'Citizen must be blocked from publishing scenarios'
  );

  // Field staff attempting to publish must throw an authorization error
  await assert.rejects(
    async () => {
      await digitalTwinService.publishScenario(testScenarioId, 'Field Squad Worker', 'staff');
    },
    /Unauthorized.*supervisors or administrators/i,
    'Field staff must be blocked from publishing scenarios'
  );

  // Supervisor IS authorized to publish
  await digitalTwinService.publishScenario(testScenarioId, 'Chief Supervisor Rao', 'supervisor');
  const scenarios = await digitalTwinService.getSavedScenarios('citizen');
  const published = scenarios.find((s) => s.id === testScenarioId);
  assert.ok(published && published.isPublished === true, 'Supervisor should successfully publish scenario');
});

runTest('Citizens and field staff are strictly prohibited from deleting scenarios', async () => {
  const deleteTestId = `draft-delete-${Date.now()}`;
  await digitalTwinService.saveScenario({
    id: deleteTestId,
    name: 'Draft for Delete Gate Test',
    description: 'Testing delete authorization gate',
    createdByRole: 'supervisor',
    createdAt: new Date().toISOString(),
    datasetFingerprint: 'test-hash',
    parameters: {
      strategyId: 'strategy_a',
      strategyName: 'Draft Sim',
      targetArea: 'citywide',
      targetCategory: 'all',
      activeTeams: 3,
      dailyInterventionRate: 2,
      timelineDays: 14,
    },
    result: {} as any,
    isPublished: false,
  });

  // Citizen attempting to delete must throw an error
  await assert.rejects(
    async () => {
      await digitalTwinService.deleteScenario(deleteTestId, 'citizen');
    },
    /Unauthorized.*supervisors or administrators/i,
    'Citizen must be blocked from deleting scenarios'
  );

  // Field staff attempting to delete must throw an error
  await assert.rejects(
    async () => {
      await digitalTwinService.deleteScenario(deleteTestId, 'staff');
    },
    /Unauthorized.*supervisors or administrators/i,
    'Field staff must be blocked from deleting scenarios'
  );
});

runTest('SQL Migration 20261121000009 eliminates auth.role() = authenticated vulnerability', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261121000009_phase10_2_security_geo_calibration.sql'
  );
  assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);

  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  // 1. authorized_staff_roles table creation
  assert.ok(
    /CREATE TABLE IF NOT EXISTS public\.authorized_staff_roles/i.test(sqlContent),
    'Must create authorized_staff_roles table'
  );
  assert.ok(
    /staff_role VARCHAR\(32\) NOT NULL CHECK \(staff_role IN \('reviewer', 'staff', 'dispatcher', 'supervisor', 'admin'\)\)/i.test(
      sqlContent
    ),
    'Must enforce valid staff_role check constraint'
  );

  // 2. SECURITY DEFINER helper function
  assert.ok(
    /CREATE OR REPLACE FUNCTION public\.get_authenticated_staff_role/i.test(sqlContent),
    'Must declare get_authenticated_staff_role function'
  );
  assert.ok(
    /SECURITY DEFINER/i.test(sqlContent),
    'Role functions must execute as SECURITY DEFINER'
  );
  assert.ok(
    /CREATE OR REPLACE FUNCTION public\.is_staff_member/i.test(sqlContent),
    'Must declare is_staff_member helper'
  );
  assert.ok(
    /CREATE OR REPLACE FUNCTION public\.is_supervisor_or_admin/i.test(sqlContent),
    'Must declare is_supervisor_or_admin helper'
  );

  // 3. Drop flawed open read policies
  assert.ok(
    /DROP POLICY IF EXISTS "Staff read all digital twin scenarios"/i.test(sqlContent),
    'Must drop legacy open staff policy'
  );

  // 4. Strict staff policy requiring is_staff_member()
  assert.ok(
    /CREATE POLICY "Verified staff read all digital twin scenarios"/i.test(sqlContent),
    'Must declare Verified staff read policy'
  );
  assert.ok(
    /USING \(public\.is_staff_member\(\) OR auth\.role\(\) = 'service_role'\)/i.test(sqlContent),
    'Staff policy must require is_staff_member()'
  );

  // 5. Citizen policy strictly restricting to is_published = true
  assert.ok(
    /CREATE POLICY "Citizens read published digital twin scenarios"/i.test(sqlContent),
    'Must declare Citizens read published policy'
  );
  assert.ok(
    /USING \(is_published = true\)/i.test(sqlContent),
    'Citizen policy must check is_published = true'
  );

  // 6. Mutation privilege revocation from anon/authenticated
  assert.ok(
    /REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public\.authorized_staff_roles FROM anon, authenticated, public/i.test(
      sqlContent
    ),
    'Must revoke mutation permissions on authorized_staff_roles'
  );
});

// ==============================================================================
// 2. METROPOLITAN GEOGRAPHIC BOUNDARY ACCURACY & CONFIGURABILITY
// ==============================================================================
console.log('\n--- Group 2: Geographic Boundary Accuracy & Configurability ---');

runTest('Global coordinate safety strictly checks valid Earth ranges and rejects Null Island', () => {
  assert.strictEqual(isValidGlobalCoordinate(17.43, 78.40), true);
  assert.strictEqual(isValidGlobalCoordinate(10.0, 20.0), true);
  assert.strictEqual(isValidGlobalCoordinate(-89.9, 179.9), true);
  // Null Island (0,0) rejected
  assert.strictEqual(isValidGlobalCoordinate(0, 0), false);
  // Out of Earth ranges
  assert.strictEqual(isValidGlobalCoordinate(90.1, 78.40), false);
  assert.strictEqual(isValidGlobalCoordinate(17.43, 180.1), false);
  assert.strictEqual(isValidGlobalCoordinate(NaN, 78.40), false);
  assert.strictEqual(isValidGlobalCoordinate(undefined, 78.40), false);
});

runTest('Configurable boundary tiers are separated and labeled as approximate envelopes', () => {
  // Viewport bounds
  assert.strictEqual(DEFAULT_VIEWPORT_BOUNDS.isApproximate, true);
  assert.ok(DEFAULT_VIEWPORT_BOUNDS.label.includes('Pilot Viewport'));

  // Metropolitan coverage bounds
  assert.strictEqual(METROPOLITAN_COVERAGE_BOUNDS.isApproximate, true);
  assert.ok(METROPOLITAN_COVERAGE_BOUNDS.label.includes('Approximate Bounding Envelope'));
  assert.ok(!METROPOLITAN_COVERAGE_BOUNDS.label.includes('Official Legal Cadastre'));

  // Authoritative boundary spec indicates dataset not available in local repo
  assert.strictEqual(OFFICIAL_MUNICIPAL_BOUNDARY_SPEC.isDatasetAvailable, false);
  assert.ok(OFFICIAL_MUNICIPAL_BOUNDARY_SPEC.disclaimer.includes('Authoritative GHMC legal boundary polygon dataset not currently ingested'));

  // Test isInGeographicBounds
  assert.strictEqual(isInGeographicBounds(17.43, 78.40, METROPOLITAN_COVERAGE_BOUNDS), true);
  assert.strictEqual(isInGeographicBounds(10.00, 78.40, METROPOLITAN_COVERAGE_BOUNDS), false);
});

runTest('filterGeographicReports preserves outside-viewport and missing GPS without data loss', () => {
  const filtered = digitalTwinService.filterGeographicReports(TEST_REPORTS, DEFAULT_VIEWPORT_BOUNDS);

  // 1. In viewport verified GPS: rep-p10-1, rep-p10-2
  assert.strictEqual(filtered.inViewportReports.length, 2, 'Should identify 2 in-viewport GPS reports');

  // 2. Outside viewport verified GPS: rep-p10-3 (Madhapur outer sector)
  assert.strictEqual(filtered.outsideViewportReports.length, 1, 'Should retain 1 outside-viewport report');

  // 3. Approximate ward centroid: rep-p10-4 (Begumpet)
  const centroidReport = filtered.validReports.find((r) => r.id === 'rep-p10-4');
  assert.ok(centroidReport, 'Begumpet report should have centroid fallback on valid canvas');
  assert.strictEqual(centroidReport.accuracyLevel, 'approximate_centroid');

  // 4. Invalid coordinates: rep-p10-5
  assert.strictEqual(filtered.invalidCoordinateReports.length, 1, 'Should isolate corrupt coordinate report');

  // 5. Missing GPS + unknown ward: rep-p10-6
  assert.strictEqual(filtered.missingCoordinateReports.length, 1, 'Should isolate unmapped report');

  // Non-destructive preservation check
  assert.strictEqual(filtered.allEvaluatedCount, TEST_REPORTS.length, 'All reports must be accounted for');
});

runTest('projectCoordinates handles missing coordinates safely with default fallback', () => {
  const pDefault = projectCoordinates(undefined, undefined);
  assert.strictEqual(pDefault.x, 50, 'Default x should be 50');
  assert.strictEqual(pDefault.y, 50, 'Default y should be 50');

  const pCustom = projectCoordinates(undefined, undefined, 40, 60);
  assert.strictEqual(pCustom.x, 40);
  assert.strictEqual(pCustom.y, 60);
});

// ==============================================================================
// 3. SCORING CALIBRATION & MODEL ASSUMPTIONS TRANSPARENCY
// ==============================================================================
console.log('\n--- Group 3: Scoring Calibration & Model Assumptions ---');

runTest('Scoring Factor Registry documents purpose, formula, and explicit calibration status', () => {
  const factorKeys = Object.keys(SCORING_FACTORS_SPEC);
  assert.ok(factorKeys.length >= 7, 'Must register at least 7 primary scoring factors');

  // Verify explicit calibration status on each factor
  assert.strictEqual(SCORING_FACTORS_SPEC.hazard_severity.calibrationStatus, 'RULE-BASED');
  assert.strictEqual(SCORING_FACTORS_SPEC.risk_score.calibrationStatus, 'DATA-DERIVED');
  assert.strictEqual(SCORING_FACTORS_SPEC.spatial_density.calibrationStatus, 'DATA-DERIVED');
  assert.strictEqual(SCORING_FACTORS_SPEC.community_impact.calibrationStatus, 'DATA-DERIVED');
  assert.strictEqual(SCORING_FACTORS_SPEC.backlog_age.calibrationStatus, 'DATA-DERIVED');
  assert.strictEqual(SCORING_FACTORS_SPEC.recurrence.calibrationStatus, 'MODEL ASSUMPTION');
  assert.strictEqual(SCORING_FACTORS_SPEC.cascade_potential.calibrationStatus, 'MODEL ASSUMPTION');
  assert.strictEqual(SCORING_FACTORS_SPEC.crew_effort.calibrationStatus, 'MODEL ASSUMPTION');

  // Verify factors have documented limitations
  factorKeys.forEach((key) => {
    const factor = SCORING_FACTORS_SPEC[key];
    assert.ok(factor.name.length > 0);
    assert.ok(factor.formula.length > 0);
    assert.ok(factor.limitations.length > 0, `${key} must document limitations`);
  });
});

runTest('Dynamic Recurrence Scoring distinguishes empirical corroboration from boolean assumption', () => {
  // Case A: Corroborating reports in same ward (Jubilee Hills has multiple water/road defects)
  const candidatePool: DashboardReport[] = [
    TEST_REPORTS[0], // Jubilee Hills, Water leakage
    { ...TEST_REPORTS[0], id: 'rep-extra-1' }, // Corroborating water report in Jubilee Hills
    { ...TEST_REPORTS[0], id: 'rep-extra-2' }, // Second corroborating water report
  ];

  const scoreCorroborated = computeRecurrenceScore(TEST_REPORTS[0], candidatePool);
  assert.strictEqual(scoreCorroborated.status, 'DATA-DERIVED');
  assert.ok(scoreCorroborated.score >= 70);

  // Case B: Single report with boolean isRecurring flag only
  const singleReport = TEST_REPORTS[0];
  const scoreAssumption = computeRecurrenceScore(singleReport, [singleReport]);
  assert.strictEqual(scoreAssumption.status, 'MODEL ASSUMPTION');
  assert.strictEqual(scoreAssumption.score, 80);
});

runTest('Cascade Scoring differentiates recorded links from proximity assumptions', () => {
  const recorded = computeCascadeScore(true, 'recorded');
  assert.strictEqual(recorded.status, 'RULE-BASED');
  assert.strictEqual(recorded.score, 90);

  const proximity = computeCascadeScore(true, 'data_supported');
  assert.strictEqual(proximity.status, 'MODEL ASSUMPTION');
  assert.strictEqual(proximity.score, 75);

  const hypothetical = computeCascadeScore(true, 'hypothetical');
  assert.strictEqual(hypothetical.status, 'MODEL ASSUMPTION');
  assert.strictEqual(hypothetical.score, 45);

  const isolated = computeCascadeScore(false);
  assert.strictEqual(isolated.score, 10);
});

runTest('Simulation explainability audit provides factor breakdown and calibration status', () => {
  const params: SimulationParameters = {
    strategyId: 'strategy_a',
    strategyName: 'Calibration Verification',
    targetArea: 'citywide',
    targetCategory: 'all',
    activeTeams: 4,
    dailyInterventionRate: 2,
    timelineDays: 14,
  };

  const res = digitalTwinService.runSimulation(params, TEST_REPORTS, []);
  assert.ok(res.explainabilityAudit, 'Explainability audit must be present');

  const reasons = res.explainabilityAudit.prioritizationReasons;
  assert.ok(reasons.length > 0, 'Must include prioritized reasons');

  reasons.forEach((reason) => {
    assert.ok(reason.primaryCalibrationStatus, 'Each prioritized reason must report primary calibration status');
    assert.ok(
      ['DATA-DERIVED', 'RULE-BASED', 'MODEL ASSUMPTION'].includes(reason.primaryCalibrationStatus!),
      `Valid calibration status: ${reason.primaryCalibrationStatus}`
    );

    if (reason.factorContributions) {
      assert.ok(reason.factorContributions.length >= 2, 'Must itemize multiple contributing factors');
      reason.factorContributions.forEach((contrib) => {
        assert.ok(contrib.factorName, 'Must have factorName');
        assert.ok(contrib.calibrationStatus, 'Must have calibrationStatus');
        assert.ok(contrib.weightedScore >= 0, 'Weighted score must be non-negative');
      });
    }
  });
});

// ==============================================================================
// 4. WARD CENTROID AUTHENTICITY & LOCATION ACCURACY
// ==============================================================================
console.log('\n--- Group 4: Ward Centroid Authenticity & Location Accuracy ---');

runTest('Ward Centroid Registry has documented provenance and valid metropolitan coordinates', () => {
  const wards = Object.keys(AUTHENTIC_WARD_CENTROIDS);
  assert.strictEqual(wards.length, 6, 'Must define all 6 pilot wards');

  wards.forEach((wardKey) => {
    const record = AUTHENTIC_WARD_CENTROIDS[wardKey as keyof typeof AUTHENTIC_WARD_CENTROIDS];
    assert.ok(record.code, 'Ward must have code');
    assert.ok(record.sourceDataset.includes('Telangana Open Data'), 'Must document provenance from Telangana Open Data');
    assert.strictEqual(record.isApproximateCentroid, true, 'Must flag isApproximateCentroid');
    assert.ok(record.limitationNotice.includes('Approximate Ward Location'), 'Must include explicit limitation notice');

    // Coordinate validation within Hyderabad bounds
    assert.ok(record.lat >= 17.30 && record.lat <= 17.55, `${wardKey} lat must be within Hyderabad limits`);
    assert.ok(record.lng >= 78.25 && record.lng <= 78.60, `${wardKey} lng must be within Hyderabad limits`);
  });
});

runTest('resolveReportLocation classifies GPS vs centroid vs unlocated without fabrication', () => {
  // 1. Verified GPS
  const locGps = resolveReportLocation(TEST_REPORTS[0]);
  assert.strictEqual(locGps.accuracyLevel, 'verified_gps');
  assert.strictEqual(locGps.isApproximate, false);
  assert.strictEqual(locGps.effectiveLat, TEST_REPORTS[0].latitude);

  // 2. Ward Centroid Approximation
  const locCentroid = resolveReportLocation(TEST_REPORTS[3]); // Begumpet without GPS
  assert.strictEqual(locCentroid.accuracyLevel, 'ward_centroid_approximation');
  assert.strictEqual(locCentroid.isApproximate, true);
  assert.ok(locCentroid.provenance.includes('Telangana Open Data'));
  assert.ok(locCentroid.limitationNotice!.includes('Does not indicate exact physical incident coordinates'));

  // 3. Corrupted GPS
  const locInvalid = resolveReportLocation(TEST_REPORTS[4]); // 999 lat
  assert.strictEqual(locInvalid.accuracyLevel, 'invalid_coordinates');
  assert.strictEqual(locInvalid.isApproximate, true);

  // 4. Unlisted neighborhood without GPS
  const locUnavailable = resolveReportLocation(TEST_REPORTS[5]); // unlisted ward
  assert.strictEqual(locUnavailable.accuracyLevel, 'location_unavailable');
  assert.strictEqual(locUnavailable.effectiveLat, undefined);
  assert.strictEqual(locUnavailable.effectiveLng, undefined);
});

// ==============================================================================
// SUMMARY CHECK
// ==============================================================================
setTimeout(() => {
  console.log('\n================================================================');
  console.log(`PHASE 10.2 TEST SUITE COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}, 500);
