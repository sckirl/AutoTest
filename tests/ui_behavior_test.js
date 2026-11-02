// Prove-It: A0.7.3/4/5/7/8/9 — studio-ui.html defects from doubt-driven cycle 4.
// Self-contained: spawns its own server, drives the real page with Playwright (already a
// project dependency), stubs specific fetches with page.route rather than a fake DOM.
const { chromium } = require('playwright');
const { startStudio } = require('./run_all');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

async function main() {
  let studio;
  let browser = null;
  try {
    studio = await startStudio();
    const BASE = `http://127.0.0.1:${studio.port}`;
    // A0.8.9: browser launch inside try/finally so server is killed even if launch throws
    browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('dialog', d => d.accept()); // handleFile's confirm()
    await page.goto(BASE + '/');

    // --- A0.7.3: dropping onto the drop zone must not trigger default browser navigation ---
    const dropPrevented = await page.evaluate(() => {
      const zone = document.getElementById('drop-zone');
      const dt = new DataTransfer();
      const over = new DragEvent('dragover', { dataTransfer: dt, cancelable: true });
      zone.dispatchEvent(over);
      const drop = new DragEvent('drop', { dataTransfer: dt, cancelable: true });
      zone.dispatchEvent(drop);
      return { overPrevented: over.defaultPrevented, dropPrevented: drop.defaultPrevented };
    });
    check('T-UI1 dragover on drop zone is prevented (drop zone accepts it)', dropPrevented.overPrevented === true);
    check('T-UI2 drop on drop zone is prevented (no default navigation)', dropPrevented.dropPrevented === true);
    check('T-UI3 page did not navigate away', page.url() === BASE + '/');

    // --- A0.7.4: an upload failure must render a visible status, not silence ---
    await page.route('**/upload', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'disk full' }) }));
    await page.evaluate(() => {
      const file = new File(['x'], 'bad.xlsx', { type: 'application/octet-stream' });
      window.handleFile(file);
    });
    await page.waitForFunction(() => document.getElementById('status-box').style.display === 'block');
    const uploadStatus = await page.evaluate(() => ({
      text: document.getElementById('status-box').innerText,
      cls: document.getElementById('status-box').className,
      // style.display === 'block' only checks the element's OWN inline style — a parent tab
      // pane with display:none (the actual A0.7.4/5 follow-up bug) still hides it on screen.
      actuallyVisible: document.getElementById('status-box').offsetParent !== null
    }));
    check('T-UI4 failed upload renders an error status, not silence', uploadStatus.cls === 'status-error' && /disk full/.test(uploadStatus.text));
    check('T-UI4b the status is actually on-screen, not hidden by a parent tab pane', uploadStatus.actuallyVisible === true);
    await page.unroute('**/upload');

    // --- A0.7.5: Execute must not proceed on a Data Matrix save that failed ---
    await page.route('**/data-matrix', route => route.request().method() === 'POST'
      ? route.fulfill({ status: 500, body: JSON.stringify({ error: 'write failed' }) })
      : route.continue());
    let runWasCalled = false;
    await page.route('**/run', route => { runWasCalled = true; route.fulfill({ status: 200, body: '{}' }); });
    await page.evaluate(() => document.getElementById('run-btn').onclick());
    await page.waitForFunction(() => document.getElementById('run-btn').disabled === false);
    check('T-UI5 a failed Data Matrix save blocks Execute (never calls /run)', runWasCalled === false);
    const saveFailStatus = await page.evaluate(() => ({
      cls: document.getElementById('status-box').className,
      actuallyVisible: document.getElementById('status-box').offsetParent !== null
    }));
    check('T-UI6 the blocked run surfaces an error status', saveFailStatus.cls === 'status-error');
    check('T-UI6b that status is actually on-screen regardless of which tab is active', saveFailStatus.actuallyVisible === true);
    await page.unroute('**/data-matrix');
    await page.unroute('**/run');

    // --- A0.7.7: a failing run must render as an error state, not the neutral info style ---
    await page.route('**/run-status', route => route.fulfill({ status: 200, body: JSON.stringify({ phase: 'failed', error: 'step threw', message: 'Run failed' }) }));
    await page.evaluate(() => window.pollRunStatus());
    await page.waitForFunction(() => document.getElementById('status-box').className === 'status-error', { timeout: 3000 });
    check('T-UI7 a failing run renders status-error, not the default info style', true);
    await page.unroute('**/run-status');

    // --- A0.7.8: repeated tab switches must not accumulate concurrent pollers ---
    let statusHits = 0;
    await page.route('**/run-status', route => { statusHits++; route.fulfill({ status: 200, body: JSON.stringify({ phase: 'running' }) }); });
    for (let i = 0; i < 5; i++) await page.evaluate(() => window.switchTab('execution'));
    statusHits = 0; // reset after the 5 switches settle; measure the steady-state rate only
    await new Promise(r => setTimeout(r, 3300));
    check('T-UI8 5 tab switches leave exactly one active poller (~2 hits/3.3s, not ~10)', statusHits <= 3, statusHits);
    await page.unroute('**/run-status');

    // --- A0.7.9: an error message containing markup must render as literal text ---
    await page.route('**/preview/**', route => route.fulfill({ status: 200, body: JSON.stringify({ code: '' }) }));
    await page.route('**/record', route => route.fulfill({ status: 500, body: JSON.stringify({ error: '<img src=x onerror=alert(1)>' }) }));
    await page.evaluate(() => window.openRecordModal('Some Label', 'SCEN1'));
    await page.waitForFunction(() => document.getElementById('record-guide-banner').textContent.includes('onerror'));
    const banner = await page.evaluate(() => ({
      hasImgTag: !!document.getElementById('record-guide-banner').querySelector('img'),
      text: document.getElementById('record-guide-banner').textContent
    }));
    check('T-UI9 error banner renders markup as literal text, not an injected element', banner.hasImgTag === false && banner.text.includes('<img'));

  } finally {
    if (browser) await browser.close().catch(() => {});
    if (studio) await studio.stop();
  }

  console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
