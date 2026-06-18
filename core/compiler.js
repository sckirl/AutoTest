const fs = require('fs');
const path = require('path');

// Banking Block Compliance: Strict DRIVERS/ Resolution
const DRIVERS_PATH = path.join(__dirname, '../DRIVERS/node_modules');
if (fs.existsSync(DRIVERS_PATH)) {
    module.paths.unshift(DRIVERS_PATH);
    process.env.NODE_PATH = DRIVERS_PATH;
    require('module').Module._initPaths();
}

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
    
    function translateToMobileLocator(pwLocator, finalValue) {
        if (!pwLocator) return "";
        if (pwLocator.startsWith('/') || pwLocator.startsWith('#') || pwLocator.startsWith('.')) return pwLocator;

        const roleMatch = pwLocator.match(/getByRole\(['"](.*?)['"],\s*\{\s*name:\s*['"](.*?)['"]\s*\}\)/);
        if (roleMatch) return `//*[@text="${roleMatch[2]}" or @content-desc="${roleMatch[2]}"]`;

        const textMatch = pwLocator.match(/getByText\(['"](.*?)['"]\)/);
        if (textMatch) return `//*[@text="${textMatch[1]}" or @content-desc="${textMatch[1]}"]`;

        const labelMatch = pwLocator.match(/getByLabel\(['"](.*?)['"]\)/);
        if (labelMatch) return `//*[@text="${labelMatch[1]}" or @content-desc="${labelMatch[1]}"]`;

        if (finalValue && !finalValue.includes('{')) return `//*[@text="${finalValue}" or @content-desc="${finalValue}"]`;
        return pwLocator;
    }

    const isSafeChain = (target) => {
        if (typeof target !== 'string') return null;
        if (!target.match(/^(getBy|locator|frameLocator)/)) return null;
        if (/\b(require|exec|eval|process|import|global|constructor|window|document)\b/.test(target)) return null;
        return target;
    };

    const interpolate = (templateStr, iterData, fallbackObj) => {
        if (!templateStr) return "";
        let processedStr = String(templateStr);
        processedStr = processedStr.replace(/['"]\{([a-zA-Z0-9_]+)\}['"]/g, '{$1}');
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
        code += `describe('Automated UAT Execution (Mobile)', function() {\n`;
        code += `  let driver;\n`;
        code += `  before(async () => {\n`;
        code += `    driver = await remote({ capabilities: { platformName: 'Android', 'appium:automationName': 'UiAutomator2' } });\n`;
        code += `  });\n`;
        code += `  after(async () => {\n`;
        code += `    if (driver) await driver.deleteSession();\n`;
        code += `  });\n\n`;
    } else {
        code += `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
        code += `async function markLocator(locator) {\n    try {\n        await locator.first().evaluate((el) => {\n            el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';\n        });\n    } catch (e) {}\n}\n\n`;
        code += `test.describe('Automated UAT Execution', () => {\n`;
    }

    for (const scenario of scenarios) {
        let iterations = runtimeData[scenario.Scenario_ID];
        if (!Array.isArray(iterations) || iterations.length === 0) {
            iterations = [null];
        }

        for (let itIdx = 0; itIdx < iterations.length; itIdx++) {
            const iterData = iterations[itIdx];
            const testSuffix = iterData ? ` - Iteration ${itIdx + 1}` : '';
            const scenarioIdClean = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_') + (iterData ? `_Iter${itIdx + 1}` : '');
            const safeTitle = String(scenario.Role || '').replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
            
            if (isMobile) {
                code += `  it('Scenario ${scenario.Scenario_ID}${testSuffix}: ${safeTitle}', async () => {\n`;
            } else {
                code += `  test('Scenario ${scenario.Scenario_ID}${testSuffix}: ${safeTitle}', async ({ page }) => {\n`;
            }
            
            code += `    const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
            code += `    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;
            // DEF-NEW-004 FIX: Start per-scenario Playwright tracing for UAT evidence
            if (!isMobile) {
                code += `    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });\n`;
            }
            code += `    try {\n`;

            for (let i = 0; i < scenario.Flow.length; i++) {
                const step = scenario.Flow[i];
                const mapping = mappings[step.Mapping_Key];
                if (mapping) {
                    const safeKey = String(step.Mapping_Key).replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
                    if (!isMobile) code += `      await test.step('${safeKey}', async () => {\n`;
                    
                    for (const action of mapping.steps) {
                        const finalTarget = interpolate(action.target, iterData, step.Data);
                        const finalValue = interpolate(action.value, iterData, step.Data);
                        
                        if (isMobile) {
                            const mobileTarget = translateToMobileLocator(finalTarget, finalValue);
                            const loc = `driver.$(${q(mobileTarget)})`;
                            
                            if (action.type === 'goto') code += `        await driver.url(${q(finalTarget)});\n`;
                            else if (action.type === 'click') code += `        await ${loc}.click();\n`;
                            else if (action.type === 'fill') code += `        await ${loc}.setValue(${q(finalValue)});\n`;
                            else if (action.type === 'press') code += `        await driver.keys(${q(finalValue || 'Enter')});\n`;
                        } else {
                            const safeTarget = isSafeChain(finalTarget);
                            const loc = safeTarget ? `page.${safeTarget}` : `page.locator(${q(finalTarget)})`;
                            if (action.type === 'goto') code += `        await page.goto(${q(finalTarget)}, { waitUntil: 'networkidle' });\n`;
                            else if (action.type === 'click') {
                                code += `        await markLocator(${loc});\n`;
                                code += `        await ${loc}.click();\n`;
                            }
                            else if (action.type === 'fill') code += `        await markLocator(${loc}); await ${loc}.fill(${q(finalValue)});\n`;
                            else if (action.type === 'press') code += `        await markLocator(${loc}); await ${loc}.press(${q(finalValue || 'Enter')});\n`;
                            else if (action.type === 'toBeVisible') code += `        await markLocator(${loc}); await expect(${loc}).toBeVisible();\n`;
                            else if (action.type === 'toHaveText') code += `        await markLocator(${loc}); await expect(${loc}).toHaveText(${q(finalValue)});\n`;
                        }
                    }
                    
                    if (isMobile) {
                        code += `      await driver.pause(800);\n`;
                        code += `      await driver.saveScreenshot(path.join(resultsDir, 'STEP_${i + 1}.png'));\n`;
                    } else {
                        code += `      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});\n`;
                        code += `      await page.screenshot({ path: path.join(resultsDir, 'STEP_${i + 1}.png'), fullPage: true });\n`;
                        code += `      });\n`;
                    }
                }
            }
            code += `    } finally {\n`;
            if (isMobile) {
                code += `      await driver.pause(800);\n`;
                code += `      await driver.saveScreenshot(path.join(resultsDir, 'FINAL.png'));\n`;
            } else {
                code += `      await page.waitForTimeout(1000); await page.waitForLoadState('networkidle').catch(() => {});\n`;
                code += `      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });\n`;
                // DEF-NEW-004 FIX: Stop tracing and save trace.zip per scenario
                code += `      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });\n`;
            }
            code += `    }\n  });\n\n`;
        }
    }
    code += `});\n`;
    fs.writeFileSync(outputPath, code);
}
compile();