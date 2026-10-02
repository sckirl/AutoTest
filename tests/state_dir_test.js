// A1.2/A1.3 (FUTURE_ARCHITECTURE.md) — port defaults to an OS-assigned free port instead of a
// hardcoded 3000, and DRIVERS_ROOT resolves under process.resourcesPath once Electron packages
// this app. Covers matrix items A-5 and A-7.
// ponytail: A1.1's full STATE_DIR/DATA_DIR/RESULTS_DIR relocation (A-1/A-2/A-3/A-4/A-6) has no
// consumer yet (no Electron shell / A2 exists in this repo) — deferred until A2 lands, add then.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');
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

// A1.3 known-gap fix: RESOURCES_PATH env is how electron/main.js bridges resourcesPath into
// the execSync'd scenario_parser.js/compiler.js children, which never see the real property.
const hadEnvResourcesPath = Object.hasOwn(process.env, 'RESOURCES_PATH');
const savedEnvResourcesPath = process.env.RESOURCES_PATH;
process.env.RESOURCES_PATH = '/fake/app/resources';
assert.strictEqual(resolveDriversRoot('/fake/app/resources/app.asar/core'), path.join('/fake/app/resources', 'DRIVERS'),
    'FAIL: RESOURCES_PATH env fallback should resolve DRIVERS_ROOT the same way the native property does');
if (hadEnvResourcesPath) process.env.RESOURCES_PATH = savedEnvResourcesPath; else delete process.env.RESOURCES_PATH;

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

// A-2: AUTOTEST_STATE_DIR must actually relocate writes (mappings.json seeded on startup),
// not just resolve as a path — this is what makes a packaged (read-only app dir) Electron
// build able to run at all.
async function testStateDirRelocation() {
    const tmpState = fs.mkdtempSync(path.join(require('os').tmpdir(), 'autotest-state-'));
    try {
        const server = spawnServer({ AUTOTEST_STATE_DIR: tmpState }, ['ignore', 'pipe', 'inherit']);
        try {
            await waitForLine(server, /STUDIO_PORT=/, 10000);
            await new Promise(r => setTimeout(r, 300)); // let the 'listening' handler's mappings.json seed run
            assert.ok(fs.existsSync(path.join(tmpState, 'mappings.json')),
                "FAIL: AUTOTEST_STATE_DIR should receive mappings.json on startup, not the app's own core/");
        } finally {
            server.kill('SIGKILL');
        }
    } finally {
        fs.rmSync(tmpState, { recursive: true, force: true });
    }
}

// A-2/A1.3-analog: core/scenario_parser.js and core/compiler.js run as separate `node
// core/*.js` processes (server.js's execSync calls) — __dirname alone (their own location,
// always inside the app dir) isn't enough; they must also honor AUTOTEST_STATE_DIR.
function testCompilerRespectsStateDir() {
    const tmpState = fs.mkdtempSync(path.join(require('os').tmpdir(), 'autotest-state2-'));
    try {
        const { execFileSync } = require('child_process');
        fs.writeFileSync(path.join(tmpState, 'blueprint.json'), JSON.stringify([
            { Scenario_ID: 'RELOC_TEST', Role: 'r', Flow: [{ Mapping_Key: 'Click X', Data: {} }] }
        ], null, 2));
        fs.writeFileSync(path.join(tmpState, 'mappings.json'), JSON.stringify({
            'Click X': { steps: [{ type: 'click', target: "getByRole('button', { name: 'X' })" }] }
        }, null, 2));
        execFileSync(process.execPath, [path.join(ROOT, 'core/compiler.js')], {
            cwd: ROOT,
            env: { ...process.env, AUTOTEST_STATE_DIR: tmpState }
        });
        assert.ok(fs.existsSync(path.join(tmpState, 'executed.spec.ts')),
            'FAIL: compiler.js should write executed.spec.ts under AUTOTEST_STATE_DIR, not core/');
    } finally {
        fs.rmSync(tmpState, { recursive: true, force: true });
    }
}

// A-6: the compiled spec must resolve evidence via AUTOTEST_RESULTS_DIR at runtime, not a
// process.cwd()-relative 'results' folder — cwd under Electron's fork() is wherever main.js
// chose, not a folder the compiled spec should be guessing about.
function testGeneratedSpecUsesResultsDirEnv() {
    const tmpState = fs.mkdtempSync(path.join(require('os').tmpdir(), 'autotest-state3-'));
    try {
        const { execFileSync } = require('child_process');
        fs.writeFileSync(path.join(tmpState, 'blueprint.json'), JSON.stringify([
            { Scenario_ID: 'RD', Role: 'r', Flow: [{ Mapping_Key: 'Click X', Data: {} }] }
        ], null, 2));
        fs.writeFileSync(path.join(tmpState, 'mappings.json'), JSON.stringify({
            'Click X': { steps: [{ type: 'click', target: "getByRole('button', { name: 'X' })" }] }
        }, null, 2));
        execFileSync(process.execPath, [path.join(ROOT, 'core/compiler.js')], {
            cwd: ROOT,
            env: { ...process.env, AUTOTEST_STATE_DIR: tmpState }
        });
        const generated = fs.readFileSync(path.join(tmpState, 'executed.spec.ts'), 'utf8');
        assert.ok(/AUTOTEST_RESULTS_DIR/.test(generated),
            'FAIL: generated spec must resolve resultsDir from AUTOTEST_RESULTS_DIR, not process.cwd() alone');
    } finally {
        fs.rmSync(tmpState, { recursive: true, force: true });
    }
}

// doubt-review-found: playwright.config.ts's testDir was hardcoded to './core' — a relocated
// executed.spec.ts (AUTOTEST_STATE_DIR set) was physically outside testDir, so Playwright
// reported "No tests found" instead of running it. testDir must track the same env var.
function testRelocatedSpecIsDiscoveredByPlaywright() {
    const tmpState = fs.mkdtempSync(path.join(require('os').tmpdir(), 'autotest-state4-'));
    try {
        const { execFileSync } = require('child_process');
        fs.writeFileSync(path.join(tmpState, 'executed.spec.ts'), `
import { test, expect } from '@playwright/test';
test('relocated spec runs', async () => { expect(1 + 1).toBe(2); });
`);
        const out = execFileSync(process.execPath, [
            path.join(ROOT, 'node_modules/@playwright/test/cli.js'), 'test',
            '--config', path.join(ROOT, 'playwright.config.ts'),
            'executed.spec.ts', '--reporter=list'
        ], {
            cwd: ROOT,
            // NODE_PATH: matches the fix in studio/server.js's runner spawn — a relocated spec
            // can't otherwise resolve `@playwright/test` by walking up from its own directory.
            env: { ...process.env, AUTOTEST_STATE_DIR: tmpState, NODE_PATH: path.join(ROOT, 'node_modules') },
        }).toString();
        assert.ok(!/No tests found/i.test(out),
            'FAIL: a spec relocated via AUTOTEST_STATE_DIR must be found by Playwright, not reported missing');
        assert.ok(/1 passed/.test(out), `FAIL: expected the relocated spec to actually run and pass, got:\n${out}`);
    } finally {
        fs.rmSync(tmpState, { recursive: true, force: true });
    }
}

// A-3 (found by the blackbox relocatability pass): testDir tracked AUTOTEST_STATE_DIR but
// outputDir did not, so Playwright resolved its scratch dir to <app dir>/test-results and
// rmdir'd it at startup — EACCES on a read-only install, before a single step ran. Every other
// write site was relocated; this was the one left, and it is the one that fails first. Asserting
// on the resolved config is enough and needs no chmod: if outputDir points inside the app dir
// again, a read-only install is broken whether or not this machine can simulate one.
function testOutputDirFollowsResultsDir() {
    const cfgPath = path.join(__dirname, '..', 'playwright.config.ts');
    const tmpResults = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-outdir-'));
    try {
        // --list exits 1 when it finds no spec (core/ often has none), but still prints the
        // resolved config on stdout — which is the only thing this asserts on. Read stdout from
        // the error object in that case rather than treating "no tests" as a failure.
        let out;
        try {
            out = execFileSync('node', [
                path.join(__dirname, '..', 'node_modules', '@playwright', 'test', 'cli.js'),
                'test', '--config', cfgPath, '--list', '--reporter=json'
            ], {
                cwd: path.join(__dirname, '..'),
                env: { ...process.env, AUTOTEST_RESULTS_DIR: tmpResults, AUTOTEST_STATE_DIR: path.join(__dirname, '..', 'core') },
                encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
            });
        } catch (e) {
            out = e.stdout;
        }
        assert.ok(out && out.trim().startsWith('{'), `FAIL A-3: could not read Playwright's resolved config:\n${out}`);
        const cfg = JSON.parse(out).config;
        const outputDir = cfg.projects[0].outputDir;
        assert.ok(fs.realpathSync(path.dirname(outputDir)) === fs.realpathSync(tmpResults),
            `FAIL A-3: Playwright outputDir must live under AUTOTEST_RESULTS_DIR (a read-only install can't be written to), got: ${outputDir}`);
    } finally {
        fs.rmSync(tmpResults, { recursive: true, force: true });
    }
}

Promise.resolve()
    .then(testOutputDirFollowsResultsDir)
    .then(testDynamicPort)
    .then(testPortCollision)
    .then(testInvalidPort)
    .then(testOutOfRangePort)
    .then(testStateDirRelocation)
    .then(testCompilerRespectsStateDir)
    .then(testGeneratedSpecUsesResultsDirEnv)
    .then(testRelocatedSpecIsDiscoveredByPlaywright)
    .then(() => console.log('PASS: state_dir_test — DRIVERS_ROOT + dynamic port + clean EADDRINUSE + PORT validation + A1.1 relocation'))
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
