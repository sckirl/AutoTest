import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://pukat-master:6969/');
});