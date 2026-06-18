const fs = require('fs');
const path = require('path');

// Banking Block Compliance: Strict DRIVERS/ Resolution
const DRIVERS_PATH = path.join(__dirname, '../DRIVERS/node_modules');
if (fs.existsSync(DRIVERS_PATH)) {
    module.paths.unshift(DRIVERS_PATH);
    process.env.NODE_PATH = DRIVERS_PATH;
    require('module').Module._initPaths();
}

const XLSX = require('xlsx');

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
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Only read first sheet
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const blueprint = [];
    let currentScenario = null;
    if (!rows.length || rows[0].length < 3) {
        throw new Error('❌ Invalid Excel structure: expected scenario matrix with at least 3 columns.');
    }

    // Dynamic Header Detection
    const headers = rows[0].map(h => String(h || '').toLowerCase());
    const scenarioIdx = headers.findIndex(h => h.includes('scenario number') || h.includes('scenario id'));
    const labelIdx = headers.findIndex(h => h.includes('scenario name') || h.includes('label'));
    const testDataIdx = headers.findIndex(h => h.includes('test data'));

    if (scenarioIdx === -1 || labelIdx === -1) {
        throw new Error('❌ Malformed Template: Could not find required columns.');
    }

    for (let r = 1; r < rows.length; r++) {
        const scenarioNum = String(rows[r][scenarioIdx] || "").trim();
        const labelOrTitle = String(rows[r][labelIdx] || "").trim();
        const testDataRaw = testDataIdx !== -1 ? String(rows[r][testDataIdx] || "").trim() : "";

        if (scenarioNum.match(/^(?!\d+$)[a-zA-Z0-9_.-]+$/)) {
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
    if (blueprint.length === 0) {
        throw new Error('❌ No scenarios parsed from the uploaded file.');
    }
    fs.writeFileSync(outputPath, JSON.stringify(blueprint, null, 2));
    console.log(`✅ Blueprint generated successfully at ${outputPath}`);
}

const filePath = process.argv[2] || 'scenario_uploaded.xlsx';
generateBlueprintFromExcel(filePath);
