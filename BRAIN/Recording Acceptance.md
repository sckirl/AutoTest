# Recording Acceptance

CONFIDENCE: INFERRED
RELATIONS:
- validates::[[Engineering Plan]]
- validates::[[Module Contracts]]
- depends_on::[[Engineering Audit]]
GOD_NODES: [[[Engineering Plan]], [[Module Contracts]]]
SURPRISING_CONNECTIONS: A green parser test can coexist with a broken recorder; provenance connects the two without confusing their evidence.

### KEY FINDINGS:
- Current codegen launch test checks arguments, not visible recording.
- Existing journeys POST handwritten mappings; useful integration coverage, insufficient recording acceptance.
- Real ComputerUse codegen operation is a separate mandatory gate.

### PRIMARY SOURCES:
- [Playwright codegen](https://playwright.dev/docs/codegen) — VERIFIED accessible 2026-10-16: Inspector/browser recording and page.pause custom setup.
- [FigJam manual recording flow](https://www.figma.com/board/9KC30qRJbzAjk9VZihuDtS/AutoTest-Blueprint?node-id=0-3) — VERIFIED via Figma MCP 2026-10-16; nodes 1:991, 1:1036, 1:1063 cover gestures/copy/paste.
- Local evidence: `tests/codegen_launch_test.js`, `tests/journey_test.js`, `tests/electron_test.js`, `TEST_RESULTS.md`, `.claude/agents/blackbox-tester.md`.

### SIGNIFICANCE:
Defines exactly what counts as proof and who may produce it.

### GAPS/CONSTRAINTS IDENTIFIED:
This is a runbook. No case below is marked PASS by this planning pass. Native Windows, target app accounts, exact workbook and GUI tool availability must be recorded at execution time.

## 1. Roles and separation

| Role | Receives | May do | Output / gate |
|---|---|---|---|
| Coordinator/integrator | Confirmed intent, current plan, candidate diff | Select bounded scope; schedule agents; own shared docs and evidence inventory | Task ID, owned files, routes, scenario rows, expected outcomes, environment; no self-certified runtime PASS |
| Lead developer | Scope and reproducible findings | Edit one slice; add meaningful regression; run isolated focused checks | Behavior change, diff, exact commands/results, known limits |
| Static QA | Source/diff and contracts | Inspect trust boundaries, shared state and process/data lifecycle; safe bounded probes | Findings in `defect.md`, with static/probe/live labels; no silent patching |
| Independent black-box tester | Approved observable contracts, candidate build, selected workbook/fixtures, scenario IDs | Read catalog/runbook, execute live UI/API; one level of adjacent probing | Append literal evidence to `TEST_RESULTS.md`; never reads production source or fixes it |
| ComputerUse operator | Same behavior-only packet; exclusive desktop lease | Pointer/keyboard on real AutoTest, target browser, Inspector; launch terminal only as documented | Gesture transcript/screenshots, genuine generated code, result links; may be the black-box tester |
| Package/maintainer reviewer | Native artifact and documented offline kit | Inspect contents, install/update/rollback, execute complete journey | Per-OS/architecture report; source Electron run is not installed acceptance |
| PM/documentation reviewer | Tester guide, board contracts, result reports | Check comprehensibility, status accuracy and links | Required corrections, not substitute runtime approval |

Maximum four active agents including coordinator. For implementation use coordinator + developer + static QA + independent tester; packaging/PM reuses a free slot. Agents writing shared runtime files never run simultaneously. Static reviewers can inspect while developer waits, but acceptance runs only on a fixed candidate hash. One GUI operator at a time. Parallel test processes require separate state, ports and browser profiles.

The planning agents who read source are not eligible to claim fresh black-box independence for that same implementation review. Spawn the execution tester with fresh context containing the behavior packet and `.claude/agents/blackbox-tester.md`; do not pass the developer's arguments about why the code works.

Loop: freeze scope → developer reproduces and fixes → static QA → black-box full scoped run → fixes → repeat whole scope → PM evidence reconciliation → coordinator records completion. Required cases with FAIL/BLOCKED/NOT RUN hold their acceptance/release gate. Baseline evidence gathering may complete with recorded failures assigned to downstream fixes; no failed behavior is thereby accepted. Mobile rows are explicitly EXCLUDED; AI-network checks are deferred, not silently passed. After three identical environmental blocks, stop repeating the same attempt and record the exact prerequisite; continue independent plan work without claiming release readiness.

## 2. Evidence levels and record format

Every entry states **SOURCE INSPECTION**, **BOUNDED CODE PROBE**, **UNIT**, **API INTEGRATION**, **REAL CODEGEN**, or **INSTALLED PACKAGE**. These levels do not imply one another.

Evidence record: case ID, task ID, git commit plus dirty-diff hash, date, OS/arch, Node/Electron/Playwright/browser versions, workbook/fixture hashes, target origin, isolated state/results paths, owned process IDs, literal user gestures, expected versus actual, relevant request/response with secrets redacted, Inspector source hash, screenshots/artifact links, status and limitation. A passing negative test records the actual expected failure shown by AutoTest. Keep every repetition, including failures before a passing rerun.

Keep raw genuine code generated from synthetic credentials under `tests/fixtures/codegen/`, with manifest and exact capture instructions. Do not edit recordings to match parser behavior. Normalization for comparison, if needed, is a separate derived artifact with the transformation documented. Real application credentials or personal information stay in protected local evidence; use sanitized synthetic captures in Git.

## 3. Safe setup before recording

1. Record working tree state; do not overwrite current mappings/library/workbook. The current broad harness defaults to repository data, so G1a/G1b isolation precedes unattended `npm test`.
2. Allocate temporary state/data/results/profile paths and a fixture app port. Verify the ready signal and process identity; never attach to a stale server answering `/env`.
3. Use the bundled local runtime/CLI; never `npx` or runtime downloads. Record resolved executables. Configure no AI provider for offline manual tests.
4. Inspect the actual workbook and choose its acceptance rows. Check user-authorized application origin/test account. Local fixture journeys use synthetic data and are repeatable offline.
5. Confirm ComputerUse can see and operate AutoTest, browser and Inspector. If it cannot reach an external window, report BLOCKED for real codegen; do not substitute hidden Playwright calls or a fabricated recording. API tests can still run with their correct label.
6. Capture initial project generation and target state. Clear fixture target state through its documented test reset, not the tester's normal Chrome profile.

## 4. Realistic operator procedure

**User amendment — 2026-10-17:** use the browser-use skill with headed Chrome and real pointer/keyboard clicks. Use ComputerUse for native file selection and real Playwright browser/Inspector/terminal controls when available. Attach browser-use only to the explicitly owned temporary-profile CDP endpoint; do not enable debugging on or attach the normal Chrome profile. Programmatic file assignment, page.evaluate click/handler calls and headless journeys remain supplemental. [[Implementation Progress]] separates their results from headed operator acceptance.


1. Launch the same app/entry point the tester will use. Upload workbook through its file picker; observe scenario counts, warnings and mapping status.
2. Select the first scenario and first unmapped step. Click Record. Observe the target browser and Inspector opening, not merely an HTTP 200.
3. Through ComputerUse pointer/keyboard, perform navigation, input, click/selection and required assertion controls. Observe emitted code. Do not inject page actions or handwrite source to stand in for a recording.
4. Finish using the product's displayed transfer mode. For plain output-file recording, prove final output is stable after completion. For replay/pause recording, use Inspector Copy and paste into AutoTest as the board specifies. Copying genuine output is allowed; fabricated code is not.
5. Inspect the import preview for correct selected step and action order. Save through the UI. Confirm empty/unsupported input cannot overwrite a valid mapping. Restart and verify the mapping remains.
6. Repeat for the remaining steps. Re-map an intermediate step: observe predecessors execute, reach the expected DOM/login state, record only the replacement action, transfer and save. Confirm the final scenario contains each intended action once.
7. Enter Data Matrix rows in the UI, save and run the whole scenario. Verify the actual target state, assertion outcomes, exact step/iteration count and evidence. Open the screenshot/trace/result links.
8. Repeat with a different value, explicit blank, missing key, and deliberately failing assertion. Outcomes must distinguish successful validation of a negative business case from an actual assertion failure.
9. Repeat through restart, cancellation and a fresh process. Do not manually repair generated code to obtain the primary acceptance PASS; such edits are separate manual-editor feature tests.

**Workbook clarification — 2026-10-17:** Gabriel Alvin selected `orangehrm_full_scenario.xlsx` for realistic tests and explicitly de-emphasized native file selection. Use a temporary copy/runtime and preserve the original. Programmatic workbook selection is allowed setup for this scope; it does not block the primary gate. The essential operator evidence is actual Playwright Chrome interaction, Inspector/terminal Copy of genuine generated output, Paste into AutoTest, UI save, and workbook scenario replay. A local fixture remains supplemental if the workbook target is unavailable.

## 5. Required case matrix

These are new plan IDs, not claims that catalog IDs already exist. G0 maps them to exact `TEST_SCENARIOS.md` rows, adds missing rows and records adjacent probes.

| ID | Main concern / experiment | Required observable outcome |
|---|---|---|
| RC01 | First step codegen→save→restart→full replay | Genuine action and assertion persist and execute; no dropped steps |
| RC02 | Intermediate step with direct and library predecessors | Correct prior state, real Inspector recording, intended replacement only; no duplicate prefix |
| RC03 | Close/cancel before any action; child fails to spawn | Clear terminal message; no empty saved mapping; busy lock released only safely |
| RC04 | Codegen file appears before recording finishes; repeated result polling | No partial import; final source repeat-readable; ack/save does not lose output on network retry |
| RC05 | Two scenarios share a mapping but use different data | Each scenario uses its own data; literal tokenization never guesses ambiguous key |
| RC06 | Same label occurs twice within one scenario | Selection/remap identifies exact occurrence or blocks ambiguity explicitly |
| RC07 | Object/array selection, negative matcher, double click, popup, iframe, upload | Supported shapes faithfully execute; unsupported shapes reject whole save with location; essential workbook shapes must become supported |
| RC08 | Missing mapping, empty action list, unknown action, no test cases | Preflight failure naming scenario/step; no runnable stale spec or green result |
| RC09 | Value, explicit blank, absent key, corrupt matrix, 0/false | Value/blank preserved; absent/corrupt data diagnosed; no silent fallback |
| RC10 | Predecessor assertion/action fails | Failure identifies predecessor and blocks new step mapping; resolve existing catalog expectation for Inspector recovery before changing contract |
| RC11 | Cancel A, immediately request B, delayed A close/timer | B is neither cleared nor completed by A; cancelled report/evidence stays attributable to A |
| RC12 | Record/run double click, workbook edit during active session, second instance | Busy/stale conflict is visible; snapshot and ownership protected |
| RC13 | Persistent network traffic + delayed DOM + assertion failure | Bounded readiness/evidence capture; primary failure preserved; screenshots show intended state |
| RC14 | `PT.1`, `PT-1`, quotes, Unicode, long/duplicate display IDs | Validated source and unique artifact identities; correct links and counts |
| RC15 | Library create/edit/group/link/delete via UI and restart | Canonical state persists; scan/preview/replay/run agree; real drag gesture separately if retained |
| RC16 | Interrupt workbook replace or state write; disk full/read-only | Last committed generation remains usable or explicit recovery offered; no silent reset |
| RC17 | Rerun, restart, nested report suites, missing report/artifact | No stale evidence masquerading as latest; exact counts, durable IDs, errors visible |
| RC18 | Native installed artifact, no Node/npm/cache/internet | Upload/record/replay works from supplied resources; actual artifact inspected |
| RC19 | Upgrade with existing mappings/library/matrix/results; rollback | Data preserved; compatible migration or clean rejection; matching backup restores old app |
| RC20 | Larger workbook, data rows, workers 1/2/4 | All expected work accounted for; measured latency/memory/disk; no scenario-step reordering |

## 6. Tests supporting, not replacing, operator acceptance

- Keep `codegen_launch_test.js` as a launch-argument unit test; rename its claim in reports.
- Add actual captured golden cases and parser rejection tests, then execute generated plans against local fixtures. Existing handwritten tests remain useful independent tests.
- Run `replay_mapping_test.js`, tokenization, strict interpolation, safety, parser, paths, mutual-exclusion and library corruption checks through the isolated suite inventory.
- `tests/electron_test.js` remains development Electron boot/shutdown coverage. Add release checklist that launches the actual built/installed artifact.
- Check `node --check` only for syntax. The stray upload `d` demonstrates valid syntax can still fail on first request.
- Full suite passes cannot waive a failing codegen gesture, required packaged case or incorrect negative outcome.

Existing commands (execute only after isolation review): `rtk npm test`, `rtk npm run fixtures:serve`, `rtk node tests/codegen_launch_test.js`, `rtk node tests/journey_test.js`, `rtk node tests/electron_test.js`, `rtk npm run pack`, `rtk npm run dist`. They have different evidence meanings; building an artifact is not testing it.

## 7. Offline/native and recovery matrix

Run on each advertised OS/architecture with a non-admin account, no Node/npm, no developer browser cache, installation path containing spaces/non-ASCII, read-only app resources and writable user data. macOS success does not certify Windows. Test disconnected internet with local fixture target first, then explicitly allowed intranet target. Inspect/deny outbound connections across Electron, codegen and runner processes; a route interceptor on one page proves only that page's behavior.

Missing browser, unavailable target, profile already owned, disk full, locked state and unsupported schema each need an actionable tester error. Preserve normal Chrome and the AutoTest profile. Upgrade/rollback evidence includes before/after hashes and logical record counts, not only installer exit status.

Required cases must all PASS on the candidate. Three consecutive full journeys plus restart is a proposed stability sample; retain failures and state limitations. Required blocked cases prevent release, while independent completed work remains recorded honestly.

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
