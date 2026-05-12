const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec, execSync, spawn } = require('child_process');
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
        if (typeof payload !== 'object' || payload === null) return res.status(400).json({ error: "Invalid payload." });
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
        
        const stepMap = new Map();
        const scenarios = [];
        const scenarioVariables = {};
        let currentScenario = null;

        // Hierarchical Parser: Detects A.1, A.2 and their steps
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const label = String(rows[r][2] || "").trim();

            if (scenarioNum.match(/^[A-Z]\.\d+/)) {
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

app.post('/run', (req, res) => {
    try {
        const workers = req.body.workers || 2;
        console.log("🚀 Generating blueprint...");
        execSync(`node core/scenario_parser.js ${UPLOADED_EXCEL}`, { stdio: 'inherit' });
        
        console.log("🔨 Compiling scenarios into explicit code...");
        execSync(`node core/compiler.js`, { stdio: 'inherit' });

        console.log(`🏃 Launching Playwright UI with ${workers} workers...`);
        
        const pw = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', '--workers', String(workers), '--ui', '--trace', 'on'], {
            env: { ...process.env, PW_HEADLESS: '0' },
            shell: true
        });

        pw.stdout.on('data', (data) => console.log(`[PW] ${data}`));
        pw.stderr.on('data', (data) => console.error(`[PW ERROR] ${data}`));

        pw.on('close', (code) => {
            console.log(`✅ Playwright UI process closed with code ${code}`);
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

        if (line.includes('.click(')) {
            steps.push({ type: 'click', target: locator });
        } else if (line.includes('.fill(')) {
            const v = line.match(/\.fill\(['"](.*?)['"]\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[1] : "{{data}}" });
        } else if (line.includes('.press(')) {
            const v = line.match(/\.press\(['"](.*?)['"]\)/);
            steps.push({ type: 'press', target: locator, value: v ? v[1] : "" });
        } else if (line.includes('.type(')) {
            const v = line.match(/\.type\(['"](.*?)['"]\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[1] : "{{data}}" });
        }
    }
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

app.listen(3000, () => console.log('🚀 Studio Live on 3000'));