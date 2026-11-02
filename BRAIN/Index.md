# AutoTest Studio Knowledge Graph (Index)

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

## Current engineering plan — finalized 2026-10-17

Implementation is underway: [[Implementation Progress]] records actual slice status, Luna assignments and executed checks.

- [[Engineering Plan]] — confirmed MVP, architecture choices and ordered G0–G12 implementation tasks.
- [[Module Contracts]] — proposed files/functions, inputs, outputs, ownership, failure behavior and tests.
- [[Recording Acceptance]] — real ComputerUse/codegen procedure, RC01–RC20, agent orchestration and release gates.
- [[Engineering Audit]] — ranked current-tree findings in defect.md and their repair mapping.
- [[Plan Reconciliation]] — improvements to previous plans and FigJam conflicts.

[blueprint.html](../blueprint.html) summarizes these nodes. Current application acceptance: **NOT ESTABLISHED by this planning change**. Older entries below are historical context.

> **🚀 New agent? Go straight to [[Next Direction]].** Ordered task list, verified state,
> system diagram, invariants. Everything else is deeper context.

Zero-install, air-gapped, data-driven E2E automation engine. Excel matrix → record/map →
compile → execute → evidence in `/results/`.

## Map

- [[Architecture]] — components, state roots, packaged boundary, single-source rules.
- [[Server-Split]] — **plan** to split `studio/server.js` (1391 lines, 31 routes) into thin
  bootstrap + 4 flow routers + lib. Status: plan, not yet executed.
- [[Security & Compiler]] — Acorn AST extraction, `isSafeChain`, evidence/redaction rules.
- [[Data-Driven Parameterization]] — `{var}` 3-way rule (value / deliberate blank / absent throws).
- [[Workflow & Execution]] — the 5-tab loop: Studio → Mappings → Library → Data Matrix → Execution.
- [[Zero-Trust Data Lifecycle]] — flat-file stores, wipe hooks, no ghost state.
- [[Omnichannel Orchestration]] — web/mobile platform toggle, what mobile can/can't do.
- [[Agent Personas]] — Zero-Trust QA, Lead Dev, PM Auditor, Black-Box Tester + mandatory loop.
- [[Maintainer Reference]] — every section and named function: purpose, inputs/outputs, callers, invariants, safe-change checklists.
- [[What Happened]] — honest log: done, failed, unverified, backlog.
- [[Ponytail Audit]] — complexity-only findings; load-bearing list (do not cut).
- [[Next Direction]] — **start here for work.** Current verified state + exact ordered tasks.

## Current Status (as of 2026-10-07, verified against master)

- Core loop works: upload → scan → record/manual/link/suggest → data matrix → run → evidence.
- Already-fixed-in-code (were open in Aug docs): shared `core/helpers.js`, browser-path cache,
  merged orphan sweep, dead `updateActivity` removed, `sit_runner.js` deleted,
  `platform_state.json` persisted, ActionDB on `AUTOTEST_STATE_DIR`, generated specs gitignored.
- Not yet accepted: AL-01–AL-04 / EX-01 need packaged gesture→restart proof (see [[Next Direction]]).
- Source docs: [blueprint.html](../blueprint.html) (PRD, §1–14),
  [FigJam board](https://www.figma.com/board/9KC30qRJbzAjk9VZihuDtS/AutoTest-Blueprint?node-id=0-1&t=KeNd93qMgT498YHq-1)
  (4 flows + red/blue alignment marks), [AGENTS.md](../AGENTS.md) (invariants + black-box loop).

## Design Philosophy (Ponytail)

Shortest diff wins — after full comprehension. No build step, vanilla UI, bundled deps,
`fs`-JSON stores. Never simplify away: Acorn parsing, `isSafeChain`, process cleanup,
crash sweeps, packaged paths, validation at trust boundaries. See [[Ponytail Audit]].
