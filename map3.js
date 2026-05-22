import { test, expect } from '@playwright/test';
test('test', async ({ page }) => {
  await page.locator('#password').fill('{Password}');
});