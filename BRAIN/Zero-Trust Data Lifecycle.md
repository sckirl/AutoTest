# Zero-Trust Data Lifecycle

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

Flat `fs`-JSON stores. No DB, no ORM. Every store has one writer path, one reader set, one wipe hook.

## Stores

| File | Writer | Readers | Wipe hook |
|---|---|---|---|
| `scenario_uploaded.xlsx` | `POST /upload` (rename after parse OK) | parser, `/scan`, `/run` | `/restart` deletes |
| `blueprint.json` + `blueprint_warnings.json` | `scenario_parser.js` (child process) | scan, suggest ctx, compiler, previews | rebuilt on boot + every upload/run |
| `mappings.json` | `/save-mapping`, `/link-synonym` sync, `/suggest/accept` | scan, preview, replay, compiler | `{}` reset when no Excel at boot; `/restart`; upload unless keepMappings |
| `action_database.json` | `core/action_db.js` (upserts, corrupt→`.corrupt-*` backup) | routes, scan, preview, replay, compiler | never auto-wiped (canonical library survives uploads) |
| `runtime_data.json` | `POST /data-matrix` | compiler, suggest iterData, replay iterData | **deleted on BOTH `/upload` and `/restart`** (invariant — missing either = ghost-data contamination) |
| `platform_state.json` | `POST /set-platform` | boot restore, `GET /env` | never auto-wiped |
| transient specs/codegen | compiler, record, replay | runner, UI poll | startup sweep `[CORE_DIR, DATA_DIR].flatMap(sweepOrphans)`; replay unlinked on close; codegen file single-read-delete |
| results/ | runner | dashboard, `/results` index | `/restart` rm+mkdir |

## Rules

1. All writable paths derive from `AUTOTEST_STATE_DIR / _DATA_DIR / _RESULTS_DIR` — never `__dirname`-relative (AL-03 lesson; `action_db.js:9-10` already relocated).
2. Upload is atomic: parse-then-rename. Failed parse → staging deleted, active workbook untouched, 400 with parser's real message (via `blueprint_warnings.json`, not "Command failed").
3. `mappings.json` ensured `{}` if missing on `/scan` and boot; corrupt ActionDB → backup + fresh (covered by `action_db_corruption_test.js`).
4. Report hygiene: `/run` unlinks stale `report.json` + `compile_error.json` before starting; 60s `activeRun` retention only clears if no newer run replaced it (`thisRun` guard).
5. Session IDs validated by `safeSessionId` (digits only) + `startsWith(CORE_DIR)` containment before read/delete (path-traversal tests green).
