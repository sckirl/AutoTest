const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const CORE_DIR = path.join(__dirname, '../core');
const RESULTS_DIR = path.join(__dirname, '../results');
const ROOT_DIR = path.join(__dirname, '../');
const UPLOADS_DIR = path.join(ROOT_DIR, 'temp_uploads');
const MAPPINGS_PATH = path.join(CORE_DIR, 'mappings.json');
const PERSISTENCE_FILE = path.join(ROOT_DIR, '.last_run_status');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let RUN_STATUS = {
    phase: 'idle', ok: true, kind: 'idle', message: 'Idle',
    updatedAt: new Date().toISOString(), failureType: null, activeExcel: null
};

// --- PERSISTENT BROWSER ARCHITECTURE (Zero-Crash) ---
let globalBrowser = null;
let latestAutoRecordedCode = '';

async function getBrowser() {
    if (!globalBrowser || !globalBrowser.isConnected()) {
        console.log("🚀 Initializing Persistent Playwright Instance...");
        globalBrowser = await chromium.launch({ headless: false });
    }
    return globalBrowser;
}

function setRunStatus(phase, message, ok = true, kind = 'system', failureType = null) {
    RUN_STATUS.phase = phase; RUN_STATUS.message = message; RUN_STATUS.ok = ok;
    RUN_STATUS.kind = kind; RUN_STATUS.failureType = failureType;
    RUN_STATUS.updatedAt = new Date().toISOString();
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(RUN_STATUS, null, 2));
}

function safeGetBy(target) {
    if (typeof target !== 'string') return null;
    const m = target.match(/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\((.*)\)$/);
    if (!m) return null;
    const args = m[2];
    // DEF-053: Whitelist allowing essential enterprise locator symbols
    if (/[;+\-*\/%&|<>\!^~?]/.test(args) && !args.includes('{')) return null; 
    if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(args)) return null;
    return target;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `scenario_uploaded_${Date.now()}.xlsx`)
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));

app.post('/upload', upload.single('excel'), (req, res) => {
    if (!req.file || !req.file.path) return res.status(400).json({ error: 'No file.' });
    RUN_STATUS.activeExcel = req.file.path;
    setRunStatus('idle', 'Matrix uploaded: ' + req.file.originalname);
    res.json({ message: "Uploaded.", fileName: path.basename(req.file.path) });
});

app.get('/run-status', (req, res) => res.json(RUN_STATUS));

app.get('/recording-latest', (req, res) => {
    let code = latestAutoRecordedCode || '';
    if (code) {
        code = `import { test, expect } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n` + 
               code.split('\n').filter(l => l.trim()).map(l => '  ' + l).join('\n') + 
               `\n});`;
    }
    res.json({ code });
});

app.get('/scan', (req, res) => {
    try {
        const mappings = fs.existsSync(MAPPINGS_PATH) ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) : {};
        const excelPath = RUN_STATUS.activeExcel;
        if (!excelPath || !fs.existsSync(excelPath)) return res.json({ steps: [] });
        const workbook = XLSX.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const stepMap = new Map();
        let currentScenario = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const label = String(rows[r][2] || "").trim();
            // [DEF-070] Robust Regex for Stress-Test Scenario IDs (S.100 etc)
            if (scenarioNum.match(/^[A-Z]+\.\d+/)) currentScenario = scenarioNum;
            else if (currentScenario && scenarioNum.match(/^\d+$/) && label) {
                if (!stepMap.has(label)) {
                    stepMap.set(label, { label, status: mappings[label] ? 'mapped' : 'missing', scenarioId: currentScenario });
                }
            }
        }
        res.json({ steps: Array.from(stepMap.values()) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    try {
        latestAutoRecordedCode = '';
        const browser = await getBrowser();
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Define resolveTarget in-page for the replay
        const mappings = fs.existsSync(MAPPINGS_PATH) ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) : {};
        const excelPath = RUN_STATUS.activeExcel;
        
        const resolveAndRun = async (action) => {
            let locator;
            const target = action.target;
            if (target.startsWith('getBy')) {
                const m = target.match(/^(getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue))\((.*)\)$/s);
                const method = m[1]; const raw = m[2];
                try {
                    const args = JSON.parse('[' + raw.replace(/'/g, '\"') + ']');
                    locator = page[method](...args);
                } catch(_) { locator = page.locator(target); }
            } else {
                locator = page.locator(target);
            }
            if (action.type === 'goto') await page.goto(target);
            else if (action.type === 'click') await locator.click();
            else if (action.type === 'fill') await locator.fill(action.value || "");
        };

        if (url) await page.goto(url);

        // REPLAY PRECEDING STEPS
        const workbook = XLSX.readFile(excelPath);
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        let currentScen = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const stepLabel = String(rows[r][2] || "").trim();
            if (scenarioNum.match(/^[A-Z]+\.\d+/)) currentScen = scenarioNum;
            if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                if (stepLabel === label) break;
                if (mappings[stepLabel]) {
                    for (const action of mappings[stepLabel].steps) {
                        await resolveAndRun(action);
                    }
                }
            }
        }

        // INJECT RECORDING SCRIPT (DEF-065 & DEF-068 & DEF-072)
        await page.exposeBinding('__autotestRecord', async (_, line) => {
            latestAutoRecordedCode += line + '\n';
        });

        await page.evaluate(() => {
            const rec = (line) => window.__autotestRecord(line).catch(() => {});
            const getBestSelector = (el) => {
                const closestInt = el.closest('button, a, input, select, [role="button"]');
                const target = closestInt || el;
                if (target.getAttribute('data-testid')) return 'page.getByTestId(' + JSON.stringify(target.getAttribute('data-testid')) + ')';
                if (target.id) return 'page.locator("#' + target.id + '")';
                if (target.tagName === 'BUTTON' && target.innerText.trim()) return 'page.getByRole("button", { name: ' + JSON.stringify(target.innerText.trim()) + ' })';
                if (target.tagName === 'A' && target.innerText.trim()) return 'page.getByRole("link", { name: ' + JSON.stringify(target.innerText.trim()) + ' })';
                if (target.getAttribute('name')) return 'page.locator("[name=\\"' + target.getAttribute('name') + '\\"]")';
                return 'page.locator(' + JSON.stringify(target.nodeName.toLowerCase() + (target.className && typeof target.className === 'string' ? '.' + target.className.split(' ')[0] : '')) + ')';
            };
            document.addEventListener('click', (e) => {
                const sel = getBestSelector(e.target);
                if (e.altKey) rec('await expect(' + sel + ').toBeVisible();');
                else rec('await ' + sel + '.click();');
            }, true);
            // [DEF-068] Input listener for real-time capture
            document.addEventListener('input', (e) => {
                const t = e.target; if (!t || !('value' in t)) return;
                const sel = getBestSelector(t);
                rec('await ' + sel + '.fill(' + JSON.stringify(String(t.value || '')) + ');');
            }, true);
        });

        res.json({ message: "Recording active in new tab." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/record-cancel', (req, res) => {
    // In persistent mode, we don't kill the browser, we just expect user to close the tab.
    res.json({ message: "Cancelled." });
});

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    const lines = code.split('\n');
    const steps = [];
    for (let line of lines) {
        line = line.trim();
        if (!line.includes('await') || line.includes('import ') || line.includes('test(')) continue;
        if (line.includes('.click(')) {
            const m = line.match(/page\.(.*?)\)\.click/);
            if (m) steps.push({ type: 'click', target: m[1] + ')' });
        } else if (line.includes('.fill(')) {
            const m = line.match(/page\.(.*?)\)\.fill\((['"`])(.*?)\2\)/);
            if (m) steps.push({ type: 'fill', target: m[1] + ')', value: m[3] });
        } else if (line.includes('.toBeVisible(')) {
            const m = line.match(/expect\(page\.(.*?)\)\)\.toBeVisible/);
            if (m) steps.push({ type: 'verifyVisible', target: m[1] + ')' });
        }
    }
    const mappings = fs.existsSync(MAPPINGS_PATH) ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8')) : {};
    mappings[label] = { steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: "Saved." });
});

app.post('/run', (req, res) => {
    if (activeRun) return res.status(409).json({ error: 'Run in progress.' });
    activeRun = { process: null };
    const workers = req.body.workers || 4;
    setRunStatus('queued', 'Starting...');
    (async () => {
        try {
            const child = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', `--workers=${workers}`, '--headed'], { cwd: ROOT_DIR, env: { ...process.env, PW_HEADLESS: '0' } });
            activeRun.process = child;
            child.on('close', (code) => { 
                setRunStatus(code === 0 ? 'completed' : 'failed', code === 0 ? 'Success' : 'Fail');
                activeRun = null;
            });
        } catch (err) { setRunStatus('failed', err.message); activeRun = null; }
    })();
    res.json({ message: "Run accepted." });
});

app.post('/restart', (req, res) => {
    if (fs.existsSync(MAPPINGS_PATH)) fs.writeFileSync(MAPPINGS_PATH, '{}');
    if (fs.existsSync(RESULTS_DIR)) fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
    fs.mkdirSync(RESULTS_DIR);
    res.json({ message: "Reset." });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Studio Live on ${PORT}`));
