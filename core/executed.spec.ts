import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Automated UAT Execution', () => {
    test.describe.configure({ mode: 'serial' });

    test('Scenario A.1: E2E: Happy Path Upload & Scan', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Upload Valid Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.2: E2E: Direct Recording Workflow', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Record Button', async () => {
            await page.locator(`button.btn-record`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button.btn-record`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Perform Direct Action', async () => {
            await page.locator(`body`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`body`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.3: E2E: Full Execution Launch', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Execute Scenarios', async () => {
            await page.locator(`button#run-btn`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button#run-btn`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.1: Edge: Upload Non-Excel File', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Upload Invalid File', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.2: Edge: Upload Empty Excel', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Upload Empty Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.3: Edge: Large Dataset Stress Test', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Upload Large Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.1: UX: Base URL Persistence', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Base URL', async () => {
            await page.locator(`input#base-url`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`input#base-url`).fill(``);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.2: UX: System Reset Verification', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Reset System', async () => {
            await page.locator(`button:has-text('Reset System')`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button:has-text('Reset System')`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario D.1: Data: Token Replacement', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Run Tokenized Step', async () => {
            await page.locator(`input#base-url`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`input#base-url`).fill(``);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario E.1: Function: Re-mapping existing', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'E_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Re-Map Button', async () => {
            await page.locator(`button.btn-record`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button.btn-record`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario F.1: Security: Malicious Code Input', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'F_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Paste Malicious Script', async () => {
            await page.locator(`body`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`body`).fill(``);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario G.1: Vari: Special Chars in Labels', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'G_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Upload Special Char Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario G.2: Vari: Multiple Sheets in Excel', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'G_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Upload Multi-Sheet Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario H.1: UX: Drag & Drop Area Feedback', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'H_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Drag File Over Zone', async () => {
            await page.locator(`div#drop-zone`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`div#drop-zone`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario H.2: UX: Polling for Mapped Status', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'H_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Trigger Info Status', async () => {
            await page.locator(`div#drop-zone`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`div#drop-zone`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario I.1: Engine: Scroll into View Check', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'I_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Run Step for Hidden Element', async () => {
            await page.locator(`button.btn-danger`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button.btn-danger`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario I.2: Engine: Multi-step action', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'I_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Perform Multi-Step Action', async () => {
            await page.locator(`body`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`body`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
            await page.locator(`body`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`body`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_1.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario I.3: Engine: Navigation Timeouts', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'I_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Run Long Goto Step', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario J.1: Bnd: Max Length Label', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'J_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Upload Long Label Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario J.2: Bnd: Missing Change ID', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'J_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Upload No-ID Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario K.1: Flow: A.1 and B.1 conflict', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'K_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Upload Multi-Flow Excel', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario L.1: Data: JSON in Test Data', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'L_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Run JSON Data Step', async () => {
            await page.locator(`input#base-url`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`input#base-url`).fill(``);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario M.1: UX: Error Alert Visibility', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'M_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Trigger Studio Error', async () => {
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario N.1: Sys: Directory Cleanup', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'N_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Click Reset System', async () => {
            await page.locator(`button:has-text('Reset System')`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button:has-text('Reset System')`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario N.2: Sys: Spec File Generation', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'N_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Click Execute Scenarios', async () => {
            await page.locator(`button#run-btn`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button#run-btn`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario O.1: Perf: Concurrent Scan Request', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'O_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario O.2: Perf: Rapid UI Interaction', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'O_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Rapidly Click Elements', async () => {
            await page.locator(`#drop-zone`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`#drop-zone`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario P.1: Cert: Final Certification Run', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'P_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Perform All Steps', async () => {
            await page.locator(`button#run-btn`).waitFor({ state: 'visible', timeout: 10000 });
            await page.locator(`button#run-btn`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario P.2: Cert: Regression Check', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'P_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to Studio', async () => {
            await page.goto(`http://localhost:3000`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

});
