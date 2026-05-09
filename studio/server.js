const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const CORE_DIR = path.join(__dirname, '../core');
const RESULTS_DIR = path.join(__dirname, '../results');
const ROOT_DIR = path.join(__dirname, '../');
const MAPPINGS_PATH = path.join(CORE_DIR, 'mappings.json');
const UPLOADED_EXCEL = path.join(ROOT_DIR, 'scenario_uploaded.xlsx');
const RUN_STATUS = {
    phase: 'idle',
    ok: true,
    message: 'Idle',
    updatedAt: new Date().toISOString()
};
let activeRecord = null;

function setRunStatus(phase, message, ok = true) {
    RUN_STATUS.phase = phase;
    RUN_STATUS.message = message;
    RUN_STATUS.ok = ok;
    RUN_STATUS.updatedAt = new Date().toISOString();
}

function runCommand(cmd, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, options);
        let stderr = '';

        child.stdout.on('data', (d) => console.log(`[${cmd}] ${String(d)}`));
        child.stderr.on('data', (d) => {
            const text = String(d);
            stderr += text;
            console.error(`[${cmd} ERROR] ${text}`);
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) return resolve();
            reject(new Error(`${cmd} exited with ${code}. ${stderr.trim()}`));
        });
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ROOT_DIR),
    filename: (req, file, cb) => cb(null, 'scenario_uploaded.xlsx')
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));
app.post('/upload', upload.single('excel'), (req, res) => res.json({ message: "Uploaded." }));
app.get('/run-status', (req, res) => res.json(RUN_STATUS));

app.get('/scan', (req, res) => {
    try {
        if (!fs.existsSync(MAPPINGS_PATH)) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        if (!fs.existsSync(UPLOADED_EXCEL)) return res.json({ steps: [] });
        
        const workbook = XLSX.readFile(UPLOADED_EXCEL);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const stepMap = new Map();
        const scenarios = [];
        let currentScenario = null;

        // Hierarchical Parser: Detects A.1, A.2 and their steps
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const label = String(rows[r][2] || "").trim();

            if (scenarioNum.match(/^[A-Z]\.\d+/)) {
                currentScenario = scenarioNum;
                scenarios.push(currentScenario);
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
            }
        }

        res.json({ steps: Array.from(stepMap.values()), scenarios });
    } catch (err) { 
        console.error("Scan Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// --- FIXED RECORDING ENDPOINT ---
app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    console.log(`\n🎬 Recording started for label: "${label}" in scenario: "${scenarioId}"`);
    if (activeRecord && !activeRecord.killed) {
        return res.status(409).json({
            error: "Another recording is already active. Close that recording browser first."
        });
    }
    
    try {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const workbook = XLSX.readFile(UPLOADED_EXCEL);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // 1. Generate Replay Script
        const replayScriptPath = path.join(ROOT_DIR, `replay_${Date.now()}.js`);
        let scriptContent = `const { chromium } = require('playwright');\n(async () => {\n`;
        scriptContent += `  console.log('🚀 Launching Browser...');\n`;
        scriptContent += `  const browser = await chromium.launch({ headless: false });\n`;
        scriptContent += `  const context = await browser.newContext();\n`;
        scriptContent += `  const page = await context.newPage();\n`;
        
        if (url) {
            scriptContent += `  await page.goto('${url}');\n`;
        }

        // Find steps for this scenario up to the current label
        let currentScen = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const stepLabel = String(rows[r][2] || "").trim();

            if (scenarioNum.match(/^[A-Z]\.\d+/)) {
                currentScen = scenarioNum;
            } else if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                if (stepLabel === label) break;
                
                if (mappings[stepLabel]) {
                    console.log(`   Replaying step: ${stepLabel}`);
                    for (const action of mappings[stepLabel].steps) {
                        const val = action.value || "";
                        const target = action.target;
                        
                        // Intelligent Locator String Generation
                        let locatorStr = "";
                        if (target.startsWith('getBy')) {
                            locatorStr = `page.${target}`;
                        } else {
                            locatorStr = `page.locator(\`${target}\`)`;
                        }

                        if (action.type === 'goto') scriptContent += `    await page.goto('${action.target}');\n`;
                        else if (action.type === 'click') scriptContent += `    await ${locatorStr}.click();\n`;
                        else if (action.type === 'fill') scriptContent += `    await ${locatorStr}.fill(\`${val}\`);\n`;
                        else if (action.type === 'press') scriptContent += `    await ${locatorStr}.press(\`${val || 'Enter'}\`);\n`;
                    }
                }
            }
        }
        
        scriptContent += `  console.log('--- REPLAY COMPLETE. INSPECTOR OPENING FOR: ${label} ---');\n`;
        scriptContent += `  await page.pause();\n`; 
        scriptContent += `  await browser.close();\n})();`;
        
        fs.writeFileSync(replayScriptPath, scriptContent);

        // 2. Execute the script with better logging
        const child = exec(`node ${replayScriptPath}`, (err, stdout, stderr) => {
            if (err) console.error(`❌ Execution Error: ${err.message}`);
            if (stderr) console.error(`⚠️ Stderr: ${stderr}`);
            console.log(`ℹ️ Stdout: ${stdout}`);
            if (fs.existsSync(replayScriptPath)) fs.unlinkSync(replayScriptPath);
            activeRecord = null;
        });
        activeRecord = child;

        res.json({ message: "Replay started. Look for the browser window." });
    } catch (err) {
        console.error("Record Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    if (!label || !code || !String(code).trim()) {
        return res.status(400).json({ error: "Label and code are required." });
    }
    const steps = parseRecordedCode(code);
    if (steps.length === 0) {
        return res.status(400).json({ error: "No valid steps parsed from submitted code." });
    }
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label] = { steps };
    try {
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
        res.json({ message: "Saved.", stepCount: steps.length });
    } catch (err) {
        res.status(500).json({ error: `Failed to save mapping: ${err.message}` });
    }
});

app.get('/mapping/:label', (req, res) => {
    try {
        const label = req.params.label;
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        return res.json({ label, mapping: mappings[label] || null });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ... existing code ...

app.post('/run', (req, res) => {
    const rawWorkers = Number(req.body?.workers);
    const workers = Number.isInteger(rawWorkers) && rawWorkers > 0 ? rawWorkers : 2;
    const fullyParallel = req.body?.fullyParallel === true;

    setRunStatus('queued', 'Run request accepted');
    res.json({
        message: "Run accepted. Follow /run-status for progress.",
        runtime: { workers, fullyParallel }
    });

    (async () => {
        try {
            setRunStatus('blueprint', 'Generating blueprint...');
            await runCommand('node', ['core/scenario_parser.js', UPLOADED_EXCEL], { cwd: ROOT_DIR, shell: true });

            setRunStatus('compile', 'Compiling executable spec...');
            await runCommand('node', ['core/compiler.js'], { cwd: ROOT_DIR, shell: true });

            setRunStatus('playwright', 'Launching Playwright UI...');
            const pw = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', '--ui', `--workers=${workers}`], {
                env: {
                    ...process.env,
                    PW_HEADLESS: '0',
                    AUTOTEST_FULLY_PARALLEL: fullyParallel ? '1' : '0',
                    AUTOTEST_WORKERS: String(workers)
                },
                shell: true,
                cwd: ROOT_DIR
            });
            pw.stdout.on('data', (data) => console.log(`[PW] ${data}`));
            pw.stderr.on('data', (data) => console.error(`[PW ERROR] ${data}`));
            pw.on('close', (code) => {
                setRunStatus(code === 0 ? 'completed' : 'failed', `Playwright UI process closed with code ${code}`, code === 0);
            });
        } catch (err) {
            console.error("Run Error:", err);
            setRunStatus('failed', `Run failed: ${err.message}`, false);
        }
    })();
});

app.post('/restart', (req, res) => {
    try {
        const clearMappings = req.body?.clearMappings === true;
        if (clearMappings) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        if (fs.existsSync(UPLOADED_EXCEL)) fs.unlinkSync(UPLOADED_EXCEL);
        if (fs.existsSync(RESULTS_DIR)) {
            fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
            fs.mkdirSync(RESULTS_DIR);
        }
        res.json({ message: clearMappings ? "Reset + mappings cleared." : "Reset run artifacts only." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

function parseRecordedCode(code) {
    const lines = code.split('\n');
    const steps = [];
    for (let line of lines) {
        line = line.trim();
        if (!line.includes('await')) continue;
        
        // Handle goto
        if (line.includes('.goto(')) {
            const m = line.match(/goto\(['"](.*?)['"]\)/);
            if (m) steps.push({ type: 'goto', target: m[1] });
            continue;
        }

        const locator = extractLocator(line);
        if (!locator) continue;

        if (line.includes('.click(') || line.includes('.dblclick(') || line.includes('.check(') || line.includes('.uncheck(')) {
            steps.push({ type: 'click', target: locator });
        } else if (line.includes('.fill(')) {
            const v = line.match(/\.fill\(['"](.*?)['"]\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[1] : "{{data}}" });
        } else if (line.includes('.selectOption(')) {
            const v = line.match(/\.selectOption\((['"`])(.*?)\1\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[2] : "{{data}}" });
        } else if (line.includes('.press(')) {
            const v = line.match(/\.press\(['"](.*?)['"]\)/);
            steps.push({ type: 'press', target: locator, value: v ? v[1] : "" });
        } else if (line.includes('.type(')) {
            const v = line.match(/\.type\(['"](.*?)['"]\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[1] : "{{data}}" });
        } else if (line.includes('.hover(')) {
            steps.push({ type: 'hover', target: locator });
        } else if (line.includes('.scrollIntoViewIfNeeded(')) {
            steps.push({ type: 'scrollIntoView', target: locator });
        } else if (line.includes('.toBeVisible(')) {
            steps.push({ type: 'verifyVisible', target: locator });
        } else if (line.includes('.toContainText(') || line.includes('.toHaveText(')) {
            const t = line.match(/to(?:ContainText|HaveText)\((['"`])(.*?)\1\)/);
            steps.push({ type: 'verifyText', target: locator, value: t ? t[2] : "" });
        }
    }
    return steps;
}

function extractLocator(line) {
    const actionMatch = line.match(/await\s+(page\..*?)\.(click|dblclick|check|uncheck|fill|type|press|hover|scrollIntoViewIfNeeded|selectOption|toBeVisible|toContainText|toHaveText)\(/);
    if (!actionMatch) return null;
    const locatorExpr = actionMatch[1];

    if (locatorExpr.startsWith('page.locator(')) {
        const m = locatorExpr.match(/^page\.locator\((['"`])([\s\S]*)\1\)$/);
        if (m) return m[2];
    }

    if (locatorExpr.startsWith('page.')) return locatorExpr.slice(5);
    return null;
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`🚀 Studio Live on ${PORT}`));
