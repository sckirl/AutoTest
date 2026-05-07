const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

/**
 * Hierarchical Excel Parser: A.1, A.2, B.1 ... → blueprint.json
 *
 * Excel format expected:
 *   - A column containing scenario IDs (e.g. "A.1", "B.2")
 *   - A column containing step labels
 *   - A column containing test data (key=value or JSON)
 *
 * Column positions are detected dynamically by header name so the
 * parser is resilient to column reordering.
 */
function generateBlueprintFromExcel(excelPath) {
    if (!fs.existsSync(excelPath)) {
        console.error(`❌ Excel file not found: ${excelPath}`);
        process.exit(1);
    }

    const workbook = XLSX.readFile(excelPath);
    const allScenarios = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // ── Detect header row dynamically ───────────────────────────────────
        let headerRowIdx = -1;
        for (let r = 0; r < rows.length; r++) {
            if (rows[r].some(cell => String(cell).match(/Scenario|A\.\d+/i))) {
                headerRowIdx = r;
                break;
            }
        }
        if (headerRowIdx === -1) continue;

        console.log(` ✅ Found scenarios in sheet: [${sheetName}]`);
        const headerRow = rows[headerRowIdx];

        // Each column with a header matching A.X is a separate scenario
        for (let c = 1; c < headerRow.length; c++) {
            const id = String(headerRow[c] || '').trim();
            if (!id.match(/A\.\d+/)) continue;

            const scenarioId = id.split(' ')[0];
            const steps = [];
            const data = {};

            for (let r = headerRowIdx + 1; r < rows.length; r++) {
                const actionLabel = String(rows[r][0] || '').trim();
                const instruction = String(rows[r][c] || '').trim();
                if (actionLabel && instruction && instruction !== 'null') {
                    steps.push(actionLabel);
                    data[actionLabel] = instruction;
                }
            }

            if (steps.length > 0) {
                allScenarios.push({ Scenario_ID: scenarioId, Role: id, Steps: steps, Data: data });
            }
        }
    }

    if (allScenarios.length === 0) {
        // Fallback: try the old hierarchical row format (scenario IDs in column B)
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const blueprint = [];
            let currentScenario = null;
            const globalStepDataCache = {};

            for (let r = 1; r < rows.length; r++) {
                const scenarioNum = String(rows[r][1] || '').trim();
                const labelOrTitle = String(rows[r][2] || '').trim();
                const testDataRaw = String(rows[r][13] || '').trim();

                if (scenarioNum.match(/^[A-Z]\.\d+/)) {
                    currentScenario = {
                        Scenario_ID: scenarioNum,
                        Role: labelOrTitle,
                        Flow: []
                    };
                    blueprint.push(currentScenario);
                } else if (currentScenario && scenarioNum.match(/^\d+$/) && labelOrTitle) {
                    const stepData = {};
                    if (testDataRaw && testDataRaw !== 'undefined') {
                        try {
                            if (testDataRaw.startsWith('{')) {
                                Object.assign(stepData, JSON.parse(testDataRaw));
                            } else {
                                testDataRaw.split(',').forEach(pair => {
                                    const [k, v] = pair.split('=');
                                    if (k && v) stepData[k.trim()] = v.trim();
                                });
                            }
                        } catch {
                            stepData['default'] = testDataRaw;
                        }
                        globalStepDataCache[labelOrTitle] = { ...stepData };
                    } else if (globalStepDataCache[labelOrTitle]) {
                        Object.assign(stepData, globalStepDataCache[labelOrTitle]);
                    }
                    currentScenario.Flow.push({ Mapping_Key: labelOrTitle, Data: stepData });
                }
            }

            if (blueprint.length > 0) {
                const outputPath = path.join(process.cwd(), 'core/blueprint.json');
                fs.writeFileSync(outputPath, JSON.stringify(blueprint, null, 2));
                console.log(`✅ Blueprint generated (row format) at ${outputPath}`);
                return;
            }
        }

        console.error('❌ No valid scenarios found in any sheet!');
        process.exit(1);
    }

    // Convert column-format scenarios to Flow-based blueprint
    const blueprint = allScenarios.map(s => ({
        Scenario_ID: s.Scenario_ID,
        Role: s.Role,
        Flow: s.Steps.map(step => ({ Mapping_Key: step, Data: {} }))
    }));

    const outputPath = path.join(process.cwd(), 'core/blueprint.json');
    fs.writeFileSync(outputPath, JSON.stringify(blueprint, null, 2));
    console.log(`✅ Blueprint generated at ${outputPath}`);
}

// ── CLI entry point ──────────────────────────────────────────────────────────
const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node core/scenario_parser.js <path-to-excel>');
    process.exit(1);
}
generateBlueprintFromExcel(filePath);
