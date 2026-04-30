import { test } from '@playwright/test';
import { AutomationEngine } from './engine';
import * as path from 'path';
import * as fs from 'fs';

// 1. Initialize Engine
const engine = new AutomationEngine(path.join(process.cwd(), 'core/mappings.json'));

// 2. Load Blueprint
const blueprintPath = path.join(process.cwd(), 'core/blueprint.json');
if (!fs.existsSync(blueprintPath)) {
    throw new Error("❌ blueprint.json not found! Run the parser first.");
}
const scenarios = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test.describe('Automated UAT Suite', () => {
    test.beforeEach(async ({ page }) => {
        // Global logic to handle common YouTube blockers
        await page.addInitScript(() => {
            window.localStorage.setItem('yt-consent-dialog-shown', 'true');
        });
    });

    for (const scenario of scenarios) {
        test(`Scenario ${scenario.Scenario_ID}: ${scenario.Role}`, async ({ page, context }) => {
            const resultsDir = path.join(process.cwd(), 'results', scenario.Scenario_ID.replace(/[^a-z0-9]/gi, '_'));
            if (fs.existsSync(resultsDir)) fs.rmSync(resultsDir, { recursive: true, force: true });
            fs.mkdirSync(resultsDir, { recursive: true });

            console.log(`▶️ Starting: ${scenario.Scenario_ID}`);

            try {
                for (let i = 0; i < scenario.Flow.length; i++) {
                    const step = scenario.Flow[i];
                    // Using test.step makes it VISIBLE in Playwright UI / Trace Viewer
                    await test.step(step.Mapping_Key, async () => {
                        await engine.runStep(page, step.Mapping_Key, step.Data, resultsDir, i);
                    });
                }
            } catch (error) {
                console.error(`❌ FAILED: ${scenario.Scenario_ID}`, error.message);
                await page.screenshot({ path: path.join(resultsDir, 'CRITICAL_ERROR.png'), fullPage: true });
                throw error;
            } finally {
                await page.screenshot({ path: path.join(resultsDir, 'FINAL_STATE.png'), fullPage: true });
            }
        });
    }
});
