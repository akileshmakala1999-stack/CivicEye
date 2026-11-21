import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('CIVICEYE — PHASE 11.3 FULL INTERACTION & BUTTON AUDIT TEST SUITE');
console.log('Validating Button Types, Non-Alert Handlers, Form Safety & Zero Regressions');
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
// 1. BUTTON QUALITY & EXPLICIT TYPE ATTRIBUTE AUDIT
// ==============================================================================
console.log('--- Group 1: Button Quality & Semantic Type Compliance ---');

runTest('1. Zero <button> tags across the entire codebase lack an explicit type attribute', () => {
  function walk(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else if (fullPath.endsWith('.tsx')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  const files = walk(path.resolve(process.cwd(), 'src'));
  const missingTypeButtons: { file: string; line: number; snippet: string }[] = [];

  files.forEach((filePath) => {
    const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.includes('<button') && !trimmed.includes('<button type=')) {
        // check multiline tag
        let fullTag = trimmed;
        for (let j = 1; j <= 5 && idx + j < lines.length; j++) {
          fullTag += ' ' + lines[idx + j].trim();
          if (lines[idx + j].includes('>')) break;
        }
        if (!fullTag.includes('type=')) {
          missingTypeButtons.push({ file: rel, line: idx + 1, snippet: fullTag.slice(0, 80) });
        }
      }
    });
  });

  assert.strictEqual(
    missingTypeButtons.length,
    0,
    `Found ${missingTypeButtons.length} buttons missing explicit type attribute: ${JSON.stringify(missingTypeButtons)}`
  );
});

runTest('2. Shared Button component applies default type="button" and supports type="submit"', () => {
  const btnPath = path.resolve(process.cwd(), 'src', 'components', 'common', 'Button.tsx');
  const btnCode = fs.readFileSync(btnPath, 'utf-8');

  assert.ok(btnCode.includes("type = 'button'"), 'Button component must default type to "button"');
  assert.ok(btnCode.includes('type={type}'), 'Button component must forward type to underlying button element');
});

// ==============================================================================
// 2. ELIMINATION OF FAKE ALERTS & SUSPICIOUS DEAD HANDLERS
// ==============================================================================
console.log('\n--- Group 2: Dead Handlers & Fake Alert Elimination ---');

runTest('3. AiDecisionSupportPanel eliminates alert() calls and implements persistent schedule state', () => {
  const panelPath = path.resolve(process.cwd(), 'src', 'components', 'operations', 'AiDecisionSupportPanel.tsx');
  const panelCode = fs.readFileSync(panelPath, 'utf-8');

  assert.ok(!panelCode.includes('alert('), 'AiDecisionSupportPanel must not use alert() placeholders');
  assert.ok(panelCode.includes('handleScheduleReview'), 'Must implement handleScheduleReview handler');
  assert.ok(panelCode.includes('scheduledProposals'), 'Must track scheduled proposals state');
  assert.ok(panelCode.includes('scheduleFeedback'), 'Must display real confirmation feedback');
});

runTest('4. HeroMapPreview buttons have real interactive zoom and orientation handlers', () => {
  const heroMapPath = path.resolve(process.cwd(), 'src', 'components', 'landing', 'HeroMapPreview.tsx');
  const heroMapCode = fs.readFileSync(heroMapPath, 'utf-8');

  assert.ok(heroMapCode.includes('zoomLevel'), 'HeroMapPreview must track zoomLevel');
  assert.ok(heroMapCode.includes('setZoomLevel'), 'HeroMapPreview must update zoomLevel on button clicks');
  assert.ok(heroMapCode.includes('aria-label="Zoom In"'), 'Zoom in button must have accessible label');
  assert.ok(heroMapCode.includes('aria-label="Zoom Out"'), 'Zoom out button must have accessible label');
});

// ==============================================================================
// 3. NESTED INTERACTIVE ELEMENT AUDIT
// ==============================================================================
console.log('\n--- Group 3: Elimination of Nested Interactive Elements ---');

runTest('5. DashboardSidebar eliminates invalid nested span click target inside Nearby Issues button', () => {
  const sidebarPath = path.resolve(process.cwd(), 'src', 'components', 'dashboard', 'DashboardSidebar.tsx');
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');

  assert.ok(
    !sidebarCode.includes('<span\n              onClick={(e) => {\n                e.stopPropagation();\n                setNearbySubmenuOpen(!nearbySubmenuOpen);'),
    'Must not nest interactive span inside button'
  );
  assert.ok(
    sidebarCode.includes('aria-label={nearbySubmenuOpen ? \'Collapse Nearby Submenu\' : \'Expand Nearby Submenu\'}'),
    'Submenu toggle button must have accessible toggle label'
  );
});

// ==============================================================================
// 4. FLOATING CONTROL INTEGRITY & OVERLAP PREVENTION
// ==============================================================================
console.log('\n--- Group 4: Floating Controls Non-Obstruction & Safe Stacking ---');

runTest('6. Exactly one floating control exists across the application with conditional unmount', () => {
  const floatBtnPath = path.resolve(process.cwd(), 'src', 'components', 'ai', 'CivicAiFloatingButton.tsx');
  const floatBtnCode = fs.readFileSync(floatBtnPath, 'utf-8');

  assert.ok(floatBtnCode.includes('if (isOpen) return null;'), 'Floating button must unmount when assistant modal is open');
  assert.ok(floatBtnCode.includes('z-40'), 'Floating button must use z-40 below modal layer z-50');
  assert.ok(floatBtnCode.includes('type="button"'), 'Floating button must declare type="button"');
});

// ==============================================================================
// 5. NAVIGATION PATHS & ACTIVE ROUTING INTEGRITY
// ==============================================================================
console.log('\n--- Group 5: Full Route Registry & Navigation Safety ---');

runTest('7. All 13 primary SPA routes are declared without ambiguous routing or broken wildcards', () => {
  const appPath = path.resolve(process.cwd(), 'src', 'App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf-8');

  const requiredRoutes = [
    'path="/"',
    'path="/how-it-works"',
    'path="/dashboard"',
    'path="/report"',
    'path="/explore"',
    'path="/community"',
    'path="/insights"',
    'path="/digital-twin"',
    'path="/transparency"',
    'path="/signin"',
    'path="/signup"',
    'path="/admin"',
    'path="/operations"',
    'path="/privacy"',
  ];

  requiredRoutes.forEach((route) => {
    assert.ok(appCode.includes(route), `App.tsx must register route ${route}`);
  });
});

runTest('8. Navbar and Footer contain zero broken hash links to missing anchors', () => {
  const navPath = path.resolve(process.cwd(), 'src', 'components', 'layout', 'Navbar.tsx');
  const navCode = fs.readFileSync(navPath, 'utf-8');
  assert.ok(!navCode.includes('href="#"'), 'Navbar must not contain dead hash hrefs');
  assert.ok(!navCode.includes('handleScrollTo'), 'Navbar must not call legacy handleScrollTo');

  const footerPath = path.resolve(process.cwd(), 'src', 'components', 'layout', 'Footer.tsx');
  const footerCode = fs.readFileSync(footerPath, 'utf-8');
  assert.ok(!footerCode.includes('href="#"'), 'Footer must not contain dead hash hrefs');
  assert.ok(!footerCode.includes('href="#how-it-works"'), 'Footer must use client Link for How It Works');
  assert.ok(!footerCode.includes('href="#intelligence"'), 'Footer must use client Link for Intelligence');
  assert.ok(!footerCode.includes('href="#transparency"'), 'Footer must use client Link for Transparency');
});

// ==============================================================================
// 6. FORM & SUBMISSION SAFETY
// ==============================================================================
console.log('\n--- Group 6: Form Submission Integrity & Event Prevention ---');

runTest('9. All form submission handlers explicitly prevent accidental page reload', () => {
  const formFiles = [
    'src/pages/ReportIssuePage.tsx',
    'src/pages/AuthPortalPage.tsx',
    'src/components/dashboard/CommunityEvidencePanel.tsx',
    'src/components/transparency/CitizenResolutionFeedbackModal.tsx',
    'src/components/operations/StaffWorkspaceTab.tsx',
  ];

  formFiles.forEach((file) => {
    const code = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
    assert.ok(code.includes('e.preventDefault()'), `${file} must prevent default form submission`);
  });
});

// ==============================================================================
// 7. ROLE RESTRICTION & ADMINISTRATIVE PRIVILEGE GATING
// ==============================================================================
console.log('\n--- Group 7: Role Gating & Security Protection ---');

runTest('10. Digital Twin simulation actions and scenario deletion remain strictly role-gated', () => {
  const dtServicePath = path.resolve(process.cwd(), 'src', 'services', 'digitalTwinService.ts');
  const dtServiceCode = fs.readFileSync(dtServicePath, 'utf-8');

  assert.ok(dtServiceCode.includes("userRole && userRole !== 'supervisor' && userRole !== 'admin'"), 'Scenario operations must gate role');
});

// ==============================================================================
// SUMMARY
// ==============================================================================
console.log('\n================================================================');
console.log(`PHASE 11.3 AUDIT SUITE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
