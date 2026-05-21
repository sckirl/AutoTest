# Changes Log (`codex` branch)

## Branch operations
- Created and switched to branch: `codex`
- Deleted local branch: `Optimization`

## Added files
- `.gitignore`
- `internal_sit.js`

## Modified files
- `studio/server.js`
- `studio/studio-ui.html`
- `core/compiler.js`
- `playwright.config.ts`
- `run_tests.command`
- `defect.md`

## Deleted files (deprecated pipeline cleanup)
- `actions.json`
- `generated.spec.ts`
- `library.ts`
- `mappings.json`
- `mappings.ts`
- `playwright_actions.ts`
- `producer.js`
- `producer.ts`
- `runner.py`
- `studio.js`

## Functional changes implemented
- Added git ignore rules for dependencies, runtime artifacts, logs, temp files, and env files.
- Added Studio UI execution controls:
  - `Fully Parallel` toggle
  - `Workers` numeric input
  - `Paste Clipboard` helper for mapping capture
- Updated `/run` backend endpoint to accept execution settings and pass them to Playwright UI run.
- Added runtime env wiring for parallel behavior:
  - `AUTOTEST_FULLY_PARALLEL`
  - `AUTOTEST_WORKERS`
- Added parser support for recorded verification actions:
  - `verifyVisible`
  - `verifyText`
- Updated compiler to emit assertion code for visibility and text verification mappings.
- Updated Playwright config to read worker/parallel mode from runtime env.
- Fixed CLI script to use current Studio/Core pipeline (removed broken producer reference).
- Made `/run` non-blocking and added live status tracking endpoint (`/run-status`).
- Added recording concurrency guard to prevent multiple replay browsers at once.
- Made restart non-destructive by default (`clearMappings=false`).
- Added robust mapping save validation and user-visible save failure feedback.
- Added mapping preview API/UI (`/mapping/:label`) for audit without replay.
- Added manual mapping path in UI (no forced replay).
- Persisted base URL in browser storage.
- Expanded recorded code parser for additional action/assertion patterns and chained locators.
- Added configurable server port via `PORT` env for local testability.

## Validation performed
- Syntax check passed:
  - `studio/server.js`
  - `core/compiler.js`
  - `core/scenario_parser.js`
- Internal SIT endpoint validation passed via `internal_sit.js`:
  - Passed `6/6` checks (run status, validation errors, restart behavior, async run acceptance, mapping API).

## Recent Change Set (Trace + Visual Step Fix)
- Problem addressed:
  - Playwright UI runs could appear "white"/non-informative when mappings were missing.
  - Results needed explicit visual step cues and per-scenario trace artifacts.
- Changes made:
  - `core/compiler.js`
    - Added mandatory mapping completeness gate: compile fails if any `Mapping_Key` is missing.
    - Added visual step highlighter helpers (`markLocator`/`unmarkLocator`) that draw a red outline before interaction/assertion.
    - Added per-action pre-shot marker files (`STEP_<i>_ACT_<j>_MARK.png`) plus step screenshots.
    - Added explicit per-scenario trace recording:
      - `tracing.start({ screenshots: true, snapshots: true, sources: true })`
      - `tracing.stop({ path: results/<SCENARIO>/trace.zip })` in `finally` block.
  - `playwright.config.ts`
    - Disabled duplicate config-level tracing (`trace: 'off'`) because trace is now explicitly controlled per scenario in compiled spec.
  - `core/mappings.json`
    - Restored comprehensive OrangeHRM baseline mappings used by current scenario matrix.

## SIT Evidence for Recent Change Set
- `node -c core/compiler.js` passed.
- `node core/compiler.js` passed and regenerated `core/executed.spec.ts`.
- Static verification on generated spec confirmed:
  - Presence of `markLocator` / `unmarkLocator`.
  - Presence of `tracing.start` and `tracing.stop` per scenario.
  - Presence of per-step marker screenshot emission pattern (`*_MARK.png`).
- `internal_sit.js` re-run passed `6/6` checks after recent changes.
- Note:
  - In this environment, full end-to-end Playwright browser execution against live target was not run in this step; endpoint and compile-level SIT passed.

## New External QA Defect Sweep (Security + Pipeline)
- Files changed:
  - `studio/server.js`
  - `studio/studio-ui.html`
  - `core/compiler.js`
  - `core/scenario_parser.js`
  - `.gitignore`
  - `run_tests.command`
  - `defect.md`
- Key fixes:
  - RCE hardening in replay generation (URL validation + safe JS string generation + `spawn` execution).
  - XSS hardening in step list rendering (DOM API + `textContent`, no unsafe label interpolation).
  - Safe compiler quoting for dynamic values/targets; removed site-specific YouTube logic.
  - Parser now rejects invalid Excel structure with explicit errors and no cross-scenario data inheritance.
  - Upload isolation now uses timestamped filenames with pointer tracking (no hard overwrite target).
  - Added mapping delete API + UI delete button and manual code pre-validation before save.
  - Expanded `.gitignore` for generated/runtime files.
  - Updated CLI runner to use current upload naming pattern.

## SIT (Post-Patch)
- `node -c studio/server.js` passed
- `node -c core/compiler.js` passed
- `node -c core/scenario_parser.js` passed
- `bash -n run_tests.command` passed
- `node core/compiler.js` passed
- `node internal_sit.js` passed `6/6`

## Cleanup Validation (Intentional File Deletions)
- Restored `internal_sit.js` to preserve reproducible SIT evidence for QA audit.
- Updated stale fixture reference in `core/studio_audit.spec.ts`:
  - from `scenario_pukat.xlsx` to `scenario_uploaded.xlsx`.
- Updated upload helper text in `studio/studio-ui.html`:
  - from `scenario.xlsx` to generic `.xlsx`.
- Verification:
  - `node internal_sit.js` passed `6/6`.
  - Static reference sweep found no remaining `scenario_pukat.xlsx` or `scenario.xlsx` dependencies in active `core/` and `studio/` sources.

## Notes for QA
- Pre-existing working tree deletions/untracked artifacts were already present before this work started.
- This log lists changes made during this Codex session on branch `codex`.

## Reset Behavior Update
- Updated Studio UX to make `Reset All (Wipe All)` truly destructive for the active uploaded project session.
- UI now sends `clearMappings: true` to `/restart`, so mappings are wiped along with results.
- Updated confirmation text to explicitly warn users that both mappings and results will be removed.

## Requirement Update: Default Auto-Recording After Replay
- Added requirement implementation: when user clicks `Record`, replay runs first and auto-recording is enabled by default once replay finishes.
- Backend changes in `studio/server.js`:
  - Added `GET /recording-latest` endpoint to expose captured auto-recorded lines.
  - Replay script now injects action listeners (click/change) after replay and before `page.pause()`, emitting generated Playwright lines with `AUTOTEST_REC:` prefix.
  - Server captures emitted lines and stores them in a rolling buffer for UI consumption.
- Frontend changes in `studio/studio-ui.html`:
  - Updated modal instructions to state auto-record behavior.
  - On successful `/record`, UI starts polling `/recording-latest` and auto-fills textarea with captured actions.

## SIT for Auto-Recording Change
- `node -c studio/server.js` passed.
- Static verification passed for:
  - `/recording-latest` route
  - Replay log marker: `AUTO-RECORDING IS ACTIVE`
  - UI polling hook: `startAutoRecordPolling()`
- `node internal_sit.js` passed `6/6` endpoint checks after this change.

## QA Round 3 Defect Closure
- Fixed DEF-021: Added assertion parsing for `expect(page....).toBeVisible/toContainText/toHaveText` in backend parser.
- Fixed DEF-022: Added strict `safeGetBy` validation and blocked unsafe expression injection paths.
- Fixed DEF-023: Added run concurrency guard (`activeRun`) and `POST /run-cancel`.
- Fixed DEF-025: Removed post-click unmark to avoid detached-element race after navigation clicks.
- Fixed DEF-029: Partial execution enabled (run button now activates when at least one action is mapped).
- Fixed DEF-030: Visual differentiation added for `Record` vs `Re-Map` buttons.
- Fixed DEF-031: Auto-recorder now supports assertion capture shortcuts (`Alt+Click` visible, `Shift+Click` contains-text).

## SIT Evidence (Round 3)
- `node -c studio/server.js` passed.
- `node -c core/compiler.js` passed.
- `node internal_sit.js` passed `6/6` after fixes.
- Static verification confirms:
  - `/run-cancel` endpoint exists
  - `activeRun` guard exists on `/run`
  - `extractExpectLocator` integrated in parser
  - UI partial-run gate enabled via `mappedCount` logic
