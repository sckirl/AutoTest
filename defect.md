# AutoTest Studio - 150 IQ Zero-Trust Defect Audit (Round 3)

## 📋 Status of Previous Defects
- **[FIXED]** XSS via Excel Payload (DEF-002).
- **[FIXED]** Blocking Node.js Event Loop (DEF-007).
- **[FIXED]** Unmanaged Zombie Browsers (DEF-008).
- **[FIXED]** Destructive Global Reset (DEF-005).
- **[FIXED]** Hardcoded Domain Logic (DEF-013).
- **[FIXED]** Global Data Leakage (DEF-015).
- **[FIXED]** Concurrent Overwrite (DEF-016).
- **[FIXED]** URL Injection RCE in `/record` (DEF-001).

---

## 💀 CRITICAL Security & Code Execution Defects

### [DEF-022] RCE / Code Injection via `getBy*` Regex Bypass
- **Severity**: CRITICAL
- **Description**: **[DEV FAILED TO FIX]** The DEV agent claimed to implement "Safe compiler quoting", but `core/compiler.js` still explicitly bypasses quoting if the target starts with `getBy`: `locator = target.startsWith('getBy') ? \`page.\${target}\` : ...`.
- **Impact**: An attacker can send a crafted mapping: `await page.getByRole("button"); require("child_process").execSync("rm -rf /"); page.getByRole("button").click();`. The backend injects the `execSync` directly into the compiled `.spec.ts` file without quotes, leading to instant Remote Code Execution upon `/run`.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: Added strict `safeGetBy()` allowlist validation (method whitelist + reject `;`, backticks, newlines). Unsafe targets are treated as quoted `page.locator(...)`.

### [DEF-021] Assertion Parsing Data Loss (Critical Logic Failure)
- **Severity**: High
- **Description**: **[DEV FAILED TO FIX]** The DEV agent added `toBeVisible` and `toContainText` to the regex in `parseRecordedCode`, but completely failed to understand that the regex mandates `await page.` at the start. Playwright assertions are written as `await expect(page.locator(...)).toBeVisible()`. 
- **Impact**: The backend still silently deletes every single assertion the user pastes. Tests compile but verify absolutely nothing.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: Added `extractExpectLocator()` and explicit `expect(...).toBeVisible()/toContainText()/toHaveText()` parsing in `parseRecordedCode`.

## 🛑 Architecture & System Pipeline Defects

### [DEF-023] Missing `/run` Concurrency Guard
- **Severity**: High
- **Description**: **[DEV FAILED TO FIX]** The recording endpoint has a concurrency guard, but the `/run` endpoint still lacks one.
- **Impact**: API spamming `/run` will concurrently execute multiple compilers writing to the same `blueprint.json` and `executed.spec.ts`, corrupting files and causing Playwright memory exhaustion.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: Added `activeRun` lock; concurrent `/run` now returns `409`. Added `/run-cancel` endpoint for controlled cancellation.

### [DEF-025] Post-Click Unmark Race Condition (Inefficiency/Flakiness)
- **Severity**: Medium
- **Description**: **[DEV FAILED TO FIX]** `core/compiler.js` wraps `.click()` actions with a visual `unmarkLocator()` immediately after the click.
- **Impact**: If the click causes page navigation, Playwright attempts to `evaluate` on a destroyed DOM element, causing unnecessary delays and trace pollution.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: Removed post-click `unmarkLocator()` call to avoid evaluate-on-detached-node race during navigation-triggering clicks.

## 🎨 UX & Usability Defects

### [DEF-029] Overly Strict Execution Gate (Cannot run partial suites)
- **Severity**: Medium
- **Description**: **[DEV FAILED TO FIX]** The UI completely disables the "Execute Test Scenarios" button if even a single mapped step is missing (`runBtn.disabled = !allMapped`). 
- **Impact**: Users cannot incrementally test their automation. **Requirement explicitly stated this must be fixed**, but it was completely ignored.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: UI now enables execution when `mappedCount > 0` (partial execution allowed).

### [DEF-030] Poor Visual Differentiation Between Action Buttons
- **Severity**: Low
- **Description**: **[DEV FAILED TO FIX]** The "Record" and "Re-Map" buttons use the exact same base styling and CSS classes (`btn btn-record`).
- **Impact**: It is difficult for users to quickly distinguish at a glance which steps need initial recording. **Requirement explicitly stated this must be fixed**.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: Added separate styles: `Record` (red warning style) vs `Re-Map` (blue style).

## 🆕 New Defects Found in "Auto-Recording" Feature

### [DEF-031] Auto-Recording Cannot Capture Assertions
- **Severity**: High
- **Description**: The newly implemented Auto-Recording feature injects JS to capture `click` and `change` events. However, it provides absolutely no mechanism for a user to graphically record an assertion (e.g., verifying an element is visible or contains text).
- **Impact**: A QA engineer using the "easy UX" auto-recorder will produce scripts that only click and type, but never assert. Because `DEF-021` drops pasted assertions, it is currently impossible to create a working, verified test case using the UI.
- **Status**: Fixed (2026-05-09)
- **Fix Note**: Auto-recorder now supports assertion capture shortcuts:
  - `Alt+Click` => `expect(locator).toBeVisible()`
  - `Shift+Click` => prompts expected text and records `expect(locator).toContainText(...)`.
