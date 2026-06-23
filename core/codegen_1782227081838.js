import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  await expect(page.locator('div').nth(2)).toBeVisible();
  await expect(page.getByRole('heading')).toContainText('Login');
  await expect(page.locator('form')).toContainText('Username');
  await expect(page.getByText('Password', { exact: true })).toBeVisible();
});