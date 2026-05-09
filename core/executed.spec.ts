import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

async function markLocator(locator: any) {
    try {
        await locator.first().evaluate((el: any) => {
            const prev = {
                outline: el.style.outline,
                boxShadow: el.style.boxShadow,
                transition: el.style.transition,
            };
            el.setAttribute('data-autotest-prev', JSON.stringify(prev));
            el.style.transition = 'all 120ms ease';
            el.style.outline = '3px solid #ff1f1f';
            el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';
        });
    } catch (e) {}
}

async function unmarkLocator(locator: any) {
    try {
        await locator.first().evaluate((el: any) => {
            const raw = el.getAttribute('data-autotest-prev');
            if (!raw) return;
            const prev = JSON.parse(raw);
            el.style.outline = prev.outline || '';
            el.style.boxShadow = prev.boxShadow || '';
            el.style.transition = prev.transition || '';
            el.removeAttribute('data-autotest-prev');
        });
    } catch (e) {}
}

test.describe('Automated UAT Execution', () => {
    test.describe.configure({ mode: process.env.AUTOTEST_FULLY_PARALLEL === '1' ? 'parallel' : 'serial' });

    test.beforeEach(async () => {});

    test('Scenario A.1: Login Scenario 1', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario A.2: Invalid Username', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("WrongUser");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Login Error Message', async () => {
            await markLocator(page.locator("p.oxd-alert-content-text"));
            await expect(page.locator("p.oxd-alert-content-text")).toBeVisible();
            await unmarkLocator(page.locator("p.oxd-alert-content-text"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario A.3: Invalid Password', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("WrongPass");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Login Error Message', async () => {
            await markLocator(page.locator("p.oxd-alert-content-text"));
            await expect(page.locator("p.oxd-alert-content-text")).toBeVisible();
            await unmarkLocator(page.locator("p.oxd-alert-content-text"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario A.4: Empty Login', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Login Error Message', async () => {
            await markLocator(page.locator("p.oxd-alert-content-text"));
            await expect(page.locator("p.oxd-alert-content-text")).toBeVisible();
            await unmarkLocator(page.locator("p.oxd-alert-content-text"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario A.5: Case Sensitive Password', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("ADMIN123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Login Error Message', async () => {
            await markLocator(page.locator("p.oxd-alert-content-text"));
            await expect(page.locator("p.oxd-alert-content-text")).toBeVisible();
            await unmarkLocator(page.locator("p.oxd-alert-content-text"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.1: Navigate to Admin', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Admin Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Admin')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Admin')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Admin')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Admin Header', async () => {
            await markLocator(page.locator("h6:has-text('Admin')"));
            await expect(page.locator("h6:has-text('Admin')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Admin')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.2: Navigate to PIM', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click PIM Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('PIM')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('PIM')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('PIM')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify PIM Header', async () => {
            await markLocator(page.locator("h6:has-text('PIM')"));
            await expect(page.locator("h6:has-text('PIM')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('PIM')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.3: Navigate to Leave', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Leave Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Leave')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Leave')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Leave')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Leave Header', async () => {
            await markLocator(page.locator("h6:has-text('Leave')"));
            await expect(page.locator("h6:has-text('Leave')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Leave')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.4: Navigate to Time', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Time Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Time')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Time')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Time')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Time Header', async () => {
            await markLocator(page.locator("h6:has-text('Time')"));
            await expect(page.locator("h6:has-text('Time')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Time')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.5: Navigate to Recruitment', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Recruitment Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Recruitment')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Recruitment')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Recruitment')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Recruitment Header', async () => {
            await markLocator(page.locator("h6:has-text('Recruitment')"));
            await expect(page.locator("h6:has-text('Recruitment')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Recruitment')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.6: Navigate to My Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_6');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click My Info Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('My Info')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('My Info')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('My Info')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Personal Details Header', async () => {
            await markLocator(page.locator("h6:has-text('Personal Details')"));
            await expect(page.locator("h6:has-text('Personal Details')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Personal Details')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.7: Navigate to Performance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_7');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Performance Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Performance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Performance')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Performance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Performance Header', async () => {
            await markLocator(page.locator("h6:has-text('Performance')"));
            await expect(page.locator("h6:has-text('Performance')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Performance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.8: Navigate to Dashboard', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_8');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Dashboard Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Dashboard')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.9: Navigate to Directory', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_9');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Directory Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Directory')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Directory')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Directory')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Directory Header', async () => {
            await markLocator(page.locator("h6:has-text('Directory')"));
            await expect(page.locator("h6:has-text('Directory')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Directory')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.10: Navigate to Maintenance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_10');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Maintenance Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Maintenance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Maintenance')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Maintenance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Maintenance Header', async () => {
            await markLocator(page.locator("h6:has-text('Maintenance')"));
            await expect(page.locator("h6:has-text('Maintenance')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Maintenance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.1: Stress Test: Admin', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Admin Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Admin')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Admin')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Admin')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Admin Header', async () => {
            await markLocator(page.locator("h6:has-text('Admin')"));
            await expect(page.locator("h6:has-text('Admin')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Admin')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.2: Stress Test: PIM', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click PIM Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('PIM')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('PIM')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('PIM')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify PIM Header', async () => {
            await markLocator(page.locator("h6:has-text('PIM')"));
            await expect(page.locator("h6:has-text('PIM')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('PIM')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.3: Stress Test: Leave', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Leave Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Leave')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Leave')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Leave')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Leave Header', async () => {
            await markLocator(page.locator("h6:has-text('Leave')"));
            await expect(page.locator("h6:has-text('Leave')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Leave')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.4: Stress Test: Time', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Time Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Time')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Time')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Time')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Time Header', async () => {
            await markLocator(page.locator("h6:has-text('Time')"));
            await expect(page.locator("h6:has-text('Time')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Time')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.5: Stress Test: Recruitment', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Recruitment Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Recruitment')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Recruitment')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Recruitment')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Recruitment Header', async () => {
            await markLocator(page.locator("h6:has-text('Recruitment')"));
            await expect(page.locator("h6:has-text('Recruitment')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Recruitment')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.6: Stress Test: My Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_6');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click My Info Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('My Info')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('My Info')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('My Info')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Personal Details Header', async () => {
            await markLocator(page.locator("h6:has-text('Personal Details')"));
            await expect(page.locator("h6:has-text('Personal Details')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Personal Details')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.7: Stress Test: Performance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_7');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Performance Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Performance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Performance')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Performance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Performance Header', async () => {
            await markLocator(page.locator("h6:has-text('Performance')"));
            await expect(page.locator("h6:has-text('Performance')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Performance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.8: Stress Test: Dashboard', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_8');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Dashboard Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Dashboard')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.9: Stress Test: Directory', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_9');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Directory Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Directory')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Directory')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Directory')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Directory Header', async () => {
            await markLocator(page.locator("h6:has-text('Directory')"));
            await expect(page.locator("h6:has-text('Directory')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Directory')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario C.10: Stress Test: Maintenance', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'C_10');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Click Maintenance Menu', async () => {
            await markLocator(page.locator("a.oxd-main-menu-item:has-text('Maintenance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.locator("a.oxd-main-menu-item:has-text('Maintenance')").click({ force: true });
            await unmarkLocator(page.locator("a.oxd-main-menu-item:has-text('Maintenance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await test.step('Verify Maintenance Header', async () => {
            await markLocator(page.locator("h6:has-text('Maintenance')"));
            await expect(page.locator("h6:has-text('Maintenance')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Maintenance')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario D.1: Quick Check 1', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario D.2: Quick Check 2', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario D.3: Quick Check 3', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_3');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario D.4: Quick Check 4', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_4');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario D.5: Quick Check 5', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'D_5');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.locator("input[name='username']").fill("Admin");
            await unmarkLocator(page.locator("input[name='username']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0_MARK.png`) });
            await page.locator("input[name='password']").fill("admin123");
            await unmarkLocator(page.locator("input[name='password']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.locator("button[type='submit']").click({ force: true });
            await unmarkLocator(page.locator("button[type='submit']"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            });

            await test.step('Verify Dashboard Header', async () => {
            await markLocator(page.locator("h6:has-text('Dashboard')"));
            await expect(page.locator("h6:has-text('Dashboard')")).toBeVisible();
            await unmarkLocator(page.locator("h6:has-text('Dashboard')"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

});
