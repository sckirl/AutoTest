const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { execFileSync } = require('child_process');
const { startStudio } = require('./run_all');

let PORT;

function uploadExcel(fileBuffer) {
  return new Promise((resolve, reject) => {
    const boundary = '----AutoTestBoundary' + Date.now();
    const pre = `--${boundary}\r\nContent-Disposition: form-data; name="excel"; filename="upload.xlsx"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const post = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(pre), fileBuffer, Buffer.from(post)]);
    const opts = {
      hostname: '127.0.0.1', port: PORT, path: '/upload', method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length }
    };
    const r = http.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    r.write(body);
    r.end();
  });
}

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: PORT, path: urlPath, method,
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

  let studio;
  try {
    studio = await startStudio();
    PORT = studio.port;
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
  try {
    execFileSync(process.execPath, [
      path.join(__dirname, '..', 'core', 'scenario_parser.js'),
      path.join(__dirname, '..', 'practicetest_scenario.xlsx'),
    ], { stdio: 'pipe', cwd: path.join(__dirname, '..'), env: studio.env });
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

  // blackbox obs-2: /record and /run used a DENYLIST (only the literal 'mobile' rejected), so
  // platform:'appium' fell through and spawned/ran the Web path — the same silent wrong-platform
  // mapping A0.7.1 was filed against. Anything not web/mobile must be refused.
  for (const bogus of ['appium', 'ios', 'android', 'desktop']) {
    r = await req('POST', '/record', { label: 'P', url: 'http://x/', scenarioId: 'IT.1', platform: bogus });
    check(`T40 /record rejects unknown platform "${bogus}"`, r.status === 400, r.status + ' ' + r.body.slice(0, 100));
    r = await req('POST', '/run', { platform: bogus, headless: true, workers: 1 });
    check(`T40b /run rejects unknown platform "${bogus}"`, r.status === 400, r.status + ' ' + r.body.slice(0, 100));
  }

  r = await req('POST', '/save-mapping', { label: 'safe', code: 'require("child_process").exec("whoami")' });
  check('T28 require in code saved (isSafeChain blocks compile)', r.status === 200);

  // --- /run with headless flag ---
  // Don't actually run playwright (no mapped steps for current blueprint), just test the endpoint accepts headless param
  r = await req('POST', '/run', { workers: 1, headless: true, platform: 'web' });
  check('T29 POST /run headless:true accepted (200 or 500)', r.status === 200 || r.status === 500 || r.status === 409);
  // A0.6.7 (mutual exclusion between /record and /run) has its own self-contained test:
  // tests/mutual_exclusion_test.js — this suite's blueprint state is too unpredictable by here.

  // Cancel it
  r = await req('POST', '/run-cancel', {});
  check('T30 POST /run-cancel after run', r.status === 200);

  // --- Restart ---
  r = await req('POST', '/restart', {});
  check('T31 POST /restart final', r.status === 200);

  // --- A0.6.1: path traversal in GET /codegen-result/:sessionId ---
  // Run against a throwaway probe file rather than studio/server.js so a regression can never
  // delete the repository's real source code during npm test.
  const probeFile = path.join(studio.root, '_probe_target.js');
  fs.writeFileSync(probeFile, '// probe target');
  try {
    r = await req('GET', '/codegen-result/' + encodeURIComponent('../../../_probe_target'));
    check('T32 path traversal sessionId rejected 400', r.status === 400);
    check('T32b probe target file untouched on disk', fs.existsSync(probeFile));
    r = await req('GET', '/codegen-result/' + encodeURIComponent('..\\..\\_probe_target'));
    check('T32c backslash traversal sessionId rejected 400', r.status === 400);
  } finally {
    try { fs.unlinkSync(probeFile); } catch (e) {}
  }

  // --- A0.5.3: setInputFiles must be rejected at save time, not silently dropped ---
  r = await req('POST', '/save-mapping', { label: 'Upload File', code: "await page.getByLabel('Upload').setInputFiles('/tmp/x.pdf');" });
  check('T33 setInputFiles rejected, not silently dropped', r.status !== 200);
  check('T33b rejection names setInputFiles', JSON.parse(r.body).error && JSON.parse(r.body).error.includes('setInputFiles'));

  // --- A0.5.3 blackbox follow-up: case must not let a mistyped method name bypass the guard ---
  for (const variant of ['SetInputFiles', 'setinputfiles', 'SETINPUTFILES']) {
    r = await req('POST', '/save-mapping', { label: 'Upload File', code: `await page.getByLabel('Upload').${variant}('/tmp/x.pdf');` });
    check(`T33c /save-mapping rejects ${variant} (case bypass)`, r.status !== 200);
  }

  // --- A0.6.2: /upload must report real failures, not always "Uploaded." ---
  {
    const badWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(badWb, XLSX.utils.aoa_to_sheet([['Not', 'The', 'Right', 'Headers']]));
    r = await uploadExcel(XLSX.write(badWb, { type: 'buffer', bookType: 'xlsx' }));
    check('T34 malformed-header upload rejected, non-200', r.status !== 200);
    check('T34b rejection names the real reason', JSON.parse(r.body).error && /column/i.test(JSON.parse(r.body).error));

    const warnWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(warnWb, XLSX.utils.aoa_to_sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['A.1', 'Login Flow', ''],
      ['1', 'Enter Username', 'username=alice'],
      ['2', '', 'password=secret123'],
    ]));
    r = await uploadExcel(XLSX.write(warnWb, { type: 'buffer', bookType: 'xlsx' }));
    check('T35 upload with a merged-cell gap still succeeds', r.status === 200);
    check('T35b response surfaces the dropped-row warning', (JSON.parse(r.body).warnings || []).some(w => /blank|missing/i.test(w)));

    // --- A0.6.5 follow-up: GET /scan had its own independent parser with no dedup ---
    const dupWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(dupWb, XLSX.utils.aoa_to_sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['A.1', 'Login Flow', ''],
      ['1', 'Enter Username', 'username=alice'],
      ['A.1', 'Login Flow Again', ''],
      ['1', 'Enter Username', 'username=bob'],
    ]));
    r = await uploadExcel(XLSX.write(dupWb, { type: 'buffer', bookType: 'xlsx' }));
    check('T36 upload with duplicate Scenario_ID still succeeds', r.status === 200);
    r = await req('GET', '/scan');
    const scanScenarios = JSON.parse(r.body).scenarios || [];
    check('T36b GET /scan dedupes the same Scenario_ID it warned about on upload', new Set(scanScenarios).size === scanScenarios.length && scanScenarios.includes('A.1_dup2'));
  }

  // --- A0.7.1: /record must reject mobile, never silently spawn a Web codegen ---
  r = await req('POST', '/record', { label: 'Tap Button', scenarioId: 'A.1', url: 'http://x', platform: 'mobile' });
  check('T37 /record with platform:mobile is rejected, not a silent Web codegen', r.status !== 200);
  check('T37b rejection names mobile as unsupported', JSON.parse(r.body).error && /mobile/i.test(JSON.parse(r.body).error));

  // --- A0.7.1 follow-up (blackbox pass): case/whitespace variants must not bypass the guard ---
  for (const variant of ['Mobile', 'MOBILE', 'mobile ', ' Mobile']) {
    r = await req('POST', '/record', { label: 'Tap Button', scenarioId: 'A.1', url: 'http://x', platform: variant });
    check(`T38 /record rejects platform:${JSON.stringify(variant)} (case/whitespace bypass)`, r.status !== 200);
    await req('POST', '/record-cancel'); // a bypass would have spawned a real codegen session
  }

  // --- A0.5.3 follow-up: the Action Library save path has its own parser (action_db.js
  // parseCodeToSteps) that must reject setInputFiles too, not just /save-mapping's ---
  r = await req('POST', '/action-db/action', { name: 'Upload File Action', code: "await page.getByLabel('Upload').setInputFiles('/tmp/x.pdf');" });
  check('T39 Action Library save rejects setInputFiles, not a silent no-op step', r.status !== 200);
  check('T39b rejection names setInputFiles', JSON.parse(r.body).error && JSON.parse(r.body).error.includes('setInputFiles'));

  // --- blackbox follow-up: case must not let a mistyped method name bypass this guard either ---
  for (const variant of ['SetInputFiles', 'setinputfiles']) {
    r = await req('POST', '/action-db/action', { name: `Upload ${variant}`, code: `await page.getByLabel('Upload').${variant}('/tmp/x.pdf');` });
    check(`T39c Action Library rejects ${variant} (case bypass)`, r.status !== 200);
  }

  } finally {
    if (studio) await studio.stop();
  }

  console.log('\n=== AutoTest Studio API Test Suite v2 ===');
  log.forEach(l => console.log(l));
  console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
  if (fail > 0) { console.log('\nFAILED:'); log.filter(l => l.startsWith('  FAIL')).forEach(l => console.log(l)); process.exit(1); }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
