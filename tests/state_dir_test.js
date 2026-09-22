// A1.2/A1.3 (FUTURE_ARCHITECTURE.md) — port defaults to an OS-assigned free port instead of a
// hardcoded 3000, and DRIVERS_ROOT resolves under process.resourcesPath once Electron packages
// this app. Covers matrix items A-5 and A-7.
// ponytail: A1.1's full STATE_DIR/DATA_DIR/RESULTS_DIR relocation (A-1/A-2/A-3/A-4/A-6) has no
// consumer yet (no Electron shell / A2 exists in this repo) — deferred until A2 lands, add then.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { resolveDriversRoot } = require('../core/helpers');

// A-7: packaged (process.resourcesPath set by Electron) resolves DRIVERS/ next to resources
const hadResourcesPath = Object.hasOwn(process, 'resourcesPath');
const savedResourcesPath = process.resourcesPath;
process.resourcesPath = '/fake/app/resources';
assert.strictEqual(resolveDriversRoot('/fake/app/resources/app.asar/core'), path.join('/fake/app/resources', 'DRIVERS'),
    'FAIL: packaged DRIVERS_ROOT should resolve under process.resourcesPath, not the asar-relative dirname');
delete process.resourcesPath;

// A-7: dev (no process.resourcesPath) keeps today's __dirname-relative resolution
assert.strictEqual(resolveDriversRoot('/repo/core'), path.resolve('/repo/core', '../DRIVERS'),
    'FAIL: dev DRIVERS_ROOT regressed from __dirname-relative resolution');
// cross-model-found: restoring via `= undefined` defines an own property where none existed —
// distinguish "never had one" from "had one set to undefined" instead of polluting process.
if (hadResourcesPath) process.resourcesPath = savedResourcesPath; else delete process.resourcesPath;

const ROOT = path.join(__dirname, '..');
const CHILD_TIMEOUT_MS = 15000;

function spawnServer(env, stdioMode) {
    return spawn('node', ['studio/server.js'], { cwd: ROOT, env: { ...process.env, ...env }, stdio: stdioMode });
}
// cross-model-found: waiting on 'exit' with no timeout meant a regression that hangs the child
// could hang the whole suite forever.
function waitForExit(child) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`FAIL: child did not exit within ${CHILD_TIMEOUT_MS}ms — likely hung`)), CHILD_TIMEOUT_MS);
        child.on('exit', code => { clearTimeout(timer); resolve(code); });
    });
}

// A-5: PORT unset → server picks its own free port and announces it, doesn't fall back to 3000
async function testDynamicPort() {
    // cross-model-found: omit the PORT key entirely — a set-but-empty string ('') is a different
    // env state than unset, even though both are falsy to `||`.
    const { PORT, ...envWithoutPort } = process.env;
    const server = spawnServer(envWithoutPort, ['ignore', 'pipe', 'inherit']);
    try {
        let out = '';
        server.stdout.on('data', d => out += d);
        const port = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => { clearInterval(check); reject(new Error('FAIL: no STUDIO_PORT= line within 10s')); }, 10000);
            const check = setInterval(() => {
                const m = /STUDIO_PORT=(\d+)/.exec(out);
                if (m) { clearInterval(check); clearTimeout(timer); resolve(Number(m[1])); }
            }, 100);
        });
        assert.ok(port > 0, 'FAIL: announced port must be a real OS-assigned port');
    } finally {
        server.kill('SIGKILL');
    }
}

// blackbox-found: a taken PORT must fail cleanly (EADDRINUSE), not crash on a null server.address()
function waitForLine(child, regex, timeoutMs) {
    return new Promise((resolve, reject) => {
        let buf = '';
        const timer = setTimeout(() => reject(new Error(`FAIL: no ${regex} within ${timeoutMs}ms`)), timeoutMs);
        const onData = d => { buf += d; const m = regex.exec(buf); if (m) { clearTimeout(timer); child.stdout.off('data', onData); resolve(m); } };
        child.stdout.on('data', onData);
        // cross-model-found: if the child dies before ever printing the expected line, don't
        // burn the full timeout — fail fast with the real reason.
        child.on('exit', code => reject(new Error(`FAIL: child exited (code ${code}) before printing ${regex}`)));
    });
}

async function testPortCollision() {
    const first = spawnServer({ PORT: '3987' }, ['ignore', 'pipe', 'inherit']);
    try {
        await waitForLine(first, /STUDIO_PORT=/, 10000);
        const second = spawnServer({ PORT: '3987' }, ['ignore', 'ignore', 'pipe']);
        try {
            let stderr = '';
            second.stderr.on('data', d => stderr += d);
            const code = await waitForExit(second);
            assert.notStrictEqual(code, 0, 'FAIL: second instance on a taken port should exit non-zero');
            assert.ok(!/TypeError/.test(stderr), `FAIL: collision should not crash with a TypeError, got: ${stderr}`);
            assert.ok(/Failed to start server/.test(stderr), `FAIL: expected a clear startup-failure message, got: ${stderr}`);
        } finally {
            second.kill('SIGKILL');
        }
    } finally {
        first.kill('SIGKILL');
    }
}

// doubt-review-found: a non-numeric PORT must be rejected, not silently become a Unix socket path
async function testInvalidPort() {
    const child = spawnServer({ PORT: 'abc' }, ['ignore', 'ignore', 'pipe']);
    try {
        let stderr = '';
        child.stderr.on('data', d => stderr += d);
        const code = await waitForExit(child);
        assert.notStrictEqual(code, 0, 'FAIL: non-numeric PORT should exit non-zero');
        assert.ok(/Invalid PORT/.test(stderr), `FAIL: expected a clear "Invalid PORT" message, got: ${stderr}`);
        assert.ok(!fs.existsSync(path.join(ROOT, 'abc')), 'FAIL: must not create a stray socket file named after the bad PORT value');
    } finally {
        child.kill('SIGKILL');
    }
}

// cross-model-found: a numeric-but-out-of-range PORT (>65535) passed the digits-only regex and
// crashed with a raw ERR_SOCKET_BAD_PORT before the 'error' handler was even attached.
async function testOutOfRangePort() {
    const child = spawnServer({ PORT: '70000' }, ['ignore', 'ignore', 'pipe']);
    try {
        let stderr = '';
        child.stderr.on('data', d => stderr += d);
        const code = await waitForExit(child);
        assert.notStrictEqual(code, 0, 'FAIL: out-of-range PORT should exit non-zero');
        assert.ok(/Invalid PORT/.test(stderr), `FAIL: expected a clear "Invalid PORT" message, got: ${stderr}`);
        assert.ok(!/RangeError/.test(stderr), `FAIL: should not crash with a raw RangeError, got: ${stderr}`);
    } finally {
        child.kill('SIGKILL');
    }
}

Promise.resolve()
    .then(testDynamicPort)
    .then(testPortCollision)
    .then(testInvalidPort)
    .then(testOutOfRangePort)
    .then(() => console.log('PASS: state_dir_test — DRIVERS_ROOT + dynamic port + clean EADDRINUSE + PORT validation'))
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
