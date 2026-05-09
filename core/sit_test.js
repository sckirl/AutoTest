const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function runSIT() {
    console.log('🚀 Starting Headless SIT...');
    
    // 1. Ensure clean port
    try {
        require('child_process').execSync('lsof -ti :3000 | xargs kill -9', { stdio: 'ignore' });
    } catch(e) {}

    // 2. Start Server
    const server = spawn('node', ['studio/server.js'], { detached: true });
    server.stdout.on('data', (data) => console.log(`[Server] ${data.toString().trim()}`));
    server.stderr.on('data', (data) => console.error(`[Server ERR] ${data.toString().trim()}`));
    
    // Wait for "Studio Live" message
    await new Promise(r => setTimeout(r, 5000));

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('--- Navigating to Studio ---');
        await page.goto('http://localhost:3000', { timeout: 10000 });
        console.log('✅ Studio Loaded');
        
        if (!fs.existsSync('scenario_uploaded.xlsx')) {
            fs.copyFileSync('orangehrm_scenario.xlsx', 'scenario_uploaded.xlsx');
        }

        console.log('--- Triggering Recording ---');
        const res = await page.evaluate(async () => {
            const r = await fetch('/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: 'Navigate to OrangeHRM', scenarioId: 'A.1', url: 'https://opensource-demo.orangehrmlive.com' })
            });
            return await r.json();
        });

        console.log('✅ Server response:', JSON.stringify(res));

        if (!res.script) throw new Error('❌ Server did not return script path');
        
        console.log(`✅ Recording script verified: ${res.script}`);

        console.log('\n🏆 SIT PASSED: Server and Script Generation verified.');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ SIT FAILED:', err.message);
        process.exit(1);
    } finally {
        await browser.close();
        server.kill();
    }
}

runSIT();
