# 🧭 Next Direction — Agent Briefing

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

> **READ THIS FIRST.** Verified against master as of 2026-10-07. Source docs: [blueprint.html](../blueprint.html) (PRD),
> [FigJam board](https://www.figma.com/board/9KC30qRJbzAjk9VZihuDtS/AutoTest-Blueprint?node-id=0-1&t=KeNd93qMgT498YHq-1) (4 flows + red/blue marks),
> [AGENTS.md](../AGENTS.md) (invariants + black-box loop).

## 1. What this is (30s)

Zero-install, air-gapped Playwright engine for locked-down QA: Excel UAT → record/map →
Data Matrix → execute → evidence. No `npx`, no internet; Node modules + Chromium bundled.

## 2. Verified state

| Area | Status |
|---|---|
| Upload → scan → map → run → evidence | ✅ Working (web) |
| Record (visible codegen) + replay predecessors (Library-resolved incl.) | ✅ Working; `tests/replay_mapping_test.js` |
| Shared-literal tokenization | ✅ Working; `tests/tokenize_literal_test.js` |
| Strict interpolation (blank deliberate, absent throws) | ✅ Working; `tests/interpolate_strict_test.js` |
| ActionDB on `AUTOTEST_STATE_DIR`, corrupt-backup | ✅ Fixed in code |
| Platform persistence, helpers shared, browser cached, orphans swept | ✅ Fixed in code |
| Suggest (optional LLM, 3 attempts, sequential-map 409) | ✅ Code-complete, needs key |
| Mobile compile path | ⚠️ Code only, never ran on device (out of black-box scope) |
| AL-01–AL-04 / EX-01 (blueprint §3) | ❌ Need packaged gesture→restart proof — **the** acceptance gap |
| `server.js` | ⚠️ 1391 lines / 31 routes — see [[Server-Split]] plan (not executed) |

## 3. Task list (ordered)

### P0 — Acceptance (before any refactor)
Reproduce AL-01–AL-04 + EX-01 against the **packaged** app with literal request/response +
restart proof per `blueprint.html` §12 (gesture → request → validation → write → restart →
consume → package). Record expected/actual per blocker (blueprint §11 phase 0). Whatever fails
here reorders everything below.

### P1 — [[Server-Split]] slices 1–6
Pure moves, zero logic changes; route list diff must be identical (31). Per-slice verify:
`node --check`, `npm test`, touched TEST_SCENARIOS rows via black-box loop, single-commit
revertable. Slice 1 (paths+process) → 2 (browser) → 3 (parse) → 4 (library+intake) →
5 (map-record) → 6 (suggest+run+thin bootstrap). CHANGE-LOG per slice (§2.1).

### P2 — Ponytail cuts (only after P1)
`globalBrowser` delete → browser-resolver dedup → launch-fn merge → renderer share →
`/results` escaping. Each with regression test; `webdriverio` stays (product decision).

### P3 — Distribution gates (blueprint §11 phases 4–5)
Full Excel→evidence loop in packaged app; Windows NSIS + macOS DMG smoke on native builders;
unsigned/SmartScreen caveats documented. Optional Phase B/C (CDP-profile UI, LLM) only after.

## 4. System diagram

```
Excel → POST /upload → parser → blueprint.json ─┐
Mappings (record/manual/link/suggest) → mappings.json + action_database.json ─┤
Data Matrix → runtime_data.json ───────────────────────────────────────────────┤
                                    compiler → spec → runner → results/ + report.json
Electron: fork server (cwd=userData, AUTOTEST_*=userData, PORT=0) → STUDIO_PORT= → window
```

Key files: `studio/server.js` (routes) · `core/compiler.js` (emit) · `core/scenario_parser.js`
(parse) · `core/action_db.js` (library) · `core/helpers.js` (shared) · `studio/studio-ui.html`
(5 tabs) · `electron/main.js` (shell) · `playwright.config.ts` (env-tracking config).

## 5. Invariants (never break)

1. `{var}` never `${var}`. 2. `isSafeChain` on every locator. 3. Wipe `runtime_data.json` on
   **both** upload + restart. 4. `waitForTimeout(1000)` before load-state waits. 5. AST via
   `code.substring(node.start, node.end)`. 6. `DRIVERS/node_modules` on `module.paths` in every
   entry file. 7. New writable JSON → `AUTOTEST_STATE_DIR`-derived path in one shared module.
   8. No router requires another router. 9. CHANGE-LOG entry per change (AGENTS.md §2.1).

## 6. Ignore

`DESIGN_SYSTEM.md` (unwired tokens) · `architecture_orchestration.mmd` (artifact) · sample
`*.xlsx` (fixtures) · `changes.md` (superseded) · committed `core/executed.spec.ts` (now
gitignored; generate lives in state root).
