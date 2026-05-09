import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Automated UAT Execution', () => {
    test('Scenario A.1: Valid Admin Login', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Dashboard Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.2: Invalid Username', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Login Error Message', async () => {
            await expect(page.locator(`.oxd-alert--error`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.3: Invalid Password', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Login Error Message', async () => {
            await expect(page.locator(`.oxd-alert--error`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.4: Empty Credentials', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Login Error Message', async () => {
            await expect(page.locator(`.oxd-alert--error`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario A.5: Logout Flow', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`{{username}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`{{password}}`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click User Dropdown', async () => {
            await page.locator(`span.oxd-userdropdown-tab`).scrollIntoViewIfNeeded(); await page.locator(`span.oxd-userdropdown-tab`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Logout', async () => {
            await page.locator(`a.oxd-userdropdown-link:has-text("Logout")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-userdropdown-link:has-text("Logout")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.1: Navigate to Admin', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Admin Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Admin")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Admin")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Admin Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Admin`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.2: Navigate to PIM', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify PIM Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`PIM`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.3: Navigate to Leave', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Leave Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Leave")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Leave")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Leave Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Leave`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.4: Navigate to Time', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Time Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Time")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Time")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Time Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Time`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.5: Navigate to Recruitment', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Recruitment Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Recruitment")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Recruitment")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Recruitment Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Recruitment`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.6: Navigate to My Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_6');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify My Info Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`PIM`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.7: Navigate to Performance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_7');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Performance Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Performance")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Performance")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Performance Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Performance`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.8: Navigate to Dashboard', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_8');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Dashboard Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Dashboard")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Dashboard")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Dashboard Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.9: Navigate to Directory', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_9');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Directory Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Directory")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Directory")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Directory Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Directory`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario B.10: Navigate to Maintenance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_10');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Maintenance Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("Maintenance")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("Maintenance")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Maintenance Header', async () => {
            await expect(page.locator(`h6.oxd-topbar-header-breadcrumb-module`)).toContainText(`Maintenance`, { timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.1: Add Employee 1', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Add Employee Tab', async () => {
            await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Input First Name', async () => {
            await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test1`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Last Name', async () => {
            await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User1`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Save Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_8_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.2: Add Employee 2', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Add Employee Tab', async () => {
            await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Input First Name', async () => {
            await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test2`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Last Name', async () => {
            await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User2`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Save Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_8_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.3: Add Employee 3', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Add Employee Tab', async () => {
            await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Input First Name', async () => {
            await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test3`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Last Name', async () => {
            await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User3`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Save Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_8_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.4: Add Employee 4', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Add Employee Tab', async () => {
            await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Input First Name', async () => {
            await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test4`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Last Name', async () => {
            await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User4`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Save Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_8_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.5: Add Employee 5', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Add Employee Tab', async () => {
            await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).scrollIntoViewIfNeeded(); await page.locator(`li.oxd-topbar-body-nav-tab:has-text("Add Employee")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Input First Name', async () => {
            await page.locator(`input[name="firstName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="firstName"]`).fill(`Test5`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Last Name', async () => {
            await page.locator(`input[name="lastName"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="lastName"]`).fill(`User5`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_7_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Save Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_8_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.6: Search Employee 1', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_6');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Employee Name Search', async () => {
            await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test1`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Search Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.7: Search Employee 2', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_7');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Employee Name Search', async () => {
            await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test2`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Search Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.8: Search Employee 3', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_8');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Employee Name Search', async () => {
            await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test3`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Search Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.9: Search Employee 4', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_9');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Employee Name Search', async () => {
            await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test4`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Search Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario C.10: Search Employee 5', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_10');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click PIM Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("PIM")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Employee Name Search', async () => {
            await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).scrollIntoViewIfNeeded(); await page.locator(`div.oxd-input-group:has(label:has-text("Employee Name")) input`).fill(`Test5`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Search Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario D.1: Review Performance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Review Performance Section', async () => {
            await page.locator(`a.orangehrm-tabs-item:has-text("Performance")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Performance")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Content Visibility', async () => {
            await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario D.2: Update Contact Details', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Update Contact Details Section', async () => {
            await page.locator(`a.orangehrm-tabs-item:has-text("Contact Details")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Contact Details")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Content Visibility', async () => {
            await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario D.3: View Job Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click View Job Info Section', async () => {
            await page.locator(`a.orangehrm-tabs-item:has-text("Job")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Job")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Content Visibility', async () => {
            await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario D.4: Check Salary Details', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Check Salary Details Section', async () => {
            await page.locator(`a.orangehrm-tabs-item:has-text("Salary")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Salary")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Content Visibility', async () => {
            await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

    test('Scenario D.5: Emergency Contacts', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await test.step('Navigate to OrangeHRM', async () => {
            await page.goto(`https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`, { waitUntil: 'domcontentloaded' });
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Username', async () => {
            await page.locator(`input[name="username"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="username"]`).fill(`Admin`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`), fullPage: true });
        });

        await test.step('Input Password', async () => {
            await page.locator(`input[name="password"]`).scrollIntoViewIfNeeded(); await page.locator(`input[name="password"]`).fill(`admin123`);
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Login Button', async () => {
            await page.locator(`button[type="submit"]`).scrollIntoViewIfNeeded(); await page.locator(`button[type="submit"]`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`), fullPage: true });
        });

        await test.step('Click My Info Menu', async () => {
            await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).scrollIntoViewIfNeeded(); await page.locator(`a.oxd-main-menu-item:has-text("My Info")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`), fullPage: true });
        });

        await test.step('Click Emergency Contacts Section', async () => {
            await page.locator(`a.orangehrm-tabs-item:has-text("Emergency Contacts")`).scrollIntoViewIfNeeded(); await page.locator(`a.orangehrm-tabs-item:has-text("Emergency Contacts")`).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`), fullPage: true });
        });

        await test.step('Verify Content Visibility', async () => {
            await expect(page.locator(`.orangehrm-edit-employee-content`)).toBeVisible({ timeout: 10000 });
            await page.screenshot({ path: path.join(resultsDir, `STEP_6_ACT_0.png`), fullPage: true });
        });

        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
    });

});
