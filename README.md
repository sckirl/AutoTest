# AutoTest Studio

AutoTest Studio is a **Zero-Install, Air-Gapped, Data-Driven Playwright Engine** built specifically for hardened corporate and banking environments. It completely decouples Playwright logic from UAT Excel matrices, allowing manual testers to build dynamic, automated E2E test suites entirely from a web UI without ever writing code or using the command line.

---

## The Vision
In many enterprise environments, QA and UAT testers lack the technical ability to write Playwright scripts, while developers struggle to keep test scripts synced with rapidly changing Excel testing matrices. Furthermore, strict banking networks block `npm install`, `npx`, and external browser downloads. 

AutoTest Studio bridges this gap by offering a **Zero-Trust, offline-first orchestration engine**. You drop an Excel file into the UI, record your actions visually, and the engine natively stitches, compiles, and executes the tests in the background, saving flawless screenshot evidence and traces into neatly organized folders.

---

## Tech Stack & Architecture
- **Backend Orchestrator**: Node.js & Express.js
- **Automation Engine**: Playwright & Playwright Test Runner
- **AST Parsing Engine**: Acorn (JavaScript AST parser) for securely extracting locators and verification assertions from raw Playwright codegen.
- **Frontend**: Vanilla HTML/JS/CSS (No build step required, maximizing offline portability)
- **Data Processor**: `xlsx` library for hierarchical parsing of complex UAT documents.

### How It Was Built
This framework was engineered with a strict "Air-Gapped" ideology. 
1. All Node modules and Chromium driver binaries are bundled directly within the `DRIVERS/` directory.
2. The compilation engine (`core/compiler.js`) generates transient, secure Playwright test scripts entirely in memory based on the UI's JSON mappings.
3. It utilizes a `isSafeChain` security model to prevent arbitrary code execution while still allowing robust Playwright locators (e.g., `getByRole`, `filter`, `locator`) and assertions (`toBeVisible`, `toHaveText`).

---

## Quick Start Guide

AutoTest has two run modes:

- **Web mode:** Node.js runs the Express server and you open the Studio UI in Chrome.
- **Electron mode:** the packaged app contains the server, Node runtime, application dependencies, and Playwright browser files. The target tester does not need Node.js, npm, or internet access.

For either mode, stable Google Chrome is used for recording. Recording uses the separate persistent profile named `autotest`; the user's normal Chrome profile is not used. If stable Chrome is installed somewhere non-standard, configure its absolute executable path with `AUTOTEST_CHROME_PATH` in `.env`.

### Web mode: run from the repository

#### 1. Install dependencies and provide Playwright browsers

On a connected development/build machine:

```bash
npm ci
```

The Playwright browser bundle is intentionally not stored in Git. Obtain the approved `DRIVERS/ms-playwright/` folder from your internal artifact repository or an approved transfer. For a connected machine that already has the repository dependencies, you can download Chromium into that folder with:

```bash
PLAYWRIGHT_BROWSERS_PATH=DRIVERS/ms-playwright ./node_modules/.bin/playwright install chromium
```

Do not recreate or ship `DRIVERS/node_modules`; application packages come from the repository root `node_modules` and are bundled by the Electron build.

#### 2. Start the server

For a predictable browser URL, bind port **3000** explicitly:

```bash
PORT=3000 node studio/server.js
```

Then open:

```text
http://127.0.0.1:3000
```

`npm start` also starts the web server, but without a `PORT` override the server chooses an OS-assigned free port. Read the terminal line `STUDIO_PORT=<number>` and open `http://127.0.0.1:<number>`.

On Windows PowerShell, the equivalent fixed-port command is:

```powershell
$env:PORT = "3000"; node studio/server.js
```

The server's default behavior is dynamic-port mode (`PORT=0` internally), so multiple instances can run without colliding. The automated test harness intentionally uses fixed port 3000 and is not the production startup command.

#### 3. Optional `.env` configuration

Copy `.env.example` to `.env` and set an absolute path if stable Chrome is not installed in its standard location:

```env
AUTOTEST_CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

On macOS, for example:

```env
AUTOTEST_CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

An explicitly exported environment variable takes precedence over `.env`. Stable Chrome is supported; Chrome Beta, Canary, Edge, and other channels are outside this configuration contract.

#### 4. Use the Studio workflow

1. Upload your UAT Excel matrix.
2. In **Mappings**, click **Record** or **Re-Map**.
3. A visible Playwright Codegen window opens using the isolated `autotest` profile. Perform the action there and inspect or modify the generated code while recording.
4. Close the Playwright Codegen window. The generated code is transferred into the AutoTest mapping modal.
5. Review the code, parameterize values with `{variable_name}` where needed, and click **Sync & Save Action**.
6. Open **Execution** and run the scenarios.

Evidence is written under the configured results directory. In web mode without relocation, that is the repository's `results/` directory. In Electron mode, it is stored under the app's writable user-data directory.

### Windows Electron mode: build the `.exe`

Build the Windows installer on a **Windows build machine**. Do not build the NSIS installer on the target locked-down machine, and do not rely on cross-compiling the `.exe` from macOS.

#### 1. Prepare the Windows build machine

Install a supported Node.js version, clone or copy the repository, and open PowerShell in the repository root. Then install the locked dependency tree:

```powershell
npm ci
```

The first build machine needs internet access for npm packages and Electron Builder's Windows packaging tools. The eventual tester machine does not.

#### 2. Add the Windows Playwright browser bundle

The current checkout may contain only a browser bundle for the machine that downloaded it. For a Windows artifact, obtain or download the Windows Chromium bundle on the Windows build machine:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "DRIVERS\ms-playwright"
.\node_modules\.bin\playwright.cmd install chromium
```

Verify that this creates a Windows executable similar to:

```text
DRIVERS\ms-playwright\chromium-<version>\chrome-win\chrome.exe
```

Copy the complete `DRIVERS\ms-playwright` directory into the build input if it came from an internal artifact repository. Do not remove the Windows browser files before packaging.

#### 3. Optional stable Chrome location override

If stable Chrome is installed in a non-standard location on the eventual target machine, put an absolute path in the target user's `.env`, or provide `AUTOTEST_CHROME_PATH` through the deployment environment. For example:

```env
AUTOTEST_CHROME_PATH=C:\\CompanyTools\\Chrome\\Application\\chrome.exe
```

The path must point to an existing file. An invalid configured path produces a clear configuration error instead of silently selecting another browser channel.

#### 4. Build and test the unpacked Electron app

Create an unpacked Windows application first:

```powershell
npm run pack
```

Electron Builder places the unpacked application under `dist\win-unpacked\`. Launch the executable directly for a smoke test:

```powershell
.\dist\win-unpacked\AutoTest Studio.exe
```

Verify that the app opens, uploads an Excel file, opens a visible Playwright Codegen window from **Record**, transfers generated code back into the mapping modal, and executes a small scenario before building the installer.

#### 5. Build the distributable installer

```powershell
npm run dist
```

The Windows NSIS installer is written under `dist\`, normally with a name similar to:

```text
dist\AutoTest Studio Setup 1.0.0.exe
```

The exact filename includes the version from `package.json`. The current NSIS configuration is per-user (`perMachine: false`), does not require administrator installation by default, and allows the tester to choose the installation directory.

#### 6. Deliver to the locked-down tester machine

Copy only the generated installer `.exe` to the target machine using your approved internal transfer process. The target tester installs and launches the app; they do **not** need to install Node.js, npm, Playwright, Chromium, or run `npx`. The app carries its Electron runtime, root application dependencies, and `DRIVERS/ms-playwright` resources.

The installer is currently unsigned. Windows SmartScreen or corporate application-control policy may warn or block it until your organization signs and approves the binary. Code-signing certificates, notarization, and IT allow-listing are deployment prerequisites, not npm settings.

### macOS Electron mode

On macOS, the equivalent unpacked build is:

```bash
npm run pack
```

The app is placed under `dist/mac-arm64/` or the architecture-specific directory Electron Builder reports. Launch the `.app` directly for smoke testing. Build the final macOS distributable with:

```bash
npm run dist
```

The current macOS build is also unsigned unless a valid Developer ID identity is configured.

### Port behavior summary

- **Web server with `PORT=3000`:** `http://127.0.0.1:3000`.
- **Web server with no explicit port:** read `STUDIO_PORT=<number>` from the terminal and open that port.
- **Electron app:** the embedded server uses a dynamically assigned localhost port. The Electron shell reads `STUDIO_PORT` automatically; the tester does not need to enter a port.
- **Test harness:** `npm test` uses port 3000 internally and checks that it is free first.

### Results and evidence

Once execution completes, scenario evidence is stored in the configured results directory. Each scenario receives its own folder containing step screenshots, `FINAL.png`, and (when not withheld for sensitive data) a Playwright trace.
