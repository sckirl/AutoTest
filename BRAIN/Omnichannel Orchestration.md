# Omnichannel Orchestration

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

One engine, two targets. `activePlatform` (`web`|`mobile`), set via UI toggle → `POST /set-platform` → `platform_state.json` + `process.env.AUTOTEST_PLATFORM`. Restored on boot. `GET /env` returns it.

## Web (verified path)

Full loop: record (visible codegen) → map → compile `executed.spec.ts` → Playwright CLI `--workers N --reporter=json` (+`--headed` unless headless) → `report.json` + evidence. `playwright.config.ts`: `testDir`/`outputDir` track `AUTOTEST_*` env; bundled Chromium resolved OS-first (`resolveBundledBrowser`).

## Mobile (bounded path)

- **Compile:** `compiler.js` `isMobile` branch emits `executed.mobile.js` — plain async script, run node-direct (Playwright CLI can't parse it).
- **Record:** `POST /record` with platform `mobile` → **400** ("not supported yet, use Manual"). Allowlist: anything not `web` refused (A0.7.1 denylist hole closed).
- **Run:** `POST /run` platform `mobile` requires `webdriverio` resolvable or 400. `webdriverio@^9.32.0` stays in `package.json:68` (decision, not oversight — see [[Ponytail Audit]]).
- **Never E2E-tested** against real device/emulator + live Appium (dev-machine limitation, not a known code defect). Board Reality Box `10:369` + `10:389` record this boundary. Mobile/Appium scenarios excluded from black-box loop this phase (AGENTS.md §4).

## Ponytail shape

Boolean `isMobile`, not polymorphic runners. Same Excel shape, same `{var}` interpolation, same Data Matrix. Mobile reuses everything until the emit/run step.
