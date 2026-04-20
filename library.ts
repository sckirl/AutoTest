import { Page, expect } from '@playwright/test';

/**
 * SOURCE OF TRUTH: MANUAL ACTION LIBRARY
 * These functions are verified manually via Codegen.
 */

export async function login_sebagai(page: Page, role: string) {
    console.log(`[Action] Logging in as: ${role}`);
    await page.goto('http://pukat-master:6969/');
    
    // Manual mapping of roles to credentials/actions
    if (role.includes('SPV')) {
        await page.locator('#username').fill('spv_user');
        await page.locator('#password').fill('password123');
    } else if (role.includes('Kaur')) {
        await page.locator('#username').fill('kaur_user');
        await page.locator('#password').fill('password123');
    }
    
    await page.getByRole('button', { name: 'Login' }).click();
    // Ensure login was successful
    await expect(page).toHaveURL(/.*dashboard/);
}

export async function ke_menu(page: Page, menuName: string) {
    console.log(`[Action] Navigating to menu: ${menuName}`);
    await page.getByRole('link', { name: menuName, exact: true }).click();
}

export async function buat_data_baru(page: Page, trigger: string) {
    if (trigger.toLowerCase() === 'di klik') {
        console.log(`[Action] Clicking Create New Data`);
        await page.getByRole('button', { name: 'Create New Data' }).click();
        await expect(page.locator('.form-container')).toBeVisible();
    }
}

export async function isi_form_aksesoris(page: Page, data: string) {
    console.log(`[Action] Filling form with data: ${data}`);
    // Example: data = "Name:Keyboard, Price:50"
    const fields = data.split(',');
    for (const field of fields) {
        const [label, value] = field.split(':');
        await page.getByLabel(label.trim()).fill(value.trim());
    }
}

export async function simpan_dan_setujui(page: Page, trigger: string) {
    if (trigger.toLowerCase() === 'di klik') {
        console.log(`[Action] Saving and Approving`);
        await page.getByRole('button', { name: 'Save' }).click();
        await page.getByRole('button', { name: 'Approve' }).click();
        await expect(page.locator('.success-message')).toBeVisible();
    }
}
