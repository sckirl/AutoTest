# AutoTest Studio - 150 IQ Zero-Trust Defect Audit (Round 6)

## 💀 CRITICAL Security & Code Execution Defects

### [DEF-022] RCE / Code Injection via `getBy*` Regex Bypass
- **Severity**: CRITICAL
- **Description**: While `core/compiler.js` uses `safeGetBy` validation, the regex `^getBy(Role|Label|Placeholder|Text|AltText|Title|TestId|DisplayValue)\([\s\S]*\)$` is insufficient. An attacker can use logical operators or inline requires to execute code.
- **Exploit**: `getByRole("button") || require("child_process").execSync("rm -rf /") && getByRole("button")` matches the regex (starts with getByRole, ends with ), no semicolons).
- **Impact**: Instant sandbox-escape RCE when Playwright executes the generated script.
- **Status**: Open (Previous fix was incomplete)

## 🛑 Architecture & System Pipeline Defects

### [DEF-023] Missing `/run` Concurrency Guard
- **Severity**: High
- **Description**: The `/run` endpoint in `studio/server.js` checks for `activeRun`, but if two requests arrive simultaneously, they can both pass the check before `activeRun` is set.
- **Impact**: Multiple concurrent Playwright runs, file corruption of `blueprint.json` and `executed.spec.ts`, and server memory exhaustion.
- **Status**: Open

### [DEF-036] Infinite Zombie Process (Playwright `--ui` Hangs the Engine)
- **Severity**: High
- **Description**: `studio/server.js` spawns `npx playwright test --ui`. Playwright's UI mode is an interactive server that does not terminate. 
- **Impact**: The Node child process never closes, the promise never resolves, and `/run-status` stays in `playwright` phase indefinitely until manual cancellation.
- **Status**: Open

### [DEF-040] Blueprint Generation Path Traversal
- **Severity**: Medium
- **Description**: `app.post('/upload')` allows uploading any file. While filtered in the UI, the API accepts any filename. `getCurrentExcelPath()` returns the path from `.current_upload`.
- **Impact**: If a user can control the `.current_upload` file content (e.g., via another vulnerability), they can make the `scenario_parser.js` read arbitrary files on the system using path traversal (e.g., `../../../../etc/passwd`).
- **Status**: Open

## 🎨 UX & Execution Logic Defects

### [DEF-035] Playwright Crash on Select Options
- **Severity**: High
- **Description**: `studio/server.js` maps `.selectOption()` to `type: 'fill'`. 
- **Impact**: Playwright throws a fatal error when calling `.fill()` on a `<select>` element.
- **Status**: Open

### [DEF-032] Code Generation Syntax Error (Newlines in Scenarios)
- **Severity**: High
- **Description**: `core/compiler.js` templates scenario names directly into `test('Scenario ${scenario.Scenario_ID}...`, ...)`.
- **Impact**: If an Excel cell contains a newline, the generated JavaScript string is broken, causing a syntax error that blocks the entire test run.
- **Status**: Open

### [DEF-041] Post-Click Screenshot of Detached Nodes
- **Severity**: Low
- **Description**: `compiler.js` takes a screenshot *after* every action. For clicks that cause navigation, the "MARK" screenshot happens *before* the click, but the standard screenshot happens *after*.
- **Impact**: If navigation occurs, the post-click screenshot might capture a blank page or a loading state, losing the visual context of the action's result.
- **Status**: Open

---

## ⚡ Round 7: Execution Engine & UX Deep-Dive
*Audited by 2 Senior QA Engineers (Logic & UX specialists) with Zero-Trust principles.*

### [DEF-042] Race Condition in `/run` Concurrency Guard
- **Severity**: High
- **Description**: The concurrency check in `app.post('/run')` happens before the `activeRun` object is instantiated. Since the instantiation happens in an async tick after the response is sent, two near-simultaneous requests will both pass the `if (activeRun)` check.
- **Impact**: Server spawns duplicate Playwright instances, leading to file corruption of `blueprint.json` and `executed.spec.ts`.
- **Recommendation**: Set `activeRun` synchronously immediately after the check, or use an Atomic lock.

### [DEF-043] Volatile Execution State (UI Sync Failure)
- **Severity**: High
- **Description**: The UI only starts polling for run status when the "Execute" button is clicked. If the user refreshes the page or navigates away and back during a 10-minute test run, the UI loses track of the execution.
- **Impact**: Users have no way to see the progress or results of a running suite if they refresh the tab. The "Execute" button will also appear enabled, allowing them to accidentally trigger a concurrent run (triggering DEF-042).
- **Recommendation**: Add a `DOMContentLoaded` hook that checks `/run-status`. If `phase` is not `idle`, automatically trigger `pollRunStatus()` and disable the execute button.

### [DEF-044] Opaque Test Failure Logic
- **Severity**: Medium
- **Description**: The status polling logic displays a generic red error if a run fails. It does not differentiate between a **System Error** (e.g. Compiler crashed) and a **UAT Failure** (e.g. Scenario B.1 failed an assertion).
- **Impact**: High friction for QA engineers. Every failed test case looks like a software bug in the AutoTest engine itself rather than a valid test failure in the target app.
- **Recommendation**: Enhance `/run-status` to return a `failureType` ('system' or 'test'). UI should use Blue/Info for test failures and Red/Error for system crashes.

### [DEF-045] Visual Marker Pollution (Missing unmarkLocator)
- **Severity**: Low
- **Description**: In `core/compiler.js`, the `click` action type injects `markLocator()` but never calls `unmarkLocator()`.
- **Impact**: For single-page interactions (e.g. clicking a tab or dropdown), the red debug border remains permanently on the element throughout the rest of the scenario trace.
- **Recommendation**: Always call `unmarkLocator()` after a click interaction, even if navigation is expected (wrapped in try/catch to handle detached nodes).

### [DEF-046] Execution Settings UI Input Flaws
- **Severity**: Low
- **Description**: The `workers` input in the Execution tab lacks a `step="1"` attribute and min/max constraints in the HTML.
- **Impact**: Users can type decimals or huge numbers. While the backend has a basic check, the UI provides no guardrails.
- **Recommendation**: Add `min="1" max="16" step="1"` to the worker count input.

### [DEF-047] Local File System Pollution
- **Severity**: Low
- **Description**: Every upload creates a new `scenario_uploaded_<timestamp>.xlsx` file in the root directory.
- **Impact**: Root directory is cluttered with hundreds of temporary Excel files that are never cleaned up.
- **Recommendation**: Move uploads to a `temp/` folder and implement a lifecycle cleanup policy.

---

## 🔬 Round 8: Execution Pipeline & SIT/UAT Validation
*Final rigorous audit by 2 Senior QA Engineers (Logic & UX) under Zero-Trust mandates.*

### [DEF-048] Misleading SIT Passing Criteria
- **Severity**: High
- **Description**: The `internal_sit.js` validation script only verifies that the `/run` endpoint accepts the request and reaches the `playwright` phase. It does not wait for or verify the successful completion of the test suite.
- **Impact**: False sense of security for developers. The engine could be hanging (due to DEF-036) or crashing immediately after launch, but the SIT script will still report a "Pass".
- **Recommendation**: Update SIT script to poll `/run-status` until `completed` or `failed` and verify the exit code.

### [DEF-049] Execution Script (run_tests.command) Redundancy & Zombie Risk
- **Severity**: Medium
- **Description**: The `run_tests.command` script in the root directory still uses the `--ui` flag, duplicating the zombie process defect (DEF-036). It also bypasses the Studio server entirely, creating a secondary, unmonitored execution path.
- **Impact**: Inconsistent execution behavior between UI and CLI. Resource exhaustion if run from CLI.
- **Recommendation**: The CLI script should either be removed in favor of the Studio UI or updated to share the exact same execution flags (no `--ui`).

### [DEF-050] Inconsistent Worker Defaults
- **Severity**: Low
- **Description**: The HTML defines the default worker count as `2` (`value="2"`), but the JavaScript `runBtn.onclick` logic has a fallback of `4` (`Number(... || 4)`).
- **Impact**: Confusing UX. The user sees 2 in the input, but the system might be defaulting to 4 in certain edge cases if the DOM read fails.
- **Recommendation**: Align both the HTML attribute and the JS fallback to the same value (recommended `2` for local stability).

### [DEF-051] Execution State Volatility (Refresh Crash)
- **Severity**: High
- **Description**: The Execution Tab's status polling only exists in memory within the current page session. If a user refreshes the page during a long-running Playwright suite, the UI resets to its "Idle" state and never re-attaches to the ongoing process.
- **Impact**: Critical UX failure. Users lose visibility into their automation runs and might accidentally trigger multiple concurrent runs because the "Execute" button appears re-enabled.
- **Recommendation**: Implement a `checkCurrentStatus()` on page load. If the backend reports an active phase, immediately resume UI polling and disable controls.

---

## 🏁 Round 9: Final Execution Tab & UAT Rigorous Audit
*Final Audit by 2 Senior QA Engineers (150 IQ, 20 Years Exp) with extreme Zero-Trust mandates.*

### [DEF-053] Broken Advanced Locators (Regex Over-Hardening)
- **Severity**: High
- **Description**: The fix for DEF-039 (RCE Sandbox Escape) uses a character whitelist that is too restrictive: `/^(['"`])[a-zA-Z0-9\s\-#\._\[\]=]*\1$/`. This whitelist explicitly blocks `{`, `}`, and `:`, which are mandatory for advanced Playwright locators.
- **Impact**: QA engineers can no longer use locators like `getByRole('button', { name: 'Submit' })` or `getByLabel('User', { exact: true })`. These valid scripts are now silently rejected or coerced into invalid `page.locator()` strings, breaking complex UAT scenarios.
- **Recommendation**: Expand the character whitelist to include `{`, `}`, `:`, and `,` while maintaining safety, or use a proper AST parser for argument validation.

### [DEF-054] Execution Cancellation State Overwrite (UX Failure)
- **Severity**: Medium
- **Description**: When a user clicks "Cancel Execution", the backend `/run-cancel` correctly sets the status to `cancelled`. However, the `pw.on('close')` handler in the async `/run` block triggers immediately after the process is killed. Since the process exits with a non-zero code, the handler calls `setRunStatus('failed', ...)`, overwriting the "Cancelled" status.
- **Impact**: The UI briefly shows "Cancelled" and then immediately switches to a red "FAILED" banner. This misleads the user into thinking the system crashed when they actually performed a manual abort.
- **Recommendation**: Check if the current status phase is `cancelled` before calling `setRunStatus` in the `close` handler.

### [DEF-055] Post-Completion State Volatility
- **Severity**: Medium
- **Description**: The UI refresh persistence logic (DEF-051) only re-attaches if the backend phase is **not** `idle`. 
- **Impact**: If a long-running suite finishes (Succeeds or Fails) while the user has the tab closed, upon returning and refreshing, they see an "Idle" screen. The summary of the last run is lost, forcing the user to dig through the `results/` folder manually to know if their tests passed.
- **Recommendation**: The backend should persist the `LAST_RUN_RESULTS` and the UI should display this summary on page load even if the current state is `idle`.

### [DEF-056] Secret/Artifact Leakage (Incomplete .gitignore)
- **Severity**: Low
- **Description**: The newly created `temp_uploads/` directory, which contains sensitive user Excel scenarios and replay scripts, is not tracked in `.gitignore`.
- **Impact**: User data and temporary execution scripts will be accidentally committed to the repository.
- **Recommendation**: Add `temp_uploads/` to `.gitignore`.

### [DEF-057] Race Condition in Excel Pointer (.current_upload)
- **Severity**: Medium
- **Description**: The system uses a single global file `.current_upload` to track the active scenario.
- **Impact**: If two users are using the same Studio instance, and User A starts a run, but User B uploads a new file *before* User A's parser reads the pointer, User A will execute User B's scenarios. 
- **Recommendation**: Move scenario tracking into the `activeRun` object or session-based storage rather than a global file system pointer.

### [DEF-058] Execution Button "Fake Failure" UX
- **Severity**: Low
- **Description**: The "Execute" button in `studio-ui.html` is reset to "Enabled" as soon as the `/run` API returns. 
- **Impact**: If a user clicks it again while a run is active, they get a 409 error message "Execution failed to start", which looks like a system error. The button should remain disabled or show "Run in Progress" to prevent user confusion.
- **Recommendation**: Keep the Execute button disabled as long as the phase is not `idle`, `completed`, `failed`, or `cancelled`.
