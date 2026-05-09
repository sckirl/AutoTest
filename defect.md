# AutoTest Studio - 150 IQ Zero-Trust Defect Audit

## 💀 CRITICAL Security & Code Execution Defects

### [DEF-001] Remote Code Execution (RCE) via URL Injection
- **Severity**: CRITICAL
- **Description**: In `studio/server.js` (inside `app.post('/record')`), `req.body.url` is directly concatenated into an executable Node script without escaping: ``scriptContent += `  await page.goto('${url}');\n`;``.
- **Impact**: Any user with access to the UI (or API) can submit a malicious URL (e.g., `'); require('child_process').execSync('rm -rf /'); //`) to execute arbitrary shell commands on the host machine.
- **Status**: Open

### [DEF-002] Cross-Site Scripting (XSS) via Excel Payload
- **Severity**: CRITICAL
- **Description**: `studio/server.js` reads values from `scenario_uploaded.xlsx` and serves them via the `/scan` endpoint. The frontend (`studio-ui.html`) renders these using `.innerHTML = ... ${s.label}`.
- **Impact**: An attacker can provide an Excel file containing malicious `<script>` tags in the scenario labels. When the QA engineer clicks "Upload", their browser will execute the attacker's script.
- **Status**: Open

### [DEF-003] Code Injection Breakage in Engine Compiler
- **Severity**: High
- **Description**: `core/compiler.js` templates test values into strings using backticks: ``code += `  await ${locator}.fill(\`${finalValue}\`);\n`;``. It does not escape backticks or template literals (`${}`) within the `finalValue`.
- **Impact**: If an Excel cell contains a backtick `` ` `` or `${`, the generated `executed.spec.ts` becomes invalid TypeScript, breaking the entire pipeline with a syntax error.
- **Status**: Open

## 🛑 Critical System Pipeline Defects

### [DEF-004] Broken CLI Execution Script
- **Severity**: Critical
- **Description**: `run_tests.command` calls `node producer.js` which was deleted according to `changes.md`.
- **Impact**: Terminal-based test execution is permanently broken for local QA and CI pipelines.
- **Status**: Open

### [DEF-005] Destructive Global Mapping Reset
- **Severity**: High
- **Description**: The `/restart` endpoint overwrites `core/mappings.json` with an empty object `{}`.
- **Impact**: Resetting the workspace deletes the entire historical library of unique mapped actions across all projects.
- **Status**: Open

### [DEF-006] Incomplete Interaction Parsing (Loss of Data)
- **Severity**: High
- **Description**: `parseRecordedCode` in `server.js` uses weak regex to extract locators. It fails entirely to extract chained actions, complex locators with internal quotes, or multi-step recorded blocks. 
- **Impact**: Steps are silently dropped when clicking "Sync & Save", leading to broken or incomplete automation mappings.
- **Status**: Open

## 🧠 Functional & Architecture Defects

### [DEF-007] Blocking Node.js Event Loop
- **Severity**: Medium
- **Description**: `/run` utilizes `execSync` for parsing and compilation steps.
- **Impact**: The Studio server becomes entirely unresponsive to all API requests and UI loads until parsing and compilation is complete.
- **Status**: Open

### [DEF-008] Unmanaged Zombie Browsers
- **Severity**: High
- **Description**: `app.post('/record')` uses `exec(...)` to run the replay scripts, but does not capture PIDs or clean them up on UI disconnect.
- **Impact**: Repeatedly clicking "Record" spawns infinite browser processes, rapidly exhausting server memory and crashing the instance.
- **Status**: Open

### [DEF-009] Replay Script Skips State Verification
- **Severity**: Medium
- **Description**: In `/record`, the script loop reconstructs the preceding steps but explicitly ignores `verifyVisible` and `verifyText` mapping types.
- **Impact**: The browser pauses for the user to map a new element, but the UI state is not strictly validated, meaning the recorded element might not reflect true runtime state.
- **Status**: Open

### [DEF-010] Incomplete .gitignore
- **Severity**: Medium
- **Description**: `changes.md` claims runtime artifacts are ignored, but `.gitignore` misses `scenario_uploaded.xlsx`, `core/blueprint.json`, `core/executed.spec.ts`, and `replay_*.js` files.
- **Impact**: Generated secrets and user payloads will be accidentally committed to git.
- **Status**: Open

### [DEF-013] Hardcoded Domain Logic in Generic Engine
- **Severity**: High
- **Description**: `core/compiler.js` has hardcoded logic specifically for YouTube consent dialogs (`window.localStorage.setItem('yt-consent-dialog-shown', 'true')` and a try-catch to click `button[aria-label="Accept all"]`).
- **Impact**: The "AutoTest" engine claims to be a generic UAT testing engine, but injecting site-specific overrides completely defeats its generic purpose and could break other applications being tested.
- **Status**: Open

### [DEF-014] Silent Failure on Invalid Excel Columns
- **Severity**: High
- **Description**: `core/scenario_parser.js` hardcodes column indices (e.g., `rows[r][1]` for Scenario ID, `rows[r][13]` for Test Data). It does not read or validate the actual column headers.
- **Impact**: If a user uploads an Excel file with slightly different column formatting, the parser silently generates a broken blueprint without issuing a warning or error to the user.
- **Status**: Open

### [DEF-015] Global Data Leakage across Scenarios
- **Severity**: Medium
- **Description**: `core/scenario_parser.js` uses a `globalStepDataCache` variable. If Scenario A inputs data on a step, and Scenario B executes the same step without providing data, it silently inherits the data from Scenario A.
- **Impact**: Tests become highly inter-dependent. Executing a scenario in isolation vs. as part of a suite might yield different results, leading to "flaky" tests.
- **Status**: Open

### [DEF-016] Concurrent Overwrite of Uploaded Excel
- **Severity**: High
- **Description**: In `studio/server.js`, `multer` uploads always write to a hardcoded `scenario_uploaded.xlsx` file path.
- **Impact**: If multiple QA engineers attempt to use the AutoTest Studio simultaneously on the same server, their uploaded scenarios will immediately overwrite each other, causing race conditions in `/scan` and `/run`.
- **Status**: Open

### [DEF-017] Playwright Wait Antipatterns
- **Severity**: Low
- **Description**: `core/compiler.js` adds `await page.waitForTimeout(500);` after every single action.
- **Impact**: This ignores Playwright's built-in auto-waiting mechanisms, artificially inflating test suite execution times significantly and masking potential synchronization bugs.
- **Status**: Open

## 🎨 UX & Usability Defects

### [DEF-011] Volatile Base URL Configuration
- **Severity**: Low
- **Description**: The "Base URL for Recording" input in `studio-ui.html` is not saved to localStorage.
- **Impact**: Users must re-type the URL on every page refresh.
- **Status**: Open

### [DEF-012] Static, Opaque Execution Feedback
- **Severity**: High
- **Description**: When clicking "Execute", the UI is completely blind to backend errors. If `compiler.js` throws an error, the UI remains permanently stuck on "🚀 Launching Playwright UI...".
- **Impact**: Very poor UX; requires checking the terminal to know why a test failed to launch.
- **Status**: Open

### [DEF-018] No Ability to Edit/Delete Mappings from UI
- **Severity**: Medium
- **Description**: Users can "Re-Map" actions, but they cannot delete or view an existing mapped script from the UI.
- **Impact**: If a mapping is incorrectly created or becomes obsolete, the only way to delete it is through the destructive `/restart` button or by manually editing `core/mappings.json` outside the app.
- **Status**: Open

### [DEF-019] Sync & Save Does Not Validate Code
- **Severity**: Medium
- **Description**: The frontend (`studio-ui.html`) does not validate the "recorded code" input other than checking if it's empty. It blindly sends it to the backend.
- **Impact**: A user could accidentally paste stack traces or non-Playwright code. This code would get saved and break subsequent `/run` blueprint generations without any immediate feedback.
- **Status**: Open

### [DEF-020] File Upload Has No Visual Feedback
- **Severity**: Low
- **Description**: After dropping an Excel file into the `drop-zone`, the UI does not display the uploaded file's name.
- **Impact**: The user has no way of visually verifying which scenario file is currently active in the Studio.
- **Status**: Open