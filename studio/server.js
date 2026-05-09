const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { spawn } = require('child_process');
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
const UPLOAD_POINTER = path.join(ROOT_DIR, '.current_upload');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let currentExcelPath = path.join(ROOT_DIR, 'scenario_uploaded.xlsx');
const RUN_STATUS = {
    phase: 'idle',
    ok: true,
    kind: 'idle',
    message: 'Idle',
    updatedAt: new Date().toISOString(),
    failureType: null // 'system' or 'test'
};
let activeRecord = null;
let latestAutoRecordedCode = '';
let activeRun = null;

function setRunStatus(phase, message, ok = true, kind = 'system', failureType = null) {
    RUN_STATUS.phase = phase;
    RUN_STATUS.message = message;
    RUN_STATUS.ok = ok;
    RUN_STATUS.kind = kind;
    RUN_STATUS.failureType = failureType;
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

function setCurrentExcelPath(p) {
    // [DEF-040] Path Traversal Protection
    const absolute = path.resolve(p);
    if (!absolute.startsWith(ROOT_DIR)) throw new Error("Security Violation: Path outside project root.");
    currentExcelPath = p;
    fs.writeFileSync(UPLOAD_POINTER, p, 'utf8');
}

function getCurrentExcelPath() {
    if (fs.existsSync(UPLOAD_POINTER)) {
        const p = fs.readFileSync(UPLOAD_POINTER, 'utf8').trim();
        if (p) currentExcelPath = p;
    }
    return currentExcelPath;
}

function safeJsString(value) {
    return JSON.stringify(String(value || ''));
}

function safeGetBy(target) {
    if (typeof target !== 'string') return null;
    const m = target.match(/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\((.*)\)$/);
    if (!m) return null;
    const args = m[2];
    // Character whitelist: only allow quotes, alpha-numeric, space, and very basic CSS/Text characters. 
    // This rejects ? : | & + - / * ( ) { } etc, effectively blocking ANY function call or logic injection.
    if (!/^(['"`])[a-zA-Z0-9\s\-#\._\[\]=]*\1$/.test(args)) return null;
    return target;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR), // [DEF-047] Move to temp uploads
    filename: (req, file, cb) => cb(null, `scenario_uploaded_${Date.now()}.xlsx`)
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!/\.xlsx$/i.test(file.originalname || '')) {
            return cb(new Error('Only .xlsx files are allowed'));
        }
        cb(null, true);
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));
app.post('/upload', upload.single('excel'), (req, res) => {
    try {
        if (!req.file || !req.file.path) return res.status(400).json({ error: 'No upload file found' });
        if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid file format. Only .xlsx files are allowed.' });
        }
        setCurrentExcelPath(req.file.path);
        res.json({ message: "Uploaded.", fileName: path.basename(req.file.path) });
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});
app.get('/run-status', (req, res) => res.json(RUN_STATUS));
app.get('/recording-latest', (req, res) => res.json({ code: latestAutoRecordedCode || '' }));

app.get('/scan', (req, res) => {
    try {
        if (!fs.existsSync(MAPPINGS_PATH)) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const excelPath = getCurrentExcelPath();
        if (!fs.existsSync(excelPath)) return res.json({ steps: [] });
        const workbook = XLSX.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const stepMap = new Map();
        const scenarios = [];
        let currentScenario = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const label = String(rows[r][2] || "").trim();
            if (scenarioNum.match(/^[A-Z]\.\d+/)) {
                currentScenario = scenarioNum;
                scenarios.push(currentScenario);
            } else if (currentScenario && scenarioNum.match(/^\d+$/) && label) {
                if (!stepMap.has(label)) {
                    stepMap.set(label, { label, status: mappings[label] ? 'mapped' : 'missing', flows: [currentScenario], scenarioId: currentScenario });
                } else {
                    stepMap.get(label).flows.push(currentScenario);
                }
            }
        }
        res.json({ steps: Array.from(stepMap.values()), scenarios });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    if (activeRecord && !activeRecord.killed) return res.status(409).json({ error: "Another recording is already active." });
    try {
        latestAutoRecordedCode = '';
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const excelPath = getCurrentExcelPath();
        const workbook = XLSX.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const replayScriptPath = path.join(UPLOADS_DIR, `replay_${Date.now()}.js`);
        let scriptContent = `const { chromium, expect } = require('playwright');\n(async () => {\n`;
        scriptContent += `  const resolveTarget = (page, target) => {\n`; // [DEF-038] Fixed hoisting
        scriptContent += `    if (typeof target !== 'string') return page.locator(String(target || ''));\n`;
        scriptContent += `    const m = target.match(/^(getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue))\\((.*)\\)$/s);\n`;
        scriptContent += `    if (!m) return page.locator(target);\n`;
        scriptContent += `    const method = m[1]; const raw = m[2];\n`;
        scriptContent += `    try { const args = JSON.parse('[' + raw.replace(/'/g, '\"') + ']'); if (typeof page[method] === 'function') return page[method](...args); } catch (_) {}\n`;
        scriptContent += `    return page.locator(target);\n  };\n`;
        scriptContent += `  const browser = await chromium.launch({ headless: false });\n  const context = await browser.newContext();\n  const page = await context.newPage();\n`;
        if (url) {
            try { new URL(String(url)); } catch { return res.status(400).json({ error: "Invalid URL format." }); }
            scriptContent += `  await page.goto(${safeJsString(url)});\n`;
        }
        let currentScen = null;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || "").trim();
            const stepLabel = String(rows[r][2] || "").trim();
            if (scenarioNum.match(/^[A-Z]\.\d+/)) currentScen = scenarioNum;
            else if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                if (stepLabel === label) break;
                if (mappings[stepLabel]) {
                    for (const action of mappings[stepLabel].steps) {
                        const val = action.value || "";
                        const locatorStr = `resolveTarget(page, ${safeJsString(action.target)})`;
                        if (action.type === 'goto') scriptContent += `    await page.goto(${safeJsString(action.target)});\n`;
                        else if (action.type === 'click') scriptContent += `    await ${locatorStr}.click();\n`;
                        else if (action.type === 'dblclick') scriptContent += `    await ${locatorStr}.dblclick();\n`;
                        else if (action.type === 'check') scriptContent += `    await ${locatorStr}.check();\n`;
                        else if (action.type === 'uncheck') scriptContent += `    await ${locatorStr}.uncheck();\n`;
                        else if (action.type === 'selectOption') scriptContent += `    await ${locatorStr}.selectOption(${safeJsString(val)});\n`;
                        else if (action.type === 'fill') scriptContent += `    await ${locatorStr}.fill(${safeJsString(val)});\n`;
                        else if (action.type === 'press') scriptContent += `    await ${locatorStr}.press(${safeJsString(val || 'Enter')});\n`;
                        else if (action.type === 'verifyVisible') scriptContent += `    await ${locatorStr}.waitFor({ state: 'visible', timeout: 5000 });\n`;
                        else if (action.type === 'verifyText') scriptContent += `    await ${locatorStr}.waitFor({ state: 'visible', timeout: 5000 });\n`;
                    }
                }
            }
        }
        scriptContent += `  await page.exposeBinding('__autotestRecord', async (_, line) => { console.log('AUTOTEST_REC:' + line); });\n`;
        scriptContent += `  await page.evaluate(() => {
            const cssPath = (el) => {
                if (!(el instanceof Element)) return ''; const parts = []; let node = el;
                while (node && node.nodeType === 1 && parts.length < 5) {
                    let sel = node.nodeName.toLowerCase();
                    if (node.id) { sel += '#' + node.id; parts.unshift(sel); break; }
                    if (node.className && typeof node.className === 'string') sel += '.' + node.className.trim().split(/\\s+/).slice(0,2).join('.');
                    parts.unshift(sel); node = node.parentElement;
                }
                return parts.join(' > ');
            };
            const rec = (line) => window.__autotestRecord(line).catch(() => {});
            document.addEventListener('click', (e) => {
                const p = cssPath(e.target); if (!p) return;
                if (e.altKey) rec('await expect(page.locator(' + JSON.stringify(p) + ')).toBeVisible();');
                else if (e.shiftKey) { const exp = window.prompt('Text assertion:',''); if (exp) rec('await expect(page.locator(' + JSON.stringify(p) + ')).toContainText(' + JSON.stringify(exp.trim()) + ');'); }
                else rec('await page.locator(' + JSON.stringify(p) + ').click();');
            }, true);
            document.addEventListener('change', (e) => {
                const t = e.target; if (!t || !('value' in t)) return; const p = cssPath(t); if (!p) return;
                rec('await page.locator(' + JSON.stringify(p) + ').fill(' + JSON.stringify(String(t.value || '')) + ');');
            }, true);
        });\n  await page.pause();\n  await browser.close();\n})();`;
        fs.writeFileSync(replayScriptPath, scriptContent);
        const child = spawn('node', [replayScriptPath], { cwd: ROOT_DIR });
        child.stdout.on('data', (d) => {
            const text = String(d);
            for (const line of text.split('\n')) {
                if (line.startsWith('AUTOTEST_REC:')) {
                    const snippet = line.replace('AUTOTEST_REC:', '').trim();
                    if (snippet) latestAutoRecordedCode += `${snippet}\n`;
                }
            }
        });
        child.on('close', () => { if (fs.existsSync(replayScriptPath)) fs.unlinkSync(replayScriptPath); activeRecord = null; });
        activeRecord = child;
        res.json({ message: "Replay started." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    if (!label || !code || !String(code).trim()) return res.status(400).json({ error: "Label and code are required." });
    const parsed = parseRecordedCode(code);
    const validLinesCount = code.split('\n').map(l => l.trim()).filter(l => {
        const line = l.toLowerCase();
        if (line.startsWith('import ') || line.startsWith('test(') || line.startsWith('});') || line === '' || line.startsWith('//')) return false;
        return true;
    }).length;
    if (parsed.steps.length === 0) return res.status(400).json({ error: "No valid steps parsed." });
    if (parsed.steps.length < validLinesCount) return res.status(400).json({ error: "Partial parsing failure.", ignored: parsed.ignored.slice(0,3) });
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label] = { steps: parsed.steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: "Saved.", stepCount: parsed.steps.length });
});

app.get('/mapping/:label', (req, res) => {
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    res.json({ label: req.params.label, mapping: mappings[req.params.label] || null });
});

app.delete('/mapping/:label', (req, res) => {
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    delete mappings[req.params.label];
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: "Deleted." });
});

app.post('/run', (req, res) => {
    if (activeRun) return res.status(409).json({ error: 'A run is already in progress.' });
    // [DEF-042] Synchronous atomic lock
    activeRun = { startedAt: Date.now(), process: null };
    
    const rawWorkers = Number(req.body?.workers);
    const workers = Number.isInteger(rawWorkers) && rawWorkers > 0 ? rawWorkers : 4;
    const fullyParallel = req.body?.fullyParallel === true;

    setRunStatus('queued', 'Run accepted');
    res.json({ message: "Run accepted." });

    (async () => {
        try {
            setRunStatus('blueprint', 'Generating blueprint...');
            await runCommand('node', ['core/scenario_parser.js', getCurrentExcelPath()], { cwd: ROOT_DIR });
            setRunStatus('compile', 'Compiling spec...');
            await runCommand('node', ['core/compiler.js'], { cwd: ROOT_DIR });
            setRunStatus('playwright', 'Launching Playwright tests...');
            // [DEF-036] Standard headed mode (no --ui zombie)
            const pw = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', `--workers=${workers}`, '--headed'], {
                env: { ...process.env, PW_HEADLESS: '0', AUTOTEST_FULLY_PARALLEL: fullyParallel ? '1' : '0', AUTOTEST_WORKERS: String(workers) },
                cwd: ROOT_DIR
            });
            activeRun.process = pw;
            pw.on('close', (code) => {
                if (code === 0) setRunStatus('completed', 'Finished successfully.');
                else setRunStatus('failed', `Finished with failures (Code ${code})`, false, 'system', 'test'); // [DEF-044] failureType
                activeRun = null;
            });
        } catch (err) {
            setRunStatus('failed', `System Error: ${err.message}`, false, 'system', 'system');
            activeRun = null;
        }
    })();
});

app.post('/run-cancel', (req, res) => {
    if (!activeRun?.process) { activeRun = null; return res.status(404).json({ error: 'No process found.' }); }
    activeRun.process.kill('SIGTERM');
    setRunStatus('cancelled', 'Cancelled');
    activeRun = null;
    res.json({ message: 'Cancelled.' });
});

app.post('/restart', (req, res) => {
    try {
        if (req.body?.clearMappings === true) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        const p = getCurrentExcelPath(); if (fs.existsSync(p)) fs.unlinkSync(p);
        if (fs.existsSync(RESULTS_DIR)) { fs.rmSync(RESULTS_DIR, { recursive: true, force: true }); fs.mkdirSync(RESULTS_DIR); }
        res.json({ message: "Reset." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

function parseRecordedCode(code) {
    const lines = code.split('\n'); const steps = []; const ignored = [];
    for (let line of lines) {
        const rawLine = line; line = line.trim();
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
        const locator = extractLocator(line); if (!locator) { ignored.push(rawLine); continue; }
        if (line.includes('.click(')) steps.push({ type: 'click', target: locator });
        else if (line.includes('.dblclick(')) steps.push({ type: 'dblclick', target: locator });
        else if (line.includes('.check(')) steps.push({ type: 'check', target: locator });
        else if (line.includes('.uncheck(')) steps.push({ type: 'uncheck', target: locator });
        else if (line.includes('.fill(')) {
            const v = line.match(/\.fill\((['"`])([\s\S]*?)\1\)/);
            steps.push({ type: 'fill', target: locator, value: v ? v[2] : "{{data}}" });
        } else if (line.includes('.selectOption(')) {
            const v = line.match(/\.selectOption\((['"`])([\s\S]*?)\1\)/);
            steps.push({ type: 'selectOption', target: locator, value: v ? v[2] : "{{data}}" });
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

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Studio Live on ${PORT}`));
