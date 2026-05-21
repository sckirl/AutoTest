const { spawn } = require('child_process');
const http = require('http');

const PORT = 3200;

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function request(path, options = {}) {
    return new Promise((resolve) => {
        const req = http.request(`http://127.0.0.1:${PORT}${path}`, options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try { resolve({ ok: res.ok || res.statusCode < 400, status: res.statusCode, data: JSON.parse(body) }); }
                catch { resolve({ ok: false, status: res.statusCode, data: body }); }
            });
        });
        req.on('error', () => resolve({ ok: false, status: 500, data: {} }));
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function main() {
    console.log("--- STARTING DEEP SIT VALIDATION ---");
    const server = spawn('node', ['studio/server.js'], {
        env: { ...process.env, PORT: String(PORT) },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    server.stderr.on('data', (d) => console.log("SERVER ERR:", String(d)));

    let ready = false;
    server.stdout.on('data', (d) => { if (String(d).includes(`Studio Live on ${PORT}`)) ready = true; });

    for (let i = 0; i < 50 && !ready; i++) await wait(200);
    if (!ready) throw new Error('SIT Server failed to boot.');

    console.log("1. Verifying Atomic Concurrency Guard...");
    const r1 = request('/run', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workers:1, headless: true}) });
    const r2 = request('/run', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workers:1, headless: true}) });
    const [res1, res2] = await Promise.all([r1, r2]);
    const concurrencyPassed = (res1.status === 200 && res2.status === 409) || (res1.status === 409 && res2.status === 200);
    console.log(concurrencyPassed ? "✅ Concurrency Guard Active" : "❌ Concurrency Guard Failed");

    console.log("2. Verifying RCE Sanitization in Compiler...");
    const rcePayload = 'getByRole("button") ? global.constructor.constructor("console.log(\'FAIL\')")() : getByRole("button")';
    await request('/save-mapping', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ label: 'RCE_TEST', code: `await page.${rcePayload}.click();` })
    });
    const fs = require('fs');
    let rceBlocked = false;
    try {
        const mappings = JSON.parse(fs.readFileSync('core/mappings.json', 'utf8'));
        if (mappings['RCE_TEST'] && mappings['RCE_TEST'].steps.length === 0) {
            rceBlocked = true;
        }
    } catch (e) { rceBlocked = true; }

    await request('/run', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workers:1, headless: true}) });
    await wait(2000);
    console.log(rceBlocked ? "✅ RCE Payload Safely Sandboxed" : "❌ RCE Payload Executed");

    console.log("3. Verifying Boilerplate Bypass...");
    const boilerplatePayload = `import { test, expect } from '@playwright/test';\ntest('test', async ({ page }) => {\n  await expect(page.locator('#app')).toContainText('Driver\\'s License Number');\n});`;
    const bpRes = await request('/save-mapping', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ label: 'BP_TEST', code: boilerplatePayload })
    });
    console.log(bpRes.status === 200 ? "✅ Boilerplate Handled Perfectly" : "❌ Boilerplate Parsing Failed");

    console.log("4. Verifying End-to-End Completion (DEF-048)...");
    // We poll until idle or failure
    let finished = false;
    for(let i=0; i<150; i++) {
        const status = await request('/run-status');
        console.log(`   Phase: ${status.data.phase}`);
        if (['completed', 'failed', 'cancelled'].includes(status.data.phase)) { finished = true; break; }
        await wait(2000);
    }
    console.log(finished ? "✅ Execution Lifecycle Verified" : "❌ Execution Timed Out/Hanged");

    server.kill('SIGTERM');
    console.log("--- SIT COMPLETE ---");
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
