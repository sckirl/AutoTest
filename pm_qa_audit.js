const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log("🔥 [QA/PM TEAM] Starting Ruthless Parallel Audit...");
    const browser = await chromium.launch({ headless: true });
    
    const qaAudit = async () => {
        const page = await browser.newPage();
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') logs.push(`[QA UI Error]: ${msg.text()}`);
        });
        page.on('pageerror', err => logs.push(`[QA Page Crash]: ${err.message}`));
        
        console.log("   -> [QA] Navigating to Studio UI...");
        try {
            await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
            
            const hasMobile = await page.isVisible('text="MOBILE"');
            const hasWeb = await page.isVisible('text="WEB"');
            if (!hasMobile && !hasWeb) {
                logs.push("[QA UX Defect]: Absolute lack of Context Indicators (Web vs Mobile). User is blind.");
            }

            await page.click('#tab-execution');
            await page.waitForTimeout(200);
            
            const runBtn = await page.isVisible('#run-btn');
            if (!runBtn) logs.push("[QA UX Defect]: Execute button missing or inaccessible.");
            
            const workerCount = await page.locator('#worker-count').inputValue();
            if (workerCount === '') logs.push("[QA Logic Defect]: Worker count lacks a default value or is empty.");

        } catch (e) {
            logs.push(`[QA Fatal]: ${e.message}`);
        }
        
        return logs;
    };

    const pmAudit = async () => {
        console.log("   -> [PM] Inspecting Architecture & Output Artifacts...");
        let issues = [];
        
        const resultsDir = path.join(process.cwd(), 'results');
        if (fs.existsSync(resultsDir)) {
             const getFiles = (dir) => {
                 let results = [];
                 fs.readdirSync(dir).forEach(file => {
                     const full = path.join(dir, file);
                     if (fs.statSync(full).isDirectory()) results = results.concat(getFiles(full));
                     else results.push(full);
                 });
                 return results;
             };
             
             const files = getFiles(resultsDir);
             let pngFound = false;
             for (const f of files) {
                 if (f.endsWith('.png')) {
                     pngFound = true;
                     const stat = fs.statSync(f);
                     if (stat.size < 40000) { 
                         issues.push(`[PM Artifact Defect]: Ghost/White PNG detected -> ${path.basename(f)} is unusually small (${stat.size} bytes). Missing networkidle awaits.`);
                     }
                 }
             }
             if (!pngFound) issues.push("[PM Artifact Defect]: No screenshots found in results folder at all. Evidence generation failed.");
        } else {
             issues.push("[PM Artifact Defect]: Results directory missing entirely.");
        }

        const compilerCode = fs.readFileSync('core/compiler.js', 'utf8');
        if (!compilerCode.includes('waitForLoadState') && !compilerCode.includes('waitForTimeout(500)')) {
            issues.push("[PM Code Defect]: Compiler is indiscriminately firing screenshots instantly after clicks. This guarantees Race Conditions and White PNGs in SPAs.");
        }
        
        if (!compilerCode.includes('runtimeData') || !compilerCode.includes('JSON.stringify')) {
            issues.push("[PM Code Defect]: Data Matrix iteration override logic is missing or broken in the compiler.");
        }
        
        const uiCode = fs.readFileSync('studio/studio-ui.html', 'utf8');
        if (uiCode.includes('alert("Saved!")') || uiCode.includes('alert("Data Matrix Saved!")')) {
            issues.push("[PM UX Defect]: Synchronous `alert()` used in Data Matrix save flow. This halts automated execution chains entirely.");
        }

        return issues;
    };

    const [qaLogs, pmIssues] = await Promise.all([qaAudit(), pmAudit()]);
    
    console.log("\n🛑 --- RUTHLESS AUDIT RESULTS --- 🛑");
    qaLogs.forEach(l => console.log(l));
    pmIssues.forEach(i => console.log(i));

    await browser.close();
    console.log("\nAudit complete. Proceed to log in defect.md and PLAN.md.");
})();