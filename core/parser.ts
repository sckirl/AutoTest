import * as XLSX from 'xlsx';

/**
 * Matrix Parser: Handles UAT format where Scenarios are columns
 * and Actions are rows.
 */
export function parseDynamicExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let scenarioRowIndex = -1;

    // 1. Find the row containing Scenario IDs (e.g., A.1, A.2)
    for (let r = 0; r < rows.length; r++) {
        if (rows[r].some(cell => String(cell).match(/A\.\d+/))) {
            scenarioRowIndex = r;
            break;
        }
    }

    if (scenarioRowIndex === -1) {
        throw new Error("Could not find any Scenario IDs (A.1, A.2, etc.) in the Excel file.");
    }

    const headerRow = rows[scenarioRowIndex];
    const scenarios = [];

    // 2. Identify Scenario Columns
    for (let c = 1; c < headerRow.length; c++) {
        const id = String(headerRow[c] || "").trim();
        if (id.match(/A\.\d+/)) {
            const scenarioId = id.split(' ')[0]; // Extract "A.1" from "A.1 Ganti..."
            const steps: string[] = [];
            const data: any = {};

            // 3. Collect actions from rows below
            for (let r = scenarioRowIndex + 1; r < rows.length; r++) {
                const actionLabel = String(rows[r][0] || "").trim();
                const instruction = String(rows[r][c] || "").trim();

                if (actionLabel && instruction && instruction !== 'null' && instruction !== 'undefined') {
                    steps.push(actionLabel);
                    data[actionLabel] = instruction;
                }
            }

            if (steps.length > 0) {
                scenarios.push({
                    Scenario_ID: scenarioId,
                    Steps: steps,
                    Data: data
                });
            }
        }
    }

    return scenarios;
}
