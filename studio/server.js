// High-Security Banking Compliance: Strict DRIVERS/ Resolution
const fs = require('fs');
const path = require('path');
const DRIVERS_PATH = path.resolve(__dirname, '../DRIVERS/node_modules');
const MS_PLAYWRIGHT_PATH = path.resolve(__dirname, '../DRIVERS/ms-playwright');

if (fs.existsSync(DRIVERS_PATH)) {
    module.paths.unshift(DRIVERS_PATH);
    process.env.NODE_PATH = DRIVERS_PATH;
    require('module').Module._initPaths();
}

const acorn = require('acorn');
const walk = require('acorn-walk');
const express = require('express');
const cors = require('cors');
const { exec, execSync, spawn } = require('child_process');
const XLSX = require('xlsx');
const multer = require('multer');

const pwPkgPath = require.resolve('@playwright/test/package.json');
const PLAYWRIGHT_CLI = path.join(path.dirname(pwPkgPath), 'cli.js');

let activeRun = null;
let globalBrowser = null; 
let lastActivity = Date.now();
const trackedProcesses = new Set(); // ponytail: still used for cleanupAll on exit
let activeCodegen = null;  // DEF-CRIT-001 FIX: single codegen guard
let activeRunner = null;   // DEF-HIGH-004 FIX: separate runner ref
let activePlatform = 'web';

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
app.use('/results', express.static(RESULTS_DIR));
const MAPPINGS_PATH = path.join(CORE_DIR, 'mappings.json');
const UPLOADED_EXCEL = path.join(ROOT_DIR, 'scenario_uploaded.xlsx');
const RUNTIME_DATA_PATH = path.join(CORE_DIR, 'runtime_data.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ROOT_DIR),
    filename: (req, file, cb) => cb(null, 'scenario_uploaded.xlsx')
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
            <h1>📁 AutoTest Studio: Results Directory Listing</h1>
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
                    <div class="folder-title">📁 ${dir}</div>
                    <ul class="file-list">
            `;
            if (files.length === 0) {
                html += `<li class="empty">No artifacts</li>`;
            } else {
                files.forEach(f => {
                    const ext = path.extname(f).toLowerCase();
                    const icon = ext === '.png' ? '📷' : ext === '.zip' ? '📦' : '📄';
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
    if (fs.existsSync(RUNTIME_DATA_PATH)) fs.unlinkSync(RUNTIME_DATA_PATH);
    if (req.body.keepMappings === 'false') {
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
    }
    // Regenerate blueprint.json immediately on upload so we have the steps mapping structure
    try {
        execSync(`node core/scenario_parser.js scenario_uploaded.xlsx`, { stdio: 'inherit', cwd: ROOT_DIR });
        console.log("✅ Blueprint generated successfully on upload");
    } catch (e) {
        console.error("⚠️ Error generating blueprint on upload:", e);
    }
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

        // Dynamic Header Detection across first 10 rows
        let headerRowIdx = -1;
        let scenarioIdx = -1, labelIdx = -1, testDataIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const headers = rows[i].map(h => String(h || '').toLowerCase());
            scenarioIdx = headers.findIndex(h => h.includes('scenario number') || h.includes('scenario id'));
            labelIdx = headers.findIndex(h => h.includes('scenario name') || h.includes('label'));
            testDataIdx = headers.findIndex(h => h.includes('test data'));
            if (scenarioIdx !== -1 && labelIdx !== -1) {
                headerRowIdx = i;
                break;
            }
        }

        if (headerRowIdx === -1) {
             return res.status(400).json({ error: "Malformed Template: Could not find 'Scenario Number' and 'Scenario Name' columns." });
        }
        
        const stepMap = new Map();
        const scenarios = [];
        const scenarioVariables = {};
        let currentScenario = null;

        // Hierarchical Parser: Detects A.1, A.2 and their steps
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][scenarioIdx] || "").trim();
            const label = String(rows[r][labelIdx] || "").trim();

            if (scenarioNum.match(/^(?!\d+$).+/)) {
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

app.post('/record', (req, res) => {
    // DEF-CRIT-001 FIX: Guard FIRST — before any computation. Sentinel is set synchronously.
    if (activeCodegen && !activeCodegen.killed) {
        return res.status(409).json({ error: 'A recording session is already active. Close the browser or click Cancel first.' });
    }
    activeCodegen = { killed: false }; // sentinel — blocks any concurrent request before spawn returns

    const { label, url, scenarioId } = req.body;
    console.log(`\n🎬 Codegen launched for: "${label}" in scenario: "${scenarioId}"`);

    const sessionId = Date.now().toString();
    const bundledPath = getBundledBrowserPath();

    // Replay logic check
    const blueprintPath = path.join(CORE_DIR, 'blueprint.json');
    let precedingSteps = [];
    let mappings = {};

    if (fs.existsSync(blueprintPath) && fs.existsSync(MAPPINGS_PATH)) {
        try {
            const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
            mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
            const scenario = blueprint.find(s => s.Scenario_ID === scenarioId);
            if (scenario) {
                const targetIdx = scenario.Flow.findIndex(step => step.Mapping_Key === label);
                if (targetIdx > 0) {
                    precedingSteps = scenario.Flow.slice(0, targetIdx);
                }
            }
        } catch (e) {
            console.error("Error reading blueprint/mappings during record:", e);
        }
    }

    if (precedingSteps.length > 0) {
        // We have preceding steps, so we do a replay
        let runtimeData = {};
        if (fs.existsSync(RUNTIME_DATA_PATH)) {
            try { runtimeData = JSON.parse(fs.readFileSync(RUNTIME_DATA_PATH, 'utf8')); } catch (e) {}
        }
        const iterations = runtimeData[scenarioId];
        const iterData = (iterations && iterations.length > 0) ? iterations[0] : null;

        const isSafeChain = (target) => {
            if (typeof target !== 'string') return null;
            if (!target.match(/^(getBy|locator|frameLocator)/)) return null;
            if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(target)) return null;
            return target;
        };

        const interpolate = (templateStr, iterData, fallbackObj) => {
            if (!templateStr) return "";
            let processedStr = String(templateStr);
            processedStr = processedStr.replace(/['"]\{([a-zA-Z0-9_]+)\}['"]/g, '{$1}');
            processedStr = processedStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
                let val = "";
                if (iterData && iterData[key] !== undefined && iterData[key] !== null && iterData[key] !== "") {
                    val = iterData[key];
                } else if (fallbackObj && fallbackObj[key] !== undefined && fallbackObj[key] !== null) {
                    val = fallbackObj[key];
                }
                return val;
            });
            return processedStr;
        };

        const q = (v) => JSON.stringify(String(v ?? ''));

        let replayCode = `import { test, expect } from '@playwright/test';\n\n`;
        replayCode += `test('Replay Scenario up to ${label.replace(/'/g, "\\'")}', async ({ page }) => {\n`;

        for (const step of precedingSteps) {
            const mapping = mappings[step.Mapping_Key];
            if (mapping) {
                replayCode += `  // Step: ${step.Mapping_Key}\n`;
                for (const action of mapping.steps) {
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
            }
        }

        replayCode += `  \n  // Pause to record next step:\n  await page.pause();\n`;
        replayCode += `});\n`;

        const replaySpecPath = path.join(CORE_DIR, `replay_${sessionId}.spec.ts`);
        fs.writeFileSync(replaySpecPath, replayCode);

        const child = spawn(process.execPath, [PLAYWRIGHT_CLI, 'test', replaySpecPath, '--headed'], {
            env: {
                ...process.env,
                PW_HEADLESS: '0',
                ...(bundledPath ? { 
                    BROWSER_PATH: bundledPath,
                    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
                    PLAYWRIGHT_BROWSERS_PATH: MS_PLAYWRIGHT_PATH
                } : {})
            },
            shell: false,
            windowsHide: false,
            detached: false
        });

        activeCodegen = child;
        trackedProcesses.add(child);
        child.stdout.on('data', d => console.log(`[REPLAY] ${d}`));
        child.stderr.on('data', d => {
            const msg = d.toString();
            if (!msg.includes('DevTools listening') && !msg.includes('GPU process')) {
                console.error(`[REPLAY ERR] ${msg}`);
            }
        });
        child.on('close', code => {
            trackedProcesses.delete(child);
            if (activeCodegen === child) activeCodegen = null;
            console.log(`[REPLAY] process closed (code ${code})`);
            try { fs.unlinkSync(replaySpecPath); } catch (e) {}
        });
        child.on('error', err => console.error('[REPLAY SPAWN ERROR]', err.message));

        return res.json({ sessionId, isReplay: true, message: 'Replay launched — preceding steps executing. Perform and copy new steps from Playwright Inspector.' });
    }

    // Otherwise, normal codegen:
    const outputPath = path.join(CORE_DIR, `codegen_${sessionId}.js`);
    const targetUrl = (url && url.startsWith('http')) ? url : 'about:blank';

    const child = spawn(process.execPath, [PLAYWRIGHT_CLI, 'codegen', targetUrl, '--output', outputPath], {
        env: {
            ...process.env,
            ...(bundledPath ? { 
                BROWSER_PATH: bundledPath,
                PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
                PLAYWRIGHT_BROWSERS_PATH: MS_PLAYWRIGHT_PATH
            } : {})
        },
        shell: false,
        windowsHide: false,
        detached: false
    });

    activeCodegen = child;
    trackedProcesses.add(child);
    child.stdout.on('data', d => console.log(`[CODEGEN] ${d}`));
    child.stderr.on('data', d => {
        const msg = d.toString();
        if (!msg.includes('DevTools listening') && !msg.includes('GPU process')) {
            console.error(`[CODEGEN ERR] ${msg}`);
        }
    });
    child.on('close', code => {
        trackedProcesses.delete(child);
        if (activeCodegen === child) activeCodegen = null;
        console.log(`[CODEGEN] process closed (code ${code}), output: ${outputPath}`);
    });
    child.on('error', err => console.error('[CODEGEN SPAWN ERROR]', err.message));

    res.json({ sessionId, isReplay: false, message: 'Codegen launched — record in the browser, then close it.' });
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
    try {
        const steps = parseRecordedCode(code);
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

    if (activeRun && (activeRun.phase === 'compiling' || activeRun.phase === 'running')) {
        return res.status(409).json({ error: "Execution already in progress." });
    }
    try {
        activeRun = { phase: 'compiling' };
        const numWorkers = workers || 2;
        console.log("🚀 Generating blueprint...");
        // DEF-CRIT-006 FIX: explicit cwd so paths resolve from project root, not studio/
        execSync(`node core/scenario_parser.js ${UPLOADED_EXCEL}`, { stdio: 'inherit', cwd: ROOT_DIR });

        console.log("🔨 Compiling scenarios into explicit code...");
        execSync(`node core/compiler.js`, { stdio: 'inherit', cwd: ROOT_DIR });

        console.log(`🏃 Launching Playwright with ${numWorkers} workers...`);
        
        // Use headless from request body; default false (headed) for UAT evidence
        const isHeadless = headless ? '1' : '0';
        const bundledPath = getBundledBrowserPath();
        const pwArgs = [PLAYWRIGHT_CLI, 'test', 'core/executed.spec.ts', '--workers', String(numWorkers), '--reporter=json'];
        if (!headless) pwArgs.push('--headed');
        const pw = spawn(process.execPath, pwArgs, {
            env: { 
                ...process.env, 
                PW_HEADLESS: isHeadless, 
                PLAYWRIGHT_JSON_OUTPUT_NAME: path.join(RESULTS_DIR, 'report.json'),
                ...(bundledPath ? {
                    BROWSER_PATH: bundledPath,
                    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
                    PLAYWRIGHT_BROWSERS_PATH: MS_PLAYWRIGHT_PATH
                } : {})
            },
            shell: false
        });

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
            console.log(`✅ Playwright process closed with code ${code}`);
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
    } catch(e) { 
        console.error("Parse Error:", e);
        throw new Error("Invalid Playwright Code Syntax: " + e.message); 
    }
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
    console.log('🛑 Record cancellation requested. Closing codegen...');
    // DEF-HIGH-004 FIX: Only kill the codegen process, NOT the test runner
    if (activeCodegen && !activeCodegen.killed) {
        try { activeCodegen.kill('SIGKILL'); } catch (e) {}
        activeCodegen = null;
    }
    res.json({ message: "Cancelled." });
});

// DEF-NEW-005 FIX: /run-cancel endpoint — kills tracked Playwright process
app.post('/run-cancel', (req, res) => {
    if (!activeRun) return res.json({ message: 'No active run to cancel.' });
    console.log('🛑 Run cancellation requested.');
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Studio Live on ${port}`);

    // DEF-NEW-002 FIX: Startup cleanup — delete orphaned replay scripts from prior crashes
    if (fs.existsSync(CORE_DIR)) {
        const replayGlob = fs.readdirSync(CORE_DIR).filter(f =>
            (f.startsWith('replay_') && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.spec.js') || f.endsWith('.spec.ts')))
        );
        if (replayGlob.length > 0) {
            replayGlob.forEach(f => {
                try { fs.unlinkSync(path.join(CORE_DIR, f)); } catch (e) {}
            });
            console.log(`🧹 Startup cleanup: removed ${replayGlob.length} orphaned replay script(s) in core/`);
        }
    }

    const rootReplayGlob = fs.readdirSync(ROOT_DIR).filter(f =>
        (f.startsWith('replay_') && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.spec.js') || f.endsWith('.spec.ts')))
    );
    if (rootReplayGlob.length > 0) {
        rootReplayGlob.forEach(f => {
            try { fs.unlinkSync(path.join(ROOT_DIR, f)); } catch (e) {}
        });
        console.log(`🧹 Startup cleanup: removed ${rootReplayGlob.length} orphaned replay script(s) in root`);
    }

    if (!fs.existsSync(UPLOADED_EXCEL)) {
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        console.log("🧹 Startup cleanup: scenario_uploaded.xlsx not found, cleared mappings.json");
    } else {
        // Run scenario parser to rebuild blueprint.json
        try {
            execSync(`node core/scenario_parser.js scenario_uploaded.xlsx`, { stdio: 'inherit', cwd: ROOT_DIR });
            console.log("✅ Blueprint generated successfully on startup");
        } catch (e) {
            console.error("⚠️ Error generating blueprint on startup:", e);
        }
    }
});