# Architecture

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

Air-gapped, zero-install Playwright automation. Vanilla UI, no build step, bundled deps.

## Components

| Component | File | Owns | Must not own |
|---|---|---|---|
| Electron shell | `electron/main.js` | Fork server (cwd=userData), `AUTOTEST_*` env, `STUDIO_PORT=` parse → window, kill child on quit | Business state |
| Studio UI | `studio/studio-ui.html` | 5 tabs, modals, fetch calls, status, dashboard | Canonical DB logic; no local fake records |
| Express server | `studio/server.js` | 31 routes, validation, orchestration (**1391 lines — see [[Server-Split]] plan**) | Guessing paths the server already knows (EX-01 lesson) |
| ActionDB | `core/action_db.js` | read/save/delete actions+groups, synonyms, `resolveSteps`, `extractVariables` | Hard-coded writable path — uses `AUTOTEST_STATE_DIR` (`action_db.js:9-10`), AL-03 fixed in code |
| Parser | `core/scenario_parser.js` | First-sheet Excel → `blueprint.json` + `blueprint_warnings.json` (dup `_dupN`, merged-cell, dup-label warns) | Mapping/execution semantics |
| Compiler | `core/compiler.js` | blueprint + mappings + ActionDB + runtime data → `executed.spec.ts` (web) / `executed.mobile.js` (node-direct) | UI state, result-link construction |
| Runner | Playwright CLI / node | Executes spec, emits `report.json` + evidence | Library definitions |
| Shared pure fns | `core/helpers.js` | `isSafeChain, interpolate, q, tokenizeLiterals, sweepOrphans, safeSessionId, normalizePlatform, buildCodegenArgs/Env` | Route logic |
| LLM (optional) | `core/llm.js` + `core/prompt.js` | OpenAI-compatible suggest; disabled without key, max 3 attempts | Required-path dependency — suggest is never on the critical path |

## Writable state roots (packaged = read-only `app.asar`)

| Env | Default (dev) | Holds |
|---|---|---|
| `AUTOTEST_STATE_DIR` | `core/` | `blueprint.json`, `blueprint_warnings.json`, `mappings.json`, `action_database.json`, `runtime_data.json`, `platform_state.json`, transient specs, `autotest/` Chrome profile |
| `AUTOTEST_DATA_DIR` | repo root | `scenario_uploaded.xlsx`, multer staging `scenario_upload_staging_*.xlsx` |
| `AUTOTEST_RESULTS_DIR` | `DATA_DIR/results` | Per-scenario evidence + `report.json` + `test-results/` |

**Single-source rules:** one ActionDB path resolver (`DB_DIR`); UI and compiler read the same
file. All stores restored on boot (blueprint rebuilt from uploaded Excel; mappings file ensured).

## Request flows (route inventory — 31)

- Intake: `GET /`, `POST /upload`, `GET /scan`, `POST /save-expected-result`, `GET/POST /data-matrix`, `GET /env`, `POST /set-platform`
- Mapping: `POST /record`, `GET /codegen-result/:id`, `POST /record-cancel`, `POST /save-mapping`, `GET /mapping/:label`, `GET /preview/:label`, `GET /preview-scenario/:id`
- Library: `GET /action-db`, `POST /action-db/action`, `DELETE /action-db/action/:id`, `POST /action-db/group`, `DELETE /action-db/group/:id`, `POST /link-synonym`
- Suggest: `GET /suggest/status`, `POST /suggest|/reject|/accept|/cancel`
- Run: `POST /run`, `GET /run-status`, `POST /run-cancel`, `POST /restart`, `GET /results` (HTML index) + `/results` static

Cross-route mutexes (breakage risk — see [[Server-Split]] §3): `activeCodegen` (record/suggest
409s), `activeRun` + `activeRunner` (run 409, cancel kills runner only), `activeSuggestion`.

## Trust boundaries

Excel, pasted Playwright, LLM output, labels, data values = untrusted. Acorn +
`isSafeChain` are load-bearing. Uploads 5MB, `.xlsx` only. `setInputFiles` rejected loudly.
`.env` never committed. Default record profile is isolated `autotest/`; normal Chrome
untouched (`AUTOTEST_CDP_PROFILE=real` is dev-only opt-out, no reset/delete UI).

See [[Security & Compiler]] (codegen), [[Zero-Trust Data Lifecycle]] (stores),
[[Server-Split]] (file plan), [[Omnichannel Orchestration]] (platforms).
