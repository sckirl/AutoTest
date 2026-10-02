// PHASE B — CDP-attach recording.
//
// ponytail / SECURITY TRADEOFF, deliberate and user-confirmed (FUTURE_ARCHITECTURE.md §B8):
// AutoTest recording uses its own stable-Chrome profile by default. The profile is named
// `autotest` and lives under the relocated writable state directory, so the user's normal
// Chrome profile, SSO session, history, and other tabs are never touched. The explicit
// AUTOTEST_CDP_PROFILE=real opt-out remains for controlled developer diagnostics only.
// Recorded mappings still capture only locators and typed values; there is no profile reset
// or deletion operation in the app.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const { loadRuntimeEnv } = require('./runtime_env');
const { ensureDriversPath, isSafeChain, interpolate } = require('./helpers');

loadRuntimeEnv();

ensureDriversPath(module, __dirname);
const { chromium } = require('playwright-core');

// Fixed default: 9222 is devtools' conventional port and very likely already taken by a Chrome
// the tester opened themselves, which would mean silently attaching to the wrong browser.
const CDP_PORT = Number(process.env.CDP_DEBUG_PORT || 9333);

let cachedBrowser = null;
let cachedContext = null;
let cachedPage = null;

function err(code, message) {
    const e = new Error(message);
    e.code = code;
    return e;
}

/** Windows-first (the stated target), then mac/linux. Same candidate-list shape as getBundledBrowserPath(). */
function resolveSystemChromePath() {
    if (process.env.AUTOTEST_CHROME_PATH) {
        try {
            if (fs.statSync(process.env.AUTOTEST_CHROME_PATH).isFile()) return process.env.AUTOTEST_CHROME_PATH;
        } catch (e) {}
        throw err('CHROME_PATH_INVALID', `AUTOTEST_CHROME_PATH does not point to a file: ${process.env.AUTOTEST_CHROME_PATH}`);
    }
    const candidates = process.platform === 'win32' ? [
        path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['LOCALAPPDATA'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ] : process.platform === 'darwin' ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        path.join(process.env.HOME || '', 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ] : [
        '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome',
    ];
    return candidates.find(p => p && fs.existsSync(p)) || null;
}

// A dedicated profile is the safe default in both direct-server and Electron modes. Set
// AUTOTEST_CDP_PROFILE=real only for an intentional developer-only opt-out.
function isIsolatedProfile() {
    return String(process.env.AUTOTEST_CDP_PROFILE || 'isolated').trim().toLowerCase() !== 'real';
}

/**
 * The isolated profile is named `autotest` and lives beside relocated state, so it is writable
 * in packaged installs and never overlaps the user's normal Chrome profile. The real profile is
 * available only through the explicit AUTOTEST_CDP_PROFILE=real developer opt-out.
 */
function resolveRealProfileDir() {
    if (isIsolatedProfile()) {
        const base = process.env.AUTOTEST_STATE_DIR || __dirname;
        return path.join(base, 'autotest');
    }
    if (process.platform === 'win32') return path.join(process.env['LOCALAPPDATA'] || '', 'Google\\Chrome\\User Data');
    if (process.platform === 'darwin') return path.join(process.env.HOME || '', 'Library/Application Support/Google/Chrome');
    return path.join(process.env.HOME || '', '.config/google-chrome');
}

/** True if a Chrome process is already running (proactive half of the §B2 lock check). */
function isChromeRunning() {
    try {
        if (process.platform === 'win32') {
            return /chrome\.exe/i.test(execSync('tasklist /FI "IMAGENAME eq chrome.exe" /NH', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
        }
        execSync(process.platform === 'darwin' ? 'pgrep -x "Google Chrome"' : 'pgrep -x chrome', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false; // pgrep/tasklist exits non-zero when nothing matches
    }
}

function probeCdp(port, timeoutMs = 500) {
    return new Promise(resolve => {
        const r = http.get({ host: '127.0.0.1', port, path: '/json/version', timeout: timeoutMs }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve(!!JSON.parse(d).webSocketDebuggerUrl); }
                catch (e) { resolve(false); }
            });
        });
        r.on('error', () => resolve(false));
        r.on('timeout', () => { r.destroy(); resolve(false); });
    });
}

/**
 * Detect-or-launch a CDP-exposing Chrome. Throws typed errors (err.code) that server.js maps
 * to tester-facing copy (§B6) — no stack traces, since there is no terminal to read them in.
 */
async function ensureDebugChrome() {
    if (await probeCdp(CDP_PORT)) return; // already up (ours, or a previous session's)

    const chromePath = resolveSystemChromePath();
    if (!chromePath) throw err('CHROME_NOT_FOUND', 'Chrome was not found at any known install path.');

    // Proactive half of the lock check: a Chrome already running on this profile will forward
    // our launch to the existing instance and exit, leaving no CDP port behind.
    const wasRunning = !isIsolatedProfile() && isChromeRunning();

    const profileDir = resolveRealProfileDir();
    if (isIsolatedProfile()) fs.mkdirSync(profileDir, { recursive: true });

    const child = spawn(chromePath, [
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
    ], { detached: true, stdio: 'ignore' });
    // Deliberately NOT added to server.js's trackedProcesses, and unref'd: this is the tester's
    // own browser. It must outlive our server, and cleanupAll() must never kill it (§B5).
    child.unref();

    // Reactive half: poll ~8s. Not responding + already exited == profile lock.
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
        if (await probeCdp(CDP_PORT)) return;
        await new Promise(r => setTimeout(r, 250));
    }
    throw err('CHROME_PROFILE_LOCKED', wasRunning
        ? 'Chrome is already running on this profile, so the debug port could not be opened.'
        : `Chrome did not expose its debug port on ${CDP_PORT} within 8s.`);
}

/**
 * The ONE tracked page, reused for the server process's whole lifetime (§B4). Cookies are
 * profile-scoped so a fresh tab would also be logged in — pinning one tab instead avoids
 * accumulating tabs across a workday and ambiguity about which of the tester's many open
 * tabs the automation is driving.
 */
async function getPage() {
    await ensureDebugChrome();
    if (!cachedBrowser || !cachedBrowser.isConnected()) {
        cachedBrowser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
        // §B6: tester closes the debug Chrome mid-session -> next /record transparently re-launches.
        cachedBrowser.on('disconnected', () => { cachedBrowser = null; cachedContext = null; cachedPage = null; });
        cachedContext = null;
        cachedPage = null;
    }
    if (!cachedContext) cachedContext = cachedBrowser.contexts()[0];
    if (!cachedContext) throw err('NO_BROWSER_CONTEXT', 'Connected to Chrome but it exposed no browser context.');
    if (cachedPage && !cachedPage.isClosed()) return cachedPage;
    cachedPage = cachedContext.pages().find(p => !p.isClosed()) || await cachedContext.newPage();
    return cachedPage;
}

/**
 * Plain codegen: navigate, then switch on the recorder that writes `outputPath` live.
 * The codegen CLI has no CDP-attach flag, so this uses the same internal call the CLI itself
 * makes. Underscore-prefixed means unstable-by-convention: if a Playwright upgrade breaks it,
 * it breaks here, loudly, as ENABLE_RECORDER_FAILED.
 */
async function startCodegenRecording({ url, outputPath }) {
    const page = await getPage();
    if (url && /^https?:/.test(url)) await page.goto(url).catch(() => {});
    try {
        await cachedContext._enableRecorder({
            language: 'javascript',
            mode: 'recording',
            outputFile: path.resolve(outputPath),
            handleSIGINT: false,
        });
    } catch (e) {
        throw err('ENABLE_RECORDER_FAILED', e.message);
    }
    return page;
}

async function stopCodegenRecording() {
    if (!cachedContext) return;
    try { await cachedContext._disableRecorder(); } catch (e) { /* already off, or context gone */ }
}

/**
 * Replay-before-record: execute the already-mapped preceding steps LIVE against the
 * authenticated tab, so the tester records the next step from real app state.
 *
 * Replaces the string-emitting replay builder that used to live in server.js. isSafeChain and
 * interpolate are reused verbatim from core/helpers.js — the same trust boundary the compiler
 * enforces, just executed now instead of written into a spec file that executes later.
 */
async function executeSteps(page, steps, iterData) {
    for (const step of steps) {
        const actions = step.resolvedSteps || (Array.isArray(step) ? step : [step]);
        for (const action of actions) {
            const target = interpolate(action.target, iterData, step.Data);
            const value = interpolate(action.value, iterData, step.Data);
            if (action.type === 'goto') {
                await page.goto(target);
                continue;
            }
            const safe = isSafeChain(target);
            // Same rule the compiler now enforces: a target that LOOKS like a locator chain but
            // failed validation must not be silently downgraded to a never-matching locator.
            if (!safe && /^(getBy|locator\(|frameLocator\()/.test(String(target).trim())) {
                throw err('UNSAFE_LOCATOR', `Unsafe or malformed locator in preceding step "${step.Mapping_Key || 'suggestion'}": ${target}`);
            }
            const loc = safe ? evalChain(page, safe) : page.locator(target);

            if (action.type === 'click') await loc.click();
            else if (action.type === 'fill') await loc.fill(value);
            else if (action.type === 'press') await loc.press(value || 'Enter');
            else if (action.type === 'selectOption') await loc.selectOption(value);
            else if (action.type === 'check') await loc.check();
            else if (action.type === 'uncheck') await loc.uncheck();
            // ponytail: assertions use waitFor/textContent rather than expect(), which needs a
            // test() scope that does not exist here. Same observable behavior for a replay:
            // block until the condition holds, throw if it never does.
            else if (action.type === 'toBeVisible') await loc.first().waitFor({ state: 'visible' });
            else if (action.type === 'toHaveText') {
                await loc.first().waitFor({ state: 'visible' });
                const actual = await loc.first().textContent();
                if (!String(actual || '').includes(value)) {
                    throw err('REPLAY_ASSERT_FAILED', `Expected "${value}" in preceding step "${step.Mapping_Key || 'suggestion'}", got "${actual}".`);
                }
            }
        }
        await page.waitForTimeout(1000);
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForLoadState('networkidle').catch(() => {});
    }
    return page;
}

async function runStepsThenPause(page, steps, iterData) {
    return executeSteps(page, steps, iterData);
}

async function rewind(page, steps, iterData) {
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    return executeSteps(page, steps, iterData);
}

/**
 * Turn an isSafeChain-validated chain string into a live Locator.
 * isSafeChain has already proven, structurally, that this is a `page.`-rooted chain of
 * SAFE_LOCATOR_METHODS with literal-only arguments — so this is no wider a surface than the
 * compiler already has when it writes the same string into a spec file that then runs it.
 */
function evalChain(page, chain) {
    return new Function('page', `return page.${chain};`)(page);
}

module.exports = {
    CDP_PORT,
    resolveSystemChromePath,
    resolveRealProfileDir,
    isIsolatedProfile,
    isChromeRunning,
    ensureDebugChrome,
    getPage,
    startCodegenRecording,
    stopCodegenRecording,
    runStepsThenPause,
    executeSteps,
    rewind,
    evalChain,
    _reset() { cachedBrowser = null; cachedContext = null; cachedPage = null; },
};
