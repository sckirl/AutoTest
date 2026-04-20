import { test, expect } from '@playwright/test';
import * as actions from './library';

test('A.1', async ({ page }) => {
  // Step: Latest Feed Clicked
  await actions.clickHeaderProducts(page, '');
  // Step: Cluster Buys Clicked
  await actions.clickCategoryMen(page, '');
  // Step: Min. unique insiders change to 10
  await actions.fillFooterSubscriptionEmail(page, '');
  // Step: Rolling Window (Days) 30 Days
  await actions.clickHeaderCart(page, '');
});

test('A.2', async ({ page }) => {
  // Step: Cluster Buys Clicked
  await actions.clickCategoryMen(page, '');
  // Step: Min. unique insiders change to 2
  await actions.fillFooterSubscriptionEmail(page, '');
});

