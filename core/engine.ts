import { test, Page } from '@playwright/test';
import * as fs from 'fs';

/**
 * The Intelligent Engine that handles the "No-Code" flow.
 * It prioritizes replaying existing mappings and triggers
 * Codegen for anything missing or broken.
 */
export class AutomationEngine {
    private mappings: any;

    constructor(mappingPath: string) {
        this.mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    }

    async runStep(page: Page, stepLabel: string, data: any) {
        const action = this.mappings[stepLabel];

        if (!action) {
            return await this.triggerManualRecording(page, stepLabel);
        }

        try {
            console.log(`[Replaying] ${stepLabel}`);
            for (const step of action.steps) {
                // Injects data from Excel into the mapping tokens {{variable}}
                const value = this.tokenize(step.value, data);
                await page.locator(step.target).fill(value, { timeout: 3000 });
            }
        } catch (error) {
            console.warn(`[Auto-Heal] Step '${stepLabel}' failed. Launching Studio for fix...`);
            await this.triggerManualRecording(page, stepLabel);
        }
    }

    private async triggerManualRecording(page: Page, label: string) {
        console.log(`[Studio] Launching Codegen for: ${label}`);
        // This is the "UI-First" moment where the user sees the browser
        // and records the action. The system will then save it back to mappings.json.
        await page.pause(); 
    }

    private tokenize(value: string, data: any): string {
        return value.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key] || "");
    }
}
