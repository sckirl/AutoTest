import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

async function markLocator(locator) {
    try {
        await locator.first().evaluate((el) => {
            el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';
        });
    } catch (e) {}
}

test.describe('Automated UAT Execution', () => {
  test('Scenario HRM.A: Authentication Module', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'HRM_A');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

  test('Scenario HRM.A.1: Normal Scenario - Successful Login', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'HRM_A_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByPlaceholder('Username')); await page.getByPlaceholder('Username').fill("Admin");
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByPlaceholder('Password')); await page.getByPlaceholder('Password').fill("admin123");
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Submit Login', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' }));
        await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Dashboard', async () => {
        await markLocator(page.getByRole('heading', { name: 'Dashboard' }));
        await page.getByRole('heading', { name: 'Dashboard' }).click();
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

  test('Scenario HRM.A.2: Negative Scenario - Invalid Password', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'HRM_A_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByPlaceholder('Username')); await page.getByPlaceholder('Username').fill("Admin");
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByPlaceholder('Password')); await page.getByPlaceholder('Password').fill("wrongpassword");
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Submit Login', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' }));
        await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Invalid Credentials Error', async () => {
        await markLocator(page.getByText('Invalid credentials')); await expect(page.getByText('Invalid credentials')).toBeVisible();
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

  test('Scenario HRM.A.3: Negative Scenario - Empty Credentials', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'HRM_A_3');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Submit Login', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' }));
        await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Verify Required Validation', async () => {
        await markLocator(page.locator('form').filter({ hasText: 'Required' })); await expect(page.locator('form').filter({ hasText: 'Required' })).toBeVisible();
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

});
