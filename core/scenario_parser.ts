import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as path from 'path';

/**
 * Parses the hierarchical Excel UAT matrix (A.1, A.2, etc.)
 * and converts it into the structured Blueprint JSON for Playwright.
 */
export function generateBlueprintFromExcel(excelPath: string) {
    if (!fs.existsSync(excelPath)) {
        console.error(`❌ Excel file not found: ${excelPath}`);
        return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const blueprint: any[] = [];
    let currentScenario: any = null;

    for (let r = 1; r < rows.length; r++) {
        const scenarioNum = String(rows[r][1] || "").trim();
        const labelOrTitle = String(rows[r][2] || "").trim();
        const testDataRaw = String(rows[r][13] || "").trim();

        if (scenarioNum.match(/^[A-Z]\.\d+/)) {
            // Start of a new scenario
            currentScenario = {
                Scenario_ID: scenarioNum,
                Role: labelOrTitle, // Using Scenario Name as Role for now
                Flow: []
            };
            blueprint.push(currentScenario);
        } else if (currentScenario && scenarioNum.match(/^\d+$/) && labelOrTitle) {
            // Step within current scenario
            const data: any = {};
            if (testDataRaw && testDataRaw !== "undefined") {
                // Try to parse test data if it's key=value or JSON
                try {
                    if (testDataRaw.startsWith('{')) {
                        Object.assign(data, JSON.parse(testDataRaw));
                    } else {
                        testDataRaw.split(',').forEach(pair => {
                            const [k, v] = pair.split('=');
                            if (k && v) data[k.trim()] = v.trim();
                        });
                    }
                } catch (e) {
                    data["default"] = testDataRaw;
                }
            }

            currentScenario.Flow.push({
                Mapping_Key: labelOrTitle,
                Data: data
            });
        }
    }

    const outputPath = path.join(process.cwd(), 'core/blueprint.json');
    fs.writeFileSync(outputPath, JSON.stringify(blueprint, null, 2));
    console.log(`✅ Blueprint generated successfully at ${outputPath}`);
}

// If run directly
if (require.main === module) {
    const filePath = process.argv[2] || 'scenario_uploaded.xlsx';
    generateBlueprintFromExcel(filePath);
}
