# AutoTest Studio: Test Scenario Catalog

> **Current acceptance amendment — 2026-10-17:** UP-E-01 is corrected from the historical false-success description to the existing strict upload contract (A0.6.2): malformed input must return 400 and preserve the active project. UP-N-02 adds missing-file preservation. This strengthens the contract; it does not waive a failure. [BRAIN/Implementation Progress.md](BRAIN/Implementation%20Progress.md) records executed evidence; historical rows elsewhere still require reconciliation before their scope is implemented.

Scope: every server route in [studio/server.js](studio/server.js), the compiler
([core/compiler.js](core/compiler.js)), and the Action Database
([core/action_db.js](core/action_db.js)), with **Mapping Actions** and
**Replaying Actions** covered in depth per request. This is a planning
document only. No test code yet. Each row here becomes one assertion (or
one `check()` call) when `/test` implements it, following this repo's
existing style in [tests/](tests/) (plain `http.request` calls against a
live `server.js`, `check(name, cond, detail)` counters, no framework).

Legend: **P** = positive (happy path), **N** = negative (invalid input /
rejected), **E** = edge (boundary, concurrency, malformed state).

---

## 1. Recording Actions (`POST /record`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| REC-P-01 | P | Record first step of a scenario (`label`, `url`, `scenarioId`, no preceding mapped steps) | Plain `codegen` process spawns against `url`; response `{ isReplay: false, sessionId }` |
| REC-P-02 | P | `url` omitted or not `http`-prefixed | Falls back to `about:blank`, codegen still launches |
| REC-P-03 | P | Record a step that has ≥1 preceding **mapped** step in the same scenario | Replay path taken: `replay_<sessionId>.spec.ts` generated, spawned headed, response `{ isReplay: true }` |
| REC-N-01 | N | Call `/record` while a codegen/replay session is already active | `409 { error: 'A recording session is already active...' }`; second process never spawned |
| REC-E-01 | E | `scenarioId` doesn't exist in `blueprint.json` | Falls back to scanning all scenarios for one whose `Flow` contains `label`; if none found, treated as no preceding steps (normal codegen) |
| REC-E-02 | E | Preceding step exists in the flow but has **no** mapping yet (`mappings[key]` absent) | Excluded from `precedingMappedSteps`; only steps with actual recorded actions are replayed |
| REC-E-03 | E | `blueprint.json` or `mappings.json` missing/corrupt JSON | Caught, logged, treated as zero preceding steps, falls back to normal codegen instead of crashing |
| REC-E-04 | E | Preceding step's stored `target` contains `{variable}` tokens and `runtime_data.json` has no iteration for `scenarioId` | `interpolate()` receives `iterData = null`, falls back to `step.Data`, then empty string; replay script still compiles |
| REC-E-05 | E | Two rapid concurrent `POST /record` calls (race) | Sentinel `activeCodegen = { killed:false, exitCode:null }` is set synchronously before any async work, so the second request always sees it and gets 409: no double-spawn |
| REC-E-06 | E | `label` contains a single quote (`Tester's Step`) | Safely escaped in generated replay spec's comment/title (`.replace(/'/g, "\\'")`); spec still valid JS |

## 2. Recording Cancel (`POST /record-cancel`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| RECC-P-01 | P | Cancel while codegen is active | Process SIGKILLed, `activeCodegen` cleared, `{ message: 'Cancelled.' }` |
| RECC-E-01 | E | Cancel with no active session | No throw, still returns `{ message: 'Cancelled.' }` |
| RECC-E-02 | E | Cancel while a **replay-for-recording** session (not plain codegen) is running | Same kill path applies (replay child is also stored as `activeCodegen`); test runner for `/run` is untouched (separate `activeRunner`) |

## 3. Codegen Result Polling (`GET /codegen-result/:sessionId`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| CGR-P-01 | P | Poll after the owned plain-codegen child closes successfully with final output | `{ ready: true, code }` matches final output exactly; read does not delete the file |
| CGR-N-01 | N | Poll while the owned recorder is still running, including an early existing output file | `ready:false,status:running`; a valid session-owned `previewCode` may be displayed provisionally, but never treated as final or destructively consumed |
| CGR-E-01 | E | Poll same completed `sessionId` twice within retained session lifetime | Both return identical final code; lost responses are retryable |
| CGR-E-02 | E | Unknown numeric session or malformed session ID | Unknown numeric ID stays not ready; malformed ID returns 400; no arbitrary file is served |
| CGR-E-03 | E | Recorder fails or is cancelled after an early output exists | Explicit failure/cancellation, never ready-success; prior mapping unchanged |
| CGR-E-04 | E | Cancel A, start B, then delayed A close/result arrives | A cannot clear B ownership or overwrite B textarea |
| CGR-E-05 | E | User edits textarea before final response arrives | Automatic final result does not overwrite user edits; final captured code remains available in a read-only section; explicit review remains required |
| CGR-E-06 | E | Intermediate replay recording has no CLI export | UI states manual-copy fallback; no false automatic captured-success |
| CGR-E-07 | E | Tester focuses textarea during recording without editing | Final source is inserted normally; focus alone does not discard it |
| CGR-E-08 | E | Manual preview arrives after input edits or a newer modal opens | Response cannot replace newer/user-edited text |

### Live preview during recording

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| CGR-L-01 | P | Perform navigation/action in real codegen while it stays open | New generated actions appear automatically as provisional live preview; ready remains false and recording Save is disabled |
| CGR-L-02 | E | Output file is temporarily incomplete while being written | Last valid live snapshot remains; partial source is not published or executed |
| CGR-L-03 | E | Live poll responses arrive out of order | Lower preview version cannot overwrite newer visible source; old session responses cannot affect new modal |
| CGR-L-04 | E | Tester edits AutoTest while recording continues | Preserve edits; update read-only live source; successful close changes it to final source and enables review/save |
| CGR-L-05 | E | Recording ends in failure/cancel, then tester opens Manual or Suggest | No final-success; recording save remains blocked; fresh mode restores its own correct controls |

## 4. Saving a Mapping (`POST /save-mapping`)

The core "mapping" write path: turns raw Playwright codegen output into a
structured `{ steps: [...] }` entry keyed by step label.

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| MAP-P-01 | P | Save `click` step: `await page.getByRole('button', { name: 'Login' }).click();` | `mappings[label] = { steps: [{ type:'click', target:"getByRole('button', { name: 'Login' })" }] }` |
| MAP-P-02 | P | Save `fill` step with a value | Step captures both `target` and `value` |
| MAP-P-03 | P | Save `goto` step: `await page.goto('https://x.com');` | `target` = raw URL string, no `page.` prefix logic needed |
| MAP-P-04 | P | Save multi-line codegen block (goto + fill + click in one paste) | All matching calls extracted in source order into one `steps` array |
| MAP-P-05 | P | Save `press`, `selectOption`, `check`, `uncheck` variants | Each recognized type produces the matching `step.type` |
| MAP-P-06 | P | Save assertion: `await expect(page.getByText('Welcome')).toBeVisible();` | `target` unwrapped from `expect(...)`, `page.` prefix stripped, `type:'toBeVisible'` |
| MAP-P-07 | P | Save `toHaveText` assertion with expected text | `value` = expected text, `target` = locator |
| MAP-P-08 | P | Re-save an existing `label` with new code | Overwrites prior entry (map keyed by label, not appended) |
| MAP-P-09 | P | `label` has leading/trailing whitespace | Trimmed before use as key (`label.trim()`) |
| MAP-N-01 | N | `label` missing | `400 { error: 'Invalid label...' }` |
| MAP-N-02 | N | `label` = `""` or whitespace-only | `400`, same validation message |
| MAP-N-03 | N | `label` is a number/object (wrong type) | `400`, `typeof label !== 'string'` check catches it |
| MAP-N-04 | N | `code` missing or empty string | `400 { error: 'Invalid code...' }` |
| MAP-N-05 | N | `code` is syntactically invalid JS (unterminated string) | Acorn parse throws → `400 { error: 'Syntax error in Playwright code: ...' }`; `mappings.json` untouched |
| MAP-N-06 | N | `code` contains an RCE-style payload disguised as a locator, e.g. `page.getByRole(cond ? a : b)` (ternary as callee object) | Blocked: ternary payload short-circuited (`ConditionalExpression` guard); node skipped, not recorded as a step |
| MAP-N-07 | N | `code` calls a method not in the allowed set (`page.close()`, `page.evaluate(...)`) | Silently ignored: not in `['click','fill','press','goto','selectOption','check','uncheck','toBeVisible','toHaveText']`, so no step emitted for it |
| MAP-E-01 | E | `code` recorded but contains **zero** recognized calls (e.g., only a comment) | `steps: []` saved successfully (empty array is valid); later shows as "Not mapped yet" in preview |
| MAP-E-02 | E | `mappings.json` doesn't exist on disk yet | Read throws → currently **not guarded** in `/save-mapping` (unlike `/scan`); document as known gap or confirm auto-create on read |
| MAP-E-03 | E | Very large pasted code block (hundreds of actions) | All parsed; no explicit size cap on `/save-mapping` body (unlike `/upload`'s 5MB multer limit) |
| MAP-E-04 | E | `fill`/`press`/`selectOption`/`toHaveText` called with **zero** arguments | `step.value` omitted entirely (guarded by `node.arguments.length > 0`) rather than crashing |
| MAP-E-05 | E | Unicode / emoji in `label` or fill value | Round-trips through JSON.stringify correctly; no encoding corruption |

## 5. Reading a Mapping (`GET /mapping/:label`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| GETMAP-P-01 | P | Label exists in `mappings.json` | Returns that mapping directly |
| GETMAP-P-02 | P | Label not in `mappings.json` but resolves via Action DB synonym/action name | Falls back to `ActionDB.resolveSteps(label)` |
| GETMAP-N-01 | N | Label exists nowhere | `{ mapping: null }`, not a 404 |
| GETMAP-E-01 | E | Label is URL-encoded (spaces, `&`, `#`) | `decodeURIComponent` applied before lookup |
| GETMAP-E-02 | E | `mappings.json` missing from disk | Caught, falls through to Action DB resolution instead of 500 |

## 6. Mapping Preview (`GET /preview/:label` and `GET /preview-scenario/:scenarioId`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| PREV-P-01 | P | Preview a mapped label | Reconstructed readable Playwright lines (`await page....`) joined by `\n` |
| PREV-P-02 | P | Preview a full scenario with 3 mapped steps | One comment header per step + reconstructed lines, in `Flow` order |
| PREV-N-01 | N | Preview an unmapped label | `{ code: '// Not mapped yet' }` |
| PREV-N-02 | N | Preview a scenario ID not present in `blueprint.json` | `{ code: "// Scenario '...' not found in blueprint." }` |
| PREV-E-01 | E | No `blueprint.json` on disk at all | `{ code: '// No blueprint. Upload and parse Excel first.' }` |
| PREV-E-02 | E | Scenario has a step whose mapping resolves to `steps: []` (mapped but empty) | Rendered as `// NOT MAPPED YET` in scenario preview (empty array treated same as missing) |
| PREV-E-03 | E | `target` starts with `getBy`/`locator`/`frameLocator` vs. a raw CSS selector | Former renders as `page.<target>`, latter wrapped as `page.locator('<target>')` |

## 7. Replaying Actions: the record-with-preceding-context flow

This is the "replay" heart of the app: recording a *new* step first
**replays every already-mapped preceding step** in the scenario (headed,
via `page.pause()` at the end) so the tester lands in the right app state
before recording the next action.

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| REPLAY-P-01 | P | Scenario has steps [A(mapped), B(mapped), C(unmapped)]: record C | Replay spec executes A then B, in order, then pauses; response `isReplay: true` |
| REPLAY-P-02 | P | Preceding step's action list has a `goto` + `fill` + `click` mix | Each action type compiled to correct Playwright call (`page.goto`, `.fill()`, `.click()`) |
| REPLAY-P-03 | P | `runtime_data.json` has an iteration for `scenarioId` | First iteration's row (`iterations[0]`) used to interpolate `{variable}` tokens in target/value |
| REPLAY-P-04 | P | No `runtime_data.json` / no iteration for this scenario | `iterData = null`; interpolation falls back to `step.Data` from the blueprint, then blank |
| REPLAY-P-05 | P | Replay completes and tester closes the Inspector | Process `close` handler fires, deletes `replay_<sessionId>.spec.ts`, clears `activeCodegen` |
| REPLAY-P-06 | P | Preceding step includes an assertion (`toBeVisible`/`toHaveText`) | Compiled as `await expect(...)` in the replay spec, not a click/fill |
| REPLAY-N-01 | N | Recording is requested for the **first** step of a scenario (`targetIdx === 0`) | No preceding steps possible → normal (non-replay) codegen path taken, `isReplay: false` |
| REPLAY-N-02 | N | Label not found anywhere in the scenario's `Flow` | `targetIdx = -1`, `> 0` check fails → normal codegen, not a crash |
| REPLAY-E-01 | E | A preceding step's `target` uses an unsafe/non-Playwright-native chain (fails `isSafeChain`) | Falls back to `page.locator(<raw target>)` rather than executing `page.<target>` directly; prevents code injection via a poisoned mapping |
| REPLAY-E-02 | E | Preceding step count is large (e.g. 15 steps) before the pause | All 15 replayed sequentially with a `waitForTimeout(1000)` + `domcontentloaded`/`networkidle` settle between each, before the final `page.pause()` |
| REPLAY-E-03 | E | One preceding step's target/value contains a literal `{` that is **not** a `{variable}` token (e.g. JSON-looking text) | `interpolate()`'s regex only matches `\{[a-zA-Z0-9_]+\}`; non-matching braces pass through unchanged |
| REPLAY-E-04 | E | Replay child process crashes mid-execution (bad selector throws) | Playwright Inspector still available for manual continuation via `page.pause()` semantics; `close` handler still cleans up the temp spec on exit |
| REPLAY-E-05 | E | Server restarts while a `replay_*.spec.ts` file is still on disk from a prior crashed session | Startup sweep (`fs.readdirSync` filter on `replay_` prefix in `CORE_DIR`/`ROOT_DIR`) deletes orphaned replay scripts before serving requests |
| REPLAY-E-06 | E | `scenarioId` sent in the record request doesn't match the scenario actually containing `label` | Falls back to searching all scenarios by `Flow.some(st => st.Mapping_Key === label)`; replay still resolves the correct scenario |
| REPLAY-E-07 | E | Same `label`/`scenarioId` recorded twice back-to-back (re-record an already-mapped step) | Second `/record` call still replays all **other** preceding steps up to that label (this label itself isn't in the preceding slice, since `slice(0, targetIdx)` excludes it) |

## 8. Full Scenario Execution (`POST /run`, `GET /run-status`, `POST /run-cancel`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| RUN-P-01 | P | Run with default `workers`/`headless`, `platform: 'web'` | Blueprint regenerated, `compiler.js` produces `executed.spec.ts`, Playwright test runner spawned, `activeRun.phase` transitions compiling → running → done |
| RUN-P-02 | P | Run with `platform: 'mobile'` and `webdriverio` installed | Mobile compile branch used (`describe`/`it`, `driver.$()` locators) |
| RUN-P-03 | P | Scenario has multiple `runtime_data.json` iterations | One `test`/`it` block generated per iteration, titled `... - Iteration N` |
| RUN-N-01 | N | `platform: 'mobile'` but `webdriverio` not resolvable | `400 { error: "Missing Dependency: 'webdriverio' is not installed." }`; run never starts |
| RUN-N-02 | N | `/run` called while `activeRun.phase` is `compiling` or `running` | `409 { error: 'Execution already in progress.' }` |
| RUN-E-01 | E | A scenario's `Flow` is empty | Skipped entirely by compiler (`if (!scenario.Flow \|\| scenario.Flow.length === 0) continue;`); no empty test block emitted |
| RUN-E-02 | E | A step in `Flow` has no resolvable mapping (neither `mappings.json` nor Action DB) | That step contributes zero lines to the compiled spec, not a compile error |
| RUN-E-03 | E | `POST /run-cancel` with no active run | `{ message: 'No active run to cancel.' }`, no throw |
| RUN-E-04 | E | `POST /run-cancel` while running | `activeRunner` SIGKILLed, `activeRun.phase = 'cancelled'`, auto-clears to `null` after 5s |
| RUN-E-05 | E | `GET /run-status` with no run ever started | `{ phase: 'idle' }` |
| RUN-E-06 | E | Scenario title/step label contains a single quote or newline | Sanitized (`.replace(/'/g, "\\'")`, strip `\r?\n`) before embedding into generated spec's test title/comment |

## 9. Compiler-Level Behavior ([core/compiler.js](core/compiler.js))

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| COMP-P-01 | P | Web platform, mapped `getByRole` locator | Compiled with `markLocator()` highlight call before `.click()`/`.fill()` |
| COMP-P-02 | P | Mobile platform, same `getByRole` locator | Translated via `translateToMobileLocator` into an XPath `//*[@text=... or @content-desc=...]` |
| COMP-E-01 | E | Mobile target already looks like XPath/CSS-ID/class (`/...`, `#...`, `.` prefix) | Passed through unchanged, no translation attempted |
| COMP-E-02 | E | Mobile target has no role/text/label match and `finalValue` has no `{` in it | Falls back to matching on `finalValue` text/content-desc |
| COMP-E-03 | E | `isSafeChain` rejects a target (contains `require`/`eval`/`process`/etc.) | Compiler falls back to `page.locator(<raw string>)`, quoted via `q()` (JSON.stringify); never executes the raw chain as code |
| COMP-E-04 | E | Screenshot/trace directory (`results/<scenarioIdClean>`) already exists from a prior run | `fs.mkdirSync(..., { recursive: true })` guarded by `existsSync` check, no throw on collision |

## 10. Action Database (`GET/POST/DELETE /action-db*`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| ADB-P-01 | P | `GET /action-db` on first-ever run (no `action_database.json`) | Auto-created with `{ version:1, actions:[], groups:[] }` |
| ADB-P-02 | P | `POST /action-db/action` with `name`, `code`, `synonyms`, `platform` | Action saved with derived `steps` (AST-parsed from `code`) and `variables` (extracted `{tokens}`) |
| ADB-P-03 | P | Re-save an action using its existing `id` | Updates in place, `createdAt` preserved, `updatedAt` bumped |
| ADB-P-04 | P | `DELETE /action-db/action/:id` | Removed from `actions[]`; also stripped from any `group.actionIds` referencing it |
| ADB-N-01 | N | `POST /action-db/action` with missing/blank `name` | `400 { error: 'Action name is required' }` |
| ADB-N-02 | N | `DELETE` an `id` that doesn't exist | Still `200 { status:'deleted' }` (idempotent filter, not a lookup-or-404) |
| ADB-E-01 | E | `synonyms` array has duplicate/blank entries | Deduped and blank-filtered (`Set` + `.filter(Boolean)`) before save |
| ADB-E-02 | E | `platform` is neither `'web'` nor `'mobile'` | Coerced to `'web'` (ternary default) |
| ADB-E-03 | E | `action_database.json` is corrupted on disk (invalid JSON) | `read()` catches parse error, re-initializes to empty DB rather than crashing the route |
| ADB-E-04 | E | `code` field contains a ternary-guarded RCE payload | Same `ConditionalExpression` guard as `/save-mapping` blocks it at the AST level |
| ADB-E-05 | E | `code` fails to parse entirely (bad syntax) | `parseCodeToSteps` catches, falls back to a regex-only `page.goto(...)` extraction, else `steps: []`; action still saves |

## 11. Action Groups (`POST/DELETE /action-db/group*`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| GRP-P-01 | P | Create group from 2 existing action IDs | `variables` aggregated (union) from member actions' own `variables` |
| GRP-P-02 | P | `resolveSteps(groupName)` on a valid group | Returns concatenated `steps` of every member action, in `actionIds` order |
| GRP-N-01 | N | `name` missing/blank | `400 { error: 'Group name is required' }` |
| GRP-E-01 | E | `actionIds` references an ID that doesn't exist in `actions[]` | Silently skipped (`.filter(Boolean)` after `.find()`); no throw, group still saves with fewer resolved members |
| GRP-E-02 | E | `actionIds` is empty array | Group saves with `steps: []` via `resolveSteps`, treated as "mapped but empty" downstream |
| GRP-E-03 | E | Delete a group referenced by a synonym link | Group removed cleanly; any Excel label previously synonym-linked to it now resolves to nothing (`resolveGroup` returns `null`) |

## 12. Synonym Linking (`POST /link-synonym`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| SYN-P-01 | P | Link an Excel label to an existing action (`targetType: 'action'`) | Synonym appended to that action's `synonyms[]`; `mappings.json` also updated with resolved `steps` for fast lookup |
| SYN-P-02 | P | Link an Excel label to an existing group (`targetType: 'group'`) | Synonym appended to group's `synonyms[]`; same mappings.json sync |
| SYN-N-01 | N | `excelLabel` or `targetId` missing | `400 { error: 'excelLabel and targetId required' }` |
| SYN-N-02 | N | `targetId` doesn't match any action/group | `400 { error: 'Action not found: ...' }` / `'Group not found: ...'` |
| SYN-E-01 | E | Link the same label to the same target twice | No duplicate entry (`if (!synonyms.includes(cleanLabel))` guard) |
| SYN-E-02 | E | Same Excel label linked to two *different* targets over time (relink) | Second link call adds a second synonym entry elsewhere; `resolveAction`/`resolveGroup` returns whichever is found first: document as ambiguous-resolution edge case worth a real regression test |
| SYN-E-03 | E | Linking a group whose `resolveSteps` is empty | `mappings.json` sync branch (`if (steps)`) skipped since `resolveSteps` returns `[]` which is truthy but empty: confirm whether empty-array sync is desired or should also skip |

## 13. Data-Driven Parameterization (`GET/POST /data-matrix`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| DDT-P-01 | P | POST a valid `{ ScenarioID: [{col: val}, ...] }` object | Saved to `runtime_data.json` verbatim |
| DDT-P-02 | P | GET before any data posted | `{}` (empty object, not 404/500) |
| DDT-N-01 | N | POST an array instead of an object | `400 { error: 'Invalid payload...' }` |
| DDT-N-02 | N | POST where a scenario's value isn't an array of iterations | `400 { error: 'Invalid format for scenario <id>: Expected an array of iterations.' }` |
| DDT-E-01 | E | POST `{}` (empty object) | Treated as "clear overrides", writes `{}` and returns `{ message: 'Cleared.' }`, not a 400 |
| DDT-E-02 | E | `{variable}` token in a mapped step has no matching column in any iteration row | `interpolate()` resolves to empty string, not `undefined`/literal `{variable}` text |
| DDT-E-03 | E | Iteration value is `0`, `false`, or `""` (falsy but meaningful) | `interpolate()`'s `!== undefined && !== null && !== ""` check means `""` still falls through to fallback; `0`/`false` are correctly used since only `""` is excluded |

## 14. Excel Upload & Scan (`POST /upload`, `GET /scan`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| UP-P-01 | P | Upload a valid `.xlsx` under 5MB | Saved as `scenario_uploaded.xlsx`, `blueprint.json` regenerated via `scenario_parser.js` |
| UP-P-02 | P | Upload with `keepMappings: 'false'` | `mappings.json` reset to `{}` on upload |
| UP-P-03 | P | Upload with `keepMappings` omitted/`'true'` | Existing `mappings.json` left intact |
| UP-N-01 | N | Upload a file over 5MB | Rejected by multer's `limits.fileSize` before reaching the handler |
| UP-E-01 | E | `scenario_parser.js` throws on a malformed workbook | `400 { error }` names the real validation failure; active workbook, blueprint, mappings and data iterations remain unchanged; request staging file removed |
| UP-N-02 | N | Upload request has no file, including after a previous valid upload | `400 { error: 'No file uploaded.' }`; active project unchanged |
| SCAN-P-01 | P | Scan after a well-formed upload | Returns `{ steps, scenarios, scenarioVariables }` with each step's `mapped`/`missing` status |
| SCAN-N-01 | N | Excel has fewer than 2 rows | `400 { error: 'Malformed Template: Excel file is empty or missing data rows.' }` |
| SCAN-N-02 | N | Header row (within first 10 rows) never contains both "scenario number/id" and "scenario name/label" | `400 { error: "Malformed Template: Could not find 'Scenario Number' and 'Scenario Name' columns." }` |
| SCAN-E-01 | E | No Excel uploaded yet (`scenario_uploaded.xlsx` absent) | `{ steps: [] }`, not an error |
| SCAN-E-02 | E | Same step `label` appears under two different scenarios | One `stepMap` entry with `flows: [scenarioA, scenarioB]`; mapping status shared, not duplicated |
| SCAN-E-03 | E | A step row's scenario-number cell is a bare number **and** no `currentScenario` has been set yet (orphan step before any scenario header) | Silently skipped (`else if (currentScenario && ...)` requires a scenario to already be open) |
| SCAN-E-04 | E | `mappings.json` missing when `/scan` runs | Auto-created as `{}` before use, not a crash |

## 15. Platform Switching (`GET /env`, `POST /set-platform`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| PLAT-P-01 | P | `POST /set-platform { platform: 'mobile' }` | `activePlatform` updated, persisted to `platform_state.json`, `AUTOTEST_PLATFORM` env set |
| PLAT-N-01 | N | `platform` value outside `['web','mobile']` | `400 { error: 'Invalid platform...' }` |
| PLAT-E-01 | E | Server restarts after platform was set to `'mobile'` | Startup reads `platform_state.json` and restores `activePlatform = 'mobile'` |
| PLAT-E-02 | E | `platform_state.json` corrupted | Falls back to default `'web'`, caught silently |

## 16. Restart / Reset (`POST /restart`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| RST-P-01 | P | Restart with an active upload, mappings, runtime data, and results present | All four cleared/reset (`mappings.json` → `{}`, Excel deleted, `runtime_data.json` deleted, `results/` wiped and recreated empty) |
| RST-E-01 | E | Restart when none of those artifacts exist yet | No throws on any `existsSync`-guarded deletion |
| RST-E-02 | E | Restart while a run is `activeRun.phase === 'running'` | `activeRun` forcibly nulled; does **not** kill the underlying child process (only clears the pointer); flag as a potential orphan-process edge case worth a real test |
| RST-E-03 | E | Action Database (`action_database.json`) and synonym links | **Not** touched by `/restart`: confirms Action DB is intentionally persistent across project resets |

## 17. Results Directory (`GET /results`)

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| RES-P-01 | P | Results dir has 2 scenario folders with screenshots | Rendered as folder cards with linked files, icon by extension |
| RES-E-01 | E | `results/` doesn't exist at all | `<h1>No results directory found</h1>`, not a 500 |
| RES-E-02 | E | `results/` exists but is empty | "No scenario runs found" message |
| RES-E-03 | E | A scenario folder exists but has zero files in it | "No artifacts" shown for that card |

## 18. Cross-Cutting / System-Level Edge Cases

| ID | Cat | Scenario | Expected Result |
|---|---|---|---|
| SYS-E-01 | E | Server startup with a leftover `replay_*.spec.ts` from a crashed session | Swept before first request is served |
| SYS-E-02 | E | Server startup with `scenario_uploaded.xlsx` present but stale/corrupt | `scenario_parser.js` invocation fails, caught, logged; server still boots |
| SYS-E-03 | E | Server startup with **no** uploaded Excel | `mappings.json` force-reset to `{}` (prevents ghost mappings per [AGENTS.md](AGENTS.md) rule 7) |
| SYS-E-04 | E | `SIGINT`/`SIGTERM` received mid-run | `cleanupAll()` kills every tracked child process and closes `globalBrowser` before exit |
| SYS-E-05 | E | Bundled Chromium not found under `DRIVERS/ms-playwright` | Logs a warning, falls back to system Playwright's default browser resolution instead of failing hard |
| SYS-E-06 | E | Two browser tabs both driving the Studio UI against the same server (shared global state) | `activeCodegen`/`activeRun` are process-wide singletons: second tab's concurrent actions correctly collide with 409s from REC-N-01/RUN-N-02, not silently corrupt state |

---

## Coverage Notes

- **Mapping** (§4–6) and **Replaying** (§7) are the two heaviest sections per
  the request: 9 + 17 scenarios respectively, spanning the AST parser's
  RCE-blocking guard, interpolation fallback chain, and the preceding-steps
  replay-before-pause mechanic that is this app's signature feature.
- Several rows above (MAP-E-02, SCAN-E-01/UP-E-01, RST-E-02, SYN-E-02/E-03)
  read as **known-gap** candidates rather than confirmed-passing behavior;
  when `/test` implements these, a failing result there is itself a valid
  finding, not a broken test.
- Next step: run `/test` against this file to turn each row into a `check()`
  call inside `tests/` (reusing the `req()` helper pattern already in
  [tests/replay_mapping_test.js](tests/replay_mapping_test.js) and
  [tests/record_replay_sit.js](tests/record_replay_sit.js)), grouped by the
  section headers above.
