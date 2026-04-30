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
        if (fs.existsSync(resultsDir)) fs.rmSync(resultsDir, { recursive: true, force: true });
        fs.mkdirSync(resultsDir, { recursive: true });

        // 2. INJECT VISUAL TRACE SCRIPT
        await page.addInitScript(() => {
            window.addEventListener('click', (e) => {
                const dot = document.createElement('div');
                dot.style.position = 'fixed';
                dot.style.left = (e.clientX - 10) + 'px';
                dot.style.top = (e.clientY - 10) + 'px';
                dot.style.width = '20px';
                dot.style.height = '20px';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
                dot.style.border = '2px solid red';
                dot.style.zIndex = '999999';
                dot.style.pointerEvents = 'none';
                document.body.appendChild(dot);
                setTimeout(() => dot.remove(), 2000); // Dot stays for 2s to be caught by screenshot
            }, true);
        });

        await context.tracing.start({ screenshots: true, snapshots: true });
        console.log(`\n▶️ Starting Scenario: ${scenarioId}`);
        
        for (const stepLabel of steps) {
            await this.runStep(page, stepLabel, data, resultsDir);
        }

        await context.tracing.stop({ path: path.join(resultsDir, `trace_${scenarioId}.zip`) });
        await page.screenshot({ path: path.join(resultsDir, 'STEP_FINAL.png'), fullPage: true });
        console.log(`✅ Scenario ${scenarioId} Complete.`);
    }

    private async runStep(page: Page, stepLabel: string, data: any, resultsDir: string) {
        const action = this.mappings[stepLabel];
        if (!action) {
            await page.pause();
            return;
        }

        try {
            console.log(`  └─ Executing: ${stepLabel}`);
            for (let i = 0; i < action.steps.length; i++) {
                const step = action.steps[i];
                const value = this.tokenize(step.value, data);
                const locator = page.locator(step.target);
                
                if (step.type === 'fill') {
                    await locator.fill(value, { timeout: 5000 });
                } else if (step.type === 'click') {
                    await locator.click({ timeout: 5000 });
                    // CAPTURE TRACE: Take screenshot immediately after click to catch the red dot
                    await page.waitForTimeout(200); // Small buffer for dot to appear
                    await page.screenshot({ 
                        path: path.join(resultsDir, `STEP_${stepLabel}_${i}.png`), 
                        fullPage: false 
                    });
                } else if (step.type === 'goto') {
                    await page.goto(step.target, { waitUntil: 'networkidle' });
                }
            }
        } catch (error) {
            await page.screenshot({ path: path.join(resultsDir, `error_${stepLabel}.png`) });
            await page.pause();
        }
    }

    private tokenize(value: string, data: any): string {
        if (!value) return "";
        return value.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key] || "");
    }
}
