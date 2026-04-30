import { test, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class AutomationEngine {
    private mappings: any;

    constructor(mappingPath: string) {
        this.mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    }

    async runScenario(page: Page, context: BrowserContext, scenarioId: string, steps: any[], data: any) {
        const resultsDir = path.join(process.cwd(), 'results', scenarioId);
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Start Tracing for "Click Marks" and Screenshots
        await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

        console.log(`\n▶️ Starting Scenario: ${scenarioId}`);
        
        for (const stepLabel of steps) {
            await this.runStep(page, stepLabel, data, resultsDir);
        }

        // Stop Tracing and save to the scenario folder
        await context.tracing.stop({ path: path.join(resultsDir, `trace_${scenarioId}.zip`) });
        
        // Take a final screenshot for the folder
        await page.screenshot({ path: path.join(resultsDir, 'final_result.png'), fullPage: true });
        console.log(`✅ Scenario ${scenarioId} Complete. Results in: ${resultsDir}`);
    }

    private async runStep(page: Page, stepLabel: string, data: any, resultsDir: string) {
        const action = this.mappings[stepLabel];

        if (!action) {
            console.warn(`[!] Missing Mapping: '${stepLabel}'. Launching Studio...`);
            await page.pause();
            return;
        }

        try {
            console.log(`  └─ Executing: ${stepLabel}`);
            for (const step of action.steps) {
                const value = this.tokenize(step.value, data);
                const locator = page.locator(step.target);
                
                if (step.type === 'fill') {
                    await locator.fill(value, { timeout: 5000 });
                } else if (step.type === 'click') {
                    await locator.click({ timeout: 5000 });
                } else if (step.type === 'goto') {
                    await page.goto(step.target, { waitUntil: 'networkidle' });
                }
            }
        } catch (error) {
            console.error(`  ❌ Auto-Heal Triggered for '${stepLabel}'`);
            await page.screenshot({ path: path.join(resultsDir, `error_${stepLabel}.png`) });
            await page.pause();
        }
    }

    private tokenize(value: string, data: any): string {
        if (!value) return "";
        return value.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key] || "");
    }
}
