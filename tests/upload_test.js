// Real HTTP upload regression using an owned temporary Studio; no user project is modified.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { startStudio } = require('./run_all');

function workbook(rows) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows));
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
}

async function main() {
  const studio = await startStudio();
  const base = `http://127.0.0.1:${studio.port}`;
  const request = async (route, options = {}) => {
    const response = await fetch(base + route, { ...options, signal: AbortSignal.timeout(10000) });
    return { status: response.status, body: await response.json() };
  };
  const upload = (bytes, keepMappings) => {
    const body = new FormData();
    if (bytes) body.append('excel', new Blob([bytes]), 'upload.xlsx');
    if (keepMappings !== undefined) body.append('keepMappings', keepMappings);
    return request('/upload', { method: 'POST', body });
  };
  const post = (route, data) => request(route, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  const state = studio.env.AUTOTEST_STATE_DIR;
  const data = studio.env.AUTOTEST_DATA_DIR;
  const activeFiles = [path.join(data, 'scenario_uploaded.xlsx'),
    ...['blueprint.json', 'mappings.json', 'runtime_data.json'].map(f => path.join(state, f))];
  const snapshot = () => activeFiles.map(file => fs.existsSync(file) ? fs.readFileSync(file).toString('base64') : null);
  try {
    const valid = workbook([
      ['Scenario Number', 'Scenario Name', 'Test Data'],
      ['UPLOAD_A', 'First scenario', ''], ['1', 'Open form', ''], ['2', 'Enter name', 'name=fixture'],
      ['UPLOAD_B', 'Second scenario', ''], ['1', 'Verify result', '']
    ]);
    const uploaded = await upload(valid);
    assert.strictEqual(uploaded.status, 200, `valid upload failed: ${JSON.stringify(uploaded)}`);
    assert.deepStrictEqual(uploaded.body, { message: 'Uploaded.', warnings: [] });
    assert.deepStrictEqual(fs.readFileSync(activeFiles[0]), valid, 'active workbook must match uploaded bytes');
    const scan = await request('/scan');
    assert.strictEqual(scan.status, 200);
    assert.deepStrictEqual(scan.body.scenarios, ['UPLOAD_A', 'UPLOAD_B']);
    assert.strictEqual(scan.body.steps.length, 3, 'scan must contain every uploaded step');
    console.log('PASS UP-P-01 / SCAN-P-01: valid workbook persists with two scenarios and three steps');

    assert.strictEqual((await post('/save-mapping', { label: 'Open form', code: "await page.goto('http://127.0.0.1/');" })).status, 200);
    assert.strictEqual((await post('/data-matrix', { UPLOAD_A: [{ name: 'fixture' }] })).status, 200);
    const beforeInvalid = snapshot();
    const invalid = await upload(workbook([['Wrong', 'Headers']]));
    assert.strictEqual(invalid.status, 400);
    assert.match(invalid.body.error, /required columns/i, 'response must name actual workbook validation failure');
    assert.deepStrictEqual(snapshot(), beforeInvalid, 'malformed upload must preserve the active project');
    const missing = await upload(null);
    assert.strictEqual(missing.status, 400);
    assert.strictEqual(missing.body.error, 'No file uploaded.');
    assert.deepStrictEqual(snapshot(), beforeInvalid, 'missing upload must preserve the active project');
    assert.ok(!fs.readdirSync(data).some(f => f.startsWith('scenario_upload_staging_')), 'staging files must be removed');
    console.log('PASS UP-E-01 / UP-N-02: malformed and missing uploads preserve active workbook, blueprint, mappings and data');

    const savedMapping = fs.readFileSync(path.join(state, 'mappings.json'), 'utf8');
    assert.strictEqual((await upload(valid, 'true')).status, 200);
    assert.strictEqual(fs.readFileSync(path.join(state, 'mappings.json'), 'utf8'), savedMapping);
    assert.ok(!fs.existsSync(path.join(state, 'runtime_data.json')), 'new valid workbook resets old data iterations');
    assert.strictEqual((await upload(valid, 'false')).status, 200);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(state, 'mappings.json'), 'utf8')), {});
    console.log('PASS UP-P-02 / UP-P-03: explicit retain/reset mapping choices honored');
  } finally {
    await studio.stop();
  }
  assert.ok(!fs.existsSync(studio.root), 'temporary project removed after owned server exits');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
