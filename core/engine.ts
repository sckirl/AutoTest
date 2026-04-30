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

    public async runStep(page: Page, stepLabel: string, data: any, resultsDir: string, stepIdx: number) {
        const action = this.mappings[stepLabel];
        if (!action) {
            throw new Error(`MISSING_MAPPING: ${stepLabel}`);
        }

        for (let i = 0; i < action.steps.length; i++) {
            const step = action.steps[i];
            const value = this.tokenize(step.value, data);
            const locator = this.resolveLocator(page, step.target);
            
            try {
                if (step.type === 'fill') {
                    await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                    await locator.fill(value, { timeout: 10000 });
                } else if (step.type === 'click') {
                    await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                    await locator.click({ timeout: 10000, force: true });
                } else if (step.type === 'goto') {
                    await page.goto(step.target, { waitUntil: 'networkidle' });
                } else if (step.type === 'press') {
                    await locator.press(step.value || 'Enter');
                }

                // Wait for UI to settle
                await page.waitForTimeout(500);
                const screenshotName = `STEP_${stepIdx}_ACT_${i}_${stepLabel.replace(/[^a-z0-9]/gi, '_')}.png`;
                await page.screenshot({ path: path.join(resultsDir, screenshotName), fullPage: true });

            } catch (err) {
                console.error(`     ❌ Error in action ${i}:`, err.message);
                await page.screenshot({ path: path.join(resultsDir, `ERR_STEP_${stepIdx}_ACT_${i}.png`), fullPage: true });
                throw err;
            }
        }
    }

    private resolveLocator(page: Page, target: string) {
        if (!target.includes('(')) {
            return page.locator(target);
        }

        const match = target.match(/^(.*?)\((.*)\)$/);
        if (!match) return page.locator(target);

        const method = match[1];
        const rawArgs = match[2];

        try {
            if (method === 'locator') {
                return page.locator(this.stripQuotes(rawArgs));
            } else if (method.startsWith('getBy')) {
                const args = this.parseArgs(rawArgs);
                if (typeof (page as any)[method] === 'function') {
                    return (page as any)[method](...args);
                }
            }
        } catch (e) {
            console.error(`Error resolving complex locator "${target}":`, e.message);
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
