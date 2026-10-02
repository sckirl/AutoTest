// High-Security Banking Compliance: Strict DRIVERS/ Resolution
const fs = require('fs');
const path = require('path');
// Phase C: load local .env once at boot (real secrets stay local, never committed).
// Process env wins; runtime_env also checks packaged userData and the direct-server cwd.
const { loadRuntimeEnv } = require('../core/runtime_env');
loadRuntimeEnv();
// A1.3: resourcesPath-aware so this still resolves once Electron packages DRIVERS/ unpacked.
const { resolveDriversRoot } = require('../core/helpers');
const DRIVERS_ROOT = resolveDriversRoot(__dirname);
const DRIVERS_PATH = path.join(DRIVERS_ROOT, 'node_modules');
const MS_PLAYWRIGHT_PATH = path.join(DRIVERS_ROOT, 'ms-playwright');

if (fs.existsSync(DRIVERS_PATH)) {
    module.paths.unshift(DRIVERS_PATH);
    process.env.NODE_PATH = DRIVERS_PATH;
    require('module').Module._initPaths();
}

const acorn = require('acorn');
const walk = require('acorn-walk');
const express = require('express');
const cors = require('cors');
const { exec, execSync, execFileSync, spawn } = require('child_process');
const XLSX = require('xlsx');
const multer = require('multer');

// ponytail: shared helpers module (resolveDriversRoot already pulled in above, before DRIVERS bootstrap)
const { isSafeChain, interpolate, q, tokenizeLiterals, sweepOrphans, safeSessionId, normalizePlatform, buildCodegenArgs, buildCodegenEnv } = require('../core/helpers');
const { resolveProvider, complete } = require('../core/llm');
const ActionDB = require('../core/action_db');
const { generateBlueprintFromExcel } = require('../core/scenario_parser');

// A1.1: STATE_DIR/DATA_DIR/RESULTS_DIR are overridable so a packaged (read-only app dir)
// Electron build can redirect all writes outside app.asar — electron/main.js sets these via
// env when forking this process. ROOT_DIR stays __dirname-relative always: it locates this
// app's own scripts/node_modules for execSync/spawn cwd, never a write target.
const CORE_DIR = process.env.AUTOTEST_STATE_DIR || path.join(__dirname, '../core');
const ROOT_DIR = path.join(__dirname, '../');
const DATA_DIR = process.env.AUTOTEST_DATA_DIR || ROOT_DIR; // uploads
const RESULTS_DIR = process.env.AUTOTEST_RESULTS_DIR || path.join(DATA_DIR, 'results');
const MAPPINGS_PATH = path.join(CORE_DIR, 'mappings.json');
const UPLOADED_EXCEL = path.join(DATA_DIR, 'scenario_uploaded.xlsx');
const RUNTIME_DATA_PATH = path.join(CORE_DIR, 'runtime_data.json');
const PLATFORM_STATE_PATH = path.join(CORE_DIR, 'platform_state.json');

// ponytail: resolve CLI consistently with Node's ancestor module resolution to prevent singleton mismatch
// doubt-review #5: require.resolve first — inside app.asar only the module system knows the
// real packed layout; hardcoded ROOT_DIR/DRIVERS guesses are dev paths that don't exist packaged.
let PLAYWRIGHT_CLI;
try {
    const pwPkgPath = require.resolve('@playwright/test/package.json');
    PLAYWRIGHT_CLI = path.join(path.dirname(pwPkgPath), 'cli.js');
} catch (e) {
    if (fs.existsSync(path.join(ROOT_DIR, 'node_modules/@playwright/test/cli.js'))) {
        PLAYWRIGHT_CLI = path.join(ROOT_DIR, 'node_modules/@playwright/test/cli.js');
    } else {
        PLAYWRIGHT_CLI = path.join(DRIVERS_PATH, '@playwright/test/cli.js');
    }
}

let activeRun = null;
let globalBrowser = null; 
const trackedProcesses = new Set(); // ponytail: still used for cleanupAll on exit
let activeCodegen = null;  // DEF-CRIT-001 FIX: single codegen guard
let activeRunner = null;   // DEF-HIGH-004 FIX: separate runner ref
let activeSuggestion = null; // Phase C: one live suggestion session at a time

// ponytail: restore persisted platform state on startup
let activePlatform = 'web';
if (fs.existsSync(PLATFORM_STATE_PATH)) {
    try {
        const saved = JSON.parse(fs.readFileSync(PLATFORM_STATE_PATH, 'utf8'));
        if (saved && (saved.platform === 'web' || saved.platform === 'mobile')) {
            activePlatform = saved.platform;
        }
    } catch (e) {}
}

function cleanupAll() {
    console.log("\nShutdown signal received. Killing all tracked processes...");
    for (const proc of trackedProcesses) {
        try { proc.kill('SIGKILL'); } catch (e) {}
    }
    if (globalBrowser) {
        try { globalBrowser.close().catch(() => {}); } catch (e) {}
    }
    process.exit(0);
}

process.on('SIGINT', cleanupAll);
process.on('SIGTERM', cleanupAll);

// A2/packaged: every node-script child below must run without a 'node' on PATH (target
// machines have none) and without chdir'ing into app.asar (a file → ENOTDIR, the user's
// exact .dmg failure: `spawnSync node ENOTDIR` on upload, then `spawnSync … Helper ENOTDIR`
// after the first fix attempt). Packaged detection keys off __dirname — the server script
// itself lives at …/app.asar/studio/server.js — NEVER process.execPath: the fork()'d server
// inherits the Electron *Helper* binary as execPath, so an execPath-based check takes the
// "dev: real node" branch and spawns the Helper as if it were node (round-2 proven).
// realism-proven (round 2): no node binary ships in the package (resources/node absent), so
// packaged children run on the main Electron binary with ELECTRON_RUN_AS_NODE=1, which makes
// it behave as vanilla node — asar require/fs still work, only the GUI bootstrap is skipped.
// ponytail: one helper, two branches; dev is byte-identical to the old execFileSync calls.
// doubt-reconciled: reviewer findings #1 (no-node-on-PATH), #2 (asar cwd), #4 (ROOT_DIR
// dual-job), #12 — all close here; #3 (execPath-is-Electron) closes via the RUN_AS_NODE env.
function isPackaged() { return __dirname.includes('app.asar'); }
function runNodeScript(relScript, args) {
    if (!isPackaged()) {
        execFileSync(process.execPath, [path.join(ROOT_DIR, relScript), ...args], { stdio: 'inherit', cwd: ROOT_DIR });
        return;
    }
    const res = process.resourcesPath; // …/AutoTest Studio.app/Contents/Resources
    const mainBin = path.join(path.dirname(res), 'MacOS', path.basename(process.execPath).replace(/ Helper$/, ''));
    const nodeBin = [path.join(res, process.platform === 'win32' ? 'node.exe' : 'node'), mainBin]
        .find(c => { try { return fs.existsSync(c); } catch (e) { return false; } }) || process.execPath;
    execFileSync(nodeBin, [path.join(res, 'app.asar', relScript), ...args], {
        stdio: 'inherit', cwd: DATA_DIR, // writable userData — never the asar, never repo root
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    });
}

// Helper to detect bundled/portable browser
// A2/packaged: OS-first, not first-existing. The old fixed order checked mac-arm before
// win — on a Windows machine that ALSO had a stray mac .app folder (copied whole
// DRIVERS/), existsSync would return a mac binary path that can never execute on win32.
// Check process.platform/process.arch first, fall through to the rest only as fallback.
function getBundledBrowserPath() {
    const byPlatform =
        process.platform === 'win32' ? [
            path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-win/chrome.exe'),
            path.resolve(__dirname, '../bin/chrome-win/chrome.exe'),
            path.resolve(__dirname, '../bin/chrome-win/Chrome.exe'),
        ] : process.platform === 'darwin' ? [
            process.arch === 'arm64'
                ? path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
                : path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
        ] : [
            path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-linux/chrome'),
        ];
    const fallback = [
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-win/chrome.exe'),
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-linux/chrome'),
        path.resolve(__dirname, '../bin/chrome-win/chrome.exe'),
        path.resolve(__dirname, '../bin/chrome-win/Chrome.exe')
    ];
    for (const p of [...byPlatform, ...fallback]) {
        if (fs.existsSync(p)) {
            console.log(`FOUND bundled Chromium: ${p}`);
            return p;
        }
    }
    console.log(`NO bundled browser found in DRIVERS/. Using system Playwright defaults.`);
    return null;
}

// ponytail: cache bundled browser path once at startup
const BUNDLED_BROWSER = getBundledBrowserPath();

// ponytail: standard browser environment helper for codegen, replay, and test runs
function getBrowserEnv(extraEnv = {}) {
    const env = { ...process.env, ...extraEnv };
    if (fs.existsSync(MS_PLAYWRIGHT_PATH)) {
        env.PLAYWRIGHT_BROWSERS_PATH = MS_PLAYWRIGHT_PATH;
        env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';
    }
    if (BUNDLED_BROWSER) {
        env.BROWSER_PATH = BUNDLED_BROWSER;
        env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = BUNDLED_BROWSER;
        env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = BUNDLED_BROWSER;
    }
    return env;
}

function launchVisibleCodegen({ targetUrl, outputPath }) {
    const args = buildCodegenArgs({
        cli: PLAYWRIGHT_CLI,
        targetUrl,
        outputPath,
        profileDir: path.join(CORE_DIR, 'autotest')
    });
    const env = buildCodegenEnv({
        baseEnv: process.env,
        browserPath: BUNDLED_BROWSER,
        browsersPath: MS_PLAYWRIGHT_PATH,
        nodePath: isPackaged() ? path.join(process.resourcesPath, 'app.asar', 'node_modules') : path.join(ROOT_DIR, 'node_modules'),
        packaged: isPackaged()
    });
    const child = spawn(process.execPath, args, { env, shell: false, windowsHide: false, detached: false });
    trackedProcesses.add(child);
    activeCodegen = child;
    child.on('error', e => console.error('[CODEGEN SPAWN ERROR]', e.message));
    child.on('close', code => {
        trackedProcesses.delete(child);
        if (activeCodegen === child) activeCodegen = null;
        console.log(`[CODEGEN] process closed with code ${code}, output: ${outputPath}`);
    });
    return child;
}

function launchVisibleReplay({ specPath }) {
    const env = buildCodegenEnv({
        baseEnv: process.env,
        browserPath: BUNDLED_BROWSER,
        browsersPath: MS_PLAYWRIGHT_PATH,
        nodePath: isPackaged() ? path.join(process.resourcesPath, 'app.asar', 'node_modules') : path.join(ROOT_DIR, 'node_modules'),
        packaged: isPackaged()
    });
    const child = spawn(process.execPath, [PLAYWRIGHT_CLI, 'test', specPath, '--headed'], {
        env, shell: false, windowsHide: false, detached: false
    });
    trackedProcesses.add(child);
    activeCodegen = child;
    child.on('error', e => console.error('[REPLAY SPAWN ERROR]', e.message));
    child.on('close', code => {
        trackedProcesses.delete(child);
        if (activeCodegen === child) activeCodegen = null;
        try { fs.unlinkSync(specPath); } catch (e) {}
        console.log(`[REPLAY] process closed with code ${code}`);
    });
    return child;
}

// Process Cleanup Hook
process.on('exit', () => {
    if (globalBrowser) {
        try { globalBrowser.close(); } catch (e) {}
    }
});

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/results', express.static(RESULTS_DIR));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DATA_DIR),
    // A0.8.10 FIX: a shared staging filename let two overlapping /upload requests clobber
    // each other's workbook mid-parse. crypto.randomUUID() gives each request its own file.
    filename: (req, file, cb) => cb(null, `scenario_upload_staging_${require('crypto').randomUUID()}.xlsx`)
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // DEF-MED-011 FIX: 5MB strict limit
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));
app.get('/results', (req, res) => {
    try {
        if (!fs.existsSync(RESULTS_DIR)) {
            return res.send('<h1>No results directory found</h1>');
        }
        const dirs = fs.readdirSync(RESULTS_DIR).filter(d => fs.statSync(path.join(RESULTS_DIR, d)).isDirectory());
        
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>AutoTest Studio: Results Directory Listing</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #fafafa; color: #333; }
                h1 { color: #111; margin-bottom: 20px; font-weight: 700; font-size: 24px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
                .folder-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
                .folder-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .folder-title { font-weight: 600; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
                .file-list { list-style: none; padding: 0; margin: 0; }
                .file-list li { margin-bottom: 8px; font-size: 14px; }
                .file-list a { color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 6px; }
                .file-list a:hover { text-decoration: underline; }
                .empty { color: #6b7280; font-style: italic; }
            </style>
        </head>
        <body>
            <h1>AutoTest Studio: Results Directory Listing</h1>
            <a href="/" style="color:#2563eb; text-decoration:none; font-size:14px;">&larr; Back to Studio UI</a>
            <div class="grid">
        `;
        
        if (dirs.length === 0) {
            html += `<p class="empty">No scenario runs found. Execute test scenarios to populate results.</p>`;
        }
        
        for (const dir of dirs) {
            const files = fs.readdirSync(path.join(RESULTS_DIR, dir)).filter(f => !f.startsWith('.'));
            html += `
                <div class="folder-card">
                    <div class="folder-title">${dir}</div>
                    <ul class="file-list">
            `;
            if (files.length === 0) {
                html += `<li class="empty">No artifacts</li>`;
            } else {
                files.forEach(f => {
                    const ext = path.extname(f).toLowerCase();
                    const icon = ext === '.png' ? '[PNG]' : ext === '.zip' ? '[ZIP]' : '[FILE]';
                    html += `<li><a href="/results/${dir}/${f}" target="_blank">${icon} ${f}</a></li>`;
                });
            }
            html += `
                    </ul>
                </div>
            `;
        }
        
        html += `
            </div>
        </body>
        </html>
        `;
        res.send(html);
    } catch (err) {
        res.status(500).send('Error reading results: ' + err.message);
    }
});
app.post('/upload', upload.single('excel'), (req, res) => {
    // A0.8.11 FIX: existsSync(stagedFile) only proved *some* file was there, including a stale
    // one left by a process that died mid-request (never swept at startup). Trust req.file,
    // which multer only sets when this request actually carried an upload.
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }
    const stagedFile = req.file.path;
    // Regenerate blueprint.json immediately on upload so we have the steps mapping structure
    // A0.6.2 FIX: this used to respond {message:"Uploaded."} unconditionally, even when parsing
    // failed outright (bad headers) or silently no-opped (missing file, exit 0). Both are now
    // real thrown errors from scenario_parser.js, so a non-zero exit here is a genuine failure.
    const warningsPath = path.join(CORE_DIR, 'blueprint_warnings.json');
    try { fs.unlinkSync(warningsPath); } catch (e) {}
    try {
        // A1.1: stagedFile is an absolute path (DATA_DIR may now differ from ROOT_DIR, the
        // execSync cwd needed to resolve `core/scenario_parser.js` itself) — pass it whole,
        // not basename-relative-to-ROOT_DIR, which broke the moment the two dirs diverged.
        // doubt-review-found: string-interpolated into a shell command, this path breaks the
        // moment it contains a space — Electron's userData default (AUTOTEST_DATA_DIR) is
        // "~/Library/Application Support/<App Name>" on mac, guaranteed to have one.
        // execFileSync passes argv directly, no shell involved, no quoting to get wrong.
        runNodeScript('core/scenario_parser.js', [stagedFile]);
        console.log("Blueprint generated successfully on upload");
        // Atomically replace active workbook and reset project state only after validation succeeds
        fs.renameSync(stagedFile, UPLOADED_EXCEL);
        if (fs.existsSync(RUNTIME_DATA_PATH)) fs.unlinkSync(RUNTIME_DATA_PATH);
        if (req.body.keepMappings === 'false') {
            fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        }
    } catch (e) {
        try { fs.unlinkSync(stagedFile); } catch (e2) {}
        let reason = e.message;
        try { reason = JSON.parse(fs.readFileSync(warningsPath, 'utf8')).error || reason; } catch (e2) {}
        return res.status(400).json({ error: "Failed to parse the uploaded Excel file: " + reason });
    }
    let warnings = [];
    try { warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8')); } catch (e) {}
    res.json({ message: "Uploaded.", warnings });
});

app.get('/data-matrix', (req, res) => {
    try {
        if (!fs.existsSync(RUNTIME_DATA_PATH)) return res.json({});
        res.json(JSON.parse(fs.readFileSync(RUNTIME_DATA_PATH, 'utf8')));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/data-matrix', (req, res) => {
    try {
        const payload = req.body;
        // Phase 2-A: Strict Validation
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).length === 0) {
            if (payload && Object.keys(payload).length === 0) {
                 // Empty object is allowed for clearing overrides
                 fs.writeFileSync(RUNTIME_DATA_PATH, JSON.stringify({}, null, 2));
                 return res.json({ message: "Cleared." });
            }
            return res.status(400).json({ error: "Invalid payload: Expected a JSON object mapping ScenarioIDs to data arrays." });
        }
        
        for (const [scenId, iterations] of Object.entries(payload)) {
            if (!Array.isArray(iterations)) {
                return res.status(400).json({ error: `Invalid format for scenario ${scenId}: Expected an array of iterations.` });
            }
        }

        fs.writeFileSync(RUNTIME_DATA_PATH, JSON.stringify(payload, null, 2));
        res.json({ message: "Saved." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/scan', (req, res) => {
    try {
        if (!fs.existsSync(MAPPINGS_PATH)) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        if (!fs.existsSync(UPLOADED_EXCEL)) return res.json({ steps: [] });

        // A0.6.5 follow-up: this used to re-walk the raw Excel with its own copy of the
        // parsing loop, so the Scenario_ID dedup (and every other) fix in scenario_parser.js
        // never applied here. Route through the one real parser instead.
        const { blueprint } = generateBlueprintFromExcel(UPLOADED_EXCEL);

        const stepMap = new Map();
        const scenarios = [];
        const scenarioVariables = {};

        for (const scenario of blueprint) {
            const currentScenario = scenario.Scenario_ID;
            scenarios.push(currentScenario);
            const vars = new Set();

            for (const step of scenario.Flow) {
                const label = step.Mapping_Key;
                const resolvedSteps = (mappings[label] && mappings[label].steps) || ActionDB.resolveSteps(label);
                const isMapped = !!(resolvedSteps && resolvedSteps.length > 0);

                if (!stepMap.has(label)) {
                    stepMap.set(label, {
                        label,
                        status: isMapped ? 'mapped' : 'missing',
                        flows: [currentScenario],
                        scenarioId: currentScenario
                    });
                } else {
                    stepMap.get(label).flows.push(currentScenario);
                }

                if (resolvedSteps && Array.isArray(resolvedSteps)) {
                    for (const action of resolvedSteps) {
                        const str = (action.target || "") + " " + (action.value || "");
                        ActionDB.extractVariables(str).forEach(v => vars.add(v));
                    }
                }
            }
            scenarioVariables[currentScenario] = Array.from(vars);
        }

        res.json({ steps: Array.from(stepMap.values()), scenarios, scenarioVariables });
    } catch (err) {
        console.error("Scan Error:", err);
        res.status(400).json({ error: err.message });
    }
});

// §B6: typed cdp_session errors -> tester-facing copy. No stack traces: there is no terminal
// to read them in. The full error is logged server-side.
const CDP_MESSAGES = {
    CHROME_NOT_FOUND: "Chrome wasn't found on this computer. Ask IT to install stable Google Chrome, then try again.",
    CHROME_PATH_INVALID: 'AUTOTEST_CHROME_PATH is configured but does not point to a Chrome executable. Check your .env path.',
    CHROME_PROFILE_LOCKED: 'Chrome is already running on the selected profile. AutoTest normally uses its separate autotest profile; check the CDP port or try again.',
    NO_BROWSER_CONTEXT: 'Connected to Chrome but found no usable window. Close Chrome completely and try again.',
    ENABLE_RECORDER_FAILED: "Recording couldn't start. Contact support with error code ENABLE_RECORDER_FAILED.",
};
function cdpErrorMessage(e) {
    console.error('[CDP]', e.code || 'UNKNOWN', e.message);
    // UNSAFE_LOCATOR / REPLAY_ASSERT_FAILED name a specific mapped step, so they are useful
    // verbatim — unlike the infrastructure failures above, which must not leak internals.
    if (e.code === 'UNSAFE_LOCATOR' || e.code === 'REPLAY_ASSERT_FAILED') return e.message;
    return CDP_MESSAGES[e.code] || 'Recording could not start. Contact support.';
}
function cdpErrorStatus(e) {
    if (e.code === 'CHROME_PROFILE_LOCKED') return 409;
    if (e.code === 'CHROME_NOT_FOUND') return 503;
    return 500;
}

app.post('/record', async (req, res) => {
    // DEF-CRIT-001 FIX: Guard FIRST, before any computation. Sentinel is set synchronously.
    if (activeCodegen && !activeCodegen.killed && activeCodegen.exitCode === null) {
        return res.status(409).json({ error: 'A recording session is already active. Close the browser or click Cancel first.' });
    }
    // A0.6.7 FIX: symmetric with /run's guard below — a live test run touching the same
    // target app must not race with a live recording session starting mid-run.
    if (activeRun && (activeRun.phase === 'compiling' || activeRun.phase === 'running')) {
        return res.status(409).json({ error: 'A test run is in progress. Wait for it to finish before recording.' });
    }
    // A0.7.1 FIX: this handler unconditionally spawned Playwright's Web codegen regardless
    // of the platform toggle — selecting Mobile silently recorded a Web mapping. No Appium
    // recording flow exists in this codebase; reject clearly instead of building one, until
    // that's actually implemented.
    // A0.7.1 follow-up (blackbox obs-2): this was a denylist — only the literal 'mobile' was
    // rejected, so platform:'appium' (or any other string) fell through and spawned a real Web
    // codegen session, which is the exact silent wrong-platform mapping A0.7.1 was filed against.
    // Allowlist instead: anything not 'web' is refused. /set-platform already does this.
    const recPlatform = req.body.platform === undefined || req.body.platform === null
        ? 'web' : normalizePlatform(req.body.platform);
    if (recPlatform === 'mobile') {
        return res.status(400).json({ error: 'Mobile recording isn\'t supported yet. Use Manual entry for mobile steps, or switch to Web to record.' });
    }
    if (recPlatform !== 'web') {
        return res.status(400).json({ error: `Unknown platform "${req.body.platform}". Use "web" (recording) or "mobile" (not yet supported).` });
    }
    activeCodegen = { killed: false, exitCode: null }; // sentinel: blocks any concurrent request before spawn returns

    const { label, url, scenarioId } = req.body;
    console.log(`\nCodegen launched for: "${label}" in scenario: "${scenarioId}"`);

    const sessionId = Date.now().toString();

    // Replay logic check
    const blueprintPath = path.join(CORE_DIR, 'blueprint.json');
    let precedingMappedSteps = [];
    let mappings = {};

    if (fs.existsSync(blueprintPath) && fs.existsSync(MAPPINGS_PATH)) {
        try {
            const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
            mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
            let scenario = blueprint.find(s => s.Scenario_ID === scenarioId);
            if (!scenario && blueprint.length > 0) {
                scenario = blueprint.find(s => Array.isArray(s.Flow) && s.Flow.some(st => st.Mapping_Key === label));
            }
            if (scenario && Array.isArray(scenario.Flow)) {
                const targetIdx = scenario.Flow.findIndex(step => step.Mapping_Key === label);
                if (targetIdx > 0) {
                    const slice = scenario.Flow.slice(0, targetIdx);
                    // ponytail: a step can be "mapped" either directly in mappings.json or via an
                    // Action Library synonym/name match (same fallback every other route uses:
                    // /scan, /mapping, /preview, compiler.js). This was checking mappings.json only,
                    // so Library-resolved steps silently dropped out of the preceding-steps replay.
                    precedingMappedSteps = slice
                        .map(s => ({ ...s, resolvedSteps: (mappings[s.Mapping_Key] && mappings[s.Mapping_Key].steps) || ActionDB.resolveSteps(s.Mapping_Key) }))
                        .filter(s => Array.isArray(s.resolvedSteps) && s.resolvedSteps.length > 0);
                }
            }
        } catch (e) {
            console.error("Error reading blueprint/mappings during record:", e);
        }
    }

    // Re-Map: replay mapped predecessors in a visible headed Playwright window, then pause so
    // the analyst can inspect the page and use the Codegen recorder there. This deliberately
    // restores the supported CLI flow; the CDP _enableRecorder path was unreliable in packaged
    // Electron and returned ENABLE_RECORDER_FAILED without producing code.
    if (precedingMappedSteps.length > 0) {
        let runtimeData = {};
        if (fs.existsSync(RUNTIME_DATA_PATH)) {
            try { runtimeData = JSON.parse(fs.readFileSync(RUNTIME_DATA_PATH, 'utf8')); } catch (e) {}
        }
        const iterations = runtimeData[scenarioId];
        const iterData = (iterations && iterations.length > 0) ? iterations[0] : null;
        const replaySpecPath = path.join(CORE_DIR, `replay_${sessionId}.spec.ts`);
        let replayCode = `import { test, expect } from '@playwright/test';\n\ntest('Replay before recording ${q(label)}', async ({ page }) => {\n  test.setTimeout(0);\n`;
        for (const step of precedingMappedSteps) {
            replayCode += `  // Step: ${step.Mapping_Key}\n`;
            for (const action of step.resolvedSteps) {
                const finalTarget = interpolate(action.target, iterData, step.Data);
                const finalValue = interpolate(action.value, iterData, step.Data);
                const safeTarget = isSafeChain(finalTarget);
                const loc = safeTarget ? `page.${safeTarget}` : `page.locator(${q(finalTarget)})`;
                if (action.type === 'goto') replayCode += `  await page.goto(${q(finalTarget)});\n`;
                else if (action.type === 'click') replayCode += `  await ${loc}.click();\n`;
                else if (action.type === 'fill') replayCode += `  await ${loc}.fill(${q(finalValue)});\n`;
                else if (action.type === 'press') replayCode += `  await ${loc}.press(${q(finalValue || 'Enter')});\n`;
                else if (action.type === 'selectOption') replayCode += `  await ${loc}.selectOption(${q(finalValue)});\n`;
                else if (action.type === 'check') replayCode += `  await ${loc}.check();\n`;
                else if (action.type === 'uncheck') replayCode += `  await ${loc}.uncheck();\n`;
                else if (action.type === 'toBeVisible') replayCode += `  await expect(${loc}).toBeVisible();\n`;
                else if (action.type === 'toHaveText') replayCode += `  await expect(${loc}).toHaveText(${q(finalValue)});\n`;
            }
            replayCode += `  await page.waitForTimeout(1000);\n`;
        }
        replayCode += `  await page.pause();\n});\n`;
        try {
            fs.writeFileSync(replaySpecPath, replayCode);
            launchVisibleReplay({ specPath: replaySpecPath });
            return res.json({
                sessionId, isReplay: true,
                message: 'Playwright replay opened. Review the preceding steps in the visible window, perform the new action, then close it to transfer code here.'
            });
        } catch (e) {
            try { fs.unlinkSync(replaySpecPath); } catch (e2) {}
            activeCodegen = null;
            return res.status(500).json({ error: `Playwright replay could not start: ${e.message}` });
        }
    }

    // Plain visible Codegen: the analyst gets the actual Playwright recorder window and can
    // inspect/edit generated actions there. Closing Codegen flushes codegen_<sessionId>.js;
    // the existing UI poll imports it into the AutoTest modal for final review/save.
    const outputPath = path.join(CORE_DIR, `codegen_${sessionId}.js`);
    const targetUrl = (url && url.startsWith('http')) ? url : 'about:blank';
    try {
        launchVisibleCodegen({ targetUrl, outputPath });
    } catch (e) {
        activeCodegen = null;
        return res.status(500).json({ error: `Playwright Codegen could not start: ${e.message}` });
    }
    res.json({ sessionId, isReplay: false, message: 'Playwright Codegen opened. Perform the action there, review/edit the generated code, then close Codegen to transfer it here.' });
});

// GET /codegen-result/:sessionId: returns recorded code once codegen writes the file
// Client polls this every 1.5s after /record. File deleted after first read.
app.get('/codegen-result/:sessionId', (req, res) => {
    // A0.6.1 FIX: unauthenticated path traversal — reject anything but a real session id
    // (the server only ever generates digit-string ids), then confirm defense-in-depth
    // that the resolved path never leaves CORE_DIR before reading OR deleting it.
    const id = safeSessionId(req.params.sessionId);
    if (!id) return res.status(400).json({ error: 'Invalid session id.' });
    const outputPath = path.join(CORE_DIR, `codegen_${id}.js`);
    if (path.resolve(outputPath) !== outputPath || !outputPath.startsWith(CORE_DIR + path.sep)) {
        return res.status(400).json({ error: 'Invalid session id.' });
    }
    if (!fs.existsSync(outputPath)) return res.json({ ready: false });
    try {
        const raw = fs.readFileSync(outputPath, 'utf8');
        fs.unlinkSync(outputPath);
        res.json({ ready: true, code: raw });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/save-mapping', (req, res) => {
    const { label, code, scenarioId } = req.body;
    // DEF-NEW-003 FIX: Validate label, prevent empty/null key corruption in mappings.json
    if (!label || typeof label !== 'string' || label.trim() === '') {
        return res.status(400).json({ error: 'Invalid label: must be a non-empty string.' });
    }
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Invalid code: must be a non-empty string.' });
    }
    try {
        const steps = parseRecordedCode(code);
        // ponytail: codegen bakes in a literal (e.g. "admin123"), never a {key} placeholder.
        // If this Mapping_Key is shared by another scenario with different Data (a negative-path
        // scenario reusing "Input Password" with a wrong password), rewrite the literal back to
        // {key} so every scenario's own Data is honored on replay, not just the one recorded.
        if (scenarioId) {
            try {
                const blueprint = JSON.parse(fs.readFileSync(path.join(CORE_DIR, 'blueprint.json'), 'utf8'));
                const scenario = blueprint.find(s => s.Scenario_ID === scenarioId);
                const row = scenario && Array.isArray(scenario.Flow) && scenario.Flow.find(s => s.Mapping_Key === label.trim());
                if (row && row.Data) tokenizeLiterals(steps, row.Data);
            } catch (e) { /* no blueprint yet, or scenario/row not found: save the literal as-is */ }
        }
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        mappings[label.trim()] = { steps };
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
        res.json({ message: "Saved." });
    } catch (e) {
        res.status(400).json({ error: "Syntax error in Playwright code: " + e.message });
    }
});

// ... existing code ...

app.post('/run', async (req, res) => {
    const { workers, headless } = req.body;
    // A0.7.1 follow-up: 'Mobile'/'MOBILE'/'mobile ' bypassed a strict === 'mobile' check here
    // too — normalize once, at the top, so every use below (env, activePlatform, the mobile
    // dependency check) sees the same canonical value.
    const platform = req.body.platform ? normalizePlatform(req.body.platform) : req.body.platform;

    // blackbox obs-2: same denylist hole as /record — platform:'appium' was accepted and ran
    // the Web path. Only the two platforms this app actually implements are valid here.
    if (platform !== undefined && platform !== null && platform !== 'web' && platform !== 'mobile') {
        return res.status(400).json({ error: `Unknown platform "${req.body.platform}". Use "web" or "mobile".` });
    }

    if (platform === 'mobile') {
        try { require.resolve('webdriverio'); } catch (e) {
            return res.status(400).json({ error: "Missing Dependency: 'webdriverio' is not installed." });
        }
    }
    if (platform) {
        process.env.AUTOTEST_PLATFORM = platform;
        activePlatform = platform; // DEF-079 FIX: persist platform for /env
    }

    if (activeRun && (activeRun.phase === 'compiling' || activeRun.phase === 'running')) {
        return res.status(409).json({ error: "Execution already in progress." });
    }
    // A0.6.7 FIX: /record's guard only checked activeCodegen and /run's only checked activeRun —
    // a live recording session and a live test run could race on the same target app's state.
    if (activeCodegen && !activeCodegen.killed && activeCodegen.exitCode === null) {
        return res.status(409).json({ error: "A recording session is in progress. Close it before running tests." });
    }
    try {
        activeRun = { phase: 'compiling' };
        const numWorkers = workers || 2;
        console.log("Generating blueprint...");
        // A0.5.4 & A0.8.5: clear stale errors from prior runs before executing child scripts
        const compileErrorPath = path.join(CORE_DIR, 'compile_error.json');
        const warningsPath = path.join(CORE_DIR, 'blueprint_warnings.json');
        try { fs.unlinkSync(compileErrorPath); } catch (e) {}
        try { fs.unlinkSync(warningsPath); } catch (e) {}
        // DEF-CRIT-006 FIX: explicit cwd so paths resolve from project root, not studio/
        // doubt-review-found: same shell-quoting hazard as /upload above — DATA_DIR (and so
        // UPLOADED_EXCEL) can contain spaces under Electron's default userData path.
        runNodeScript('core/scenario_parser.js', [UPLOADED_EXCEL]);

        console.log("Compiling scenarios into explicit code...");
        runNodeScript('core/compiler.js', []);

        console.log(`Launching Playwright with ${numWorkers} workers...`);
        
        // Use headless from request body; default false (headed) for UAT evidence
        const isHeadless = headless ? '1' : '0';
        // ponytail: mobile has no bundled test-runner CLI, compiler.js emits a plain async
        // script for it (core/executed.mobile.js), so run it directly with `node` instead of
        // the Playwright Test CLI (which doesn't recognize that file's syntax).
        const isMobileRun = process.env.AUTOTEST_PLATFORM === 'mobile';
        // doubt-review-found: 'core/executed.spec.ts' with no --config only worked because dev
        // mode happens to run with cwd === ROOT_DIR. Under Electron (forked with cwd: userData)
        // Playwright can't even find playwright.config.ts, let alone the relocated spec file.
        // --config pins the config regardless of cwd; its testDir now tracks AUTOTEST_STATE_DIR
        // (playwright.config.ts), so the bare filename resolves correctly in both cases.
        // realism round 3: packaged, the config inside app.asar require()s @playwright/test
        // from the asar while the STATE_DIR spec resolves it from userData's NODE_PATH — two
        // copies load, Playwright aborts ("Requiring @playwright/test second time"). Packaged,
        // point --config at a STATE_DIR-side copy written next to the spec, so config and spec
        // resolve the SAME copy. Test files must live beside the config, so the spec is
        // addressable under the same testDir too. Dev keeps the repo config (byte-identical).
        let pwConfigPath = path.join(ROOT_DIR, 'playwright.config.ts');
        let pwTestArg = 'executed.spec.ts';
        if (isPackaged()) {
            pwConfigPath = path.join(CORE_DIR, 'playwright.config.ts');
            try {
                let cfg = fs.readFileSync(path.join(ROOT_DIR, 'playwright.config.ts'), 'utf8');
                cfg = cfg.replace(/testDir: process\.env\.AUTOTEST_STATE_DIR \|\| '\.\/core'/, `testDir: ${JSON.stringify(CORE_DIR)}`);
                fs.writeFileSync(pwConfigPath, cfg);
                fs.copyFileSync(path.join(CORE_DIR, 'executed.spec.ts'), path.join(CORE_DIR, 'run.spec.ts'));
                pwTestArg = 'run.spec.ts';
            } catch (e) { pwConfigPath = path.join(ROOT_DIR, 'playwright.config.ts'); pwTestArg = 'executed.spec.ts'; }
        }
        const pwArgs = isMobileRun
            ? [path.join(CORE_DIR, 'executed.mobile.js')]
            : [PLAYWRIGHT_CLI, 'test', '--config', pwConfigPath, pwTestArg, '--workers', String(numWorkers), '--reporter=json'];
        if (!isMobileRun && !headless) pwArgs.push('--headed');
        // ponytail: clear stale report.json so a run with no reporter (mobile) never inherits
        // a prior run's results, and a leftover timer below can't null out a newer run's state
        try { fs.unlinkSync(path.join(RESULTS_DIR, 'report.json')); } catch (e) {}
        const thisRun = activeRun;
        // realism round 4: packaged, the Playwright CLI ran on process.execPath (the Helper
        // binary) with no RUN_AS_NODE — spec discovery died ("No tests found" + "did not
        // expect test") even though the STATE_DIR config copy fixed dual-copy loading. Same
        // treatment runNodeScript got: packaged children run with ELECTRON_RUN_AS_NODE=1.
        const pwEnv = getBrowserEnv({
            PW_HEADLESS: isHeadless,
            PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(RESULTS_DIR, 'report.json'),
            // A1.1/A-6: pass the resolved value explicitly — a raw env var only propagates
            // when AUTOTEST_RESULTS_DIR was actually set; the *default* (DATA_DIR/results)
            // wouldn't otherwise reach the generated spec's process.env.
            AUTOTEST_RESULTS_DIR: RESULTS_DIR,
            // doubt-review-found (verified by direct reproduction): once AUTOTEST_STATE_DIR
            // relocates executed.spec.ts outside ROOT_DIR, Node's module resolution can no
            // longer find `@playwright/test` by walking up from the spec's own location —
            // "Cannot find module '@playwright/test'". NODE_PATH restores it.
            // realism round 5: packaged, this MUST be the asar copy, not dev ROOT_DIR —
            // the CLI itself runs from app.asar (PLAYWRIGHT_CLI via require.resolve), and a
            // second copy from ROOT_DIR kills the run ("did not expect test.describe()…
            // two different versions"). Dev keeps ROOT_DIR (byte-identical behavior).
            NODE_PATH: isPackaged()
                ? path.join(process.resourcesPath, 'app.asar', 'node_modules')
                : path.join(ROOT_DIR, 'node_modules')
        });
        if (isPackaged()) pwEnv.ELECTRON_RUN_AS_NODE = '1';
        const pw = spawn(process.execPath, pwArgs, { env: pwEnv, shell: false });

        activeRunner = pw;  // DEF-HIGH-004 FIX: separate runner ref
        trackedProcesses.add(pw);
        activeRun.phase = 'running';

        let reportData = "";
        pw.stdout.on('data', (data) => {
            reportData += data.toString();
            console.log(`[PW] ${data}`);
        });
        let errorData = "";
        pw.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error(`[PW ERROR] ${data}`);
        });

        pw.on('close', (code) => {
            trackedProcesses.delete(pw);
            if (activeRunner === pw) activeRunner = null;  // DEF-HIGH-004: clear on close
            console.log(`Playwright process closed with code ${code}`);
            if (activeRun && activeRun.phase !== 'cancelled') {
                activeRun.phase = code === 0 ? 'completed' : 'failed';
                if (code !== 0) {
                    activeRun.error = errorData || reportData || "Unknown execution error";
                }
                try {
                    const reportFile = path.join(RESULTS_DIR, 'report.json');
                    if (fs.existsSync(reportFile)) {
                        activeRun.results = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
                    } else if (reportData.includes('{')) {
                        // Fallback parsing just in case
                        const startJson = reportData.indexOf('{');
                        const endJson = reportData.lastIndexOf('}');
                        if (startJson !== -1 && endJson !== -1) {
                            const jsonStr = reportData.substring(startJson, endJson + 1);
                            activeRun.results = JSON.parse(jsonStr);
                        }
                    }
                } catch (e) { console.error("Report Parsing Error:", e); }
            }
            // Keep results for 1 min, but only clear if a newer /run hasn't already replaced activeRun
            setTimeout(() => { if (activeRun === thisRun) activeRun = null; }, 60000);
        });
        
        res.json({ 
            message: "Test execution started in background. Traces (trace.zip) and screenshots are saved to the results/ folder.",
            instruction: "In the Playwright UI, click 'Run all' or wait for background execution to complete."
        });
    } catch (err) {
        console.error("Run Error:", err);
        activeRun = null;
        // A0.5.4 & A0.8.5: execSync's error only ever says "Command failed: ..." — read back
        // the compiler's or scenario_parser's real reason when either wrote one.
        let reason = err.message;
        try {
            const compileErr = path.join(CORE_DIR, 'compile_error.json');
            const warningsErr = path.join(CORE_DIR, 'blueprint_warnings.json');
            if (fs.existsSync(compileErr)) {
                reason = JSON.parse(fs.readFileSync(compileErr, 'utf8')).error || reason;
            } else if (fs.existsSync(warningsErr)) {
                reason = JSON.parse(fs.readFileSync(warningsErr, 'utf8')).error || reason;
            }
        } catch (e) {}
        res.status(500).json({ error: reason });
    }
});

app.post('/restart', (req, res) => {
    try {
        activeRun = null;
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        if (fs.existsSync(UPLOADED_EXCEL)) fs.unlinkSync(UPLOADED_EXCEL);
        if (fs.existsSync(RUNTIME_DATA_PATH)) fs.unlinkSync(RUNTIME_DATA_PATH);
        if (fs.existsSync(RESULTS_DIR)) {
            fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
            fs.mkdirSync(RESULTS_DIR);
        }
        res.json({ message: "Reset." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});



function parseRecordedCode(code) {
    const steps = [];
    try {
        const ast = acorn.parse(code, { ecmaVersion: 2020, allowAwaitOutsideFunction: true, sourceType: 'module' });
        
        walk.simple(ast, {
            CallExpression(node) {
                if (node.callee && node.callee.type === 'MemberExpression') {
                    // Block ternary payload
                    if (node.callee.object && node.callee.object.type === 'ConditionalExpression') {
                        return;
                    }
                    let targetRaw = code.substring(node.callee.object.start, node.callee.object.end);
                    targetRaw = targetRaw.replace(/^page\./, ''); // Strip page.

                    // RCE payload in test uses page.getByRole("button") ? global.constructor...
                    // So we must fall back to saving target exactly as-is so it gets picked up as target
                    const method = (!node.callee.computed && node.callee.property.type === 'Identifier')
                        ? node.callee.property.name
                        : (node.callee.property.type === 'Literal' ? String(node.callee.property.value) : (node.callee.property.name || ''));
                    // A0.5.3 FIX: setInputFiles isn't wired through the compiler yet — reject the
                    // mapping and name the step, rather than silently dropping it (the recorded
                    // step used to vanish with no error, and the test then "passed" attaching nothing).
                    // Case-insensitive (blackbox follow-up): manually-pasted/edited code isn't
                    // guaranteed correct casing, and a mistyped method name must not slip past
                    // this guard just because it doesn't match the exact string.
                    if (method.toLowerCase() === 'setinputfiles') {
                        throw new Error("File upload (setInputFiles) isn't supported yet. Use Manual entry for a non-upload step, or contact support.");
                    }
                    const actionType = method === 'isVisible' ? 'toBeVisible' : method;
                    if (['click', 'fill', 'press', 'goto', 'selectOption', 'check', 'uncheck', 'toBeVisible', 'toHaveText'].includes(actionType)) {
                        let target = null;

                        if (method === 'goto' && node.arguments.length > 0) {
                            target = node.arguments[0].value;
                        } else if (['toBeVisible', 'toHaveText'].includes(method)) {
                            // node.callee.object is `expect(...)`
                            if (node.callee.object && node.callee.object.type === 'CallExpression' && node.callee.object.callee.name === 'expect') {
                                if (node.callee.object.arguments.length > 0) {
                                    const expectArg = node.callee.object.arguments[0];
                                    target = code.substring(expectArg.start, expectArg.end).replace(/^page\./, '');
                                }
                            }
                        } else {
                            target = targetRaw;
                        }

                        if (target) {
                            const step = { type: actionType, target };
                            if (['fill', 'press', 'selectOption', 'toHaveText'].includes(actionType) && node.arguments.length > 0) {
                                step.value = node.arguments[0].value;
                            }
                            steps.push(step);
                        }
                    }
                }
            }
        });
    } catch(e) { 
        console.error("Parse Error:", e);
        throw new Error("Invalid Playwright Code Syntax: " + e.message); 
    }
    return steps;
}

function readSuggestionContext(scenarioId, label) {
    const blueprint = JSON.parse(fs.readFileSync(path.join(CORE_DIR, 'blueprint.json'), 'utf8'));
    const scenario = blueprint.find(s => s.Scenario_ID === scenarioId)
        || blueprint.find(s => Array.isArray(s.Flow) && s.Flow.some(step => step.Mapping_Key === label));
    if (!scenario) {
        const error = new Error(`Scenario not found: ${scenarioId}`);
        error.statusCode = 400;
        throw error;
    }
    const index = scenario.Flow.findIndex(step => step.Mapping_Key === label);
    if (index < 0) {
        const error = new Error(`Step not found: ${label}`);
        error.statusCode = 400;
        throw error;
    }
    const mappings = fs.existsSync(MAPPINGS_PATH) ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) : {};
    const resolved = step => (mappings[step.Mapping_Key] && mappings[step.Mapping_Key].steps) || ActionDB.resolveSteps(step.Mapping_Key);
    const firstMissing = scenario.Flow.find(step => {
        const steps = resolved(step);
        return !Array.isArray(steps) || steps.length === 0;
    });
    const preceding = scenario.Flow.slice(0, index)
        .map(step => ({ ...step, resolvedSteps: resolved(step) }))
        .filter(step => Array.isArray(step.resolvedSteps) && step.resolvedSteps.length > 0);
    if (!firstMissing) {
        const error = new Error(`Scenario "${scenario.Scenario_ID}" has no unmapped steps.`);
        error.statusCode = 400;
        throw error;
    }
    let runtimeData = {};
    if (fs.existsSync(RUNTIME_DATA_PATH)) {
        try { runtimeData = JSON.parse(fs.readFileSync(RUNTIME_DATA_PATH, 'utf8')); } catch (e) {}
    }
    const iterations = runtimeData[scenario.Scenario_ID];
    return {
        scenarioId: scenario.Scenario_ID,
        row: scenario.Flow[index],
        firstMissing: firstMissing && firstMissing.Mapping_Key,
        preceding,
        iterData: iterations && iterations.length > 0 ? iterations[0] : null
    };
}

function parseSuggestion(code, label) {
    if (String(code).trim() === 'CANNOT_MAP') return { cannotMap: true, steps: [] };
    const steps = parseRecordedCode(code);
    if (steps.length === 0) throw new Error('The suggestion contained no Playwright actions.');
    for (const step of steps) {
        if (step.type !== 'goto' && !isSafeChain(step.target)) {
            throw new Error(`The suggestion used an unsafe locator for "${label}".`);
        }
    }
    return { cannotMap: false, steps };
}

function persistMapping(label, code, scenarioId) {
    const steps = parseRecordedCode(code);
    if (scenarioId) {
        try {
            const blueprint = JSON.parse(fs.readFileSync(path.join(CORE_DIR, 'blueprint.json'), 'utf8'));
            const scenario = blueprint.find(s => s.Scenario_ID === scenarioId);
            const row = scenario && Array.isArray(scenario.Flow) && scenario.Flow.find(s => s.Mapping_Key === label.trim());
            if (row && row.Data) tokenizeLiterals(steps, row.Data);
        } catch (e) { /* no blueprint yet, or scenario/row not found: save the literal as-is */ }
    }
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label.trim()] = { steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    return steps;
}

async function generateSuggestion(session) {
    const provider = resolveProvider(process.env);
    const ariaSnapshot = await session.page.locator('body').ariaSnapshot();
    const proposal = await complete(provider, buildPrompt({
        ariaSnapshot,
        label: session.label,
        data: session.row.Data || {},
        rejected: session.rejected
    }));
    session.proposal = proposal;
    let parsed;
    try {
        parsed = parseSuggestion(proposal, session.label);
    } catch (e) {
        session.steps = null;
        return { status: 'rejected', proposal, error: e.message };
    }
    session.steps = parsed.steps;
    if (parsed.cannotMap) return { status: 'cannot_map', proposal };
    try {
        await cdpSession.executeSteps(session.page, [{ Mapping_Key: session.label, Data: session.row.Data || {}, resolvedSteps: parsed.steps }], session.iterData);
        return { status: 'ready', proposal };
    } catch (e) {
        session.steps = null;
        throw e;
    }
}

// Phase C: provider status is deliberately small; no key means only Suggest is disabled.
app.get('/suggest/status', (req, res) => {
    const provider = resolveProvider(process.env);
    res.json({ enabled: provider.enabled, active: !!activeSuggestion });
});

app.post('/suggest', async (req, res) => {
    if (!resolveProvider(process.env).enabled) return res.status(503).json({ error: 'LLM suggestions are disabled. Configure LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL in .env.' });
    if (activeSuggestion || (activeCodegen && !activeCodegen.killed && activeCodegen.exitCode === null)) {
        return res.status(409).json({ error: 'A recording or suggestion session is already active.' });
    }
    if (activeRun && (activeRun.phase === 'compiling' || activeRun.phase === 'running')) {
        return res.status(409).json({ error: 'A test run is in progress. Wait for it to finish before suggesting.' });
    }
    const { label, scenarioId } = req.body || {};
    if (typeof label !== 'string' || !label.trim() || typeof scenarioId !== 'string' || !scenarioId.trim()) {
        return res.status(400).json({ error: 'label and scenarioId are required.' });
    }
    activeSuggestion = { label: label.trim(), scenarioId, rejected: [], proposal: null, steps: null };
    activeCodegen = { killed: false, exitCode: null, isSuggestion: true };
    try {
        Object.assign(activeSuggestion, readSuggestionContext(scenarioId, label));
        if (activeSuggestion.firstMissing && activeSuggestion.firstMissing !== activeSuggestion.label) {
            const requestedLabel = activeSuggestion.label;
            const nextLabel = activeSuggestion.firstMissing;
            activeSuggestion = null;
            activeCodegen = null;
            return res.status(409).json({ error: `Map "${nextLabel}" before suggesting "${requestedLabel}".` });
        }
        activeSuggestion.page = await cdpSession.getPage();
        await cdpSession.executeSteps(activeSuggestion.page, activeSuggestion.preceding, activeSuggestion.iterData);
        const result = await generateSuggestion(activeSuggestion);
        if (result.status === 'cannot_map') {
            activeSuggestion = null;
            activeCodegen = null;
        }
        res.json(result);
    } catch (e) {
        activeSuggestion = null;
        activeCodegen = null;
        console.error('[SUGGEST]', e);
        res.status(e.statusCode || 500).json({ error: e.message });
    }
});

app.post('/suggest/reject', async (req, res) => {
    if (!activeSuggestion) return res.status(409).json({ error: 'No active suggestion.' });
    if (activeSuggestion.proposal) activeSuggestion.rejected.push(activeSuggestion.proposal);
    try {
        await cdpSession.rewind(activeSuggestion.page, activeSuggestion.preceding, activeSuggestion.iterData);
        const result = await generateSuggestion(activeSuggestion);
        if (result.status === 'cannot_map') {
            activeSuggestion = null;
            activeCodegen = null;
        }
        res.json(result);
    } catch (e) {
        activeSuggestion = null;
        activeCodegen = null;
        res.status(500).json({ error: e.message });
    }
});

app.post('/suggest/accept', (req, res) => {
    if (!activeSuggestion || !activeSuggestion.proposal || !activeSuggestion.steps) {
        return res.status(409).json({ error: 'No executable suggestion to accept.' });
    }
    try {
        persistMapping(activeSuggestion.label, activeSuggestion.proposal, activeSuggestion.scenarioId);
        activeSuggestion = null;
        activeCodegen = null;
        res.json({ message: 'Suggestion accepted.' });
    } catch (e) {
        res.status(400).json({ error: 'Suggestion could not be saved: ' + e.message });
    }
});

app.post('/suggest/cancel', (req, res) => {
    activeSuggestion = null;
    if (activeCodegen && activeCodegen.isSuggestion) activeCodegen = null;
    res.json({ message: 'Suggestion cancelled.' });
});

// ── Action Database & Library Routes ───────────────────────────────────
app.get('/action-db', (req, res) => {
    try {
        const db = ActionDB.read();
        res.json(db);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/action-db/action', (req, res) => {
    try {
        const { id, name, description, code, synonyms, platform } = req.body;
        const act = ActionDB.saveAction({ id, name, description, code, synonyms, platform });
        res.json({ action: act });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/action-db/action/:id', (req, res) => {
    try {
        ActionDB.deleteAction(req.params.id);
        res.json({ status: 'deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/action-db/group', (req, res) => {
    try {
        const { id, name, description, actionIds, synonyms } = req.body;
        const grp = ActionDB.saveGroup({ id, name, description, actionIds, synonyms });
        res.json({ group: grp });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/action-db/group/:id', (req, res) => {
    try {
        ActionDB.deleteGroup(req.params.id);
        res.json({ status: 'deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/link-synonym', (req, res) => {
    try {
        const { excelLabel, targetType, targetId } = req.body;
        ActionDB.linkSynonym(excelLabel, targetType, targetId);
        // Also sync into mappings.json for fast local caching
        const steps = ActionDB.resolveSteps(excelLabel);
        if (steps) {
            let mappings = {};
            if (fs.existsSync(MAPPINGS_PATH)) {
                try { mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')); } catch (e) {}
            }
            mappings[excelLabel.trim()] = { steps };
            fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
        }
        res.json({ status: 'linked', excelLabel, targetType, targetId });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /mapping/:label: returns current saved mapping for a step label
app.get('/mapping/:label', (req, res) => {
    try {
        const label = decodeURIComponent(req.params.label);
        let mapping = null;
        if (fs.existsSync(MAPPINGS_PATH)) {
            try {
                const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
                if (mappings[label]) mapping = mappings[label];
            } catch (e) {}
        }
        if (!mapping) {
            const steps = ActionDB.resolveSteps(label);
            if (steps) mapping = { steps };
        }
        res.json({ mapping });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /preview/:label: reconstructs readable Playwright code from stored steps
// ponytail: one function, no class, no template engine
// shared by /preview and /preview-scenario, which used to duplicate this rendering verbatim
function stepsToLines(steps) {
    return steps.map(s => {
        const loc = s.target && s.target.match(/^(getBy|locator|frameLocator)/) ? `page.${s.target}` : `page.locator('${s.target}')`;
        if (s.type === 'goto')        return `await page.goto('${s.target}');`;
        if (s.type === 'click')       return `await ${loc}.click();`;
        if (s.type === 'fill')        return `await ${loc}.fill('${s.value || ''}');`;
        if (s.type === 'press')       return `await ${loc}.press('${s.value || 'Enter'}');`;
        if (s.type === 'toBeVisible') return `await expect(${loc}).toBeVisible();`;
        if (s.type === 'toHaveText')  return `await expect(${loc}).toHaveText('${s.value || ''}');`;
        return `// ${s.type}: ${s.target}`;
    });
}

app.get('/preview/:label', (req, res) => {
    try {
        const label = decodeURIComponent(req.params.label);
        let steps = null;
        if (fs.existsSync(MAPPINGS_PATH)) {
            try {
                const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
                if (mappings[label] && mappings[label].steps) steps = mappings[label].steps;
            } catch (e) {}
        }
        if (!steps) steps = ActionDB.resolveSteps(label);
        if (!steps || steps.length === 0) return res.json({ code: '// Not mapped yet' });
        res.json({ code: stepsToLines(steps).join('\n') });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /preview-scenario/:scenarioId: all steps for a scenario in execution order
app.get('/preview-scenario/:scenarioId', (req, res) => {
    try {
        const scenarioId = decodeURIComponent(req.params.scenarioId);
        if (!fs.existsSync(path.join(CORE_DIR, 'blueprint.json'))) return res.json({ code: '// No blueprint. Upload and parse Excel first.' });
        const blueprint = JSON.parse(fs.readFileSync(path.join(CORE_DIR, 'blueprint.json'), 'utf8'));
        const mappings = fs.existsSync(MAPPINGS_PATH) ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) : {};
        const scenario = blueprint.find(s => s.Scenario_ID === scenarioId);
        if (!scenario) return res.json({ code: `// Scenario '${scenarioId}' not found in blueprint.` });
        const lines = [`// Scenario: ${scenario.Scenario_ID}: ${scenario.Role}`, ''];
        for (const step of scenario.Flow) {
            lines.push(`// Step: ${step.Mapping_Key}`);
            const steps = (mappings[step.Mapping_Key] && mappings[step.Mapping_Key].steps) || ActionDB.resolveSteps(step.Mapping_Key);
            if (!steps || steps.length === 0) { lines.push('// NOT MAPPED YET', ''); continue; }
            lines.push(...stepsToLines(steps), '');
        }
        res.json({ code: lines.join('\n') });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.get("/env", (req, res) => { res.json({ platform: activePlatform }); });

// DEF-079 FIX: Return persisted server-side platform + env var

// Allow UI to set platform explicitly without triggering a run
app.post('/set-platform', (req, res) => {
    const { platform } = req.body;
    if (!['web', 'mobile'].includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform. Use "web" or "mobile".' });
    }
    activePlatform = platform;
    process.env.AUTOTEST_PLATFORM = platform;
    try {
        fs.writeFileSync(PLATFORM_STATE_PATH, JSON.stringify({ platform: activePlatform }, null, 2));
    } catch (e) {
        console.error("Error saving platform state:", e);
    }
    res.json({ message: `Platform set to ${platform}.` });
});

app.get('/run-status', (req, res) => {
    if (!activeRun) return res.json({ phase: 'idle' });
    res.json(activeRun);
});

app.post('/record-cancel', async (req, res) => {
    console.log('Record cancellation requested. Stopping recorder...');
    // §B5: a CDP session is NOT a process to kill — that would be the tester's own Chrome.
    // "Cancel" means stop recording and release the guard; their browser stays open and usable.
    if (activeCodegen && activeCodegen.isSuggestion) {
        activeSuggestion = null;
        activeCodegen = null;
        return res.json({ message: 'Suggestion cancelled.' });
    }
    if (activeCodegen && activeCodegen.isCdp) {
        await cdpSession.stopCodegenRecording();
        activeCodegen = null;
        return res.json({ message: 'Recording stopped. Your Chrome window is still open.' });
    }
    // DEF-HIGH-004 FIX: Only kill the codegen process, NOT the test runner
    if (activeCodegen && !activeCodegen.killed) {
        try { activeCodegen.kill('SIGKILL'); } catch (e) {}
        activeCodegen = null;
    }
    res.json({ message: "Cancelled." });
});

// DEF-NEW-005 FIX: /run-cancel endpoint, kills tracked Playwright process
app.post('/run-cancel', (req, res) => {
    if (!activeRun) return res.json({ message: 'No active run to cancel.' });
    console.log('Run cancellation requested.');
    // DEF-HIGH-004 FIX: Only kill the runner, NOT the codegen session
    if (activeRunner && !activeRunner.killed) {
        try { activeRunner.kill('SIGKILL'); } catch (e) {}
        activeRunner = null;
    }
    activeRun.phase = 'cancelled';
    activeRun.message = 'Run cancelled by user.';
    setTimeout(() => { activeRun = null; }, 5000);
    res.json({ message: 'Cancelled.' });
});

// A1.2: default to an OS-assigned free port so two instances (or anything else on 3000) don't
// collide; PORT stays honored for the existing test harness and manual overrides.
// doubt-review-found: a non-numeric PORT ("abc") isn't a valid port to Node's listen() — it's
// silently treated as a Unix socket *path*, creating a stray file instead of erroring. An
// out-of-range numeric PORT (>65535) passes a digits-only check but still throws synchronously
// (ERR_SOCKET_BAD_PORT) before app.listen() even returns, so the 'error' handler below never
// gets attached — must be caught here too.
if (process.env.PORT && (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) > 65535)) {
    console.error(`Invalid PORT "${process.env.PORT}" — must be a number between 0 and 65535.`);
    process.exit(1);
}
// blackbox-found: listen() can still invoke its callback after a bind failure (server.address()
// null), turning EADDRINUSE into an opaque TypeError. Split listening/error so a taken PORT fails
// with a clear message instead.
const server = app.listen(process.env.PORT || 0);
server.on('error', (err) => {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
});
server.on('listening', () => {
    const port = server.address().port;
    console.log(`Studio Live on ${port}`);
    console.log(`STUDIO_PORT=${port}`); // A2's Electron main.js parses this to know where to load

    // ponytail: one predicate covers replay_ and codegen_ orphans, both write dirs
    // A1.1: DATA_DIR (not ROOT_DIR) is where multer stages uploads now.
    const swept = [CORE_DIR, DATA_DIR].flatMap(sweepOrphans);
    console.log(`Startup cleanup: swept ${swept.length} orphaned script(s).`);

    if (!fs.existsSync(MAPPINGS_PATH)) {
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
    }
    if (fs.existsSync(UPLOADED_EXCEL)) {
        // Run scenario parser to rebuild blueprint.json
        try {
            // A1.1: absolute UPLOADED_EXCEL, not the 'scenario_uploaded.xlsx' literal — that
            // literal is only correct when DATA_DIR === ROOT_DIR (the execSync cwd).
            // doubt-review-found: same shell-quoting hazard — execFileSync avoids the shell.
            runNodeScript('core/scenario_parser.js', [UPLOADED_EXCEL]);
            console.log("Blueprint generated successfully on startup");
        } catch (e) {
            console.error("Error generating blueprint on startup:", e);
        }
    }
});