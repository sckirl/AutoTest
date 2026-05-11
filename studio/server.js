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
let globalContext = null;
let contextLock = false; // DEF-073
let activeRecordSessions = {}; // DEF-074: Maps sessionId -> { page, code }
let activeRun = null;

async function getContext() {
    while (contextLock) await new Promise(r => setTimeout(r, 100));
    
    // Check if context exists AND if the underlying browser is still connected
    let isConnected = false;
    try {
        if (globalContext && globalContext.browser()) {
            isConnected = globalContext.browser().isConnected();
        }
    } catch (_) {
        isConnected = false;
    }

    if (!globalContext || !isConnected) {
        contextLock = true;
        try {
            console.log("🚀 Initializing Persistent Playwright Context (Self-Healing)...");
            const userDataDir = path.join(ROOT_DIR, '.pw_data');
            globalContext = await chromium.launchPersistentContext(userDataDir, { 
                headless: false, 
                bypassCSP: true 
            });
            
            // Nullify on close to trigger re-init on next request
            globalContext.on('close', () => {
                console.log("⚠️ Persistent Context Closed.");
                globalContext = null;
            });
        } finally {
            contextLock = false;
        }
    }
    return globalContext;
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
    if (!/^(['"`])[a-zA-Z0-9\s\-#\.\:\{\},\[\]\=_\/]*\1$/.test(args.trim())) return null;
    if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(args)) return null;
    return target;
}

function getCurrentExcelPath() {
    return RUN_STATUS.activeExcel;
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
    const sessionId = req.query.sessionId;
    let code = (sessionId && activeRecordSessions[sessionId]) ? activeRecordSessions[sessionId].code : '';
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
    const { label, url, scenarioId, sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID required." });

    // DEF-076: Close previous recording page if it exists for this session
    if (activeRecordSessions[sessionId] && activeRecordSessions[sessionId].page) {
        try { await activeRecordSessions[sessionId].page.close(); } catch(_) {}
    }

    try {
        activeRecordSessions[sessionId] = { code: '', page: null };
        if (!fs.existsSync(MAPPINGS_PATH)) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const excelPath = RUN_STATUS.activeExcel;
        
        if (!excelPath || !fs.existsSync(excelPath)) {
            return res.status(400).json({ error: "No active matrix. Please upload an Excel file first." });
        }

        const context = await getContext(); // DEF-073 Safe now
        const page = await context.newPage();
        activeRecordSessions[sessionId].page = page;

        // DEF-076: Handle ghost tabs if user closes them manually
        page.on('close', () => {
            if (activeRecordSessions[sessionId]) activeRecordSessions[sessionId].page = null;
        });

        // Resolvers inside Node
        const resolveAndRun = async (action) => {
            let locator;
            const target = action.target;
            if (target.startsWith('getBy')) {
                const m = target.match(/^(getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue))\((.*)\)$/s);
                if (m) {
                    const method = m[1]; const raw = m[2];
                    try {
                        const args = JSON.parse('[' + raw.replace(/'/g, '\"') + ']');
                        locator = page[method](...args);
                    } catch(_) { locator = page.locator(target); }
                } else {
                    locator = page.locator(target);
                }
            } else {
                locator = page.locator(target);
            }
            if (action.type === 'goto') await page.goto(action.target);
            else if (action.type === 'click') await locator.click();
            else if (action.type === 'fill') await locator.fill(action.value || "");
            else if (action.type === 'selectOption') await locator.selectOption(action.value);
            else if (action.type === 'press') await locator.press(action.value || 'Enter');
        };

        if (url) await page.goto(url);

        const workbook = XLSX.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let currentScen = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const stepLabel = String(rows[r][2] || "").trim();
            if (scenarioNum.match(/^[A-Z]+\.\d+/)) currentScen = scenarioNum;
            else if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                if (stepLabel === label) break;
                if (mappings[stepLabel]) {
                    for (const action of mappings[stepLabel].steps) {
                        try { await resolveAndRun(action); } catch (e) { console.error('Replay step failed:', e.message); }
                    }
                }
            }
        }

        // DEF-074: Route code exclusively to the active session
        await page.exposeBinding('__autotestRecord', async (_, line) => {
            if (activeRecordSessions[sessionId]) activeRecordSessions[sessionId].code += line + '\n';
        });

        // DEF-075: bypassCSP enables these listeners on secure websites
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
            document.addEventListener('input', (e) => {
                const t = e.target; if (!t || !('value' in t)) return;
                const sel = getBestSelector(t);
                rec('await ' + sel + '.fill(' + JSON.stringify(String(t.value || '')) + ');');
            }, true);
            document.addEventListener('change', (e) => {
                const t = e.target; if (!t || t.tagName !== 'SELECT') return;
                const sel = getBestSelector(t);
                rec('await ' + sel + '.selectOption(' + JSON.stringify(String(t.value || '')) + ');');
            }, true);
        });
        
        res.json({ message: "Recording active in persistent browser." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/record-cancel', async (req, res) => {
    const { sessionId } = req.body;
    if (sessionId && activeRecordSessions[sessionId]) {
        if (activeRecordSessions[sessionId].page) {
            try { await activeRecordSessions[sessionId].page.close(); } catch(_) {}
        }
        delete activeRecordSessions[sessionId];
    }
    res.json({ message: "Cancelled." });
});

function parseRecordedCode(code) {
    const lines = code.split('\n');
    const steps = [];
    const ignored = [];
    for (let line of lines) {
        const rawLine = line;
        line = line.trim();
        if (!line || !line.includes('await')) continue;
        if (line.startsWith('import ') || line.startsWith('test(') || line.startsWith('});')) continue;
        
        if (line.includes('.goto(')) {
            const m = line.match(/goto\((['"`])(.*?)\1\)/);
            if (m) steps.push({ type: 'goto', target: m[2] }); else ignored.push(rawLine);
            continue;
        }

        const expectLocator = extractExpectLocator(line);
        if (expectLocator) {
            if (line.includes('.toBeVisible(')) { steps.push({ type: 'verifyVisible', target: expectLocator }); continue; }
            if (line.includes('.toContainText(') || line.includes('.toHaveText(')) {
                const t = line.match(/to(?:ContainText|HaveText)\((['"`])([\s\S]*?)\1\)/);
                steps.push({ type: 'verifyText', target: expectLocator, value: t ? t[2] : '' });
                continue;
            }
        }

        const locator = extractLocator(line);
        if (!locator) { ignored.push(rawLine); continue; }

        if (line.includes('.click(')) steps.push({ type: 'click', target: locator });
        else if (line.includes('.dblclick(')) steps.push({ type: 'dblclick', target: locator });
        else if (line.includes('.check(')) steps.push({ type: 'check', target: locator });
        else if (line.includes('.uncheck(')) steps.push({ type: 'uncheck', target: locator });
        else if (line.includes('.fill(')) {
            const v = line.match(/\.fill\((['"`])([\s\S]*?)\1\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[2] : "{{data}}" });
        } else if (line.includes('.selectOption(')) {
            const v = line.match(/\.selectOption\((.*?)\)(?:;|$)/);
            steps.push({ type: 'selectOption', target: locator, value: v ? v[1] : "{{data}}" });
        } else if (line.includes('.press(')) {
            const v = line.match(/\.press\((['"`])([\s\S]*?)\1\)/);
            steps.push({ type: 'press', target: locator, value: v ? v[2] : "" });
        } else if (line.includes('.hover(')) steps.push({ type: 'hover', target: locator });
        else if (line.includes('.scrollIntoViewIfNeeded(')) steps.push({ type: 'scrollIntoView', target: locator });
        else ignored.push(rawLine);
    }
    return { steps, ignored };
}

function extractExpectLocator(line) {
    const m = line.match(/expect\((page\..*?)\)\.to(?:BeVisible|ContainText|HaveText)\(/);
    if (!m) return null;
    const locatorExpr = m[1];
    if (locatorExpr.startsWith('page.locator(')) {
        const m2 = locatorExpr.match(/^page\.locator\((['"`])([\s\S]*)\1\)$/);
        if (m2) return m2[2];
    }
    if (locatorExpr.startsWith('page.')) return locatorExpr.slice(5);
    return null;
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

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    if (!label || !code || !String(code).trim()) return res.status(400).json({ error: "Code required." });
    
    const parsed = parseRecordedCode(code);
    const validLinesCount = code.split('\n').map(l => l.trim()).filter(l => {
        const line = l.toLowerCase();
        if (line.startsWith('import ') || line.startsWith('test(') || line.startsWith('});') || line === '' || line.startsWith('//')) return false;
        return true;
    }).length;

    if (parsed.steps.length === 0) return res.status(400).json({ error: "No valid steps parsed from submitted code." });
    if (parsed.steps.length < validLinesCount) return res.status(400).json({ error: "Partial parsing failure. Ensure your manual code follows Playwright action/assertion patterns.", ignored: parsed.ignored.slice(0,3) });

    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label] = { steps: parsed.steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: "Saved.", stepCount: parsed.steps.length });
});

app.get('/mapping/:label', (req, res) => {
    try {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        return res.json({ label: req.params.label, mapping: mappings[req.params.label] || null });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/run', (req, res) => {
    if (activeRun) return res.status(409).json({ error: 'A run is already in progress.' });
    if (!RUN_STATUS.activeExcel) return res.status(400).json({ error: "No matrix uploaded." });
    
    activeRun = { startedAt: Date.now(), process: null, excel: RUN_STATUS.activeExcel };
    const workers = Number(req.body?.workers) || 2;
    setRunStatus('queued', 'Run accepted');
    res.json({ message: "Run accepted." });

    (async () => {
        try {
            setRunStatus('blueprint', 'Generating blueprint...');
            await runCommand('node', ['core/scenario_parser.js', activeRun.excel], { cwd: ROOT_DIR });
            setRunStatus('compile', 'Compiling spec...');
            await runCommand('node', ['core/compiler.js'], { cwd: ROOT_DIR });
            setRunStatus('playwright', 'Executing Playwright...');
            
            const pw = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', `--workers=${workers}`, '--headed'], {
                env: { ...process.env, PW_HEADLESS: '0', AUTOTEST_FULLY_PARALLEL: req.body.fullyParallel ? '1' : '0' },
                cwd: ROOT_DIR
            });
            activeRun.process = pw;
            pw.on('close', (code) => {
                if (RUN_STATUS.phase === 'cancelled') return;
                if (code === 0) setRunStatus('completed', 'Finished successfully.');
                else setRunStatus('failed', `Finished with failures (Code ${code})`, false, 'system', 'test');
                activeRun = null;
            });
        } catch (err) {
            if (RUN_STATUS.phase !== 'cancelled') setRunStatus('failed', `System Error: ${err.message}`, false, 'system', 'system');
            activeRun = null;
        }
    })();
});

app.post('/run-cancel', (req, res) => {
    if (activeRun?.process) { 
        setRunStatus('cancelled', 'Cancelled');
        activeRun.process.kill('SIGTERM'); 
        activeRun = null; 
    }
    res.json({ message: 'Cancelled.' });
});

app.post('/restart', (req, res) => {
    try {
        if (activeRun) return res.status(409).json({ error: "Cannot reset while a run is active." });
        if (req.body?.clearMappings === true) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        const p = getCurrentExcelPath(); if (fs.existsSync(p)) fs.unlinkSync(p);
        if (fs.existsSync(RESULTS_DIR)) { fs.rmSync(RESULTS_DIR, { recursive: true, force: true }); fs.mkdirSync(RESULTS_DIR); }
        res.json({ message: "Reset." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`🚀 Studio Live on ${PORT}`));