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
  test('Scenario PT.A: Practice Test Login', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'PT_A');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

  test('Scenario PT.1: Normal Scenario - Successful Login', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'PT_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
      await test.step('Navigate to PracticeTest', async () => {
        await page.goto("https://practicetestautomation.com/practice-test-login/", { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.locator('#username')); await page.locator('#username').fill("student");
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.locator('#password')); await page.locator('#password').fill("Password123");
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Submit Login', async () => {
        await markLocator(page.locator('#submit'));
        await page.locator('#submit').click();
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Login Success', async () => {
        await markLocator(page.locator('h1.post-title')); await expect(page.locator('h1.post-title')).toBeVisible();
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

  test('Scenario PT.2: Negative Scenario - Incorrect Password', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'PT_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
      await test.step('Navigate to PracticeTest', async () => {
        await page.goto("https://practicetestautomation.com/practice-test-login/", { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.locator('#username')); await page.locator('#username').fill("student");
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.locator('#password')); await page.locator('#password').fill("wrongpassword");
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Submit Login', async () => {
        await markLocator(page.locator('#submit'));
        await page.locator('#submit').click();
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Error Message', async () => {
        await markLocator(page.locator('#error')); await expect(page.locator('#error')).toBeVisible();
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

  test('Scenario PT.3: Negative Scenario - Incorrect Username', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'PT_3');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    try {
      await test.step('Navigate to PracticeTest', async () => {
        await page.goto("https://practicetestautomation.com/practice-test-login/", { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.locator('#username')); await page.locator('#username').fill("wronguser");
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.locator('#password')); await page.locator('#password').fill("Password123");
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Submit Login', async () => {
        await markLocator(page.locator('#submit'));
        await page.locator('#submit').click();
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Error Message', async () => {
        await markLocator(page.locator('#error')); await expect(page.locator('#error')).toBeVisible();
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });
    }
  });

});
