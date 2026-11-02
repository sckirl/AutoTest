# AutoTest Studio Maintainer Reference

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

> **Audience:** human maintainers and coding agents. Read this before editing a function.
> **Source baseline:** master, inspected 2026-10-08. Source locations are current-file
> line references; they will change after the planned server split. The authoritative
> split map is [[Server-Split]].
>
> **Purpose:** explain what every section and named function does, what it receives,
> what it returns or changes, what must never change, and which checks protect it.
>
> This is a maintenance contract, not a second implementation. If this document and
> the source disagree, stop and update the document only after verifying the source and
> adding a CHANGE-LOG entry.

## 1. How to use this document

| Situation | Read first | Safe next action |
|---|---|---|
| Changing a server route | §3 route table, then the route's shared helpers | Preserve status codes, JSON keys, guard order, and file-store behavior; run the route's listed tests |
| Moving a function during the server split | [[Server-Split]] + this function's row | Move the whole contract first; do not rename or improve logic in the same move |
| Changing a locator/parser rule | §6 compiler/parser tables + `tests/safe_chain_test.js` | Add or update a focused regression before changing the rule |
| Changing data or file paths | §2 state table + §7 lifecycle table | Use the existing `AUTOTEST_*` roots; test both direct Node and packaged/Electron paths |
| Changing the UI | §5 UI table + affected route row in §3 | Keep user data in `textContent`/`.value`; preserve the no-build, vanilla-browser contract |
| Deleting code | [[Ponytail Audit]] | Prove it has no callers, no lifecycle side effect, and no packaged-runtime role; delete only after targeted validation |
| Adding a dependency | `package.json`, AGENTS.md air-gap rules | Do not add it for a stdlib/native feature; pin the version and explain why offline bundling needs it |

### Required maintenance protocol

1. **Establish scope:** identify the section, function, caller, state files, and user-visible route/tab.
2. **Read before editing:** inspect the whole function and its direct callers. Do not patch from a grep line alone.
3. **Preserve contracts:** input validation, error status, response shape, file path roots, mutex ordering, and security checks are behavior.
4. **Make one logical change:** avoid mixing a move, refactor, behavior change, and cosmetic cleanup.
5. **Leave one runnable check:** a focused existing test or a small assert-based test for non-trivial logic.
6. **Validate from narrow to broad:** syntax → focused test → relevant workflow → full `npm test` → packaged smoke when packaging/path code changed.
7. **Run the black-box loop:** after changes to `studio/server.js`, `core/*.js`, or `studio/studio-ui.html`, the user manually assigns the Black-Box Scenario Tester the touched `TEST_SCENARIOS.md` rows and adjacent probe.
8. **Log the change:** append newest entry to `BRAIN/CHANGE-LOG.md` with date, files, description, and validation.
9. **Review the diff:** confirm no generated runtime files, secrets, traces, or user data were staged.

### Change categories

| Category | Meaning | Required validation |
|---|---|---|
| Move-only | File location/import changes; behavior must remain byte/contract equivalent | `node --check`, route inventory diff, focused regression, full tests |
| Safe refactor | Same external behavior; internal duplication/shape changes | Move-only checks plus focused test for the refactored seam |
| Behavior change | User-visible or persisted behavior changes | Requirement/blueprint row, regression test, black-box rerun, changelog |
| Security change | Trust boundary, parser, path, process, or credential handling | Adversarial test, focused security tests, black-box failure proof |
| Packaging change | Electron, asar, writable paths, child process, browser resolution | Direct server + packaged build/startup + platform-specific smoke |

## 2. Runtime sections and file ownership

### 2.1 Ownership table

| Section | Current location | Responsibility | Owns state? | Does not own |
|---|---|---|---|---|
| Dependency/bootstrap | `studio/server.js:1-62`, `core/helpers.js:5-39` | Load `.env`, locate bundled dependencies, prepend local module path before requiring bundled packages | Process environment and module resolution | Business routes |
| Writable-path context | `studio/server.js:36-47` | Resolve state, upload, result, mapping, runtime-data, and platform files | Paths only | Route behavior |
| Process lifecycle | `studio/server.js:64-94,234-239` | Track child processes and stop them on server shutdown | `trackedProcesses` | Tester Chrome CDP process (must outlive server) |
| Browser/codegen launcher | `studio/server.js:125-232` | Resolve Chromium, build codegen/replay child commands, track and release children | `activeCodegen` | Test-runner cancellation |
| HTTP app/middleware | `studio/server.js:241-325` | Express app, CORS, JSON, static files, multer, root/results pages | None beyond request-local upload | Scenario/mapping semantics |
| Intake and platform | `studio/server.js:326-476,1286-1304` | Upload/parse, matrix, scan, expected result, platform context | Blueprint, matrix, platform state | Mapping execution |
| Record and mapping | `studio/server.js:478-678,1214-1346` | Record/replay, parse/save mappings, preview, record cancel | Mapping file and codegen sentinel | Test-runner lifecycle |
| Suggest | `studio/server.js:945-1156` | Optional LLM proposal, safe parse, replay, retry, accept/reject/cancel | Suggestion sentinel | Required-path execution |
| Action Library | `studio/server.js:1158-1212`, `core/action_db.js` | CRUD actions/groups, synonym linking, mapping cache sync | ActionDB + mapping cache | Excel parser semantics |
| Execution | `studio/server.js:682-876,1306,1334-1346`, `core/compiler.js` | Compile and spawn web/mobile execution, status, cancel, reset | Run/runner sentinels and results | UI rendering |
| Vanilla UI | `studio/studio-ui.html:333-1760` | Five tabs, modals, fetch calls, DOM rendering, polling | Browser-local selection and suggestion counters | Canonical persisted data |
| Electron shell | `electron/main.js` | Create window, fork server in writable userData, load announced port, terminate child | Window and child process | Server routes |

### 2.2 State and file contract

| Store/path | Owner | Consumers | Lifecycle rule |
|---|---|---|---|
| `AUTOTEST_STATE_DIR/blueprint.json` | Scenario parser | scan, previews, record, suggest, compiler | Rebuilt after valid upload and at boot if workbook exists |
| `AUTOTEST_STATE_DIR/blueprint_warnings.json` | Parser CLI wrapper | upload/run error reporting | Deleted before parse; contains warnings or `{error}` |
| `AUTOTEST_STATE_DIR/mappings.json` | save/link/suggest accept | scan, preview, replay, compiler | Reset on fresh upload/restart; ensure `{}` when missing |
| `AUTOTEST_STATE_DIR/action_database.json` | `ActionDB` | library, scan, replay, preview, compiler | Survives workbook reset; corrupt file is backed up before replacement |
| `AUTOTEST_STATE_DIR/runtime_data.json` | Data Matrix POST | compiler/replay/suggest | Explicitly deleted on upload and restart; `{}` means default single iteration |
| `AUTOTEST_STATE_DIR/platform_state.json` | `/set-platform` | boot + `/env` | Only `web`/`mobile`; invalid values rejected |
| `AUTOTEST_DATA_DIR/scenario_uploaded.xlsx` | upload route | parser/scan/run | Replace only after parse succeeds |
| `AUTOTEST_RESULTS_DIR/` | runner/compiler | dashboard/results index | Stale report cleared before run; restart removes results |
| `AUTOTEST_STATE_DIR/replay_*`, `codegen_*` | record/replay | codegen poll/runner | Startup sweep and close/single-read cleanup; always gitignored |
| Electron `app.getPath('userData')` | `electron/main.js` | all writable env roots | Never write into `app.asar`; child cwd is userData |

## 3. `studio/server.js` — sections, functions, and route contracts

### 3.1 Bootstrap and module state

| Function/section | Current lines | Purpose | Inputs/outputs | Shared state or side effects | Maintenance rules |
|---|---:|---|---|---|---|
| `.env` + driver bootstrap | 1-34 | Load local runtime environment and make bundled modules resolvable before `acorn`, Express, XLSX, or multer are required | Process env; no return | Mutates `module.paths`, `NODE_PATH` | Must run before any bundled dependency require; preserve Electron `RESOURCES_PATH` bridge |
| Path constants | 36-47 | Define read-only code root separately from writable state/data/results roots | `AUTOTEST_STATE_DIR`, `AUTOTEST_DATA_DIR`, `AUTOTEST_RESULTS_DIR` | Provides canonical file paths | Never replace with `__dirname` writes; this is the packaged-app boundary |
| Playwright CLI resolution | 49-62 | Find the CLI through Node resolution first, then dev/DRIVERS fallbacks | Module resolver/filesystem | Sets `PLAYWRIGHT_CLI` once | Keep `require.resolve` first; packaged asar layout is not a dev path |
| `cleanupAll()` | 82-91 | Stop all server-owned child processes on SIGINT/SIGTERM and exit cleanly | No args; process signal | Kills every `trackedProcesses` member; currently also checks dead `globalBrowser` | Never add CDP Chrome to `trackedProcesses`; do not kill the tester's browser |
| SIGINT/SIGTERM registration | 93-94 | Route OS shutdown into `cleanupAll` | Process signals | Installs global handlers once | Register once in bootstrap, not per router |
| `isPackaged()` | 109 | Detect asar packaging using server file location | None | Boolean | Do not use `process.execPath`; Electron helper binary is not Node |
| `runNodeScript(relScript,args)` | 110-123 | Run parser/compiler children in dev Node or packaged Electron-as-Node mode | Relative script + argv array | Child process; writes state through child | Keep `execFileSync`, `shell:false` behavior and writable `cwd`; never interpolate a shell string |
| `getBundledBrowserPath()` | 130-159 | Find an executable bundled Chromium using platform/architecture-first candidates | Process platform/arch + filesystem | Logs selected/fallback path | Keep OS-first ordering and fallback list; result is cached in `BUNDLED_BROWSER` |
| `getBrowserEnv(extraEnv={})` | 165-177 | Produce common environment for codegen, replay, and Playwright runs | Extra env object | Adds browser paths and skip-download flags | Merge caller values without dropping `AUTOTEST_*`, `NODE_PATH`, or packaged flags |
| `launchVisibleCodegen({targetUrl,outputPath})` | 179-204 | Spawn visible Playwright Codegen against isolated profile and write generated JS | URL + output file | Adds child to tracking; sets/clears `activeCodegen`; close logs | Set sentinel before/at spawn; preserve close cleanup and no shell |
| `launchVisibleReplay({specPath})` | 206-232 | Spawn headed Playwright replay spec for preceding mapped steps | Replay spec path | Tracks child; sets/clears codegen sentinel; deletes replay spec on close | Packaged config copy and `--headed` are required; never merge with runner cancellation |
| Process exit hook | 234-239 | Last-chance browser close hook | Process exit | Attempts `globalBrowser.close()` | Candidate for deletion only after proving `globalBrowser` is never assigned; log separately |

### 3.2 HTTP setup and results

| Function/route | Current lines | Purpose | Contract | Maintenance rules |
|---|---:|---|---|---|
| `express()` + middleware | 241-256 | Create API/static app, JSON parser, CORS allowlist, multer staging | Requests from localhost; upload ≤5 MiB | Keep `.xlsx` enforcement at UI/parser boundary and per-request random staging names |
| `GET /` handler | 257 | Serve the single vanilla UI | Returns `studio-ui.html` | No remote scripts/CDN; preserve air-gap |
| `GET /results` handler | 258-325 | Render a dependency-free directory index of scenario folders/artifacts | No args; HTML response or 500 | Escape folder/file names before interpolation; keep static `/results` links and no path traversal |

### 3.3 Intake and persisted test definition

| Route | Current lines | Purpose | Input | Success | Failure/side effects |
|---|---:|---|---|---|---|
| `POST /upload` | 326-365 | Validate and parse a workbook, then atomically make it active | multipart field `excel`; `keepMappings` | `{message,warnings}`; active workbook replaced | 400 on parser error; staging removed; old workbook remains; runtime data wiped only after parse succeeds; mappings wiped when keep=false |
| `GET /data-matrix` | 367-372 | Read current iteration overrides | None | JSON object, `{}` if missing | 500 on invalid/unreadable file |
| `POST /data-matrix` | 374-396 | Validate and persist scenario→iteration arrays | JSON object `{scenarioId: [iterObj]}`; `{}` clears | `{message:"Saved."}` or `{message:"Cleared."}` | 400 on non-object/array values; 500 on write failure |
| `GET /scan` | 398-453 | Join blueprint + mappings + ActionDB into row status, scenario list, and harvested variables | Files on disk; no body | `{steps, scenarios, scenarioVariables}` | 400 on parse error; ensures `mappings.json`; never re-implements parser loop |
| `POST /save-expected-result` | 455-476 | Persist editable expected result into blueprint row | `{scenarioId, label, expectedResult}` | `{message}` | 400 on bad shape; 404 when blueprint/step missing |
| `GET /env` | 1286 | Report active platform | None | `{platform}` | Must reflect persisted server state, not UI localStorage alone |
| `POST /set-platform` | 1291-1304 | Change and persist web/mobile context | `{platform:"web"|"mobile"}` | `{message}` | 400 on other values; writes `platform_state.json` + env |

### 3.4 Record, mapping, preview, and record cancellation

| Function/route | Current lines | Purpose | Input | Success | Failure, guards, and side effects |
|---|---:|---|---|---|---|
| `CDP_MESSAGES` + `cdpErrorMessage(e)` | 480-492 | Map typed CDP failures to tester-safe copy | Typed error with `code` | Safe string; verbatim only for `UNSAFE_LOCATOR`/`REPLAY_ASSERT_FAILED` | Full error logged server-side; never send stacks to UI |
| `cdpErrorStatus(e)` | 494-498 | Map CDP failure to HTTP status | Typed error | 409 profile-locked, 503 Chrome-missing, else 500 | Keep in sync with message map |
| `POST /record` | 500-623 | Start replay-before-record or visible codegen for one step | `{label, url, scenarioId, platform?}` | `{sessionId, isReplay, message}` | 409 if codegen busy or run compiling/running; 400 for mobile/unknown platform; replays mapped predecessors first; replay spec deleted after use |
| `GET /codegen-result/:sessionId` | 627-645 | Single-read delivery of codegen output polled by UI | Digit-only session id | `{ready:false}` or `{ready:true, code}` | 400 on non-digit/traversal; file deleted after first successful read |
| `POST /save-mapping` | 648-678 | Parse pasted/recorded code and persist structured steps | `{label, code, scenarioId?}` | `{message:"Saved."}` | 400 on empty label/code or Acorn failure; tokenizes literals against scenario Data when known |
| `GET /mapping/:label` | 1215-1231 | Return stored structured steps for one label | URL-encoded label | `{mapping}` or `{mapping:null}` | mappings.json first, ActionDB fallback; 500 only on unexpected failure |
| `stepsToLines(steps)` | 1236-1247 | Render stored steps as readable Playwright lines | Step array | String array | Shared by both preview routes; unknown types become comments, never executable guesses |
| `GET /preview/:label` | 1249-1263 | Preview one mapped step | URL-encoded label | `{code}` | `// Not mapped yet` when absent; 500 on unexpected failure |
| `GET /preview-scenario/:scenarioId` | 1266-1283 | Preview all steps in execution order | URL-encoded scenario id | `{code}` with per-step headers | `// NOT MAPPED YET` markers; missing blueprint/scenario returns explanatory comment, not 500 |
| `POST /record-cancel` | 1311-1331 | Stop suggestion/CDP/spawned recording and release guard | None | `{message}` | Suggestion branch only clears suggestion; CDP branch stops recorder and leaves Chrome open; spawned branch SIGKILLs codegen only, never runner |

### 3.5 Suggest lifecycle

| Function/route | Current lines | Purpose | Input | Success | Failure, guards, and side effects |
|---|---:|---|---|---|---|
| `readSuggestionContext(scenarioId,label)` | 945-986 | Locate scenario/row, first missing step, mapped predecessors, and first iteration data | Scenario id + label | `{scenarioId,row,firstMissing,preceding,iterData}` | 400 with `statusCode` when scenario/step missing or no unmapped steps remain |
| `parseSuggestion(code,label)` | 988-1005 | Extract executable `await page.` lines and reject unsafe locators | Raw LLM text | `{cannotMap,steps}` | Throws when no actions or unsafe non-goto locator; `CANNOT_MAP` is valid terminal state |
| `persistMapping(label,code,scenarioId)` | 1007-1021 | Parse, tokenize, and persist accepted/edited suggestion | Label + code + scenario | Returns steps; writes mappings | Same tokenization policy as manual save; malformed code throws |
| `generateSuggestion(session)` | 1023-1052 | Ask provider, parse proposal, execute it live, refresh accessibility snapshot | Live session with page/context | `{status:"ready"/"cannot_map"/"rejected",proposal}` | Execution failure becomes `rejected`; parse failure preserves proposal and clears steps |
| `GET /suggest/status` | 1055-1058 | Report provider and session availability | None | `{enabled,active}` | Missing key means Suggest disabled, not app failure |
| `POST /suggest` | 1060-1111 | Enforce sequential mapping, replay predecessors, run up to three generate/execute/rewind attempts | `{label,scenarioId}` | `{status,proposal,attempts,error?}` | 503 disabled; 409 busy/running/out-of-order; clears sentinels on terminal/fatal paths |
| `POST /suggest/reject` | 1113-1135 | Rewind page and request replacement proposal | Active session | New proposal payload | 409 no session; 429 after 3 attempts; clears on cannot-map/fatal |
| `POST /suggest/accept` | 1137-1150 | Persist proposal or edited code | Optional `{code}` | `{message}` | 409 without executable proposal; 400 when persist fails; clears sentinels |
| `POST /suggest/cancel` | 1152-1156 | Release suggestion guard without persisting | None | `{message}` | Clears suggestion-marked codegen only |

### 3.6 Action Library routes

| Route | Current lines | Purpose | Input | Success | Failure and side effects |
|---|---:|---|---|---|---|
| `GET /action-db` | 1159-1164 | Read canonical actions/groups/synonyms | None | Full DB JSON | 500 on read failure |
| `POST /action-db/action` | 1166-1172 | Create/update reusable action | `{id?,name,description?,code?,synonyms?,platform?}` | `{action}` | 400 on missing name or unparsable/unsupported code |
| `DELETE /action-db/action/:id` | 1174-1179 | Delete action and detach from groups | Action id | `{status:"deleted"}` | 500 on failure; group references cleaned inside ActionDB |
| `POST /action-db/group` | 1181-1187 | Create/update ordered action chain | `{id?,name,description?,actionIds?,synonyms?}` | `{group}` | 400 on missing name; group variables derived from members |
| `DELETE /action-db/group/:id` | 1189-1194 | Delete chain | Group id | `{status:"deleted"}` | 500 on failure |
| `POST /link-synonym` | 1196-1212 | Link Excel label to action/group and cache resolved steps | `{excelLabel,targetType,targetId}` | `{status:"linked",excelLabel,targetType,targetId}` | 400 on validation/resolution failure; writes ActionDB synonym and mappings cache together |

### 3.7 Execution lifecycle

| Route | Current lines | Purpose | Input | Success | Failure, guards, and side effects |
|---|---:|---|---|---|---|
| `POST /run` | 682-860 | Rebuild blueprint, compile spec, spawn Playwright/mobile execution | `{workers?,headless?,platform?}` | Background-start JSON | 400 unknown platform/missing mobile dep; 409 run/recording busy; 500 with parser/compiler real reason; phases move compiling→running→completed/failed |
| `POST /restart` | 862-876 | Clear run/suggestion state, mappings, workbook, matrix, results | None | `{message:"Reset."}` | Destructive; clears suggestion-marked codegen guard; 500 on filesystem failure |
| `GET /run-status` | 1306-1309 | Poll lifecycle and results/error | None | `{phase:"idle"}` or active/terminal run object | Terminal results retained briefly; newer run replacement is protected |
| `POST /run-cancel` | 1334-1346 | Stop active runner and mark cancelled | None | `{message}` | No-op message when idle; kills runner only, never codegen; terminal clear delayed |

### 3.8 Boot and listen

| Section | Current lines | Purpose | Behavior | Maintenance rules |
|---|---|---|---|---|
| PORT validation | 1355-1358 | Reject non-numeric/out-of-range ports before listen | Exits on invalid `PORT` | Prevents Unix-socket-file and bad-port startup failures |
| `app.listen` + handlers | 1362-1366 | Bind dynamic/default port and fail loudly | Emits `Studio Live` + `STUDIO_PORT=` | Electron parses stdout; preserve exact marker |
| `listening` startup | 1367-1391 | Sweep orphans, ensure mappings, rebuild blueprint | Logs sweep count and rebuild status | Keep `[CORE_DIR,DATA_DIR]` sweep and absolute parser path; never make startup depend on optional state |

## 4. `studio/studio-ui.html` — UI sections and handler contracts

The UI is intentionally one vanilla file: no framework, no bundler, no remote assets. Safe DOM construction (`textContent`, `.value`, element creation) is required for user-derived data.

### 4.1 Global UI state

| Item | Lines | Purpose | Maintenance rule |
|---|---|---|---|
| DOM refs `dropZone/fileInput/runBtn/statusBox/stepListUi/modal/codeArea` | 334-340 | Cache frequently used elements | Query once; guard missing nodes before use |
| `currentLabel/currentScenarioId/isUserInteracting` | 342-344 | Track active modal mapping context | Reset on modal open/close; do not reuse across steps |
| `llmEnabled/suggestionActive/suggestionAttempts` | 345-347 | Track Suggest availability and per-step attempts | Keep browser attempt cap aligned with server max; clear on fresh upload/reset |
| `currentActionDb/currentRuntimeData/currentScenarioVariables/currentScenariosList` | 525,1594-1596 | Cache library/matrix/scan state | Refresh after every mutation; never treat cache as canonical |

### 4.2 Suggest handlers

| Function | Lines | Purpose | Calls | Success/failure behavior |
|---|---|---|---|---|
| `loadSuggestStatus()` | 349-354 | Detect whether optional LLM provider is configured | `GET /suggest/status` | Sets `llmEnabled`; network failure means disabled, not fatal |
| `setSuggestionLoading(loading)` | 356-363 | Lock modal controls while reasoning/generating | DOM only | Read-only code area + disabled buttons during load |
| `suggestStep(label,scenarioId)` | 365-413 | Open modal and request first proposal | `POST /suggest`, then `scanSteps()` on rejected/error | `cannot_map` marks attempts exhausted; errors close modal and refresh scan |
| `rejectSuggestion()` | 415-441 | Ask for replacement proposal | `POST /suggest/reject` | Updates code area; marks exhausted on cannot-map; refreshes scan on failure |
| `acceptSuggestion()` | 443-457 | Persist visible proposal/edited code | `POST /suggest/accept`, clipboard, `POST /record-cancel` | Closes modal and rescans; save failure stays visible |
| `editSuggestion()` | 459-467 | Release suggestion lock for manual editing | `POST /suggest/cancel` | Restores Sync/Save behavior without persisting |

### 4.3 Navigation, upload, and mappings list

| Function | Lines | Purpose | Calls | Maintenance rule |
|---|---|---|---|---|
| `safeStorageGet/key/set` | 470-475 | LocalStorage access without throwing in restricted contexts | Browser storage | Never store secrets; platform selection only |
| `updateContextSelection()` | 477-499 | Sync platform badge/card/local cache and server state | `POST /set-platform` fire-and-forget | Keep UI and `/env` consistent; tolerate network failure silently |
| `initContext()` + immediate call | 501-510 | Restore platform selection on load | `updateContextSelection()` | Default `web`; do not block UI on server response |
| `switchTab(tabId)` | 527-539 | Activate one of five panes and lazy-load its data | `initDataMatrix`, `loadSuggestStatus→scanSteps→renderSidebar`, `loadActionLibrary`, `pollRunStatus` | Preserve lazy-load mapping; sidebar visibility only on Mappings |
| `handleFile(file)` | 552-581 | Confirm mapping retention, upload workbook, surface warnings, enter Mappings | `POST /upload`, `scanSteps()` | Guard cancelled dialog; show parse warnings; do not proceed to Mappings on failure |
| `scanSteps()` | 583-749 | Render scenario headers and per-step rows/buttons from scan + library | `GET /scan`, `GET /action-db`, `/save-expected-result`, `previewStep/Scenario`, `linkStepToLibrary`, `openRecordModal/ManualModal`, `suggestStep` | All row buttons visible according to status; user text only via safe DOM; disable Execute until mapped steps exist |
| `renderSidebar()` | 754-773 | Build draggable mini cards for link-by-drag | `linkStepToLibrary` via drop | Mini cards carry `type:id`; full Library cards remain separate |

### 4.4 Library handlers

| Function | Lines | Purpose | Calls | Validation/side effect |
|---|---|---|---|---|
| `loadActionLibrary()` | 776-790 | Load canonical library and counts | `GET /action-db` | Renders actions/groups; failure shown, not thrown |
| `renderActionLibList(actions)` | 792-890 | Render action cards with edit/delete, synonyms, variables, code | `openEditActionModal`, `deleteActionFromLib` | Empty state guides creation; code shown as text |
| `renderGroupLibList(groups,actions)` | 892-991 | Render group chains with member resolution | `openEditGroupModal`, `deleteGroupFromLib` | Shows ordered member names or empty-chain notice |
| `openCreateActionModal()` | 993-1002 | Reset action modal for create | DOM only | Platform defaults to web |
| `openEditActionModal(actionId)` | 1004-1015 | Populate modal from cached action | `currentActionDb` | No-op if id missing |
| `closeActionLibModal()` | 1017-1019 | Hide action modal | DOM only | No state mutation |
| `saveActionLibFromModal()` | 1021-1048 | Validate and persist action | `POST /action-db/action`, `loadActionLibrary()` | Name required; server error shown |
| `deleteActionFromLib(actionId)` | 1050-1060 | Confirm and delete action | `DELETE /action-db/action/:id`, reload | Info status on success |
| `openCreateGroupModal()` | 1062-1070 | Reset group modal | `renderGroupActionsPicker([])` | Starts with no members selected |
| `openEditGroupModal(groupId)` | 1072-1082 | Populate group modal | Cached groups + picker | No-op if missing |
| `renderGroupActionsPicker(selectedIds=[])` | 1084-1117 | Render member checkboxes with variables | `currentActionDb` | Requires existing actions first |
| `closeGroupLibModal()` | 1119-1121 | Hide group modal | DOM only | No state mutation |
| `saveGroupLibFromModal()` | 1123-1155 | Validate name + members and persist group | `POST /action-db/group`, reload | At least one member required |
| `deleteGroupFromLib(groupId)` | 1157-1167 | Confirm and delete group | `DELETE /action-db/group/:id`, reload | Info status on success |
| `linkStepToLibrary(excelLabel,val)` | 1169-1186 | Link missing step to selected action/group | `POST /link-synonym`, `scanSteps()` | Parses `type:id`; refreshes row status |

### 4.5 Record/manual modal handlers

| Function | Lines | Purpose | Calls | Maintenance rule |
|---|---|---|---|---|
| `extractCodegenBody(raw)` | 1192-1198 | Strip codegen wrapper and keep executable body | Regex/string fallback | Parser-lite, not validator; server still validates with Acorn |
| `startCodegenPoll(sessionId)` | 1200-1223 | Poll codegen output up to ~5 minutes | `GET /codegen-result/:sessionId` | Single success fills code area; timeout advises manual paste |
| `resetSaveToLibToggle(label)` | 1225-1230 | Reset optional save-to-library controls | DOM only | Default name is current label; hidden name field until enabled |
| `openRecordModal(label,scenarioId)` | 1232-1284 | Launch replay/codegen session and preload existing mapping | `/preview/:label`, `POST /record` | Distinguish replay vs codegen instructions; safe error DOM |
| `openManualModal(label,scenarioId)` | 1286-1301 | Open manual editor preloaded with current mapping | `/preview/:label` | Preserve existing code unless explicitly unmapped |
| `closeModal()` | 1303-1315 | Stop polling/suggestion/recording and restore modal defaults | `/suggest/cancel`, `/record-cancel` | Clear timer first; never leave guards held |
| `saveMapping()` | 1317-1355 | Save mapping and optionally create+link Library action | `/save-mapping`, optional `/action-db/action` + `/link-synonym`, `/record-cancel`, `scanSteps()` | Clipboard best-effort; release recorder; refresh rows |

### 4.6 Execution, results, preview, matrix

| Function | Lines | Purpose | Calls | Maintenance rule |
|---|---|---|---|---|
| `runBtn.onclick` | 1357-1384 | Save matrix, then start execution with workers/headless/platform | `window.saveDataMatrix()`, `POST /run`, `switchTab('execution')` | Abort when matrix save fails; manage Execute/Cancel visibility |
| `cancelRun()` | 1386-1394 | Cancel active execution | `POST /run-cancel` | Hide cancel control; log, do not throw |
| `pollRunStatus()` | 1396-1435 | Poll lifecycle every 1.5s and render terminal outcome | `GET /run-status`, `renderResultsDashboard` | One interval only; failed/error styling from phase/error; safe error DOM |
| `getAllSpecs(suite)` | 1437-1446 | Recursively harvest nested Playwright suites | Report JSON | Required because JSON nests describes |
| `renderResultsDashboard(results)` | 1448-1538 | Render pass/fail chips and evidence links | `/results/...`, `/results` | Scenario/iteration folder naming must match compiler; safe title DOM |
| `showStatus(msg,type)` | 1540-1542 | Display global operation status | DOM only | Text-only; type drives styling |
| `previewStep(label)` | 1545-1551 | Show one mapped step | `GET /preview/:label` | Modal text-only code display |
| `previewScenario(scenarioId)` | 1553-1559 | Show full scenario in execution order | `GET /preview-scenario/:scenarioId` | Same modal contract |
| `copyPreview()` | 1561-1566 | Copy preview code | Clipboard | Fallback instructs manual select |
| `restartSystem()` | 1568-1584 | Confirm reset and reload fresh state | `POST /restart` | Clear suggestion counters; reload only after success |
| `pasteFromClipboard()` | 1586-1591 | Paste clipboard into mapping editor | Clipboard | Mark user interaction; alert only on denial |
| `initDataMatrix()` | 1598-1608 | Load scan variables/scenarios and saved iterations | `GET /scan`, `GET /data-matrix` | Then render; no persistence here |
| `renderDataMatrixUI()` | 1610-1706 | Render safe editable iteration grid | `addDataRow/removeDataRow` | Skip scenarios without variables; user values only via `.value` |
| `window.addDataRow(scenarioId)` | 1708-1716 | Add empty iteration after DOM sync | `saveDataMatrixStateFromDOM`, `renderDataMatrixUI` | Confirm first; preserve in-memory edits |
| `window.removeDataRow(scenarioId,idx)` | 1718-1725 | Remove iteration after DOM sync | Same as above | Confirm first; index-based splice |
| `saveDataMatrixStateFromDOM()` | 1727-1739 | Sync visible inputs into memory | DOM table rows | Rebuild missing scenario/iteration objects defensively |
| `window.saveDataMatrix(silent=false)` | 1744-1759 | Persist memory to server and report boolean | `POST /data-matrix` | Return `true/false`; Execute depends on false meaning abort |

## 5. `core/*` — shared, parser, compiler, browser, and LLM modules

### 5.1 `core/helpers.js` — pure shared runtime

| Function | Lines | Purpose | Inputs/outputs | Callers | Maintenance rule |
|---|---|---|---|---|---|
| `getAcorn()` | 5-11 | Lazily load Acorn after driver path setup | None | `isSafeChain` | Cache singleton; ensure drivers path first |
| `resolveDriversRoot(baseDirname)` | 16-24 | Locate bundled `DRIVERS/` in dev/Electron/child processes | Base dirname | Server boot, parser/compiler children | Preserve `RESOURCES_PATH` bridge; dev resolution unchanged |
| `ensureDriversPath(callerModule,callerDirname)` | 32-40 | Prepend bundled `node_modules` to module resolution | Caller module/dirname | Every bundled-dependency entry point | Per-file paths; do not assume shared module state |
| `isSafeArg(node)` | 52-75 | Validate nested locator arguments structurally | Acorn node | `isSafeChainNode` | Literals/objects/arrays/page-rooted chains only |
| `isSafeChainNode(node)` | 82-94 | Walk chain rooted at `page` using safe methods | Acorn node | `isSafeChain`, `isSafeArg` | Reject computed/non-safe members and non-`page` roots |
| `isSafeChain(target)` | 104-112 | Validate full `page.<target>` expression with no trailing code | String | Compiler, record/replay, suggest parse | Return validated string or null; trailing content always rejects |
| `interpolate(templateStr,iterData,fallbackObj)` | 117-138 | Apply `{key}` 3-way rule | Template + iteration + Excel fallback | Compiler, replay, suggest execution | Blank is deliberate; absent key throws; unquote wrapped placeholders first |
| `q(v)` | 143 | JSON-quote emitted values | Any value | Compiler, replay builder | Always stringify; never hand-roll quoting |
| `tokenizeLiterals(steps,data)` | 154-165 | Rewrite exact-match literals back to `{key}` | Mutable steps + Data | Save/suggest persist paths | Skip blanks; exact match only; mutate+return |
| `sweepOrphans(dir)` | 172-179 | Delete orphan replay/codegen files | Directory | Boot cleanup | One predicate for both prefixes; return removed names |
| `safeSessionId(id)` | 186-188 | Validate codegen session path segment | String | codegen-result route | Digits only; reject traversal outright |
| `normalizePlatform(p)` | 195-197 | Canonicalize platform comparisons | Any platform value | Record/run/platform UI | Trim + lowercase; allowlist checks stay at call sites |
| `hasSensitiveKey(obj)` | 206-208 | Detect credential-like Data keys | Object | Compiler trace decision | Conservative regex; withholding trace is safer than redaction |
| `buildCodegenArgs(...)` | 210-214 | Build visible-codegen CLI args | CLI, URL, output, profile, system-Chrome flag | Codegen launcher | Keep isolated profile; system Chrome only as fallback |
| `buildCodegenEnv(...)` | 216-230 | Build codegen/replay/run browser env | Base env + paths + packaged flag | Launchers and `/run` | Preserve `PW_HEADLESS=0` codegen behavior and packaged Node env |

### 5.2 `core/action_db.js` — canonical library

| Function | Lines | Purpose | Inputs/outputs | Callers | Maintenance rule |
|---|---|---|---|---|---|
| `extractVariables(text)` | 12-16 | Harvest distinct `{var}` names | String | Scan, save paths | Same regex family as interpolation; dedupe |
| `parseCodeToSteps(code)` | 18-76 | Parse Library free-text code into executable steps | Playwright code string | Action save | Reject `setInputFiles` before/inside parse; preserve goto fallback |
| `init()` | 80-96 | Ensure/read DB; back up corrupt file before reset | None | `read()` and every mutation | Never destroy corrupt data without timestamped backup |
| `read()` | 98-100 | Read canonical DB | None | Routes, resolvers | Thin wrapper over `init()` |
| `write(data)` | 102-104 | Persist canonical DB | Full DB object | Mutations | Whole-file JSON write; no partial updates |
| `saveAction(...)` | 106-139 | Create/update action with parsed steps/variables | Named fields + code | Library action route | Name required; preserve `createdAt`; normalize platform |
| `deleteAction(id)` | 141-152 | Delete action and detach group members | Action id | Action delete route | Always clean `actionIds`; then persist |
| `saveGroup(...)` | 154-193 | Create/update ordered chain and derived variables | Named fields + member ids | Group route | Name required; aggregate variables from current members |
| `deleteGroup(id)` | 195-200 | Delete chain | Group id | Group delete route | No cascade to actions |
| `resolveAction(term)` | 202-207 | Find action by exact name/synonym | Term | `resolveSteps`, UI-linked resolution | Exact match only; no fuzzy matching |
| `resolveGroup(term)` | 209-214 | Find group by exact name/synonym | Term | `resolveSteps` | Same exact-match contract |
| `getGroupSteps(groupId)` | 216-221 | Expand group into ordered member actions | Group id/object | `resolveSteps` | Preserve member order; drop missing members |
| `linkSynonym(excelLabel,targetType,targetId)` | 223-240 | Append Excel label as synonym | Label + type + id | Link route | Validate target exists; dedupe synonym |
| `resolveSteps(label)` | 243-258 | Resolve label to executable steps, unpacking groups | Label | Scan, preview, replay, compiler | Group-first, then action; null when unmapped |

### 5.3 `core/compiler.js` — emit-only code generation

| Function/section | Lines | Purpose | Inputs/outputs | Maintenance rule |
|---|---|---|---|---|
| `compile()` entry + paths | 6-28 | Load blueprint/mappings/matrix and choose web/mobile output | State-dir JSON; writes generated spec | No-op when blueprint/mappings missing; keep `AUTOTEST_STATE_DIR` relocation |
| `xpathEscape(v)` | 34-38 | Quote Appium XPath names safely | String | `concat()` when both quote types present |
| `unescapeJsString(s)` | 40-42 | Remove JS escaping before XPath use | String | Prevent backslash leakage into selectors |
| `translateToMobileLocator(pwLocator,finalValue)` | 44-70 | Convert role/text/label locators to Android XPath | Playwright locator + value | Throw on unsupported Playwright syntax; never emit bogus selector |
| Web header + `markLocator` | 85-88 | Emit Playwright imports and red-outline helper | Generated code | Keep evidence marker behavior stable for screenshots |
| Scenario/iteration loop | 90-100 | Expand every scenario across saved iterations or single default | runtimeData or `[null]` | Folder/test naming must match dashboard parser |
| Sensitive/trace decision | 105,119-123 | Withhold trace when credential-like keys exist | Iteration + step Data | Withhold whole trace; screenshots remain |
| Web action emitter | 157-181 | Emit validated web steps with marks, waits, screenshots | Interpolated target/value | Unsafe chain-like targets throw; raw CSS/XPath stays allowed |
| Mobile action emitter | 137-155 | Emit Appium steps and unsupported-type failures | Same inputs | All standard types supported; unknown types throw |
| Evidence/finally blocks | 184-207 | Capture step/final screenshots and trace/mobile session cleanup | Results dir | Screenshot waits ordered; mobile failure counter drives exit code |
| `require.main` CLI guard + error file | 222-233 | Run only as child CLI and expose real compile reason | `compile_error.json` | `/run` reads this file; never rely on exec error text alone |

### 5.4 `core/scenario_parser.js` — Excel intake

| Function/section | Lines | Purpose | Inputs/outputs | Maintenance rule |
|---|---|---|---|---|
| `generateBlueprintFromExcel(excelPath)` | 12-131 | Parse first worksheet into scenarios/steps/data/warnings | Excel path; `{blueprint,warnings}` | Throw on missing/empty/malformed input; dynamic headers within first 10 rows |
| Scenario/step classification | 57-114 | Distinguish scenario IDs from numeric step rows | Scenario/label/data/expected cells | Regex boundary is behavior; duplicate IDs renamed, merged gaps warned, repeated labels warned |
| State write + CLI wrapper | 125-151 | Write blueprint and warnings/error channels | `AUTOTEST_STATE_DIR` | Warnings file carries non-fatal issues; error file preserves child-process reason |

### 5.5 `core/cdp_session.js` — isolated browser session

| Function | Lines | Purpose | Inputs/outputs | Maintenance rule |
|---|---|---|---|---|
| `err(code,message)` | 30-34 | Create typed errors for tester-safe mapping | Code + message | Codes are part of UI copy contract |
| `resolveSystemChromePath()` | 37-55 | Find stable Chrome or honor explicit env path | Env/filesystem | Throw invalid-path typed error; keep Windows-first candidates |
| `isIsolatedProfile()` | 59-61 | Default to isolated profile unless dev opt-out | Env | `real` is diagnostics-only |
| `resolveRealProfileDir()` | 68-76 | Locate isolated `autotest/` or real Chrome profile | Env/state dir | Packaged writes must stay under state dir |
| `isChromeRunning()` | 79-89 | Detect running Chrome for lock diagnosis | OS process list | Non-zero probe means absent, not fatal |
| `probeCdp(port,timeoutMs=500)` | 91-104 | Check CDP debug endpoint | Host/port | Boolean only; timeouts/errors mean unavailable |
| `ensureDebugChrome()` | 110-142 | Detect or launch CDP Chrome and wait for port | Spawned Chrome | Never track/unref server ownership; typed lock/missing errors |
| `getPage()` | 150-164 | Return reused automation tab/context/browser | CDP connection | One tracked page; reconnect after disconnect; require context |
| `startCodegenRecording({url,outputPath})` | 172-186 | Navigate and enable live recorder output | URL + file | Unstable internal API isolated here; loud typed failure |
| `stopCodegenRecording()` | 188-191 | Disable recorder if present | Cached context | Idempotent; absent context is success |
| `executeSteps(page,steps,iterData)` | 201-242 | Execute mapped predecessors with compiler-equivalent trust | Page + resolved steps + data | Same interpolation/safety rule; assertions wait/verify; unsafe chain-like target throws |
| `runStepsThenPause(page,steps,iterData)` | 244-246 | Compatibility wrapper around live execution | Same as above | Keep thin; no divergent logic |
| `rewind(page,steps,iterData)` | 248-251 | Reload and re-execute baseline before retry | Same as above | `domcontentloaded` reload; then same execution |
| `evalChain(page,chain)` | 259-261 | Convert validated chain into live Locator | Page + safe chain | Call only after `isSafeChain`; documented narrow surface |
| `module.exports + _reset()` | 263-278 | Export lifecycle/testing surface | Browser/page cache | `_reset` is test-only cache clear |

### 5.6 Small modules, shell, config, and dependencies

| Item/function | Location | Purpose | Maintenance rule |
|---|---|---|---|
| `resolveProvider(env)` | `core/llm.js:3-9` | Enable Suggest only when base URL, key, and model exist | Missing field means disabled; never default secrets |
| `buildRequest(provider,prompt)` | `core/llm.js:11-26` | Build OpenAI-compatible chat request | Fixed model/temperature/token/timeout contract |
| `complete(provider,prompt)` | `core/llm.js:28-37` | POST prompt and return trimmed text | Truncate errors; require message content |
| `buildPrompt({ariaSnapshot,label,data,rejected})` | `core/prompt.js:2-22` | Constrain model to executable `await page.` lines or `CANNOT_MAP` | Page tree + label are domain input; keep `{key}`-not-literal and locator-preference rules |
| `parseDotEnv/loadDotEnv/loadRuntimeEnv` | `core/runtime_env.js:5-38` | Load local env without overriding process env | Search explicit file, cwd, state dir; skip comments/invalid lines |
| `startServerAndWindow()` + handlers | `electron/main.js:14-80` | Create window first, fork server in userData, load announced port, kill child on quit | Window-before-fork prevents blank startup race; never chdir into asar; preserve `STUDIO_PORT=` parsing |
| `resolveBundledBrowser()` + config | `playwright.config.ts:5-77` | Resolve executable and keep test/output dirs on relocated roots | OS-first browser order; `testDir/outputDir` must track env; reporter overridden by `/run` |
| Scripts/build/dependencies | `package.json:6-80` | Define dev/pack/test commands and offline-capable deps | `npm test` is canonical; Electron files/resources stay explicit; do not add deps for stdlib/native work |

## 6. Tests and validation map

| Test file | Protects | Run when changing |
|---|---|---|
| `tests/safe_chain_test.js` | Locator allowlist and injection rejection | `isSafeChain`, parser, compiler emit, suggest parse |
| `tests/interpolate_strict_test.js` | Blank-deliberate vs absent-key-throws rule | Interpolation, matrix shape, compiler resolution |
| `tests/tokenize_literal_test.js` | Literal→`{key}` rewrite on shared labels | Save/suggest persist paths |
| `tests/replay_mapping_test.js` | Library-resolved predecessors in replay | Record/replay resolution |
| `tests/action_db_tdd.js`, `action_db_corruption_test.js` | Library CRUD and corrupt-file backup | ActionDB or library routes |
| `tests/scenario_parser_test.js` | Headers, dedup, merged/repeated-label warnings | Parser or upload/scan behavior |
| `tests/mutual_exclusion_test.js` | Record/run/suggest 409 matrix | Sentinels, guards, cancel behavior |
| `tests/path_traversal_test.js` | Session-id and path containment | Codegen/result paths |
| `tests/state_dir_test.js` | Relocated writable roots | Paths, Electron env, config dirs |
| `tests/codegen_launch_test.js`, `record_replay_sit.js` | Recorder/replay startup and flow | Launchers, record route, CDP session |
| `tests/mobile_compile_test.js` | Mobile emit/unsupported-locator failures | Compiler mobile branch |
| `tests/trace_redaction_test.js`, `sweep_test.js` | Credential trace withholding and orphan cleanup | Evidence handling, boot sweep |
| `tests/api_test.js`, `hitl_scenario_test.js`, `journey_test.js`, `practice_workflow_test.js`, `human_workflow_test.js` | Route and end-to-end behavior | Corresponding route/flow changes |
| `tests/ui_behavior_test.js`, `tests/llm_test.js`, `tests/prompt_test.js`, `tests/cdp_profile_test.js`, `tests/fixtures_smoke_test.js`, `tests/electron_test.js` | UI behavior, provider/prompt, profile isolation, fixtures, startup | UI text/flow, Suggest, Chrome profile, packaged startup |

## 7. Safe-change checklists

### 7.1 Route change

1. Keep method, path, status codes, JSON keys, validation order, and file effects.
2. Update focused tests for added validation branches.
3. Verify restart/packaged behavior if stores, paths, or processes changed.
4. Diff route inventory: still 31 unless product explicitly adds/removes one.

### 7.2 Parser/compiler/locator change

1. Add failing adversarial case first: traversal, injection, malformed locator, blank vs absent data.
2. Keep loud failures; do not downgrade to silent skips or never-matching selectors.
3. Check web and mobile emitters when shared helpers change.
4. Verify evidence artifacts and dashboard links still resolve.

### 7.3 UI change

1. Use safe DOM APIs for server/Excel/user data.
2. Preserve tab lazy-loading, modal cleanup, poller singleton, and Execute gating.
3. Keep button visibility rules aligned with `mapped/missing`, library presence, LLM status, and attempt count.
4. Test keyboard/modal focus behavior for Library modals.

### 7.4 Packaging/process change

1. Test direct Node startup and packaged startup.
2. Verify child cwd, `RUN_AS_NODE`, module resolution, browser discovery, and results paths per OS.
3. Prove cancel/restart cannot kill the wrong process or the tester's browser.
4. Check no generated artifacts, secrets, or user data enter git.

## 8. Document maintenance

- This reference is updated in the same change as the code it describes.
- Line numbers are conveniences; function/route/store names are contracts.
- If behavior changes without a reference update, treat the missing update as a defect.
- Record the validation actually run in `BRAIN/CHANGE-LOG.md`, not the validation intended.
