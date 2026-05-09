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

    let ready = false;
    server.stdout.on('data', (d) => { if (String(d).includes(`Studio Live on ${PORT}`)) ready = true; });

    for (let i = 0; i < 50 && !ready; i++) await wait(200);
    if (!ready) throw new Error('SIT Server failed to boot.');

    console.log("1. Verifying Atomic Concurrency Guard...");
    const r1 = request('/run', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workers:1}) });
    const r2 = request('/run', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workers:1}) });
    const [res1, res2] = await Promise.all([r1, r2]);
    const concurrencyPassed = (res1.status === 200 && res2.status === 409) || (res1.status === 409 && res2.status === 200);
    console.log(concurrencyPassed ? "✅ Concurrency Guard Active" : "❌ Concurrency Guard Failed");

    console.log("2. Verifying RCE Sanitization...");
    const rcePayload = 'getByRole("button") ? global.constructor.constructor("console.log(\'FAIL\')")() : getByRole("button")';
    const rceRes = await request('/save-mapping', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ label: 'RCE_TEST', code: `await page.${rcePayload}.click();` })
    });
    console.log(rceRes.status === 400 ? "✅ RCE Payload Blocked" : "❌ RCE Payload Accepted");

    console.log("3. Verifying End-to-End Completion (DEF-048)...");
    // We poll until idle or failure
    let finished = false;
    for(let i=0; i<30; i++) {
        const status = await request('/run-status');
        console.log(`   Phase: ${status.data.phase}`);
        if (['completed', 'failed', 'cancelled'].includes(status.data.phase)) { finished = true; break; }
        await wait(2000);
    }
    console.log(finished ? "✅ Execution Lifecycle Verified" : "❌ Execution Timed Out/Hanged");

    server.kill('SIGTERM');
    console.log("--- SIT COMPLETE ---");
    process.exit((concurrencyPassed && rceRes.status === 400 && finished) ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
