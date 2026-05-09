const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { execSync, spawn } = require('child_process');
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
const BLUEPRINT_PATH = path.join(CORE_DIR, 'blueprint.json');
const UPLOADED_EXCEL = path.join(ROOT_DIR, 'scenario_uploaded.xlsx');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ROOT_DIR),
    filename: (req, file, cb) => cb(null, 'scenario_uploaded.xlsx')
});
const upload = multer({ storage });

function parseScenarioRows() {
    if (!fs.existsSync(UPLOADED_EXCEL)) return { stepMap: new Map(), scenarios: [] };
    if (!fs.existsSync(MAPPINGS_PATH)) fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    const workbook = XLSX.readFile(UPLOADED_EXCEL);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const stepMap = new Map();
    const scenarios = [];
    let currentScenario = null;
    for (let r = 1; r < rows.length; r++) {
        const scenarioNum = String(rows[r][1] || '').trim();
        const label = String(rows[r][2] || '').trim();
        if (scenarioNum.match(/^[A-Z]\.\d+/)) { currentScenario = scenarioNum; scenarios.push(currentScenario); }
        else if (currentScenario && scenarioNum.match(/^\d+$/) && label) {
            if (!stepMap.has(label)) { stepMap.set(label, { label, status: mappings[label] ? 'mapped' : 'missing', flows: [currentScenario], scenarioId: currentScenario }); }
            else { stepMap.get(label).flows.push(currentScenario); }
        }
    }
    return { stepMap, scenarios, rows };
}

function compileBlueprint() {
    if (!fs.existsSync(BLUEPRINT_PATH) || !fs.existsSync(MAPPINGS_PATH)) return;
    const scenarios = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8'));
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    const outputPath = path.join(CORE_DIR, 'executed.spec.ts');
    let code = "import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n";
    code += "test.describe('Automated UAT Execution', () => {\n";
    for (const scenario of scenarios) {
        const safeId = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_');
        code += "    test('Scenario " + scenario.Scenario_ID + ": " + scenario.Role + "', async ({ page }) => {\n";
        code += "        const resultsDir = path.join(process.cwd(), 'results', '" + safeId + "');\n";
        code += "        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n";
        for (let i = 0; i < scenario.Flow.length; i++) {
            const step = scenario.Flow[i];
            const mapping = mappings[step.Mapping_Key];
            if (mapping) {
                code += "        await test.step('" + step.Mapping_Key + "', async () => {\n";
                for (let j = 0; j < mapping.steps.length; j++) {
                    const action = mapping.steps[j];
                    const finalValue = (action.value || '').replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key.trim()] || '');
                    const finalTarget = (action.target || '').replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key.trim()] || '');
                    const locator = finalTarget.startsWith('getBy') ? "page." + finalTarget : "page.locator(`" + finalTarget + "`)";
                    if (action.type === 'goto') code += "            await page.goto(`" + finalTarget + "`, { waitUntil: 'domcontentloaded' });\n";
                    else if (action.type === 'click') code += "            await " + locator + ".scrollIntoViewIfNeeded(); await " + locator + ".click({ force: true });\n";
                    else if (action.type === 'fill') code += "            await " + locator + ".scrollIntoViewIfNeeded(); await " + locator + ".fill(`" + finalValue + "`);\n";
                    else if (action.type === 'press') code += "            await " + locator + ".scrollIntoViewIfNeeded(); await " + locator + ".press(`" + (finalValue || 'Enter') + "`);\n";
                    else if (action.type === 'assertVisible') code += "            await expect(" + locator + ").toBeVisible({ timeout: 10000 });\n";
                    else if (action.type === 'assertText') code += "            await expect(" + locator + ").toContainText(`" + finalValue + "`, { timeout: 10000 });\n";
                    else if (action.type === 'upload') code += "            await " + locator + ".setInputFiles(`" + finalValue + "`);\n";
                    code += "            await page.screenshot({ path: path.join(resultsDir, `STEP_" + i + "_ACT_" + j + ".png`), fullPage: true });\n";
                }
                code += "        });\n\n";
            }
        }
        code += "        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });\n";
        code += "    });\n\n";
    }
    code += "});\n";
    fs.writeFileSync(outputPath, code);
}

let recordingProcess = null;

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));
app.get('/status', (req, res) => res.json({ recordingActive: recordingProcess !== null }));
app.post('/upload', upload.single('excel'), (req, res) => res.json({ message: 'Uploaded.' }));
app.get('/scan', (req, res) => {
    try { const { stepMap, scenarios } = parseScenarioRows(); res.json({ steps: Array.from(stepMap.values()), scenarios }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    try {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const { rows } = parseScenarioRows();
        let currentScen = null;
        let flowLabels = [];
        let scenarioData = {};
        let startIndex = -1;
        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || '').trim();
            const stepLabel = String(rows[r][2] || '').trim();
            const rawTestData = String(rows[r][13] || '').trim();
            if (scenarioNum.match(/^[A-Z]\.\d+/)) { currentScen = scenarioNum; if (currentScen === scenarioId) scenarioData = {}; }
            else if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                if (rawTestData && rawTestData !== 'undefined') {
                    if (rawTestData.startsWith('{')) Object.assign(scenarioData, JSON.parse(rawTestData));
                    else rawTestData.split(',').forEach(p => { const [k, v] = p.split('='); if (k && v) scenarioData[k.trim()] = v.trim(); });
                }
                flowLabels.push(stepLabel);
                if (stepLabel === label && startIndex === -1) startIndex = flowLabels.length - 1;
            }
        }
        let script = "const { chromium } = require('playwright');\nconst fs = require('fs');\n(async () => {\n";
        script += "  const browser = await chromium.launch({ headless: false });\n";
        script += "  const context = await browser.newContext();\n";
        script += "  const page = await context.newPage();\n";
        script += "  let currentLabelIdx = " + startIndex + ";\n";
        script += "  const flowLabels = " + JSON.stringify(flowLabels) + ";\n";
        script += "  await page.exposeFunction('captureAction', async (action) => {\n";
        script += "    const mPath = '" + MAPPINGS_PATH.replace(/\\/g, '\\\\') + "';\n";
        script += "    const labelToMap = flowLabels[currentLabelIdx];\n";
        script += "    if (!labelToMap) return;\n";
        script += "    const mappings = JSON.parse(fs.readFileSync(mPath, 'utf8'));\n";
        script += "    mappings[labelToMap] = { steps: [action] };\n";
        script += "    fs.writeFileSync(mPath, JSON.stringify(mappings, null, 2));\n";
        script += "    currentLabelIdx++;\n";
        script += "  });\n";
        if (url) script += "  await page.goto('" + url + "', { waitUntil: 'domcontentloaded' });\n";

        for (let i = 0; i < startIndex; i++) {
            const prevLabel = flowLabels[i];
            if (mappings[prevLabel]) {
                for (const action of mappings[prevLabel].steps) {
                    const val = (action.value || '').replace(/\{\{(.*?)\}\}/g, (_, key) => scenarioData[key.trim()] || '');
                    const locStr = action.target.startsWith('getBy') ? "page." + action.target : "page.locator(`" + action.target + "`)";
                    if (action.type === 'goto') script += "  await page.goto('" + action.target + "', { waitUntil: 'domcontentloaded' });\n";
                    else if (action.type === 'click') script += "  await " + locStr + ".click();\n";
                    else if (action.type === 'fill') script += "  await " + locStr + ".fill(`" + val + "`);\n";
                    else if (action.type === 'press') script += "  await " + locStr + ".press('" + (val || 'Enter') + "');\n";
                }
            }
        }
        script += "  await page.addInitScript(() => {\n";
        script += "    const flowLabels = " + JSON.stringify(flowLabels) + ";\n";
        script += "    let currentIdx = " + startIndex + ";\n";
        script += "    let mode = 'record';\n";
        script += "    const injectToolbar = () => {\n";
        script += "      if (document.getElementById('autotest-toolbar')) return;\n";
        script += "      const tb = document.createElement('div');\n";
        script += "      tb.id = 'autotest-toolbar';\n";
        script += "      tb.style = 'position:fixed; top:0; left:0; right:0; height:45px; background:#1c1e21; color:white; z-index:2147483647; display:flex; align-items:center; padding:0 20px; font-family:sans-serif; font-size:13px; border-bottom:2px solid #1877f2; pointer-events:auto;';\n";
        script += "      tb.innerHTML = '<div style=\"flex:1; display:flex; align-items:center; gap:15px;\"><b style=\"color:#1877f2;\">AutoTest</b><div id=\"at-step-info\"></div></div><div style=\"display:flex; gap:8px;\"><button id=\"at-btn-record\" style=\"background:#1877f2; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;\">⏺ Record</button><button id=\"at-btn-visible\" style=\"background:#333; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;\">👁 Visible</button><button id=\"at-btn-text\" style=\"background:#333; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;\">📝 Text</button><button id=\"at-btn-skip\" style=\"background:#555; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;\">Next ⏭</button></div>';\n";
        script += "      document.documentElement.appendChild(tb);\n";
        script += "      if(document.body) document.body.style.paddingTop = '45px';\n";
        script += "      document.getElementById('at-btn-record').onclick = (e) => { e.stopPropagation(); mode = 'record'; updateUI(); };\n";
        script += "      document.getElementById('at-btn-visible').onclick = (e) => { e.stopPropagation(); mode = 'assertVisible'; updateUI(); };\n";
        script += "      document.getElementById('at-btn-text').onclick = (e) => { e.stopPropagation(); mode = 'assertText'; updateUI(); };\n";
        script += "      document.getElementById('at-btn-skip').onclick = (e) => { e.stopPropagation(); currentIdx++; updateUI(); };\n";
        script += "      updateUI();\n";
        script += "    };\n";
        script += "    const updateUI = () => {\n";
        script += "      const info = document.getElementById('at-step-info');\n";
        script += "      if(info) info.innerHTML = currentIdx < flowLabels.length ? 'Mapping: <b>' + flowLabels[currentIdx] + '</b>' : '🏁 Done';\n";
        script += "    };\n";
        script += "    const observer = new MutationObserver(injectToolbar);\n";
        script += "    observer.observe(document.documentElement, { childList: true, subtree: true });\n";
        script += "    injectToolbar();\n";
        script += "    window.addEventListener('mousedown', (e) => {\n";
        script += "      if (e.button !== 0 || e.target.closest('#autotest-toolbar')) return;\n";
        script += "      const el = e.target;\n";
        script += "      const target = el.id ? '#' + el.id : (el.getAttribute('name') ? 'input[name=\"' + el.getAttribute('name') + '\"]' : el.tagName.toLowerCase());\n";
        script += "      const action = { type: mode === 'record' ? 'click' : mode, target };\n";
        script += "      if (mode === 'assertText') action.value = el.innerText.trim();\n";
        script += "      window.captureAction(action);\n";
        script += "      currentIdx++; updateUI();\n";
        script += "    }, true);\n";
        script += "  });\n";
        script += "  await new Promise(r => browser.on('disconnected', r));\n";
        script += "  process.exit(0);\n";
        script += "})();";
        const scriptPath = path.join(ROOT_DIR, "record_session_" + Date.now() + ".js");
        fs.writeFileSync(scriptPath, script);
        recordingProcess = spawn('node', [scriptPath], { env: { ...process.env }, detached: true, stdio: 'inherit' });
        recordingProcess.on('exit', () => { recordingProcess = null; });
        res.json({ message: 'Started', script: scriptPath });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/run', (req, res) => {
    try {
        execSync("node core/scenario_parser.js " + UPLOADED_EXCEL, { cwd: ROOT_DIR });
        compileBlueprint();
        spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', '--ui'], { env: { ...process.env, PW_HEADLESS: '0' }, cwd: ROOT_DIR, shell: true });
        res.json({ message: 'Launched' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/restart', (req, res) => {
    try { fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2)); res.json({ message: 'Reset' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => console.log('🚀 Studio Live on http://localhost:3000'));
