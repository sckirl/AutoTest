import * as fs from 'fs';
import { StepMap } from './mappings';

/**
 * THE PRODUCER: CODE GENERATOR / COMPILER
 * Reads CSV -> Maps Steps -> Produces Playwright Spec
 */

function generateSpec() {
    const csvData = fs.readFileSync('scenarios.csv', 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    
    // Extract scenarios from headers (columns index 1 to second-to-last)
    const scenarioNames = headers.slice(1, -1);
    
    let fullSpecContent = `import { test, expect } from '@playwright/test';\n`;
    fullSpecContent += `import * as actions from './library';\n\n`;

    scenarioNames.forEach((scenarioName, colIndex) => {
        const actualColIndex = colIndex + 1;
        fullSpecContent += `test('${scenarioName.trim()}', async ({ page }) => {\n`;
        
        for (let i = 1; i < lines.length; i++) {
            // Handle simple CSV splitting (considering basic quotes for now)
            const row = parseCsvRow(lines[i]);
            const stepLabel = row[0].trim();
            const dataValue = row[actualColIndex]?.trim();
            const expected = row[row.length - 1]?.trim();

            if (dataValue && dataValue !== '') {
                const functionName = StepMap[stepLabel];
                if (functionName) {
                    fullSpecContent += `  // Step: ${stepLabel} | Expected: ${expected}\n`;
                    fullSpecContent += `  await actions.${functionName}(page, '${dataValue}');\n`;
                } else {
                    fullSpecContent += `  // WARNING: No mapping found for step: ${stepLabel}\n`;
                }
            }
        }
        fullSpecContent += `});\n\n`;
    });

    fs.writeFileSync('generated.spec.ts', fullSpecContent);
    console.log('✅ Generated: generated.spec.ts');
}

function parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

generateSpec();
