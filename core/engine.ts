import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from './state-manager';

export class AutomationEngine {
    private mappings: Record<string, any>;
    private stateManager: StateManager;

    constructor(mappingPath: string) {
        if (fs.existsSync(mappingPath)) {
            this.mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        } else {
            this.mappings = {};
        }
        this.stateManager = new StateManager(path.join(__dirname, 'state.json'));
    }

    public async runStep(page: Page, stepLabel: string, data: Record<string, string>, resultsDir: string, stepIdx: number) {
        const action = this.mappings[stepLabel];
        if (!action) {
            throw new Error(`MISSING_MAPPING: "${stepLabel}" — Add it to core/mappings.json`);
        }

        for (let i = 0; i < action.steps.length; i++) {
            const step = action.steps[i];
            const value = this.tokenize(step.value, data);

            try {
                if (step.type === 'goto') {
                    await page.goto(step.target, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
                } else if (step.type === 'fill') {
                    const locator = this.resolveLocator(page, step.target).first();
                    await locator.scrollIntoViewIfNeeded();
                    await locator.waitFor({ state: 'visible', timeout: 10000 });
                    await locator.fill(value, { timeout: 10000 });
                } else if (step.type === 'upload') {
                    const locator = this.resolveLocator(page, step.target).first();
                    await locator.setInputFiles(value);
                } else if (step.type === 'click') {
                    const locator = this.resolveLocator(page, step.target).first();
                    await locator.scrollIntoViewIfNeeded();
                    await locator.waitFor({ state: 'visible', timeout: 10000 });
                    await locator.click({ timeout: 10000, force: true });
                    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
                } else if (step.type === 'press') {
                    const locator = this.resolveLocator(page, step.target).first();
                    await locator.press(step.value || 'Enter');
                    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
                } else if (step.type === 'assertVisible') {
                    const locator = this.resolveLocator(page, step.target).first();
                    await locator.scrollIntoViewIfNeeded();
                    await expect(locator).toBeVisible({ timeout: 10000 });
                } else if (step.type === 'assertText') {
                    const locator = this.resolveLocator(page, step.target).first();
                    await locator.scrollIntoViewIfNeeded();
                    await expect(locator).toContainText(value, { timeout: 10000 });
                } else if (step.type === 'eval') {
                    await page.evaluate(step.value || step.target);
                }

                const screenshotName = `STEP_${stepIdx}_ACT_${i}_${stepLabel.replace(/[^a-z0-9]/gi, '_')}.png`;
                await page.screenshot({ path: path.join(resultsDir, screenshotName), fullPage: true });

            } catch (err: any) {
                console.error(`     ❌ Error in "${stepLabel}" action ${i}:`, err.message);
                await page.screenshot({
                    path: path.join(resultsDir, `ERR_STEP_${stepIdx}_ACT_${i}.png`),
                    fullPage: true
                });
                throw err;
            }
        }
    }

    private resolveLocator(page: Page, target: string) {
        if (!target.includes('(')) {
            return page.locator(target);
        }
        const match = target.match(/^(.*?)\((.*)\)$/s);
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
        } catch (e: any) {
            console.error(`Error resolving locator "${target}":`, e.message);
        }
        return page.locator(target);
    }

    private parseArgs(rawArgs: string): any[] {
        try {
            const jsonFriendly = `[${rawArgs.replace(/'/g, '"')}]`;
            return JSON.parse(jsonFriendly);
        } catch {
            return [this.stripQuotes(rawArgs)];
        }
    }

    private stripQuotes(str: string): string {
        return str.replace(/^['""]|['""]$/g, '');
    }

    private tokenize(value: string, data: Record<string, string>): string {
        if (!value) return '';
        value = value.replace(/\{Unique_(\d+)\}/g, (match, num) => {
            const scope = num.padStart(4, '0');
            return this.stateManager.resolveOrGenerateId(scope);
        });
        return value.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] ?? '');
    }
}
