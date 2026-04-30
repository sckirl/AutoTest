import { test } from '@playwright/test';
import { parseDynamicExcel } from './parser';
import { AutomationEngine } from './engine';
import * as path from 'path';

// 1. Initialize Engine and Parse Excel
const engine = new AutomationEngine(path.join(process.cwd(), 'core/mappings.json'));
const scenarios = parseDynamicExcel(path.join(process.cwd(), 'scenario_pukat.xlsx'));

test.describe('No-Code Automation Suite - Pukat Master', () => {
    for (const scenario of scenarios) {
        test(`Execution: ${scenario.Scenario_ID}`, async ({ page, context }) => {
            // 2. Run the Intelligent Replay
            await engine.runScenario(
                page, 
                context, 
                scenario.Scenario_ID, 
                scenario.Steps, 
                scenario.Data
            );
        });
    }
});
