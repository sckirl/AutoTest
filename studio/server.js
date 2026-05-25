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

// Phase 1-C: Retry logic for shell commands
async function execWithRetry(cmd, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return execSync(cmd, { stdio: 'inherit' });
        } catch (e) {
            if (i === retries - 1) throw e;
            console.log(`⚠️ Command failed, retrying (${i + 1}/${retries})...`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

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

            if (scenarioNum.match(/^[A-Z](\.\d+)?$/)) {
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
app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    console.log(`\n🎬 Recording started for label: "${label}" in scenario: "${scenarioId}"`);
    
    try {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const workbook = XLSX.readFile(UPLOADED_EXCEL);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // 1. Generate Replay Script (Phase 1-B Hardening)
        const replayScriptPath = path.join(ROOT_DIR, `replay_${Date.now()}.spec.js`);
        const bundledPath = getBundledBrowserPath();

        let scriptContent = `const { test, expect } = require('@playwright/test');\n\n`;
        scriptContent += `test('Manual Mapping Replay', async ({ page }) => {\n`;
        scriptContent += `  console.log('🚀 Launching Browser via local playwright...');\n`;
        
        if (url) {
            scriptContent += `  await page.goto('${url}', { waitUntil: 'networkidle' });\n`;
        }

        // Find steps for this scenario up to the current label
        let currentScen = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const stepLabel = String(rows[r][2] || "").trim();

            if (scenarioNum.match(/^[A-Z](\.\d+)?$/)) {
                currentScen = scenarioNum;
            } else if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                if (stepLabel === label) break;
                
                if (mappings[stepLabel]) {
                    console.log(`   Replaying step: ${stepLabel}`);
                    for (const action of mappings[stepLabel].steps) {
                        const val = action.value || "";
                        const target = action.target;
                        
                        let locatorStr = "";
                        if (target.startsWith('getBy')) {
                            locatorStr = `page.${target}`;
                        } else {
                            locatorStr = `page.locator(\`${target}\`)`;
                        }

                        if (action.type === 'goto') scriptContent += `    await page.goto('${action.target}', { waitUntil: 'networkidle' });\n`;
                        else if (action.type === 'click') scriptContent += `    await Promise.all([page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle' }).catch(() => {}), page.${target}.click()]);\n`;
                        else if (action.type === 'fill') scriptContent += `    await ${locatorStr}.fill(\`${val}\`);\n`;
                        else if (action.type === 'press') scriptContent += `    await ${locatorStr}.press(\`${val || 'Enter'}\`);\n`;
                    }
                    scriptContent += `    await page.waitForTimeout(500);\n`;
                }
            }
        }
        
        scriptContent += `  await page.waitForLoadState('networkidle');\n`;
        scriptContent += `  console.log('--- REPLAY COMPLETE. INSPECTOR OPENING FOR: ${label} ---');\n`;
        scriptContent += `  await page.pause();\n`; 
        scriptContent += `});`;
        
        fs.writeFileSync(replayScriptPath, scriptContent);

        // 2. Execute the script via local playwright test (Strict Banking Block)
        const playwrightBin = path.resolve(DRIVERS_PATH, '.bin/playwright');

        if (!fs.existsSync(playwrightBin)) {
            return res.status(500).json({ error: "Banking Block Violation: Playwright binary not found in DRIVERS/ folder." });
        }

        const child = spawn(playwrightBin, ['test', replayScriptPath, '--headed'], {
            env: { 
                ...process.env, 
                BROWSER_PATH: bundledPath || '',
                PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
                PLAYWRIGHT_BROWSERS_PATH: MS_PLAYWRIGHT_PATH,
                NODE_PATH: DRIVERS_PATH
            },
            shell: true
        });

        trackedProcesses.add(child);

        child.stdout.on('data', (data) => console.log(`[RECORD] ${data}`));
        child.stderr.on('data', (data) => console.error(`[RECORD ERROR] ${data}`));

        child.on('close', () => {
            trackedProcesses.delete(child);
            if (fs.existsSync(replayScriptPath)) fs.unlinkSync(replayScriptPath);
        });

        res.json({ message: "Replay started. Look for the browser window." });
    } catch (err) {
        console.error("Record Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    const steps = parseRecordedCode(code);
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label] = { steps };
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
    if (platform) process.env.AUTOTEST_PLATFORM = platform;

    if (activeRun) {
        return res.status(409).json({ error: "Execution already in progress." });
    }
    try {
        activeRun = { phase: 'compiling' };
        const numWorkers = workers || 2;
        console.log("🚀 Generating blueprint...");
        await execWithRetry(`node core/scenario_parser.js ${UPLOADED_EXCEL}`);

        console.log("🔨 Compiling scenarios into explicit code...");
        await execWithRetry(`node core/compiler.js`);

        console.log(`🏃 Launching Playwright with ${numWorkers} workers...`);
        
        const isHeadless = req.body.headless ? '1' : '0';
        const bundledPath = getBundledBrowserPath();
        const playwrightBin = path.resolve(DRIVERS_PATH, '.bin/playwright');

        if (!fs.existsSync(playwrightBin)) {
            return res.status(500).json({ error: "Banking Block Violation: Playwright binary not found in DRIVERS/ folder." });
        }

        const pw = spawn(playwrightBin, ['test', 'core/executed.spec.ts', '--workers', String(numWorkers), '--reporter=json'], {
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
        pw.stderr.on('data', (data) => console.error(`[PW ERROR] ${data}`));

        pw.on('close', (code) => {
            trackedProcesses.delete(pw);
            console.log(`✅ Playwright process closed with code ${code}`);
            if (activeRun) {
                activeRun.phase = code === 0 ? 'completed' : 'failed';
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
            message: "Playwright UI launched. Check your local desktop for the Trace Viewer window.",
            instruction: "In the Playwright UI, click 'Run all' or select specific scenarios to see parallel execution."
        });
    } catch (err) {
        console.error("Run Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/restart', (req, res) => {
    try {
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
                    if (['click', 'fill', 'press', 'goto', 'selectOption'].includes(method)) {
                        let target = null;

                        // Extract target (e.g., page.locator('...'))
                        if (node.callee.object && node.callee.object.type === 'CallExpression') {
                            const calleeObj = node.callee.object;
                            if (calleeObj.callee && calleeObj.callee.property && ['locator', 'getByRole', 'getByLabel', 'getByPlaceholder', 'getByText', 'getByAltText', 'getByTitle', 'getByTestId'].includes(calleeObj.callee.property.name)) {
                               const type = calleeObj.callee.property.name;
                               target = targetRaw; // Use the raw parsed string instead
                               if (type === 'locator' && calleeObj.arguments.length > 0) {
                                   target = calleeObj.arguments[0].value;
                               } else if (calleeObj.arguments.length > 0) {
                                   target = `${type}(${calleeObj.arguments.map(a => JSON.stringify(a.value || a.name || (a.properties ? a.properties[0].key.name : ''))).join(', ')})`;
                               }
                            }
                        } else if (method === 'goto' && node.arguments.length > 0) {
                            target = node.arguments[0].value;
                        }

                        if (target) {
                            const step = { type: method, target };
                            if (['fill', 'press', 'selectOption'].includes(method) && node.arguments.length > 0) {
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

function extractLocator(line) {
    // Matches: page.locator('...'), page.getByRole('...', { ... }), etc.
    const m = line.match(/page\.(locator|getByRole|getByLabel|getByPlaceholder|getByText|getByAltText|getByTitle|getByTestId)\((.*?)\)/);
    if (!m) return null;
    
    const method = m[1];
    const args = m[2];
    
    if (method === 'locator') {
        // Strip quotes for simple locators
        return args.replace(/^['"`]|['"`]$/g, '');
    }
    
    // For getBy*, keep the full method call string (without 'page.')
    return `${method}(${args})`;
}


app.get('/env', (req, res) => { res.json({ platform: process.env.AUTOTEST_PLATFORM }); });

app.get('/run-status', (req, res) => {
    if (!activeRun) return res.json({ phase: 'idle' });
    res.json(activeRun);
});

app.post('/record-cancel', (req, res) => {
    res.json({ message: "Cancelled." });
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Studio Live on ${port}`));