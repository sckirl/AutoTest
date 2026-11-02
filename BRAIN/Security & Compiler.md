# Security & Compiler

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

## AST extraction (no hallucinations)

`parseRecordedCode` (`server.js:880-943`, slated for `lib/parse.js` — see [[Server-Split]])
uses Acorn + walk: raw locator via `code.substring(node.start, node.end)`, `page.` prefix
stripped. `expect(locator).toBeVisible()/toHaveText()` unpacks the locator inside the
assertion. `setInputFiles` (any case) throws loudly — never silently dropped. Allowlist
action types: click/fill/press/goto/selectOption/check/uncheck/toBeVisible/toHaveText.

## `isSafeChain` (`core/helpers.js`)

Permits Playwright native chains (`locator, getByRole, getByText, getByLabel, filter,
frameLocator…`); blocks `require/eval/process/window/constructor` etc. Runs on every
locator before it enters generated code — compiler replay path, suggest path
(`parseSuggestion` rejects unsafe), record path. Non-negotiable, never a "simplification".

## Shared-literal tokenization

Codegen bakes literals (`"admin123"`), never `{key}`. On save with `scenarioId`,
`tokenizeLiterals(steps, row.Data)` rewrites literals back to `{key}` so a Mapping_Key
shared across scenarios honors each scenario's own Data. Covered by
`tests/tokenize_literal_test.js`.

## Compiler (`core/compiler.js`)

Resolves per step: mappings → `ActionDB.resolveSteps` → `interpolate(target/value,
iterData, step.Data)`. Emits web `executed.spec.ts` (Playwright Test) or
`executed.mobile.js` (plain async, node-direct — Playwright CLI can't parse it).

Screenshot sync: `waitForTimeout(1000)` BEFORE `waitForLoadState` (networkidle returns
instantly on SPAs; the sleep guarantees paint). `page.goto` uses default load state —
never hard `networkidle` (hangs on telemetry/polling).

## Evidence redaction

Steps whose target/value matches password/secret/token/pin write `TRACE_WITHHELD.txt`
instead of `trace.zip` (no credential leak in traces). Covered by
`tests/trace_redaction_test.js`.

## Strict interpolation → [[Data-Driven Parameterization]]

Present value (incl. `""`) used; absent key throws at compile (`compile_error.json`
surfaced through `/run` 500, not "Command failed"). Covered by
`tests/interpolate_strict_test.js`.
