const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MS_PLAYWRIGHT_PATH = path.resolve(__dirname, 'DRIVERS/ms-playwright');
const DRIVERS_NODE_MODULES = path.resolve(__dirname, 'DRIVERS/node_modules');

console.log("🛠️  AutoTest Fallback & Dependency Checker");

// Check if DRIVERS/node_modules exists and is populated
let needsNpmInstall = false;
if (!fs.existsSync(DRIVERS_NODE_MODULES) || fs.readdirSync(DRIVERS_NODE_MODULES).length < 5) {
    console.log("⚠️  Missing or incomplete Node packages in DRIVERS/node_modules.");
    needsNpmInstall = true;
}

if (needsNpmInstall) {
    console.log("⬇️  Force installing NPM packages locally...");
    try {
        // We do standard npm install in the root which updates standard node_modules if they prefer that
        execSync('npm install', { stdio: 'inherit' });
        console.log("✅ NPM packages installed successfully.");
    } catch (e) {
        console.error("❌ Failed to install NPM packages:", e.message);
    }
}

// Check for Chromium binary specifically inside DRIVERS/ms-playwright or regular cache
let needsPlaywright = true;
const macPath = path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const winPath = path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-win/chrome.exe');
const linuxPath = path.join(MS_PLAYWRIGHT_PATH, 'chromium-1223/chrome-linux/chrome');

if (fs.existsSync(macPath) || fs.existsSync(winPath) || fs.existsSync(linuxPath)) {
    needsPlaywright = false;
    console.log("✅ Playwright Chromium binaries found in DRIVERS.");
} else {
    // Also check standard playwright path in case they are running online mode
    console.log("⚠️  No bundled browser found in DRIVERS/ms-playwright.");
}

if (needsPlaywright) {
    console.log("⬇️  Attempting to install Playwright Chromium (Requires Internet)...");
    try {
        process.env.PLAYWRIGHT_BROWSERS_PATH = MS_PLAYWRIGHT_PATH; // Force download into the local folder
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log("✅ Playwright Chromium installed into DRIVERS/ms-playwright.");
    } catch (e) {
        console.error("❌ Failed to download Playwright binaries. If you are air-gapped, you MUST physically copy the ms-playwright folder.", e.message);
    }
}

console.log("🚀 Starting AutoTest Studio Server...\n");
require('./studio/server.js');
