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

    test('Scenario A.1: Successful Admin Login', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            await markLocator(page.getByText('Username : AdminPassword :'));
            await expect(page.getByText('Username : AdminPassword :')).toBeVisible();
            await unmarkLocator(page.getByText('Username : AdminPassword :'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_1.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).fill("Admin");
            await unmarkLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_1.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_1.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_2_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_2.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.getByRole('button', { name: 'Login' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            await markLocator(page.getByText('Time at WorkPunched'));
            await expect(page.getByText('Time at WorkPunched')).toBeVisible();
            await unmarkLocator(page.getByText('Time at WorkPunched'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_1.png`) });
            await markLocator(page.getByText('My Actions(1) Pending Self'));
            await expect(page.getByText('My Actions(1) Pending Self')).toBeVisible();
            await unmarkLocator(page.getByText('My Actions(1) Pending Self'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_2.png`) });
            await markLocator(page.getByRole('heading'));
            await expect(page.getByRole('heading')).toContainText("Dashboard");
            await unmarkLocator(page.getByRole('heading'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_3.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario A.2: Navigate to My Info', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'A_2');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            await markLocator(page.getByText('Username : AdminPassword :'));
            await expect(page.getByText('Username : AdminPassword :')).toBeVisible();
            await unmarkLocator(page.getByText('Username : AdminPassword :'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_1.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).fill("Admin");
            await unmarkLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_1.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_1.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_2_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_2.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.getByRole('button', { name: 'Login' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            await markLocator(page.getByText('Time at WorkPunched'));
            await expect(page.getByText('Time at WorkPunched')).toBeVisible();
            await unmarkLocator(page.getByText('Time at WorkPunched'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_1.png`) });
            await markLocator(page.getByText('My Actions(1) Pending Self'));
            await expect(page.getByText('My Actions(1) Pending Self')).toBeVisible();
            await unmarkLocator(page.getByText('My Actions(1) Pending Self'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_2.png`) });
            await markLocator(page.getByRole('heading'));
            await expect(page.getByRole('heading')).toContainText("Dashboard");
            await unmarkLocator(page.getByRole('heading'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_3.png`) });
            });

            await test.step('Click My Info Tab', async () => {
            await markLocator(page.getByRole('link', { name: 'My Info' }));
            await expect(page.getByRole('link', { name: 'My Info' })).toBeVisible();
            await unmarkLocator(page.getByRole('link', { name: 'My Info' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            await markLocator(page.getByRole('link', { name: 'My Info' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_1_MARK.png`) });
            await page.getByRole('link', { name: 'My Info' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_1.png`) });
            await markLocator(page.getByText('Personal DetailsEmployee Full'));
            await expect(page.getByText('Personal DetailsEmployee Full')).toBeVisible();
            await unmarkLocator(page.getByText('Personal DetailsEmployee Full'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_2.png`) });
            await markLocator(page.locator("#app"));
            await expect(page.locator("#app")).toContainText("Personal Details");
            await unmarkLocator(page.locator("#app"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_3.png`) });
            await markLocator(page.locator("#app"));
            await expect(page.locator("#app")).toContainText("Berry Parisian");
            await unmarkLocator(page.locator("#app"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_4.png`) });
            await markLocator(page.getByRole('textbox', { name: 'First Name' }));
            await expect(page.getByRole('textbox', { name: 'First Name' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'First Name' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_5.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Middle Name' }));
            await expect(page.getByRole('textbox', { name: 'Middle Name' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Middle Name' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_6.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Last Name' }));
            await expect(page.getByRole('textbox', { name: 'Last Name' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Last Name' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_7.png`) });
            await markLocator(page.getByRole('banner'));
            await expect(page.getByRole('banner')).toContainText("PIM");
            await unmarkLocator(page.getByRole('banner'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_8.png`) });
            });

            await test.step('Verify Personal Details Header', async () => {
            await markLocator(page.getByRole('textbox', { name: 'First Name' }));
            await expect(page.getByRole('textbox', { name: 'First Name' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'First Name' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Middle Name' }));
            await expect(page.getByRole('textbox', { name: 'Middle Name' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Middle Name' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_1.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Last Name' }));
            await expect(page.getByRole('textbox', { name: 'Last Name' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Last Name' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_2.png`) });
            await markLocator(page.locator("#app"));
            await expect(page.locator("#app")).toContainText("Employee Id");
            await unmarkLocator(page.locator("#app"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_3.png`) });
            await markLocator(page.getByText('Berry ParisianPersonal'));
            await expect(page.getByText('Berry ParisianPersonal')).toBeVisible();
            await unmarkLocator(page.getByText('Berry ParisianPersonal'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_4.png`) });
            await markLocator(page.getByRole('link', { name: 'Contact Details' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_5_MARK.png`) });
            await page.getByRole('link', { name: 'Contact Details' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_5.png`) });
            await markLocator(page.getByText('Contact DetailsAddressStreet'));
            await expect(page.getByText('Contact DetailsAddressStreet')).toBeVisible();
            await unmarkLocator(page.getByText('Contact DetailsAddressStreet'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_6.png`) });
            await markLocator(page.getByRole('link', { name: 'Emergency Contacts' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_7_MARK.png`) });
            await page.getByRole('link', { name: 'Emergency Contacts' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_7.png`) });
            await markLocator(page.getByRole('heading', { name: 'Assigned Emergency Contacts' }));
            await expect(page.getByRole('heading', { name: 'Assigned Emergency Contacts' })).toBeVisible();
            await unmarkLocator(page.getByRole('heading', { name: 'Assigned Emergency Contacts' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_8.png`) });
            await markLocator(page.getByText('No Records Found').first());
            await expect(page.getByText('No Records Found').first()).toBeVisible();
            await unmarkLocator(page.getByText('No Records Found').first());
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_9.png`) });
            await markLocator(page.locator("#app"));
            await expect(page.locator("#app")).toContainText("Attachments");
            await unmarkLocator(page.locator("#app"));
            await page.screenshot({ path: path.join(resultsDir, `STEP_5_ACT_10.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

    test('Scenario B.1: Invalid Login Attempt', async ({ page }) => {
        const resultsDir = path.join(process.cwd(), 'results', 'B_1');
        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        try {
            await test.step('Navigate to OrangeHRM', async () => {
            await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login", { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_0.png`) });
            await markLocator(page.getByText('Username : AdminPassword :'));
            await expect(page.getByText('Username : AdminPassword :')).toBeVisible();
            await unmarkLocator(page.getByText('Username : AdminPassword :'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_0_ACT_1.png`) });
            });

            await test.step('Input Username', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).fill("Admin");
            await unmarkLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_1_ACT_1.png`) });
            });

            await test.step('Input Password', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_1.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_2_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).fill("admin123");
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_2_ACT_2.png`) });
            });

            await test.step('Click Login Button', async () => {
            await markLocator(page.getByRole('button', { name: 'Login' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0_MARK.png`) });
            await page.getByRole('button', { name: 'Login' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_0.png`) });
            await markLocator(page.getByText('Time at WorkPunched'));
            await expect(page.getByText('Time at WorkPunched')).toBeVisible();
            await unmarkLocator(page.getByText('Time at WorkPunched'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_1.png`) });
            await markLocator(page.getByText('My Actions(1) Pending Self'));
            await expect(page.getByText('My Actions(1) Pending Self')).toBeVisible();
            await unmarkLocator(page.getByText('My Actions(1) Pending Self'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_2.png`) });
            await markLocator(page.getByRole('heading'));
            await expect(page.getByRole('heading')).toContainText("Dashboard");
            await unmarkLocator(page.getByRole('heading'));
            await page.screenshot({ path: path.join(resultsDir, `STEP_3_ACT_3.png`) });
            });

            await test.step('Verify Login Error Message', async () => {
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_0.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_1_MARK.png`) });
            await page.getByRole('textbox', { name: 'Username' }).fill("alksdjfa");
            await unmarkLocator(page.getByRole('textbox', { name: 'Username' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_1.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_2_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).click({ force: true });
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_2.png`) });
            await markLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_3_MARK.png`) });
            await page.getByRole('textbox', { name: 'Password' }).fill("aslkdjfklasjdf");
            await unmarkLocator(page.getByRole('textbox', { name: 'Password' }));
            await page.screenshot({ path: path.join(resultsDir, `STEP_4_ACT_3.png`) });
            });

            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });
        } finally {
            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});
        }
    });

});
