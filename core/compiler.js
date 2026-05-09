const fs = require('fs');
const path = require('path');

function compile() {
    const blueprintPath = path.join(__dirname, 'blueprint.json');
    const mappingsPath = path.join(__dirname, 'mappings.json');
    const outputPath = path.join(__dirname, 'executed.spec.ts');

    if (!fs.existsSync(blueprintPath) || !fs.existsSync(mappingsPath)) {
        console.error("❌ Blueprint or Mappings missing.");
        return;
    }

    const scenarios = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

    const q = (v) => JSON.stringify(String(v ?? ''));
    const safeGetBy = (target) => {
        if (typeof target !== 'string') return null;
        const m = target.match(/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\((.*)\)$/);
        if (!m) return null;
        const args = m[2];
        if (!/^(['"`])[a-zA-Z0-9\s\-#\._\[\]=]*\1$/.test(args)) return null;
        return target;
    };

    let code = `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
    code += `async function markLocator(locator: any) {\n    try {\n        await locator.first().evaluate((el: any) => {\n            const prev = { outline: el.style.outline, boxShadow: el.style.boxShadow, transition: el.style.transition };\n            el.setAttribute('data-autotest-prev', JSON.stringify(prev));\n            el.style.transition = 'all 120ms ease'; el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';\n        });\n    } catch (e) {}\n}\n\n`;
    code += `async function unmarkLocator(locator: any) {\n    try {\n        await locator.first().evaluate((el: any) => {\n            const raw = el.getAttribute('data-autotest-prev'); if (!raw) return;\n            const prev = JSON.parse(raw); el.style.outline = prev.outline || ''; el.style.boxShadow = prev.boxShadow || ''; el.style.transition = prev.transition || ''; el.removeAttribute('data-autotest-prev');\n        });\n    } catch (e) {}\n}\n\n`;
    
    code += `test.describe('Automated UAT Execution', () => {\n    test.describe.configure({ mode: process.env.AUTOTEST_FULLY_PARALLEL === '1' ? 'parallel' : 'serial' });\n\n`;

    const missingKeys = new Set();
    for (const scenario of scenarios) {
        const scenarioIdClean = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_');
        // [DEF-032] Escape scenario titles
        const safeScenId = String(scenario.Scenario_ID).replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
        const safeRole = String(scenario.Role || '').replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
        
        code += `    test('Scenario ${safeScenId}: ${safeRole}', async ({ page }) => {\n`;
        code += `        const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
        code += `        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;
        code += `        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });\n`;
        code += `        try {\n`;

        for (let i = 0; i < scenario.Flow.length; i++) {
            const step = scenario.Flow[i];
            const mapping = mappings[step.Mapping_Key];
            if (mapping) {
                // [DEF-033] Escape mapping key in test.step
                const safeStepKey = String(step.Mapping_Key).replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
                code += `            await test.step('${safeStepKey}', async () => {\n`;
                for (let j = 0; j < mapping.steps.length; j++) {
                    const action = mapping.steps[j];
                    const target = action.target;
                    const value = action.value || "";
                    const finalValue = value.replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key] || "");
                    const getByTarget = safeGetBy(target);
                    let locator = getByTarget ? `page.${getByTarget}` : `page.locator(${q(target)})`;

                    if (action.type === 'goto') {
                        code += `            await page.goto(${q(target)}, { waitUntil: 'domcontentloaded' });\n`;
                    }
                    else if (action.type === 'click') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await page.screenshot({ path: path.join(resultsDir, \`STEP_${i}_ACT_${j}_MARK.png\`) });\n`;
                        code += `            await ${locator}.click({ force: true });\n`;
                        code += `            await unmarkLocator(${locator});\n`; // [DEF-045] Visual cleanup
                    }
                    else if (action.type === 'dblclick') {
                        code += `            await markLocator(${locator}); await ${locator}.dblclick({ force: true }); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'check') {
                        code += `            await markLocator(${locator}); await ${locator}.check({ force: true }); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'uncheck') {
                        code += `            await markLocator(${locator}); await ${locator}.uncheck({ force: true }); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'selectOption') { // [DEF-035] Dedicated path
                        code += `            await markLocator(${locator}); await ${locator}.selectOption(${q(finalValue)}); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'fill') {
                        code += `            await markLocator(${locator}); await ${locator}.fill(${q(finalValue)}); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'press') {
                        code += `            await markLocator(${locator}); await ${locator}.press(${q(finalValue || 'Enter')}); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'hover') {
                        code += `            await markLocator(${locator}); await ${locator}.hover(); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'scrollIntoView') code += `            await ${locator}.scrollIntoViewIfNeeded();\n`;
                    else if (action.type === 'verifyVisible') {
                        code += `            await markLocator(${locator}); await expect(${locator}).toBeVisible(); await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'verifyText') {
                        code += `            await markLocator(${locator}); await expect(${locator}).toContainText(${q(finalValue)}); await unmarkLocator(${locator});\n`;
                    }
                    // [DEF-041] Post-action screenshot
                    code += `            await page.screenshot({ path: path.join(resultsDir, \`STEP_${i}_ACT_${j}.png\`) });\n`;
                }
                code += `            });\n\n`;
            } else {
                missingKeys.add(step.Mapping_Key);
                code += `            // MISSING MAPPING: ${step.Mapping_Key}\n`;
            }
        }
        code += `            await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png') });\n`;
        code += `        } finally {\n`;
        code += `            await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') }).catch(() => {});\n`;
        code += `        }\n    });\n\n`;
    }
    if (missingKeys.size > 0) {
        console.error(`❌ Missing mappings detected (${missingKeys.size}): ${Array.from(missingKeys).join(', ')}`);
        process.exitCode = 1; return;
    }
    code += `});\n`;
    fs.writeFileSync(outputPath, code);
    console.log(`✅ Compiled: ${outputPath}`);
}
compile();
