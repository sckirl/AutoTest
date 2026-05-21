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
  test('Scenario A.1 - Iteration 1: Login Scenario 1', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_1_Iter1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario A.2: Invalid Username', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Login Error Message', async () => {
        await markLocator(page.getByRole('menuitem', { name: 'Logout' })); await page.getByRole('menuitem', { name: 'Logout' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsa");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsal");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("ahsalah");
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario A.3: Invalid Password', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_3');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Login Error Message', async () => {
        await markLocator(page.getByRole('menuitem', { name: 'Logout' })); await page.getByRole('menuitem', { name: 'Logout' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsa");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsal");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("ahsalah");
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario A.4: Empty Login', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_4');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Login Error Message', async () => {
        await markLocator(page.getByRole('menuitem', { name: 'Logout' })); await page.getByRole('menuitem', { name: 'Logout' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsa");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsal");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("ahsalah");
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario A.5: Case Sensitive Password', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'A_5');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Login Error Message', async () => {
        await markLocator(page.getByRole('menuitem', { name: 'Logout' })); await page.getByRole('menuitem', { name: 'Logout' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsa");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsal");
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("ahsalah");
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_5.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.1: Navigate to Admin', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.2: Navigate to PIM', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.3: Navigate to Leave', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_3');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.4: Navigate to Time', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_4');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.5: Navigate to Recruitment', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_5');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.6: Navigate to My Info', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_6');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Personal Details Header', async () => {
        await markLocator(page.getByRole('link', { name: 'Contact Details' })); await page.getByRole('link', { name: 'Contact Details' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_6.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.7: Navigate to Performance', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_7');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.8: Navigate to Dashboard', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_8');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.9: Navigate to Directory', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_9');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario B.10: Navigate to Maintenance', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'B_10');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.1: Stress Test: Admin', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.2: Stress Test: PIM', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.3: Stress Test: Leave', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_3');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.4: Stress Test: Time', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_4');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.5: Stress Test: Recruitment', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_5');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.6: Stress Test: My Info', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_6');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
      await test.step('Verify Personal Details Header', async () => {
        await markLocator(page.getByRole('link', { name: 'Contact Details' })); await page.getByRole('link', { name: 'Contact Details' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_6.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.7: Stress Test: Performance', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_7');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.8: Stress Test: Dashboard', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_8');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.9: Stress Test: Directory', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_9');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario C.10: Stress Test: Maintenance', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'C_10');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario D.1: Quick Check 1', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'D_1');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario D.2: Quick Check 2', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'D_2');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario D.3: Quick Check 3', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'D_3');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario D.4: Quick Check 4', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'D_4');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

  test('Scenario D.5: Quick Check 5', async ({ page }) => {
    const resultsDir = path.join(process.cwd(), 'results', 'D_5');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    try {
      await test.step('Navigate to OrangeHRM', async () => {
        await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(resultsDir, 'STEP_1.png'), fullPage: true });
      });
      await test.step('Input Username', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
        await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_2.png'), fullPage: true });
      });
      await test.step('Input Password', async () => {
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).click();
        await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
      await page.screenshot({ path: path.join(resultsDir, 'STEP_3.png'), fullPage: true });
      });
      await test.step('Click Login Button', async () => {
        await markLocator(page.getByRole('button', { name: 'Login' })); await page.getByRole('button', { name: 'Login' }).click();
      await page.screenshot({ path: path.join(resultsDir, 'STEP_4.png'), fullPage: true });
      });
    } finally {
      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });
    }
  });

});
