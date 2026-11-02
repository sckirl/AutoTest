# Change Log

**Purpose:** Concise, chronological record of repository changes and their
validation status. Newest entries are added at the top.

---

## 2026-10-21 — Resume live codegen feedback fix and acceptance

- Files: `BRAIN/CHANGE-LOG.md`, `BRAIN/Implementation Progress.md`, `AGENTS.md`, `blueprint.html`, `defect.md`, `TEST_RESULTS.md`; current candidate is `studio/server.js`, `studio/studio-ui.html`, `tests/codegen_result_test.js`. Recorded the verified import-only snapshot and native focus/selection lessons in AGENTS.md.
- Resumed the user-requested live preview while codegen stays open, preserving explicit finalization, edit protection and failure Save blocking. Fresh Luna static review and independent runtime QA assigned.
- Implementation: `studio/server.js` now verifies a generated Playwright test-body envelope before publishing live snapshots; `tests/codegen_result_test.js` covers valid import-only prefixes preserving the prior preview/version. The prior Save/failure/timeout corrections in `studio/studio-ui.html` were rechecked.
- Validation: import-only regression RED on old route and GREEN after guard; focused codegen/UI11, syntax and whitespace checks passed. Final `rtk npm test` EXIT0, all 23 configured suite processes. Fresh static rereview found no remaining blocker. Real live ComputerUse QA observed clean navigation and Username fill before close (session 1792600176692003), with provisional label and disabled Save. Native Quit delivered identical final source; repeated reads, explicit UI save and preview passed. Independent QA: five scoped gates PASS, zero FAIL; live races/edit-retention runtime reruns, complete workbook replay and installed-package acceptance remain open. Protected workbook/data hashes unchanged; BRAIN links, blueprint links/IDs and whitespace checks passed. Owned QA server and temporary-profile UI browser stopped.

---


## 2026-10-17 — User correction: show code live during recording

- Files: `AGENTS.md`, `BRAIN/Engineering Plan.md`, `BRAIN/Module Contracts.md`, `BRAIN/Recording Acceptance.md`, `BRAIN/Implementation Progress.md`, `TEST_SCENARIOS.md`, `blueprint.html`, `BRAIN/CHANGE-LOG.md`.
- `README.md` and `RUN_GUIDE.md` describe the new live/final workflow; implementation files/results are added below as completed.
- Close-only display did not meet Gabriel Alvin's expected feedback. Approved provisional live preview through the existing poll, followed by authoritative final capture on successful close and explicit save. Require valid session-owned snapshots, ordered versions, preserved edits, modal ownership and Save gating.
- Implementation: `studio/server.js`, `studio/studio-ui.html`, `tests/codegen_result_test.js` add syntax-checked session-owned live snapshots, ordered versions, input/render ownership, read-only live source and provisional Save blocking. Existing `tests/run_all.js` includes the regression. `defect.md` records independent review.
- Validation: previous final-only route RED lacked previewCode while recording; live candidate focused checks and 23-suite run EXIT0. Review then found failed-launch Save/recovery messaging inconsistent; correction pending. Final-only native delivery/save and edit retention in TEST_RESULTS.md remain baseline; fresh live native acceptance pending.

---


## 2026-10-17 — Approved final codegen file delivery architecture

- Files: `BRAIN/Engineering Plan.md`, `BRAIN/Module Contracts.md`, `BRAIN/Recording Acceptance.md`, `BRAIN/Implementation Progress.md`, `TEST_SCENARIOS.md`, `blueprint.html`, `BRAIN/CHANGE-LOG.md`.
- Primary delivery becomes final session-owned CLI output → AutoTest review → explicit save; native manual Copy/Paste is fallback. Reuse existing polling; do not consume early output. Preserve cancellation, failure, user-edit and session isolation. Intermediate replay and packaged release stay separate gates.
- Implementation files: `studio/server.js`, `studio/studio-ui.html`, new `tests/codegen_result_test.js`, suite inclusion `tests/run_all.js`, and `AGENTS.md` amendment. `README.md` and `RUN_GUIDE.md` now describe successful-exit delivery, preserved edits, replay fallback, and the existing bundled-browser preference accurately.
- Validation: original route RED ready:true on an early output versus candidate pending; focused regression/API63/UI11 GREEN. Initial 23-suite `rtk npm test` EXIT0. Static review then found focus-only final-output loss and delayed manual-preview overwrite; each received a specific RED/GREEN regression and fix. Final full 23-suite run EXIT0; static rereview found no further blocker. First real native recording → final delivery → UI save/preview passed with exact OrangeHRM navigation and repeatable HTTP output. A subsequent final-preview ordering review found a late previous mapping could overwrite automatic insertion; advancing the input revision fixed it with a specific RED/GREEN regression. Focused/UI11 pass after that last line; final runtime repetition and full-suite recheck pending. `defect.md` retains review findings/dispositions and `TEST_RESULTS.md` records runtime evidence.

---



## 2026-10-17 — Selected full-workbook native recording baseline exposes stale capture

- Files: `TEST_RESULTS.md`, `defect.md`, `BRAIN/Implementation Progress.md`, `AGENTS.md`, `blueprint.html`, `BRAIN/CHANGE-LOG.md`.
- Used `orangehrm_full_scenario.xlsx` unchanged in disposable isolated Studio. ComputerUse native navigation reached the actual OrangeHRM login page through bundled Playwright Chrome. Binding the actual running chromium-1234 symlink app path succeeded.
- Validation: intake PASS (API setup); real native navigation PASS; latest-source presentation FAIL (modal about:blank versus completed generated file OrangeHRM navigation). Native Inspector Copy → AutoTest Paste BLOCKED; complete workbook replay NOT RUN. No production code changed, no fabricated or saved mapping, no source-file read counted as native clipboard evidence. Exact observations retained in TEST_RESULTS.md.

---


## 2026-10-17 — Prioritize full-workbook native codegen copy/paste acceptance

- `BRAIN/Recording Acceptance.md`: records Gabriel Alvin’s selected `orangehrm_full_scenario.xlsx`, permits programmatic file selection as setup, and prioritizes native Playwright Inspector/terminal Copy → AutoTest Paste → save → scenario replay. Original workbook and existing project data are preserved.
- `BRAIN/Implementation Progress.md`, `blueprint.html`, `TEST_RESULTS.md`: outcome recorded after the isolated Luna operator run; prior blocked evidence retained.
- Cleanup: selected-workbook test supervisor stopped; owned server absent, port closed and temporary runtime removed. Original workbook preserved.
- `AGENTS.md`: verified lesson 18 records a false missing-browser conclusion from an empty wrapped search and requires exact-path checks.
- Validation: selected workbook API upload/scan and Record response succeeded in isolated Studio. Native copy/paste is BLOCKED: ComputerUse explicitly rejected access to the bundled Chrome for Testing app. App-access request sent; no native PASS or fabricated source. Workbook SHA-256 remains 2067659c1128f762be8ca5b4714c1a1515862d1d779e6bc56b98232c8c26dc58.

---

## 2026-10-17 — Execute G1 test isolation and G2 upload repair with Luna agents

### Changed

- `tests/run_all.js`: owned startStudio helper with pre-created temporary state/data/results, dynamic ready port, controlled offline env, signal/liveness checks, bounded readiness buffer, awaited shutdown and per-suite child completion. Added the new upload regression to the existing suite list; no prior suite removed.
- `tests/run_all_test.js`: meaningful fixture writes to all roots, real Studio provider-disable check, held-port not-ready check, signal exit and failed-start cleanup regression.
- `tests/upload_test.js`: new isolated real multipart regression covering valid persistence/scan, invalid and missing-file preservation, staging cleanup, mapping keep/reset and stale data reset.
- `tests/action_db_corruption_test.js`, `tests/scenario_parser_test.js`, `tests/trace_redaction_test.js`, `tests/mobile_compile_test.js`: private test roots replace repo mutation/restore; compiler children receive explicit isolated env; original behavior assertions retained.
- `tests/api_test.js`, `tests/mutual_exclusion_test.js`, `tests/ui_behavior_test.js`: own isolated Studio and actual dynamic port; private fixture/probe paths; awaited teardown.
- `tests/state_dir_test.js`: isolated standalone server/compiler/config paths and env, dynamic collision test, bounded awaited child cleanup; synthetic-provider regression forces disabled optional provider.
- `tests/fixtures_smoke_test.js`, `tests/journey_test.js`, `tests/fixtures/serve.js`: dynamic fixture ports, accurate machine/human URL output, awaited owned cleanup, preserved original fixture/journey assertions.
- `studio/server.js`: removed the pre-existing stray standalone d from POST /upload. This targeted repair restores that line to repository HEAD; the new upload regression records the local dirty-tree failure.
- `TEST_SCENARIOS.md`: corrected historical UP-E-01 false-success description to strict 400+preservation; added missing-file preservation UP-N-02. `TEST_RESULTS.md` receives independent runtime reports separately.
- `README.md`: current isolated harness/focused test instructions and realistic acceptance boundary.
- `AGENTS.md`, `BRAIN/Agent Personas.md`: explicit gpt-6-luna delegation, headed browser-use/ComputerUse requirement, resource-writing versus path-string testing lesson.
- `BRAIN/Implementation Progress.md` created; `BRAIN/Index.md`, `BRAIN/Engineering Plan.md`, `BRAIN/Module Contracts.md`, `BRAIN/Recording Acceptance.md`, `blueprint.html`: current file/function contracts, execution status, actual checks and open gates.
- `defect.md`: independent Luna static review/fix note; original ranked findings preserved. `BRAIN/CHANGE-LOG.md`: this entry.

### Validation

- Three explicit RED/GREEN sequences: missing harness directories (actual fixture write ENOENT → created roots), valid upload (400 d-is-not-defined → 200), standalone relocation provider leakage (enabled:true with synthetic settings → disabled).
- `rtk npm test`: EXIT 0; all 22 configured offline suite processes passed. Live LLM request deliberately skipped. Includes API 63/63, mutual exclusion 4/4, UI 11/11, trace 7/7, mobile compile/stub 22/22, journey 22/22, fixture pages and development Electron boot/shutdown. The post-review standalone env hardening was then verified by rerunning state_dir_test successfully.
- Existing behavior assertions retained; no existing suite or failing expectation deleted to obtain green. Historical catalog correction strengthens rejection/preservation.
- Independent Luna static review found no further test-isolation blockers after corrections; reviewer did not self-certify runtime behavior.
- Syntax checks passed for all 15 changed/repaired scripts; `git diff --check` clean at checks. User-data/ignore/prior-task SHA-256 preservation checks passed after the complete suite.
- Independent Luna runtime QA in `TEST_RESULTS.md`: seven assigned upload/scan rows PASS, zero FAIL. Headed upload used programmatic file selection; native chooser remains BLOCKED. Actual ComputerUse interaction in the bundled codegen browser searched Carrot and changed five results to one; generated-source transfer/save/full replay remain BLOCKED. No fabricated generated code or personal-profile interaction. Owned Studio, fixture and temporary stable-Chrome supervisor stopped after testing.
- Oversized uploads reject with raw HTTP 500/Multer HTML: catalog rejection passes, clearer user-facing error remains an open usability concern. No installed-package/mobile-device/real-provider acceptance is claimed.
- Cleanup verification: the independent tester confirmed the owned Recorder/Chrome for Testing process exited with Studio, and the named autotest-luna Browser Use daemon stopped. Unrelated processes were left untouched. Screenshots were observed in tool output but no standalone screenshot file was saved; the persistent evidence is the written runtime report.

---


## 2026-10-17 — Repo audit and manual-recording-first engineering plan

### Changed

- `BRAIN/Engineering Plan.md`: confirmed MVP, ordered G0–G12 backlog, dependencies, slice/release gates, rollback, offline setup/update and provisional workload characterization.
- `BRAIN/Module Contracts.md`: proposed file/function responsibilities, typed boundary objects, inputs/outputs/errors and protecting tests; extraction is conditional on demonstrated need.
- `BRAIN/Recording Acceptance.md`: exclusive ComputerUse operation of real browser/Inspector, genuine-code provenance, RC01–RC20, fresh-context independent QA and native-package acceptance.
- `defect.md` and `BRAIN/Engineering Audit.md`: 16 ranked source/probe findings, smallest fixes, plan mapping and explicit untested boundaries.
- `BRAIN/Plan Reconciliation.md`: previous plan/PRD/FigJam conflicts and their resolutions; unfinished `tasks/plan.md` and `tasks/todo.md` preserved and mapped to new gates.
- `blueprint.html`: current summarized plan with diagrams/tables and links to detailed BRAIN nodes; full previous PRD body retained as collapsed historical reference; local assets only.
- `AGENTS.md`: current direction and 16 verified maintenance/acceptance lessons; historical Electron/CDP claims explicitly qualified.
- `BRAIN/Index.md`, `BRAIN/Next Direction.md`, `BRAIN/Architecture.md`, `BRAIN/Agent Personas.md`, `BRAIN/Data-Driven Parameterization.md`, `BRAIN/Figma Plan.md`, `BRAIN/Maintainer Reference.md`, `BRAIN/Omnichannel Orchestration.md`, `BRAIN/Ponytail Audit.md`, `BRAIN/Security & Compiler.md`, `BRAIN/Server-Split.md`, `BRAIN/What Happened.md`, `BRAIN/Workflow & Execution.md`, `BRAIN/Zero-Trust Data Lifecycle.md`: current-plan precedence notice/graph metadata; prior bodies preserved; broken manual-only tester reference replaced with current orchestration.
- `BRAIN/CHANGE-LOG.md`: this entry; prior log entries retained verbatim.

### Validation

- Three read-only audit agents covered runtime/compiler, existing plans/distribution, and test/codegen evidence. Independent plan reviews corrected circular baseline gates, migration timing, unsafe legacy-suite assumptions, missing controller-boundary task and dependency labels.
- FigJam read through Figma MCP; official Playwright, Electron and Node references checked. Plan facts distinguish local dirty-tree source evidence, bounded parser probe and future runtime acceptance.
- Static documentation checks: all BRAIN wikilinks resolve; blueprint local links/anchors resolve; no duplicate HTML IDs or remote runtime assets; current conceptual nodes contain required source/confidence/relation/constraint fields.
- Browser document verification: rendered current blueprint at 1470px and 390px widths; page width equals viewport; wide tables scroll locally; eight current sections present; history collapsed. Desktop and mobile screenshots inspected. A favicon-only preview 404 was removed using a local data icon.
- Baseline SHA-256 checks preserve existing `studio/server.js`, `core/mappings.json`, `core/action_database.json`, `.gitignore`, `tasks/plan.md`, and `tasks/todo.md`. No application/dependency/data changes made by this planning pass.
- No application suite, live codegen acceptance, real target application or native installer was run/certified. The broad legacy suite requires harness and per-test isolation before use; current runtime defects remain open.

---

## 2026-10-08 — Add Maintainer Reference with every section/function contract

### Purpose

Provide 100%-clarity maintenance tables for humans and agents: every server
section/route/helper, all 50 UI handlers, and all core/Electron/config modules
with purpose, inputs/outputs, callers, invariants, tests, and safe-change
checklists. Follows best maintenance protocol: scope → read → preserve
contracts → one logical change → runnable check → narrow-to-broad validation →
black-box loop → changelog → diff review.

### Changed

- `BRAIN/Maintainer Reference.md` created (§1 protocol, §2 ownership/state,
  §3 server routes/helpers, §4 UI handlers, §5 core modules, §6 test map,
  §7–8 checklists/document rules).
- `BRAIN/Index.md` links the new reference.
- `BRAIN/CHANGE-LOG.md` updated for this change.

### Validation

- Source re-read before writing: full `server.js`, UI script `333-1760`,
  all `core/*.js`, `electron/main.js`, `playwright.config.ts`, `package.json`.
- Docs only; no application code touched.

---

## 2026-10-07 — Server-Split v2: every-function inventory, per-function chunk map

### Purpose

V1 mapped blocks; v2 maps **every function** (15 server fns, 31 routes, 50 UI
handlers, 30+ core fns) to its chunk after a per-file inventory, and rules on the
"one file per function" request: rejected as execution shape (50+ files = more
breakage surface), kept as inventory — chunks stay flow-grouped (10 files),
split further only past ~350 lines with zero shared mutable state.

### Changed

- `BRAIN/Server-Split.md` rewritten: §0 verdict, §2 per-function tables with
  line numbers + callers + move notes, §3 core/electron/config verdicts
  (incl. `cdp_session.js` as next split candidate), §4 UI 50-handler inventory
  (file stays single — air-gap contract), §6–8 slices/rules/done-when.
- `BRAIN/CHANGE-LOG.md` updated for this change.

### Validation

- Inventories pulled live: server routes/state/fns, UI 50 handlers,
  action_db 13 methods, cdp exports, line counts (4579 total).
- No application code touched; docs only.

---

## 2026-10-07 — Fill BRAIN from Figma board + blueprint PRD; add Server-Split plan

### Purpose

BRAIN stubs were stale (2026-08-14, pre-relocation claims) and missing the full
development plan. Rebuilt from the FigJam board (4 flows + red/blue alignment
marks), `blueprint.html` §1–14, and master code; added a file-by-file plan to
split `studio/server.js` (1391 lines, 31 routes) into a thin bootstrap + 4 flow
routers + lib without breaking cross-route mutexes.

### Changed

- `BRAIN/Index.md`, `Architecture.md`, `Workflow & Execution.md`,
  `Security & Compiler.md`, `Data-Driven Parameterization.md`,
  `Zero-Trust Data Lifecycle.md`, `Omnichannel Orchestration.md`,
  `Agent Personas.md`, `Ponytail Audit.md`, `Next Direction.md`,
  `What Happened.md` rewritten against verified master state.
- `BRAIN/Server-Split.md` created: 10-file target layout, exact line-move table,
  shared-`ctx` sentinel design, 6 abort-safe slices, scalability review rules.
- `BRAIN/CHANGE-LOG.md` updated for this change.

### Validation

- Load-bearing facts verified before writing: `action_db.js:9-10` (STATE_DIR),
  `package.json:68` (webdriverio kept), `server.js:47/73` (platform persisted),
  `.gitignore` (specs + transient artifacts), `electron/main.js` (userData fork),
  `grep` zero-matches for `updateActivity`/`sit_runner.js`.
- No application code touched; docs only (Figma board edits likewise need no
  code validation).

---

## 2026-10-07 — Restore Electron window creation for startup tests

### Purpose

GitHub Actions `test` failed in `tests/electron_test.js` because Electron never
created a browser window before waiting for the forked Studio server to emit
`STUDIO_PORT`, causing `electronApplication.firstWindow` to time out.

### Changed

- `electron/main.js` now creates `BrowserWindow` at startup before forking
  `studio/server.js`, restoring the expected startup flow.
- `BRAIN/CHANGE-LOG.md` updated for this fix.

### Validation

- `node tests/electron_test.js` (targeted regression for the failing job path).

---

## 2026-10-05 — Make reset reliable and keep configured Suggest available

### Purpose

Reset could leave the browser-side three-attempt Suggest counters in memory,
and the reset request was not checked before reloading the page. In addition,
the Mappings view disabled Suggest for later missing steps solely because an
earlier step was missing, even when the LLM provider was fully configured.
That made the button appear misconfigured when the actual provider status was
valid.

### Changed

- `studio/studio-ui.html` now clears Suggest attempt state after a successful
  fresh upload or reset.
- Reset now reports server failures instead of reloading as though the wipe
  succeeded.
- Suggest is disabled only when the provider is unavailable or that step has
  exhausted its three attempts. A configured provider no longer produces a
  misleading disabled button based only on step order.
- `studio/server.js` now clears any active Suggest session during reset so a
  stale session cannot block the next Suggest request.

### Validation

- Browser-script syntax validation is required.
- Server syntax and UI problem checks are required.
- The server still validates replay prerequisites and returns an explicit
  error if a requested step cannot be safely replayed yet.

---

## 2026-10-05 — Lock Suggest modal while the LLM is reasoning

### Purpose

The Suggest modal previously exposed editable code and clickable controls
while the server was still replaying context and waiting for the office LLM.
That made an intermediate state look like a completed suggestion and allowed
the analyst to trigger conflicting actions before Playwright code existed.

### Changed

- `studio/studio-ui.html` now marks the Suggest modal as busy while an initial
  proposal or retry is in progress.
- The modal textarea is read-only during that busy state, and close, cancel,
  paste, retry, accept, and save controls are disabled.
- The guidance banner and textarea placeholder identify the LLM reasoning
  phase as non-interactive.
- Once the server returns the final Playwright proposal, the textarea becomes
  editable and the review controls are restored. Manual editing remains
  available before acceptance.

### Validation

- Browser-script syntax validation is required after this UI-only change.
- Packaged desktop verification should confirm the controls unlock only after
  the Suggest response returns.

---

## 2026-10-05 — Automatically retry failed Suggest proposals

### Purpose

The first Suggest implementation executed and refreshed the page after a
proposal, but returned the first rejected proposal directly to the analyst.
That did not satisfy the agreed three-attempt workflow.

### Changed

- `studio/server.js` now retries rejected or non-executable proposals up to
  three times, rewinding and replaying preceding steps between attempts.
- `studio/studio-ui.html` records the server-reported attempt count so the
  affected Suggest button becomes disabled after the third failed attempt.
- Successful proposals and explicit `CANNOT_MAP` responses retain their
  existing behavior.

### Validation

- Syntax validation is required after this surgical server/UI change.
- Desktop black-box verification remains environment-blocked; packaged runtime
  behavior must be checked on a Windows desktop with Chrome available.

---

## 2026-10-05 — Save reviewed mappings, bounded suggestions, and expected results

### Purpose

Ensure the mapping review workflow preserves exactly what the tester edited,
while making AI suggestions finite and safe to retry. Add the Excel
Expected Result column as local review metadata without changing execution
semantics or the uploaded workbook.

### Changed

- `studio/studio-ui.html` now copies the exact textarea contents only after a
  successful mapping/accept save, then cancels the active recorder and closes
  the modal. Save failures leave the review open and visible. Accepted
  suggestions send the edited textarea to the existing accept route.
- Suggestion attempts are bounded to three per step; failed/cannot-map steps
  are disabled in the current mapping view. The existing provider-disabled
  state continues to use the disabled button styling. Existing CDP launch,
  preceding-step replay, proposal execution, and accessibility snapshot
  flow are reused; the accessibility tree is refreshed after execution.
- `core/scenario_parser.js` parses the optional Excel `Expected Result`
  column into each flow step. `studio/server.js` returns it as
  `expectedResult` from `/scan` and adds `/save-expected-result`, which
  updates only the local `blueprint.json`.
- Mapping rows render a closed-by-default review dropdown with an editable
  expected-result field. No compiler assertion or runtime execution behavior
  was added.

### Validation

- `node --check studio/server.js`
- `node --check core/scenario_parser.js`
- `node --check core/cdp_session.js`
- `node --check` was also run against the browser script extraction separately;
  no API keys or credentials were added.

---

## 2026-10-05 — Use installed Chrome for packaged execution evidence

### Purpose

The packaged Execute flow reported a result, but opening its evidence link
returned `Cannot GET /results/HRM_01/FINAL.png`. The underlying report showed
that Playwright failed before the scenario started because the packaged
configuration still selected the absent bundled Chromium executable. Since
packaged recording and replay already use installed stable Chrome when the
bundled browser is unavailable, execution needed the same environment flag.
Without this, `FINAL.png` was never created and the dashboard linked to a
nonexistent artifact.

### Changed

- Updated `studio/server.js` to set `AUTOTEST_SYSTEM_CHROME=1` for packaged
  execution when no bundled browser exists.
- Made the dashboard screenshot link absolute in `studio/studio-ui.html` so it
  consistently targets the Express `/results` mount.
- Imported the existing `core/cdp_session.js` module in `studio/server.js`.
  The Suggest route called `cdpSession.getPage()`, `executeSteps()`, and
  `rewind()` without defining that dependency, so every real Suggest attempt
  failed with `cdpSession is not defined` before the NVIDIA request could be
  used.
- Imported the existing `core/prompt.js` helper in `studio/server.js`. The
  Suggest route also called `buildPrompt()` without defining it; after the CDP
  import was fixed, this was the next deterministic runtime failure before the
  configured NVIDIA-compatible request could be sent.
- Limited the Suggest accessibility snapshot to 2,000 characters and bounded
  the OpenAI-compatible completion to 2,048 deterministic tokens. The configured
  NVIDIA reasoning model timed out on the full 7.5 KB snapshot but responded
  successfully to the bounded page context; this keeps the existing safe
  parsing/locator validation path intact instead of weakening it or retrying
  indefinitely.
- Kept the existing AST and `isSafeChain` validation while normalizing NVIDIA
  responses that include reasoning prose: only lines beginning with
  `await page.` are passed to the parser, and a prose-wrapped
  `CANNOT_MAP` is recognized as the explicit no-match result. This handles the
  configured model's response format without accepting arbitrary prose or
  executable code.
- Increased only the LLM request timeout from 30 seconds to 120 seconds. The
  NVIDIA reasoning model can take longer to finish a valid response for a real
  accessibility tree; the request remains bounded and still surfaces provider
  failures explicitly.
- Guarded the generated execution screenshot timing delay with the same
  catch-guard used for load-state waits. A timed-out test could close the page,
  then the `finally` block would throw a second `Target page ... closed` error
  and hide the original locator failure; this keeps execution diagnostics
  truthful without changing locator behavior.
- No API key or provider secret was added to source; Suggest continues to read
  `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` from runtime environment
  configuration.

### Validation

- Reproduced the original failure from the packaged Playwright report: the
  missing `DRIVERS/ms-playwright` executable prevented scenario startup.
- Syntax/problem validation and packaged runtime execution remain required after
  rebuilding.
- Suggest status and a real suggestion request must be verified against the
  configured NVIDIA-compatible endpoint before release.

---

## 2026-10-05 — Verify packaged replay across multiple scenarios

### Purpose

The replay-path fix needed runtime proof beyond a successful `POST /record`
response. The defect was scenario-sensitive: the first unmapped step used
Codegen, while later steps with mapped predecessors used a separate Playwright
replay child. Verification therefore had to exercise the packaged `.exe` and
cover more than one PracticeTest scenario.

### Validation

- Started `dist/win-unpacked/AutoTest Studio.exe`, not the development server.
- Submitted a second-step recording request for PT.1, PT.2, and PT.3.
- Each scenario returned HTTP 200 with `isReplay: true`.
- After cleaning up the existing PT.1 session, PT.1 was re-run and produced a
  visible window titled `Playwright Inspector -
  https://practicetestautomation.com/practice-test-table/`.
- `/record-cancel` was used after each probe; no replay spec remained in the
  packaged writable state directory.

This confirms that the corrected config handoff and state-relative spec
argument work across multiple scenarios in the packaged Electron runtime, not
only for the original first scenario.

---

## 2026-10-05 — Use packaged Playwright config for second-step replay

### Purpose

The first mapped step launched visible Codegen successfully, but recording the
second step followed a different path: `/record` generated a preceding-step
replay so the tester could return to the correct page state. The replay
launcher did not pass the Playwright config used by `/run`, even though the
Electron server and replay spec live outside the packaged app's normal working
directory. As a result, the replay child could report a session while failing
to discover or correctly configure the relocated spec. The first config-path
attempt still passed the replay file as an absolute path; Playwright resolves
test arguments relative to `testDir`, so that form was also not discovered.

### Changed

- Reverted the earlier replay-spec-only `test.use({ channel: 'chrome' })`
 workaround because it did not solve the packaged replay lifecycle.
- Updated `studio/server.js` to pass `--config` to replay and copy the
 packaged config beside the writable replay spec.
- Replay now passes only the state-relative filename, matching `/run`'s
 working form and Playwright's configured `testDir`.
- Added an environment-gated system Chrome channel to
 `playwright.config.ts`; replay sets it only when no bundled browser exists.
- Normal Codegen, test execution, and bundled-browser deployments remain
 unchanged.

### Validation

- The actual PracticeTest second-step request entered the replay branch and
 returned `isReplay: true`.
- The previous workaround was removed before applying this config-path fix.
- `npm run pack` completed successfully.
- The packaged `.exe` opened a visible replay Inspector after the config-path
  and filename corrections.

---

## 2026-10-05 — Verify visible Codegen from packaged Electron app

### Purpose

This entry closes the verification loop for the packaged recording workflow.
The intended tester experience is: click **Record** in the Electron UI, see a
visible Playwright Inspector/Chrome window, perform the action, close the
recorder, and paste or review the generated code in AutoTest. A successful API
response alone is not sufficient because the original defect was a missing
visible child window.

### Validation

- Rebuilt with `npm run pack`.
- Started `dist/win-unpacked/AutoTest Studio.exe`.
- `POST /record` returned HTTP 200.
- The packaged recording flow opened a visible Chrome window titled
  `Playwright Inspector - https://example.com/`.
- Cancelled the recording session successfully.
- This confirms the fix works through the actual packaged executable, not only
  through the development server or a direct Node command.

---

## 2026-10-05 — Use installed Chrome for packaged Playwright Codegen

### Purpose

The packaged application could start its Studio server and return HTTP 200 from
`/record`, but no Playwright window appeared. Directly testing the child
process exposed the real failure: Playwright attempted to launch its default
managed browser at
`%LOCALAPPDATA%\ms-playwright\chromium-1234\chrome-win64\chrome.exe`, while
this checkout did not contain the `DRIVERS/ms-playwright` browser bundle.
The existing `BROWSER_PATH` environment variable did not override the
Playwright CLI Codegen browser selection.

The correction uses the stable Google Chrome already installed on the tester's
machine when no bundled browser exists. This preserves the air-gapped goal
because it does not download a browser or require `npx`; it also preserves the
existing bundled-browser path for deployments that provide one.

### Changed

- Updated `core/helpers.js` so `buildCodegenArgs()` can add an explicit system
  browser channel to the Playwright CLI arguments.
- Updated `studio/server.js` so normal `/record` passes `--channel chrome`
  only when `BUNDLED_BROWSER` is unavailable.
- Bundled-browser environments retain their existing executable and do not
  switch unexpectedly to system Chrome.

### Validation

- Before the fix, direct packaged-child launch reproduced:
  `Executable doesn't exist at ...\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`.
- After adding `--channel chrome`, the direct packaged child remained running
  instead of exiting with the missing-executable error.
- A rebuilt `.exe` then opened a visible
  `Playwright Inspector - https://example.com/` window through `/record`.

---

## 2026-10-05 — Pass Chrome CDP settings into Electron server

### Purpose

The repository `.env` defined `AUTOTEST_CHROME_PATH` and
`CDP_DEBUG_PORT=9222`, but Electron forks the Studio server as a separate
process. Those settings were not guaranteed to cross that process boundary.
As a result, CDP could not reliably use the configured Chrome executable or
port when the application was launched from the packaged `.exe`.

### Changed

- Updated `electron/main.js` to load runtime environment settings before
  forking `studio/server.js`.
- The Electron child now receives `AUTOTEST_CHROME_PATH` and
  `CDP_DEBUG_PORT`, allowing the configured stable Chrome executable to launch
  with the configured remote debugging port when the CDP recording/suggestion
  path is used.
- Packaged builds read `.env` from Electron `userData`; development builds also
  fall back to the repository `.env`.

### Validation

- Independently launched the configured Chrome executable with
  `--remote-debugging-port=9222` and the isolated AutoTest profile.
- `GET http://127.0.0.1:9222/json/version` returned HTTP 200.
- Separately verified that normal `/record` originally used Playwright
  Codegen rather than CDP; this is why the Codegen-specific fix above was also
  required for the visible Record workflow.

---

## 2026-10-05 — Avoid unsigned Windows executable signing failure

### Purpose

Electron Builder was able to package the application until the final Windows
executable editing/signing stage. Because no code-signing certificate is
configured for this development build, Windows returned an `UNKNOWN` file-open
error for the generated `AutoTest Studio.exe`. The build needed to skip that
optional step while continuing to produce the unpacked application.

### Changed

- Set `build.win.signAndEditExecutable` to `false` in `package.json`.
- This project has no configured code-signing certificate. Electron Builder was
  failing while opening the generated `AutoTest Studio.exe` during its
  optional signing/editing step.

### Validation

- `npm run pack` completed after the setting was added and reported that
  executable editing and code signing were skipped.

---

## 2026-10-05 — Remove missing Playwright resource from Electron packaging

### Purpose

Electron Builder failed before packaging because `package.json` referenced
`DRIVERS/ms-playwright` as an `extraResources` source, but that directory was
not present in the repository. The reference was stale and prevented every
`npm run pack` attempt from reaching the application build stage.

### Changed

- Removed the obsolete `DRIVERS/ms-playwright` `extraResources` entry from
  `package.json`. The referenced source directory is not present in the
  repository, so Electron Builder failed with:
  `file source doesn't exist`.
- Added a mandatory change-log update rule to `AGENTS.md`.
- Corrected `core/action_db.js` so Electron resolves the Action Library from
  its writable `AUTOTEST_STATE_DIR`.

### Validation

- `tests/action_db_corruption_test.js` — PASS.
- Confirmed `DRIVERS/ms-playwright` is absent from the working tree.
- Confirmed the failure was a packaging-source error, not a runtime browser
  launch error.
- Electron packaging still requires a separately provisioned Playwright
  browser if the packaged runtime must remain fully air-gapped; this change
  removes the invalid Builder source reference but does not fabricate a
  browser binary.

---
