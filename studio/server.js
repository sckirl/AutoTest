// High-Security Banking Compliance: Strict DRIVERS/ Resolution
const fs = require('fs');
const path = require('path');
const DRIVERS_PATH = path.resolve(__dirname, '../DRIVERS/node_modules');
const MS_PLAYWRIGHT_PATH = path.resolve(__dirname, '../DRIVERS/ms-playwright');

if (fs.existsSync(DRIVERS_PATH)) {
    module.paths.unshift(DRIVERS_PATH);
    process.env.NODE_PATH = DRIVERS_PATH;
    process.env.PLAYWRIGHT_BROWSERS_PATH = MS_PLAYWRIGHT_PATH; // CRITICAL: Tell playwright EXACTLY where to look
    require('module').Module._initPaths();
}

const acorn = require('acorn');
const walk = require('acorn-walk');
const express = require('express');
const cors = require('cors');
const { exec, execSync, spawn } = require('child_process');
const multer = require('multer');
const XLSX = require('xlsx');

let activeRun = null;
let globalBrowser = null; 
let lastActivity = Date.now();
const trackedProcesses = new Set();
let activePlatform = 'web'; // DEF-079 FIX: server-side platform state

function cleanupAll() {
    console.log("\n🛑 Shutdown signal received. Killing all tracked processes...");
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

// Helper to detect bundled/portable browser
function getBundledBrowserPath() {
    const paths = [
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-win/chrome.exe'),
        path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-linux/chrome'),
        path.resolve(__dirname, '../bin/chrome-win/chrome.exe'),
        path.resolve(__dirname, '../bin/chrome-win/Chrome.exe')
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            console.log(`✅ FOUND bundled Chromium: ${p}`);
            return p;
        }
    }
    console.log(`⚠️ NO bundled browser found in DRIVERS/. Using system Playwright defaults.`);
    return null;
}

// Phase 1-C: Inactivity Timeout (10 minutes)
setInterval(() => {
    if (globalBrowser && (Date.now() - lastActivity > 600000)) {
        console.log("🕒 Inactivity timeout: Closing global browser...");
        globalBrowser.close().catch(() => {});
        globalBrowser = null;
    }
}, 60000);

function updateActivity() { lastActivity = Date.now(); }

// Phase 1-C: Process Cleanup Hook
process.on('exit', () => {
    if (globalBrowser) {
        try { globalBrowser.close(); } catch (e) {}
    }
});



const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const CORE_DIR = path.join(__dirname, '../core');
const RESULTS_DIR = path.join(__dirname, '../results');
const ROOT_DIR = path.join(__dirname, '../');
const MAPPINGS_PATH = path.join(CORE_DIR, 'mappings.json');
const UPLOADED_EXCEL = path.join(ROOT_DIR, 'scenario_uploaded.xlsx');
const RUNTIME_DATA_PATH = path.join(CORE_DIR, 'runtime_data.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ROOT_DIR),
    filename: (req, file, cb) => cb(null, 'scenario_uploaded.xlsx')
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));
app.post('/upload', upload.single('excel'), (req, res) => {
    if (fs.existsSync(RUNTIME_DATA_PATH)) fs.unlinkSync(RUNTIME_DATA_PATH);
    res.json({ message: "Uploaded." });
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
        
        const workbook = XLSX.readFile(UPLOADED_EXCEL);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rows.length < 2) {
             return res.status(400).json({ error: "Malformed Template: Excel file is empty or missing data rows." });
        }

        // Dynamic Header Detection
        const headers = rows[0].map(h => String(h || '').toLowerCase());
        const scenarioIdx = headers.findIndex(h => h.includes('scenario number') || h.includes('scenario id'));
        const labelIdx = headers.findIndex(h => h.includes('scenario name') || h.includes('label'));
        const testDataIdx = headers.findIndex(h => h.includes('test data'));

        if (scenarioIdx === -1 || labelIdx === -1) {
             return res.status(400).json({ error: "Malformed Template: Could not find 'Scenario Number' and 'Scenario Name' columns." });
        }
        
        const stepMap = new Map();
        const scenarios = [];
        const scenarioVariables = {};
        let currentScenario = null;

        // Hierarchical Parser: Detects A.1, A.2 and their steps
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][scenarioIdx] || "").trim();
            const label = String(rows[r][labelIdx] || "").trim();

            if (scenarioNum.match(/^(?!\d+$)[a-zA-Z0-9_.-]+$/)) {
                currentScenario = scenarioNum;
                scenarios.push(currentScenario);
                scenarioVariables[currentScenario] = new Set();
            } else if (currentScenario && scenarioNum.match(/^\d+$/) && label) {
                // This is a step within a scenario
                if (!stepMap.has(label)) {
                    stepMap.set(label, { 
                        label, 
                        status: mappings[label] ? 'mapped' : 'missing',
                        flows: [currentScenario],
                        scenarioId: currentScenario
                    });
                } else {
                    stepMap.get(label).flows.push(currentScenario);
                }

                // Harvest variables for this scenario
                if (mappings[label] && mappings[label].steps) {
                    for (const action of mappings[label].steps) {
                        const str = (action.target || "") + " " + (action.value || "");
                        const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g);
                        if (matches) {
                            matches.forEach(m => scenarioVariables[currentScenario].add(m.replace(/[{}]/g, '')));
                        }
                    }
                }
            }
        }

        // Convert Sets to Arrays for JSON
        for (const s of Object.keys(scenarioVariables)) {
            scenarioVariables[s] = Array.from(scenarioVariables[s]);
        }

        res.json({ steps: Array.from(stepMap.values()), scenarios, scenarioVariables });
    } catch (err) { 
        console.error("Scan Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// --- FIXED RECORDING ENDPOINT ---
// POST /record — launches playwright codegen (the actual recorder, NOT inspector)
// ponytail: spawn codegen with --output tmpfile; client polls /codegen-result/:id
app.post('/record', (req, res) => {
    const { label, url, scenarioId } = req.body;
    console.log(`\n🎬 Codegen launched for: "${label}" in scenario: "${scenarioId}"`);

    const sessionId = Date.now().toString();
    const outputPath = path.join(CORE_DIR, `codegen_${sessionId}.js`);
    const bundledPath = getBundledBrowserPath();

    // Build the target URL: use provided url, fall back to about:blank
    const targetUrl = (url && url.startsWith('http')) ? url : 'about:blank';

    // Spawn codegen: opens a headed Chromium with live code recorder panel.
    // --output writes the generated Playwright code to a file when the browser is closed.
    // windowsHide:false ensures the browser window is actually visible on Windows.
    const child = spawn('npx', ['playwright', 'codegen', targetUrl, '--output', outputPath], {
        env: {
            ...process.env,
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
            PLAYWRIGHT_BROWSERS_PATH: MS_PLAYWRIGHT_PATH,
            ...(bundledPath ? { BROWSER_PATH: bundledPath } : {})
        },
        shell: true,
        windowsHide: false,   // ponytail: MUST be false — this is what shows the GUI window
        detached: false
    });

    trackedProcesses.add(child);
    child.stdout.on('data', d => console.log(`[CODEGEN] ${d}`));
    child.stderr.on('data', d => {
        const msg = d.toString();
        // Filter noise — chromium startup warnings are expected
        if (!msg.includes('DevTools listening') && !msg.includes('GPU process')) {
            console.error(`[CODEGEN ERR] ${msg}`);
        }
    });
    child.on('close', code => {
        trackedProcesses.delete(child);
        console.log(`[CODEGEN] process closed (code ${code}), output: ${outputPath}`);
    });
    child.on('error', err => console.error('[CODEGEN SPAWN ERROR]', err.message));

    res.json({ sessionId, message: 'Codegen launched — record in the browser, then close it.' });
});

// GET /codegen-result/:sessionId — returns recorded code once codegen writes the file
// Client polls this every 1.5s after /record. File deleted after first read.
app.get('/codegen-result/:sessionId', (req, res) => {
    const outputPath = path.join(CORE_DIR, `codegen_${req.params.sessionId}.js`);
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
    const { label, code } = req.body;
    // DEF-NEW-003 FIX: Validate label — prevent empty/null key corruption in mappings.json
    if (!label || typeof label !== 'string' || label.trim() === '') {
        return res.status(400).json({ error: 'Invalid label: must be a non-empty string.' });
    }
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Invalid code: must be a non-empty string.' });
    }
    const steps = parseRecordedCode(code);
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label.trim()] = { steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: "Saved." });
});

// ... existing code ...

app.post('/run', async (req, res) => {
    const { workers, headless, platform } = req.body;

    if (platform === 'mobile') {
        try { require.resolve('webdriverio'); } catch (e) {
            return res.status(400).json({ error: "Missing Dependency: 'webdriverio' is not installed." });
        }
    }
    if (platform) {
        process.env.AUTOTEST_PLATFORM = platform;
        activePlatform = platform; // DEF-079 FIX: persist platform for /env
    }

    if (activeRun) {
        return res.status(409).json({ error: "Execution already in progress." });
    }
    try {
        activeRun = { phase: 'compiling' };
        const numWorkers = workers || 2;
        console.log("🚀 Generating blueprint...");
        execSync(`node core/scenario_parser.js ${UPLOADED_EXCEL}`, { stdio: 'inherit' });

        console.log("🔨 Compiling scenarios into explicit code...");
        execSync(`node core/compiler.js`, { stdio: 'inherit' });

        console.log(`🏃 Launching Playwright with ${numWorkers} workers...`);
        
        // Use headless from request body; default false (headed) for UAT evidence
        const isHeadless = headless ? '1' : '0';
        const bundledPath = getBundledBrowserPath();
        const pwArgs = ['playwright', 'test', 'core/executed.spec.ts', '--workers', String(numWorkers), '--reporter=json'];
        if (!headless) pwArgs.push('--headed');
        const pw = spawn('npx', pwArgs, {
            env: { 
                ...process.env, 
                PW_HEADLESS: isHeadless, 
                BROWSER_PATH: bundledPath || '',
                PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
                PLAYWRIGHT_BROWSERS_PATH: MS_PLAYWRIGHT_PATH,
                NODE_PATH: DRIVERS_PATH
            },
            shell: true
        });

        trackedProcesses.add(pw);

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
            console.log(`✅ Playwright process closed with code ${code}`);
            if (activeRun) {
                activeRun.phase = code === 0 ? 'completed' : 'failed';
                if (code !== 0) {
                    activeRun.error = errorData || reportData || "Unknown execution error";
                }
                try {
                    // Extract JSON report from stdout if possible
                    const startJson = reportData.indexOf('{');
                    const endJson = reportData.lastIndexOf('}');
                    if (startJson !== -1 && endJson !== -1) {
                        const jsonStr = reportData.substring(startJson, endJson + 1);
                        activeRun.results = JSON.parse(jsonStr);
                    }
                } catch (e) { console.error("Report Parsing Error:", e); }
            }
            setTimeout(() => { activeRun = null; }, 60000); // Keep results for 1 min
        });
        
        res.json({ 
            message: "Test execution started in background. Traces (trace.zip) and screenshots are saved to the results/ folder.",
            instruction: "In the Playwright UI, click 'Run all' or wait for background execution to complete."
        });
    } catch (err) {
        console.error("Run Error:", err);
        activeRun = null;
        res.status(500).json({ error: err.message });
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
                    const method = node.callee.property.name;
                    if (['click', 'fill', 'press', 'goto', 'selectOption', 'check', 'uncheck', 'toBeVisible', 'toHaveText'].includes(method)) {
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
                            const step = { type: method, target };
                            if (['fill', 'press', 'selectOption', 'toHaveText'].includes(method) && node.arguments.length > 0) {
                                step.value = node.arguments[0].value;
                            }
                            steps.push(step);
                        }
                    }
                }
            }
        });
    } catch(e) { console.error("Parse Error:", e); }
    return steps;
}

// GET /mapping/:label — returns current saved mapping for a step label
app.get('/mapping/:label', (req, res) => {
    try {
        const label = decodeURIComponent(req.params.label);
        if (!fs.existsSync(MAPPINGS_PATH)) return res.json({ mapping: null });
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        res.json({ mapping: mappings[label] || null });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /preview/:label — reconstructs readable Playwright code from stored steps
// ponytail: one function, no class, no template engine
app.get('/preview/:label', (req, res) => {
    try {
        const label = decodeURIComponent(req.params.label);
        if (!fs.existsSync(MAPPINGS_PATH)) return res.json({ code: '' });
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const mapping = mappings[label];
        if (!mapping) return res.json({ code: '// Not mapped yet' });
        const lines = mapping.steps.map(s => {
            const loc = s.target && s.target.match(/^(getBy|locator|frameLocator)/) ? `page.${s.target}` : `page.locator('${s.target}')`;
            if (s.type === 'goto')       return `await page.goto('${s.target}');`;
            if (s.type === 'click')      return `await ${loc}.click();`;
            if (s.type === 'fill')       return `await ${loc}.fill('${s.value || ''}');`;
            if (s.type === 'press')      return `await ${loc}.press('${s.value || 'Enter'}');`;
            if (s.type === 'toBeVisible') return `await expect(${loc}).toBeVisible();`;
            if (s.type === 'toHaveText') return `await expect(${loc}).toHaveText('${s.value || ''}');`;
            return `// ${s.type}: ${s.target}`;
        });
        res.json({ code: lines.join('\n') });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /preview-scenario/:scenarioId — all steps for a scenario in execution order
app.get('/preview-scenario/:scenarioId', (req, res) => {
    try {
        const scenarioId = decodeURIComponent(req.params.scenarioId);
        if (!fs.existsSync(path.join(CORE_DIR, 'blueprint.json'))) return res.json({ code: '// No blueprint. Upload and parse Excel first.' });
        const blueprint = JSON.parse(fs.readFileSync(path.join(CORE_DIR, 'blueprint.json'), 'utf8'));
        const mappings = fs.existsSync(MAPPINGS_PATH) ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) : {};
        const scenario = blueprint.find(s => s.Scenario_ID === scenarioId);
        if (!scenario) return res.json({ code: `// Scenario '${scenarioId}' not found in blueprint.` });
        const lines = [`// Scenario: ${scenario.Scenario_ID} — ${scenario.Role}`, ''];
        for (const step of scenario.Flow) {
            lines.push(`// Step: ${step.Mapping_Key}`);
            const m = mappings[step.Mapping_Key];
            if (!m) { lines.push('// ⚠️  NOT MAPPED YET', ''); continue; }
            for (const s of m.steps) {
                const loc = s.target && s.target.match(/^(getBy|locator|frameLocator)/) ? `page.${s.target}` : `page.locator('${s.target}')`;
                if (s.type === 'goto')        lines.push(`await page.goto('${s.target}');`);
                else if (s.type === 'click')  lines.push(`await ${loc}.click();`);
                else if (s.type === 'fill')   lines.push(`await ${loc}.fill('${s.value || ''}');`);
                else if (s.type === 'press')  lines.push(`await ${loc}.press('${s.value || 'Enter'}');`);
                else if (s.type === 'toBeVisible') lines.push(`await expect(${loc}).toBeVisible();`);
                else if (s.type === 'toHaveText')  lines.push(`await expect(${loc}).toHaveText('${s.value || ''}');`);
            }
            lines.push('');
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
    res.json({ message: `Platform set to ${platform}.` });
});

app.get('/run-status', (req, res) => {
    if (!activeRun) return res.json({ phase: 'idle' });
    res.json(activeRun);
});

app.post('/record-cancel', (req, res) => {
    console.log('🛑 Record cancellation requested. Closing inspector...');
    for (const proc of trackedProcesses) {
        try { proc.kill('SIGKILL'); } catch (e) {}
    }
    res.json({ message: "Cancelled." });
});

// DEF-NEW-005 FIX: /run-cancel endpoint — kills tracked Playwright process
app.post('/run-cancel', (req, res) => {
    if (!activeRun) return res.json({ message: 'No active run to cancel.' });
    console.log('🛑 Run cancellation requested.');
    for (const proc of trackedProcesses) {
        try { proc.kill('SIGKILL'); } catch (e) {}
    }
    activeRun.phase = 'cancelled';
    activeRun.message = 'Run cancelled by user.';
    setTimeout(() => { activeRun = null; }, 5000);
    res.json({ message: 'Cancelled.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Studio Live on ${port}`);

    // DEF-NEW-002 FIX: Startup cleanup — delete orphaned replay scripts from prior crashes
    const replayGlob = fs.readdirSync(ROOT_DIR).filter(f =>
        (f.startsWith('replay_') && (f.endsWith('.js') || f.endsWith('.spec.js')))
    );
    if (replayGlob.length > 0) {
        replayGlob.forEach(f => {
            try { fs.unlinkSync(path.join(ROOT_DIR, f)); } catch (e) {}
        });
        console.log(`🧹 Startup cleanup: removed ${replayGlob.length} orphaned replay script(s).`);
    }
});