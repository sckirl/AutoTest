# Module Contracts

CONFIDENCE: INFERRED
RELATIONS:
- implements::[[Engineering Plan]]
- depends_on::[[Recording Acceptance]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: The same action contract prevents both silent test loss and repeated maintenance fixes.

### KEY FINDINGS:
- Proposed contracts below replace duplicated ownership, not the entire application.
- File/function names marked proposed do not exist yet; retain compatibility entry points while extracting.

### PRIMARY SOURCES:
- [Playwright assertions](https://playwright.dev/docs/test-assertions) and [TestOptions](https://playwright.dev/docs/api/class-testoptions) — VERIFIED accessible 2026-10-16.
- [Node filesystem API](https://nodejs.org/api/fs.html) — VERIFIED accessible 2026-10-16. Atomic project-generation design is our proposal; a rename is not claimed to make multiple files transactional.
- Current local source: `studio/server.js`, `core/*.js`, `electron/main.js`, `playwright.config.ts`, `tests/`; inspected 2026-10-16.

### SIGNIFICANCE:
Gives human and AI maintainers a named owner, data contract, failure behavior and proof obligation for each subsystem.

### GAPS/CONSTRAINTS IDENTIFIED:
The recording export path, supported browser/package matrix and workload limits require actual runtime gates. No proposed function is claimed implemented.

## 1. Shared types and ownership

G6 may introduce transient scenario/step IDs bound to a snapshot revision while retaining legacy storage through adapters. Persisting new IDs or changing mapping addressing is a format change: compatibility reading, complete backup, migration and rollback checks must ship in that exact slice, even if it occurs before G8. The target objects below do not authorize an unprotected early schema change.


Use documented plain objects/JSDoc, not a TypeScript migration or schema framework merely for this plan. Each boundary validates its inputs.

| Object | Required contract | Failure rule |
|---|---|---|
| Project snapshot | `schemaVersion`, `revision`, `workbookHash`, scenarios, mappings, library snapshot and matrix | Unknown version/corrupt JSON rejects; no fallback to defaults |
| Scenario | Stable internal `scenarioId`, original `displayId`, ordered steps | Reject ambiguous legacy identities; never use display text as unique disk key |
| Step | `stepId`, `mappingKey`, `data`, `expectedResult` | Repeated labels remain separate step occurrences; shared mapping key is explicit reuse |
| Recorded action | `type`, raw locator source or URL, typed args, source span, assertion polarity where supported | Unrecognized semantics reject the whole import; no ignored action |
| Resolved plan | Snapshot revision, scenario/iteration IDs, ordered validated actions | All mappings and values resolve before emitting runnable code |
| Recording session | `id`, selected scenario/step/revision, phase, child ownership, transfer mode, output/error | Older session completion cannot overwrite newer UI; save verifies revision |
| Run | `runId`, immutable input reference, phase, owned child, bounded logs, result manifest | Exit, cancel, timeout and report callbacks can only update their own run |
| Result entry | Run/scenario/iteration identity, expected/executed steps, status, artifact paths | Missing report, no tests, cancelled and evidence errors remain distinct |

Expected-result prose is documentation unless mapped to an explicit executable assertion. A successful click sequence must not be displayed as verification of an unevaluated business expectation. UI should distinguish “actions completed” from asserted pass; catalog defines which cases require assertions.

## 2. Runtime and stores

| File / status | Functions and exact job | Inputs → outputs / effects | Contract tests |
|---|---|---|---|
| `core/runtime_paths.js` — proposed | `resolveRuntimePaths(options)` separates immutable app/resources/module/browser roots from writable state/data/results roots; `resolveBrowserRuntime(paths, platform, arch)` chooses matching installed bundle or explicit configured prerequisite; `buildChildEnvironment(runtime, overrides)` constructs child env | Explicit env/platform/resources → frozen paths/runtime descriptor; no writes or downloads; missing resource is actionable error, no wrong-OS fallback | Paths with spaces/Unicode, read-only app, missing bundle, matching package versions, same Playwright module identity |
| `core/runtime_env.js` — retain | `parseDotEnv(text)` parses config; `loadDotEnv(path)` fills only unset env; `loadRuntimeEnv()` chooses documented files/precedence | Local text/files → env; never logs secret values | Quoted values, comments, process override, packaged path |
| `core/project_store.js` — proposed | `readProject()` validates committed snapshot; `readJson(file, validate)` diagnoses missing/corrupt; `writeJsonAtomic(file,value)` writes temp+flush/rename in same directory; `saveMapping(stepRef,actions,revision)` updates compatible mapping; `saveMatrix(matrix,revision)` preserves blank; `replaceWorkbook(parsed,options)` stages full project revision; `commitGeneration(staged)` switches committed pointer; `recoverProject()` chooses last complete generation; `acquireStateOwnership()/releaseStateOwnership()` owns state dir | One configured root + explicit revision → committed new revision; rejects stale edits or two owners; interrupted multi-file commit exposes old or new complete generation | Disk-full, permissions, interrupted stages, corruption, stale revision, second process; backups stay recoverable |
| `core/state_migrations.js` — lands with the first G8 format-changing slice | `readStateVersion(state)` detects old known formats; `migrateState(from,to,source)` transforms staged copy; `verifyMigration(old,new)` checks scenario/mapping/library/data counts and semantics | Versioned snapshot → validated new staged snapshot + report; no in-place destructive transformation; future versions rejected | Legacy fixtures, repeat migration, interruption, restore matching old state for rollback |
| `core/action_db.js` — retain façade | `init/read/write` use project store; `saveAction/deleteAction/saveGroup/deleteGroup` enforce IDs and references; `resolveAction/resolveGroup/getGroupSteps/resolveSteps` resolve against supplied snapshot; `linkSynonym` updates canonical binding; `extractVariables` remains shared | Library input → validated records/ordered actions; parser delegated to recorded_actions; no swallowed syntax errors | CRUD→restart→compile; deleted references; duplicate synonyms ambiguity; missing group members; lookup without repeated file reads |
| `core/scenario_parser.js` — retain entry point | Extract `parseWorkbook(file)` → scenarios/warnings without writes; `validateWorkbook(rows)` checks headers/IDs/step/data syntax; keep `generateBlueprintFromExcel(path)` CLI adapter during migration | Workbook bytes/path → deterministic snapshot candidate. Explicit `.xlsx` support initially; CSV only after contract/test added | Multiple scenarios, first-sheet selection, leading headers, duplicate IDs/labels, merged cells, 0/false/blank, values containing `=`, invalid JSON |

Workbook handling must declare first-sheet-only behavior and any skipped rows. Empty steps/scenarios and warnings that remove executable content cannot silently pass readiness. Raw `key=value` parsing must split at the first `=` and preserve explicit empty strings; JSON errors cannot become unrelated default data. Retaining mappings after a new workbook requires compatible step semantics and variables, not matching labels alone.

## 3. One action pipeline

| File / status | Functions and exact job | Inputs → outputs / effects | Contract tests |
|---|---|---|---|
| `core/recorded_actions.js` — proposed | `parseRecordedCode(source)` accepts known codegen scaffolding and statement sequence; `parseAction(node,source)` extracts type/args/raw locator span; `validateAction(action)` enforces allowlist; `formatDiagnostic(error)` identifies line/column and unsupported construct | Code string → complete nonempty action array or diagnostics. No execution/eval; never flatten branches/loops as if unconditional | Verbatim codegen golden fixtures; negative assertions, select args, aliases, double click, uploads rejected if unsupported; malicious nested expressions; same input through all import paths |
| `core/scenario_plan.js` — proposed | `resolveMapping(step,snapshot)` handles direct/library binding consistently; `resolveScenario(scenario,iteration,snapshot)` builds complete plan; `resolvePrecedingSteps(scenario,stepId,iteration,snapshot)` resolves exact prefix; `validatePlan(plan)` rejects incomplete/unsupported work | Snapshot+IDs+row → ordered immutable plan; no browser/files; no missing predecessor filtering | Empty/unmapped step, repeated label, library changes, alternate values, blank vs absent, zero-step scenario |
| `core/playwright_renderer.js` — proposed | `renderAction(action)` emits one supported operation using safe locator and typed quoted args; `renderScenario(plan,options)` emits test wrapper/assertions; `renderReplay(plan,options)` emits preceding prefix + pause; `renderPreview(plan)` emits displayable version from same actions; `renderEvidenceCapture(policy)` adds bounded capture | Validated plan → source text; no state lookup; fail on unknown type; use string serialization for all titles/comments where appropriate | Syntax + actual runtime on local fixtures; preview/replay/run equivalence; escaping, options, assertions; continuous network traffic |
| `core/compiler.js` — retain CLI | `compile()` reads a validated snapshot, expands iterations, asks resolver/renderer for output, writes run-scoped spec; returns manifest internally, nonzero exit with diagnostic externally | Snapshot → generated spec + expected case/step counts; empty/missing/corrupt input is error; stale spec cannot be reused | Strict interpolation, safety, genuine recorded fixture run, counts, failure propagation |
| `core/helpers.js` — narrow over time | Retain `isSafeArg/isSafeChainNode/isSafeChain`, `interpolate`, `q`, `tokenizeLiterals`, `safeSessionId`, `normalizePlatform`, `hasSensitiveKey`; move browser paths/launch builders to runtime owner and orphan sweep to lifecycle owner when that slice warrants it | Pure validation/transform only. Tokenization rejects ambiguous identical literal→multiple-key matches instead of guessing | Existing safe_chain/interpolate/tokenize tests plus captured literal ambiguity |
| `core/results.js` — proposed | `createRunManifest(plan)` assigns stable IDs and expected counts; `artifactPath(ids,kind)` confines paths; `harvestReport(report)` walks nested suites; `validateReport(manifest,report)` reconciles outcomes/counts; `listRunArtifacts(runId)` builds encoded URLs | Validated report+manifest → result entries; never parse display titles for identity; never expose arbitrary filesystem paths | `PT.1` vs `PT-1`, quotes/Unicode, nested suites, missing artifacts, zero tests, restart, prior run retention |

Supported-action expansion is evidence driven. Initial contract can reject object selection, `.not` assertions, popups, file upload or other unimplemented forms, but G0 must compare that list with the chosen workbook. If an essential recorded flow emits one of them, support is a blocking MVP task, not an excuse to edit it out or skip the scenario.

## 4. Session and process owners

| File / status | Functions and exact job | Inputs → outputs / effects | Failure/state guarantees |
|---|---|---|---|
| `core/activity.js` — proposed | `acquire(kind,id)`, `release(kind,id)`, `current()` | One app owner → exclusive lease or busy error | Record/run/deferred suggest share guard; only matching owner releases |
| `core/recording_session.js` — proposed | `startRecording(request)` validates step/revision and acquires lease; `launchCodegen` owns plain recorder; `launchReplay` owns prefix+Inspector; `finishRecording(id)` settles file/manual transfer; `readCompletedRecording(id)` repeatable read; `getRecordingStatus(id)` typed progress/error; `cancelRecording(id)` cancels owned child and output; `disposeSession(id)` cleans temporary resources after save/discard | Session request → ID/status; preserves user draft and profile; completed capture durable until acknowledged | Phases starting→replaying/recording→awaiting-transfer→ready→saved, or failed/cancelled; process exit without code is not success; no output file fabricated for replay |
| `core/run_session.js` — proposed | `startRun(request)` acquires lease, snapshots/validates and compiles; `getRunStatus(id)` reads durable/active result; `cancelRun(id)` marks cancelling and terminates owned work; `onRunnerExit(id,result)` reconciles report; `disposeRun(id)` clears transient resources, not evidence | Run request → ID + durable terminal manifest | compiling→running→completed/failed; cancelling→cancelled; older callbacks inert; missing report or mismatched case count fails |
| `core/process_runtime.js` — proposed | `runNodeScript(runtime,script,args)` replaces duplicated child logic; `spawnOwnedProcess(spec)` registers child/error/close immediately; `stopOwnedProcess(id)` bounded termination/escalation; `shutdownOwnedProcesses()` waits and reports survivors; `sweepOwnedOrphans(root)` deletes only marked stale temporary files | Explicit runtime/cwd/env/argv → owned process handle; no shell interpolation | Handle async spawn errors; do not confuse kill signal sent with process exited; no killing normal Chrome or unowned CDP browser |
| `core/cdp_session.js` — retain deferred boundary | Existing `resolveSystemChromePath`, `isIsolatedProfile`, `resolveRealProfileDir`, `isChromeRunning`, `probeCdp`, `ensureDebugChrome`, `getPage`, `start/stopCodegenRecording`, `executeSteps`, `runStepsThenPause`, `rewind`, `evalChain` remain inventoried | Currently supports optional flow; not the default manual-record owner | Do not revive private `_enableRecorder` as acceptance shortcut; reconcile/remove dead APIs only after whole-tree caller checks; don't certify CDP ownership or assertion equivalence without tests |

## 5. HTTP and browser presentation

`studio/app.js` (proposed) exports `createApp(services)` to mount middleware and grouped routers, without listening or hidden child launches. `studio/server.js` retains `startServer()` and `shutdown()` for env/path initialization, state ownership, service construction, loopback listen, ready signal and bounded shutdown. Route modules receive named services, not an unrestricted global mutable context.

| Proposed route file | Endpoints retained | Handler jobs |
|---|---|---|
| `studio/routes/workbook.js` | `/upload`, `/scan`, `/save-expected-result`, `/data-matrix`, `/env`, `/set-platform` | Validate request, call project service, return warnings/revision; own no canonical in-memory shadow |
| `studio/routes/mappings.js` | `/save-mapping`, `/mapping/:label`, `/preview/:label`, `/preview-scenario/:scenarioId` | Resolve explicit step references; compatibility labels accepted only if unambiguous; parse/save atomically; preview shared plan |
| `studio/routes/recording.js` | `/record`, `/codegen-result/:sessionId`, `/record-cancel` | Start/status/transfer/cancel adapter; errors and completion are explicit; preserve old clients during transition |
| `studio/routes/library.js` | `/action-db`, action/group create/delete, `/link-synonym` | Validate CRUD and canonical binding; do not duplicate ActionDB parsing or persistence |
| `studio/routes/runs.js` | `/run`, `/run-status`, `/run-cancel`, `/results`, `/restart` | Delegate lifecycle, expose manifest-based results; separate restart/reset semantics and ownership checks |
| `studio/routes/suggest.js` | `/suggest/status`, `/suggest`, `/suggest/reject`, `/suggest/accept`, `/suggest/cancel` | Preserve optional disabled feature boundary; no new AI behavior during manual MVP; use same lease and action validation when reactivated |

Each file has `createRouter(serviceDependencies)` plus named handlers for its endpoints. A handler only validates HTTP shape, calls the owner, and translates typed errors: validation 400, stale/busy 409, unsupported/missing resource with documented status, runtime failure 500. Record current actual response/status contracts before altering them; exact compatibility must be tested.

The HTML remains the accessible local shell. Proposed no-build ES modules are extracted one flow at a time after behavior is stable:

| File | Functions / responsibility |
|---|---|
| `studio/ui/api.js` | `request(path,options)` parses typed errors and attaches required per-launch local capability to mutations; `createPoller(fetchStatus,onUpdate)` owns one abortable bounded poll, stops on terminal/unmount |
| `studio/ui/workbook.js` | `uploadWorkbook`, `renderScenarios`, `saveExpectedResult`; shows warnings and stale-mapping conflicts |
| `studio/ui/recording.js` | `openRecording`, `renderRecordingStatus`, `importRecordedCode`, `saveMapping`, `cancelRecording`, `closeModal`; session-tagged updates and explicit transfer mode |
| `studio/ui/matrix.js` | `loadMatrix`, `addIteration`, `removeIteration`, `saveMatrix`; track dirty/save failure state, block Execute until durable save |
| `studio/ui/library.js` | `loadLibrary`, `openActionEditor`, `saveAction`, `saveGroup`, `deleteEntry`, `linkStep`; keyboard/select/drag paths call same binding action |
| `studio/ui/runs.js` | `startRun`, `cancelRun`, `renderRunStatus`, `renderResults`; render IDs/URLs from server; cancelled/missing evidence never green |
| `studio/ui/main.js` | `initialize`, `activateTab`, `dispose`; explicit event wiring, no duplicated timers or inline global handlers |

No bundler required. Introduce the modules only as tested migrations, retaining UI element IDs for existing tests. User values go into textContent/value, not interpolated HTML. All modules/assets must be served locally and included in the package.

## 6. Packaging, optional code and repository support

- `electron/main.js`: `startServerAndWindow()` retains launch responsibility; proposed `acquireSingleInstance`, `waitForServerReady`, `showStartupFailure`, `shutdown` handle lock, chunked ready output, boot timeout, server errors and children. A stdout chunk may split `STUDIO_PORT`; use buffered line parsing. Keep logs bounded.
- `start.js`: development launcher only; uses local runtime and prints actual URL; no download or public-browser dependency for testers.
- `playwright.config.ts`: consumes resolved runtime, `testDir/outputDir`, worker/headless controls and proper supported launch options; tests must prove configured executable really runs. No duplicate browser revision lists.
- `package.json` + lockfile: exact reproducible dependency/resource build contract and named commands. Removing `approve`, `scripts`, geckodriver or mobile dependencies requires caller/install-script/lockfile analysis first; no deletion asserted safe by this audit.
- `scripts/verify_distribution.js` (proposed): `inspectArtifact(root)`, `verifyRuntimeManifest`, `verifyBrowserExecutable`; fail build on missing/wrong OS resources or mismatched Playwright copies.
- `scripts/doctor.js` (proposed): `checkRuntime`, `checkWritableState`, `checkBundle`, `printDiagnostics`; offline actionable setup report, no secrets or changes.
- `core/llm.js`: retain `resolveProvider/buildRequest/complete`; `core/prompt.js`: retain `buildPrompt`. Deferred AI tests remain labeled optional. No keys/network calls on manual path.
- `tests/support/runtime.js`: `createTestRoots`, `startFixtureApp`, `startStudio`, `waitForReady`, `stopOwnedProcesses`, `removeTestRoots`; one environment boundary for Node tests. Existing standalone tests migrate in small batches.
- `tests/codegen_golden_test.js`: genuine source → parse → plan → emitted source checks with explicit expected action order/count; real runtime replay separately.
- `tests/fixtures/codegen/`: unedited synthetic-data recordings + manifest; test authors may not manufacture recorder evidence.
- `tests/acceptance/`: operator runbooks, native package matrix and evidence index. `TEST_RESULTS.md` remains runtime report; `defect.md` remains static QA report.
- `README.md`: maintainer entry/setup/checks. `RUN_GUIDE.md`: tester installation/recording/replay/errors. `AGENTS.md`: short invariants and verified lessons. `BRAIN/Index.md`: active plan entry. Historic plans remain marked historical, not silently erased.

The older [[Maintainer Reference]] and [[Server-Split]] retain the pre-extraction full named-function inventory. Their target layout is superseded by this document; existing functions not explicitly moved above remain where they are until a measured/verified reason justifies change.

## Implementation note — 2026-10-17

[[Implementation Progress]] records actual landed test support. The test-runtime owner currently lives in tests/run_all.js as startStudio/ping/waitForServer and returned stop(), not a new tests/support/runtime.js file. Reuse it rather than creating the proposed helper path for naming consistency alone. The new tests/upload_test.js workbook/main functions exercise real upload API behavior, not codegen. Production POST /upload received only a single-character defect fix; planned core module extraction has not begun.

## Final codegen delivery amendment — 2026-10-17

Gabriel Alvin authorized automatic delivery from the existing Playwright CLI `--output` file into AutoTest. The primary path is real manual recording in headed Playwright Chrome → owned recorder close → final file delivery into the review textarea → explicit save. Native Inspector clipboard transfer is an optional fallback, not a prerequisite for this automatic path. ComputerUse recording remains required realistic acceptance. This supersedes earlier plans requiring manual Copy/Paste as the only delivery proof.

The initial file is not final output: the baseline route consumed about:blank, deleted it and stopped UI polling while Playwright later wrote the actual navigation. Delivery must wait for the matching child close with success, retain repeatable final output without destructive read, and reject failed/cancelled sessions. Old callbacks/responses must not overwrite a new session or user-edited text. Results belong to a bounded session lifetime; preserve mappings until explicit validated save.

No new dependency, WebSocket service or browser-profile policy change is needed. Reuse the existing local HTTP polling route. Intermediate replay lacks this CLI output contract and must state the manual fallback honestly; this amendment does not certify intermediate export.

Required regression evidence: early file stays pending, late final write delivered exactly after successful close, repeated delivery survives a lost response, unknown/invalid session handling, failure/cancel rejection, stale A/B session isolation, UI user-edit preservation, and genuine headed navigation source arriving in AutoTest. Production deploy here means applying and testing the local repo change; native packaged distribution still requires its own installed-artifact gate.

Primary reference checked 2026-10-17: [Node child process close event](https://nodejs.org/api/child_process.html#event-close) documents close after process termination and stdio closure; [Playwright codegen](https://playwright.dev/docs/codegen) documents the real browser/Inspector recording workflow. Final-file equality remains a local runtime assertion, not a documentation-derived guarantee.

### Implemented final-output responsibilities

| File / function | Responsibility |
|---|---|
| studio/server.js — rememberCodegenSession(session) | Retain at most 20 session results under normal serialized recording; older retained results may expire when more recordings are started. Session IDs combine timestamp and a per-process sequence. |
| launchVisibleCodegen({targetUrl, outputPath, session}) | Attach the owned child, record running/failed/cancelled/completed state, capture final text only at successful close, then clean the temporary output file. The repeatable result lives in memory; HTTP reads do not consume it. Server restart clears retained results. |
| GET /codegen-result/:sessionId | Validate session ID; running stays pending and may carry a syntactically valid session-owned previewCode/previewVersion. Unknown IDs stay pending; successful completion returns final code; failure/cancel returns 409. No arbitrary filesystem read based on client paths. |
| POST /record-cancel | Mark matching session cancelled before killing the recorder so its late close cannot publish success. Child identity protects replacement-session ownership. |
| launchVisibleReplay / POST /record | Identify replay as manual-copy mode; no claim that page.pause creates a CLI export. Existing intermediate replay limitations remain explicit. |
| studio/studio-ui.html — startCodegenPoll / stopCodegenPoll | Scope timer/responses to session and modal operation; apply only newer provisional versions while open, finalize on successful completion, and preserve actual edits. Keep recording Save disabled until final completion. |
| openRecordModal / openManualModal / closeModal | Invalidate old operations and gate delayed preview/launch results. Input revisions distinguish real edits from simple focus. |
| codegen-retained / codegen-retained-source | Show evolving live and final generated text read-only when user edits must be preserved. Label provisional/final state clearly and render as text, not HTML. |
| tests/codegen_result_test.js | Supporting regression with injected child events and real route/UI functions plus isolated HTTP checks; it does not impersonate native recording evidence. |

Retention is per process and bounded by recording count, not a persistent recording archive. No persisted schema migration is introduced.

## Live preview amendment — 2026-10-17

Gabriel Alvin clarified that generated actions must appear in AutoTest while the tester uses the codegen browser. Close-only display does not meet that feedback requirement. The approved path is now: native manual recording → periodic live generated-source preview → successful owned recorder close → authoritative final capture → explicit save. This supersedes close-only display wording above, while preserving the rule that an early file is never a completed recording.

Reuse the existing 1.5-second polling route: running sessions stay ready:false and expose only syntactically complete session-owned preview snapshots with increasing versions. UI labels these provisional and disables recording Save until final completion. Skip partial writes and retain the last valid snapshot; never execute preview text. Final completion remains ready:true only after successful matching child close. Failure/cancel never finalize.

Actual user edits remain untouched; show the evolving live source and final source in a read-only section when needed. Scope preview versions, input revisions and render revisions to the modal/session so out-of-order polls and previous mappings cannot replace newer content. Manual/suggestion modal controls must reset normally. Intermediate replay export and full-workbook/installed-package gates remain separate.

Acceptance must observe actual generated navigation and a subsequent action appearing while the real recorder is still open, provisional status and disabled Save, then finalization on close. Supporting tests cover partial file writes, repeated/newer previews, stale response order, edited text, failed/cancelled sessions and modal control reset. Prior final-only native PASS is retained as baseline evidence, not live-preview acceptance.

Live-file source checked 2026-10-17: [Playwright ThrottledFile](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/recorder/throttledFile.ts) flushes updated generated content after a short throttle. The installed playwright-core/lib/coreBundle.js contains the same 250ms timer and recorder setContent calls. Reuse this existing output; do not patch Playwright or infer a product latency guarantee from the timer. The app polling interval adds delay and must be measured with actual recording.
