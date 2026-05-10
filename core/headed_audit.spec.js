const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Headed UAT Audit - Flow A: Standard Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
    });

    test('Complete UAT Lifecycle with State Verification', async ({ page }) => {
        // 1. Initial State Check
        await expect(page.locator('h1')).toContainText('AUTOMATION STUDIO');
        await expect(page.locator('#tab-studio')).toHaveClass(/tab-active/);

        // 2. Upload Realistic Matrix
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('#drop-zone').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(path.join(process.cwd(), 'scenario_qa.xlsx'));
        
        await expect(page.locator('.status-success')).toBeVisible({ timeout: 10000 });
        // Auto-transition check
        await expect(page.locator('#tab-mappings')).toHaveClass(/tab-active/);
        await expect(page.locator('#view-mappings')).toBeVisible();

        // 3. Mapping Precision Check
        const firstRow = page.locator('.step-row').first();
        await expect(firstRow.locator('.step-label')).toBeVisible();
        
        // Test Record Modal & Overwrite Block (DEF-037)
        await firstRow.locator('.btn-record').click();
        await expect(page.locator('#record-modal')).toBeVisible();
        await page.locator('#recorded-code').fill('await page.goto("https://google.com");');
        // Wait and see if auto-polling wipes it (simulated delay)
        await page.waitForTimeout(3000);
        await expect(page.locator('#recorded-code')).toHaveValue('await page.goto("https://google.com");');

        // Test advanced locator capability (DEF-053)
        const advancedCode = `await page.getByRole('button', { name: 'Login' }).click();\nawait expect(page.locator('#app')).toBeVisible();`;
        await page.locator('#recorded-code').fill(advancedCode);
        await page.locator('text=Sync & Save Action').click();
        
        // If it failed due to over-hardening, we catch it here
        const status = page.locator('#status-box');
        const statusText = await status.innerText();
        if (statusText.includes('Save failed')) {
            console.log('AUDIT_RESULT: DEF-053 Confirmed - Advanced locators still blocked.');
        }

        // 4. Execution Tab Transition
        await page.locator('#tab-execution').click();
        await expect(page.locator('#run-btn')).toBeVisible();
        
        // Check Worker persistent defaults
        const workerInput = page.locator('#worker-count');
        await expect(workerInput).toHaveValue('4');
    });
});

test.describe('Headed UAT Audit - Flow B: Concurrency & Stress', () => {
    test('Simultaneous Execute Spam', async ({ page }) => {
        await page.goto('http://localhost:3000');
        // Assuming file already uploaded from previous test run artifacts
        await page.locator('#tab-execution').click();
        
        // Double-click Execute rapidly
        const runBtn = page.locator('#run-btn');
        if (await runBtn.isEnabled()) {
            await runBtn.click();
            await runBtn.click(); 
        }
        
        // Check if "Fake Failure" 409 appears (DEF-058)
        await page.waitForTimeout(1000);
        const status = page.locator('#status-box');
        if (await status.isVisible() && (await status.innerText()).includes('failed to start')) {
            console.log('AUDIT_RESULT: DEF-058 Confirmed - Button spams 409 error.');
        }
    });

    test('Refresh Persistence Audit (DEF-051)', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.locator('#tab-execution').click();
        const runBtn = page.locator('#run-btn');
        
        if (await runBtn.isEnabled()) {
            await runBtn.click();
            await page.waitForTimeout(2000); // Let it start
            await page.reload();
            
            // Should auto-reattach to Execution tab
            await expect(page.locator('#tab-execution')).toHaveClass(/tab-active/);
            await expect(page.locator('#status-box')).toBeVisible();
            await expect(page.locator('#cancel-run-btn')).toBeVisible();
        }
    });
});
