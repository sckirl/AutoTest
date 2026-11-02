# Engineering Plan

CONFIDENCE: INFERRED
RELATIONS:
- depends_on::[[Module Contracts]]
- depends_on::[[Recording Acceptance]]
- depends_on::[[Plan Reconciliation]]
- depends_on::[[Engineering Audit]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: Recorder fidelity, data durability, and maintainability share the same requirement: one explicit owner for each contract.

### KEY FINDINGS:
- Confirmed intent: independent offline desktop installations; manual recording and full-scenario replay first.
- BRAIN owns the detailed plan; blueprint.html is its summary.
- Current tree has upload, recording-transfer, false-success, lifecycle, and packaging defects; see Engineering Audit.
- Proposed direction: 9/10 fit for the stated MVP; confidence in current runtime readiness remains unestablished.

### PRIMARY SOURCES:
- [AutoTest FigJam](https://www.figma.com/board/9KC30qRJbzAjk9VZihuDtS/AutoTest-Blueprint?node-id=0-1) — VERIFIED through Figma MCP, 2026-10-16. Product flow source, not implementation proof.
- [Playwright test generator](https://playwright.dev/docs/codegen) — VERIFIED accessible 2026-10-16. Supports Inspector recording and custom setup with page.pause(); does not prove AutoTest output transfer.
- [Electron packaging](https://www.electronjs.org/docs/latest/tutorial/application-distribution) — VERIFIED accessible 2026-10-16. Distribution reference.
- Local evidence: `studio/server.js`, `core/*.js`, `electron/main.js`, `package.json`, existing `BRAIN/`, `TEST_RESULTS.md`; audited current dirty tree, not a release tag.

### SIGNIFICANCE:
This is a proposed engineering contract, not evidence of implemented or accepted behavior. Current-code observations are labeled separately.

### GAPS/CONSTRAINTS IDENTIFIED:
No current real-codegen or installed-package acceptance was performed during this planning pass. Supported workload and target OS acceptance remain unmeasured.

## 1. Scope and definition of success — 2026-10-16

For Gabriel Alvin: a tester uploads a workbook, records real browser actions through Playwright Inspector, saves them through AutoTest, supplies scenario data, executes each complete scenario, and opens accurate evidence. Human and AI maintainers can set up an isolated development/test environment, find a behavior's owner, change it, and demonstrate that the real tester journey still works.

The terminal launches codegen; the target browser and Inspector are the interactive recording surfaces. ComputerUse must operate those real surfaces. A stubbed launcher, fabricated codegen file, handwritten mapping, or API-only save is not recorder acceptance.

Plan only in this change. No production fixes, dependency installs, runtime data changes, packaging, or release certification. The user authorized the plan and orchestration; future implementation follows this sequence, not the stale priority list in earlier documents.

**MVP scope:** web workbook upload, manual recording/remapping, supported assertions, Data Matrix, reusable library actions needed by scenarios, execution/cancel/status, durable evidence, independent offline desktop install/update. AI generation, Appium/mobile, shared hosting and simultaneous users sharing one state directory are deferred. Existing optional code is not deleted without caller checks and migration review. Profile reset/delete remains excluded.

**Product acceptance:** every in-scope catalog row passes on the candidate build; required negative cases produce failures; the complete recorded scenario survives restart and runs with alternate and explicit-blank data. Three consecutive full journeys with fresh state plus a restart journey are the proposed stability gate, with every attempt retained. This is a bounded release criterion, not statistical proof of universal correctness.

The representative repo workbooks are candidates (`orangehrm_blueprint.xlsx`, `orangehrm_full_scenario.xlsx`, `practicetest_scenario.xlsx`). G0 must inspect their rows/URLs and select/hash the actual acceptance workbook. No target application availability, account authorization, or exact workbook selection is assumed. Local fixtures make the engineering loop reproducible; the chosen real application remains a separate acceptance gate.

## 2. Architecture decisions

1. Keep CommonJS, Express, vanilla browser JavaScript, Playwright and Electron. No frontend framework, database server, plugin framework or per-function files are justified by one tester per installation.
2. Preserve current routes during extraction. Use small adapters for versioned IDs/contracts where necessary; do not maintain two implementations indefinitely.
3. Define one validated action representation, one scenario resolver, and one Playwright renderer. Record import, library import, preview, preceding replay and final execution must agree on semantics.
4. Give recording sessions and run sessions distinct owners, coordinated by one activity lease. Every callback/timer checks the operation ID. Cancellation is terminal only after owned process termination settles.
5. Keep JSON initially, with validation, atomic single-file replacement, project revisions, explicit backups, and a single state-directory owner. Multi-file replacement needs a staged generation plus a committed pointer or a recoverable journal; renaming each file alone is not a transaction.
6. Start every run from immutable validated inputs. Store results under unique run/scenario/iteration identities; filenames never derive solely from sanitized labels. Keep compatibility reads for older evidence.
7. Resolve runtime/browser/module paths once. A release contains one selected Playwright installation and a compatible browser resource. System Chrome must never be an undocumented rescue for an incomplete bundle.
8. Bind the controller to loopback and reject untrusted mutation origins; a local random port and CORS are not authentication. Use a per-launch capability for UI/API writes on every mutating controller request; generated specs never need controller credentials. Trusted direct test tooling receives the launch capability explicitly, without recording it in evidence.
9. Only one process owns the project's state/profile. Electron single-instance protection plus state-directory ownership for direct server launches closes the different-port/shared-files hole.
10. Measure scale before selecting limits. A desktop product scales through bounded work, responsive UI, predictable data storage and reproducible upgrades, not distributed infrastructure.

Dependency direction: UI → HTTP routes → session/project services → parser/resolver/renderer/stores → Node/Playwright. Electron owns lifecycle, not business data. Core modules cannot import routes/UI. The composition root constructs owners once; there is no general mutable context object that every router can edit.

## 3. Ordered implementation backlog

**Execution started 2026-10-17:** see [[Implementation Progress]] for actual task status and test evidence. The table below remains the planned sequence; completion is never inferred from the existence of a test file.

At the end of the original planning pass all tasks were **NOT STARTED**; current status is tracked in Implementation Progress. Each task is a distinct reviewable change, normally about five production/test files, plus its evidence/changelog. This is a review-size heuristic: keep a necessary cross-file migration coherent, tested and independently revertible rather than partially wiring it to meet a file count. References to proposed functions resolve in [[Module Contracts]]. G6 internal IDs are transient adapters over the existing stored data; any persisted identity change requires compatibility reader, backup, migration and rollback tests in that same first change, regardless of task number. No new task overwrites `tasks/plan.md` or its unfinished packaged-codegen gate; [[Plan Reconciliation]] maps that work here.

| ID | Change and files | Depends on | Acceptance and verification | Owner / rollback |
|---|---|---|---|---|
| G0 | Baseline and acceptance contract: `TEST_SCENARIOS.md`, `tests/acceptance/recording-checklist.md`, fixture provenance index | None | Record dirty diff/versions, inspect/hash workbook, map FigJam nodes to catalog cases, freeze supported actions and expected outcomes; no old PASS carried forward | Coordinator + independent QA; docs-only rollback |
| G1a | Safe harness: `tests/run_all.js`, `tests/support/runtime.js`, `tests/run_all_test.js` | G0 | Temporary state/data/results per run; dynamic port/owned server identity; shutdown waits for children; repo-state hashes unchanged before/after success and forced failure | Developer; revert harness slice |
| G1b | Remove hardcoded test paths/ports in small batches; add omitted web regression suites to inventory | G1a | Every enabled test declares fixture/state ownership; no missing replay/tokenization regression; skipped optional tests explicitly classified | Developer + QA; revert each batch |
| G2 | Upload defect: `studio/server.js`, focused upload integration test | G1a | Valid workbook succeeds via UI; invalid workbook fails and preserves prior project; stray identifier removed; syntax check plus actual request | Developer; source revert, fixtures isolated |
| G3a | First-step real recording baseline; `tests/fixtures/codegen/manifest.json`, actual generated fixture, recording report | G2 | ComputerUse attempts navigation/action/assertion→transfer→save→restart→replay; exit criterion is evidence captured and every failure assigned, not a premature PASS | Independent GUI tester; no source mutation |
| G3b | Recorder status/output lifecycle: recording service + route + UI polling tests | G3a | Failed spawn/empty close/cancel each terminal and visible; completed output immutable and repeat-readable until explicit discard; no early partial import | Developer + full recording scope QA |
| G4a | Intermediate replay configuration/continuation: server or extracted recording service, focused launch test | G3b | Dev and packaged-shape config exists; preceding actions reach required state; missing predecessor blocks with named step; Inspector opens | Developer + GUI QA |
| G4b | Real intermediate export contract: recording service, UI guidance, captured fixture/checklist | G4a | Record new action after preceding replay and transfer by proven path; save only intended new mapping. Capture full-scenario outcome; parser/compiler failures feed G5/G6 and remain open until final chain gate | Developer + GUI QA; keep previously valid mapping until new save completes |
| G5a | Strict recording parser: `core/recorded_actions.js`, server import, genuine golden parser tests | G4b | Unknown action/argument/assertion/alias or unsafe source fails with source location; no empty/partial save; literal locator slices preserved | Developer + static QA; adapter allows old callers |
| G5b | Library uses same parser: `core/action_db.js`, library regression tests | G5a | Same input has identical accepted actions/diagnostics via manual, recorded and library paths; bad edit preserves old action | Developer + library black-box scope |
| G6a | Complete scenario validation and transient explicit identity: `core/scenario_plan.js`, compiler, focused tests | G5b | Missing/empty mapping, unknown action, missing key fail before launch; blank is kept; repeated labels target correct occurrence; ambiguous legacy identity rejected. G6 identity is transient and bound to snapshot revision; persisted formats stay unchanged until a migration-protected slice | Developer + static/black-box QA |
| G6b | Single web renderer: `core/playwright_renderer.js`, compiler, replay/preview callers, renderer tests | G6a | Shared ordered actions/data/assertions generate equivalent preview/replay/run behavior; every generated title/string safely quoted | Developer; move and behavior changes separate |
| G6c | Evidence readiness: renderer/compiler, persistent-traffic fixture, test | G6b | Polling page does not consume whole test timeout for screenshot; expected condition awaited; evidence failure does not overwrite primary assertion failure | Developer + real browser QA |
| G7a | Run identity/cancel: `core/run_session.js`, `core/activity.js`, server adapter, lifecycle tests | G6c | Cancel A then start B; delayed A close/timers cannot mutate B; failures and no-tests outcomes not green; bounded logs | Developer + concurrency QA |
| G7b | Run snapshots/evidence identity: run service, renderer, `core/results.js`, UI results, tests | G7a | Multiple runs and colliding display labels retain distinct artifacts; exact report counts; links survive restart; old artifacts stay readable | Developer + result-link QA |
| G7c | Local controller boundary: `studio/app.js` or current server, UI API helper, focused security integration test | G1b; before release | Listen on loopback; reject hostile origins and missing/invalid launch capability on writes; trusted UI and documented tooling work; token absent from logs | Developer + static/security QA |
| G8a | Validated atomic stores: `core/project_store.js`, ActionDB adapter, corruption/write-failure tests | G7b | Truncated/corrupt state produces recovery error; failed write retains last valid state. Before any persisted format change (including an earlier task if scope changes), legacy reader + backup + versioned migration + rollback tests land with that same slice | Developer + fault-injection QA |
| G8b | Transactional workbook replacement and semantic mapping retention: parser, project store, intake adapter, tests | G8a | Interrupted replace recovers previous or complete new generation, never mixed files; changed workbook invalidates incompatible mappings/data visibly | Developer + recovery QA; backup before migration |
| G8c | State ownership: Electron main, server bootstrap, project-store ownership helper, two-instance tests | G8b | Second instance focuses/rejects safely; direct servers sharing state cannot run concurrently; normal Chrome never touched | Developer + process QA |
| G9a | Extract application/routes after behavior stable: `studio/app.js`, bootstrap, one route group at a time | G8c | Route/middleware inventory equivalent for move-only slices; each group reruns scoped catalog; no cycle or duplicate activity owner | Developer; independently revertible move |
| G9b | Extract browser UI by responsibility, only where required for testability: HTML + one JS module + relevant UI test per slice | G9a | No-build local assets; one poll owner; keyboard/dialog/tab state works; full recording journey stays green | Developer + GUI QA |
| G10a | Local workload characterization: fixture generator, `tests/scale_test.js`, evidence report | G9b | Scenario, step and iteration count varied independently; all expected cases accounted for; latency/memory/disk measured on named hardware | QA; data/report only |
| G10b | Fix measured bottleneck one at a time | G10a | Before/after measurements and unchanged results; scan reads library once; bounded render/log/artifact memory | Developer; no speculative infrastructure |
| G11a | Distribution resources: `package.json`, `core/runtime_paths.js`, config/launch adapters, `scripts/verify_distribution.js` | G8c; can precede G9/G10 | Actual artifact contains correct OS/arch browser + one Playwright copy; unpacked executable works outside repo/cache, no Node on PATH | Packaging developer + native QA |
| G11b | Installer upgrade integration (migration support already lands at first G8 format change): `core/state_migrations.js`, project-store/bootstrap integration, migration tests | G11a | Backup and validate before write; unsupported future schema rejected; repeated migration safe; old state restored for app rollback | Developer + recovery QA |
| G11c | Native installed release acceptance: Windows/macOS evidence and release runbook | G11b + G7c + G10a + any required G10b | Install→record→replay→restart→upgrade→rollback on each claimed target; no internet/runtime downloads; state preserved; paths with spaces | Independent native QA; restore app + matching state backup |
| G12 | Maintainer handoff: `README.md`, `RUN_GUIDE.md`, package script aliases/doctor, final BRAIN summary | All required gates | Fresh human/AI can run documented setup/checks offline from supplied development kit; commands match tests; no secret copied | PM/maintainer reviewer |

Checkpoints after G2, G4b, G6c, G8c and G11c rerun the full affected scope. A slice must pass its changed behavior; baseline downstream failures are recorded with owning tasks and do not create circular dependencies. At G6c the complete recording→save→replay chain must pass; at G11c every required release case must pass. No new regression is waived. A documentation or pure move check is not runtime acceptance. Full legacy-suite execution is prohibited until both G1a and G1b verify that tests themselves do not write hardcoded repo data; G2 can use a newly isolated focused integration test.

## 4. Recorder decision and staged compatibility

Plain Record can use the installed CLI `codegen --output`; finalization timing must be observed on the pinned version before trusting the file. Intermediate recording uses supported headed custom setup and `page.pause()` after replay. That API opens codegen controls but does not itself establish file export.

**MVP transfer decision:** use Inspector's actual Copy control and the AutoTest paste/save UI for intermediate recordings unless G4 proves an equally supported automatic export. The board already specifies this flow (nodes `1:1036`, `1:1063`). Show the transfer mode in the modal. Do not claim automatic transfer on close when there is no producer. Do not fabricate output files to pass acceptance. Prefer the same visible review/save step for both paths.

A captured full recording may contain wrapper imports, navigation and previous steps. The parser must distinguish allowed test scaffolding from recorded statements; it must not blindly walk nested functions, conditionals or loops and flatten them. Map only the selected step's newly recorded actions; warn and require review if the boundary is ambiguous. Full-scenario replay must never duplicate predecessor actions in each mapping.

Browser ownership is explicit: normal Chrome is forbidden; AutoTest-owned profile is isolated. Existing CDP debug Chrome remains untracked and must not be killed by cleanup. A CLI-created recording browser is an owned child with separately documented close/cancel behavior. Reconcile the old “leave browser open” statement before changing lifecycle. No profile reset is added.

## 5. Scale and maintainability budgets

One desktop, one state owner, one active record/run operation. Proposed worker range for evaluation is 1/2/4, not a claim of support. Default stays compatible until measured; independent scenarios may run concurrently, steps inside a scenario remain sequential. Shared accounts or target data require serial execution or distinct fixture accounts.

Proposed characterization matrix: 10/100/500 scenarios × 5/20 steps, then 1/10 data rows separately; run the largest useful combined case only after smaller cases pass. Record effective test count (sum of scenario iterations), time to upload/scan/compile, UI long tasks, cancel latency, peak parent+child RSS, generated source size, and disk bytes. Proposed initial goals: scan under 2 seconds for 100 scenarios, cancel acknowledgement under 1 second and owned-child settlement under 5 seconds on the recorded reference machine. These are engineering targets pending measurement, not user-approved capacity promises. Never hide a miss by silently lowering a target.

Optimize measured costs: read ActionDB once per snapshot rather than per step; avoid duplicate Excel parse at every route; paginate/limit DOM rendering only if measured; retain run summaries and lazily load evidence. Disk-full must be visible, never “passed with missing evidence.” No automatic deletion of user results: document footprint and use explicit selected-run cleanup with confirmation if introduced later.

## 6. Offline delivery and updates

End users receive a tested native artifact and short launcher instructions. Maintainers receive source + lockfile + exact dependency/browser build manifest + an offline dependency kit. Online dependency acquisition belongs to controlled build preparation, not end-user startup. A clean development kit must run the same tests without npx or network fetches.

The current configuration does not include DRIVERS. G11 must choose and document the resource layout, inspect the built artifact and exercise it. Browser-policy decision remains explicit: existing rules specify isolated stable Chrome, while the zero-install goal favors a bundled compatible recorder. G0 records this conflict; G11a must document the selected distribution policy, licensing/IT constraints and native recording proof before changing the browser family. Until that amendment is verified, keep the existing stable-Chrome requirement visible; do not call it zero-prerequisite or silently fall back to it. Native IT signing/allowlisting requirements and actual Windows execution remain environmental gates.

Upgrade flow: stop owned activity → check package/state compatibility → back up complete committed state → install app without replacing userData → apply validated idempotent migration if needed → record/replay smoke → retain rollback backup. A failed migration restores/keeps old state. Rolling back binaries against newer incompatible state is forbidden; restore matching state backup. No automatic network updater in offline MVP.

## 7. Agent execution contract

See [[Recording Acceptance]] for detailed assignments. Coordinator owns scope, sequencing, evidence ledger and documentation. One developer writes a slice. Static QA checks source and logs defects to `defect.md`. A fresh-context black-box tester gets behavior contracts, target build, scenario IDs and fixture paths, never implementation arguments; it does not read or patch production source. One ComputerUse operator owns the desktop. Packaging reviewer validates actual artifacts. PM/maintainer reviewer verifies setup and tester instructions.

Parallel work is permitted for read-only audits and independent pure tests with separate state. GUI automation, shared mutable state, migrations, and edits to the same module are serialized. A test failure returns the whole original scope to the developer/tester loop. The coordinator cannot relabel failure as success to close a task. Keep bounded subagent outputs; integrate one plan rather than competing plan copies.

## 8. Completion evidence

Independent plan review corrected circular baseline gates, moved migration safety to the first format change, prohibited unsafe legacy-suite execution, made browser policy explicit, added G7c controller protection and corrected task dependencies. Finalization date: 2026-10-17. Proposed module files are ownership destinations, not a requirement to create all files in advance; extract only when the task needs that boundary.


Plan completion means source-anchored audit, module/function contracts, sequenced tasks, realistic runbook, risk tests, reconciled old instructions, working summary links and independent plan review. Implementation completion is separate and requires executed gates. For this planning pass, current readiness remains **NOT ACCEPTED**.

## Final codegen delivery amendment — 2026-10-17

Gabriel Alvin authorized automatic delivery from the existing Playwright CLI `--output` file into AutoTest. The primary path is real manual recording in headed Playwright Chrome → owned recorder close → final file delivery into the review textarea → explicit save. Native Inspector clipboard transfer is an optional fallback, not a prerequisite for this automatic path. ComputerUse recording remains required realistic acceptance. This supersedes earlier plans requiring manual Copy/Paste as the only delivery proof.

The initial file is not final output: the baseline route consumed about:blank, deleted it and stopped UI polling while Playwright later wrote the actual navigation. Delivery must wait for the matching child close with success, retain repeatable final output without destructive read, and reject failed/cancelled sessions. Old callbacks/responses must not overwrite a new session or user-edited text. Results belong to a bounded session lifetime; preserve mappings until explicit validated save.

No new dependency, WebSocket service or browser-profile policy change is needed. Reuse the existing local HTTP polling route. Intermediate replay lacks this CLI output contract and must state the manual fallback honestly; this amendment does not certify intermediate export.

Required regression evidence: early file stays pending, late final write delivered exactly after successful close, repeated delivery survives a lost response, unknown/invalid session handling, failure/cancel rejection, stale A/B session isolation, UI user-edit preservation, and genuine headed navigation source arriving in AutoTest. Production deploy here means applying and testing the local repo change; native packaged distribution still requires its own installed-artifact gate.

## Live preview amendment — 2026-10-17

Gabriel Alvin clarified that generated actions must appear in AutoTest while the tester uses the codegen browser. Close-only display does not meet that feedback requirement. The approved path is now: native manual recording → periodic live generated-source preview → successful owned recorder close → authoritative final capture → explicit save. This supersedes close-only display wording above, while preserving the rule that an early file is never a completed recording.

Reuse the existing 1.5-second polling route: running sessions stay ready:false and expose only syntactically complete session-owned preview snapshots with increasing versions. UI labels these provisional and disables recording Save until final completion. Skip partial writes and retain the last valid snapshot; never execute preview text. Final completion remains ready:true only after successful matching child close. Failure/cancel never finalize.

Actual user edits remain untouched; show the evolving live source and final source in a read-only section when needed. Scope preview versions, input revisions and render revisions to the modal/session so out-of-order polls and previous mappings cannot replace newer content. Manual/suggestion modal controls must reset normally. Intermediate replay export and full-workbook/installed-package gates remain separate.

Acceptance must observe actual generated navigation and a subsequent action appearing while the real recorder is still open, provisional status and disabled Save, then finalization on close. Supporting tests cover partial file writes, repeated/newer previews, stale response order, edited text, failed/cancelled sessions and modal control reset. Prior final-only native PASS is retained as baseline evidence, not live-preview acceptance.
