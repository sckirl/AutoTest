import { test, expect } from '@playwright/test';
test('test', async ({ page }) => {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
    page.locator('#submit').click()
  ]);
});