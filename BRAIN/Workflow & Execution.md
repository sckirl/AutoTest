# Workflow & Execution

CONFIDENCE: AMBIGUOUS
RELATIONS:
- depends_on::[[Engineering Plan]]
- derived_from::[[Plan Reconciliation]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: Historical architecture and current runtime evidence may diverge; preserve both with explicit dates.

### KEY FINDINGS:
- This retained context predates the current plan; its detailed claims below are historical until revalidated.
- Current ownership, priorities and acceptance criteria are in Engineering Plan and Plan Reconciliation.

### PRIMARY SOURCES:
- [Playwright codegen](https://playwright.dev/docs/codegen) — VERIFIED accessible 2026-10-16; recording workflow reference only, not verification of every historical claim below.
- Local source/document anchors remain in the retained body below. Unrevalidated historical claims are AMBIGUOUS.

### SIGNIFICANCE:
Preserves prior reasoning without allowing stale checkmarks to certify current behavior.

### GAPS/CONSTRAINTS IDENTIFIED:
Historical implementation and verification statements require current-code and runtime checks before use.

> **Current plan amendment — 2026-10-17:** Read [[Engineering Plan]], [[Module Contracts]], [[Recording Acceptance]] and [[Plan Reconciliation]] first. This document preserves earlier context/inventories; its priorities and verification claims are historical unless independently revalidated. Manual real-codegen → complete replay is the MVP.

The 5-tab loop. Verified against `studio-ui.html` + FigJam `0:3` alignment pass (2026-10-07:
5 red gates marked, 6 blue CORRECT boxes).

## 1. Studio — Upload

`handleFile()` → `confirm("Keep existing Playwright mappings?")` → `POST /upload` (multer,
5MB, `.xlsx` only, per-request staging file). Server runs `scenario_parser.js` via execFileSync
(no shell), renames to `scenario_uploaded.xlsx` only after parse succeeds, wipes
`runtime_data.json`, wipes mappings unless kept. Warnings (`_dupN` rename, merged-cell skip,
dup label) surface in `#status-box`. Then `scanSteps()` + switch to Mappings.

## 2. Mappings — Scan + row actions (all buttons visible at once, NOT sequential)

`scanSteps()` = `GET /scan` + `GET /action-db`. Scan resolves each label from mappings then
`ActionDB.resolveSteps`. Scenario headers carry **Preview Scenario**; rows carry:

| Control | Shown when | Calls |
|---|---|---|
| Expected Result (editable) | always | `POST /save-expected-result` on change |
| Record / Re-Map | always | `openRecordModal` → `POST /record` |
| Manual | always | modal → `POST /save-mapping` (Acorn + `tokenizeLiterals`) |
| Suggest | missing + LLM enabled + <3 attempts | `POST /suggest` family |
| Link dropdown | missing + library non-empty | `POST /link-synonym` (syncs synonyms + mappings cache) |
| Drag-drop row target | always | same `linkStepToLibrary()` as dropdown |
| Preview | mapped | `GET /preview/:label` |

`runBtn` stays disabled until ≥1 mapped step. Library sidebar (`renderSidebar`) shows
mini drag cards on this tab.

**Record flow:** 409 if codegen busy or run active → platform allowlist (mobile → 400,
manual-only) → replay predecessors (Library-resolved included) into `replay_<id>.spec.ts`,
headed + `page.pause()` → else visible codegen → UI polls `GET /codegen-result/:id`
(single-read delete) → save via `/save-mapping`. `POST /record-cancel` kills codegen only.

**Suggest flow (optional):** sequential `Map next first` 409 → CDP replay predecessors →
≤3 generate→execute→rewind attempts → Accept (persist) / Reject (retry) / Cancel.
Disabled without `LLM_BASE_URL/KEY/MODEL`.

## 3. Action Library — canonical store

`loadActionLibrary()` renders cards (Edit/Delete) + group chains. Create/edit modal →
`POST /action-db/action|/group`; delete confirms → `DELETE …/:id` (action delete detaches
group refs). Link path (§2) writes synonym + mappings cache. Scan/preview/replay/compiler
all resolve through the same `resolveSteps`.

## 4. Data Matrix — iterations

`GET/POST /data-matrix` ↔ `runtime_data.json`. Empty object clears. Strict shape validation.
Variables harvested from resolved steps. UI gates Execute save: abort only if save fails.
Semantics live in [[Data-Driven Parameterization]].

## 5. Execution — run + evidence

`runBtn` → save matrix → `POST /run {workers, headless, platform}` (`workers||2`,
`--headed` unless headless, `--workers N`, `--reporter=json`). 409 if run active or
recording live. Parser → compiler → spawn runner; mobile runs `executed.mobile.js` via node
(webdriverio must resolve). Poll `GET /run-status` (idle/compiling/running/completed/failed/
cancelled); `POST /run-cancel` kills runner only. Evidence per scenario/iteration:
`STEP_N.png`, `FINAL.png`, `trace.zip` (or `TRACE_WITHHELD.txt` on password/secret/token/pin).
Dashboard links + `GET /results` index serve from `AUTOTEST_RESULTS_DIR`.
`POST /restart` wipes mappings/upload/runtime/results.

## Clean-state enforcement

No uploaded Excel at boot → mappings reset to `{}` (no ghosts). Transient specs/codegen
swept at startup (`[CORE_DIR, DATA_DIR].flatMap(sweepOrphans)`), replay spec deleted after
use, all gitignored. See [[Zero-Trust Data Lifecycle]].
