const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

/**
 * Parses the hierarchical Excel UAT matrix (A.1, A.2, etc.)
 * and converts it into the structured Blueprint JSON for Playwright.
 */
function generateBlueprintFromExcel(excelPath) {
    if (!fs.existsSync(excelPath)) {
        console.error(`❌ Excel file not found: ${excelPath}`);
        return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const blueprint = [];
    let currentScenario = null;

    for (let r = 1; r < rows.length; r++) {
        const scenarioNum = String(rows[r][1] || "").trim();
        const labelOrTitle = String(rows[r][2] || "").trim();
        const testDataRaw = String(rows[r][13] || "").trim();

        if (scenarioNum.match(/^[A-Z]\.\d+/)) {
            // Start of a new scenario
            currentScenario = {
                Scenario_ID: scenarioNum,
                Role: labelOrTitle,
                Flow: []
            };
            blueprint.push(currentScenario);
        } else if (currentScenario && scenarioNum.match(/^\d+$/) && labelOrTitle) {
            // Step within current scenario
            const data = {};
            if (testDataRaw && testDataRaw !== "undefined") {
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

const filePath = process.argv[2] || 'scenario_uploaded.xlsx';
generateBlueprintFromExcel(filePath);
