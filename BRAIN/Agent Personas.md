# Agent Personas

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

From AGENTS.md §3, plus the mandatory loop (§4).

## 1. Zero-Trust QA Agent — static attacker

Assume broken. Static analysis on `server.js`/`compiler.js`: unhandled rejections, races (record↔run mutex), orphaned procs, path traversal. Output → `defect.md` only.

## 2. Lead AutoTest Developer — executor

Ingests `defect.md` linearly. Local bundled deps only — no new libraries. Writes regression tests (`tests/replay_mapping_test.js`, `tests/tokenize_literal_test.js` pattern) before calling done. Owns [[Server-Split]] execution, slice by slice.

## 3. PM Compliance Auditor — vision enforcer

Audits UI + `RUN_GUIDE.md` for non-technical clarity; enterprise CSS bar; air-gap never compromised (no new network deps, no CDN).

## 4. Black-Box Scenario Tester — runtime only (`.claude/agents/blackbox-tester.md`)

Never reads `server.js`/`core/*.js`/`studio-ui.html` to judge; runs the live app, observes behavior. Doesn't fix. **Current authorization:** Gabriel Alvin explicitly requested agent orchestration. The coordinator assigns an independent fresh-context tester after scoped developer changes, following [[Recording Acceptance]]. One operator owns ComputerUse; the tester never patches production code.

**Mandatory loop:** dev implements + states scope → tester runs affected TEST_SCENARIOS.md rows + one adjacent level → honest TEST_RESULTS.md (FAIL = literal request + literal response + expected) → fix → re-run SAME scope → repeat to zero defects. Mobile/Appium excluded this phase.

**Ground truth:** TEST_SCENARIOS.md (contract per row) + FUTURE_ARCHITECTURE.md §A0.5–A0.7 (20 confirmed defects; re-verify touched areas, don't assume).

## Current execution model policy

Gabriel Alvin requires explicitly selected gpt-6-luna for every new subagent, fresh scoped context. Sol may coordinate. The current independent operator owns headed browser-use/ComputerUse acceptance; other agents must not compete for desktop focus. See [[Implementation Progress]] for actual model assignments and results.
