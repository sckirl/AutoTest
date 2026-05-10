const fs = require('fs');
const path = require('path');

function compile() {
    const blueprintPath = path.join(__dirname, 'blueprint.json');
    const mappingsPath = path.join(__dirname, 'mappings.json');
    const outputPath = path.join(__dirname, 'executed.spec.ts');

    if (!fs.existsSync(blueprintPath) || !fs.existsSync(mappingsPath)) return;

    const scenarios = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

    const q = (v) => JSON.stringify(String(v ?? ''));
    const safeGetBy = (target) => {
        if (typeof target !== 'string') return null;
        const m = target.match(/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\((.*)\)$/);
        if (!m) return null;
        const args = m[2];
        // DEF-053: Whitelist allowing :, {, }, , for enterprise locators
        if (!/^(['"`])[a-zA-Z0-9\s\-#\.\:\{\},\[\]\=_\/]*\1$/.test(args.trim())) return null;
        if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(args)) return null;
        return target;
    };

    let code = `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
    code += `async function markLocator(locator: any) {\n    try {\n        await locator.first().evaluate((el: any) => {\n            el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';\n        });\n    } catch (e) {}\n}\n\n`;
    
    code += `test.describe('Automated UAT Execution', () => {\n`;

    for (const scenario of scenarios) {
        const scenarioIdClean = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_');
        // DEF-032: Safe title
        const safeTitle = String(scenario.Role || '').replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
        
        code += `    test('Scenario ${scenario.Scenario_ID}: ${safeTitle}', async ({ page }) => {\n`;
        code += `        const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
        code += `        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;
        code += `        try {\n`;

        for (let i = 0; i < scenario.Flow.length; i++) {
            const step = scenario.Flow[i];
            const mapping = mappings[step.Mapping_Key];
            if (mapping) {
                // DEF-033: Safe step key
                const safeKey = String(step.Mapping_Key).replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
                code += `            await test.step('${safeKey}', async () => {\n`;
                for (let j = 0; j < mapping.steps.length; j++) {
                    const action = mapping.steps[j];
                    const target = action.target;
                    const getByTarget = safeGetBy(target);
                    let locator = getByTarget ? `page.${getByTarget}` : `page.locator(${q(target)})`;
                    const finalValue = (action.value || "").replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key] || "");

                    if (action.type === 'goto') code += `            await page.goto(${q(target)});\n`;
                    else if (action.type === 'click') {
                        code += `            await markLocator(${locator});\n`;
                        code += `            await ${locator}.click();\n`;
                    }
                    else if (action.type === 'selectOption') {
                        code += `            await markLocator(${locator}); await ${locator}.selectOption(${q(finalValue)});\n`;
                    }
                    else if (action.type === 'fill') {
                        code += `            await markLocator(${locator}); await ${locator}.fill(${q(finalValue)});\n`;
                    }
                }
                code += `            });\n\n`;
            }
        }
        code += `        } finally {\n`;
        code += `            await page.screenshot({ path: path.join(resultsDir, 'FINAL.png') });\n`;
        code += `        }\n    });\n\n`;
    }
    code += `});\n`;
    fs.writeFileSync(outputPath, code);
}
compile();
