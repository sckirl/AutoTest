const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ROOT_DIR),
    filename: (req, file, cb) => cb(null, 'scenario_uploaded.xlsx')
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));
app.post('/upload', upload.single('excel'), (req, res) => res.json({ message: "Uploaded." }));

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
        const headerRow = rows[0];

        // Advanced Parser: Supports A.1, B.1, C.1...
        for (let c = 1; c < headerRow.length; c++) {
            const id = String(headerRow[c] || "").trim();
            if (id.match(/^[A-Z]\.\d+/)) {
                scenarios.push({ id, col: c });
            }
        }

        scenarios.forEach(scen => {
            for (let r = 1; r < rows.length; r++) {
                const label = String(rows[r][0] || "").trim();
                const instruction = String(rows[r][scen.col] || "").trim();
                if (label && instruction && instruction !== 'null') {
                    // Shared Mapping Logic: If label exists, we track it globally
                    if (!stepMap.has(label)) {
                        stepMap.set(label, { 
                            label, 
                            instruction, 
                            status: mappings[label] ? 'mapped' : 'missing',
                            flows: [scen.id]
                        });
                    } else {
                        stepMap.get(label).flows.push(scen.id);
                    }
                }
            }
        });

        res.json({ steps: Array.from(stepMap.values()), scenarios: scenarios.map(s => s.id) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FIXED RECORDING ENDPOINT (Inspector-First) ---
app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    const rows = XLSX.utils.sheet_to_json(XLSX.readFile(UPLOADED_EXCEL).Sheets[XLSX.readFile(UPLOADED_EXCEL).SheetNames[0]], { header: 1 });
    const colIndex = rows[0].findIndex(h => String(h).trim() === scenarioId);

    // 1. Generate Replay Script for Chaining
    const replayScriptPath = path.join(ROOT_DIR, `replay_${Date.now()}.js`);
    let scriptContent = `const { chromium } = require('playwright');\n(async () => {\n`;
    scriptContent += `  const browser = await chromium.launch({ headed: true });\n`;
    scriptContent += `  const context = await browser.newContext();\n`;
    scriptContent += `  const page = await context.newPage();\n`;
    
    // Replay preceding steps
    for (let r = 1; r < rows.length; r++) {
        const stepLabel = String(rows[r][0] || "").trim();
        if (stepLabel === label) break;
        const instruction = String(rows[r][colIndex] || "").trim();
        if (stepLabel && instruction !== 'null' && mappings[stepLabel]) {
            for (const action of mappings[stepLabel].steps) {
                const val = action.value ? action.value.replace(/\{\{(.*?)\}\}/g, instruction) : "";
                if (action.type === 'goto') scriptContent += `    await page.goto('${action.target}');\n`;
                else if (action.type === 'click') scriptContent += `    await page.locator("${action.target}").click();\n`;
                else if (action.type === 'fill') scriptContent += `    await page.locator("${action.target}").fill("${val}");\n`;
            }
        }
    }
    
    scriptContent += `  console.log('--- REPLAY COMPLETE. INSPECTOR OPENING FOR: ${label} ---');\n`;
    scriptContent += `  await page.pause();\n`; // This triggers the Inspector window
    scriptContent += `  await browser.close();\n})();`;
    
    fs.writeFileSync(replayScriptPath, scriptContent);

    // 2. Execute the script (Non-blocking)
    exec(`node ${replayScriptPath}`, (err) => {
        if (fs.existsSync(replayScriptPath)) fs.unlinkSync(replayScriptPath);
    });

    res.json({ message: "Replay started. Inspector will open automatically." });
});

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    const steps = parseRecordedCode(code);
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label] = { steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: "Saved." });
});

app.post('/run', (req, res) => {
    exec('npx playwright test core/runner.spec.ts --headed');
    res.json({ message: "Running." });
});

app.post('/restart', (req, res) => {
    try {
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        if (fs.existsSync(UPLOADED_EXCEL)) fs.unlinkSync(UPLOADED_EXCEL);
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
        if (line.includes('.goto(')) {
            const m = line.match(/goto\(['"](.*?)['"]\)/);
            if (m) steps.push({ type: 'goto', target: m[1] });
        } else if (line.includes('.click()')) {
            const t = extractLocator(line);
            if (t) steps.push({ type: 'click', target: t });
        } else if (line.includes('.fill(')) {
            const t = extractLocator(line);
            const v = line.match(/\.fill\(['"](.*?)['"]\)/);
            if (t) steps.push({ type: 'fill', target: t, value: v ? v[1] : "{{data}}" });
        }
    }
    return steps;
}

function extractLocator(line) {
    const m = line.match(/page\.(locator|getByRole|getByLabel|getByPlaceholder|getByText|getByAltText|getByTitle|getByTestId)\((.*?)\)/);
    return m ? `${m[1]}(${m[2]})` : null;
}

app.listen(3000, () => console.log('🚀 Studio Live on 3000'));
