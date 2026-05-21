import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Zero-Defect Studio E2E Audit: Upload, Chain-Record, Global-Sync, Run', async ({ page }) => {
    // 1. HARD RESET
    await page.goto('http://localhost:3000');
    page.on('dialog', d => d.accept());
    await page.click('button:has-text("Reset System")');
    await page.waitForLoadState('networkidle');

    // 2. UPLOAD EXCEL (Multi-Scenario A.1, A.2)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#drop-zone');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(process.cwd(), 'scenario_uploaded.xlsx'));
    await page.waitForSelector('.step-row');
    console.log('✅ Multi-Scenario Upload Verified');

    // 3. VERIFY MULTI-FLOW DETECTION
    const instruction = page.locator('.step-instruction').first();
    await expect(instruction).toContainText('Used in:');
    console.log('✅ Multi-Flow Logic Verified');

    // 4. MOCK RECORDING (Verify Inspector-First Sync)
    await page.click('button:has-text("Record")');
    // Ensure modal appears
    await expect(page.locator('#record-modal')).toBeVisible();
    
    // Simulate pasting code from Inspector
    await page.fill('#recorded-code', "await page.goto('http://pukat-master:6969');");
    await page.click('button:has-text("Sync & Save Action")');
    
    // Status should flip to MAPPED
    await expect(page.locator('.badge-mapped').first()).toBeVisible();
    console.log('✅ Global Sync Mapping Verified');

    // 5. TEST BUTTON RENAME
    const runBtn = page.locator('#run-btn');
    await expect(runBtn).toHaveText('🚀 Execute Test Scenarios');
    console.log('✅ Button Rename Verified');
});
