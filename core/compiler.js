const fs = require('fs');
const path = require('path');

require('./helpers').ensureDriversPath(module, __dirname);

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
    const { isSafeChain, interpolate, q, hasSensitiveKey } = require('./helpers');
    const ActionDB = require('./action_db');

    // A0.7.6: an accessible name containing a literal `"` (e.g. `Delete "All" Records`) used
    // to be interpolated into the XPath string unescaped, producing a broken or hijacked
    // expression. XPath 1.0 (what Appium's UiAutomator2 speaks) has no escape character for
    // quotes inside a string literal — concat() is the standard workaround when a name has both.
    function xpathEscape(v) {
        if (!v.includes('"')) return `"${v}"`;
        if (!v.includes("'")) return `'${v}'`;
        return `concat(${v.split('"').map(p => `"${p}"`).join(", '\"', ")})`;
    }

    function translateToMobileLocator(pwLocator, finalValue) {
        if (!pwLocator) return "";
        if (pwLocator.startsWith('/') || pwLocator.startsWith('#') || pwLocator.startsWith('.')) return pwLocator;

        // A0.7.6: the role/text/label regexes below use a backreference (\2 / \1) so the
        // closing quote must match whichever quote character opened the name — otherwise an
        // embedded quote of the OTHER type (e.g. Delete "All" Records) truncates the match
        // before it even reaches xpathEscape, which is exactly the confirmed bypass.
        const roleMatch = pwLocator.match(/getByRole\(['"](.*?)['"],\s*\{\s*name:\s*(['"])(.*?)\2\s*\}\)/);
        if (roleMatch) return `//*[@text=${xpathEscape(roleMatch[3])} or @content-desc=${xpathEscape(roleMatch[3])}]`;

        const textMatch = pwLocator.match(/getByText\((['"])(.*?)\1\)/);
        if (textMatch) return `//*[@text=${xpathEscape(textMatch[2])} or @content-desc=${xpathEscape(textMatch[2])}]`;

        const labelMatch = pwLocator.match(/getByLabel\((['"])(.*?)\1\)/);
        if (labelMatch) return `//*[@text=${xpathEscape(labelMatch[2])} or @content-desc=${xpathEscape(labelMatch[2])}]`;

        // Only a genuinely bare/non-getBy* target falls back to using the typed value as the
        // accessible name — a recognized-but-untranslated getBy*() call must throw below, not
        // silently reuse whatever value happened to be typed as a bogus locator guess.
        if (!/^getBy\w+\(/.test(pwLocator) && finalValue && !finalValue.includes('{')) {
            return `//*[@text=${xpathEscape(finalValue)} or @content-desc=${xpathEscape(finalValue)}]`;
        }
        // A0.7.6: an unsupported locator type (getByPlaceholder, getByTestId, raw CSS, ...) used
        // to fall through here unchanged and get handed to driver.$() as invalid Playwright-syntax
        // text. Fail loudly at compile time instead of producing a selector that can't work.
        throw new Error(`Unsupported locator for mobile: "${pwLocator}" — re-record this step using a role/text/label-based locator.`);
    }

    let code = '';

    if (isMobile) {
        // ponytail: no Mocha/@wdio-cli bundled in DRIVERS/ (air-gapped), run as a plain
        // async script via `node`, not a test-framework file (was describe/it/before, which
        // has no runner to interpret it and made every mobile /run fail with 0 tests found).
        code += `const { remote } = require('webdriverio');\nconst path = require('path');\nconst fs = require('fs');\n\n`;
        code += `(async () => {\n`;
        code += `  let __failures = 0;\n`; // A0.7.2 FIX: see below — turns a swallowed per-scenario
        // error into a process exit code /run-status already knows how to read.
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
            // A0.5.2: tracing.start() has no way to redact a single value it just records the
            // whole call log verbatim, confirmed by running it. So skip tracing entirely, for
            // this scenario+iteration, if any Data key it's drawing from looks like a credential.
            const isSensitive = hasSensitiveKey(iterData) || scenario.Flow.some(s => hasSensitiveKey(s.Data));

            if (isMobile) {
                code += `  try {\n    console.log('Scenario ${scenario.Scenario_ID}${testSuffix}: ${safeTitle}');\n`;
            } else {
                code += `  test('Scenario ${scenario.Scenario_ID}${testSuffix}: ${safeTitle}', async ({ page }) => {\n`;
            }
            
            code += `    const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
            code += `    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;
            // DEF-NEW-004 FIX: Start per-scenario Playwright tracing for UAT evidence
            if (!isMobile && !isSensitive) {
                code += `    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });\n`;
            } else if (!isMobile) {
                code += `    fs.writeFileSync(path.join(resultsDir, 'TRACE_WITHHELD.txt'), 'trace.zip omitted: this scenario\\'s Test Data includes a password/secret/token/pin-like value. Screenshots are still captured as evidence.');\n`;
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
                if (!isSensitive) {
                    code += `      await page.context().tracing.stop({ path: path.join(resultsDir, 'trace.zip') });\n`;
                }
            }
            if (isMobile) {
                // A0.7.2 FIX: this catch used to only console.error — the process always exited
                // 0, so server.js's /run-status (`activeRun.error` set only `if (code !== 0)`)
                // could never see a mobile failure. Count it and let it surface via exit code.
                code += `    }\n  } catch (e) { __failures++; console.error('Scenario ${scenario.Scenario_ID}${testSuffix} failed:', e.stack || e); }\n\n`;
            } else {
                code += `    }\n  });\n\n`;
            }
        }
    }
    code += isMobile ? `  } finally {\n    await driver.deleteSession();\n    if (__failures > 0) process.exitCode = 1;\n  }\n})();\n` : `});\n`;
    fs.writeFileSync(outputPath, code);
}

try {
    compile();
} catch (e) {
    // A0.5.4 follow-up: server.js's /run spawns this via execSync, which only sees a
    // generic "Command failed" — the real reason (e.g. an unresolved {key}) never reached
    // the tester. Write it where /run can read it back regardless of the child's stdio.
    try { fs.writeFileSync(path.join(__dirname, 'compile_error.json'), JSON.stringify({ error: e.message })); } catch (e2) {}
    console.error(e.message);
    process.exitCode = 1;
}