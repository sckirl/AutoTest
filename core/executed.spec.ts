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

    test('Scenario A.1: Search for a video', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to YouTube', async () => {
            await page.goto(`https://www.youtube.com/`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input search term', async () => {
            await page.locator(`input[name='search_query']`).fill(`Playwright Tutorial`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Click search button', async () => {
            await page.locator(`input[name='search_query']`).press(`Enter`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.2: Filter by This Week', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to YouTube', async () => {
            await page.goto(`https://www.youtube.com/`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input search term', async () => {
            await page.locator(`input[name='search_query']`).fill(`Playwright Tutorial`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Click search button', async () => {
            await page.locator(`input[name='search_query']`).press(`Enter`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click filter button', async () => {
            await page.locator(`button:has-text('Filters')`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Select This Week', async () => {
            await page.locator(`a:has-text('This week')`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.3: Click first video', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to YouTube', async () => {
            await page.goto(`https://www.youtube.com/`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input search term', async () => {
            await page.locator(`input[name='search_query']`).fill(`Playwright Tutorial`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Click search button', async () => {
            await page.locator(`input[name='search_query']`).press(`Enter`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click filter button', async () => {
            await page.locator(`button:has-text('Filters')`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Select This Week', async () => {
            await page.locator(`a:has-text('This week')`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Select first video result', async () => {
            await page.locator(`ytd-video-renderer a#video-title`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.4: Like the video', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to YouTube', async () => {
            await page.goto(`https://www.youtube.com/`, { waitUntil: 'domcontentloaded' });
            try {
                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();
                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });
                await acceptBtn.click({ force: true });
            } catch (e) {}
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input search term', async () => {
            await page.locator(`input[name='search_query']`).fill(`Playwright Tutorial`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Click search button', async () => {
            await page.locator(`input[name='search_query']`).press(`Enter`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click filter button', async () => {
            await page.locator(`button:has-text('Filters')`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Select This Week', async () => {
            await page.locator(`a:has-text('This week')`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Select first video result', async () => {
            await page.locator(`ytd-video-renderer a#video-title`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Click like button', async () => {
            await page.locator(`button[aria-label*='like this video']`).click({ force: true });
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

});
