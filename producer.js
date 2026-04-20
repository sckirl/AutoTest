const XLSX = require('xlsx');
const fs = require('fs');

const StepMap = {
    "Latest Feed Clicked": "clickHeaderProducts",
    "Cluster Buys Clicked": "clickCategoryMen",
    "Min. unique insiders change to 10": "fillFooterSubscriptionEmail",
    "Min. unique insiders change to 2": "fillFooterSubscriptionEmail",
    "Rolling Window (Days) 30 Days": "clickHeaderCart"
};

function generateSpec() {
    console.log('🚀 Compiling Book11.xlsx...');
    const workbook = XLSX.readFile('Book11.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let fullSpecContent = `import { test, expect } from '@playwright/test';\n`;
    fullSpecContent += `import * as actions from './library';\n\n`;

    const blocks = [];
    for (let r = 0; r < data.length; r++) {
        const firstCell = String(data[r][0] || '').trim();
        
        // Match A.1, A.2, etc. (More flexible regex)
        if (firstCell.startsWith('A.')) {
            const blockName = firstCell;
            const steps = [];
            
            let stepRow = r + 1;
            while (stepRow < data.length) {
                const stepNum = String(data[stepRow][0] || '').trim();
                const scriptValue = String(data[stepRow][5] || '').trim(); // Column F
                
                // If it looks like a step number
                if (stepNum.match(/^\d+$/)) {
                    // Scenario A.2 has scriptValue in Column B (Index 1) based on raw dump
                    const fallbackScript = String(data[stepRow][1] || '').trim();
                    const finalScript = scriptValue || fallbackScript;
                    
                    if (finalScript !== '' && finalScript !== '0') {
                        steps.push({ scriptValue: finalScript });
                    }
                    stepRow++;
                } else if (stepNum === '' && scriptValue === '') {
                    stepRow++;
                } else {
                    break;
                }
            }
            if (steps.length > 0) {
                blocks.push({ name: blockName, steps });
            }
        }
    }

    console.log(`🔍 Detected ${blocks.length} Scenario(s).`);

    blocks.forEach(block => {
        fullSpecContent += `test('${block.name}', async ({ page }) => {\n`;
        block.steps.forEach(step => {
            const functionName = StepMap[step.scriptValue];
            if (functionName) {
                fullSpecContent += `  // Step: ${step.scriptValue}\n`;
                fullSpecContent += `  await actions.${functionName}(page, '');\n`;
            } else {
                fullSpecContent += `  // WARNING: No mapping for '${step.scriptValue}'\n`;
            }
        });
        fullSpecContent += `});\n\n`;
    });

    fs.writeFileSync('generated.spec.ts', fullSpecContent);
    console.log('✅ Generated: generated.spec.ts');
}

generateSpec();
