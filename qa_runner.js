const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFECT_FILE = 'defect.md';
const CHANGES_FILE = 'changes.md';

function logDefect(title, description, severity = 'High') {
    const defect = `
## [DEF-${Date.now().toString().slice(-3)}] ${title}
- **Severity**: ${severity}
- **Description**: ${description}
- **Impact**: Test failure or regression.
- **Status**: Open
`;
    fs.appendFileSync(DEFECT_FILE, defect);
    console.log(`❌ Logged Defect: ${title}`);
}

async function runTests(mode) {
    console.log(`\n🚀 Starting ${mode} Tests...`);
    const isHeadless = mode === 'SIT';
    
    try {
        // We use spawn to capture output in real-time if needed, but execSync is simpler for sequential SIT/UAT
        const env = { 
            ...process.env, 
            PW_HEADLESS: isHeadless ? '1' : '0',
            AUTOTEST_WORKERS: '4',
            AUTOTEST_FULLY_PARALLEL: '1'
        };
        
        execSync(`npx playwright test core/executed.spec.ts ${isHeadless ? '' : '--headed'} --workers=4`, { 
            env, 
            stdio: 'inherit' 
        });
        
        console.log(`✅ ${mode} Tests Passed.`);
    } catch (err) {
        console.error(`❌ ${mode} Tests Failed.`);
        logDefect(`${mode} Test Failure`, `Playwright execution failed in ${mode} mode. Error: ${err.message}`);
    }
}

async function main() {
    console.log("=== 150 IQ QA ENGINEER VALIDATION ===");
    
    // Check for changes
    if (fs.existsSync(CHANGES_FILE)) {
        const changes = fs.readFileSync(CHANGES_FILE, 'utf8');
        console.log("🔍 Reviewing changes.md...");
        // In a real scenario, I'd analyze the changes to prioritize tests
    }

    // Run SIT (Headless)
    await runTests('SIT');

    // Run UAT (Headed)
    // Note: In this environment, headed might not show a window but we pass the flag anyway
    await runTests('UAT');

    console.log("\n=== VALIDATION COMPLETE ===");
}

main();
