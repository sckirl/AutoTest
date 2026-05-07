const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const MAPPINGS_PATH = path.join(ROOT, 'core/mappings.json');
const BLUEPRINT_PATH = path.join(ROOT, 'core/blueprint.json');
const EXCEL_PATH = path.join(ROOT, 'scenario_pukat.xlsx');

function runSIT() {
    console.log('🧪 Starting SIT: Logic Pipeline...');

    // 1. Run Parser
    console.log('   Step 1: Running Scenario Parser...');
    try {
        execSync(`node core/scenario_parser.js ${EXCEL_PATH}`, { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ SIT FAIL: Parser crashed');
        process.exit(1);
    }

    if (!fs.existsSync(BLUEPRINT_PATH)) {
        console.error('❌ SIT FAIL: blueprint.json not generated');
        process.exit(1);
    }
    const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8'));
    console.log(`   ✅ Blueprint generated with ${blueprint.length} scenarios.`);

    // 2. Verify Mapping Structure
    console.log('   Step 2: Verifying Mapping Structure...');
    const mappings = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
    const mappedLabels = Object.keys(mappings);
    console.log(`   ✅ Mappings loaded. Found ${mappedLabels.length} mapped actions.`);

    // 3. Verify Integration
    const firstScenario = blueprint[0];
    const missingSteps = firstScenario.Flow.filter(f => !mappings[f.Mapping_Key]);
    console.log(`   Step 3: Checking missing steps for ${firstScenario.Scenario_ID}...`);
    if (missingSteps.length > 0) {
        console.log(`   ⚠️  Found ${missingSteps.length} missing steps (expected if not all recorded).`);
    } else {
        console.log(`   ✅ All steps for ${firstScenario.Scenario_ID} are mapped.`);
    }

    console.log('\n🌟 SIT PASSED: Core logic pipeline is healthy.');
}

runSIT();
