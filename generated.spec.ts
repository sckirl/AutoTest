import { test, expect } from '@playwright/test';
import * as actions from './library';

test('A.1 Ganti Unique insiders', async ({ page }) => {
  // Step: Latest Feed Clicked
  await actions.latest_feed_clicked(page, '');
  // Step: Cluster Buys Clicked
  await actions.cluster_buys_clicked(page, '');
  // Step: Min. unique insiders change to 10
  await actions.min__unique_insiders_change_to_10(page, '');
  // Step: Rolling Window (Days) 30 Days
  await actions.rolling_window__days__30_days(page, '');
});

test('A.2 min.insider to 2', async ({ page }) => {
  // Step: Cluster Buys ditekan
  await actions.cluster_buys_ditekan(page, '');
  // Step: Min. unique insiders 100
  await actions.min__unique_insiders_100(page, '');
});

test('A.3', async ({ page }) => {
  // Step: Cluster Buys Clicked
  await actions.cluster_buys_clicked(page, '');
  // Step: Min. unique insiders 100
  await actions.min__unique_insiders_100(page, '');
  // WARNING: No mapping for 'Rolling Window (Days) 2'
});

