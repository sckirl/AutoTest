import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

// Load Blueprint and Dictionary
const blueprint = JSON.parse(fs.readFileSync('core/blueprint.json', 'utf8'));
let dictionary = JSON.parse(fs.readFileSync('core/mappings.json', 'utf8'));

/**
 * Replaces {{variables}} in the string with values from the data object.
 */
function injectData(value: string, data: any): string {
    if (!value) return value;
    const match = value.match(/\{\{(.*?)\}\}/);
    if (match && data[match[1]]) {
        return value.replace(match[0], data[match[1]]);
    }
    return value;
}

/**
 * Executes a single mapped action from the Dictionary.
 */
async function executeMapping(page: Page, mappingKey: string, data: any) {
    const mapping = dictionary[mappingKey];
    
    // Auto-heal / Missing Mapping Flow (Trigger Codegen)
    if (!mapping) {
        console.log(`[!] Mapping '${mappingKey}' not found. Pausing for manual UI recording...`);
        // Pause triggers Playwright Inspector. The user manually clicks/records the missing step.
        // A custom watcher would normally save the newly generated code back to mappings.json.
        await page.pause(); 
        
        // Reload dictionary in case the user saved a new mapping during the pause
        dictionary = JSON.parse(fs.readFileSync('core/mappings.json', 'utf8'));
        return; 
    }

    // Standard Replay with Data Injection
    console.log(`Executing: ${mappingKey}`);
    for (const step of mapping.steps) {
        try {
            // Replay with strict timeout for auto-healing
            const target = step.target;
            const value = injectData(step.value, data);

            if (step.type === 'fill') {
                await page.locator(target).fill(value, { timeout: 5000 });
            } else if (step.type === 'click') {
                await page.locator(target).click({ timeout: 5000 });
            }
        } catch (error) {
            // Auto-Healing Catch Block
            console.error(`[!] Failed at '${mappingKey}' step: ${step.target}. UI may have changed.`);
            console.log(`[!] Pausing for user to re-record the broken step...`);
            // Launch inspector so user can fix it right where it broke
            await page.pause();
        }
    }
}

// Data-Driven Execution Loop
test.describe('Automated Engine UI Replay', () => {
    for (const scenario of blueprint) {
        test(`Scenario: ${scenario.Scenario_ID} - ${scenario.Role}`, async ({ page }) => {
            for (const step of scenario.Flow) {
                await executeMapping(page, step.Mapping_Key, step.Data);
            }
            // Add implicit assert point
            console.log(`Finished scenario: ${scenario.Scenario_ID}`);
        });
    }
});
