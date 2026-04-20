const XLSX = require('xlsx');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * THE STUDIO: AUTO-RECORDING ENGINE
 */

function getScenarioFile() {
    if (fs.existsSync('scenario.xlsx')) return 'scenario.xlsx';
    if (fs.existsSync('scenario.csv')) return 'scenario.csv';
    return null;
}

async function runStudio() {
    console.log('\n🎬 ==========================================');
    console.log('   AUTOMATION FACTORY STUDIO (Full-Auto Branch)');
    console.log('   ==========================================\n');

    // 0. Get URL from Command Line
    const targetUrl = process.argv[2];
    if (!targetUrl) {
        console.error('❌ Error: Please provide a URL.');
        console.log('👉 Usage: node studio.js <url>');
        console.log('👉 Example: node studio.js http://pukat-master:6969/');
        process.exit(1);
    }

    const scenarioFile = getScenarioFile();
    if (!scenarioFile) {
        console.error('❌ Error: No scenario.xlsx or scenario.csv found!');
        return;
    }

    console.log(`📂 Scanning ${scenarioFile}...`);
    console.log(`🌐 Target URL: ${targetUrl}\n`);

    const workbook = XLSX.readFile(scenarioFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const mappingsPath = 'mappings.json';
    let StepMap = {};
    if (fs.existsSync(mappingsPath)) {
        StepMap = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    }

    const requiredScripts = new Set();
    excelData.forEach(row => {
        const scriptValue = String(row[5] || '').trim(); 
        const fallback = String(row[1] || '').trim();    
        const final = scriptValue || fallback;
        if (final && final !== 'Script' && final !== '0' && !final.startsWith('A.')) {
            requiredScripts.add(final);
        }
    });

    const missing = [...requiredScripts].filter(s => !StepMap[s]);

    if (missing.length === 0) {
        console.log('✅ All steps in your scenario are already wired to code.\n');
        return;
    }

    console.log(`🔍 Found ${missing.length} new step(s) needing code:`);
    missing.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    for (const scriptName of missing) {
        console.log(`\n----------------------------------------------`);
        console.log(`👉 NOW RECORDING: "${scriptName}"`);
        console.log(`----------------------------------------------`);
        
        const tempFile = 'temp_capture.ts';
        try {
            // Launch Playwright Codegen with the provided URL
            execSync(`npx playwright codegen ${targetUrl} --output=${tempFile}`, { stdio: 'inherit' });

            if (fs.existsSync(tempFile)) {
                const rawCode = fs.readFileSync(tempFile, 'utf8');
                const cleanCode = extractBody(rawCode);
                const functionName = scriptName.toLowerCase().replace(/[^a-z0-9]/g, '_');

                fs.appendFileSync('library.ts', `\nexport async function ${functionName}(page: Page, data: string) {\n  ${cleanCode}\n}\n`);
                StepMap[scriptName] = functionName;
                fs.writeFileSync(mappingsPath, JSON.stringify(StepMap, null, 4));

                console.log(`\n✅ SUCCESSFULLY WIRED: ${functionName}`);
                fs.unlinkSync(tempFile);
            }
        } catch (err) {
            console.log('\n⚠️ Recording skipped.');
        }
    }

    console.log('\n🏁 Studio Session Complete.\n');
}

function extractBody(code) {
    const lines = code.split('\n');
    let body = [];
    let inTest = false;
    for (const line of lines) {
        if (line.includes('test(')) { inTest = true; continue; }
        if (line.includes('});')) { inTest = false; continue; }
        if (inTest && line.trim() !== '' && !line.includes('import')) {
            body.push(line.trim());
        }
    }
    return body.length > 0 ? body.join('\n  ') : '// No actions recorded';
}

runStudio();
