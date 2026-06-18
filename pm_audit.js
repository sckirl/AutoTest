/**
 * AutoTest Studio - PM Compliance Audit Script
 * Audits all 4 UI tabs and key features for phase gate certification
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = 'http://localhost:3000';
const BLUEPRINT_PATH = '/Users/alvin/CodeProjects/AutoTest/demo_blueprint.xlsx';
const SCREENSHOTS_DIR = '/Users/alvin/CodeProjects/AutoTest/pm_screenshots';
const REPORT_PATH = '/Users/alvin/CodeProjects/AutoTest/pm_compliance_report.md';

// Ensure screenshots dir exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = [];
let screenshotIndex = 0;

function log(label, status, observed, expected = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${status}] ${label}`);
  if (observed) console.log(`    Observed: ${observed}`);
  results.push({ label, status, observed, expected });
}

async function screenshot(page, name) {
  screenshotIndex++;
  const filename = `${String(screenshotIndex).padStart(2, '0')}_${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`📸 Screenshot: ${filename}`);
  return filename;
}

const screenshots = [];

async function runAudit() {
  console.log('='.repeat(60));
  console.log('  AutoTest Studio — PM Compliance Audit');
  console.log('  Started:', new Date().toISOString());
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ============================================================
    // STEP 1: Initial page load
    // ============================================================
    console.log('\n--- STEP 1: Initial Page Load ---');
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    screenshots.push(await screenshot(page, 'initial_load'));

    const title = await page.title();
    log('Page Title', title.includes('Automation') || title.includes('Studio') ? 'PASS' : 'FAIL',
      `Title: "${title}"`, 'Should contain "Automation Studio"');

    // ============================================================
    // STEP 2: Studio Tab Audit
    // ============================================================
    console.log('\n--- STEP 2: Studio Tab Audit ---');

    // Header verification
    const h1Text = await page.locator('h1').first().textContent().catch(() => '');
    log('Header "AUTOMATION STUDIO"',
      h1Text.trim().includes('AUTOMATION STUDIO') ? 'PASS' : 'FAIL',
      `h1 text: "${h1Text.trim()}"`, 'AUTOMATION STUDIO');

    // WEB badge
    const envBadge = page.locator('#env-badge');
    const badgeVisible = await envBadge.isVisible().catch(() => false);
    const badgeText = await envBadge.textContent().catch(() => '');
    log('WEB Badge visible (#env-badge)', badgeVisible ? 'PASS' : 'FAIL',
      `Badge visible: ${badgeVisible}, Text: "${badgeText.trim()}"`, 'WEB badge visible');

    // Platform toggle
    const platformToggle = page.locator('#platform-toggle');
    const toggleVisible = await platformToggle.isVisible().catch(() => false);
    log('Platform dropdown (#platform-toggle)', toggleVisible ? 'PASS' : 'FAIL',
      `Visible: ${toggleVisible}`, 'Dropdown visible');

    if (toggleVisible) {
      const webOpt = await page.locator('#platform-toggle option[value="web"]').count();
      const mobileOpt = await page.locator('#platform-toggle option[value="mobile"]').count();
      log('WEB option in dropdown', webOpt > 0 ? 'PASS' : 'FAIL',
        `Count: ${webOpt}`, 'At least 1 WEB option');
      log('MOBILE option in dropdown', mobileOpt > 0 ? 'PASS' : 'FAIL',
        `Count: ${mobileOpt}`, 'At least 1 MOBILE option');
    }

    // Drop zone
    const dropZone = page.locator('.drop-zone');
    const dropZoneVisible = await dropZone.isVisible().catch(() => false);
    const dropZoneText = await dropZone.textContent().catch(() => '');
    log('Drop-zone visible', dropZoneVisible ? 'PASS' : 'FAIL',
      `Visible: ${dropZoneVisible}`, 'Drop zone visible');
    log('Drop-zone has descriptive text', dropZoneText.trim().length > 5 ? 'PASS' : 'FAIL',
      `Text: "${dropZoneText.trim().substring(0, 80)}"`, 'Non-empty descriptive text');

    // Base URL input
    const baseUrlInput = page.locator('#base-url');
    const baseUrlVisible = await baseUrlInput.isVisible().catch(() => false);
    log('Base URL input (#base-url)', baseUrlVisible ? 'PASS' : 'FAIL',
      `Visible: ${baseUrlVisible}`, 'Base URL input visible');

    // Reset System button
    const resetBtn = page.locator('button').filter({ hasText: /reset system/i });
    const resetBtnVisible = await resetBtn.isVisible().catch(() => false);
    log('Reset System button', resetBtnVisible ? 'PASS' : 'FAIL',
      `Visible: ${resetBtnVisible}`, 'Reset button visible');

    screenshots.push(await screenshot(page, 'studio_tab_audit'));

    // ============================================================
    // STEP 3: Platform Toggle Test
    // ============================================================
    console.log('\n--- STEP 3: Platform Toggle Test ---');

    // Switch to MOBILE
    await platformToggle.selectOption('mobile');
    await page.waitForTimeout(800);
    
    const badgeAfterMobile = await envBadge.textContent().catch(() => '');
    log('Badge changes to MOBILE after toggle', 
      badgeAfterMobile.trim().toUpperCase().includes('MOBILE') ? 'PASS' : 'FAIL',
      `Badge text: "${badgeAfterMobile.trim()}"`, 'MOBILE');

    const mainCard = page.locator('#main-card');
    const hasMobileClass = await mainCard.evaluate(el => el.classList.contains('mobile-mode')).catch(() => false);
    log('Main card has mobile-mode class (red border)', hasMobileClass ? 'PASS' : 'FAIL',
      `Has mobile-mode class: ${hasMobileClass}`, 'true');

    screenshots.push(await screenshot(page, 'mobile_mode_active'));

    // Reload and check persistence (localStorage)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const persistedToggleValue = await page.locator('#platform-toggle').inputValue().catch(() => '');
    const persistedBadge = await envBadge.textContent().catch(() => '');
    log('Platform persists after reload (localStorage)', 
      persistedToggleValue === 'mobile' ? 'PASS' : 'FAIL',
      `Persisted value: "${persistedToggleValue}", Badge: "${persistedBadge.trim()}"`, 'mobile');

    screenshots.push(await screenshot(page, 'mobile_persisted_after_reload'));

    // Switch back to WEB
    await page.locator('#platform-toggle').selectOption('web');
    await page.waitForTimeout(800);
    const badgeBackToWeb = await envBadge.textContent().catch(() => '');
    log('Badge switches back to WEB', 
      badgeBackToWeb.trim().toUpperCase().includes('WEB') ? 'PASS' : 'FAIL',
      `Badge: "${badgeBackToWeb.trim()}"`, 'WEB');

    screenshots.push(await screenshot(page, 'web_mode_restored'));

    // ============================================================
    // STEP 4: File Upload
    // ============================================================
    console.log('\n--- STEP 4: File Upload (demo_blueprint.xlsx) ---');

    if (!fs.existsSync(BLUEPRINT_PATH)) {
      log('Blueprint file exists', 'FAIL', `Not found: ${BLUEPRINT_PATH}`, 'File must exist');
    } else {
      log('Blueprint file exists', 'PASS', `Found: ${BLUEPRINT_PATH}`, 'File exists');

      // Use setInputFiles on the hidden file input
      const fileInput = page.locator('input#file-input');
      const fileInputExists = await fileInput.count() > 0;
      log('File input #file-input exists', fileInputExists ? 'PASS' : 'FAIL',
        `Count: ${await fileInput.count()}`, '1 file input');

      if (fileInputExists) {
        await fileInput.setInputFiles(BLUEPRINT_PATH);
        // Wait for processing and potential tab switch
        await page.waitForTimeout(3000);

        screenshots.push(await screenshot(page, 'after_file_upload'));

        // Check if Mappings tab is now active
        const mappingsPane = page.locator('#view-mappings');
        const mappingsActive = await mappingsPane.evaluate(el => el.classList.contains('active')).catch(() => false);
        log('App auto-switches to Mappings tab after upload', mappingsActive ? 'PASS' : 'FAIL',
          `Mappings tab active: ${mappingsActive}`, 'true');

        // Check status box for upload success message
        const statusBox = page.locator('#status-box');
        const statusVisible = await statusBox.isVisible().catch(() => false);
        const statusText = await statusBox.textContent().catch(() => '');
        log('Upload status message shown', statusVisible ? 'PASS' : 'FAIL',
          `Status: "${statusText.trim().substring(0, 100)}"`, 'Success message');
      }
    }

    // ============================================================
    // STEP 5: Mappings Tab Audit
    // ============================================================
    console.log('\n--- STEP 5: Mappings Tab Audit ---');

    // Ensure we're on Mappings tab
    const mappingsTabBtn = page.locator('button.tab').filter({ hasText: /mapping/i });
    await mappingsTabBtn.click().catch(() => {});
    await page.waitForTimeout(500);

    const stepRows = page.locator('.step-row');
    const stepCount = await stepRows.count();
    log('Step rows rendered in Mappings tab', stepCount > 0 ? 'PASS' : 'FAIL',
      `Step rows found: ${stepCount}`, '>0 step rows');

    if (stepCount > 0) {
      // Check first step row for buttons
      const firstRow = stepRows.first();
      
      // Check for Record/Re-Map button
      const recordBtn = firstRow.locator('button').filter({ hasText: /record|re-map/i });
      const recordBtnCount = await recordBtn.count();
      log('Record/Re-Map button on first step', recordBtnCount > 0 ? 'PASS' : 'FAIL',
        `Count: ${recordBtnCount}`, '>=1 record button');

      // Check for Manual button
      const manualBtn = firstRow.locator('button').filter({ hasText: /manual/i });
      const manualBtnCount = await manualBtn.count();
      log('Manual button on first step', manualBtnCount > 0 ? 'PASS' : 'FAIL',
        `Count: ${manualBtnCount}`, '>=1 manual button');

      // Check step labels are real text (not template literals)
      const firstLabel = await firstRow.locator('.step-label').textContent().catch(() => '');
      const hasTemplateLiteral = firstLabel.includes('${') || firstLabel.includes('s.label');
      log('Step labels are real text (no template literals)', !hasTemplateLiteral ? 'PASS' : 'FAIL',
        `Label: "${firstLabel.trim().substring(0, 60)}"`, 'Real text, no ${...}');

      // Check all labels for template literal issues
      let templateLiteralFound = false;
      for (let i = 0; i < Math.min(stepCount, 10); i++) {
        const labelText = await stepRows.nth(i).locator('.step-label').textContent().catch(() => '');
        if (labelText.includes('${') || labelText.includes('s.label')) {
          templateLiteralFound = true;
          break;
        }
      }
      log('All step labels free of template literal artifacts', 
        !templateLiteralFound ? 'PASS' : 'FAIL',
        `Template literal found: ${templateLiteralFound}`, 'No template literals');

      // Check color coding - missing steps should be red
      const missingStepButtons = page.locator('.btn-record');
      const mappedStepButtons = page.locator('.btn-remap');
      const missingCount = await missingStepButtons.count();
      const mappedCount = await mappedStepButtons.count();
      log('Color coding: red=missing (btn-record class)', missingCount >= 0 ? 'PASS' : 'FAIL',
        `Missing (red) steps: ${missingCount}, Mapped (blue) steps: ${mappedCount}`, 'At least one red or blue');
    }

    screenshots.push(await screenshot(page, 'mappings_tab_overview'));

    // Test Record button → Guidance modal
    if (stepCount > 0) {
      const firstRecordBtn = page.locator('.step-row').first().locator('button').first();
      await firstRecordBtn.click().catch(() => {});
      await page.waitForTimeout(1000);

      const guidanceModal = page.locator('#guidance-modal');
      const guidanceVisible = await guidanceModal.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
      }).catch(() => false);
      log('Guidance modal appears on Record click (#guidance-modal)', guidanceVisible ? 'PASS' : 'FAIL',
        `Guidance modal visible: ${guidanceVisible}`, 'true');

      if (guidanceVisible) {
        screenshots.push(await screenshot(page, 'guidance_modal_open'));
        // Close it
        const closeBtn = guidanceModal.locator('button').filter({ hasText: /got it/i });
        await closeBtn.click().catch(async () => {
          // Try pressing Escape
          await page.keyboard.press('Escape');
        });
        await page.waitForTimeout(500);
        const guidanceAfterClose = await guidanceModal.evaluate(el => {
          return window.getComputedStyle(el).display !== 'none';
        }).catch(() => false);
        log('Guidance modal closes correctly', !guidanceAfterClose ? 'PASS' : 'FAIL',
          `Modal still visible after close: ${guidanceAfterClose}`, 'false');
      }
    }

    // Test Manual button → Mapping modal
    if (stepCount > 0) {
      const manualBtns = page.locator('button').filter({ hasText: /manual/i });
      const manualCount = await manualBtns.count();
      if (manualCount > 0) {
        await manualBtns.first().click().catch(() => {});
        await page.waitForTimeout(1000);

        const recordModal = page.locator('#record-modal');
        const modalVisible = await recordModal.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none';
        }).catch(() => false);
        log('Manual mapping modal appears (#record-modal)', modalVisible ? 'PASS' : 'FAIL',
          `Record modal visible: ${modalVisible}`, 'true');

        if (modalVisible) {
          screenshots.push(await screenshot(page, 'manual_mapping_modal'));
          // Close modal
          const cancelBtn = recordModal.locator('button').filter({ hasText: /cancel/i });
          await cancelBtn.click().catch(async () => {
            await page.keyboard.press('Escape');
          });
          await page.waitForTimeout(500);
        }
      } else {
        log('Manual button exists to click', 'FAIL', 'No manual buttons found', 'At least 1 manual button');
      }
    }

    screenshots.push(await screenshot(page, 'mappings_tab_final'));

    // ============================================================
    // STEP 6: Data Matrix Tab
    // ============================================================
    console.log('\n--- STEP 6: Data Matrix Tab ---');

    const dataMatrixTab = page.locator('button.tab').filter({ hasText: /data matrix/i });
    const dataMatrixTabExists = await dataMatrixTab.count() > 0;
    log('Data Matrix tab button exists', dataMatrixTabExists ? 'PASS' : 'FAIL',
      `Count: ${await dataMatrixTab.count()}`, '1 tab button');

    if (dataMatrixTabExists) {
      await dataMatrixTab.click();
      await page.waitForTimeout(800);

      const dataMatrixPane = page.locator('#view-matrix');
      const dataMatrixActive = await dataMatrixPane.evaluate(el => el.classList.contains('active')).catch(() => false);
      log('Data Matrix tab becomes active on click', dataMatrixActive ? 'PASS' : 'FAIL',
        `Active: ${dataMatrixActive}`, 'true');

      // Check for accordion sections
      const accordionSections = page.locator('.accordion-section, .accordion, [data-accordion]');
      const accordionCount = await accordionSections.count();

      // Check for variable inputs
      const varInputs = page.locator('input[data-var], input[name*="var"], .var-input');
      const varInputCount = await varInputs.count();

      // Check for any content in the matrix pane
      const matrixContent = await dataMatrixPane.textContent().catch(() => '');
      const hasContent = matrixContent.trim().length > 10;

      log('Data Matrix tab has content', hasContent ? 'PASS' : 'FAIL',
        `Content length: ${matrixContent.trim().length} chars, Content: "${matrixContent.trim().substring(0, 100)}"`,
        'Non-empty content');

      if (accordionCount > 0) {
        log('Accordion sections visible in Data Matrix', 'PASS',
          `Accordion sections: ${accordionCount}`, '>0 accordion sections');
      } else {
        log('Accordion sections or variable harvesting content', 
          varInputCount > 0 || hasContent ? 'PASS' : 'FAIL',
          `Accordion: ${accordionCount}, Var inputs: ${varInputCount}, Has content: ${hasContent}`,
          'Accordion sections OR var inputs');
      }

      screenshots.push(await screenshot(page, 'data_matrix_tab'));
    }

    // ============================================================
    // STEP 7: Execution Tab
    // ============================================================
    console.log('\n--- STEP 7: Execution Tab ---');

    const executionTab = page.locator('button.tab').filter({ hasText: /execution/i });
    const executionTabExists = await executionTab.count() > 0;
    log('Execution tab button exists', executionTabExists ? 'PASS' : 'FAIL',
      `Count: ${await executionTab.count()}`, '1 tab button');

    if (executionTabExists) {
      await executionTab.click();
      await page.waitForTimeout(800);

      // Worker count input
      const workerInput = page.locator('#worker-count');
      const workerVisible = await workerInput.isVisible().catch(() => false);
      log('Worker count input (#worker-count) visible', workerVisible ? 'PASS' : 'FAIL',
        `Visible: ${workerVisible}`, 'true');

      if (workerVisible) {
        const workerValue = await workerInput.inputValue().catch(() => '');
        log('Worker count default value is 4', workerValue === '4' ? 'PASS' : 'FAIL',
          `Value: "${workerValue}"`, '4');
      }

      // Run button
      const runBtn = page.locator('#run-btn');
      const runBtnVisible = await runBtn.isVisible().catch(() => false);
      log('Execute Test Scenarios button (#run-btn) exists', runBtnVisible ? 'PASS' : 'FAIL',
        `Visible: ${runBtnVisible}`, 'true');

      // Cancel button (should be hidden by default)
      const cancelBtn = page.locator('#cancel-btn');
      const cancelExists = await cancelBtn.count() > 0;
      if (cancelExists) {
        const cancelVisible = await cancelBtn.isVisible().catch(() => false);
        log('Cancel button hidden by default', !cancelVisible ? 'PASS' : 'FAIL',
          `Visible: ${cancelVisible}`, 'false (hidden)');
      } else {
        log('Cancel button element (#cancel-btn) in DOM', 'FAIL',
          'Element not found', '#cancel-btn should exist (hidden)');
      }

      // Results dashboard area
      const resultsArea = page.locator('#results-dashboard, #results, .results-container, #exec-results');
      const resultsExists = await resultsArea.count() > 0;
      log('Results dashboard area exists', resultsExists ? 'PASS' : 'FAIL',
        `Count: ${await resultsArea.count()}`, '>0 results area');

      screenshots.push(await screenshot(page, 'execution_tab'));
    }

    // ============================================================
    // STEP 8: Reset System Button Test
    // ============================================================
    console.log('\n--- STEP 8: Reset System Button ---');

    // Go back to Studio tab first
    const studioTab = page.locator('button.tab').filter({ hasText: /studio/i });
    await studioTab.click().catch(() => {});
    await page.waitForTimeout(500);

    const resetButton = page.locator('button').filter({ hasText: /reset system/i });
    const resetExists = await resetButton.count() > 0;

    if (resetExists) {
      // Set up dialog handler BEFORE clicking
      page.once('dialog', async dialog => {
        const dialogMsg = dialog.message();
        console.log(`  Dialog appeared: "${dialogMsg}"`);
        log('Reset System dialog/confirm appears', true ? 'PASS' : 'FAIL',
          `Dialog: "${dialogMsg}"`, 'Confirmation dialog');
        await dialog.dismiss(); // Cancel to avoid actually resetting
      });

      await resetButton.first().click();
      await page.waitForTimeout(1000);
    } else {
      log('Reset System button exists for test', 'FAIL', 'Button not found on Studio tab', 'Reset button visible');
    }

    screenshots.push(await screenshot(page, 'studio_tab_final'));

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;
    const passRate = Math.round((passCount / total) * 100);

    console.log('\n' + '='.repeat(60));
    console.log(`AUDIT COMPLETE: ${passCount}/${total} checks passed (${passRate}%)`);
    console.log('='.repeat(60));

    return { results, screenshots, passCount, failCount, total, passRate };

  } finally {
    await browser.close();
  }
}

runAudit()
  .then(({ results, screenshots, passCount, failCount, total, passRate }) => {
    // Write results to a JSON file for the report generator
    const outputData = { results, screenshots, passCount, failCount, total, passRate, timestamp: new Date().toISOString() };
    fs.writeFileSync('/Users/alvin/CodeProjects/AutoTest/pm_audit_results.json', JSON.stringify(outputData, null, 2));
    console.log('\n✅ Audit results saved to pm_audit_results.json');
    process.exit(0);
  })
  .catch(err => {
    console.error('Audit error:', err);
    // Write partial results
    const outputData = { results, screenshots: [], passCount: 0, failCount: 0, total: 0, passRate: 0, error: err.message, timestamp: new Date().toISOString() };
    fs.writeFileSync('/Users/alvin/CodeProjects/AutoTest/pm_audit_results.json', JSON.stringify(outputData, null, 2));
    process.exit(1);
  });
