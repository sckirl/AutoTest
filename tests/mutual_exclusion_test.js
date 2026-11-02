// Prove-It: A0.6.7 — /record's guard only checked activeCodegen, /run's only checked
// activeRun. A live recording session and a live test run could start concurrently and
// race on the same target app's state. Self-contained: spawns its own server so it isn't
// coupled to whatever state earlier suite files left blueprint.json/mappings.json in.
const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { startStudio } = require('./run_all');

let PORT;

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: PORT, path: urlPath, method,
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

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

async function main() {
  let studio;
  try {
    studio = await startStudio();
    PORT = studio.port;
  } catch (error) {
    console.error('FATAL:', error);
    process.exit(1);
  }

  const mappingsPath = path.join(studio.env.AUTOTEST_STATE_DIR, 'mappings.json');
  const excelPath = path.join(studio.env.AUTOTEST_DATA_DIR, 'scenario_uploaded.xlsx');
  try {
    // A minimal, guaranteed-compilable, fully-mapped scenario — no {key} placeholders, so this
    // run's compile step can never fail for reasons unrelated to this test. /run always
    // regenerates blueprint.json from scenario_uploaded.xlsx first, so that's what to write.
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['MUTEX_SELFCHECK', 'Self-check', ''],
      ['1', 'Noop Click', ''],
    ]));
    XLSX.writeFile(wb, excelPath);
    fs.writeFileSync(mappingsPath, JSON.stringify({
      'Noop Click': { steps: [{ type: 'click', target: "getByRole('button', { name: 'Nonexistent' })" }] }
    }, null, 2));

    let r = await req('POST', '/run', { workers: 1, headless: true, platform: 'web' });
    check('T-mutex-1 /run accepted (starts compiling/running)', r.status === 200);

    r = await req('POST', '/record', { label: 'x', url: 'http://localhost/', scenarioId: 'x' });
    check('T-mutex-2 /record rejected while a run is in progress (409)', r.status === 409);

    await req('POST', '/run-cancel', {});

    // A0.5.4 follow-up: /run's error response should carry the compiler's real reason,
    // not execSync's generic "Command failed: node core/compiler.js".
    fs.writeFileSync(mappingsPath, JSON.stringify({
      'Noop Click': { steps: [{ type: 'fill', target: "getByRole('textbox')", value: '{missing_key}' }] }
    }, null, 2));
    r = await req('POST', '/run', { workers: 1, headless: true, platform: 'web' });
    check('T-mutex-3 /run reports failure for an unresolved Data key', r.status === 500);
    check('T-mutex-4 error names the specific missing key, not a generic "Command failed"', JSON.parse(r.body).error.includes('missing_key'));
  } finally {
    await studio.stop();
  }
  console.log(`\n--- Score: ${pass}/${pass + fail} PASSED ---`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
