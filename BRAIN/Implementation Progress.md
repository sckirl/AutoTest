# Implementation Progress

CONFIDENCE: EXTRACTED
RELATIONS:
- implements::[[Engineering Plan]]
- validates::[[Recording Acceptance]]
- depends_on::[[Module Contracts]]
- depends_on::[[Engineering Audit]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: A test that restores developer files after success can still destroy them if it crashes; safe verification needs isolation before assertions.

### KEY FINDINGS:
- Current implementation begins with G0/G1 test safety, followed by G2 workbook intake.
- Every subagent launched for this implementation is explicitly gpt-6-luna with fresh scoped context. Earlier audit agents predate this preference.
- Harness-only environment changes cannot isolate tests that still hardcode repository files.

### PRIMARY SOURCES:
- [Playwright codegen](https://playwright.dev/docs/codegen) — VERIFIED accessible 2026-10-16; recorder evidence boundary remains unchanged.
- Local primary evidence: tests/run_all.js, individual tests, core/scenario_parser.js and source/command results from this implementation session, 2026-10-17.

### SIGNIFICANCE:
This is the current execution ledger. Planned contracts remain in Engineering Plan; only executed results below count as implementation evidence.

### GAPS/CONSTRAINTS IDENTIFIED:
The complete legacy suite remains unsafe until all direct file paths, process lifetimes and ports are reviewed/migrated. Real codegen and installed native-package acceptance remain open.

## 1. Active slices — 2026-10-17

| Slice | Current status | Scope |
|---|---|---|
| G0 | BASELINE PARTIAL | Installed versions and sample-workbook parser behavior measured; representative recording workbook candidate identified; real target and full RC/catalog reconciliation remain open |
| G1a | IMPLEMENTED / FOCUSED PASS | Isolated owned harness, dynamic ready port and awaited teardown; focused RED/GREEN checks |
| G1b batch 1 | IMPLEMENTED / FOCUSED PASS | Isolate four repo-mutating parser/compiler/library tests; keep existing assertions |
| G1b batch 2 | IMPLEMENTED / FOCUSED PASS | API and mutual-exclusion tests use owned isolated Studio; 63/63 and 4/4 |
| G1b batch 3 | IMPLEMENTED / CONFIGURED SUITE PASS | UI, relocation, fixture and journey isolation/port/cleanup updates; all 22 configured offline suites passed. Omitted replay remains a named G4 integration gap |
| G2 | IMPLEMENTED / API QA PASS; NATIVE PICKER OPEN | Independent upload/scan QA: seven assigned rows PASS, zero FAIL; headed UI file selection was programmatic, not native chooser acceptance |
| G3 baseline | PARTIAL REAL INTERACTION | Actual headed Record launch and native codegen fixture search observed; generated-source transfer/save/full replay remain unverified |
| G4 onward | NOT ACCEPTED | Intermediate recording, complete scenario replay and remaining plan gates |

## 2. G0 observed baseline

Commit e01c5f4 plus pre-existing dirty tree; source data and prior task files were hash-snapshotted before implementation. Platform darwin/arm64; Node v26.3.0; installed Playwright 1.62.1; Electron 44.4.3. These are measured installed versions, not a proposed supported-release matrix.

Read-only workbook parsing used the existing parser with AUTOTEST_STATE_DIR set to a fresh temporary directory; only scenario/step/warning counts were printed and temporary data was removed.

| Workbook | SHA-256 | Parsed scenarios | Steps | Empty scenarios | Warnings |
|---|---|---:|---:|---:|---:|
| orangehrm_blueprint.xlsx | 52a4cc5bd45a77b16039582f380dd5c18b78ff50e6b0f36f06138b2c2e1e7bdb | 1 | 5 | 0 | 0 |
| orangehrm_full_scenario.xlsx | 2067659c1128f762be8ca5b4714c1a1515862d1d779e6bc56b98232c8c26dc58 | 4 | 13 | 1 | 0 |
| practicetest_scenario.xlsx | e9cf158ff6dac3c07734c70fce06a5eaadabc5d04b7087968103388675835a0c | 4 | 15 | 1 | 0 |

The smaller orangehrm blueprint is the initial real-recording candidate. The empty scenarios in the larger samples are an open G6 preflight/parser concern, not evidence those workbooks are accepted. No credentials or raw test-data cells were logged.

## 3. Independent Luna test inventory

All files below were inspected; no whole-suite execution is authorized by this inventory alone. “Restores originals” is still repo-mutating and unsafe on interruption.

| Test | Initial classification / issue | Remediation |
|---|---|---|
| action_db_corruption_test | Hardcoded ActionDB, corruption backups in repo | G1b batch 1: private temporary state before module import |
| scenario_parser_test | Writes core blueprint; predictable tests temporary directory | G1b batch 1: mkdtemp and parser output root |
| trace_redaction_test | Writes blueprint/mappings/spec in core | G1b batch 1: private compiler inputs/output |
| mobile_compile_test | Writes blueprint/mappings/generated outputs in core | G1b batch 1: private roots and explicit child env |
| api_test | Shared server and hardcoded mappings/DB/upload/probe paths | Migrate paths/PORT and verify injected shared runtime |
| mutual_exclusion_test | Own server but repo files and fixed 3949 | Private runtime, dynamic owned port, awaited shutdown |
| ui_behavior_test | Own server inherits repo roots, fixed 3958 | Private runtime/profile and dynamic port; browser required |
| state_dir_test | Mostly temp, but one repo core output and fixed collision port | Remove repo-write case and isolate all child lifetimes |
| replay_mapping_test | Missing from suite; writes workbook/mappings/replay files and uses 3000 | Explicit isolated scope; cannot count as covered until actually included/executed |
| run_all_test | Fixed “dead” port, no harness isolation coverage | G1a: deterministic fixtures and ownership/lifecycle assertions |
| journey_test | Own temp roots, fixed 3996/3997, SIGKILL not awaited | Dynamic fixture/studio ports; awaited cleanup; synthetic mappings remain integration only |
| fixtures_smoke_test | Own fixture/browser, fixed 3999, SIGKILL | Owned fixture port/lifecycle; browser prerequisite |
| electron_test | Temporary userData, source Electron launch | Scrub inherited roots/env, native source boot only; not installed acceptance |
| llm_test | Conditional live call with inherited credentials | Offline runner scrubs provider credentials; live test remains explicitly separate |
| cdp_profile_test | Temporary roots with env mutation | Run own process and controlled env; retain profile-isolation assertions |
| sweep_test | Private mkdtemp | Safe focused candidate after import check |
| codegen_launch_test | Pure argument/env assertions | Safe unit; never recorder acceptance |
| interpolate_strict_test | Pure data helper | Safe focused candidate after import check |
| path_traversal_test | Pure path strings | Safe focused candidate |
| prompt_test | Pure prompt construction | Safe focused candidate |
| safe_chain_test | Pure AST safety | Safe focused candidate |
| tokenize_literal_test | Pure literal transformation | Safe focused candidate |
| human_workflow_test | Not in offline suite; shared 3000, repo results, external app | Keep external/manual scope explicit; isolate before execution |
| practice_workflow_test | Not in offline suite; shared 3000, external app/workbook | Same boundary |
| hitl_scenario_test | Not in offline suite; shared 3000/external services | Same boundary |
| record_replay_sit | Non-_test integration script, omitted, inspect before enabling | Separate explicit integration inventory |

## 4. Agent ownership

- luna_harness (gpt-6-luna): tests/run_all.js, tests/run_all_test.js and a support helper only if necessary.
- luna_test_inventory (gpt-6-luna): read-only full test inventory, then four-file G1b batch 1 implementation.
- Coordinator (Sol): integration, G2 reproduction/fix, documentation, evidence and final checks. No parallel writes to those agent-owned files.
- Fresh Luna QA is assigned after the candidate change is fixed; it receives observable scope, not a source-derived PASS argument.

## 5. Evidence updates

Implementation checks and their exact outcomes are appended here as each slice finishes. No claim of full suite, real-codegen or installed-package PASS is made by the initial baseline.

## 6. Implemented contracts and focused evidence

| Files | Functions / change | Executed evidence |
|---|---|---|
| tests/run_all.js | New exported startStudio({env,script,timeoutMs}) creates private state/data/results before spawn, starts with process.execPath/PORT=0, consumes its child ready signal, verifies liveness and returns {port,root,env,server,stop}; stop awaits termination before removal. ping/waitForServer handle unavailable/signalled children; runSuite/main pass controlled env to awaited suite children | Harness fixture writes to all three roots; actual Studio /suggest/status disabled despite inherited synthetic LLM settings; failed boot cleanup and shutdown verified |
| tests/run_all_test.js | main uses a held 404 endpoint (not a released port race), fixture child actual writes, signal liveness probe, controlled env and failed-start cleanup checks | Meaningful RED: fixture file write hit ENOENT because directories had only been named. GREEN after mkdir; reviewed endpoint reservation fix rerun PASS |
| tests/action_db_corruption_test.js | Existing corruption test now imports ActionDB only after private state setup; backup files and cleanup stay in temp | PASS; original corruption/backup assertions preserved |
| tests/scenario_parser_test.js | writeSheet and parser outputs use private mkdtemp state instead of repo backup/restore | PASS, including missing file, merged gap, duplicate ID/label, banner header |
| tests/trace_redaction_test.js | compile uses isolated state/env; removed obsolete repo backup logic | 7/7 PASS |
| tests/mobile_compile_test.js | compile output and stub validation use isolated temp paths; no real device claimed | 22/22 PASS compile/stub checks only |
| tests/api_test.js | run starts/stops owned Studio; req/upload use dynamic port; parser children use explicit argv/env and sample read-only input; probe under temp root | 63/63 PASS, Luna developer execution |
| tests/mutual_exclusion_test.js | main owns temp workbook/mappings/server; req uses actual dynamic port; awaited cleanup | 4/4 PASS, Luna developer execution |
| tests/upload_test.js | workbook(rows) creates synthetic binary fixture; main owns Studio and checks real multipart valid/invalid/missing/retention paths; stop in finally | RED: valid upload 400 with d is not defined. GREEN: UP-P01/P02/P03, UP-E01, UP-N02 and SCAN-P01; temporary roots removed |
| studio/server.js | Removed only the stray standalone d in POST /upload before parser invocation | Same actual HTTP reproduction now succeeds; no unrelated server refactor |
| TEST_SCENARIOS.md | UP-E01 strengthened from historic false-success description to 400 + preservation; UP-N02 added | Matches strict A0.6.2 contract, no failing expectation relaxed |

Additional root-run focused suites passed: safe_chain_test, interpolate_strict_test, tokenize_literal_test, codegen_launch_test, prompt_test and path_traversal_test. These are unit/source-generation checks, not actual codegen recording.

Loopback startup was initially blocked by sandbox EPERM; approved escalated runs used private test roots. A first real Studio startup also exposed missing harness directories. That was a real integration failure, not a valid upload RED; the upload RED was captured only after the harness correction.

Provider values must be explicitly blank in child env, not merely deleted: Studio's dotenv loader could refill deleted keys from a local config file. No actual provider request or real credentials were used in these checks.

No unsafe pre-change execution of the four repo-mutating tests was attempted. Their pre-change defect was established from hardcoded write paths; their retained behavioral assertions passed after isolation. The harness and upload defect each have explicit executed RED/GREEN evidence.

## 7. Configured offline suite completion and final review

`rtk npm test` completed with exit code 0: all 22 configured suite processes passed. No existing suite was removed; upload_test was added. The live LLM call was explicitly skipped because provider values were blank. Mobile checks were compiler/stub checks only, not Appium acceptance. Development Electron boot/shutdown passed; this is not installed-package proof.

Batch 3 actual changes:

- tests/state_dir_test.js: testEnv scopes each server/compiler/config CLI to private roots; spawnServer uses process.execPath; stopChild awaits exit; port collision uses a live owned dynamic port; --list no longer targets repo core; outdated no-Electron comment removed.
- tests/ui_behavior_test.js: main starts/stops its own isolated Studio and uses its announced port; 11/11 focused assertions passed.
- tests/fixtures_smoke_test.js: startFixtureServer reads the owned dynamic fixture port; stopServer awaits termination; all eight fixture pages passed.
- tests/journey_test.js: main owns isolated Studio and dynamically assigned fixture server; stopFixtureServer waits; existing 22 assertions passed including the repo-status preservation check. Inputs remain hand-authored integration mappings, not genuine recorded output.
- tests/fixtures/serve.js: numeric FIXTURE_PORT supports 0, emits actual FIXTURE_PORT= and retains the human-readable URL.
- README.md: replaced stale fixed-port-3000 harness instructions with isolated runtime/focused upload commands and realistic acceptance boundary.

A final static review found that standalone relocation checks could inherit provider settings. After the full-suite run, a new regression seeded only synthetic LLM settings and observed enabled:true (RED). testEnv now forces provider values blank, isolated profile and web platform, removes other provider API keys, and testDynamicPort no longer copies the full parent environment back over private roots. The same standalone relocation suite passed (GREEN). The post-review change affects test environment isolation only; the production upload candidate is unchanged.

Runtime/data/ignore/prior-task SHA-256 snapshots still match the implementation baseline. Syntax checks passed for all 15 changed/repaired scripts. Headed operator acceptance is tracked separately below and cannot inherit these PASS labels.

## 8. Realistic tester requirement — user amendment

Gabriel Alvin explicitly requires browser-use with headed Chrome and real clicks, with ComputerUse for native windows whenever available, including actual Playwright codegen browser/Inspector/terminal interaction. CDP-set file inputs, injected JavaScript handlers, API-seeded mappings and headless automation are supplemental, never substitutes for this primary acceptance gate.

The headed acceptance browser uses a new temporary stable-Chrome profile and explicit BU_CDP_URL; normal Chrome is not attached or modified. A sandbox-blocked browser-use daemon succeeded with approved local escalation. One Luna operator owns the GUI. Native picker remains unverified: ComputerUse initially selected normal Chrome, so the tester did not operate that window. The operator subsequently selected the separate bundled Chrome for Testing app, opened the real codegen target at the local search fixture, entered Carrot through native UI, observed five results narrow to one, and stopped recording through its toolbar. This proves actual browser interaction only; generated-source capture, transfer, mapping save and full replay do not inherit a PASS. Independent final evidence is recorded in TEST_RESULTS.md.

## 9. Independent runtime verdict — 2026-10-17

See TEST_RESULTS.md, final dated black-box pass, for literal requests/responses. Seven assigned upload/scan rows passed with zero confirmed contract failures, plus adjacent validation probes. Oversized upload rejects with HTTP 500 and a raw Multer HTML error: the catalog rejection contract passes, but clearer client-facing failure remains a usability concern. Invalid upload preserves the four contracted active data files; diagnostic warnings are outside that preservation contract.

The genuine headed/native codegen interaction reached the local fixture and changed its rendered results. No generated source was visible to the operator, and no mapping was transferred/saved or scenario replayed. Native file chooser and full recording MVP acceptance remain BLOCKED, not PASS. The fixture interaction is not a completed workbook scenario and is not proof that recording persisted. No handwritten mapping or synthetic source was substituted.

The operator stopped its isolated Studio after reporting. The coordinator stopped the owned fixture and temporary stable-Chrome supervisor. User data and prior task files retain their baseline hashes. No installed package, intermediate recording, full recorded workbook replay, upgrade, mobile device or real provider acceptance is claimed.

Cleanup verification: the independent tester confirmed the owned Recorder/Chrome for Testing process exited with Studio, and the named autotest-luna Browser Use daemon stopped. Unrelated processes were left untouched. Screenshots were observed in tool output but no standalone screenshot file was saved; the persistent evidence is the written runtime report.

## 10. Selected full-workbook copy/paste run — 2026-10-17

Gabriel Alvin selected orangehrm_full_scenario.xlsx and allowed programmatic file selection as setup. A fresh gpt-6-luna operator started an isolated Studio on port 52092 (owned PID 75276). API upload returned 200 with no warnings; scan exposed hierarchy HRM.A and runnable scenarios HRM.A.1–HRM.A.3, with seven unmapped steps. Record for Navigate to OrangeHRM in HRM.A.1 returned session 1792212027661. These are API observations, not native recorder acceptance.

The operator initially misreported the bundled browser as absent after a wrapped search returned no rows. Direct directory listing disproved that claim. Root independently confirmed the executable and CUA enumerated Chrome for Testing apps. Prevention: verify a suspected missing bundled dependency through its exact documented path before asserting absence; an empty wrapper result alone is insufficient.

Root took the exclusive desktop lease. Selecting the bundled Chrome for Testing by full path through ComputerUse returned: “Computer Use was not approved to use Google Chrome for Testing”. Native Copy → AutoTest Paste → save → workbook replay is therefore pending explicit app access, not established by the successful Record response. The access question was sent to Gabriel Alvin; no bypass or fabricated source was attempted.

Selected-workbook run cleanup: operator stopped supervisor 13302; owned PID 75276 absent, port 52092 closed and temporary runtime removed. Original workbook preserved. Resume from a fresh isolated runtime after native app access is enabled.

## 11. Repeated full-workbook native baseline — 2026-10-17

The selected workbook was uploaded into a new isolated Studio on port 53279. Native ComputerUse succeeded after binding the actual running chromium-1234 symlink path instead of the canonical chromium-1223 path. The real OrangeHRM login page rendered following native address-bar navigation. Native Inspector source selection/Copy remains unresolved; no terminal Copy/Paste pass is claimed.

A concrete failure replaced the earlier ambiguous export result: the AutoTest modal advertised captured code but displayed only about:blank, whereas the actual generated session file contained the OrangeHRM navigation and incidental keyboard actions. TEST_RESULTS.md contains literal observations. This establishes stale displayed capture, not its implementation root cause. No mapping was saved and full workbook replay was not run. Fix/retest the source presentation path before acceptance; do not suppress incidental actions or manufacture a clean recording.

Repeated-run cleanup: the isolated Studio supervisor was stopped and its temporary state removed; the test tab was closed. The selected original workbook was preserved.

## Final codegen delivery amendment — 2026-10-17

Gabriel Alvin authorized automatic delivery from the existing Playwright CLI `--output` file into AutoTest. The primary path is real manual recording in headed Playwright Chrome → owned recorder close → final file delivery into the review textarea → explicit save. Native Inspector clipboard transfer is an optional fallback, not a prerequisite for this automatic path. ComputerUse recording remains required realistic acceptance. This supersedes earlier plans requiring manual Copy/Paste as the only delivery proof.

The initial file is not final output: the baseline route consumed about:blank, deleted it and stopped UI polling while Playwright later wrote the actual navigation. Delivery must wait for the matching child close with success, retain repeatable final output without destructive read, and reject failed/cancelled sessions. Old callbacks/responses must not overwrite a new session or user-edited text. Results belong to a bounded session lifetime; preserve mappings until explicit validated save.

No new dependency, WebSocket service or browser-profile policy change is needed. Reuse the existing local HTTP polling route. Intermediate replay lacks this CLI output contract and must state the manual fallback honestly; this amendment does not certify intermediate export.

Required regression evidence: early file stays pending, late final write delivered exactly after successful close, repeated delivery survives a lost response, unknown/invalid session handling, failure/cancel rejection, stale A/B session isolation, UI user-edit preservation, and genuine headed navigation source arriving in AutoTest. Production deploy here means applying and testing the local repo change; native packaged distribution still requires its own installed-artifact gate.

## Final-delivery implementation candidate — 2026-10-17

The first candidate changed `studio/server.js`, `studio/studio-ui.html`, added `tests/codegen_result_test.js`, and included it in `tests/run_all.js` (23 configured suites). A meaningful RED restored the original route and observed ready:true for an early existing file; the candidate returned pending until successful owned child close. Focused injected-child/VM regression, actual isolated HTTP identifier checks, API 63/63 and UI behavior 11/11 passed. These are supporting checks, not native recording evidence.

The initial candidate also completed `rtk npm test` with exit 0. Static review then found focus-only text protection incorrectly discarded final output and an unguarded delayed manual-preview response could overwrite a later modal/user input. The candidate is being corrected and must be retested after those changes; the initial full-suite result does not certify them. Independent real headed QA remains pending.

### Final candidate verification

After the review fixes, the final `rtk npm test` run completed EXIT0 with all 23 configured suite processes. The focus-only regression was reproduced RED by restoring focus-based protection; the delayed manual-preview regression was reproduced RED by restoring unconditional assignment. Both pass with input-revision/modal identity checks. Edited content is preserved and final capture remains visible in a read-only details section; new modals clear that section. Static rereview found the two identified defects fixed and no further actionable blocker. Native recording/delivery/save QA is running separately; it cannot inherit the suite PASS.

### First genuine automatic-delivery pass and final ordering review

Independent QA used the selected full workbook, native Playwright Chrome navigation, native Quit, real result polling, and the AutoTest save UI. Session 1792213567329001 returned pending while alive, then final OrangeHRM navigation after successful close. Repeated final HTTP bodies were byte-identical. The modal showed that URL, Sync & Save Action succeeded, and mapping/scenario preview reflected the recorded navigation; the other four steps of HRM.A.1 remained unmapped. This proves one genuine action’s delivery/save, not full workbook replay.

Initial Studio UI setup used a browser opened by app path without an explicit temporary profile. QA reported that limit and moved to an explicitly temporary UI profile; the recorder profile and backend runtime were separately isolated. No normal Chrome profile was operated or cleared.

Further static review confirmed another ordering case: final insertion did not advance the input revision, allowing a very late previous-mapping preview to overwrite the final capture. A targeted correction and regression are required before the final acceptance report; the previous genuine pass remains evidence for its tested ordering only.

### Final preview-order correction

A deferred-response regression drove actual openRecordModal, delivered final capture first and released the original previous-mapping preview last. It failed RED when the old mapping replaced final output. Auto insertion now advances codeAreaRevision, invalidating that older preview. The same regression passed GREEN; codegen_result_test, UI behavior 11/11, inline-script parse and whitespace checks pass. Final runtime scope is being repeated on this frozen candidate; a full-suite run after this last one-line UI change is still pending.

### Final frozen candidate: genuine delivery and preserved edits

After separating Studio into a task-owned stable-Chrome temporary profile (explicit CDP endpoint) and keeping ComputerUse on the owned Playwright Chrome recorder, QA repeated the native flow on the final source. Session 1792214256562004 stayed pending while open; native Quit led to exact final OrangeHRM navigation, repeated identical result bodies, successful UI save and matching preview. Focusing without typing did not prevent insertion.

Session 1792214361781005 then exercised an actual typed editor change during genuine native recording. After successful close the user edit remained in the editable textarea, while codegen-retained-source displayed the genuine final navigation read-only. This closes the earlier E05 binding-related baseline blocker for the tested final version. No clipboard-generated substitute or fabricated recorder export was used. Remaining negative/delayed-preview runtime checks and the last full-suite verification are pending the final report.

## Live preview amendment — 2026-10-17

Gabriel Alvin clarified that generated actions must appear in AutoTest while the tester uses the codegen browser. Close-only display does not meet that feedback requirement. The approved path is now: native manual recording → periodic live generated-source preview → successful owned recorder close → authoritative final capture → explicit save. This supersedes close-only display wording above, while preserving the rule that an early file is never a completed recording.

Reuse the existing 1.5-second polling route: running sessions stay ready:false and expose only syntactically complete session-owned preview snapshots with increasing versions. UI labels these provisional and disables recording Save until final completion. Skip partial writes and retain the last valid snapshot; never execute preview text. Final completion remains ready:true only after successful matching child close. Failure/cancel never finalize.

Actual user edits remain untouched; show the evolving live source and final source in a read-only section when needed. Scope preview versions, input revisions and render revisions to the modal/session so out-of-order polls and previous mappings cannot replace newer content. Manual/suggestion modal controls must reset normally. Intermediate replay export and full-workbook/installed-package gates remain separate.

Acceptance must observe actual generated navigation and a subsequent action appearing while the real recorder is still open, provisional status and disabled Save, then finalization on close. Supporting tests cover partial file writes, repeated/newer previews, stale response order, edited text, failed/cancelled sessions and modal control reset. Prior final-only native PASS is retained as baseline evidence, not live-preview acceptance.

### Live-preview candidate implementation

`studio/server.js` now reads only the matching running session's output path, parses candidate snapshots with existing Acorn, and publishes previewCode/previewVersion while ready remains false. Invalid partial writes retain the prior valid preview. Final close delivery remains unchanged. `studio/studio-ui.html` applies newer live versions, tracks input versus render revisions, exposes read-only live/final source when edited, and blocks provisional Save. `tests/codegen_result_test.js` includes those supporting regressions.

New RED: the previous final-only route had no previewCode for an active recording; the candidate publishes valid snapshots. Focused checks passed, followed by all 23 configured suites (EXIT0). Review then found failed-launch Save and timeout recovery messaging inconsistent with final-only saving; that correction is in progress and must be verified before acceptance. Native live-preview QA has not started and prior native final-only results cannot certify it.

## 2026-10-21 continuation

Rechecked the existing codegen regression successfully. Fresh Luna static review confirmed negative-state Save blocking and identified a valid import-only partial-module preview gap; a narrowly scoped guard is being added before acceptance. The owned stable-Chrome UI profile/CDP endpoint from the previous run is still available; fresh backend runtime and ComputerUse live recording will be used. No whole-workbook or installed-package acceptance is claimed.

### Oct 21 frozen live-preview verification

The import-only prefix regression failed against the previous route, which replaced the valid preview with a bare import, and passed after hasPlaywrightTestBody validation. Invalid syntax and a syntactically valid but incomplete generator envelope now keep the last valid preview/version. Negative Save and recovery-state tests passed. Fresh static rereview found no remaining blocker.

`rtk npm test` completed EXIT0 with all 23 configured suite processes on this final candidate. Live LLM remained an explicit offline skip; mobile remained compile/stub only. Independent ComputerUse live-feedback QA is now running with fresh isolated backend state, selected full workbook, owned stable-Chrome UI CDP endpoint and separate owned native Playwright recorder. No live native acceptance claim is made before its report.

### Oct 21 genuine live feedback observed

Independent black-box QA used the selected full workbook and actual headed Playwright Chrome. Clean session `1792600176692003` exposed the genuine OrangeHRM navigation and native Username fill while the child remained open: HTTP 200, `ready:false`, `status:running`, `previewVersion:4`. The visible AutoTest modal showed the same two actions, provisional status and disabled Save. The actual screenshot is retained outside the repo. This is a bounded two-action delivery probe under one mapping label, not correct full-workbook mapping or replay. Earlier polluted captures from native-focus mistakes were discarded without saving; AGENTS lesson 24 records prevention. Native app-menu Quit then delivered `ready:true` with exactly the same two generated actions; repeated final reads matched. Explicit UI Sync & Save succeeded and `/scan` plus `/preview` confirmed the disposable mapping. Independent QA reports five scoped gates PASS, zero FAIL. Live edit preservation, partial-write/order/failure races remain automated coverage only in this pass; full workbook and installed-package gates remain open. QA stopped its isolated server and the coordinator stopped the owned temporary-profile UI browser. See the dated appendix in TEST_RESULTS.md for literal evidence.
