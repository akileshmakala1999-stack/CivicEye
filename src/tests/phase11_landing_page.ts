import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('CIVICEYE — PHASE 11 FINAL CORRECTION VERIFICATION SUITE');
console.log('Minimal Cinematic Landing Page + Animations (Zero Feature Showcase)');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`  ✓ PASS: ${testName}`);
    totalPassed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}`);
    totalFailed++;
  }
}

// ==============================================================================
// 1. ASSET EXISTENCE & INTEGRITY CHECKS
// ==============================================================================
console.log('--- Group 1: Atmospheric Visual Asset Integrity ---');

runTest('Atmospheric Hyderabad city visual exists on disk in public/images/', () => {
  const assetPath = path.resolve(process.cwd(), 'public', 'images', 'hero_hyderabad_city.png');
  assert.ok(fs.existsSync(assetPath), 'hero_hyderabad_city.png must exist');
  const stats = fs.statSync(assetPath);
  assert.ok(stats.size > 50000, `Asset must be high resolution (${stats.size} bytes)`);
});

// ==============================================================================
// 2. HERO CONTENT & EXACT WORDING CHECKS
// ==============================================================================
console.log('\n--- Group 2: Hero Content & Exact Editorial Wording ---');

runTest('CinematicHero contains exact headline with forest green highlight', () => {
  const heroPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'CinematicHero.tsx');
  const heroCode = fs.readFileSync(heroPath, 'utf-8');

  // Headline line 1
  assert.ok(heroCode.includes('Better cities begin'), 'Must include first line "Better cities begin"');
  // Highlighted line 2
  assert.ok(heroCode.includes('people who care.'), 'Must include highlighted text "people who care."');
  assert.ok(heroCode.includes('text-[#315C4C]'), 'Highlighted text must use forest green #315C4C');
});

runTest('CinematicHero contains exact supporting copy', () => {
  const heroPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'CinematicHero.tsx');
  const heroCode = fs.readFileSync(heroPath, 'utf-8');

  assert.ok(
    heroCode.includes('Every improvement begins when someone notices, cares, and takes the first step.'),
    'Must include exact supporting copy'
  );
});

runTest('CinematicHero contains exact entry action buttons', () => {
  const heroPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'CinematicHero.tsx');
  const heroCode = fs.readFileSync(heroPath, 'utf-8');

  // Explore CivicEye button -> /dashboard
  assert.ok(heroCode.includes('Explore CivicEye'), 'Must contain "Explore CivicEye" CTA');
  assert.ok(heroCode.includes('to="/dashboard"'), '"Explore CivicEye" must route to /dashboard');

  // Sign In button -> /signin
  assert.ok(heroCode.includes('Sign In'), 'Must contain "Sign In" button');
  assert.ok(heroCode.includes('to="/signin"'), '"Sign In" must route to /signin');
});

runTest('CinematicHero visual composition has no infographics or fake widgets', () => {
  const heroPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'CinematicHero.tsx');
  const heroCode = fs.readFileSync(heroPath, 'utf-8');

  // No fake widgets or feature labels
  assert.ok(!heroCode.includes('Civic Intelligence for a Smarter Hyderabad'), 'Must not contain fake widget cards');
  assert.ok(!heroCode.includes('Critical Infrastructure Alert'), 'Must not contain infographic alert labels');
  assert.ok(!heroCode.includes('Water Pipeline Inspection'), 'Must not contain infographic feature labels');
  assert.ok(!heroCode.includes('Sanitation & Waste'), 'Must not contain feature badges');

  // Has subtle glowing beacons & delicate arcs
  assert.ok(heroCode.includes('animate-ping'), 'Must contain subtle pulsing luminous points');
  assert.ok(heroCode.includes('strokeDasharray'), 'Must contain delicate connection arcs');
});

// ==============================================================================
// 3. MINIMAL LANDING PAGE STRUCTURE (ZERO FEATURE SHOWCASE)
// ==============================================================================
console.log('\n--- Group 3: Minimal Landing Page Architecture ---');

runTest('LandingPage renders ONLY the CinematicHero with zero extra feature sections', () => {
  const landingPath = path.resolve(process.cwd(), 'src', 'pages', 'LandingPage.tsx');
  const landingCode = fs.readFileSync(landingPath, 'utf-8');

  assert.ok(landingCode.includes('CinematicHero'), 'Must render CinematicHero');

  // Strict negative checks
  assert.ok(!landingCode.includes('ChallengeAndWorkflow'), 'Must NOT include ChallengeAndWorkflow');
  assert.ok(!landingCode.includes('CivicIntelligenceSection'), 'Must NOT include CivicIntelligenceSection');
  assert.ok(!landingCode.includes('DigitalTwinPreviewSection'), 'Must NOT include DigitalTwinPreviewSection');
  assert.ok(!landingCode.includes('TransparencyAndCommunitySection'), 'Must NOT include TransparencyAndCommunitySection');
  assert.ok(!landingCode.includes('FinalCtaBanner'), 'Must NOT include FinalCtaBanner');
});

// ==============================================================================
// 4. NAVBAR MINIMALISM & ROUTING
// ==============================================================================
console.log('\n--- Group 4: Navbar Minimalism & Routing ---');

runTest('Navbar renders minimal layout on landing page with Logo, Sign In, and Explore', () => {
  const navPath = path.resolve(process.cwd(), 'src', 'components', 'layout', 'Navbar.tsx');
  const navCode = fs.readFileSync(navPath, 'utf-8');

  assert.ok(navCode.includes("location.pathname === '/'"), 'Must check for landing page route');
  assert.ok(navCode.includes('to="/signin"'), 'Must have Sign In link');
  assert.ok(navCode.includes('to="/dashboard"'), 'Must have Explore link');
  assert.ok(navCode.includes('Logo'), 'Must render CivicEye logo');
});

// ==============================================================================
// 5. FOOTER MINIMALISM
// ==============================================================================
console.log('\n--- Group 5: Footer Minimalism ---');

runTest('Footer renders minimal text on landing page without feature navigation groups', () => {
  const footerPath = path.resolve(process.cwd(), 'src', 'components', 'layout', 'Footer.tsx');
  const footerCode = fs.readFileSync(footerPath, 'utf-8');

  assert.ok(footerCode.includes("location.pathname === '/'"), 'Must check for landing page route');
  assert.ok(
    footerCode.includes('Building a better city, together.'),
    'Must contain minimal tagline "Building a better city, together."'
  );
  assert.ok(footerCode.includes('All rights reserved.'), 'Must contain subtle copyright line');
});

// ==============================================================================
// 6. MOTION & ACCESSIBILITY
// ==============================================================================
console.log('\n--- Group 6: Motion & Accessibility Compliance ---');

runTest('CinematicHero honors prefers-reduced-motion', () => {
  const heroPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'CinematicHero.tsx');
  const heroCode = fs.readFileSync(heroPath, 'utf-8');

  assert.ok(heroCode.includes('useReducedMotion'), 'Must use useReducedMotion hook');
  assert.ok(heroCode.includes('shouldReduceMotion'), 'Must conditionally bypass animation on reduced motion');
});

// ==============================================================================
// 7. STRICT PRESERVATION OF EXISTING APPLICATION ROUTES
// ==============================================================================
console.log('\n--- Group 7: Application Routes Strict Preservation ---');

runTest('App.tsx strictly preserves all existing application routes', () => {
  const appPath = path.resolve(process.cwd(), 'src', 'App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf-8');

  const requiredRoutes = [
    'path="/"',
    'path="/dashboard"',
    'path="/report"',
    'path="/explore"',
    'path="/community"',
    'path="/insights"',
    'path="/digital-twin"',
    'path="/transparency"',
    'path="/signin"',
    'path="/admin"',
    'path="/operations"',
    'path="/privacy"',
  ];

  for (const r of requiredRoutes) {
    assert.ok(appCode.includes(r), `App.tsx must preserve route: ${r}`);
  }
});

console.log('\n================================================================');
console.log(`PHASE 11 FINAL CORRECTION TEST SUITE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
