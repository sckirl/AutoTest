# Plan Reconciliation

CONFIDENCE: EXTRACTED
RELATIONS:
- implements::[[Engineering Plan]]
- contradicts::[[Figma Plan]]
- contradicts::[[Server-Split]]
- depends_on::[[Engineering Audit]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: A stale maintenance instruction can reintroduce a production defect even when its original fix remains in Git.

### KEY FINDINGS:
- Gabriel Alvin confirmed manual recording and complete replay as MVP; AI assistance follows it.
- Existing documents are retained, but their priorities/acceptance claims are not current evidence.
- The unfinished tasks/plan.md and tasks/todo.md packaged-codegen work is preserved and incorporated into G11.

### PRIMARY SOURCES:
- [AutoTest FigJam](https://www.figma.com/board/9KC30qRJbzAjk9VZihuDtS/AutoTest-Blueprint?node-id=0-1) — VERIFIED via Figma MCP 2026-10-16; text/connectors inspected, no current fill-color semantics asserted.
- [Playwright test generator](https://playwright.dev/docs/codegen) — VERIFIED accessible 2026-10-16; browser/Inspector and copy workflow source.
- Confirmed user interview in this chat, 2026-10-16; local BRAIN and source review, finalized 2026-10-17.

### SIGNIFICANCE:
Provides explicit precedence without deleting earlier decisions, incomplete work or historical failures.

### GAPS/CONSTRAINTS IDENTIFIED:
The board is a product flow reference, not a certificate that code implements it. Native release results and real-codegen acceptance remain to be produced.

## 1. Authority and evidence

Current human instruction → applicable repository invariants (with current amendments) → confirmed MVP in [[Engineering Plan]] → observable acceptance contracts → verified source/runtime evidence. Existing PRD and FigJam are reconciled inputs. A board color, old green check, source comment, generated spec or test name cannot override current evidence.

`blueprint.html` is the current summary of BRAIN; the older detailed HTML sections remain a collapsed historical reference. `SPEC.md` is an old optional AI feature draft, not the whole-product PRD. `FUTURE_ARCHITECTURE.md` is valuable defect history and prior architecture, not the active implementation order.

| Previous source | Keep | Improve / superseded decision | New owner |
|---|---|---|---|
| BRAIN/Next Direction | Main workflow and invariant context | Replace “working” with evidence levels; acceptance before broad split; no automatic claim that current code works | Engineering Plan + Engineering Audit |
| BRAIN/Server-Split | Detailed named-function inventory and cohesive route group idea | Shared mutable ctx is not sufficient lifecycle ownership; remove mandatory line thresholds and mixed move/fix slices | Module Contracts; G7/G9 |
| BRAIN/Maintainer Reference | Comprehensive pre-extraction function/caller map | Line references are historical; verify before edits; current target contracts differ | Module Contracts |
| BRAIN/Figma Plan | Node IDs and product-flow traceability | Color priorities and AI-first sequence superseded; no current color claims from a text-only read | This reconciliation + G0 |
| BRAIN/Ponytail Audit | Prior cuts and caution around security/runtime paths | Complexity-only audit does not establish correctness/readiness; no unsupported line/dependency savings | defect.md + Engineering Audit |
| BRAIN/Agent Personas | Independent testing roles and same-scope rerun loop | Manual-only invocation conflicts with current explicit orchestration request; fix broken manual-run wikilink | Recording Acceptance |
| BRAIN/Architecture / Workflow & Execution | Data-flow and store inventory | Update through current contracts; CLI default recording and incomplete replay transfer must be explicit | Module Contracts |
| BRAIN/Data-Driven Parameterization | Blank versus missing distinction | One server/compiler readiness rule, UI mirrors it; matrix rows optional if Excel resolves every required key | G6/G8 |
| BRAIN/Zero-Trust Data Lifecycle | Canonical writable state, preserve data | Add generations/ownership/atomic writes and migrations only with preserving compatibility tests | G8 + G11 |
| BRAIN/Security & Compiler | AST/safe-chain and strict data trust boundary | Parser must reject complete unsupported semantics; no partial acceptance | G5/G6 |
| BRAIN/Omnichannel Orchestration | Mobile history | Real mobile is excluded from manual web MVP; dependencies not automatically safe to delete | Deferred backlog |
| BRAIN/What Happened | Historical lessons | No previous timestamp/PASS represents current build readiness | Dated current evidence |
| tasks/plan.md / tasks/todo.md | Unfinished packaged recorder task | Keep original files unchanged; previous checkboxes stay historical; open packaged task maps to G11a/G11c and RC18 | Engineering Plan backlog |
| AGENTS.md | Security, data, isolation and QA invariants | Add current source/plan distinction, real-record gate and verified lessons; legacy “Electron future” is historical | AGENTS current amendment |
| blueprint.html old PRD | Original reported failures and traceability | ActionDB is now relocated in source; old suspected root cause is historical, packaged behavior remains unaccepted | Current summary + reconciliation |

## 2. FigJam decisions and unresolved implementation checks

| Node / section | Drawn behavior | Current plan resolution |
|---|---|---|
| 0:3 Upload/Mappings; 0:9 | .xlsx or .csv, 5 MB | Existing code accepts .xlsx; make that visible. CSV remains a named deferred extension unless chosen MVP workbook needs it; don't advertise unsupported input |
| 0:15 / 0:18 | Keep matching mappings after upload | Compare step/variable semantics and workbook revision; retain only compatible bindings or show conflict; transaction protects old project |
| 1:229 / 1:639 / 1:991 | Record, visible codegen, gestures | RC01 real ComputerUse; terminal launch alone insufficient |
| 1:521 / 1:1288 | Replay prior steps | Exact step identity and shared resolver; missing/failed prior step blocks with recovery path |
| 1:1036 / 1:1063 / 1:1008 | Copy code, paste, save | Proven Inspector Copy→AutoTest review/save is MVP fallback; no invented automatic replay output |
| 12:422; 14:877; 10:361 | Matrix iteration availability and blank/missing behavior | A row is optional when Excel supplies values. Any chosen row must resolve every key; explicit blank valid, absent from both sources fails. UI and preflight agree |
| 14:1032; 14:1086 | Worker default 2/min1, headed/headless | Preserve visible semantics initially; validate integer range and measure safe max. No mandatory headless restriction solely to mask concurrency defects |
| 15:1991 / 8:328 | Report + per-scenario artifacts | Durable per-run identities, manifest/count reconciliation, real link checks. “Completed process” alone is not asserted business success |
| 20:617 | Action Library CRUD/link/drag | Canonical store, same parser/resolver; real gestures and restart needed to close historic AL reports |
| 1:126 / 1:1402 | Provider-backed AI generation | Deferred until manual chain accepted; no provider needed for MVP. Future UI can show progress/actions, not promises to expose model private reasoning |
| 10:389 | Planned mobile and profile reset/delete | Mobile deferred; profile reset/delete conflicts with isolation policy and stays excluded |

## 3. Lesson recording policy

Record an actual mistake, trigger, consequence, prevention and protecting test/evidence ID. Do not invent future mistakes or claim agent self-improvement without a persistent verified rule. Prune only duplicated/superseded instructions with explicit rationale; preserve historical findings. [[Engineering Audit]] carries evidence; AGENTS carries short actionable rules.

## 4. Graph maintenance and document ownership

The five current plan nodes form the active graph: Engineering Plan, Module Contracts, Recording Acceptance, Engineering Audit and Plan Reconciliation. They have typed edges and sources. Index/Next Direction route readers here. Existing nodes remain historical context; current source claims must be rechecked at each code change.

One integrator updates shared documents per slice. Before finishing: check every wikilink resolves, every new node has relations/sources/constraints, summary links open, changelog lists actual changes and verification limits. Do not add speculative orphan nodes for features outside MVP.
