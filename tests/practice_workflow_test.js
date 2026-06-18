const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runPracticeWorkflow() {
    console.log("👩‍💻 Starting Human-like E2E Workflow Test for Practice Test Automation...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

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
            
            await page.fill('#recorded-code', humanPastedMappings[i]);
            await page.click('button:has-text("Sync & Save Action")');
            
            await page.waitForTimeout(500); 
        }

        console.log("🧮 Configuring Data Matrix...");
        await page.click('button:has-text("Data Matrix")');
        await page.waitForTimeout(1000);

        console.log("⚙️ Executing Test Scenarios...");
        await page.click('button:has-text("Execution")');
        await page.waitForTimeout(500);
        await page.click('#run-btn');

        console.log("⏳ Waiting for backend execution to complete...");
        await page.waitForSelector('#results-dashboard', { state: 'visible', timeout: 90000 });
        console.log("✅ Execution completed.");

        console.log("\\n📂 Verifying Folder Organization...");
        const scenarios = ['PT.1', 'PT.2', 'PT.3'];
        
        for (const scenario of scenarios) {
            // Because scenario IDs have dot, regex makes them underscores
            const folderName = scenario.replace(/\./g, '_');
            const resultsDir = path.join(process.cwd(), 'results', folderName);
            if (fs.existsSync(resultsDir)) {
                const files = fs.readdirSync(resultsDir);
                console.log(`   📁 ${folderName}/`);
                files.forEach(f => console.log(`      📄 ${f}`));
                
                if (files.includes('FINAL.png') && files.includes('trace.zip')) {
                    // good
                } else {
                    console.error(`❌ Missing expected artifacts in ${folderName}!`);
                    process.exit(1);
                }
            } else {
                console.error(`❌ results/${folderName} folder was not created!`);
                process.exit(1);
            }
        }
        console.log("\\n🎉 PERFECT! Practice Test workflow succeeded flawlessly.");

    } catch (e) {
        console.error("❌ Test Failed:", e);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runPracticeWorkflow();
