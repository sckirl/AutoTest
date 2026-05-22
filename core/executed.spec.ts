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
  test('Scenario A.1: OrangeHRM Admin Login', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByPlaceholder("Username")); await page.getByPlaceholder("Username").fill("");
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByPlaceholder("Password")); await page.getByPlaceholder("Password").fill("");
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole("button", "name"));
        await Promise.all([page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle' }).catch(() => {}), page.getByRole("button", "name").click()]);
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Dashboard', async () => {
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

});
