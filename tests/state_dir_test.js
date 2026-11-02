// A1.2/A1.3 (FUTURE_ARCHITECTURE.md) — port defaults to an OS-assigned free port instead of a
// hardcoded 3000, and DRIVERS_ROOT resolves under process.resourcesPath once Electron packages
// this app. Covers matrix items A-5 and A-7.
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
const TEST_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-state-dir-test-'));

function testEnv(overrides = {}) {
    const { PORT, ...cleanEnv } = process.env;
    const env = {
        ...cleanEnv,
        AUTOTEST_STATE_DIR: path.join(TEST_ROOT, 'state'),
        AUTOTEST_DATA_DIR: path.join(TEST_ROOT, 'data'),
        AUTOTEST_RESULTS_DIR: path.join(TEST_ROOT, 'results'),
        ...overrides,
        AUTOTEST_CDP_PROFILE: 'isolated',
        AUTOTEST_PLATFORM: 'web',
        LLM_BASE_URL: '',
        LLM_API_KEY: '',
        LLM_MODEL: '',
    };
    for (const key of ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY']) delete env[key];
    return env;
}
for (const key of ['AUTOTEST_STATE_DIR', 'AUTOTEST_DATA_DIR', 'AUTOTEST_RESULTS_DIR']) fs.mkdirSync(testEnv()[key], { recursive: true });

function spawnServer(env, stdioMode, cwd = ROOT) {
    return spawn(process.execPath, [path.join(ROOT, 'studio/server.js')], { cwd, env: testEnv(env), stdio: stdioMode });
}
// cross-model-found: waiting on 'exit' with no timeout meant a regression that hangs the child
// could hang the whole suite forever.
function waitForExit(child, timeoutMs = CHILD_TIMEOUT_MS) {
    if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(child.exitCode);
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`FAIL: child did not exit within ${timeoutMs}ms — likely hung`)), timeoutMs);
        child.once('exit', code => { clearTimeout(timer); resolve(code); });
    });
}
async function stopChild(child) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = waitForExit(child, 2000);
    child.kill('SIGTERM');
    try { await exited; }
    catch {
        child.kill('SIGKILL');
        await waitForExit(child, 2000);
    }
}

// A-5: PORT unset → server picks its own free port and announces it, doesn't fall back to 3000
async function testDynamicPort() {
    // cross-model-found: omit the PORT key entirely — a set-but-empty string ('') is a different
    // env state than unset, even though both are falsy to `||`.
    const inherited = Object.fromEntries(['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL'].map(key => [key, process.env[key]]));
    Object.assign(process.env, { LLM_BASE_URL: 'http://127.0.0.1:1/v1', LLM_API_KEY: 'synthetic-test-key', LLM_MODEL: 'synthetic-test-model' });
    const server = spawnServer({}, ['ignore', 'pipe', 'inherit']);
    try {
        const line = await waitForLine(server, /STUDIO_PORT=(\d+)/, 10000);
        const port = Number(line[1]);
        assert.ok(port > 0, 'FAIL: announced port must be a real OS-assigned port');
        const status = await fetch(`http://127.0.0.1:${port}/suggest/status`, { signal: AbortSignal.timeout(3000) });
        assert.strictEqual((await status.json()).enabled, false, 'standalone relocation tests must keep inherited provider settings disabled');
    } finally {
        await stopChild(server);
        for (const [key, value] of Object.entries(inherited)) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
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
    const first = spawnServer({ PORT: '0' }, ['ignore', 'pipe', 'inherit']);
    try {
        const ready = await waitForLine(first, /STUDIO_PORT=(\d+)/, 10000);
        const second = spawnServer({ PORT: ready[1] }, ['ignore', 'ignore', 'pipe']);
        try {
            let stderr = '';
            second.stderr.on('data', d => stderr += d);
            const code = await waitForExit(second);
            assert.notStrictEqual(code, 0, 'FAIL: second instance on a taken port should exit non-zero');
            assert.ok(!/TypeError/.test(stderr), `FAIL: collision should not crash with a TypeError, got: ${stderr}`);
            assert.ok(/Failed to start server/.test(stderr), `FAIL: expected a clear startup-failure message, got: ${stderr}`);
        } finally {
            await stopChild(second);
        }
    } finally {
        await stopChild(first);
    }
}

// doubt-review-found: a non-numeric PORT must be rejected, not silently become a Unix socket path
async function testInvalidPort() {
    const cwd = fs.mkdtempSync(path.join(TEST_ROOT, 'invalid-port-'));
    const child = spawnServer({ PORT: 'abc' }, ['ignore', 'ignore', 'pipe'], cwd);
    try {
        let stderr = '';
        child.stderr.on('data', d => stderr += d);
        const code = await waitForExit(child);
        assert.notStrictEqual(code, 0, 'FAIL: non-numeric PORT should exit non-zero');
        assert.ok(/Invalid PORT/.test(stderr), `FAIL: expected a clear "Invalid PORT" message, got: ${stderr}`);
        assert.ok(!fs.existsSync(path.join(cwd, 'abc')), 'FAIL: must not create a stray socket file named after the bad PORT value');
    } finally {
        await stopChild(child);
    }
}

// cross-model-found: a numeric-but-out-of-range PORT (>65535) passed the digits-only regex and
// crashed with a raw ERR_SOCKET_BAD_PORT before the 'error' handler was even attached.
async function testOutOfRangePort() {
    const cwd = fs.mkdtempSync(path.join(TEST_ROOT, 'out-of-range-port-'));
    const child = spawnServer({ PORT: '70000' }, ['ignore', 'ignore', 'pipe'], cwd);
    try {
        let stderr = '';
        child.stderr.on('data', d => stderr += d);
        const code = await waitForExit(child);
        assert.notStrictEqual(code, 0, 'FAIL: out-of-range PORT should exit non-zero');
        assert.ok(/Invalid PORT/.test(stderr), `FAIL: expected a clear "Invalid PORT" message, got: ${stderr}`);
        assert.ok(!/RangeError/.test(stderr), `FAIL: should not crash with a raw RangeError, got: ${stderr}`);
    } finally {
        await stopChild(child);
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
            await stopChild(server);
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
            env: testEnv({ AUTOTEST_STATE_DIR: tmpState })
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
            env: testEnv({ AUTOTEST_STATE_DIR: tmpState })
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
            env: testEnv({ AUTOTEST_STATE_DIR: tmpState, NODE_PATH: path.join(ROOT, 'node_modules') }),
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
            out = execFileSync(process.execPath, [
                path.join(__dirname, '..', 'node_modules', '@playwright', 'test', 'cli.js'),
                'test', '--config', cfgPath, '--list', '--reporter=json'
            ], {
                cwd: path.join(__dirname, '..'),
                env: testEnv({ AUTOTEST_RESULTS_DIR: tmpResults, AUTOTEST_STATE_DIR: path.join(TEST_ROOT, 'list-state') }),
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
        process.exitCode = 1;
    })
    .finally(() => {
        fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    });
