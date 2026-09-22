// A1.2/A1.3 (FUTURE_ARCHITECTURE.md) — port defaults to an OS-assigned free port instead of a
// hardcoded 3000, and DRIVERS_ROOT resolves under process.resourcesPath once Electron packages
// this app. Covers matrix items A-5 and A-7.
// ponytail: A1.1's full STATE_DIR/DATA_DIR/RESULTS_DIR relocation (A-1/A-2/A-3/A-4/A-6) has no
// consumer yet (no Electron shell / A2 exists in this repo) — deferred until A2 lands, add then.
const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');
const { resolveDriversRoot } = require('../core/helpers');

// A-7: packaged (process.resourcesPath set by Electron) resolves DRIVERS/ next to resources
const savedResourcesPath = process.resourcesPath;
process.resourcesPath = '/fake/app/resources';
assert.strictEqual(resolveDriversRoot('/fake/app/resources/app.asar/core'), path.join('/fake/app/resources', 'DRIVERS'),
    'FAIL: packaged DRIVERS_ROOT should resolve under process.resourcesPath, not the asar-relative dirname');
delete process.resourcesPath;

// A-7: dev (no process.resourcesPath) keeps today's __dirname-relative resolution
assert.strictEqual(resolveDriversRoot('/repo/core'), path.resolve('/repo/core', '../DRIVERS'),
    'FAIL: dev DRIVERS_ROOT regressed from __dirname-relative resolution');
process.resourcesPath = savedResourcesPath;

// A-5: PORT unset → server picks its own free port and announces it, doesn't fall back to 3000
async function testDynamicPort() {
    const server = spawn('node', ['studio/server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: '' },
        stdio: ['ignore', 'pipe', 'inherit'],
    });
    let out = '';
    server.stdout.on('data', d => out += d);
    try {
        const port = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('FAIL: no STUDIO_PORT= line within 10s')), 10000);
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
        const onData = d => {
            buf += d;
            const m = regex.exec(buf);
            if (m) { clearTimeout(timer); child.stdout.off('data', onData); resolve(m); }
        };
        child.stdout.on('data', onData);
    });
}

async function testPortCollision() {
    const first = spawn('node', ['studio/server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: '3987' },
        stdio: ['ignore', 'pipe', 'inherit'],
    });
    try {
        await waitForLine(first, /STUDIO_PORT=/, 10000);
        const second = spawn('node', ['studio/server.js'], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, PORT: '3987' },
            stdio: ['ignore', 'ignore', 'pipe'],
        });
        let stderr = '';
        second.stderr.on('data', d => stderr += d);
        const code = await new Promise(resolve => second.on('exit', resolve));
        assert.notStrictEqual(code, 0, 'FAIL: second instance on a taken port should exit non-zero');
        assert.ok(!/TypeError/.test(stderr), `FAIL: collision should not crash with a TypeError, got: ${stderr}`);
        assert.ok(/Failed to start server/.test(stderr), `FAIL: expected a clear startup-failure message, got: ${stderr}`);
    } finally {
        first.kill('SIGKILL');
    }
}

Promise.resolve()
    .then(testDynamicPort)
    .then(testPortCollision)
    .then(() => console.log('PASS: state_dir_test — DRIVERS_ROOT + dynamic port + clean EADDRINUSE'))
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
