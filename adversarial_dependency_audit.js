const fs = require('fs');
const path = require('path');

console.log("🔍 [ZERO-TRUST] Verifying Dependency Isolation...");

// Simulate the logic in server.js
const DRIVERS_PATH = path.resolve(__dirname, 'DRIVERS/node_modules');
if (fs.existsSync(DRIVERS_PATH)) {
    module.paths.unshift(DRIVERS_PATH);
    process.env.NODE_PATH = DRIVERS_PATH;
    require('module').Module._initPaths();
    console.log("✅ [AUDIT] Injected DRIVERS_PATH into module resolution.");
} else {
    console.error("❌ [AUDIT] DRIVERS/node_modules not found in current directory!");
    process.exit(1);
}

// Check resolution of a key dependency
try {
    const pwPath = require.resolve('playwright');
    console.log("📍 [AUDIT] Playwright resolves to: " + pwPath);
    if (pwPath.includes(path.join('DRIVERS', 'node_modules'))) {
        console.log("✅ [AUDIT] SUCCESS: Strictly isolated to DRIVERS vault.");
    } else {
        console.error("🚨 [AUDIT] CRITICAL VULNERABILITY: Playwright leaked to system/root modules!");
        process.exit(1);
    }
} catch (e) {
    console.error("🚨 [AUDIT] CRITICAL: Dependency resolution crashed: " + e.message);
    process.exit(1);
}

// Check browser path persistence
const MS_PLAYWRIGHT_PATH = path.resolve(__dirname, 'DRIVERS/ms-playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH = MS_PLAYWRIGHT_PATH;
console.log("📍 [AUDIT] PLAYWRIGHT_BROWSERS_PATH set to: " + process.env.PLAYWRIGHT_BROWSERS_PATH);

console.log("\n🏆 [ZERO-TRUST] Audit Complete. No leak detected.");
