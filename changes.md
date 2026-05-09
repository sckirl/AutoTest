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

## Notes for QA
- Pre-existing working tree deletions/untracked artifacts were already present before this work started.
- This log lists changes made during this Codex session on branch `codex`.
