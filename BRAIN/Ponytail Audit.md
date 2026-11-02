# 🪁 Ponytail Audit — AutoTest Studio
**Updated:** 2026-10-07 · **Method:** verified against master (not the 08-14 scan) · **Scope:** over-engineering only, never correctness/security

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

## Already cut (verified in code — do not re-propose)

- Shared `core/helpers.js` extracted (`isSafeChain/interpolate/q/tokenizeLiterals/sweepOrphans/...`) — P1-A done.
- Dead `updateActivity`/`lastActivity` gone (`grep` → 0 matches) — P1-B done.
- Orphan sweep merged (`[CORE_DIR, DATA_DIR].flatMap(sweepOrphans)`) — P1-C done.
- `BUNDLED_BROWSER` cached at startup — P1-D done.
- `sit_runner.js` deleted — P1-E done.
- `platform_state.json` persisted + restored — P2 done.
- Generated specs gitignored (`core/executed.spec.ts`, `executed.mobile.js`, `replay_*`, `codegen_*`, `runtime_data.json`, `platform_state.json`) — P0 done.

## Remaining findings (ranked)

| # | Tag | Cut | Replacement | Status |
|---|---|---|---|---|
| 1 | `delete` | `globalBrowser` + `process.on('exit')` closer (`server.js:65,87-89,235-239`) — nothing assigns it; only `trackedProcesses` + codegen/runner refs do work | Delete var + both handlers | Safe, unexecuted |
| 2 | `shrink` | `getBundledBrowserPath` (~30 lines) duplicated logic vs `resolveBundledBrowser` in `playwright.config.ts` | Extract to `core/helpers.js`, require in both | Safe — pure path probing |
| 3 | `shrink` | `launchVisibleCodegen` vs `launchVisibleReplay` — same spawn/track/close/unlink shape | One `launchVisibleChild({args,env,onClose})` | Do inside [[Server-Split]] slice 2 |
| 4 | `shrink` | `stepsToLines` (preview) vs replay-builder + compiler emit — three Playwright-line renderers | Share one renderer from `lib/parse.js` | Do inside slice 3/5, with regression tests |
| 5 | `yagni` | `webdriverio` (`package.json:68`, ~100MB+) — mobile never E2E-tested | **KEEP (decision).** Removing breaks the mobile compile path + contradicts board Reality Box `10:389` which promises it as bounded scope. Revisit only if product defers mobile explicitly | Product decision required |
| 6 | `shrink` | `/results` HTML index built by string concat (`server.js:258-325`, `${dir}`/`${f}` unescaped) | Escape names or build via DOM-ish join with escape helper | Correctness-adjacent; normal review, not blind cut |

**Net now: ~60 lines removable + 1 dedup. The 08-14 "~320 lines" estimate is spent — most of it is already cut.**

## What NOT to touch (load-bearing)

Acorn + walk, `isSafeChain` logic, `trackedProcesses`, startup sweep, `runNodeScript` packaged branches (`isPackaged`/`RUN_AS_NODE`/asar cwd — each encodes a real `.dmg` failure), `execFileSync` argv style (space-in-path fix), 409 guard order, `tokenizeLiterals`, trace redaction, wipe hooks, `AUTOTEST_*` relocation. Correctness/security/product requirements outrank deletion — always.
