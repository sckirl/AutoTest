import { test, expect } from '@playwright/test';
test('test', async ({ page }) => {
  await page.locator('#username').fill('{Username}');
});