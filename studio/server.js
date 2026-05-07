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

// ── Multer: save uploaded Excel to a fixed filename ─────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ROOT_DIR),
    filename: (req, file, cb) => cb(null, 'scenario_uploaded.xlsx')
});
const upload = multer({ storage });

// ── Shared helper: parse scenario rows from the uploaded Excel ───────────────
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

        if (scenarioNum.match(/^[A-Z]\.\d+/)) {
            currentScenario = scenarioNum;
            scenarios.push(currentScenario);
        } else if (currentScenario && scenarioNum.match(/^\d+$/) && label) {
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
    return { stepMap, scenarios, rows };
}

// ── Inline compiler: blueprint.json → executed test code ────────────────────
function compileBlueprint() {
    if (!fs.existsSync(BLUEPRINT_PATH) || !fs.existsSync(MAPPINGS_PATH)) {
        throw new Error('Blueprint or Mappings missing.');
    }
    const scenarios = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8'));
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    const outputPath = path.join(CORE_DIR, 'executed.spec.ts');

    let code = `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
    code += `test.describe('Automated UAT Execution', () => {\n`;
    code += `    test.describe.configure({ mode: 'serial' });\n\n`;

    for (const scenario of scenarios) {
        const safeId = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_');
        code += `    test('Scenario ${scenario.Scenario_ID}: ${scenario.Role}', async ({ page }) => {\n`;
        code += `        const resultsDir = path.join(process.cwd(), 'results', '${safeId}');\n`;
        code += `        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;

        for (let i = 0; i < scenario.Flow.length; i++) {
            const step = scenario.Flow[i];
            const mapping = mappings[step.Mapping_Key];

            if (mapping) {
                code += `        await test.step('${step.Mapping_Key}', async () => {\n`;
                for (let j = 0; j < mapping.steps.length; j++) {
                    const action = mapping.steps[j];
                    const tokenReplacer = (str) => (str || '').replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key.trim()] || '');
                    
                    const finalValue = tokenReplacer(action.value);
                    const finalTarget = tokenReplacer(action.target);

                    const locator = finalTarget && finalTarget.startsWith('getBy')
                        ? `page.${finalTarget}`
                        : `page.locator(\`${finalTarget}\`)`;

                    if (action.type === 'goto') {
                        code += `            await page.goto(\`${finalTarget}\`, { waitUntil: 'domcontentloaded' });\n`;
                        code += `            try {\n`;
                        code += `                const acceptBtn = page.locator('button[aria-label="Accept all"], button:has-text("Accept all")').first();\n`;
                        code += `                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });\n`;
                        code += `                await acceptBtn.click({ force: true });\n`;
                        code += `            } catch (e) {}\n`;
                    } else if (action.type === 'click') {
                        code += `            await ${locator}.scrollIntoViewIfNeeded();\n`;
                        code += `            await ${locator}.waitFor({ state: 'visible', timeout: 10000 });\n`;
                        code += `            await ${locator}.click({ force: true });\n`;
                    } else if (action.type === 'fill') {
                        code += `            await ${locator}.scrollIntoViewIfNeeded();\n`;
                        code += `            await ${locator}.waitFor({ state: 'visible', timeout: 10000 });\n`;
                        code += `            await ${locator}.fill(\`${finalValue}\`);\n`;
                    } else if (action.type === 'press') {
                        code += `            await ${locator}.scrollIntoViewIfNeeded();\n`;
                        code += `            await ${locator}.press(\`${finalValue || 'Enter'}\`);\n`;
                    } else if (action.type === 'upload') {
                        code += `            await ${locator}.setInputFiles(\`${finalValue}\`);\n`;
                    }
                    code += `            await page.screenshot({ path: path.join(resultsDir, \`STEP_${i}_ACT_${j}.png\`), fullPage: true });\n`;
                }
                code += `        });\n\n`;
            } else {
                code += `        // MISSING MAPPING: ${step.Mapping_Key}\n`;
            }
        }
        code += `        await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });\n`;
        code += `    });\n\n`;
    }
    code += `});\n`;

    fs.writeFileSync(outputPath, code);
    console.log(`✅ Compiled: ${outputPath}`);
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'studio-ui.html')));

app.post('/upload', upload.single('excel'), (req, res) => res.json({ message: 'Uploaded.' }));

app.get('/scan', (req, res) => {
    try {
        const { stepMap, scenarios } = parseScenarioRows();
        res.json({ steps: Array.from(stepMap.values()), scenarios });
    } catch (err) {
        console.error('Scan Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/record', async (req, res) => {
    const { label, url, scenarioId } = req.body;
    console.log(`\n🎬 Continuous Recording Session started at: "${label}" (Scenario: ${scenarioId})`);

    try {
        const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
        const { rows } = parseScenarioRows();

        // 1. Identify the flow of labels for this scenario to allow multi-mapping
        let currentScen = null;
        let flowLabels = [];
        let scenarioData = {};
        let startIndex = -1;

        for (let r = 1; r < rows.length; r++) {
            const scenarioNum = String(rows[r][1] || '').trim();
            const stepLabel = String(rows[r][2] || '').trim();
            const rawTestData = String(rows[r][13] || '').trim();

            if (scenarioNum.match(/^[A-Z]\.\d+/)) {
                currentScen = scenarioNum;
                if (currentScen === scenarioId) scenarioData = {};
            } else if (currentScen === scenarioId && scenarioNum.match(/^\d+$/) && stepLabel) {
                // Collect data for this scenario
                if (rawTestData && rawTestData !== 'undefined') {
                    if (rawTestData.startsWith('{')) Object.assign(scenarioData, JSON.parse(rawTestData));
                    else rawTestData.split(',').forEach(p => { const [k, v] = p.split('='); if (k && v) scenarioData[k.trim()] = v.trim(); });
                }
                flowLabels.push(stepLabel);
                if (stepLabel === label) startIndex = flowLabels.length - 1;
            }
        }

        let scriptLines = [
            `const { chromium } = require('playwright');`,
            `(async () => {`,
            `  const browser = await chromium.launch({ headless: false });`,
            `  const context = await browser.newContext();`,
            `  const page = await context.newPage();`,
            `  let currentLabelIdx = ${startIndex};`,
            `  const flowLabels = ${JSON.stringify(flowLabels)};`,
            
            // --- CONTINUOUS CAPTURE BRIDGE ---
            `  await page.exposeFunction('captureAction', async (action) => {`,
            `    const fs = require('fs');`,
            `    const mPath = '${MAPPINGS_PATH.replace(/\\/g, '\\\\')}';`,
            `    const labelToMap = flowLabels[currentLabelIdx];`,
            `    if (!labelToMap) return console.log('🏁 All scenario steps mapped.');`,
            
            `    console.log(\`✨ Mapping action to [\${labelToMap}]:\`, JSON.stringify(action));`,
            `    const mappings = JSON.parse(fs.readFileSync(mPath, 'utf8'));`,
            `    mappings[labelToMap] = { steps: [action] };`,
            `    fs.writeFileSync(mPath, JSON.stringify(mappings, null, 2));`,
            `    currentLabelIdx++;`,
            `  });`,

            url ? `  await page.goto('${url}', { waitUntil: 'domcontentloaded' });` : ''
        ];

        // 2. Replay all preceding steps in this specific scenario
        for (let i = 0; i < startIndex; i++) {
            const prevLabel = flowLabels[i];
            if (mappings[prevLabel]) {
                for (const action of mappings[prevLabel].steps) {
                    const val = (action.value || '').replace(/\{\{(.*?)\}\}/g, (_, key) => scenarioData[key.trim()] || '');
                    const locStr = action.target.startsWith('getBy') ? `page.${action.target}` : `page.locator(\`${action.target}\`)`;
                    if (action.type === 'goto') scriptLines.push(`  await page.goto('${action.target}', { waitUntil: 'domcontentloaded' });`);
                    else if (action.type === 'click') scriptLines.push(`  await ${locStr}.click();`);
                    else if (action.type === 'fill') scriptLines.push(`  await ${locStr}.fill(\`${val}\`);`);
                    else if (action.type === 'press') scriptLines.push(`  await ${locStr}.press('${val || 'Enter'}');`);
                }
            }
        }

        // 3. Inject Continuous Capture Script
        scriptLines.push(
            `  await page.addInitScript(() => {`,
            `    const generateLocator = (el) => {`,
            `      if (el.id) return '#' + el.id;`,
            `      if (el.getAttribute('name')) return 'input[name="' + el.getAttribute('name') + '"]';`,
            `      if (el.tagName === 'BUTTON' && el.innerText) return 'button:has-text("' + el.innerText.trim() + '")';`,
            `      if (el.innerText && el.innerText.length < 30) return 'text=' + el.innerText.trim();`,
            `      return el.tagName.toLowerCase();`,
            `    };`,
            `    window.addEventListener('mousedown', (e) => {`,
            `      if (e.button !== 0) return;`,
            `      window.captureAction({ type: 'click', target: generateLocator(e.target) });`,
            `    }, true);`,
            `    window.addEventListener('keydown', (e) => {`,
            `      if (e.key === 'Enter') window.captureAction({ type: 'press', target: generateLocator(e.target), value: 'Enter' });`,
            `    }, true);`,
            `  });`,
            `  console.log('🔴 CONTINUOUS RECORDING ACTIVE. Perform actions for sequential steps.');`,
            `  await new Promise(r => browser.on('disconnected', r));`, // Keep alive until browser closes
            `  process.exit(0);`,
            `})();`
        );

        const child = spawn('node', ['--eval', scriptLines.join('\n')], { env: { ...process.env }, detached: true });
        child.stdout.on('data', d => console.log(`[RECORD] ${d}`));
        
        res.json({ message: 'Continuous recording session started. Replay in progress...' });
    } catch (err) {
        console.error('Record Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-mapping', (req, res) => {
    const { label, code } = req.body;
    const steps = parseRecordedCode(code);
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    mappings[label] = { steps };
    fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));
    res.json({ message: 'Saved.' });
});

app.post('/run', (req, res) => {
    try {
        console.log('🚀 Generating blueprint...');
        execSync(`node core/scenario_parser.js ${UPLOADED_EXCEL}`, { cwd: ROOT_DIR, stdio: 'inherit' });

        console.log('🔨 Compiling scenarios into executable code...');
        compileBlueprint();

        console.log('🏃 Launching Playwright UI...');
        const pw = spawn('npx', ['playwright', 'test', 'core/executed.spec.ts', '--ui'], {
            env: { ...process.env, PW_HEADLESS: '0' },
            cwd: ROOT_DIR,
            shell: true
        });

        pw.stdout.on('data', d => console.log(`[PW] ${d}`));
        pw.stderr.on('data', d => console.error(`[PW ERROR] ${d}`));
        pw.on('close', code => console.log(`✅ Playwright UI closed (exit: ${code})`));

        res.json({
            message: 'Playwright UI launched. Check your desktop for the Trace Viewer window.',
            instruction: "Click 'Run all' or select specific scenarios in the Playwright UI."
        });
    } catch (err) {
        console.error('Run Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/restart', (req, res) => {
    try {
        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify({}, null, 2));
        if (fs.existsSync(UPLOADED_EXCEL)) fs.unlinkSync(UPLOADED_EXCEL);
        if (fs.existsSync(BLUEPRINT_PATH)) fs.unlinkSync(BLUEPRINT_PATH);
        if (fs.existsSync(RESULTS_DIR)) {
            fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
            fs.mkdirSync(RESULTS_DIR);
        }
        const compiledSpec = path.join(CORE_DIR, 'executed.spec.ts');
        if (fs.existsSync(compiledSpec)) fs.unlinkSync(compiledSpec);
        res.json({ message: 'Reset complete.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Code parsing utilities ───────────────────────────────────────────────────
function parseRecordedCode(code) {
    const steps = [];
    for (let line of code.split('\n')) {
        line = line.trim();
        if (!line.includes('await')) continue;

        if (line.includes('.goto(')) {
            const m = line.match(/goto\(['"](.+?)['"]\)/);
            if (m) steps.push({ type: 'goto', target: m[1] });
            continue;
        }

        const locator = extractLocator(line);
        if (!locator) continue;

        if (line.includes('.click(')) steps.push({ type: 'click', target: locator });
        else if (line.includes('.fill(')) { const v = line.match(/\.fill\(['"](.+?)['"]\)/); steps.push({ type: 'fill', target: locator, value: v ? v[1] : '{{data}}' }); }
        else if (line.includes('.press(')) { const v = line.match(/\.press\(['"](.+?)['"]\)/); steps.push({ type: 'press', target: locator, value: v ? v[1] : '' }); }
        else if (line.includes('.type(')) { const v = line.match(/\.type\(['"](.+?)['"]\)/); steps.push({ type: 'fill', target: locator, value: v ? v[1] : '{{data}}' }); }
    }
    return steps;
}

function extractLocator(line) {
    const m = line.match(/page\.(locator|getByRole|getByLabel|getByPlaceholder|getByText|getByAltText|getByTitle|getByTestId)\((.*?)\)/);
    if (!m) return null;
    const method = m[1];
    const args = m[2];
    if (method === 'locator') return args.replace(/^['"` + '`' + `]|['"` + '`' + `]$/g, '');
    return `${method}(${args})`;
}

app.listen(3000, () => console.log('🚀 Automation Studio running on http://localhost:3000'));
