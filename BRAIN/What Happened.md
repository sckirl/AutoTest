# 🔄 What Happened — Honest Log

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

**Last updated:** 2026-10-07 · Purpose: what was done, what failed, what's unverified, what's next.
Navigation entry; details live in linked nodes.

## ✅ Done & verified (master, 2026-10-07)

- Full web loop: upload → scan → record/manual/link/suggest → matrix → run → evidence.
- Replay predecessors include Library-resolved steps (`tests/replay_mapping_test.js`).
- Shared-literal tokenization (`tests/tokenize_literal_test.js`); strict interpolation (`tests/interpolate_strict_test.js`); trace redaction; path traversal guards.
- Earlier BRAIN backlog items closed in code: shared helpers, browser cache, merged sweep, dead timer removed, `sit_runner.js` deleted, platform persisted, ActionDB relocated, specs gitignored.
- FigJam alignment pass: Mappings (`0:3`) + Execute/Data Matrix/Library reality boxes; 5 red gates + blue CORRECT boxes on board.

## ❌ Failed / fragile (history, don't retry as-is)

- Auto-recording via `AUTOTEST_REC:` console markers — race-prone, unreliable; codegen-poll path won this.
- Strict `networkidle` on `goto` — hangs on SPA telemetry; default load state + catch-guarded waits instead.
- Early "trace viewer" claim — was zero `tracing.start()`; fixed with real per-scenario `trace.zip`.
- Shell-stringified child paths — broke on spaces in userData; `execFileSync` argv everywhere now.
- `execPath`-based packaged detection — Helper binary, not node; `__dirname.includes('app.asar')` + `RUN_AS_NODE` now.

## ⚠️ Unverified (the real backlog)

1. **AL-01–AL-04 / EX-01 packaged acceptance** — code paths look fixed; gesture→restart proof missing. P0.
2. **Mobile on device** — compile path exists, never ran against Appium + emulator. Environmental, excluded from black-box scope.
3. **Real human drag gesture** — link fn + DOM wiring verified independently; Playwright `dragTo()` unreliable on custom HTML5 DnD.

## 🎯 Next

P0 packaged acceptance → P1 [[Server-Split]] slices → P2 ponytail cuts → P3 distribution gates.
Full ordered list: [[Next Direction]] §3. Invariants: [[Next Direction]] §5.
