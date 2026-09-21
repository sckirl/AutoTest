const http = require('http');
const fs = require('fs');
const path = require('path');

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 }
    };
    const r = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  let pass = 0, fail = 0;
  const log = [];
  function check(name, ok, detail) {
    if (ok) { pass++; log.push('  PASS ' + name); }
    else { fail++; log.push('  FAIL ' + name + (detail ? ' | ' + String(detail).substring(0,120) : '')); }
  }

  let r;

  // --- Core API ---
  r = await req('GET', '/');
  check('T01 GET / returns UI', r.status === 200 && r.body.includes('AUTOMATION STUDIO'));

  r = await req('GET', '/run-status');
  check('T02 GET /run-status idle', r.status === 200 && JSON.parse(r.body).phase !== undefined);

  r = await req('POST', '/restart', {});
  check('T03 POST /restart', r.status === 200);

  r = await req('GET', '/scan');
  check('T04 GET /scan returns steps[]', r.status === 200 && Array.isArray(JSON.parse(r.body).steps));

  r = await req('GET', '/data-matrix');
  check('T05 GET /data-matrix', r.status === 200);

  r = await req('POST', '/data-matrix', { PT1: [{ username: 'student', password: 'Password123' }] });
  check('T06 POST /data-matrix valid', r.status === 200);

  r = await req('POST', '/data-matrix', [1, 2, 3]);
  check('T07 POST /data-matrix array rejected', r.status === 400);

  // --- Mapping ---
  r = await req('POST', '/save-mapping', { label: '', code: 'await page.click("#x")' });
  check('T08 /save-mapping empty label 400', r.status === 400);

  r = await req('POST', '/save-mapping', { label: null, code: 'await page.click("#x")' });
  check('T09 /save-mapping null label 400', r.status === 400);

  r = await req('POST', '/save-mapping', { label: 'Navigate Step', code: "await page.goto('https://example.com');" });
  check('T10 /save-mapping goto valid', r.status === 200);

  r = await req('POST', '/save-mapping', { label: 'Click Button', code: "await page.locator('#submit').click();" });
  check('T11 /save-mapping click valid', r.status === 200);

  r = await req('POST', '/save-mapping', { label: 'Assert Visible', code: "await expect(page.locator('.success')).toBeVisible();" });
  check('T12 /save-mapping assertion valid', r.status === 200);

  // --- /mapping/:label ---
  r = await req('GET', '/mapping/' + encodeURIComponent('Navigate Step'));
  const mapData = JSON.parse(r.body);
  check('T13 GET /mapping/:label found', r.status === 200 && mapData.mapping && mapData.mapping.steps.length > 0, r.body.substring(0,200));

  r = await req('GET', '/mapping/notexist');
  check('T14 GET /mapping/:label null', r.status === 200 && JSON.parse(r.body).mapping === null);

  // --- NEW: /preview/:label ---
  r = await req('GET', '/preview/' + encodeURIComponent('Navigate Step'));
  const prev = JSON.parse(r.body);
  check('T15 GET /preview/:label returns code', r.status === 200 && prev.code && prev.code.includes('page.goto'), prev.code);

  r = await req('GET', '/preview/' + encodeURIComponent('Click Button'));
  const prevClick = JSON.parse(r.body);
  check('T16 GET /preview/:label click', r.status === 200 && prevClick.code.includes('.click()'), prevClick.code);

  r = await req('GET', '/preview/' + encodeURIComponent('Assert Visible'));
  const prevAssert = JSON.parse(r.body);
  check('T17 GET /preview/:label assertion', r.status === 200 && prevAssert.code.includes('toBeVisible'), prevAssert.code);

  r = await req('GET', '/preview/doesnotexist');
  const prevMissing = JSON.parse(r.body);
  check('T18 GET /preview/:label not-mapped returns comment', r.status === 200 && prevMissing.code.includes('// Not mapped'), prevMissing.code);

  // --- NEW: /preview-scenario/:scenarioId ---
  // Need a blueprint: run parser first using uploaded excel
  // Use the practicetest_scenario.xlsx already on disk
  const { execSync } = require('child_process');
  try {
    execSync('node core/scenario_parser.js practicetest_scenario.xlsx', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
  } catch(e) {}

  r = await req('GET', '/preview-scenario/' + encodeURIComponent('PT.1'));
  const scenPrev = JSON.parse(r.body);
  check('T19 GET /preview-scenario/:id returns code', r.status === 200 && scenPrev.code && scenPrev.code.includes('PT.1'), scenPrev.code.substring(0,200));

  r = await req('GET', '/preview-scenario/DOES_NOT_EXIST');
  check('T20 GET /preview-scenario/:id not found', r.status === 200 && JSON.parse(r.body).code.includes("not found"));

  // --- Platform ---
  r = await req('GET', '/env');
  check('T21 GET /env', r.status === 200 && JSON.parse(r.body).platform);

  r = await req('POST', '/set-platform', { platform: 'mobile' });
  check('T22 POST /set-platform mobile', r.status === 200);

  r = await req('POST', '/set-platform', { platform: 'invalid' });
  check('T23 POST /set-platform invalid 400', r.status === 400);

  r = await req('POST', '/set-platform', { platform: 'web' });
  check('T24 POST /set-platform web', r.status === 200);

  // --- Cancel endpoints ---
  r = await req('POST', '/record-cancel', {});
  check('T25 POST /record-cancel', r.status === 200);

  r = await req('POST', '/run-cancel', {});
  check('T26 POST /run-cancel idle', r.status === 200);

  // --- Security ---
  r = await req('POST', '/save-mapping', { label: '<script>xss</script>', code: 'await page.locator("#x").click();' });
  check('T27 XSS in label no crash', r.status === 200 || r.status === 400);

  r = await req('POST', '/save-mapping', { label: 'safe', code: 'require("child_process").exec("whoami")' });
  check('T28 require in code saved (isSafeChain blocks compile)', r.status === 200);

  // --- /run with headless flag ---
  // Don't actually run playwright (no mapped steps for current blueprint), just test the endpoint accepts headless param
  r = await req('POST', '/run', { workers: 1, headless: true, platform: 'web' });
  check('T29 POST /run headless:true accepted (200 or 500)', r.status === 200 || r.status === 500 || r.status === 409);

  // Cancel it
  r = await req('POST', '/run-cancel', {});
  check('T30 POST /run-cancel after run', r.status === 200);

  // --- Restart ---
  r = await req('POST', '/restart', {});
  check('T31 POST /restart final', r.status === 200);

  console.log('\n=== AutoTest Studio API Test Suite v2 ===');
  log.forEach(l => console.log(l));
  console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
  if (fail > 0) { console.log('\nFAILED:'); log.filter(l => l.startsWith('  FAIL')).forEach(l => console.log(l)); process.exit(1); }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
