import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export function parseDynamicExcel() {
    const rootDir = process.cwd();
    const files = fs.readdirSync(rootDir);
    
    // Prioritize scenario_uploaded.xlsx (from the UI)
    let excelFile = files.find(f => f === 'scenario_uploaded.xlsx');
    
    // Fallback to any other .xlsx
    if (!excelFile) {
        excelFile = files.find(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    }
    
    if (!excelFile) throw new Error("❌ No .xlsx file found!");

    console.log(`📂 Scanning Excel: ${excelFile}`);
    const filePath = path.join(rootDir, excelFile);
    const workbook = XLSX.readFile(filePath);
    
    const allScenarios = [];

    // 1. MULTI-SHEET SUPPORT: Iterate through all tabs
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let scenarioRowIndex = -1;
        for (let r = 0; r < rows.length; r++) {
            if (rows[r].some(cell => String(cell).match(/Scenario|A\.\d+/i))) {
                scenarioRowIndex = r;
                break;
            }
        }

        if (scenarioRowIndex === -1) continue; // Skip sheets without scenario markers

        console.log(` ✅ Found scenarios in sheet: [${sheetName}]`);
        const headerRow = rows[scenarioRowIndex];

        for (let c = 1; c < headerRow.length; c++) {
            const id = String(headerRow[c] || "").trim();
            if (id.match(/A\.\d+/)) {
                const scenarioId = id.split(' ')[0];
                const steps: string[] = [];
                const data: any = {};

                for (let r = scenarioRowIndex + 1; r < rows.length; r++) {
                    const actionLabel = String(rows[r][0] || "").trim();
                    const instruction = String(rows[r][c] || "").trim();
                    if (actionLabel && instruction && instruction !== 'null') {
                        steps.push(actionLabel);
                        data[actionLabel] = instruction;
                    }
                }
                allScenarios.push({ Scenario_ID: scenarioId, Steps: steps, Data: data });
            }
        }
    }

    if (allScenarios.length === 0) throw new Error("❌ No valid scenarios found in any sheet!");
    return allScenarios;
}
