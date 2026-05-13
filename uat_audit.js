const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("🔍 Starting Rigorous Tab Audit...");
    const browser = await chromium.launch({ headless: true }); // headless for the tool environment
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3000');
        
        // 1. Audit Studio Tab
        console.log("   - Auditing Studio Tab...");
        await page.click('#tab-studio');
        const studioVisible = await page.isVisible('#view-studio');
        console.log(`     - Studio View Visible: ${studioVisible}`);
        if (!studioVisible) throw new Error("Studio tab failed");

        // 2. Audit Mappings Tab
        console.log("   - Auditing Mappings Tab...");
        await page.click('#tab-mappings');
        const mappingsVisible = await page.isVisible('#view-mappings');
        console.log(`     - Mappings View Visible: ${mappingsVisible}`);
        if (!mappingsVisible) throw new Error("Mappings tab failed");

        // 3. Audit Data Matrix Tab
        console.log("   - Auditing Data Matrix Tab...");
        await page.click('#tab-data-matrix');
        const dataMatrixVisible = await page.isVisible('#view-data-matrix');
        console.log(`     - Data Matrix View Visible: ${dataMatrixVisible}`);
        if (!dataMatrixVisible) throw new Error("Data Matrix tab failed");
        
        // Check for "Save Data Matrix" button
        const saveBtn = await page.isVisible('button:has-text("Save Data Matrix")');
        console.log(`     - Save Button Visible: ${saveBtn}`);
        if (!saveBtn) throw new Error("Data Matrix Save button missing");

        // 4. Audit Execution Tab
        console.log("   - Auditing Execution Tab...");
        await page.click('#tab-execution');
        const executionVisible = await page.isVisible('#view-execution');
        console.log(`     - Execution View Visible: ${executionVisible}`);
        if (!executionVisible) throw new Error("Execution tab failed");

        console.log("✅ Audit Passed: All menus are present and functional.");
    } catch (e) {
        console.error(`❌ Audit Failed: ${e.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();