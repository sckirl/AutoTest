const fs = require('fs');
const path = require('path');

require('./helpers').ensureDriversPath(module, __dirname);

const XLSX = require('xlsx');

/**
 * Parses the hierarchical Excel UAT matrix (A.1, A.2, etc.)
 * and converts it into the structured Blueprint JSON for Playwright.
 */
function generateBlueprintFromExcel(excelPath) {
    if (!fs.existsSync(excelPath)) {
        // A0.6.2: used to console.error + return (exit code 0) — a false "success" the
        // caller (server.js /upload) had no way to detect. Throwing lets it propagate.
        throw new Error(`Excel file not found: ${excelPath}`);
    }

    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Only read first sheet
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const blueprint = [];
    const warnings = [];
    const seenIds = new Set();
    let currentScenario = null;
    if (!rows.length) {
        throw new Error('Invalid Excel structure: empty worksheet.');
    }

    // Dynamic Header Detection across first 10 rows
    let headerRowIdx = -1;
    let scenarioIdx = -1, labelIdx = -1, testDataIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const headers = rows[i].map(h => String(h || '').toLowerCase());
        scenarioIdx = headers.findIndex(h => h.includes('scenario number') || h.includes('scenario id'));
        labelIdx = headers.findIndex(h => h.includes('scenario name') || h.includes('label'));
        testDataIdx = headers.findIndex(h => h.includes('test data'));
        if (scenarioIdx !== -1 && labelIdx !== -1) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        throw new Error('Malformed Template: Could not find required columns.');
    }
    let seenLabelsInScenario = new Set();

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const scenarioNum = String(rows[r][scenarioIdx] || "").trim();
        const labelOrTitle = String(rows[r][labelIdx] || "").trim();
        const testDataRaw = testDataIdx !== -1 ? String(rows[r][testDataIdx] || "").trim() : "";

        if (scenarioNum.match(/^(?!\d+$).+/)) {
            // Start of a new scenario
            // A0.6.5: two rows with the same Scenario_ID would collide into one results
            // folder and the UI could only ever resolve the first — rename, warn, don't drop.
            let scenarioId = scenarioNum;
            if (seenIds.has(scenarioId)) {
                let n = 2;
                while (seenIds.has(`${scenarioId}_dup${n}`)) n++;
                warnings.push(`Row ${r + 1}: duplicate Scenario_ID "${scenarioNum}" renamed to "${scenarioId}_dup${n}" — check your Excel for a repeated scenario number.`);
                scenarioId = `${scenarioId}_dup${n}`;
            }
            seenIds.add(scenarioId);
            currentScenario = {
                Scenario_ID: scenarioId,
                Role: labelOrTitle,
                Flow: []
            };
            seenLabelsInScenario = new Set();
            blueprint.push(currentScenario);
        } else if (currentScenario && scenarioNum.match(/^\d+$/) && !labelOrTitle) {
            // A0.6.4: a merged-cell gap (blank label, real data) used to vanish with no
            // signal at all — a compiled test that "passes" having never run this step.
            if (testDataRaw) {
                warnings.push(`Row ${r + 1} in scenario "${currentScenario.Scenario_ID}": blank/missing label but Test Data is present — likely a merged Excel cell. Step skipped.`);
            }
        } else if (currentScenario && scenarioNum.match(/^\d+$/) && labelOrTitle) {
            // Step within current scenario
            // A0.6.6: /record's replay-precursor logic (server.js) finds "how many steps
            // precede this label" by text match — a repeated label within one scenario means
            // recording the SECOND occurrence replays too few steps, silently landing on the
            // wrong page state. Can't fix without reshaping the Mapping_Key data model, so warn
            // at parse time and let the tester rename one occurrence if it wasn't intentional.
            if (seenLabelsInScenario.has(labelOrTitle)) {
                warnings.push(`Row ${r + 1} in scenario "${currentScenario.Scenario_ID}": step label "${labelOrTitle}" repeats within this scenario. Recording the second occurrence may replay the wrong number of preceding steps — rename one if they're different steps.`);
            }
            seenLabelsInScenario.add(labelOrTitle);
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

    if (blueprint.length === 0) {
        throw new Error('No scenarios parsed from the uploaded file.');
    }
    // A0.8.3: write relative to __dirname so starting server.js from studio/ or packaged
    // locations does not attempt to write to studio/core/blueprint.json and throw ENOENT.
    const outputPath = path.join(__dirname, 'blueprint.json');
    fs.writeFileSync(outputPath, JSON.stringify(blueprint, null, 2));
    console.log(`Blueprint generated successfully at ${outputPath}`);
    for (const w of warnings) console.warn(`Warning: ${w}`);
    return { blueprint, warnings };
}

module.exports = { generateBlueprintFromExcel };

if (require.main === module) {
    const filePath = process.argv[2] || 'scenario_uploaded.xlsx';
    const warningsPath = path.join(__dirname, 'blueprint_warnings.json');
    try {
        const { warnings } = generateBlueprintFromExcel(filePath);
        // A0.6.4/A0.6.5: give /upload (studio/server.js) a channel back to the tester for
        // non-fatal parse warnings it can't see otherwise (no terminal, per this app's contract).
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
    } catch (e) {
        // A0.6.2: execSync's stdio:'inherit' loses e.message across the process boundary
        // (the caller only sees "Command failed: ..."), so write the real reason to a file
        // the caller CAN read regardless of how the child's stdio is wired.
        fs.writeFileSync(warningsPath, JSON.stringify({ error: e.message }, null, 2));
        console.error(e.message);
        process.exitCode = 1;
    }
}
