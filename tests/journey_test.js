// A3 / A4.4 — full analyst journeys: Excel -> mapping -> compile -> execute -> evidence,
// against the offline fixture app (tests/fixtures/app), headless, no internet.
//
// ponytail: mappings are POSTed to /save-mapping directly rather than sourced from A4.2's
// golden codegen fixtures. Those goldens are a documented human-only recording step
// (FUTURE_ARCHITECTURE.md A4.2: "real codegen output, recorded by a human — never fabricated"),
// so gating every journey on them would leave the whole compile->execute->evidence path
// untested indefinitely. This covers that path now; swap the mapping source to the goldens
// once they exist and the rest of the journey assertions stay as-is.
//
// Runs its own server + fixture app on their own ports and its own STATE/DATA/RESULTS dirs,
// so it never touches the repo tree (A-2) and can't collide with the shared suite's :3000.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const XLSX = require('xlsx');

const ROOT = path.join(__dirname, '..');
const FIXTURE_PORT = Number(process.env.JOURNEY_FIXTURE_PORT || 3997);
const SERVER_PORT = Number(process.env.JOURNEY_SERVER_PORT || 3996);
const FIXTURE_BASE = `http://localhost:${FIXTURE_PORT}`;

let pass = 0, fail = 0;
const log = [];
function check(name, ok, detail) {
  if (ok) { pass++; log.push('  PASS ' + name); }
  else { fail++; log.push('  FAIL ' + name + (detail ? ' | ' + String(detail).slice(0, 200) : '')); }
}

function req(method, urlPath, body, port = SERVER_PORT) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const r = http.request({
      hostname: 'localhost', port, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function uploadExcel(buf) {
  return new Promise((resolve, reject) => {
    const boundary = '----Journey' + Date.now();
    const pre = `--${boundary}\r\nContent-Disposition: form-data; name="excel"; filename="j.xlsx"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const body = Buffer.concat([Buffer.from(pre), buf, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    const r = http.request({
      hostname: 'localhost', port: SERVER_PORT, path: '/upload', method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); });
    r.on('error', reject);
    r.write(body); r.end();
  });
}

function ping(port, urlPath) {
  return new Promise(resolve => {
    const r = http.get({ host: 'localhost', port, path: urlPath, timeout: 500 }, res => { res.resume(); resolve(res.statusCode === 200); });
    r.on('error', () => resolve(false));
    r.on('timeout', () => { r.destroy(); resolve(false); });
  });
}
async function waitFor(port, urlPath, label, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ping(port, urlPath)) return;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`${label} did not start on :${port}`);
}

function sheet(rows) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Waits for a /run to leave the running phase, returns the final status object.
async function runToCompletion(body, timeoutMs = 120000) {
  const started = await req('POST', '/run', body);
  if (started.status !== 200) return { startFailed: true, started };
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 800));
    const s = await req('GET', '/run-status');
    const st = JSON.parse(s.body);
    if (st.phase !== 'running' && st.phase !== 'compiling') return st;
  }
  throw new Error('run did not finish within timeout');
}

async function main() {
  // Same guard run_all.js uses: if a prior (killed-but-not-yet-reaped) journey server still
  // holds the port, this test would silently drive THAT server — which has a different temp
  // STATE/RESULTS dir, so every evidence assertion fails for a reason that looks like a real
  // bug. Observed once running the suite back-to-back. Fail loudly instead.
  for (const [port, label] of [[SERVER_PORT, 'studio'], [FIXTURE_PORT, 'fixture app']]) {
    if (await ping(port, port === SERVER_PORT ? '/env' : '/login.html')) {
      console.error(`Port ${port} is already in use by another ${label} server. Stop it before running this test.`);
      process.exit(1);
    }
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-journey-'));
  const RESULTS = path.join(tmp, 'results');
  const fixtureSrv = spawn('node', ['tests/fixtures/serve.js'], {
    cwd: ROOT, env: { ...process.env, FIXTURE_PORT: String(FIXTURE_PORT) }, stdio: 'ignore'
  });
  const studio = spawn('node', ['studio/server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(SERVER_PORT),
      AUTOTEST_STATE_DIR: tmp,
      AUTOTEST_DATA_DIR: tmp,
      AUTOTEST_RESULTS_DIR: RESULTS,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  studio.stderr.on('data', d => { stderr += d.toString(); });

  const gitBefore = require('child_process').execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });

  try {
    await waitFor(FIXTURE_PORT, '/login.html', 'fixture app');
    await waitFor(SERVER_PORT, '/env', 'studio server');

    // ---------- A-20: login success journey ----------
    let r = await uploadExcel(sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['J.1', 'Login Success', ''],
      ['1', 'Open Login Page', ''],
      ['2', 'Enter Username', 'username=tester'],
      ['3', 'Enter Password', 'password=Test123!'],
      ['4', 'Submit Login', ''],
      ['5', 'Verify Success', ''],
    ]));
    check('A-20a Excel upload accepted', r.status === 200, r.body);

    const maps = [
      ['Open Login Page', `await page.goto('${FIXTURE_BASE}/login.html');`],
      ['Enter Username', `await page.getByLabel('Username').fill('tester');`],
      ['Enter Password', `await page.getByLabel('Password').fill('Test123!');`],
      ['Submit Login', `await page.getByRole('button', { name: 'Login' }).click();`],
      ['Verify Success', `await expect(page.getByText('Login successful')).toBeVisible();`],
    ];
    let allSaved = true;
    for (const [label, code] of maps) {
      const s = await req('POST', '/save-mapping', { label, code });
      if (s.status !== 200) { allSaved = false; log.push(`    (save-mapping "${label}" -> ${s.status} ${s.body.slice(0,120)})`); }
    }
    check('A-20b all 5 steps mapped', allSaved);

    let st = await runToCompletion({ workers: 1, headless: true, platform: 'web' });
    check('A-20c run reached a terminal phase', !st.startFailed && st.phase === 'completed', JSON.stringify(st).slice(0, 200));
    check('A-20d run reported no error', !st.error, st.error);

    const dir20 = path.join(RESULTS, 'J_1');
    const files20 = fs.existsSync(dir20) ? fs.readdirSync(dir20) : [];
    check('A-20e evidence folder created in AUTOTEST_RESULTS_DIR (A-6)', files20.length > 0, RESULTS);
    check('A-20f per-step screenshots captured', files20.filter(f => /^STEP_\d+\.png$/.test(f)).length === 5, files20.join(','));
    check('A-20g FINAL.png captured', files20.includes('FINAL.png'), files20.join(','));
    // A-25: a screenshot of a blank page is a few hundred bytes; a rendered one is far larger.
    const nonEmpty = files20.filter(f => f.endsWith('.png')).every(f => fs.statSync(path.join(dir20, f)).size > 3000);
    check('A-25 no blank/near-empty screenshots', nonEmpty);

    // ---------- A-21: login failure, negative path asserts the error banner ----------
    r = await uploadExcel(sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['J.2', 'Login Failure', ''],
      ['1', 'Open Login Page', ''],
      ['2', 'Enter Bad Username', 'username=wrong'],
      ['3', 'Enter Bad Password', 'password=wrong'],
      ['4', 'Submit Login', ''],
      ['5', 'Verify Error Banner', ''],
    ]));
    check('A-21a upload accepted', r.status === 200, r.body);
    for (const [label, code] of [
      ['Enter Bad Username', `await page.getByLabel('Username').fill('wrong');`],
      ['Enter Bad Password', `await page.getByLabel('Password').fill('wrong');`],
      ['Verify Error Banner', `await expect(page.getByRole('alert')).toBeVisible();`],
    ]) { await req('POST', '/save-mapping', { label, code }); }

    st = await runToCompletion({ workers: 1, headless: true, platform: 'web' });
    check('A-21b negative-path run completed', !st.startFailed && st.phase === 'completed' && !st.error, JSON.stringify(st).slice(0, 2000));
    check('A-21c error-banner evidence captured', fs.existsSync(path.join(RESULTS, 'J_2', 'FINAL.png')));

    // ---------- A-22: same mapping key, two scenarios, different Data ----------
    // The tokenizeLiterals regression: a shared step must honor each scenario's own Data.
    r = await uploadExcel(sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['J.3', 'Shared Step A', ''],
      ['1', 'Open Login Page', ''],
      ['2', 'Type Username', 'username=alice'],
      ['J.4', 'Shared Step B', ''],
      ['1', 'Open Login Page', ''],
      ['2', 'Type Username', 'username=bob'],
    ]));
    check('A-22a upload accepted', r.status === 200, r.body);
    // Saved with a literal, exactly as codegen would record it under whichever scenario ran
    // first; tokenizeLiterals should rewrite it to {username} so both scenarios interpolate.
    // Recorded under J.3, whose Data is username=alice — tokenizeLiterals should rewrite the
    // baked-in literal to {username} so J.4's own Data (bob) is honored too.
    await req('POST', '/save-mapping', { label: 'Type Username', code: `await page.getByLabel('Username').fill('alice');`, scenarioId: 'J.3' });
    // The literal must have been rewritten to a {username} token at save time...
    const savedMapping = await req('GET', '/mapping/Type%20Username');
    check('A-22b recorded literal was tokenized to {username} at save time',
      /\{username\}/.test(savedMapping.body) && !/alice/.test(savedMapping.body), savedMapping.body.slice(0, 200));

    // ...and interpolate() must resolve it per-scenario at COMPILE time. /preview-scenario
    // deliberately renders the raw stored step (token and all); the compiled spec is where
    // each scenario's own Data actually lands, so that is what this asserts on.
    st = await runToCompletion({ workers: 1, headless: true, platform: 'web' });
    const spec = fs.readFileSync(path.join(tmp, 'executed.spec.ts'), 'utf8');
    const blockA = spec.slice(spec.indexOf('J.3'), spec.indexOf('J.4'));
    const blockB = spec.slice(spec.indexOf('J.4'));
    check('A-22c compiled J.3 fills alice, not bob', /alice/.test(blockA) && !/bob/.test(blockA), blockA.slice(0, 300));
    check('A-22d compiled J.4 fills bob, not the recorded literal alice', /bob/.test(blockB) && !/alice/.test(blockB), blockB.slice(0, 300));

    // ---------- A-23: Data Matrix, 3 iterations -> 3 result folders ----------
    r = await uploadExcel(sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['J.5', 'Iterated Login', ''],
      ['1', 'Open Login Page', ''],
      ['2', 'Enter Username', 'username=tester'],
    ]));
    check('A-23a upload accepted', r.status === 200, r.body);
    r = await req('POST', '/data-matrix', { 'J.5': [{ username: 'u1' }, { username: 'u2' }, { username: 'u3' }] });
    check('A-23b data matrix with 3 iterations accepted', r.status === 200, r.body);
    await req('POST', '/save-mapping', { label: 'Enter Username', code: `await page.getByLabel('Username').fill('tester');`, scenarioId: 'J.5' });

    st = await runToCompletion({ workers: 1, headless: true, platform: 'web' });
    check('A-23c iterated run completed', !st.startFailed && st.phase === 'completed', JSON.stringify(st).slice(0, 200));
    const iterDirs = fs.existsSync(RESULTS) ? fs.readdirSync(RESULTS).filter(d => /^J_5_Iter\d$/.test(d)) : [];
    check('A-23d 3 separate iteration result folders, correctly named', iterDirs.length === 3, iterDirs.join(','));

    // ---------- A-24: wizard multi-page flow keeps session state ----------
    r = await uploadExcel(sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['J.6', 'Wizard Flow', ''],
      ['1', 'Open Wizard', ''],
      ['2', 'Wizard Fill Name', 'wname=Alice'],
      ['3', 'Wizard Next One', ''],
      ['4', 'Wizard Next Two', ''],
      ['5', 'Wizard Verify Review', ''],
    ]));
    check('A-24a upload accepted', r.status === 200, r.body);
    for (const [label, code, scn] of [
      ['Open Wizard', `await page.goto('${FIXTURE_BASE}/wizard.html');`, undefined],
      ['Wizard Fill Name', `await page.getByLabel('Name').fill('Alice');`, 'J.6'],
      ['Wizard Next One', `await page.getByRole('button', { name: 'Next' }).click();`, undefined],
      ['Wizard Next Two', `await page.getByRole('button', { name: 'Next' }).click();`, undefined],
      ['Wizard Verify Review', `await expect(page.getByText('Alice')).toBeVisible();`, undefined],
    ]) { await req('POST', '/save-mapping', scn ? { label, code, scenarioId: scn } : { label, code }); }

    st = await runToCompletion({ workers: 1, headless: true, platform: 'web' });
    check('A-24b wizard run completed with state carried across steps', !st.startFailed && st.phase === 'completed' && !st.error, JSON.stringify(st).slice(0, 300));

    // ---------- A-2: the whole journey wrote nothing into the repo ----------
    const gitAfter = require('child_process').execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    check('A-2 repo tree unchanged by a full journey (all writes relocated)', gitAfter === gitBefore,
      `before:\n${gitBefore}\nafter:\n${gitAfter}`);
  } catch (e) {
    fail++;
    log.push('  FAIL harness | ' + (e && (e.stack || e.message) || String(e)));
    if (stderr) log.push('    server stderr: ' + stderr.slice(-400));
  } finally {
    studio.kill('SIGKILL');
    fixtureSrv.kill('SIGKILL');
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }

  console.log(log.join('\n'));
  console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
