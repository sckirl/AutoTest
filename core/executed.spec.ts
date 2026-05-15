import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

async function markLocator(locator: any) {
    try {
        await locator.first().evaluate((el: any) => {
            el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';
        });
    } catch (e) {}
}

test.describe('Automated UAT Execution', () => {
    test('Scenario A.1 - Iteration 1: Successful Admin Login', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1_Iter1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_1_' + 'Navigate to OrangeHRM'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.getByRole('textbox', { name: 'Username' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).press("ArrowLeft");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_2_' + 'Input Username'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.getByRole('textbox', { name: 'Password' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_3_' + 'Input Password'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_4_' + 'Click Login Button'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

        } finally {
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'FINAL.png') });
        }
    });

    test('Scenario A.1 - Iteration 2: Successful Admin Login', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1_Iter2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_1_' + 'Navigate to OrangeHRM'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.getByRole('textbox', { name: 'Username' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).press("ArrowLeft");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_2_' + 'Input Username'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.getByRole('textbox', { name: 'Password' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_3_' + 'Input Password'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_4_' + 'Click Login Button'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

        } finally {
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'FINAL.png') });
        }
    });

    test('Scenario A.2: Navigate to My Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_1_' + 'Navigate to OrangeHRM'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.getByRole('textbox', { name: 'Username' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).press("ArrowLeft");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_2_' + 'Input Username'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.getByRole('textbox', { name: 'Password' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_3_' + 'Input Password'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_4_' + 'Click Login Button'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Click My Info Tab', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Type for hints...' }));
            await page.getByRole('textbox', { name: 'Type for hints...' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Type for hints...' })); await page.getByRole('textbox', { name: 'Type for hints...' }).fill("{}");
            await markLocator(page.getByRole('textbox', { name: 'Type for hints...' })); await page.getByRole('textbox', { name: 'Type for hints...' }).press("ArrowLeft");
            await markLocator(page.getByRole('textbox', { name: 'Type for hints...' })); await page.getByRole('textbox', { name: 'Type for hints...' }).fill("");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_5_' + 'Click My Info Tab'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Verify Personal Details Header', async () => {
            await markLocator(page.getByRole('link', { name: 'Contact Details' }));
            await page.getByRole('link', { name: 'Contact Details' }).click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_6_' + 'Verify Personal Details Header'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

        } finally {
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'FINAL.png') });
        }
    });

    test('Scenario B.1: Invalid Login Attempt', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_1_' + 'Navigate to OrangeHRM'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.getByRole('textbox', { name: 'Username' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("{}");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).press("ArrowLeft");
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_2_' + 'Input Username'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.getByRole('textbox', { name: 'Password' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_3_' + 'Input Password'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_4_' + 'Click Login Button'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

            await test.step('Verify Login Error Message', async () => {
            await markLocator(page.getByRole('menuitem', { name: 'Logout' }));
            await page.getByRole('menuitem', { name: 'Logout' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.getByRole('textbox', { name: 'Username' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsa");
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.getByRole('textbox', { name: 'Password' }).click();
            await markLocator(page.getByRole('textbox', { name: 'Username' })); await page.getByRole('textbox', { name: 'Username' }).fill("salahsal");
            await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).fill("ahsalah");
            await markLocator(page.getByRole('textbox', { name: 'Password' })); await page.getByRole('textbox', { name: 'Password' }).press("Enter");
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'STEP_5_' + 'Verify Login Error Message'.replace(/[^a-z0-9]/gi, '_') + '.png') });
            });

        } finally {
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(resultsDir, 'FINAL.png') });
        }
    });

});
