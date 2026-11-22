import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('CIVICEYE — PHASE 11.1 SPA ROUTING & NAVIGATION REGRESSION TEST SUITE');
console.log('Validating Route Definitions, Event Handlers, Button Types & SPA Integrity');
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

const appPath = path.resolve(process.cwd(), 'src', 'App.tsx');
const appCode = fs.readFileSync(appPath, 'utf-8');

const navPath = path.resolve(process.cwd(), 'src', 'components', 'layout', 'Navbar.tsx');
const navCode = fs.readFileSync(navPath, 'utf-8');

const footerPath = path.resolve(process.cwd(), 'src', 'components', 'layout', 'Footer.tsx');
const footerCode = fs.readFileSync(footerPath, 'utf-8');

const buttonPath = path.resolve(process.cwd(), 'src', 'components', 'common', 'Button.tsx');
const buttonCode = fs.readFileSync(buttonPath, 'utf-8');

const heroPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'CinematicHero.tsx');
const heroCode = fs.readFileSync(heroPath, 'utf-8');

const howItWorksPath = path.resolve(process.cwd(), 'src', 'pages', 'HowItWorksPage.tsx');

// ==============================================================================
// 1. ROUTE REGISTRATIONS IN APP.TSX
// ==============================================================================
console.log('--- Group 1: Core SPA Route Definitions in App.tsx ---');

runTest('1. Root route ("/") is registered to LandingPage', () => {
  assert.ok(appCode.includes('<Route path="/" element={<LandingPage />} />'), 'Root route missing');
});

runTest('2. Dashboard route ("/dashboard") is registered to CitizenDashboardPage', () => {
  assert.ok(appCode.includes('path="/dashboard"') && appCode.includes('<CitizenDashboardPage />'), 'Dashboard route missing');
});

runTest('3. Sign-in route ("/signin") and Sign-up route ("/signup") are registered to AuthPortalPage', () => {
  assert.ok(appCode.includes('path="/signin"') && appCode.includes('path="/signup"'), 'Sign-in route missing');
});

runTest('4. Report route ("/report") is registered to ReportIssuePage', () => {
  assert.ok(appCode.includes('path="/report"') && appCode.includes('<ReportIssuePage />'), 'Report route missing');
});

runTest('5. Explore route ("/explore") is registered to ExploreMapPage', () => {
  assert.ok(appCode.includes('path="/explore"') && appCode.includes('<ExploreMapPage />'), 'Explore route missing');
});

runTest('6. Community route ("/community") is registered to CommunityNetworkPage', () => {
  assert.ok(appCode.includes('path="/community"') && appCode.includes('<CommunityNetworkPage />'), 'Community route missing');
});

runTest('7. Insights route ("/insights") is registered to CivicInsightsPage', () => {
  assert.ok(appCode.includes('path="/insights"') && appCode.includes('<CivicInsightsPage />'), 'Insights route missing');
});

runTest('8. Digital Twin route ("/digital-twin") is registered to DigitalTwinPage', () => {
  assert.ok(appCode.includes('path="/digital-twin"') && appCode.includes('<DigitalTwinPage />'), 'Digital Twin route missing');
});

runTest('9. Transparency route ("/transparency") is registered to PublicTransparencyPage', () => {
  assert.ok(appCode.includes('path="/transparency"') && appCode.includes('<PublicTransparencyPage />'), 'Transparency route missing');
});

runTest('10. Admin & Operations routes ("/admin", "/operations") are registered to AuthorityDashboardPage', () => {
  assert.ok(appCode.includes('path="/admin"') && appCode.includes('path="/operations"') && appCode.includes('<AuthorityDashboardPage />'), 'Admin/Operations route missing');
});

runTest('11. How It Works route ("/how-it-works") is registered to HowItWorksPage', () => {
  assert.ok(appCode.includes('path="/how-it-works"') && appCode.includes('<HowItWorksPage />'), 'How It Works route missing');
  assert.ok(fs.existsSync(howItWorksPath), 'HowItWorksPage.tsx file must exist');
});

// ==============================================================================
// 2. NAVBAR & LANDING PAGE INTERACTION AUDIT
// ==============================================================================
console.log('\n--- Group 2: Navbar & Landing Page Action Links ---');

runTest('12. Landing page CTA buttons navigate cleanly (Explore -> /dashboard, Sign In -> /signin)', () => {
  assert.ok(heroCode.includes('to="/dashboard"'), 'Hero Explore CTA must link to /dashboard');
  assert.ok(heroCode.includes('to="/signin"'), 'Hero Sign In CTA must link to /signin');
  assert.ok(!heroCode.includes('href="#"'), 'Hero must not contain dead hash hrefs');
});

runTest('13. Desktop Navbar "How It Works" links to "/how-it-works" instead of redirecting to "/"', () => {
  assert.ok(navCode.includes('to="/how-it-works"'), 'Navbar must link to /how-it-works');
  assert.ok(!navCode.includes("handleScrollTo('how-it-works')"), 'Must not call handleScrollTo which causes root redirect');
});

runTest('14. Desktop Navbar "Intelligence" links to "/insights" instead of redirecting to "/"', () => {
  assert.ok(navCode.includes('to="/insights"'), 'Navbar must link to /insights');
  assert.ok(!navCode.includes("handleScrollTo('intelligence')"), 'Must not call handleScrollTo which causes root redirect');
});

runTest('15. Desktop Navbar "Transparency" links to "/transparency" instead of redirecting to "/"', () => {
  assert.ok(navCode.includes('to="/transparency"'), 'Navbar must link to /transparency');
  assert.ok(!navCode.includes("handleScrollTo('transparency')"), 'Must not call handleScrollTo which causes root redirect');
});

runTest('16. Mobile Drawer items link to proper SPA routes and close drawer on click', () => {
  assert.ok(navCode.includes('setMobileMenuOpen(false)'), 'Drawer links must close mobile menu');
  assert.ok(navCode.includes('to="/digital-twin"'), 'Mobile drawer must link to /digital-twin');
});

runTest('17. Platform dropdown contains all 6 core modules linking to valid routes', () => {
  assert.ok(navCode.includes("to: '/dashboard'"), 'Platform must link to dashboard');
  assert.ok(navCode.includes("to: '/explore'"), 'Platform must link to explore');
  assert.ok(navCode.includes("to: '/community'"), 'Platform must link to community');
  assert.ok(navCode.includes("to: '/insights'"), 'Platform must link to insights');
  assert.ok(navCode.includes("to: '/digital-twin'"), 'Platform must link to digital-twin');
  assert.ok(navCode.includes("to: '/transparency'"), 'Platform must link to transparency');
});

// ==============================================================================
// 3. FOOTER LINKS INTEGRITY
// ==============================================================================
console.log('\n--- Group 3: Footer SPA Links Integrity ---');

runTest('18. Footer contains real React Router Link components with no hash anchors', () => {
  assert.ok(footerCode.includes('to="/how-it-works"'), 'Footer must link to /how-it-works');
  assert.ok(footerCode.includes('to="/insights"'), 'Footer must link to /insights');
  assert.ok(footerCode.includes('to="/transparency"'), 'Footer must link to /transparency');
  assert.ok(!footerCode.includes('href="#how-it-works"'), 'Footer must not contain href="#how-it-works"');
  assert.ok(!footerCode.includes('href="#intelligence"'), 'Footer must not contain href="#intelligence"');
  assert.ok(!footerCode.includes('href="#transparency"'), 'Footer must not contain href="#transparency"');
});

// ==============================================================================
// 4. BUTTON COMPONENT SEMANTICS & ACCIDENTAL FORM SUBMISSIONS
// ==============================================================================
console.log('\n--- Group 4: Button Component Semantics & Form Safety ---');

runTest('19. Button component specifies default type="button" to prevent accidental form submit', () => {
  assert.ok(buttonCode.includes("type = 'button'"), 'Button must set default type = "button"');
  assert.ok(buttonCode.includes('type={type}'), 'Button must apply type attribute');
});

runTest('20. Form submissions in all pages include e.preventDefault()', () => {
  const authPath = path.resolve(process.cwd(), 'src', 'pages', 'AuthPortalPage.tsx');
  const authCode = fs.readFileSync(authPath, 'utf-8');
  assert.ok(authCode.includes('e.preventDefault()'), 'AuthPortal must prevent form submission reload');

  const reportPath = path.resolve(process.cwd(), 'src', 'pages', 'ReportIssuePage.tsx');
  const reportCode = fs.readFileSync(reportPath, 'utf-8');
  assert.ok(reportCode.includes('e.preventDefault()'), 'ReportIssuePage must prevent form submission reload');
});

// ==============================================================================
// SUMMARY
// ==============================================================================
console.log('\n================================================================');
console.log(`PHASE 11.1 REGRESSION SUITE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
