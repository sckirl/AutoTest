# Implementation Plan: Restore Visible Playwright Codegen Recording

## Overview
Replace the broken CDP `_enableRecorder()` recording path with the previously working Playwright Codegen CLI path. Clicking Record/Re-Map will open a visible Playwright Codegen window/terminal, use the isolated stable-Chrome profile `autotest`, write generated code to the existing `codegen_<sessionId>.js` output path, and let the AutoTest modal poll and display the code for review/editing before `Sync & Save Action`. The secure AST parser and mapping persistence remain unchanged.

## Architecture Decisions
- **Visible Codegen is the recording mechanism:** use Playwright's supported `codegen` CLI instead of the unstable `context._enableRecorder()` CDP API that currently returns `ENABLE_RECORDER_FAILED`.
- **Keep isolation:** Codegen receives the same AutoTest-owned `autotest` profile directory under `AUTOTEST_STATE_DIR`; normal Chrome remains untouched. The existing `AUTOTEST_CHROME_PATH`/`.env` contract remains available for the isolated Chrome launch path, while the Codegen browser uses the bundled Playwright Chromium unless the supported CLI channel/path contract provides otherwise.
- **Keep the current UI contract:** `/record` returns `sessionId`; the UI continues polling `/codegen-result/:sessionId`, extracts the generated body, and places it in the modal textarea. Update copy to explicitly say the visible Playwright Codegen window is the source and the modal is where the analyst reviews/edits/saves.
- **Preserve replay-before-record behavior:** for mapped preceding steps, restore a temporary replay spec with `page.pause()` and run it headed through the Playwright CLI; for a first/missing step, launch `playwright codegen` directly. Both paths use the isolated profile and clean temporary files on close/cancel.
- **Cross-platform child launch:** use the same resolved Node/Electron child-launch contract already needed by packaged execution: direct Node in development, Electron-as-Node semantics in packaged mode, `windowsHide: false`, and no shell-dependent `node` lookup.

## Task List

### Phase 1: Prove the supported recording command
- [ ] **Task 1: Add command/response regression coverage**
  - **Description:** Add focused test coverage for the Codegen launch contract: `/record` must create an active session and return a session ID; the launch arguments must include the Codegen command, output path, headed visibility, and isolated `--user-data-dir` path. Use a controlled/stubbed launcher or a real stable bundled browser where available so the test does not touch the user's normal profile.
  - **Acceptance criteria:**
    - [ ] Test fails against the current CDP-only implementation because no Codegen child is launched.
    - [ ] Test can assert the generated output path is session-scoped and confined to `CORE_DIR`.
    - [ ] Test never uses the user's normal Chrome profile.
  - **Verification:** Focused test RED before implementation, GREEN after implementation.
  - **Dependencies:** None.
  - **Files likely touched:** `tests/codegen_record_test.js`, `tests/run_all.js`, a small testable launcher helper if extraction is necessary.
  - **Estimated scope:** Medium: 2–4 files.

### Phase 2: Restore the visible recorder
- [ ] **Task 2: Restore plain-step Playwright Codegen launch**
  - **Description:** Replace the plain CDP `startCodegenRecording()` branch with a visible Playwright CLI child using `codegen`, the target URL, `--output`, the isolated `autotest` profile, bundled browser environment, and cross-platform child-process handling.
  - **Acceptance criteria:**
    - [ ] Clicking Record on an unmapped first step opens a visible Playwright Codegen window.
    - [ ] Generated code is written to `codegen_<sessionId>.js` and becomes available through `/codegen-result/:sessionId`.
    - [ ] The AutoTest modal can display, edit, and save the generated code.
    - [ ] Normal Chrome is not used.
  - **Verification:** Focused RED→GREEN test, live direct-server browser pass, console/network inspection.
  - **Dependencies:** Task 1.
  - **Files likely touched:** `studio/server.js`, `tests/codegen_record_test.js`.
  - **Estimated scope:** Medium: 2–4 files.

- [ ] **Task 3: Restore replay-before-record Codegen launch**
  - **Description:** Reintroduce the minimal temporary headed replay spec for steps with mapped predecessors, execute it with the Playwright CLI and `page.pause()`, and ensure the same isolated profile/output/cancellation contract is used. Keep the existing secure interpolation and locator validation; do not revive the old unsafe parser logic.
  - **Acceptance criteria:**
    - [ ] Re-Map on an intermediate step launches the visible headed Playwright window after preceding mapped actions.
    - [ ] The analyst can inspect/modify generated code in the visible Codegen/Inspector UI and then save it through AutoTest.
    - [ ] `replay_<sessionId>.spec.ts` is cleaned up on child close/cancel.
    - [ ] Concurrent `/record` and `/run` guards remain intact.
  - **Verification:** Focused replay test plus manual real-browser pass; black-box tester reruns the affected scope.
  - **Dependencies:** Task 2.
  - **Files likely touched:** `studio/server.js`, `tests/record_replay_sit.js` or a new focused test.
  - **Estimated scope:** Medium: 2–4 files.

### Checkpoint: Visible recorder
- [ ] Focused Codegen tests pass.
- [ ] `npm test` exits 0.
- [ ] Direct server Record visibly opens Playwright Codegen.
- [ ] Code appears in the AutoTest modal after the analyst closes/stops Codegen.
- [ ] Normal Chrome remains untouched.

### Phase 3: UI and packaged validation
- [ ] **Task 4: Correct recording guidance and failure reporting**
  - **Description:** Replace the current CDP/automatic-transfer copy with explicit visible-Codegen instructions: interact in the Playwright window, inspect/modify code there, then close/stop it so AutoTest imports the output into the modal. Surface child spawn/exit failures immediately instead of leaving an empty polling modal.
  - **Acceptance criteria:**
    - [ ] The banner no longer claims Codegen is inside the isolated Chrome modal if a separate window is used.
    - [ ] A failed child launch gives a concrete message including the launch failure class.
    - [ ] Timeout/cancel clears polling and does not leave a stale active recording guard.
  - **Verification:** Browser DevTools DOM/console/network inspection and focused UI test.
  - **Dependencies:** Tasks 2–3.
  - **Files likely touched:** `studio/studio-ui.html`, `studio/server.js`, UI test.
  - **Estimated scope:** Small: 2–3 files.

- [ ] **Task 5: Validate packaged Electron Codegen**
  - **Description:** Build and launch the unpacked Electron app directly, then verify Record opens a visible Playwright window and generated code returns to the modal using the isolated profile. Confirm the packaged child launch works on macOS and document the Windows build/runtime check.
  - **Acceptance criteria:**
    - [ ] `npm run pack` succeeds.
    - [ ] Direct packaged launch starts the Studio UI.
    - [ ] Packaged Record launches visible Codegen without `ENOTDIR`, `ENABLE_RECORDER_FAILED`, or `Cannot find module` errors.
    - [ ] Generated code reaches `/codegen-result` and the modal.
  - **Verification:** Real unpacked Electron run, browser DevTools where applicable, black-box tester scope.
  - **Dependencies:** Tasks 2–4.
  - **Files likely touched:** `tests/electron_test.js`, `TEST_RESULTS.md`, documentation only for verified prerequisites.
  - **Estimated scope:** Medium: 3–5 files/tools.

### Checkpoint: Complete
- [ ] Visible Codegen works for Record and Re-Map.
- [ ] Analysts can inspect/modify generated code before saving.
- [ ] Focused and full suites pass.
- [ ] Packaged macOS validation passes; Windows validation command/prerequisite is documented.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Playwright Codegen CLI child launch differs between Node and Electron | High | Reuse the existing packaged child-runtime resolver and test direct + packaged launch separately. |
| Replay spec runs in the wrong working directory inside `app.asar` | High | Use absolute app-resource script paths and a writable state cwd; never chdir into `app.asar`. |
| Child exit before output leaves an empty modal | Medium | Add child `error`/`close` handling and a bounded UI poll timeout with a concrete status. |
| Isolated profile differs from Playwright's default browser profile behavior | Medium | Pass explicit `--user-data-dir=<stateDir>/autotest` and assert it in the launch contract test. |
| Reintroducing replay logic regresses security | High | Reuse current `isSafeChain`, `interpolate`, and `q`; do not restore the historical ad-hoc parser/blocklist. |

## Open Questions
- None for this slice. The requested behavior is visible Playwright Codegen, isolated `autotest` profile, analyst review/edit before save, and no return to the broken CDP recorder.
