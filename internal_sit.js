const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("🛠️ [SIT] Starting Comprehensive Phase 1-4 Gap Audit...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3000');

        // 1. Audit Context Selector & localStorage
        console.log("   -> Auditing Context Selector...");
        await page.selectOption('#platform-toggle', 'mobile');
        const badgeText = await page.innerText('#env-badge');
        if (badgeText !== 'MOBILE') throw new Error("Context Badge failed to update");
        
        const hasMobileClass = await page.evaluate(() => document.getElementById('main-card').classList.contains('mobile-mode'));
        if (!hasMobileClass) throw new Error("Mobile Frame class missing");

        await page.reload();
        const persistentVal = await page.inputValue('#platform-toggle');
        if (persistentVal !== 'mobile') throw new Error("localStorage persistence failed");

        // 2. Audit Recording Guidance Trigger
        console.log("   -> Auditing Recording Guidance...");
        await page.click('#tab-mappings'); // Switch to mappings tab
        await page.evaluate(() => {
            const list = document.getElementById('step-list-ui');
            list.innerHTML = '<div class="step-row"><div class="step-label">Test Step</div><button id="test-rec-btn">Record</button></div>';
            document.getElementById('test-rec-btn').onclick = () => openRecordModal('Test', 'A.1');
        });
        await page.click('#test-rec-btn');
        const guidanceVisible = await page.isVisible('#guidance-modal');
        if (!guidanceVisible) throw new Error("Recording Guidance modal failed to trigger");
        
        console.log("✅ [SIT] All implemented gaps passed functional audit.");
    } catch (e) {
        console.error(`❌ [SIT] FAILED: ${e.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();