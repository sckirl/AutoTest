import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Automated UAT Execution', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('yt-consent-dialog-shown', 'true');
        });
    });

    test('Scenario A.1: Successful Admin Login', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name='username']`).fill(`Admin`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name='password']`).fill(`admin123`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type='submit']`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.2: Navigate to My Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name='username']`).fill(`Admin`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name='password']`).fill(`admin123`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type='submit']`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Tab', async () => {
            await page.locator(`xpath=//span[text()='My Info']`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Personal Details Header', async () => {
            await page.locator(`xpath=//h6[text()='Personal Details']`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.1: Invalid Login Attempt', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name='username']`).fill(`Invalid`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name='password']`).fill(`Wrong123`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type='submit']`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Login Error Message', async () => {
            await page.locator(`xpath=//p[contains(@class, 'oxd-alert-content-text')]`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

});
