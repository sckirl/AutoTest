import { Page, expect } from '@playwright/test';

/**
 * SOURCE OF TRUTH: MANUAL ACTION LIBRARY
 * These functions are verified manually via Codegen.
 */ 
export async function clicked(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
}

export async function change_to_10(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
}

export async function asdfasdf(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
}

export async function latest_feed_clicked(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('button', { name: 'Latest Feed' }).click();
  await expect(page.locator('thead')).toContainText('Date');
  await page.getByRole('columnheader', { name: 'Ticker' }).click();
  await expect(page.locator('thead')).toContainText('Insider Name');
  await expect(page.locator('thead')).toContainText('Role');
  await expect(page.locator('thead')).toContainText('Action');
}

export async function cluster_buys_clicked(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('button', { name: 'Cluster Buys 🔥' }).click();
  await expect(page.getByRole('main')).toContainText('Min Unique Insiders');
  await expect(page.getByRole('main')).toContainText('Rolling Window (Days)');
}

export async function min__unique_insiders_change_to_10(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('10');
  await page.getByRole('spinbutton').press('Enter');
}

export async function rolling_window__days__30_days(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('button', { name: 'Cluster Buys 🔥' }).click();
  await page.getByRole('combobox').selectOption('90');
  await page.getByRole('combobox').selectOption('30');
}

export async function min__unique_insiders_change_to_2(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('button', { name: 'Cluster Buys 🔥' }).click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('2');
  await page.getByRole('spinbutton').press('Enter');
}

export async function cluster_buys_ditekan(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('button', { name: 'Cluster Buys 🔥' }).click();
}

export async function min__unique_insiders_100(page: Page, data: string) {
  await page.goto('http://pukat-master:6969/');
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('100');
  await expect(page.getByText('IXIDX OpenInsiderLatest FeedCluster Buys 🔥🔍Scrape YTDMin Unique')).toBeVisible();
}
