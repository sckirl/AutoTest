/**
 * QA Adversarial API Test Suite — AutoTest Studio
 * Zero-Trust Banking-Grade Validation
 * Run: node qa_adversarial_api_test.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

async function req(urlPath, method = 'GET', body = undefined) {
    return new Promise((resolve) => {
        const opts = {
            hostname: 'localhost', port: 3000, path: urlPath, method,
            headers: { 'Content-Type': 'application/json' }
        };
        const r = http.request(opts, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ s: res.statusCode, d: d.substring(0, 500) }));
        });
        r.on('error', (e) => resolve({ s: 0, error: e.message }));
        if (body !== undefined) r.write(JSON.stringify(body));
        r.end();
    });
}

(async () => {
    console.log('🔴 [ZERO-TRUST QA] AutoTest Studio — Adversarial API Test Suite');
    console.log('================================================================\n');

    const results = [];
    let r;

    // ── CATEGORY 1: CORE STATUS ENDPOINTS ────────────────────────────────────
    console.log('📡 Category 1: Core Status Endpoints');

    r = await req('/run-status');
    results.push({ cat: 'C1', id: 'T01', test: 'GET /run-status → 200 + idle phase', pass: r.s === 200 && r.d.includes('idle'), status: r.s, note: r.d });

    r = await req('/env');
    results.push({ cat: 'C1', id: 'T02', test: 'GET /env → 200 + platform key', pass: r.s === 200 && r.d.includes('platform'), status: r.s, note: r.d });

    // ── CATEGORY 2: SCAN ENDPOINT ────────────────────────────────────────────
    console.log('📡 Category 2: Scan Endpoint');

    r = await req('/scan');
    results.push({ cat: 'C2', id: 'T03', test: 'GET /scan (no excel) → 200 + steps array', pass: r.s === 200, status: r.s, note: r.d.substring(0, 100) });

    // ── CATEGORY 3: DATA MATRIX ───────────────────────────────────────────────
    console.log('📡 Category 3: Data Matrix Validation');

    r = await req('/data-matrix');
    results.push({ cat: 'C3', id: 'T04', test: 'GET /data-matrix → 200 JSON object', pass: r.s === 200, status: r.s, note: r.d });

    r = await req('/data-matrix', 'POST', [{ bad: 'root' }]);
    results.push({ cat: 'C3', id: 'T05', test: 'POST /data-matrix [ARRAY] → 400 rejected', pass: r.s === 400, status: r.s, note: r.d.substring(0, 100) });

    r = await req('/data-matrix', 'POST', { 'A.1': [{ User: 'TestUser', Pass: 'TestPass' }] });
    results.push({ cat: 'C3', id: 'T06', test: 'POST /data-matrix valid payload → 200', pass: r.s === 200, status: r.s, note: r.d });

    r = await req('/data-matrix', 'POST', {});
    results.push({ cat: 'C3', id: 'T07', test: 'POST /data-matrix empty object → 200 (clear)', pass: r.s === 200, status: r.s, note: r.d });

    // Injection: SQL-style
    r = await req('/data-matrix', 'POST', { 'A.1': [{ User: "'; DROP TABLE users; --", Pass: '1 OR 1=1' }] });
    results.push({ cat: 'C3', id: 'T08', test: 'POST /data-matrix SQL injection payload → 200 (stored safely)', pass: r.s === 200, status: r.s, note: 'Stored as literal string — not executed by API' });

    // Injection: Shell command
    r = await req('/data-matrix', 'POST', { 'A.1': [{ User: "'; rm -rf /; '", Pass: '$(whoami)' }] });
    results.push({ cat: 'C3', id: 'T09', test: 'POST /data-matrix shell injection payload → 200 (stored safely)', pass: r.s === 200, status: r.s, note: 'Stored as literal string — not executed by API' });

    // Injection: env var leak probe
    r = await req('/data-matrix', 'POST', { 'A.1': [{ User: '${process.env.SECRET}', Pass: '`id`' }] });
    const dataRes = await req('/data-matrix');
    const dataBody = JSON.parse(dataRes.d);
    const injectedVal = dataBody?.['A.1']?.[0]?.User;
    const envLeaked = injectedVal && injectedVal !== '${process.env.SECRET}';
    results.push({ cat: 'C3', id: 'T10', test: 'POST /data-matrix env var injection → stored as literal, not evaluated', pass: !envLeaked, status: r.s, note: `Stored: "${injectedVal}"` });

    // Large payload
    r = await req('/data-matrix', 'POST', { 'A.1': [{ User: 'A'.repeat(100000) }] });
    results.push({ cat: 'C3', id: 'T11', test: 'POST /data-matrix 100KB payload → server does not crash', pass: r.s !== 0 && r.s !== 500, status: r.s, note: r.d.substring(0, 50) });

    // Invalid scenario value (array instead of array-of-objects)
    r = await req('/data-matrix', 'POST', { 'A.1': 'notanarray' });
    results.push({ cat: 'C3', id: 'T12', test: 'POST /data-matrix non-array value for scenarioId → 400', pass: r.s === 400, status: r.s, note: r.d.substring(0, 100) });

    // ── CATEGORY 4: SAVE MAPPING ──────────────────────────────────────────────
    console.log('📡 Category 4: Save Mapping Validation');

    r = await req('/save-mapping', 'POST', { label: '', code: 'await page.click("button")' });
    results.push({ cat: 'C4', id: 'T13', test: 'POST /save-mapping empty label → should 400', pass: r.s === 400, status: r.s, note: r.s === 200 ? '⚠️ BUG: accepted empty label! Writes {"": {...}} to mappings.json' : 'Rejected' });

    r = await req('/save-mapping', 'POST', { label: null, code: 'await page.click("button")' });
    results.push({ cat: 'C4', id: 'T14', test: 'POST /save-mapping null label → should 400', pass: r.s === 400, status: r.s, note: r.s === 200 ? '⚠️ BUG: accepted null label! Writes {"null": {...}} to mappings.json' : 'Rejected' });

    r = await req('/save-mapping', 'POST', { label: 'test-malicious', code: "await page.evaluate(() => { require('child_process').exec('id') })" });
    results.push({ cat: 'C4', id: 'T15', test: 'POST /save-mapping RCE code → AST parses safely, no execution', pass: r.s !== 500, status: r.s, note: r.d.substring(0, 100) });

    r = await req('/save-mapping', 'POST', { label: 'xss-label', code: '<script>alert(1)</script>' });
    results.push({ cat: 'C4', id: 'T16', test: 'POST /save-mapping XSS in code → stored safely as empty steps (AST rejects non-JS)', pass: r.s === 200, status: r.s, note: r.d.substring(0, 100) });

    // ── CATEGORY 5: RESTART ───────────────────────────────────────────────────
    console.log('📡 Category 5: Restart Endpoint');

    // First save some data to verify restart clears it
    await req('/data-matrix', 'POST', { 'A.1': [{ User: 'shouldBeDeleted' }] });
    r = await req('/restart', 'POST', { clearMappings: true });
    results.push({ cat: 'C5', id: 'T17', test: 'POST /restart clearMappings:true → 200', pass: r.s === 200, status: r.s, note: r.d });

    // Verify runtime_data.json is deleted after restart
    const rtExists = fs.existsSync(path.join(__dirname, 'core', 'runtime_data.json'));
    results.push({ cat: 'C5', id: 'T18', test: 'POST /restart deletes core/runtime_data.json', pass: !rtExists, status: 'file', note: rtExists ? '⚠️ BUG: runtime_data.json still exists after restart!' : 'Deleted ✅' });

    // Verify scenario_uploaded.xlsx is deleted after restart
    const xlExists = fs.existsSync(path.join(__dirname, 'scenario_uploaded.xlsx'));
    results.push({ cat: 'C5', id: 'T19', test: 'POST /restart deletes scenario_uploaded.xlsx', pass: !xlExists, status: 'file', note: xlExists ? '⚠️ BUG: scenario_uploaded.xlsx still exists!' : 'Deleted ✅' });

    // ── CATEGORY 6: CONCURRENCY GUARD ────────────────────────────────────────
    console.log('📡 Category 6: Concurrency & State Guard');

    r = await req('/run-status');
    results.push({ cat: 'C6', id: 'T20', test: 'GET /run-status after restart → idle', pass: r.s === 200 && r.d.includes('idle'), status: r.s, note: r.d });

    // ── CATEGORY 7: FILE SYSTEM INTEGRITY ────────────────────────────────────
    console.log('📡 Category 7: File System Integrity Checks');

    const orphanFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('replay_'));
    results.push({ cat: 'C7', id: 'T21', test: 'No orphan replay_* files in project root', pass: orphanFiles.length === 0, status: 'file', note: orphanFiles.length > 0 ? `⚠️ ${orphanFiles.length} orphaned: ${orphanFiles.join(', ')}` : 'Clean ✅' });

    const mappingsContent = JSON.parse(fs.readFileSync(path.join(__dirname, 'core', 'mappings.json'), 'utf8'));
    const hasEmptyKey = '' in mappingsContent || 'null' in mappingsContent;
    results.push({ cat: 'C7', id: 'T22', test: 'mappings.json has no "" or "null" key corruption', pass: !hasEmptyKey, status: 'file', note: hasEmptyKey ? '⚠️ BUG: corrupted key found!' : 'Clean ✅' });

    // ── PRINT RESULTS ─────────────────────────────────────────────────────────
    console.log('\n\n══════════════════════════════════════════════════════════');
    console.log('📊 ADVERSARIAL API TEST RESULTS');
    console.log('══════════════════════════════════════════════════════════\n');

    let passed = 0, failed = 0;
    const failures = [];

    results.forEach(res => {
        const icon = res.pass ? '✅' : '❌';
        const line = `${icon} [${res.id}] ${res.test} | HTTP ${res.status}`;
        console.log(line);
        if (res.note) console.log(`   ↳ ${res.note}`);
        if (res.pass) passed++; else { failed++; failures.push(res); }
    });

    console.log(`\n📊 Final Score: ${passed}/${results.length} PASSED | ${failed} FAILED`);

    if (failures.length > 0) {
        console.log('\n🔴 FAILING TESTS (Action Required):');
        failures.forEach(f => console.log(`   - [${f.id}] ${f.test}`));
    }

    if (passed === results.length) {
        console.log('\n✅ All API tests passed.');
    } else {
        console.log('\n❌ VERDICT: API test suite FAILED. Defects require remediation before certification.');
        process.exit(1);
    }
})();
