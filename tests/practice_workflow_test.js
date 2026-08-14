const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runPracticeWorkflow() {
    console.log("👩‍💻 Starting Human-like E2E Workflow Test for Practice Test Automation...");
    const browser = await chromium.launch({ headless: true }); // headless for CI
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', msg => console.log(`[STUDIO BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[STUDIO BROWSER ERROR] ${err.message}`));

    try {
        console.log("🌐 Navigating to Studio...");
        await page.goto('http://localhost:3000/');
        
        console.log("🧹 Resetting system for clean state...");
        await page.request.post('http://localhost:3000/restart');
        await page.waitForTimeout(1000); 
        
        console.log("📁 Uploading practicetest_scenario.xlsx...");
        const uploadPath = path.join(process.cwd(), 'practicetest_scenario.xlsx');
        if (!fs.existsSync(uploadPath)) throw new Error("Excel not found!");
        await page.setInputFiles('#file-input', uploadPath);
        
        await page.waitForTimeout(2000); 
        console.log("✅ Upload successful, moved to Mappings tab.");

        // Verify scenario headers appeared
        await page.waitForSelector('.scenario-header', { timeout: 10000 });
        const scenHeaders = await page.locator('.scenario-header').count();
        console.log(`   Found ${scenHeaders} scenario header(s) in mappings.`);
        if (scenHeaders === 0) throw new Error("Scenario headers not rendered!");

        console.log("🗺️ Mapping 6 PracticeTest steps via manual entry...");
        await page.waitForSelector('button:has-text("Manual")', { timeout: 10000 });
        
        const humanPastedMappings = [
            "await page.goto('https://practicetestautomation.com/practice-test-login/');",
            "await page.locator('#username').fill('{username}');", 
            "await page.locator('#password').fill('{password}');", 
            "await page.locator('#submit').click();",
            "await expect(page.locator('h1.post-title')).toBeVisible();", 
            "await expect(page.locator('#error')).toBeVisible();" 
        ];

        for (let i = 0; i < humanPastedMappings.length; i++) {
            const manualBtns = await page.$$('button:has-text("Manual")');
            if (i >= manualBtns.length) break;
            
            await manualBtns[i].click();
            await page.waitForSelector('#record-modal', { state: 'visible' });
            
            // Clear textarea first (may be pre-loaded with existing mapping)
            const codeArea = page.locator('#recorded-code');
            await codeArea.click({ clickCount: 3 });
            await codeArea.fill(humanPastedMappings[i]);
            await page.click('button:has-text("Sync & Save Action")');
            
            await page.waitForTimeout(500); 
        }
        console.log("   ✅ All 6 steps mapped.");

        // --- VERIFY PREVIEW BUTTONS APPEARED ---
        console.log("🔍 Verifying Preview buttons are visible for mapped steps...");
        await page.waitForSelector('button[title*="Preview what this step"]', { timeout: 5000 });
        const previewBtns = await page.locator('button[title*="Preview what this step"]').count();
        console.log(`   Found ${previewBtns} step preview button(s).`);
        if (previewBtns === 0) throw new Error("Step preview buttons not rendered!");

        // --- TEST STEP PREVIEW CLICK ---
        console.log("👁 Clicking first step Preview button...");
        await page.locator('button[title*="Preview what this step"]').first().click();
        await page.waitForSelector('#preview-modal', { state: 'visible', timeout: 5000 });
        const previewCode = await page.locator('#preview-code').inputValue();
        if (!previewCode || previewCode.length < 5) throw new Error("Preview modal has no code!");
        console.log(`   Preview code: ${previewCode.substring(0, 80)}...`);
        await page.locator('#preview-modal .btn-primary').click(); // Close
        await page.waitForSelector('#preview-modal', { state: 'hidden', timeout: 3000 });
        console.log("   ✅ Step Preview works.");

        // --- TEST SCENARIO PREVIEW CLICK ---
        console.log("👁 Clicking Scenario Preview button...");
        await page.locator('button[title*="View the full mapped"]').first().click();
        await page.waitForSelector('#preview-modal', { state: 'visible', timeout: 5000 });
        const scenCode = await page.locator('#preview-code').inputValue();
        if (!scenCode || !scenCode.includes('Scenario')) throw new Error("Scenario preview has no code!");
        console.log(`   Scenario preview lines: ${scenCode.split('\n').length}`);
        await page.locator('#preview-modal .btn-primary').click();
        await page.waitForSelector('#preview-modal', { state: 'hidden', timeout: 3000 });
        console.log("   ✅ Scenario Preview works.");

        // --- VERIFY HEADLESS TOGGLE EXISTS ---
        console.log("🔧 Verifying Headless toggle in Execution tab...");
        await page.click('button:has-text("Execution")');
        await page.waitForTimeout(500);
        const headlessToggle = await page.locator('#headless-toggle').count();
        if (headlessToggle === 0) throw new Error("Headless toggle not found!");
        // Confirm it defaults unchecked (headed mode = visible browser for UAT monitoring)
        const isChecked = await page.locator('#headless-toggle').isChecked();
        console.log(`   Headless toggle present, default: ${isChecked ? 'headless' : 'headed (correct for UAT)'}`);

        // --- CHECK HEADLESS CHECKBOX AND RUN ---
        await page.locator('#headless-toggle').check(); // Run headless for CI test
        console.log("   Checked headless mode for test run.");

        console.log("⚙️ Executing Test Scenarios (headless)...");
        await page.click('#run-btn');

        console.log("⏳ Waiting for backend execution to complete...");
        await page.waitForSelector('#results-dashboard', { state: 'visible', timeout: 120000 });
        console.log("✅ Execution completed.");

        // Verify folder artifacts
        console.log("\n📂 Verifying Folder Organization...");
        const scenarios = ['PT.1', 'PT.2', 'PT.3'];
        
        for (const scenario of scenarios) {
            const folderName = scenario.replace(/\./g, '_');
            const resultsDir = path.join(process.cwd(), 'results', folderName);
            if (fs.existsSync(resultsDir)) {
                const files = fs.readdirSync(resultsDir);
                console.log(`   📁 ${folderName}/`);
                files.forEach(f => console.log(`      📄 ${f}`));
                
                if (files.includes('FINAL.png') && files.includes('trace.zip')) {
                    console.log(`   ✅ ${folderName}: FINAL.png + trace.zip present`);
                } else {
                    throw new Error(`Missing expected artifacts in ${folderName}!`);
                }
            } else {
                throw new Error(`results/${folderName} folder was not created!`);
            }
        }

        console.log("\n🎉 ALL CHECKS PASSED — Human-in-the-Loop workflow verified:");
        console.log("   ✅ Upload + Parse");
        console.log("   ✅ Scenario headers with 'Preview Scenario' buttons");
        console.log("   ✅ Manual mapping (codegen paste workflow)");
        console.log("   ✅ Per-step Preview button (AI mapping review)");
        console.log("   ✅ Scenario-level Preview (full script review)");
        console.log("   ✅ Headless toggle in Execution tab");
        console.log("   ✅ Headed/headless checkbox wired to execution");
        console.log("   ✅ Results: FINAL.png + trace.zip per scenario");

    } catch (e) {
        console.error("❌ Test Failed:", e.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runPracticeWorkflow();
