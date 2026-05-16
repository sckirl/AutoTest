const fs = require('fs');
const path = require('path');

function compile() {
    const blueprintPath = path.join(__dirname, 'blueprint.json');
    const mappingsPath = path.join(__dirname, 'mappings.json');
    const runtimeDataPath = path.join(__dirname, 'runtime_data.json');
    const outputPath = path.join(__dirname, 'executed.spec.ts');

    if (!fs.existsSync(blueprintPath) || !fs.existsSync(mappingsPath)) return;

    const scenarios = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    let runtimeData = {};
    if (fs.existsSync(runtimeDataPath)) {
        try { runtimeData = JSON.parse(fs.readFileSync(runtimeDataPath, 'utf8')); } catch(e) {}
    }

    const q = (v) => JSON.stringify(String(v ?? ''));
    const safeGetBy = (target) => {
        if (typeof target !== 'string') return null;
        const m = target.match(/^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\((.*)\)$/);
        if (!m) return null;
        const args = m[2];
        // Strictly allow only quotes, alphanumeric, space, and safe selector chars. Block ANY operators or nested calls.
        if (!/^[a-zA-Z0-9\s\-#\.\:\{\},\[\]\=_\/'"`]*$/.test(args.trim())) return null;
        if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(args)) return null;
        if (/[?();]/.test(args)) return null; // Block function calls or ternary operators inside getBy
        return target;
    };

    const interpolate = (templateStr, iterData, fallbackObj) => {
        if (!templateStr) return "";
        let processedStr = String(templateStr);
        
        // Double-Quote Prevention Rule: Strip surrounding quotes from {Variable}
        processedStr = processedStr.replace(/['"]\{([a-zA-Z0-9_]+)\}['"]/g, '{$1}');
        
        // Replace {Variable} (Single Bracket Notation)
        processedStr = processedStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
            let val = "";
            if (iterData && iterData[key] !== undefined && iterData[key] !== null && iterData[key] !== "") {
                val = iterData[key];
            } else if (fallbackObj && fallbackObj[key] !== undefined && fallbackObj[key] !== null) {
                val = fallbackObj[key];
            }
            return val;
        });

        return processedStr;
    };

    const isMobile = process.env.AUTOTEST_PLATFORM === 'mobile';
    let code = '';
    if (isMobile) {
        code += `const { remote } = require('webdriverio');\nconst path = require('path');\nconst fs = require('fs');\n\n`;
    } else {
        code += `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
    }
    code += `async function markLocator(locator: any) {\n    try {\n        await locator.first().evaluate((el: any) => {\n            el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';\n        });\n    } catch (e) {}\n}\n\n`;
    
    code += `test.describe('Automated UAT Execution', () => {\n`;

    for (const scenario of scenarios) {
        let iterations = runtimeData[scenario.Scenario_ID];
        if (!Array.isArray(iterations) || iterations.length === 0) {
            iterations = [null]; // 1 run, using fallback Excel data only
        }

        for (let itIdx = 0; itIdx < iterations.length; itIdx++) {
            const iterData = iterations[itIdx];
            const testSuffix = iterData ? ` - Iteration ${itIdx + 1}` : '';
            const scenarioIdClean = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_') + (iterData ? `_Iter${itIdx + 1}` : '');
            
            const safeTitle = String(scenario.Role || '').replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
            
            code += `    test('Scenario ${scenario.Scenario_ID}${testSuffix}: ${safeTitle}', async ({ page }) => {\n`;
            code += `        const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
            code += `        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;
            code += `        try {\n`;

            for (let i = 0; i < scenario.Flow.length; i++) {
                const step = scenario.Flow[i];
                const mapping = mappings[step.Mapping_Key];
                if (mapping) {
                    const safeKey = String(step.Mapping_Key).replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
                    code += `            await test.step('${safeKey}', async () => {\n`;
                    for (let j = 0; j < mapping.steps.length; j++) {
                        const action = mapping.steps[j];
                        
                        // Safe Interpolation
                        const finalTarget = interpolate(action.target, iterData, step.Data);
                        const finalValue = interpolate(action.value, iterData, step.Data);


                        const getByTarget = safeGetBy(finalTarget);
                        let locator = getByTarget ? `page.${getByTarget}` : `page.locator(${q(finalTarget)})`;
                        let mobileLocator = `driver.$(${q(finalTarget)})`;
                        
                        if (action.type === 'goto') {
                            if (isMobile) code += `            // ignore goto on mobile\n`;
                            else code += `            await page.goto(${q(finalTarget)});\n`;
                        }
                        else if (action.type === 'click') {
                            if (isMobile) {
                                code += `            await ${mobileLocator}.click();\n`;
                            } else {
                                code += `            await markLocator(${locator});\n`;
                                code += `            await ${locator}.click();\n`;
                            }
                        }
                        else if (action.type === 'selectOption') {
                            if (isMobile) {
                                code += `            await ${mobileLocator}.selectByVisibleText(${q(finalValue)});\n`;
                            } else {
                                code += `            await markLocator(${locator}); await ${locator}.selectOption(${q(finalValue)});\n`;
                            }
                        }
                        else if (action.type === 'fill' || action.type === 'type') {
                            if (isMobile) {
                                code += `            await ${mobileLocator}.setValue(${q(finalValue)});\n`;
                            } else {
                                code += `            await markLocator(${locator}); await ${locator}.fill(${q(finalValue)});\n`;
                            }
                        }
                        else if (action.type === 'press') {
                            if (!isMobile) {
                                code += `            await markLocator(${locator}); await ${locator}.press(${q(finalValue || 'Enter')});\n`;
                            }
                        }

                    }
                    if (isMobile) {
                        code += `            await driver.pause(500);\n`;
                    } else {
                        code += `            await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);\n`;
                    }
                    if (isMobile) {
                        code += `            await driver.saveScreenshot(path.join(resultsDir, 'STEP_${i + 1}_' + '${safeKey}'.replace(/[^a-z0-9]/gi, '_') + '.png'));\n`;
                    } else {
                        code += `            await page.screenshot({ path: path.join(resultsDir, 'STEP_${i + 1}_' + '${safeKey}'.replace(/[^a-z0-9]/gi, '_') + '.png') });\n`;
                    }
                    if (!isMobile) code += `            });\n\n`;
                }
            }
            code += `        } finally {\n`;
            if (isMobile) {
                code += `            await driver.pause(500);\n`;
                code += `            await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));\n`;
            } else {
                code += `            await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);\n`;
                code += `            await page.screenshot({ path: path.join(resultsDir, 'FINAL.png') });\n`;
            }
            code += `        }\n    });\n\n`;
        }
    }
    code += `});\n`;
    fs.writeFileSync(outputPath, code);
}
compile();
