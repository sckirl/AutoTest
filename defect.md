What this repo does: AutoTest turns workbook scenarios into recorded browser mappings, data-driven Playwright runs and saved evidence. Electron is intended to make it usable offline on a tester's desktop. Assumed load: one tester and one state owner per installation, multiple scenarios/data iterations, with worker limits still to be measured.

## Codegen delivery review — 2026-10-17

The two findings recorded below under “Final codegen delivery review” are fixed in the frozen candidate: final output is protected against focus-only interactions while actual edits remain intact and the capture remains visible for review; Manual preview callbacks check both modal operation and edit revision. Retained capture details are cleared when a new Record, Manual, or Suggestion modal opens. Static source review found no additional blocker in the connected codegen/result/cancel/poll paths. Developer focused regression checks reported meaningful RED/GREEN, and the coordinator reports all 23 full-suite tests passed (exit 0). This is source and automated-test evidence only; no GUI, real codegen, installed-package, or full-workbook acceptance was performed in this review.

Final rereview: the delayed Record preview race is also fixed by incrementing `codeAreaRevision` when the final codegen body is inserted. The regression check exercised final capture followed by the older preview response and reportedly failed before the fix and passed after it. The coordinator reports focused checks and 11 UI checks passed; the final full-suite rerun is pending. This remains static and automated-test evidence, not GUI or native codegen acceptance.

**Pending fix — Record modal permits saving after launch failure and gives unusable timeout guidance** (`studio/studio-ui.html:1382`, `studio/studio-ui.html:1259`)

- **Severity:** High; a failed recording can save old or user-entered code as if it were the completed recording.
- **Trigger:** `/record` fails to launch, or its result poll times out.
- **Problem:** The launch catch clears `codegenPending` and enables Sync & Save without a successful final child close. The timeout path leaves saving disabled but tells the tester to paste code “above,” without telling them that saving remains blocked. The failed poll path likewise stops polling while leaving the pending state in place without an explicit recovery direction.
- **Fix:** Keep the recording save path blocked unless the matching session completes successfully. Direct launch failure, timeout, and failed-session states to close the Record modal and use the separate Manual Map or Suggestion path; do not imply that text in the Record modal can be saved.
- **Evidence:** Static source review only. The full suite reported for this candidate predates this finding; no GUI or real codegen run was performed.

Audit baseline: current dirty tree at commit `e01c5f4`, inspected 2026-10-16; report finalized 2026-10-17. These are source findings unless explicitly labeled otherwise. No real codegen, live server or installed package acceptance ran in this pass. Existing edits are preserved.

## Must fix

1. **A valid upload throws before parsing** (`studio/server.js:345`)
   - **What this is:** The upload handler validates a staged workbook before replacing the active workbook.
   - **Problem:** A standalone `d` inside the try block is evaluated for every valid upload and throws `ReferenceError`; the catch returns a parse error. Source-confirmed, not a live request reproduction.
   - **Fix:** Delete the stray identifier and run an isolated valid/invalid upload through the UI. Syntax checking alone cannot detect this valid JavaScript statement.
   - **If we skip it:** A tester cannot start the core workflow.

2. **Intermediate recording selects a missing development config** (`studio/server.js:207`)
   - **What this is:** Remapping replays earlier steps before opening Inspector.
   - **Problem:** The launcher always selects `<CORE_DIR>/playwright.config.ts` but copies it only when packaged. `core/playwright.config.ts` is absent in this tree.
   - **Fix:** Resolve development versus packaged config consistently and test a real second-step remap in each mode.
   - **If we skip it:** Preceding replay fails before a tester can record the new step.

3. **Replay promises a transfer it cannot produce** (`studio/server.js:575`, `studio/server.js:627`)
   - **What this is:** AutoTest polls `codegen_<id>.js` to import recorded actions.
   - **Problem:** The replay branch starts a headed test and pauses; it never creates that codegen output. The UI still says closing the window transfers the recording.
   - **Fix:** Use the board's genuine Inspector Copy→AutoTest paste/save flow for intermediate recording unless supported automatic export is proved. Test the real transfer, including source boundaries.
   - **If we skip it:** The browser may open successfully while the recording never reaches the mapping.

4. **Recorded input silently loses actions and arguments** (`studio/server.js:880`, `core/action_db.js:18`)
   - **What this is:** Two AST parsers turn code into stored actions.
   - **Problem:** The audit agent's bounded execution of the extracted server parser returned `[]` for `.dblclick()` and `expect(...).not.toBeVisible()`, and dropped the value for `selectOption({label:'Manager'})`. Source shows save accepts the resulting partial/empty list; this probe was not a browser recording test.
   - **Fix:** Reject unsupported semantics for the whole import with a source location; then share one parser and add support needed by the actual workbook.
   - **If we skip it:** A saved mapping may execute less than the tester recorded.

5. **Missing steps can yield passing scenarios** (`core/compiler.js:128`, `core/compiler.js:171`)
   - **What this is:** The compiler resolves each workbook step and emits browser actions.
   - **Problem:** Unresolved/empty mappings are omitted, and the web dispatch has no rejection branch for unknown action types. Navigation plus an unmapped verification can become a passing test.
   - **Fix:** Validate every scenario step and action before writing a runnable spec. Test the compiler directly as well as UI readiness.
   - **If we skip it:** Green results can claim a complete scenario that never executed.

6. **An old cancellation can overwrite a new run** (`studio/server.js:811`, `studio/server.js:1334`)
   - **What this is:** Run callbacks and timers update the current run status.
   - **Problem:** Cancel A schedules unconditional clearing in five seconds; start B during that period and A clears B. A's delayed child-close handler can also update global `activeRun` with A's outcome.
   - **Fix:** Attach each callback/timer to immutable run identity; settle cancellation before releasing owned work. Test A→cancel→B with delayed A close and elapsed timer.
   - **If we skip it:** The dashboard loses or misattributes a run's status/results.

7. **Accepted scenario names break code or share evidence paths** (`core/scenario_parser.js:56`, `core/compiler.js:100`)
   - **What this is:** Workbook IDs become generated test names and evidence folder names.
   - **Problem:** Parser accepts broad nonnumeric IDs; `O'Brien` reaches an unescaped single-quoted title. `PT.1` and `PT-1` both clean to `PT_1` and write the same evidence paths.
   - **Fix:** Quote all generated strings and detect normalized collisions immediately; migrate to stable internal scenario/run IDs with legacy compatibility.
   - **If we skip it:** Some workbooks cannot execute and distinct scenarios overwrite evidence.

8. **Corrupt matrix data silently changes test inputs** (`core/compiler.js:23`)
   - **What this is:** The compiler reads saved data iterations.
   - **Problem:** JSON parse errors are swallowed and replaced with `{}`, allowing spreadsheet defaults/single-run behavior instead of the tester's saved matrix.
   - **Fix:** Report invalid state and preserve the file for recovery. Test malformed JSON alongside explicit blank and missing-key cases.
   - **If we skip it:** Execution can use different data and iteration counts without telling the tester.

9. **The build omits the promised browser resource** (`package.json:20`, `core/helpers.js:16`)
   - **What this is:** Packaging must carry dependencies and browser executables offline.
   - **Problem:** The inspected builder config includes app/node_modules but no `DRIVERS` or `extraResources`; runtime expects `resources/DRIVERS`. A clean machine without a developer browser cache cannot satisfy the bundled-browser promise.
   - **Fix:** Define and inspect the actual resource layout, then record/replay using the installed artifact on each native target. Reconcile bundled-versus-required-stable-Chrome policy explicitly.
   - **If we skip it:** The app works only on prepared developer machines or undocumented browser prerequisites.

10. **The local controller listens beyond loopback** (`studio/server.js:1362`)
    - **What this is:** The desktop shell communicates with a local HTTP server that can change files and launch jobs.
    - **Problem:** `app.listen(port)` specifies no host. The controller can bind available interfaces; CORS is not authentication and does not authorize all write requests.
    - **Fix:** Bind loopback and enforce trusted origin plus per-launch capability on writes, with trusted tooling compatibility. Verify actual hostile-origin/unauthenticated requests, not only response headers.
    - **If we skip it:** Reachable untrusted clients can attempt local control operations outside the intended desktop boundary.

11. **Broad tests share mutable developer data** (`tests/run_all.js:40`)
    - **What this is:** The suite starts Studio and runs route/UI tests.
    - **Problem:** Server startup inherits repo-default state; tests also have hardcoded paths/ports. Upload/restart/library tests can affect working data, and server SIGKILL is not awaited.
    - **Fix:** Audit each test, isolate its files/ports/profiles, wait for owned cleanup, and include omitted replay regression tests. Do not run the complete suite until that audit is complete.
    - **If we skip it:** A maintainer's verification step can damage their project or test the wrong process.

## Should fix

12. **Reported confidence exceeds actual recording/package evidence** (`tests/codegen_launch_test.js:1`, `tests/journey_test.js:4`, `tests/electron_test.js:22`)
    - **What this is:** Tests and historical plans summarize readiness.
    - **Problem:** Launch tests assert arrays, journeys supply handwritten mappings, and Electron tests launch source main.js. `TEST_RESULTS.md:138` even labels a recovery case PASS while admitting its expected Inspector continuation did not occur.
    - **Fix:** Keep those useful lower-level tests with accurate labels. Add real ComputerUse/codegen capture and native installed acceptance, preserving failed/blocked history.
    - **If we skip it:** Maintainers keep releasing the same untested seams.

13. **Evidence waits can consume the whole test budget** (`core/compiler.js:188`, `core/compiler.js:200`)
    - **What this is:** Each step and finalization waits for load states before screenshots.
    - **Problem:** Catching `networkidle` does not bound its wait. A polling target may exhaust the test timeout despite a ready page, and final capture can obscure the primary failure.
    - **Fix:** Use explicit readiness and dedicated short capture limits, preserving the first test error. Exercise persistent traffic and a deliberate assertion failure.
    - **If we skip it:** Otherwise valid workflows time out and produce confusing evidence.

14. **Two app instances share files and profile without ownership** (`electron/main.js:14`, `README.md:78`)
    - **What this is:** Each Electron launch gets a new local port.
    - **Problem:** Different ports still use the same userData and recording profile. Two windows can edit the same JSON or contend for the same browser profile.
    - **Fix:** Use Electron single-instance ownership and enforce one owner for direct-server state directories. Test two launches and crash recovery.
    - **If we skip it:** Double-launching the app can cause lost edits and inconsistent recording behavior.

15. **Three action pipelines multiply fixes** (`studio/server.js:880`, `studio/server.js:1236`, `core/action_db.js:18`, `core/compiler.js:171`)
    - **What this is:** Recorded import, library import, preview, replay and compile each interpret/render actions.
    - **Problem:** Similar inputs already behave differently, and a supported action must be added in multiple places. A folder split alone would preserve that disagreement.
    - **Fix:** Extract one strict parser, one scenario resolver and one web renderer after targeted behavior tests; grouped files by ownership, not one file per function.
    - **If we skip it:** Future recording features repeatedly regress another execution path.

16. **Current plans contradict the implementation and each other** (`BRAIN/Next Direction.md`, `BRAIN/Figma Plan.md`, `BRAIN/Server-Split.md`, `AGENTS.md`)
    - **What this is:** These documents guide human and AI maintenance.
    - **Problem:** They disagree on CDP versus CLI recording, Electron completion, ActionDB relocation, AI priority and agent invocation. A new agent can follow a confident but stale instruction.
    - **Fix:** Add dated precedence/reconciliation and verified lessons, with detailed plan in BRAIN and a concise blueprint summary. Preserve history with explicit status.
    - **If we skip it:** Agents repeat already disproved approaches and spend effort on the wrong milestone.

Verdict: Fix upload and the real record→transfer→save→full replay chain first; validate data, lifecycle and packaging before calling the desktop MVP accepted.

Lean: duplicated action pipelines and never-assigned `globalBrowser` are candidates; no line/dependency saving is claimed without a measured diff and full removal check. No new framework or runtime dependency is required by this plan.

Not checked: live codegen/Inspector gestures, actual target application, installed macOS/Windows artifacts, signing/IT policy, workload limits, dependency vulnerability advisories, mobile devices and real AI provider calls. Secondary fixtures/tests were inspected selectively; the audit is not a claim of exhaustive execution.

## Test isolation follow-up — 2026-10-17

Static review found that `tests/state_dir_test.js` inherited developer LLM settings into direct child processes. `testEnv()` now forces blank LLM settings and isolated web/profile values, strips the named provider API keys, and no longer accepts arbitrary inherited state roots. The reviewer confirmed the final diff; the coordinator reports the synthetic-credential regression was RED before the fix and the focused state-dir suite is GREEN afterward. No additional test-isolation blocker was found in the final assigned diff review. This does not establish headed real-Chrome/codegen acceptance.

## Runtime baseline addition — 2026-10-17: stale captured source

**Recording acceptance blocker.** In the isolated full-workbook native baseline, AutoTest displayed `await page.goto('about:blank');` with its captured-success banner, while the completed session file contained the real OrangeHRM navigation and incidental native keyboard actions. Do not accept or save the stale modal code. Investigate final-output synchronization; no implementation root cause is asserted from this observation alone. Reproduce and verify exact source delivery after recorder exit, plus a late-write/session-replacement regression. Native Inspector Copy → AutoTest Paste and complete workbook replay remain separate required gates. Literal evidence: TEST_RESULTS.md, final 2026-10-17 ComputerUse baseline.

## Final codegen delivery review — 2026-10-17

**Pending fix — completed code can be discarded by textarea focus** (`studio/studio-ui.html:522`, `studio/studio-ui.html:1241`)

- **Severity:** High; loses the new recording from AutoTest's primary delivery path.
- **Trigger:** Focus the record textarea during codegen without changing its contents, then close the recorder successfully.
- **Problem:** The focus handler sets `isUserInteracting = true`. When the final result arrives, the poll stops before inserting it because the flag is set (and the textarea remains focused). The warning suggests copying from Inspector even though the recorder has already closed. The server still retains the result, but the UI has no way to retrieve it after stopping the poll.
- **Fix:** Preserve the final capture when the user only focused the field; protect actual text edits, and ensure any intentionally withheld capture remains retrievable in the modal.
- **Evidence:** Static source review only. No GUI or real codegen run was performed in this review.

**Pending fix — delayed Manual preview can overwrite newer text or modal state** (`studio/studio-ui.html:1320`, `studio/studio-ui.html:1340`)

- **Severity:** Medium; can replace tester-entered code or another modal's contents with stale mapping text.
- **Trigger:** Open Manual Map, type before `/preview/:label` responds, or open a different modal before that response arrives.
- **Problem:** `openManualModal` advances `recordModalOperation`, but its asynchronous preview callback does not capture/check that operation or whether the text changed before assigning `codeArea.value`. The neighboring Record modal preview already checks the operation token and `isUserInteracting`.
- **Fix:** Apply the same operation ownership and edit-preservation guard to the Manual preview callback.
- **Evidence:** Static source review only. No GUI or runtime claim is made.

## Live codegen frozen-candidate review — 2026-10-21

The earlier source-review concern that a valid import-only file prefix could be displayed as provisional action code is fixed in the frozen candidate. `/codegen-result` now accepts provisional snapshots only when Acorn finds a nonempty Playwright `test` callback with a destructured `page` parameter; `tests/codegen_result_test.js` confirms an import-only prefix preserves the prior preview/version and a subsequent valid callback advances it. Final static rereview found no remaining blocker in the assigned codegen polling, modal, save gating, or failure paths. The coordinator reports the full 23-test suite exited 0. This is source and reported automated-test evidence only; no GUI, headed native codegen, installed-package, or workbook replay acceptance was performed in this review.
