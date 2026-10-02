// A2 (FUTURE_ARCHITECTURE.md): the Electron shell. Forks studio/server.js as a child, with
// A1.1's STATE_DIR/DATA_DIR/RESULTS_DIR pointed at userData (writable even when the app
// itself is installed read-only) and A1.2's PORT=0 (dynamic, avoids colliding with anything
// already on 3000). Parses the STUDIO_PORT= stdout line A1.2 already emits to know where to
// point the window. studio/server.js and studio-ui.html keep their existing roles unchanged.
const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');

let win = null;
let child = null;

function startServerAndWindow() {
    const userData = app.getPath('userData');
    // A2/ENOTDIR: app.asar is a FILE, never a cwd. fork() inherits this process's cwd by
    // default, but Electron launches with cwd=/ (or wherever the .exe/.app was double-clicked
    // from) — never chdir into the bundle, and pin it to userData (writable) so nothing
    // downstream can accidentally resolve a relative 'results' or 'core' against the asar.
    try { process.chdir(userData); } catch (e) { /* userData always exists; belt-and-braces */ }
    child = fork(path.join(__dirname, '../studio/server.js'), [], {
        cwd: userData,
        env: {
            ...process.env,
            AUTOTEST_STATE_DIR: userData,
            AUTOTEST_DATA_DIR: userData,
            AUTOTEST_RESULTS_DIR: path.join(userData, 'results'),
            AUTOTEST_CDP_PROFILE: 'isolated',
            // A1.3 known-gap bridge: fork()'d server.js sees process.resourcesPath natively,
            // but the scenario_parser.js/compiler.js children IT execSync's do not — they
            // read this env var instead (core/helpers.js resolveDriversRoot()).
            RESOURCES_PATH: process.resourcesPath,
            PORT: '0'
        },
        silent: true // pipe stdout/stderr instead of inheriting, so we can parse STUDIO_PORT=
    });

    // ENOTDIR symptom, second half: if the server child dies before printing
    // STUDIO_PORT= (bad cwd, missing module, asar path bug), the window used to sit on a
    // blank page forever with zero signal. Surface the child's dying words instead.
    let booted = false;
    let tail = '';
    child.on('exit', (code) => {
        if (!booted && code !== 0 && win) {
            win.loadURL(`data:text/plain,AutoTest server failed to start (exit ${code}). Last output:\n${encodeURIComponent(tail.slice(-2000))}`);
        }
    });
    child.stdout.on('data', (d) => {
        tail += d.toString();
        const m = /STUDIO_PORT=(\d+)/.exec(d.toString());
        if (m && win) { booted = true; win.loadURL(`http://127.0.0.1:${m[1]}`); }
    });
    child.stderr.on('data', (d) => process.stderr.write(d));

    win = new BrowserWindow({ width: 1280, height: 900 });
}

app.whenReady().then(startServerAndWindow);

// ponytail: single-purpose utility app, not a document editor — quit on all-windows-closed
// on every platform rather than following macOS's dock-stays-open convention. Add the
// activate/darwin-reopen dance back if this ever needs to feel like a native mac app.
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (child && !child.killed) child.kill(); });
