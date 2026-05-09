const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const CORE_DIR = path.join(__dirname, 'core');
const MAPPINGS_PATH = path.join(CORE_DIR, 'mappings.json');
const BLUEPRINT_PATH = path.join(CORE_DIR, 'blueprint.json');

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

compileBlueprint();
console.log('✅ executed.spec.ts compiled for 30 scenarios.');
