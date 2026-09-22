// A4.1 — smoke-tests the offline fixture app itself (tests/fixtures/app/*.html). Not part of the
// A4.2/A4.3 golden-codegen suite (which needs human-recorded fixtures, not built yet) — this just
// proves the pages' own interactivity works, so future golden-fixture tests aren't built against a
// broken target.
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const PORT = process.env.FIXTURE_TEST_PORT || 3999;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.join(__dirname, '..');

function ping() {
  return new Promise(resolve => {
    require('http').get({ host: 'localhost', port: PORT, path: '/login.html', timeout: 500 }, res => { res.resume(); resolve(res.statusCode === 200); })
      .on('error', () => resolve(false));
  });
}
async function waitForServer(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ping()) return;
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('Fixture server did not start.');
}

async function main() {
  const server = spawn('node', ['tests/fixtures/serve.js'], { cwd: ROOT, env: { ...process.env, FIXTURE_PORT: String(PORT) }, stdio: 'ignore' });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    const page = await browser.newPage();

    // login.html
    await page.goto(`${BASE}/login.html`);
    await page.getByLabel('Username').fill('wrong');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('alert').waitFor();
    await page.getByLabel('Username').fill('tester');
    await page.getByLabel('Password').fill('Test123!');
    await page.getByRole('button', { name: 'Login' }).click();
    if (!(await page.getByText('Login successful').isVisible())) throw new Error('FAIL login.html: success text not shown');

    // search.html
    await page.goto(`${BASE}/search.html`);
    await page.getByLabel('Search').fill('an');
    const count = await page.locator('#count').textContent();
    if (!/1 result/.test(count)) throw new Error(`FAIL search.html: expected 1 result for "an" (Banana only), got "${count}"`);

    // form.html
    await page.goto(`${BASE}/form.html`);
    await page.getByLabel('Full Name').fill('A Tester');
    await page.getByLabel('Subscribe to newsletter').check();
    await page.getByLabel('Email').check();
    await page.getByLabel('Start Date').fill('2026-01-01');
    await page.getByRole('button', { name: 'Submit' }).click();
    if (!(await page.getByText('Form submitted.').isVisible())) throw new Error('FAIL form.html: confirmation not shown');

    // table.html — pagination + delete-confirm modal
    await page.goto(`${BASE}/table.html`);
    if (!/Page 1 of 3/.test(await page.locator('#page-indicator').textContent())) throw new Error('FAIL table.html: pagination did not start on page 1 of 3');
    await page.getByRole('button', { name: 'Next' }).click();
    if (!/Page 2 of 3/.test(await page.locator('#page-indicator').textContent())) throw new Error('FAIL table.html: Next did not advance page');
    await page.locator('.delete-btn').first().click();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();
    if (!(await page.locator('#status').textContent()).includes('Deleted')) throw new Error('FAIL table.html: delete confirm did not remove row');

    // wizard.html
    await page.goto(`${BASE}/wizard.html`);
    await page.getByLabel('Name').fill('Wiz Ard');
    await page.locator('#step-1 .next-btn').click();
    await page.getByLabel('Email').fill('wiz@example.com');
    await page.locator('#step-2 .next-btn').click();
    if (!(await page.locator('#review-name').textContent()) === 'Wiz Ard') throw new Error('FAIL wizard.html: review step lost entered name');
    await page.getByRole('button', { name: 'Submit' }).click();
    if (!(await page.getByText('Wizard complete.').isVisible())) throw new Error('FAIL wizard.html: completion not shown');

    // iframe.html — frameLocator chain
    await page.goto(`${BASE}/iframe.html`);
    const frame = page.frameLocator('#legacy-frame');
    await frame.getByLabel('Comment').fill('hello');
    await frame.getByRole('button', { name: 'Post Comment' }).click();
    if (!(await frame.getByText('Comment posted.').isVisible())) throw new Error('FAIL iframe.html: inner form did not submit');

    // slow.html — spinner then content after ~2s, no blank/premature screenshot state
    await page.goto(`${BASE}/slow.html`);
    if (!(await page.locator('#spinner').isVisible())) throw new Error('FAIL slow.html: spinner not shown immediately');
    if (await page.locator('#content').isVisible()) throw new Error('FAIL slow.html: content rendered before the delay');
    await page.locator('#content').waitFor({ timeout: 4000 });

    console.log('PASS: fixtures_smoke_test — all 8 fixture pages serve and behave');
  } finally {
    if (browser) await browser.close();
    server.kill('SIGKILL');
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
