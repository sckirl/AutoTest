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
    const isMobile = process.env.AUTOTEST_PLATFORM === 'mobile';
    // ponytail: mobile output is plain CommonJS (no test framework bundled in DRIVERS/), web stays Playwright Test
    const outputPath = path.join(__dirname, isMobile ? 'executed.mobile.js' : 'executed.spec.ts');

    if (!fs.existsSync(blueprintPath) || !fs.existsSync(mappingsPath)) return;

    const scenarios = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    let runtimeData = {};
    if (fs.existsSync(runtimeDataPath)) {
        try { runtimeData = JSON.parse(fs.readFileSync(runtimeDataPath, 'utf8')); } catch(e) {}
    }

    // ponytail: use shared helpers module
    const { isSafeChain, interpolate, q } = require('./helpers');
    const ActionDB = require('./action_db');

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

    let code = '';

    if (isMobile) {
        // ponytail: no Mocha/@wdio-cli bundled in DRIVERS/ (air-gapped), run as a plain
        // async script via `node`, not a test-framework file (was describe/it/before, which
        // has no runner to interpret it and made every mobile /run fail with 0 tests found).
        code += `const { remote } = require('webdriverio');\nconst path = require('path');\nconst fs = require('fs');\n\n`;
        code += `(async () => {\n`;
        code += `  const driver = await remote({ capabilities: { platformName: 'Android', 'appium:automationName': 'UiAutomator2' } });\n`;
        code += `  try {\n`;
    } else {
        code += `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
        code += `async function markLocator(locator) {\n    try {\n        await locator.first().evaluate((el) => {\n            el.style.outline = '3px solid #ff1f1f'; el.style.boxShadow = '0 0 0 4px rgba(255,31,31,0.25)';\n        });\n    } catch (e) {}\n}\n\n`;
        code += `test.describe('Automated UAT Execution', () => {\n`;
    }

    for (const scenario of scenarios) {
        if (!scenario.Flow || scenario.Flow.length === 0) continue;
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
                code += `  try {\n    console.log('Scenario ${scenario.Scenario_ID}${testSuffix}: ${safeTitle}');\n`;
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
                const actionSteps = (mappings[step.Mapping_Key] && mappings[step.Mapping_Key].steps) || ActionDB.resolveSteps(step.Mapping_Key);
                if (actionSteps && actionSteps.length > 0) {
                    const safeKey = String(step.Mapping_Key).replace(/'/g, "\\'").replace(/\r?\n|\r/g, " ");
                    if (!isMobile) code += `      await test.step('${safeKey}', async () => {\n`;
                    
                    for (const action of actionSteps) {
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
                            if (action.type === 'goto') code += `        await page.goto(${q(finalTarget)});\n`;
                            else if (action.type === 'click') {
                                code += `        await markLocator(${loc});\n`;
                                code += `        await ${loc}.click();\n`;
                            }
                            else if (action.type === 'fill') code += `        await markLocator(${loc}); await ${loc}.fill(${q(finalValue)});\n`;
                            else if (action.type === 'press') code += `        await markLocator(${loc}); await ${loc}.press(${q(finalValue || 'Enter')});\n`;
                            else if (action.type === 'selectOption') code += `        await markLocator(${loc}); await ${loc}.selectOption(${q(finalValue)});\n`;
                            else if (action.type === 'check') code += `        await markLocator(${loc}); await ${loc}.check();\n`;
                            else if (action.type === 'uncheck') code += `        await markLocator(${loc}); await ${loc}.uncheck();\n`;
                            else if (action.type === 'toBeVisible') code += `        await markLocator(${loc}); await expect(${loc}).toBeVisible();\n`;
                            else if (action.type === 'toHaveText') code += `        await markLocator(${loc}); await expect(${loc}).toHaveText(${q(finalValue)});\n`;
                        }
                    }
                    
                    if (isMobile) {
                        code += `      await driver.pause(800);\n`;
                        code += `      await driver.saveScreenshot(path.join(resultsDir, 'STEP_${i + 1}.png'));\n`;
                    } else {
                        code += `      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});\n`;
                        code += `      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});\n`;
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
                code += `      await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {});\n`;
                code += `      await page.evaluate(() => { document.body.style.minHeight = '100vh'; window.scrollBy(0, 1); window.scrollBy(0, -1); }).catch(() => {});\n`;
                code += `      await page.screenshot({ path: path.join(resultsDir, 'FINAL.png'), fullPage: true });\n`;
                // DEF-NEW-004 FIX: Stop tracing and save trace.zip per scenario
                code += `      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });\n`;
            }
            if (isMobile) {
                code += `    }\n  } catch (e) { console.error('Scenario ${scenario.Scenario_ID}${testSuffix} failed:', e.stack || e); }\n\n`;
            } else {
                code += `    }\n  });\n\n`;
            }
        }
    }
    code += isMobile ? `  } finally {\n    await driver.deleteSession();\n  }\n})();\n` : `});\n`;
    fs.writeFileSync(outputPath, code);
}
compile();