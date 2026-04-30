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

    let code = `import { test, expect } from '@playwright/test';\nimport * as path from 'path';\nimport * as fs from 'fs';\n\n`;
    
    code += `test.describe('Automated UAT Execution', () => {\n`;
    code += `    test.describe.configure({ mode: 'serial' });\n\n`;
    code += `    test.beforeEach(async ({ page }) => {\n`;
    code += `        await page.addInitScript(() => {\n`;
    code += `            window.localStorage.setItem('yt-consent-dialog-shown', 'true');\n`;
    code += `        });\n`;
    code += `    });\n\n`;

    for (const scenario of scenarios) {
        const scenarioIdClean = scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_');
        code += `    test('Scenario ${scenario.Scenario_ID}: ${scenario.Role}', async ({ page }) => {\n`;
        code += `        const resultsDir = path.join(process.cwd(), 'results', '${scenarioIdClean}');\n`;
        code += `        if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });\n\n`;

        for (let i = 0; i < scenario.Flow.length; i++) {
            const step = scenario.Flow[i];
            const mapping = mappings[step.Mapping_Key];
            
            if (mapping) {
                code += `        await test.step('${step.Mapping_Key}', async () => {\n`;
                for (let j = 0; j < mapping.steps.length; j++) {
                    const action = mapping.steps[j];
                    const target = action.target;
                    const value = action.value || "";
                    
                    // Token replacement
                    const finalValue = value.replace(/\{\{(.*?)\}\}/g, (_, key) => step.Data[key] || "");
                    
                    let locator = target.startsWith('getBy') ? `page.${target}` : `page.locator(\`${target}\`)`;

                    if (action.type === 'goto') {
                        code += `            await page.goto(\`${target}\`, { waitUntil: 'domcontentloaded' });\n`;
                        code += `            try {\n`;
                        code += `                const acceptBtn = page.locator('button[aria-label="Accept all"], button[aria-label="Accept the use of cookies and other data for the purposes described"], button:has-text("Accept all")').first();\n`;
                        code += `                await acceptBtn.waitFor({ state: 'visible', timeout: 3000 });\n`;
                        code += `                await acceptBtn.click({ force: true });\n`;
                        code += `            } catch (e) {}\n`;
                    }
                    else if (action.type === 'click') code += `            await ${locator}.click({ force: true });\n`;
                    else if (action.type === 'fill') code += `            await ${locator}.fill(\`${finalValue}\`);\n`;
                    else if (action.type === 'press') code += `            await ${locator}.press(\`${finalValue || 'Enter'}\`);\n`;
                    
                    code += `            await page.waitForTimeout(500);\n`;
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

compile();
