# Data-Driven Parameterization

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

`{variable_name}` only — never `${variable}`. Compiler looks for `{}`, not template literals.

## The 3-way rule (only three outcomes, no fourth)

For a `{key}` a step references, resolved per iteration by `interpolate(template, iterData, step.Data)` (`core/helpers.js`):

1. **Present with a value** → used. `iterData` (Data Matrix row) wins; falls back to `step.Data` (Excel Test Data column, `{k=v}` / `k=v` / JSON parsed by `scenario_parser.js`).
2. **Present but explicitly blank (`""`)** → blank used verbatim. Empty string is a deliberate negative-validation input (A0.8.4), NOT missing data.
3. **Absent from both** → `interpolate()` throws, compile fails loudly via `compile_error.json` → `/run` 500 (A0.5.4). Never fills blank and greens a run that tested nothing.

Covered by `tests/interpolate_strict_test.js`. Old "skipped steps" wording was wrong — `grep -c skip core/compiler.js` → 0, no skip logic ever existed.

## Where variables come from

- **Harvest:** `/scan` extracts `{vars}` from resolved steps (mappings → ActionDB) per scenario → `scenarioVariables`. Data Matrix tab renders editable iteration grid from this.
- **Store:** `POST /data-matrix` ↔ `runtime_data.json` (strict shape: `{scenarioId: [iterObj]}`; empty `{}` clears). Wiped on `/upload` and `/restart` — see [[Zero-Trust Data Lifecycle]].
- **Tokenize:** codegen records literals; `/save-mapping` rewrites them to `{key}` via `tokenizeLiterals(steps, row.Data)` so shared Mapping_Keys honor each scenario's Data. Covered by `tests/tokenize_literal_test.js`.
- **Escape:** compiler emits values via `JSON.stringify` — `O'Brien` and quote payloads can't break generated TS.

## Figma/Blueprint alignment

- Board `AutoTest/Data Matrix`: fetch `{vars}` → +Iteration → editable fields → `POST /data-matrix` → `runtime_data.json` (blue box `20:605` corrected the old "Save to System → config" error).
- Iteration gate `14:877` ("all vars ≥1 iteration?") is advisory — compiler defaults to a single run when matrix is empty.
- `blueprint.html` §4.2 strict-data invariant + §7 contracts govern; `14:425` fork ("Manual Map is Data Matrix?") marked red — no fork exists.
