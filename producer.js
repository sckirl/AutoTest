const XLSX = require('xlsx');
const fs = require('fs');

/**
 * HELPER: Find the scenario file (Excel or CSV)
 */
function getScenarioFile() {
    if (fs.existsSync('scenario.xlsx')) return 'scenario.xlsx';
    if (fs.existsSync('scenario.csv')) return 'scenario.csv';
    return null;
}

/**
 * OPTIMIZED PRODUCER: THE SCENARIO COMPILER
 */
function generateSpec() {
    const scenarioFile = getScenarioFile();
    if (!scenarioFile) {
        console.error('❌ Error: No scenario.xlsx or scenario.csv found!');
        return;
    }

    console.log(`🚀 Compiling ${scenarioFile}...`);
    
    if (!fs.existsSync('mappings.json')) {
        console.error('❌ Error: mappings.json not found!');
        return;
    }
    const StepMap = JSON.parse(fs.readFileSync('mappings.json', 'utf8'));

    const workbook = XLSX.readFile(scenarioFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let fullSpecContent = `import { test, expect } from '@playwright/test';\n`;
    fullSpecContent += `import * as actions from './library';\n\n`;

    const blocks = [];
    for (let r = 0; r < data.length; r++) {
        const firstCell = String(data[r][0] || '').trim();
        
        if (firstCell.startsWith('A.')) {
            const blockName = firstCell;
            const steps = [];
            
            let stepRow = r + 1;
            while (stepRow < data.length) {
                const stepNum = String(data[stepRow][0] || '').trim();
                const scriptValue = String(data[stepRow][5] || '').trim(); 
                
                if (stepNum.match(/^\d+$/)) {
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
