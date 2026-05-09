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
        if (!target.startsWith('getBy')) return null;
        if (!/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\([\s\S]*\)$/.test(target)) return null;
        if (/[;\n\r`]/.test(target)) return null;
        return target;
    };
    let code = `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
    code += `async function markLocator(locator: any) {\n`;
    code += `    try {\n`;
    code += `        await locator.first().evaluate((el: any) => {\n`;
    code += `            const prev = {\n`;
    code += `                outline: el.style.outline,\n`;
    code += `                boxShadow: el.style.boxShadow,\n`;
    code += `                transition: el.style.transition,\n`;
    code += `            };\n`;
    code += `            el.setAttribute('data-autotest-prev', JSON.stringify(prev));\n`;
    code += `            el.style.transition = 'all 120ms ease';\n`;
    code += `            el.style.outline = '3px solid #ff1f1f';\n`;
    code += `            el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';\n`;
    code += `        });\n`;
    code += `    } catch (e) {}\n`;
    code += `}\n\n`;
    code += `async function unmarkLocator(locator: any) {\n`;
    code += `    try {\n`;
    code += `        await locator.first().evaluate((el: any) => {\n`;
    code += `            const raw = el.getAttribute('data-autotest-prev');\n`;
    code += `            if (!raw) return;\n`;
    code += `            const prev = JSON.parse(raw);\n`;
    code += `            el.style.outline = prev.outline || '';\n`;
    code += `            el.style.boxShadow = prev.boxShadow || '';\n`;
    code += `            el.style.transition = prev.transition || '';\n`;
    code += `            el.removeAttribute('data-autotest-prev');\n`;
    code += `        });\n`;
    code += `    } catch (e) {}\n`;
    code += `}\n\n`;
    
    code += `test.describe('Automated UAT Execution', () => {\n`;
    code += `    test.describe.configure({ mode: process.env.AUTOTEST_FULLY_PARALLEL === '1' ? 'parallel' : 'serial' });\n\n`;
    code += `    test.beforeEach(async () => {});\n\n`;

    const missingKeys = new Set();

    for (const scenario of scenarios) {
        const scenarioIdClean = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_');
        code += `    test('Scenario ${String(scenario.Scenario_ID).replace(/'/g, "\\'")}: ${String(scenario.Role || '').replace(/'/g, "\\'")}', async ({ page }) => {\n`;
        code += `        const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
        code += `        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;
        code += `        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });\n`;
        code += `        try {\n`;

        for (let i = 0; i < scenario.Flow.length; i++) {
            const step = scenario.Flow[i];
            const mapping = mappings[step.Mapping_Key];
            
            if (mapping) {
                code += `            await test.step('${step.Mapping_Key}', async () => {\n`;
                for (let j = 0; j < mapping.steps.length; j++) {
                    const action = mapping.steps[j];
                    const target = action.target;
                    const value = action.value || "";
                    
                    // Token replacement
                    const finalValue = value.replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key] || "");
                    
                    const getByTarget = safeGetBy(target);
                    let locator = getByTarget ? `page.${getByTarget}` : `page.locator(${q(target)})`;

                    if (action.type === 'goto') {
                        code += `            await page.goto(${q(target)}, { waitUntil: 'domcontentloaded' });\n`;
                        code += `            await page.waitForLoadState('domcontentloaded');\n`;
                    }
                    else if (action.type === 'click') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await page.screenshot({ path: path.join(resultsDir, \`STEP_${i}_ACT_${j}_MARK.png\`) });\n`;
                        code += `            await ${locator}.click({ force: true });\n`;
                    }
                    else if (action.type === 'fill') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await page.screenshot({ path: path.join(resultsDir, \`STEP_${i}_ACT_${j}_MARK.png\`) });\n`;
                        code += `            await ${locator}.fill(${q(finalValue)});\n`;
                        code += `            await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'press') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await page.screenshot({ path: path.join(resultsDir, \`STEP_${i}_ACT_${j}_MARK.png\`) });\n`;
                        code += `            await ${locator}.press(${q(finalValue || 'Enter')});\n`;
                        code += `            await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'hover') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await ${locator}.hover();\n`;
                        code += `            await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'scrollIntoView') code += `            await ${locator}.scrollIntoViewIfNeeded();\n`;
                    else if (action.type === 'verifyVisible') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await expect(${locator}).toBeVisible();\n`;
                        code += `            await unmarkLocator(${locator});\n`;
                    }
                    else if (action.type === 'verifyText') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await expect(${locator}).toContainText(${q(finalValue)});\n`;
                        code += `            await unmarkLocator(${locator});\n`;
                    }
                    
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
        code += `        }\n`;
        code += `    });\n\n`;
    }

    if (missingKeys.size > 0) {
        console.error(`❌ Missing mappings detected (${missingKeys.size}): ${Array.from(missingKeys).join(', ')}`);
        process.exitCode = 1;
        return;
    }

    code += `});\n`;

    fs.writeFileSync(outputPath, code);
    console.log(`✅ Compiled: ${outputPath}`);
}

compile();
