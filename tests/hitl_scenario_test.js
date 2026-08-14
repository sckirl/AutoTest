/**
 * AutoTest Studio — 20-Scenario Human-in-the-Loop Realistic Test Suite
 * Simulates real tester behaviour: uploads, maps, previews, runs, cancels, corrects.
 * Each scenario is documented individually for audit.
 */

const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const EXCEL = path.join(__dirname, '..', 'practicetest_scenario.xlsx');
const ORANGE_EXCEL = path.join(__dirname, '..', 'orangehrm_blueprint.xlsx');

// ── helpers ──────────────────────────────────────────────────────────────────
function apiReq(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 }
    };
    const r = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, json: () => { try { return JSON.parse(d); } catch { return {}; } } }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function freshServer() {
  await apiReq('POST', '/restart', {});
  await new Promise(r => setTimeout(r, 500));
}

// ── audit record ─────────────────────────────────────────────────────────────
const findings = [];
function record(id, title, status, detail, recommendation = '') {
  findings.push({ id, title, status, detail, recommendation });
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`  ${icon} S${String(id).padStart(2,'0')} [${status}] ${title}`);
  if (status !== 'PASS' && detail) console.log(`         → ${detail}`);
}

// ══════════════════════════════════════════════════════════════════════════════
async function runAllScenarios() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  AutoTest Studio — 20 Realistic Human-in-the-Loop Tests  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  function getBundledBrowser() {
    const p = path.join(__dirname, '../DRIVERS/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
    return fs.existsSync(p) ? p : undefined;
  }

  const browser = await chromium.launch({ headless: true, executablePath: getBundledBrowser() });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.accept(); });

  // ── S01: Fresh start, verify UI loads completely ──────────────────────────
  console.log('\n[S01] Fresh UI load & tab structure');
  try {
    await freshServer();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const title = await page.title();
    const hasTabs = await page.locator('.tab-strip').count() > 0;
    const hasDrop = await page.locator('#drop-zone').count() > 0;
    const hasEnvBadge = await page.locator('#env-badge').count() > 0;
    const badgeText = await page.locator('#env-badge').textContent();
    if (title && hasTabs && hasDrop && hasEnvBadge && badgeText.trim() === 'WEB')
      record(1, 'Fresh UI load — all elements present, badge=WEB', 'PASS', '');
    else
      record(1, 'Fresh UI load', 'FAIL', `title=${title} tabs=${hasTabs} drop=${hasDrop} badge=${badgeText}`);
  } catch(e) { record(1, 'Fresh UI load', 'FAIL', e.message); }

  // ── S02: Upload valid Excel → Mappings tab auto-switches ──────────────────
  console.log('\n[S02] Upload valid Excel, auto-switch to Mappings');
  try {
    await page.setInputFiles('#file-input', EXCEL);
    await page.waitForSelector('.scenario-header', { timeout: 8000 });
    const activeTab = await page.locator('.tab-active').textContent();
    const stepRows = await page.locator('.step-row').count();
    const scenHeaders = await page.locator('.scenario-header').count();
    if (activeTab.includes('Mapping') && stepRows > 0 && scenHeaders > 0)
      record(2, `Valid Excel upload → ${stepRows} steps, ${scenHeaders} scenario headers`, 'PASS', '');
    else
      record(2, 'Valid Excel upload', 'FAIL', `tab=${activeTab} rows=${stepRows} headers=${scenHeaders}`);
  } catch(e) { record(2, 'Valid Excel upload', 'FAIL', e.message); }

  // ── S03: Unmapped step shows "Record" not "Re-Map" ───────────────────────
  console.log('\n[S03] Unmapped steps show Record button, no Preview');
  try {
    const recordBtns = await page.locator('.btn-record').count();
    const previewBtns = await page.locator('.btn-preview').count();
    // All steps unmapped → should have Record buttons, zero preview buttons
    if (recordBtns > 0 && previewBtns === 0)
      record(3, `Unmapped steps → ${recordBtns} Record btns, 0 Preview btns`, 'PASS', '');
    else
      record(3, 'Unmapped step button states', 'WARN',
        `recordBtns=${recordBtns} previewBtns=${previewBtns} (expected >0 and 0)`);
  } catch(e) { record(3, 'Unmapped step button states', 'FAIL', e.message); }

  // ── S04: Manual map first step (goto) ────────────────────────────────────
  console.log('\n[S04] Manual map Step 1 (goto action)');
  try {
    const firstManual = page.locator('button:has-text("Manual")').first();
    await firstManual.click();
    await page.waitForSelector('#record-modal', { state: 'visible', timeout: 5000 });
    const codeArea = page.locator('#recorded-code');
    await codeArea.click({ clickCount: 3 });
    await codeArea.fill("await page.goto('https://practicetestautomation.com/practice-test-login/');");
    await page.click('button:has-text("Sync & Save Action")');
    await page.waitForSelector('#record-modal', { state: 'hidden', timeout: 5000 });
    const statusText = await page.locator('#status-box').textContent();
    if (statusText.includes('Mapped'))
      record(4, 'Manual map goto step → status shows "Mapped"', 'PASS', '');
    else
      record(4, 'Manual map goto step', 'WARN', `status="${statusText}"`);
  } catch(e) { record(4, 'Manual map goto step', 'FAIL', e.message); }

  // ── S05: After mapping, step turns to "Re-Map" + Preview button ───────────
  console.log('\n[S05] Mapped step shows Re-Map + Preview button');
  try {
    const remapBtns = await page.locator('.btn-remap').count();
    const previewBtns = await page.locator('.btn-preview').count();
    if (remapBtns > 0 && previewBtns > 0)
      record(5, `Mapped step → Re-Map & 👁 Preview buttons appear`, 'PASS', '');
    else
      record(5, 'Mapped step button states', 'FAIL',
        `remapBtns=${remapBtns} previewBtns=${previewBtns}`);
  } catch(e) { record(5, 'Mapped step button states', 'FAIL', e.message); }

  // ── S06: Preview step — read-only modal shows correct code ───────────────
  console.log('\n[S06] Preview button opens correct read-only modal');
  try {
    await page.locator('.btn-preview').first().click();
    await page.waitForSelector('#preview-modal', { state: 'visible', timeout: 5000 });
    const previewCode = await page.locator('#preview-code').inputValue();
    const isReadonly = await page.locator('#preview-code').getAttribute('readonly') !== null;
    const titleText = await page.locator('#preview-title').textContent();
    if (previewCode.includes('page.goto') && isReadonly && titleText.includes('Preview'))
      record(6, 'Preview modal: correct code, read-only, titled', 'PASS', previewCode.trim());
    else
      record(6, 'Preview modal content', 'FAIL',
        `code="${previewCode}" readonly=${isReadonly} title="${titleText}"`);
    await page.locator('#preview-modal .btn-primary').click();
    await page.waitForSelector('#preview-modal', { state: 'hidden', timeout: 3000 });
  } catch(e) { record(6, 'Preview modal', 'FAIL', e.message); }

  // ── S07: Map all remaining 5 steps with parameterized DDT ─────────────────
  console.log('\n[S07] Map remaining 5 steps including DDT variables');
  try {
    const steps = [
      "await page.locator('#username').fill('{username}');",
      "await page.locator('#password').fill('{password}');",
      "await page.locator('#submit').click();",
      "await expect(page.locator('h1.post-title')).toBeVisible();",
      "await expect(page.locator('#error')).toBeVisible();"
    ];
    let mapped = 0;
    for (const code of steps) {
      const manualBtns = await page.$$('button:has-text("Manual")');
      if (manualBtns.length === 0) break;
      await manualBtns[mapped + 1].click();
      await page.waitForSelector('#record-modal', { state: 'visible' });
      const area = page.locator('#recorded-code');
      await area.click({ clickCount: 3 }); await area.fill(code);
      await page.click('button:has-text("Sync & Save Action")');
      await page.waitForSelector('#record-modal', { state: 'hidden' });
      await page.waitForTimeout(300);
      mapped++;
    }
    const allPreviews = await page.locator('.btn-preview').count();
    if (mapped === 5 && allPreviews === 6)
      record(7, `All 6 steps mapped (${allPreviews} preview buttons)`, 'PASS', '');
    else
      record(7, 'Map remaining steps', 'WARN', `mapped=${mapped} previewBtns=${allPreviews}`);
  } catch(e) { record(7, 'Map remaining steps', 'FAIL', e.message); }

  // ── S08: Scenario Preview shows all steps in order ───────────────────────
  console.log('\n[S08] Scenario Preview shows full ordered script');
  try {
    const scenBtn = page.locator('button[title*="View the full mapped"]').first();
    await scenBtn.click();
    await page.waitForSelector('#preview-modal', { state: 'visible' });
    const code = await page.locator('#preview-code').inputValue();
    const lines = code.split('\n').filter(l => l.trim());
    const hasGoto = code.includes('page.goto');
    const hasFill = code.includes('.fill(');
    const hasExpect = code.includes('expect(');
    const hasScenComment = code.includes('Scenario:');
    if (hasGoto && hasFill && hasExpect && hasScenComment && lines.length > 5)
      record(8, `Scenario Preview: ${lines.length} lines, goto+fill+expect present`, 'PASS', '');
    else
      record(8, 'Scenario Preview completeness', 'WARN',
        `lines=${lines.length} goto=${hasGoto} fill=${hasFill} expect=${hasExpect}`);
    await page.locator('#preview-modal .btn-primary').click();
    await page.waitForSelector('#preview-modal', { state: 'hidden' });
  } catch(e) { record(8, 'Scenario Preview', 'FAIL', e.message); }

  // ── S09: Manual modal pre-populates with existing code ───────────────────
  console.log('\n[S09] Re-opening Manual on mapped step pre-loads code');
  try {
    const firstManual = page.locator('button:has-text("Manual")').first();
    await firstManual.click();
    await page.waitForSelector('#record-modal', { state: 'visible' });
    await page.waitForTimeout(600); // fetch /preview completes
    const existingCode = await page.locator('#recorded-code').inputValue();
    if (existingCode && existingCode.length > 5)
      record(9, `Manual modal pre-loaded existing code (${existingCode.length} chars)`, 'PASS', existingCode.trim());
    else
      record(9, 'Manual modal pre-loads existing code', 'WARN',
        `code="${existingCode}" — textarea empty, human must re-type everything`);
    await page.click('button:has-text("Cancel & Close Replay")');
    await page.waitForSelector('#record-modal', { state: 'hidden' });
  } catch(e) { record(9, 'Manual modal pre-load', 'FAIL', e.message); }

  // ── S10: Data Matrix tab shows harvested DDT variables ───────────────────
  console.log('\n[S10] Data Matrix tab harvests {username} {password} variables');
  try {
    await page.click('button:has-text("Data Matrix")');
    await page.waitForTimeout(1000);
    const matrixHtml = await page.locator('#data-matrix-ui').innerHTML();
    const hasUsername = matrixHtml.includes('{username}') || matrixHtml.includes('username');
    const hasPassword = matrixHtml.includes('{password}') || matrixHtml.includes('password');
    const hasAddBtn = await page.locator('button:has-text("+ Add Iteration")').count() > 0;
    if (hasUsername && hasPassword && hasAddBtn)
      record(10, 'Data Matrix shows {username} {password} vars + Add Iteration button', 'PASS', '');
    else
      record(10, 'Data Matrix variable harvesting', 'WARN',
        `username=${hasUsername} password=${hasPassword} addBtn=${hasAddBtn}`);
  } catch(e) { record(10, 'Data Matrix tab', 'FAIL', e.message); }

  // ── S11: Add DDT iteration row ────────────────────────────────────────────
  console.log('\n[S11] Add an iteration row in Data Matrix');
  try {
    // Find first Add Iteration button and click it
    const addBtn = page.locator('button:has-text("+ Add Iteration")').first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // Look for input rows that appeared
    const inputs = await page.locator('#data-matrix-ui input[type="text"]').count();
    if (inputs > 0)
      record(11, `Data Matrix: ${inputs} input field(s) appeared after Add Iteration`, 'PASS', '');
    else
      record(11, 'Add Data Matrix iteration', 'WARN', 'No input fields appeared after click');
  } catch(e) { record(11, 'Add DDT iteration', 'FAIL', e.message); }

  // ── S12: Fill DDT data and Save Matrix ───────────────────────────────────
  console.log('\n[S12] Fill DDT data and Save Data Matrix');
  try {
    const inputs = page.locator('#data-matrix-ui input[type="text"]');
    const count = await inputs.count();
    if (count >= 2) {
      await inputs.nth(0).fill('student');
      await inputs.nth(1).fill('Password123');
    }
    await page.click('button:has-text("Save Data Matrix")');
    await page.waitForTimeout(500);
    const statusTxt = await page.locator('#status-box').textContent();
    if (statusTxt.includes('Saved'))
      record(12, 'Fill DDT data + Save → status "Saved"', 'PASS', '');
    else
      record(12, 'Save Data Matrix', 'WARN', `status="${statusTxt}"`);
  } catch(e) { record(12, 'Fill and save DDT data', 'FAIL', e.message); }

  // ── S13: Platform toggle switches badge and frame ─────────────────────────
  console.log('\n[S13] Platform toggle Web→Mobile changes badge & frame');
  try {
    await page.click('button:has-text("Studio")');
    await page.waitForTimeout(300);
    await page.selectOption('#platform-toggle', 'mobile');
    await page.waitForTimeout(300);
    const badge = await page.locator('#env-badge').textContent();
    const hasMobileClass = await page.locator('#main-card.mobile-mode').count() > 0;
    if (badge.trim() === 'MOBILE' && hasMobileClass)
      record(13, 'Platform toggle Mobile → badge=MOBILE, mobile-mode class active', 'PASS', '');
    else
      record(13, 'Platform toggle to Mobile', 'WARN',
        `badge="${badge}" mobileClass=${hasMobileClass}`);
    // Switch back to web
    await page.selectOption('#platform-toggle', 'web');
    await page.waitForTimeout(200);
    const webBadge = await page.locator('#env-badge').textContent();
    if (!webBadge.includes('MOBILE'))
      record(13, '...toggle back to Web restores badge', 'PASS', '');
  } catch(e) { record(13, 'Platform toggle', 'FAIL', e.message); }

  // ── S14: Execution tab has headless toggle defaulting to unchecked ────────
  console.log('\n[S14] Execution tab: headless toggle exists, defaults unchecked');
  try {
    await page.click('button:has-text("Execution")');
    await page.waitForTimeout(300);
    const toggleExists = await page.locator('#headless-toggle').count() > 0;
    const isChecked = await page.locator('#headless-toggle').isChecked();
    const runBtnExists = await page.locator('#run-btn').count() > 0;
    if (toggleExists && !isChecked && runBtnExists)
      record(14, 'Headless toggle present, default=unchecked (headed for UAT monitoring)', 'PASS', '');
    else
      record(14, 'Execution tab headless toggle', 'WARN',
        `exists=${toggleExists} checked=${isChecked} runBtn=${runBtnExists}`);
  } catch(e) { record(14, 'Execution tab headless toggle', 'FAIL', e.message); }

  // ── S15: Run headless and wait for results dashboard ─────────────────────
  console.log('\n[S15] Run tests (headless) and verify results dashboard');
  try {
    await page.locator('#headless-toggle').check(); // headless for CI
    await page.click('#run-btn');
    await page.waitForSelector('#results-dashboard', { state: 'visible', timeout: 120000 });
    const passBadges = await page.locator('span:has-text("PASSED")').count();
    const failBadges = await page.locator('span:has-text("FAILED")').count();
    const passCount = await page.locator('#pass-count').textContent();
    const failCount = await page.locator('#fail-count').textContent();
    if (parseInt(passCount) > 0)
      record(15, `Execution complete: ${passCount} PASS / ${failCount} FAIL on dashboard`, 'PASS', '');
    else
      record(15, 'Execution results dashboard', 'WARN',
        `pass=${passCount} fail=${failCount} passBadges=${passBadges}`);
  } catch(e) { record(15, 'Run + results dashboard', 'FAIL', e.message); }

  // ── S16: Results folder has STEP_N.png and trace.zip ─────────────────────
  console.log('\n[S16] Results folder has step screenshots + trace.zip');
  try {
    const resultsBase = path.join(__dirname, '..', 'results');
    const dirs = fs.readdirSync(resultsBase).filter(d =>
      fs.statSync(path.join(resultsBase, d)).isDirectory());
    let allGood = true;
    const issues = [];
    for (const dir of dirs) {
      if (dir === 'PT_A') continue; // header scenario — no steps expected
      const files = fs.readdirSync(path.join(resultsBase, dir));
      const hasSteps = files.some(f => f.startsWith('STEP_'));
      const hasFinal = files.includes('FINAL.png');
      const hasTrace = files.includes('trace.zip');
      if (!hasSteps || !hasFinal || !hasTrace) {
        allGood = false;
        issues.push(`${dir}: steps=${hasSteps} final=${hasFinal} trace=${hasTrace}`);
      }
    }
    if (allGood && dirs.length > 0)
      record(16, `All ${dirs.length} result folders: STEP_N.png + FINAL.png + trace.zip`, 'PASS', '');
    else
      record(16, 'Results folder artifact completeness', 'WARN', issues.join('; '));
  } catch(e) { record(16, 'Results folder check', 'FAIL', e.message); }

  // ── S17: "View PNG" links in dashboard point to real files ───────────────
  console.log('\n[S17] "View PNG" result links resolve (no broken links)');
  try {
    const pngLinks = await page.locator('a:has-text("View PNG")').all();
    let broken = 0;
    for (const link of pngLinks) {
      const href = await link.getAttribute('href');
      if (!href) { broken++; continue; }
      // Check the file exists on disk
      const filePath = path.join(__dirname, '..', href);
      if (!fs.existsSync(filePath)) broken++;
    }
    if (broken === 0 && pngLinks.length > 0)
      record(17, `All ${pngLinks.length} "View PNG" links resolve to real files`, 'PASS', '');
    else if (broken > 0)
      record(17, 'View PNG link resolution', 'WARN',
        `${broken}/${pngLinks.length} links point to missing files`,
        'Use /results/:path static file route or verify scenarioId cleaning is consistent');
    else
      record(17, 'View PNG links', 'WARN', 'No PNG links found in dashboard');
  } catch(e) { record(17, 'View PNG links', 'FAIL', e.message); }

  // ── S18: Empty code in Manual Map → server rejects gracefully ────────────
  console.log('\n[S18] Save-mapping with empty code shows error (not crash)');
  try {
    // Send directly via API (UI validates client-side too)
    const r = await apiReq('POST', '/save-mapping', { label: 'Some Step', code: '' });
    if (r.status === 400) {
      const msg = r.json().error || '';
      record(18, 'Empty code → 400 error returned', 'PASS', `error="${msg}"`);
    } else {
      record(18, 'Empty code rejection', 'WARN',
        `got HTTP ${r.status} instead of 400 — server may silently accept empty code`,
        'Add code.trim() validation to /save-mapping');
    }
  } catch(e) { record(18, 'Empty code rejection', 'FAIL', e.message); }

  // ── S19: Run while a run is already active → 409 Conflict ────────────────
  console.log('\n[S19] Double-run prevention (409 when already running)');
  try {
    // Trigger a run that will fail fast (no excel in clean-enough state)
    const r1 = await apiReq('POST', '/run', { workers: 1, headless: true, platform: 'web' });
    // If accepted (200), immediately try again
    if (r1.status === 200) {
      await new Promise(r => setTimeout(r, 200));
      const r2 = await apiReq('POST', '/run', { workers: 1, headless: true, platform: 'web' });
      if (r2.status === 409)
        record(19, 'Double-run → 409 Conflict correctly returned', 'PASS', '');
      else
        record(19, 'Double-run prevention', 'WARN',
          `Second /run returned ${r2.status} — expected 409`,
          'Race window may be too tight; activeRun set after async execSync');
      // Cancel it
      await apiReq('POST', '/run-cancel', {});
    } else {
      record(19, 'Double-run prevention', 'WARN',
        `First /run returned ${r1.status} (not 200) — could not test double-run`,
        r1.json().error || '');
    }
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) { record(19, 'Double-run prevention', 'FAIL', e.message); }

  // ── S20: Full Reset wipes mappings, results, upload ──────────────────────
  console.log('\n[S20] Full Reset wipes all state cleanly');
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Accept the confirm dialog that restartSystem() triggers
    await page.click('button:has-text("Reset System (Wipe All)")');
    await page.waitForTimeout(1500);
    // After reset + reload: should be on Studio tab, no steps
    await page.waitForSelector('#drop-zone', { timeout: 5000 });
    const activeTab = await page.locator('.tab-active').textContent();
    // Verify server state is clean
    const scanRes = await apiReq('GET', '/scan');
    const scanData = scanRes.json();
    const mappingsRes = await apiReq('GET', '/mapping/Navigate%20to%20PracticeTest');
    const mappingGone = mappingsRes.json().mapping === null;
    const resultsGone = !fs.existsSync(path.join(__dirname, '..', 'results', 'PT_1'));
    if (mappingGone && resultsGone)
      record(20, 'Full Reset: mappings cleared, results deleted, Studio tab active', 'PASS', '');
    else
      record(20, 'Full Reset completeness', 'WARN',
        `mappingGone=${mappingGone} resultsGone=${resultsGone} tab="${activeTab}"`);
  } catch(e) { record(20, 'Full Reset', 'FAIL', e.message); }

  await browser.close();
  return findings;
}

// ══════════════════════════════════════════════════════════════════════════════
async function generateAudit(findings) {
  const pass = findings.filter(f => f.status === 'PASS').length;
  const warn = findings.filter(f => f.status === 'WARN').length;
  const fail = findings.filter(f => f.status === 'FAIL').length;

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${pass} PASS / ${warn} WARN / ${fail} FAIL / 20 TOTAL         ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  const now = new Date().toISOString();
  const lines = [
    `# AutoTest Studio — 20-Scenario Human-in-the-Loop Audit`,
    `**Date:** ${now}`,
    `**Score:** ${pass}/20 PASS | ${warn} WARN | ${fail} FAIL`,
    '',
    '## Results Summary',
    '',
    '| # | Scenario | Status | Detail |',
    '|---|----------|--------|--------|',
  ];

  for (const f of findings) {
    const icon = f.status === 'PASS' ? '✅' : f.status === 'WARN' ? '⚠️' : '❌';
    const detail = f.detail ? f.detail.replace(/\|/g, '\\|').substring(0, 120) : '';
    lines.push(`| S${String(f.id).padStart(2,'0')} | ${f.title} | ${icon} ${f.status} | ${detail} |`);
  }

  // Findings that need fixes
  const issues = findings.filter(f => f.status !== 'PASS');
  if (issues.length > 0) {
    lines.push('', '## ⚠️ Findings Requiring Action', '');
    for (const f of issues) {
      lines.push(`### S${String(f.id).padStart(2,'0')}: ${f.title}`);
      lines.push(`- **Status:** ${f.status}`);
      lines.push(`- **Detail:** ${f.detail}`);
      if (f.recommendation) lines.push(`- **Fix:** ${f.recommendation}`);
      lines.push('');
    }
  } else {
    lines.push('', '## ✅ No issues found — system is fully compliant.', '');
  }

  lines.push('---');
  lines.push(`*Generated by AutoTest Studio 20-Scenario Test Suite at ${now}*`);

  const outPath = path.join(__dirname, '..', 'qa_audit_round21.md');
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`📄 Audit written to: ${outPath}`);
  return outPath;
}

// ── main ──────────────────────────────────────────────────────────────────────
runAllScenarios()
  .then(generateAudit)
  .then(p => { console.log('\nDone. Open ' + p); })
  .catch(e => { console.error('FATAL:', e); process.exit(1); });
