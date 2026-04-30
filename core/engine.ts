import { Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class AutomationEngine {
    private mappings: any;

    constructor(mappingPath: string) {
        if (fs.existsSync(mappingPath)) {
            this.mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        } else {
            this.mappings = {};
        }
    }

    async runScenario(page: Page, context: BrowserContext, scenarioId: string, steps: any[], data: any) {
        const resultsDir = path.join(process.cwd(), 'results', scenarioId);
        if (fs.existsSync(resultsDir)) fs.rmSync(resultsDir, { recursive: true, force: true });
        fs.mkdirSync(resultsDir, { recursive: true });

        // 2. INJECT VISUAL TRACE SCRIPT (Force red dots to be persistent enough for screenshot)
        await page.addInitScript(() => {
            window.addEventListener('mousedown', (e) => {
                const dot = document.createElement('div');
                dot.id = 'automation-click-dot';
                dot.style.position = 'fixed';
                dot.style.left = (e.clientX - 15) + 'px';
                dot.style.top = (e.clientY - 15) + 'px';
                dot.style.width = '30px';
                dot.style.height = '30px';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                dot.style.border = '3px solid white';
                dot.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
                dot.style.zIndex = '2147483647';
                dot.style.pointerEvents = 'none';
                document.body.appendChild(dot);
                setTimeout(() => dot.remove(), 3000); 
            }, true);
        });

        await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
        console.log(`\n▶️ Starting Scenario: ${scenarioId}`);
        
        try {
            for (const stepLabel of steps) {
                await this.runStep(page, stepLabel, data, resultsDir);
            }
            console.log(`✅ Scenario ${scenarioId} Complete.`);
        } catch (error) {
            console.error(`❌ Scenario ${scenarioId} FAILED:`, error.message);
            await page.screenshot({ path: path.join(resultsDir, 'ERROR_STATE.png'), fullPage: true });
            throw error;
        } finally {
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
            await page.screenshot({ path: path.join(resultsDir, 'FINAL_VIEW.png'), fullPage: true });
            await context.tracing.stop({ path: path.join(resultsDir, `trace_${scenarioId}.zip`) });
        }
    }

    private async runStep(page: Page, stepLabel: string, data: any, resultsDir: string) {
        const action = this.mappings[stepLabel];
        if (!action) {
            console.warn(`⚠️ Warning: No mapping found for "${stepLabel}".`);
            // THE CRITICAL "PAUSE FOR PM" LOGIC
            // Instead of throwing, we let the server know we need a recording here
            throw new Error(`MISSING_MAPPING: ${stepLabel}`);
        }

        console.log(`  └─ Executing: ${stepLabel}`);
        for (let i = 0; i < action.steps.length; i++) {
            const step = action.steps[i];
            const value = this.tokenize(step.value, data);
            const locator = this.resolveLocator(page, step.target);
            
            try {
                // Ensure element is ready
                await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                
                if (step.type === 'fill') {
                    await locator.fill(value, { timeout: 10000 });
                } else if (step.type === 'click') {
                    // Pre-click screenshot
                    await locator.scrollIntoViewIfNeeded().catch(() => {});
                    
                    await locator.click({ timeout: 10000 });
                    
                    // POST-CLICK CAPTURE: Wait for stability
                    await page.waitForLoadState('domcontentloaded').catch(() => {});
                    await page.waitForTimeout(500); // Wait for red dot & animations
                    
                    await page.screenshot({ 
                        path: path.join(resultsDir, `STEP_${i}_${stepLabel.replace(/[^a-z0-9]/gi, '_')}.png`), 
                        fullPage: true // CHANGE TO FULLPAGE TO AVOID WHITE BLANKS IN VIEWPORT
                    });
                } else if (step.type === 'goto') {
                    await page.goto(step.target, { waitUntil: 'networkidle' });
                }
            } catch (err) {
                console.error(`Error in step "${stepLabel}" action ${i}:`, err.message);
                throw err;
            }
        }
    }

    private resolveLocator(page: Page, target: string) {
        const match = target.match(/^(.*?)\((.*)\)$/);
        if (!match) return page.locator(target);

        const method = match[1];
        const rawArgs = match[2];

        try {
            if (method === 'locator') {
                return page.locator(this.stripQuotes(rawArgs));
            } else if (method.startsWith('getBy')) {
                const args = this.parseArgs(rawArgs);
                return (page as any)[method](...args);
            }
        } catch (e) {
            console.error(`Error resolving locator "${target}":`, e);
        }
        return page.locator(target);
    }

    private parseArgs(rawArgs: string): any[] {
        try {
            // Support for { name: '...' } pattern
            const jsonFriendly = `[${rawArgs.replace(/'/g, '"')}]`;
            return JSON.parse(jsonFriendly);
        } catch (e) {
            return [this.stripQuotes(rawArgs)];
        }
    }

    private stripQuotes(str: string) {
        return str.replace(/^['"]|['"]$/g, '');
    }

    private tokenize(value: string, data: any): string {
        if (!value) return "";
        return value.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key] || "");
    }
}
