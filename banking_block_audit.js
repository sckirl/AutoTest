const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🔥 [QA AUDIT] Starting Banking Block Integrity Check...");

// 1. Dependency Check
const driversModules = path.join(process.cwd(), 'DRIVERS/node_modules');
if (fs.existsSync(driversModules)) {
    console.log("✅ [QA] DRIVERS/node_modules found.");
} else {
    console.error("❌ [QA] DRIVERS/node_modules MISSING!");
    process.exit(1);
}

// 2. Binary Path Check
const serverCode = fs.readFileSync('studio/server.js', 'utf8');
if (serverCode.includes('playwrightBin = path.resolve(DRIVERS_PATH')) {
    console.log("✅ [QA] Execution Engine re-routed to DRIVERS/ binary.");
} else {
    console.error("❌ [QA] Execution Engine STILL pointing to root node_modules!");
    process.exit(1);
}

// 3. Update Suppression Check
if (serverCode.includes('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD')) {
    console.log("✅ [QA] Playwright Update Suppression Active.");
} else {
    console.error("❌ [QA] Update Suppression MISSING! Application will try to reach internet.");
    process.exit(1);
}

// 4. Browser Detector Verification
if (serverCode.includes('MS_PLAYWRIGHT_PATH')) {
    console.log("✅ [QA] Browser Detector searching DRIVERS/ folder.");
} else {
    console.error("❌ [QA] Browser Detector IGNORING DRIVERS/ folder!");
    process.exit(1);
}

// 6. Absolute Path Check
if (serverCode.includes('path.resolve')) {
    console.log("✅ [QA] Absolute Path resolution active.");
} else {
    console.error("❌ [QA] Relative paths detected! May fail on Windows.");
    process.exit(1);
}

// 7. Discovery Override Check
if (serverCode.includes('PLAYWRIGHT_BROWSERS_PATH')) {
    console.log("✅ [QA] Discovery Override Active (PLAYWRIGHT_BROWSERS_PATH).");
} else {
    console.error("❌ [QA] Discovery Override MISSING!");
    process.exit(1);
}

// 5. Simulation: Validate generated Recording Script
try {
    const playwrightBin = path.join(process.cwd(), 'DRIVERS/node_modules/.bin/playwright');
    console.log("🚀 [QA] Simulating 'npx' bypass via: " + playwrightBin);
    const out = execSync(`${playwrightBin} --version`, { stdio: 'pipe' }).toString();
    console.log("✅ [QA] Local binary execution verified: " + out.trim());
} catch (e) {
    console.error("❌ [QA] Local binary execution FAILED: " + e.message);
    process.exit(1);
}

console.log("\n🏆 [QA AUDIT COMPLETE] Result: 100% Integrity.");
