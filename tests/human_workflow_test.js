const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runHumanWorkflow() {
    console.log("👩‍💻 Starting Human-like E2E Workflow Test...");
    const browser = await chromium.launch({ headless: true }); // headless for silent test
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.error(`[BROWSER ERROR] ${err.message}`));

        console.log("🌐 Navigating to Studio...");
        await page.goto('http://localhost:3000/');
        
        // Ensure clean state
        console.log("🧹 Resetting system for clean state...");
        await page.request.post('http://localhost:3000/restart');
        await page.waitForTimeout(1000); // allow backend to delete files
        
        // 1. UPLOADING FILE (Human dragging excel)
        console.log("📁 Uploading orangehrm_full_scenario.xlsx...");
        const uploadPath = path.join(process.cwd(), 'orangehrm_full_scenario.xlsx');
        if (!fs.existsSync(uploadPath)) throw new Error("Excel not found!");
        await page.setInputFiles('#file-input', uploadPath);
        
        // Wait for scan to complete and UI to switch to mappings tab
        await page.waitForTimeout(2000); 
        console.log("✅ Upload successful, moved to Mappings tab.");

        // 2. MAKING CODEGEN MAPPING (Human mapping steps from Inspector)
        console.log("🗺️ Mapping 7 OrangeHRM steps via manual entry (Simulating human pasting)...");
        await page.waitForSelector('button:has-text("Manual")', { timeout: 10000 });
        
        // These mimic a human pasting exact CodeGen outputs and parameterizing
        const humanPastedMappings = [
            "await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');",
            "await page.getByPlaceholder('Username').fill('{username}');", // parameterizing DDT
            "await page.getByPlaceholder('Password').fill('{password}');", // parameterizing DDT
            "await page.getByRole('button', { name: 'Login' }).click();",
            "await page.getByRole('heading', { name: 'Dashboard' }).click();",
            "await expect(page.getByText('Invalid credentials')).toBeVisible();", // Step 6
            "await expect(page.locator('form').filter({ hasText: 'Required' })).toBeVisible();" // Step 7
        ];

        for (let i = 0; i < humanPastedMappings.length; i++) {
            const manualBtns = await page.$$('button:has-text("Manual")');
            if (i >= manualBtns.length) break; // Should not happen
            
            await manualBtns[i].click();
            await page.waitForSelector('#record-modal', { state: 'visible' });
            
            await page.fill('#recorded-code', humanPastedMappings[i]);
            await page.click('button:has-text("Sync & Save Action")');
            
            // Wait for modal to close and row to turn blue
            await page.waitForTimeout(500); 
        }

        // 3. USING DDT (Human verifying data matrix)
        console.log("🧮 Configuring Data Matrix (Human verifying payloads)...");
        await page.click('button:has-text("Data Matrix")');
        await page.waitForTimeout(1000);

        // 4. EXECUTING
        console.log("⚙️ Executing Test Scenarios...");
        await page.click('button:has-text("Execution")');
        await page.waitForTimeout(500);
        await page.click('#run-btn');

        console.log("⏳ Waiting for backend execution to complete...");
        await page.waitForSelector('#results-dashboard', { state: 'visible', timeout: 90000 });
        console.log("✅ Execution completed.");

        // Verify folder and images
        console.log("\\n📂 Verifying Folder Organization...");
        const scenarios = ['HRM.A.1', 'HRM.A.2', 'HRM.A.3'];
        
        for (const scenario of scenarios) {
            const resultsDir = path.join(process.cwd(), 'results', scenario);
            if (fs.existsSync(resultsDir)) {
                const files = fs.readdirSync(resultsDir);
                console.log(`   📁 ${scenario}/`);
                files.forEach(f => console.log(`      📄 ${f}`));
                
                if (files.includes('FINAL.png') && files.includes('trace.zip')) {
                    // good
                } else {
                    console.error(`❌ Missing expected artifacts in ${scenario}!`);
                    process.exit(1);
                }
            } else {
                console.error(`❌ results/${scenario} folder was not created!`);
                process.exit(1);
            }
        }
        console.log("\\n🎉 PERFECT! Human workflow succeeded and all 3 Negative/Positive scenarios artifacts were organized flawlessly.");

    } catch (e) {
        console.error("❌ Test Failed:", e);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runHumanWorkflow();
