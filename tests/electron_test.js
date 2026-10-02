// A4 (FUTURE_ARCHITECTURE.md, §A4.4 "Electron"): boots the real packaged-shape app via
// playwright._electron — the only way to prove electron/main.js actually forks the server
// and loads its window, not just that the pieces compile in isolation.
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { _electron } = require('playwright');

const ROOT = path.join(__dirname, '..');
const MAIN = path.join(ROOT, 'electron/main.js');

function tmpUserData() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'autotest-electron-'));
}

// A-30: app boots; window renders the Mappings tab.
async function testBootsAndRendersMappingsTab() {
    const userData = tmpUserData();
    const electronApp = await _electron.launch({ args: [MAIN, `--user-data-dir=${userData}`] });
    try {
        const win = await electronApp.firstWindow();
        // A1.2: main.js only calls loadURL once the forked server prints STUDIO_PORT=, so the
        // window's URL changing away from about:blank *is* the proof the fork→parse→load chain worked.
        await win.waitForURL(/^http:\/\/127\.0\.0\.1:\d+/, { timeout: 15000 });
        await win.waitForSelector('#tab-mappings', { timeout: 10000 });
        assert.strictEqual(await win.locator('#tab-mappings').textContent(), 'Mappings',
            'FAIL: window did not render the Mappings tab');
    } finally {
        await electronApp.close();
    }
}

// A-31: server child dies with the app — no orphaned node process left running.
async function testServerChildDiesWithApp() {
    const userData = tmpUserData();
    const electronApp = await _electron.launch({ args: [MAIN, `--user-data-dir=${userData}`] });
    const win = await electronApp.firstWindow();
    await win.waitForURL(/^http:\/\/127\.0\.0\.1:\d+/, { timeout: 15000 });
    const port = new URL(win.url()).port;

    await electronApp.close();

    // A dead child can no longer answer HTTP — poll briefly rather than trust a fixed sleep.
    const stillAlive = () => new Promise(resolve => {
        require('http').get({ host: '127.0.0.1', port, path: '/env', timeout: 500 }, res => { res.resume(); resolve(true); })
            .on('error', () => resolve(false));
    });
    const deadline = Date.now() + 5000;
    let alive = true;
    while (Date.now() < deadline) {
        alive = await stillAlive();
        if (!alive) break;
        await new Promise(r => setTimeout(r, 200));
    }
    assert.strictEqual(alive, false, 'FAIL: server child kept answering HTTP after the Electron app closed — orphaned process');
}

Promise.resolve()
    .then(testBootsAndRendersMappingsTab)
    .then(testServerChildDiesWithApp)
    .then(() => console.log('PASS: electron_test — app boots, forks server, renders UI, and cleans up its child on quit'))
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
