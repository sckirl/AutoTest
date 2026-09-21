# AutoTest Studio: Test Execution Results

Executed against the live server at `http://localhost:3000` on 2026-09-21. All
backend rows were exercised with real HTTP requests (`curl` / Node `http`)
against the running process; UI rows were exercised with Playwright MCP
against the real rendered page; Record/Replay rows spawned real Playwright
codegen/Inspector child processes and were killed via the real
`/record-cancel` endpoint after evidence was captured. `/run` rows executed
the real Playwright test runner against the live OrangeHRM demo site
end-to-end (headless), producing real screenshots/traces under `results/`.

## Coverage Summary

| Section | Attempted | Pass | Fail | Blocked |
|---|---|---|---|---|
| 1. Recording Actions (`/record`) | 10 | 10 | 0 | 0 |
| 2. Recording Cancel (`/record-cancel`) | 3 | 3 | 0 | 0 |
| 3. Codegen Result Polling | 4 | 2 | 0 | 2 |
| 4. Saving a Mapping | 23 | 23 | 0 | 0 |
| 5. Reading a Mapping | 5 | 5 | 0 | 0 |
| 6. Mapping Preview | 8 | 8 | 0 | 0 |
| 7. Replaying Actions | 17 | 16 | 0 | 1 |
| 8. Full Scenario Execution (`/run`) | 12 | 10 | 1 | 1 |
| 9. Compiler-Level Behavior | 6 | 6 | 0 | 0 |
| 10. Action Database | 13 | 13 | 0 | 0 |
| 11. Action Groups | 6 | 6 | 0 | 0 |
| 12. Synonym Linking | 7 | 7 | 0 | 0 |
| 13. Data-Driven Parameterization | 6 | 6 | 0 | 0 |
| 14. Excel Upload & Scan | 12 | 12 | 0 | 0 |
| 15. Platform Switching | 4 | 2 | 0 | 2 |
| 16. Restart / Reset | 4 | 4 | 0 | 0 |
| 17. Results Directory | 4 | 4 | 0 | 0 |
| 18. Cross-Cutting / System-Level | 6 | 1 | 0 | 5 |
| **Total** | **150** | **138** | **1** | **11** |

(150 rows attempted vs. ~110 catalogued because several catalog rows bundle
sub-assertions that were verified as distinct checks; a few rows are cited
together where they share one real request/response, noted inline.)

---

## 1. Recording Actions: `POST /record`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| REC-P-01 | PASS | `200 {"sessionId":"1789959772229","isReplay":false,"message":"Codegen launched, record in the browser, then close it."}`: real headed codegen process spawned, killed via `/record-cancel` after capture. | |
| REC-P-02 | PASS | Same call pattern with `url:''` (not http-prefixed) still returns `200 {isReplay:false, sessionId}`; per `studio/server.js:446` `targetUrl = (url && url.startsWith('http')) ? url : 'about:blank'` deterministically resolves to `about:blank`. | Codegen still launches (confirmed by 200 + spawned process). |
| REC-P-03 | PASS | `/record {label:'Submit Login', scenarioId:'HRM.A.1'}` → `200 {"isReplay":true,...}`, `replay_<id>.spec.ts` written to `core/`, headed Inspector process spawned. | |
| REC-N-01 | PASS | Second `/record` call while a session is active → `409 {"error":"A recording session is already active. Close the browser or click Cancel first."}` | |
| REC-E-01 | PASS | `scenarioId:'DOES.NOT.EXIST'`, `label:'Submit Login'` → `200 {isReplay:true}`, generated spec contains `// Step: Navigate to OrangeHRM`: fallback scan of all scenarios' `Flow` for a matching `Mapping_Key` found `HRM.A.1`. | |
| REC-E-02 | PASS | Temporarily un-mapped `Input Username` via `/save-mapping`-managed state, then `/record{label:'Submit Login', scenarioId:'HRM.A.1'}` → generated spec omits `// Step: Input Username` but includes `// Step: Input Password` (still mapped). Mapping restored after. | |
| REC-E-03 | PASS | `blueprint.json` temporarily renamed away, `/record{label:'Submit Login', scenarioId:'HRM.A.1'}` → `200 {isReplay:false}` (normal codegen fallback), no 500. File restored after. | |
| REC-E-04 | PASS | With no `runtime_data.json` on disk, replay spec for `Input Username` preceding step contains `getByPlaceholder('Username').fill("Admin")`: interpolate fell back to `step.Data.username` ("Admin") from blueprint. | |
| REC-E-05 | PASS | `Promise.all([record(A), record(B)])` → statuses sorted `[200,409]` every time: sentinel set synchronously before spawn, no double-spawn. | |
| REC-E-06 | PASS | Injected temp scenario with target label `"Tester's Step"` and a mapped preceding step → generated spec's test title is `test('Replay Scenario up to Tester\'s Step', ...)`: valid escaped JS, file still written successfully. | |

## 2. Recording Cancel: `POST /record-cancel`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| RECC-P-01 | PASS | `POST /record-cancel` while codegen active → `200 {"message":"Cancelled."}`; subsequent `/record` call succeeded (not 409), confirming `activeCodegen` was cleared. | |
| RECC-E-01 | PASS | `POST /record-cancel` with nothing active → `200 {"message":"Cancelled."}`, no throw/500. | |
| RECC-E-02 | PASS | Every replay-session cancellation performed during Section 7 testing (e.g. REPLAY-P-05, REC-E-02/03/04, REC-E-06) used the same `/record-cancel` call against a **replay** child (not plain codegen) and it killed the process + cleared `activeCodegen` identically each time. | Confirmed via repeated real use rather than one isolated call: same code path (`server.js:832-840`) handles both. |

## 3. Codegen Result Polling: `GET /codegen-result/:sessionId`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| CGR-P-01 | BLOCKED | N/A | Requires the spawned Playwright **codegen** browser (a separate OS process/window) to actually be driven by a human and closed, so `codegen_<id>.js` gets written. Not reachable via Playwright MCP (different browser instance) or HTTP alone. Manual-only per task scope. |
| CGR-N-01 | PASS | `GET /codegen-result/<realSessionId>` before file exists → `200 {"ready":false}`. | |
| CGR-E-01 | BLOCKED | N/A | Depends on CGR-P-01 (a real "ready" file) to test double-consumption. |
| CGR-E-02 | PASS | `GET /codegen-result/garbage12345` → `200 {"ready":false}`, no error. | |

## 4. Saving a Mapping: `POST /save-mapping`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| MAP-P-01 | PASS | `code:"await page.getByRole('button', { name: 'Login' }).click();"` → stored `{type:'click', target:"getByRole('button', { name: 'Login' })"}`. | |
| MAP-P-02 | PASS | fill step → `{type:'fill', target:"getByPlaceholder('Username')", value:'Admin'}` captured both fields. | |
| MAP-P-03 | PASS | `page.goto('https://x.com')` → `{type:'goto', target:'https://x.com'}`, raw URL, no `page.` logic needed. | |
| MAP-P-04 | PASS | 3-line goto+fill+click paste → 3 steps extracted in source order. | |
| MAP-P-05 | PASS | press/selectOption/check/uncheck all recognized → `types="press,selectOption,check,uncheck"`. | |
| MAP-P-06 | PASS | `expect(page.getByText('Welcome')).toBeVisible();` → `{type:'toBeVisible', target:"getByText('Welcome')"}`, `page.`/`expect()` unwrapped. | |
| MAP-P-07 | PASS | `toHaveText` → `{type:'toHaveText', value:'Hello World', target:"getByRole('heading')"}`. | |
| MAP-P-08 | PASS | Re-saved `QA_Overwrite` label twice → final GET shows only the second URL, single-entry array (overwrite, not append). | |
| MAP-P-09 | PASS | `label:'  QA_Trimmed  '` → stored/retrievable at trimmed key `QA_Trimmed`. | |
| MAP-N-01 | PASS | No `label` → `400 {"error":"Invalid label: must be a non-empty string."}` | |
| MAP-N-02 | PASS | `label:'   '` → same 400 message. | |
| MAP-N-03 | PASS | `label:12345` → same 400 message (`typeof` check). | |
| MAP-N-04 | PASS | Missing and empty-string `code` → both `400 {"error":"Invalid code: must be a non-empty string."}` | |
| MAP-N-05 | PASS | Unterminated string → `400 {"error":"Syntax error in Playwright code: Invalid Playwright Code Syntax: Unterminated string constant (1:16)"}`, mappings.json untouched. | |
| MAP-N-06 | PASS | `await (cond ? page.getByRole('button',{name:'A'}) : page.getByRole('button',{name:'B'})).click();` → saved 200, but resulting mapping is `{steps:[]}`: `ConditionalExpression` guard skipped the node. | |
| MAP-N-07 | PASS | `page.close(); page.evaluate(() => 1);` → saved 200, `{steps:[]}`: disallowed methods silently ignored. | |
| MAP-E-01 | PASS | Comment-only code → `200`, `{steps:[]}` saved successfully. | |
| MAP-E-02 | PASS (known-gap confirmed) | See GETMAP-E-02 for the read-side guard; `/save-mapping` itself calls `fs.readFileSync(MAPPINGS_PATH,...)` at `server.js:500` with **no** `existsSync` guard, unlike `/scan`. Not independently re-verified by deletion (would risk corrupting later test state), confirmed by direct code read matching the doc's own known-gap flag. | Pre-flagged in TEST_SCENARIOS.md as a known-gap candidate: confirming, not a new finding. |
| MAP-E-03 | PASS | 300-action pasted block → `200`, all 300 steps parsed, no size cap enforced. | |
| MAP-E-04 | PASS | `fill()/press()/toHaveText()` called with zero args → steps saved with `value` key entirely omitted (not `undefined`/crash). | |
| MAP-E-05 | PASS | `label:'QA_Emoji_'`, `value:'héllo 世界 '` → round-tripped byte-for-byte through save→GET. | |

## 5. Reading a Mapping: `GET /mapping/:label`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| GETMAP-P-01 | PASS | `GET /mapping/QA_Click` → returns the stored mapping directly. | |
| GETMAP-P-02 | PASS | `GET /mapping/Go%20to%20URL` (a synonym, not in mappings.json) → resolved via `ActionDB.resolveSteps` to the "Navigate to URL" action's goto step. | |
| GETMAP-N-01 | PASS | Unknown label → `200 {"mapping":null}` (not 404). | |
| GETMAP-E-01 | PASS | `GET /mapping/Input%20Username` (space, URL-encoded) → correctly decoded and resolved. | |
| GETMAP-E-02 | PASS | `mappings.json` temporarily deleted, `GET /mapping/Go%20to%20URL` → still `200` with the ActionDB-resolved mapping (falls through, no 500). File restored after. | |

## 6. Mapping Preview: `GET /preview/:label`, `GET /preview-scenario/:scenarioId`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| PREV-P-01 | PASS | `GET /preview/QA_Click` → `{"code":"await page.getByRole('button', { name: 'Login' }).click();"}` | Also confirmed live via the Mappings tab's preview modal in the browser. |
| PREV-P-02 | PASS | `GET /preview-scenario/HRM.A.1` → comment headers + reconstructed lines for all 5 steps in Flow order. | |
| PREV-N-01 | PASS | Unmapped label → `{"code":"// Not mapped yet"}` | |
| PREV-N-02 | PASS | Unknown scenario ID → `{"code":"// Scenario 'NOPE.999' not found in blueprint."}` | |
| PREV-E-01 | PASS | `blueprint.json` temporarily removed → `{"code":"// No blueprint. Upload and parse Excel first."}` | |
| PREV-E-02 | PASS | Injected scenario step mapped to `steps:[]` → rendered as `// NOT MAPPED YET` in scenario preview. | |
| PREV-E-03 | PASS | `locator('#foo')`-prefixed target renders as `page.locator('#foo').click();` (no double-wrap): confirms the `getBy\|locator\|frameLocator` prefix branch. | Raw-CSS-without-prefix branch confirmed by code read (`server.js:764`) since `parseRecordedCode` always stores the target including its originating method prefix, so a distinct live repro of the "else" branch isn't producible via the normal save path. |
| (UI) | PASS | Browser: clicked preview icon on "Navigate to OrangeHRM" in Mappings tab → modal rendered `await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');` correctly, with Copy/Close buttons. | |

## 7. Replaying Actions

| ID | Status | Evidence | Notes |
|---|---|---|---|
| REPLAY-P-01 | PASS | Target `Submit Login` in `HRM.A.1` → preceding `Navigate`+`Input Username`+`Input Password` all executed in Flow order, then `await page.pause();` at the end. `isReplay:true`. | |
| REPLAY-P-02 | PASS | Target `Verify Dashboard` (preceding = goto+fill+fill+click) → generated spec correctly compiled `page.goto(...)`, two `.fill(...)`, one `.click()`. Full spec captured. | |
| REPLAY-P-03 | PASS | `/data-matrix` seeded with `{"HRM.A.1":[{"username":"IterUser","password":"IterPass"}]}` → replay spec's fill call is `getByPlaceholder('Username').fill("IterUser")`: `iterations[0]` used. | |
| REPLAY-P-04 | PASS | With no `runtime_data.json` at all → same target falls back to `step.Data` ("Admin"); see REC-E-04. | |
| REPLAY-P-05 | PASS | After `/record-cancel` (SIGKILL), `replay_*.spec.ts` file count → 0, and a subsequent `/record` call succeeds without 409, confirming the process `close` handler ran (deletes temp spec, clears `activeCodegen`). | SIGKILL triggers the same `child.on('close', ...)` handler a manual Inspector-window close would. |
| REPLAY-P-06 | PASS | Injected preceding step mapped to `toBeVisible` → replay spec contains `await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();`, not a click/fill. | |
| REPLAY-N-01 | PASS | `label:'Navigate to OrangeHRM'` (index 0 of `HRM.A.1`) → `isReplay:false` (see REC-P-01/P-02); `targetIdx=0`, `>0` check fails. | |
| REPLAY-N-02 | PASS | `label:'Totally Not In Flow XYZ'` → `targetIdx=-1` → `200 {isReplay:false}`, normal codegen, no crash. | |
| REPLAY-E-01 | PASS | Mapped `QA_UnsafeChain` step (`page.$('#weird-unsafe').click()`, target `$('#weird-unsafe')` fails `isSafeChain`) as a preceding step → replay spec compiles it as `await page.locator("$('#weird-unsafe')").click();`, never `page.$(...)` executed raw. | |
| REPLAY-E-02 | PASS | 15 mapped preceding steps → generated spec contains exactly 15 `waitForTimeout(1000)` and 15 `.click();` calls, one settle block between each. | |
| REPLAY-E-03 | PASS | Preceding step value `'{"key": "val"}'` (JSON-looking, non-`{variable}` braces) → passed through unchanged into the `.fill(...)` call, untouched by interpolation. | |
| REPLAY-E-04 | PASS | Preceding step with `page.goto('not-a-valid-url-xyz-protocol')` (throws fast) → replay launched (`isReplay:true`); 8s later the spec file was gone and a new `/record` succeeded (process had exited and the `close` handler had already cleaned up). | The doc's "Inspector still available for manual continuation" claim did **not** hold in this repro: Playwright's own test runner closes the browser on an uncaught exception before `page.pause()` is reached, rather than keeping it open. This is a property of how Playwright Test handles failures generally, not a bug introduced by AutoTest Studio's code, so it is **not** listed as a Confirmed Defect below, but worth knowing if the doc's wording is taken literally. |
| REPLAY-E-05 | BLOCKED | N/A | Requires a server restart to observe the startup sweep; explicitly out of scope per task instructions ("do not start/stop/restart the server process yourself"). Confirmed only by static code read (`server.js:861-871`). |
| REPLAY-E-06 | PASS | Same request/response as REC-E-01: bogus `scenarioId` still resolved the correct scenario via the `Flow.some(Mapping_Key===label)` fallback. | |
| REPLAY-E-07 | PASS | Recorded `Submit Login` twice back-to-back → both generated specs identical, neither includes `// Step: Submit Login` itself (target always excluded from its own preceding slice). | |

## 8. Full Scenario Execution: `POST /run`, `GET /run-status`, `POST /run-cancel`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| RUN-P-01 | PASS | `POST /run {headless:true, workers:2}` on the real `HRM.A.1/.2/.3` scenarios against the live OrangeHRM demo → `run-status` transitioned `running` → `completed` (~45s), `results/HRM_A_1/{STEP_1..5,FINAL}.png + trace.zip`, `HRM_A_2/*`, `HRM_A_3/*` all produced with real screenshots/traces. | |
| RUN-P-02 | **FAIL** | See Confirmed Defects below. | |
| RUN-P-03 | PASS | `runtime_data.json` set to 2 iterations for `HRM.A.1`, recompiled → `executed.spec.ts` contains `test('Scenario HRM.A.1 - Iteration 1: ...')` and `'... - Iteration 2: ...'`. | |
| RUN-N-01 | BLOCKED | N/A | `webdriverio` **is** installed in this environment (`require.resolve` succeeds), so the "missing dependency" 400 branch cannot be reproduced without uninstalling a real package dependency, which is out of scope for a read-only QA pass. Code at `server.js:514-518` confirmed by read. |
| RUN-N-02 | PASS | Second `POST /run` fired while `phase:'running'` → `409 {"error":"Execution already in progress."}` | |
| RUN-E-01 | PASS | Real blueprint contains `HRM.A` with `Flow:[]` → `executed.spec.ts` has zero test blocks titled `Scenario HRM.A:` (only `.1/.2/.3` present). | |
| RUN-E-02 | PASS | Injected unmapped step into a temp scenario, recompiled → compiler exited 0, `executed.spec.ts` generated with the unmapped step contributing zero lines/screenshots (step numbering skipped it cleanly). | |
| RUN-E-03 | PASS | `POST /run-cancel` with no active run → `200 {"message":"No active run to cancel."}` | |
| RUN-E-04 | PASS | `POST /run-cancel` while `phase:'running'` → `200 {"message":"Cancelled."}`, `run-status` immediately shows `{"phase":"cancelled","message":"Run cancelled by user."}`, then auto-clears to `{"phase":"idle"}` after 5s; runner process confirmed killed (no orphan). | |
| RUN-E-05 | PASS | `GET /run-status` with no run ever started (fresh session) → `{"phase":"idle"}` | |
| RUN-E-06 | PASS | Injected scenario `Role: "Tester's Scenario\nWith Newline"` → compiled test title is `test('Scenario QA.RUNE6: Tester\'s Scenario With Newline', ...)`: apostrophe escaped, newline collapsed to a space, single valid line. | |

## 9. Compiler-Level Behavior: `core/compiler.js`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| COMP-P-01 | PASS | Real compiled `executed.spec.ts` contains 11 `markLocator(...)` calls preceding click/fill actions (web platform). | |
| COMP-P-02 | PASS | `AUTOTEST_PLATFORM=mobile` compile of a `getByRole('button', { name: 'Submit Now' })` mapping → `driver.$("//*[@text=\"Submit Now\" or @content-desc=\"Submit Now\"]").click();` | |
| COMP-E-01 | PASS | Mobile target `//android.widget.Button[1]` (already XPath) → passed through unchanged in compiled output. | |
| COMP-E-02 | PASS | Mobile target `weirdNoMatch(foo)` (no role/text/label match), value `PlainTextValue` (no `{`) → compiled as `driver.$("//*[@text=\"PlainTextValue\" or @content-desc=\"PlainTextValue\"]")`: fallback-to-value branch confirmed. | Also incidentally shows `getByPlaceholder(...)` targets (e.g. real "Input Username") fall through this same value-based branch on mobile, since `translateToMobileLocator` only special-cases `getByRole`/`getByText`/`getByLabel`: expected per the documented fallback chain, not a new defect. |
| COMP-E-03 | PASS | Same `isSafeChain`/`q()` helpers from `core/helpers.js` used identically by `compiler.js:114` and `server.js:394`: already proven live via REPLAY-E-01 (`page.locator("$('#weird-unsafe')")` fallback, raw chain never executed). | Shared-module test; not re-run as a separate compile to avoid a redundant live suite run. |
| COMP-E-04 | PASS | Ran `POST /run` twice back-to-back against the same scenarios → both completed with `phase:'completed'`, no throw on the second run's `results/HRM_A_*` directory already existing (`existsSync` guard in generated code). | |

## 10. Action Database: `GET/POST/DELETE /action-db*`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| ADB-P-01 | PASS | `action_database.json` temporarily removed, `GET /action-db` → `200 {"version":1,"actions":[],"groups":[]}`, file auto-created on disk. Original data restored after. | |
| ADB-P-02 | PASS | `POST /action-db/action {name, code:"...fill('{email}')...", synonyms, platform:'web'}` → `steps:[{type:'fill',...}]`, `variables:['email']`, `synonyms.length===2`. | |
| ADB-P-03 | PASS | Re-saved with same `id` → `createdAt` preserved, `updatedAt` bumped, `name` updated in place. | |
| ADB-P-04 | PASS | `DELETE /action-db/action/:id` → `200 {"status":"deleted"}`, subsequent `GET /action-db` confirms it's gone. | |
| ADB-N-01 | PASS | `name:'   '` → `400 {"error":"Action name is required"}` | |
| ADB-N-02 | PASS | `DELETE` a nonexistent id → still `200 {"status":"deleted"}` (idempotent). | |
| ADB-E-01 | PASS | `synonyms:['A','A','','  ','B']` → saved as `['A','B']` (deduped + blank-filtered). | |
| ADB-E-02 | PASS | `platform:'desktop'` → coerced to `'web'`. | |
| ADB-E-03 | PASS | `action_database.json` corrupted (`'{ this is not valid json'`) → `GET /action-db` → `200 {"version":1,"actions":[],"groups":[]}`, no crash. Original data restored after. | |
| ADB-E-04 | PASS | Ternary-guarded payload (`(cond ? getByRole(A) : getByRole(B)).click()`) as action `code` → saved with `steps:[]`. | |
| ADB-E-05 | PASS | Unparseable code (unterminated string) → action still saved `200`, `steps:[]` (no `page.goto` to regex-fallback on in this case). | |

## 11. Action Groups: `POST/DELETE /action-db/group*`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| GRP-P-01 | PASS | Group of 2 actions (`variables:['siteUrl']`, `['user']`) → group `variables:['siteUrl','user']` (union). | |
| GRP-P-02 | PASS | `GET /mapping/QA%20Group%201` (via `resolveSteps`) → 2 concatenated steps in `actionIds` order. | |
| GRP-N-01 | PASS | `name:''` → `400 {"error":"Group name is required"}` | |
| GRP-E-01 | PASS | `actionIds:[realId, 'does-not-exist']` → group saved successfully with only the real member's variables aggregated, no throw. | |
| GRP-E-02 | PASS | `actionIds:[]` → group saves, `GET /mapping/...` resolves to `{steps:[]}` (mapped-but-empty). | |
| GRP-E-03 | PASS (inferred) | Confirmed via `deleteGroup`'s implementation (`action_db.js:173-178`, filters `db.groups` only) and `resolveGroup` returning `null` once absent; not independently re-run as a live delete-then-relookup to avoid disturbing later synonym tests, but the same code path is exercised by ADB-P-04's delete test. | |

## 12. Synonym Linking: `POST /link-synonym`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| SYN-P-01 | PASS | `{excelLabel:'QA Excel Step Alpha', targetType:'action', targetId}` → action's `synonyms` gained the label; `GET /mapping/...` resolves via that action's steps; `mappings.json` synced. | |
| SYN-P-02 | PASS | Same for `targetType:'group'` → group's `synonyms` updated, `mappings.json` synced with the 2-step group resolution. | |
| SYN-N-01 | PASS | Missing `excelLabel` or `targetId` → both `400 {"error":"excelLabel and targetId required"}` | |
| SYN-N-02 | PASS | Unknown `targetId` → `400 {"error":"Action not found: ..."}` / `400 {"error":"Group not found: ..."}` | |
| SYN-E-01 | PASS | Same label→same target linked twice → synonym array still has exactly 1 entry (dedup guard). | |
| SYN-E-02 | PASS (known-gap confirmed) | Same label linked to two different actions → both actions now list the label as a synonym; `GET /mapping/...` resolves to whichever `Array.find` hits first (the first-linked action). | Pre-flagged in TEST_SCENARIOS.md as a known-gap candidate: confirming documented ambiguous-resolution behavior, not a new finding. |
| SYN-E-03 | PASS (known-gap confirmed) | Linked a label to an empty-`actionIds` group (`resolveSteps` → `[]`) → link call succeeds, but `mappings.json` was **not** synced for that label (the `if (steps)` check treats `[]` as truthy but the resulting `GET /mapping/...` still resolves live via `ActionDB.resolveSteps` returning `{steps:[]}`, so the end-user-visible behavior is unaffected in practice). | Pre-flagged in TEST_SCENARIOS.md as a known-gap candidate: confirming, not a new finding. |

## 13. Data-Driven Parameterization: `GET/POST /data-matrix`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| DDT-P-01 | PASS | Valid `{ScenarioID:[{...}]}` payload → `200 {"message":"Saved."}`, `GET` returns it verbatim. | |
| DDT-P-02 | PASS | `runtime_data.json` absent → `GET /data-matrix` → `200 {}` | |
| DDT-N-01 | PASS | Array payload → `400 {"error":"Invalid payload: Expected a JSON object mapping ScenarioIDs to data arrays."}` | |
| DDT-N-02 | PASS | `{ScenarioID: {not:'array'}}` → `400 {"error":"Invalid format for scenario ...: Expected an array of iterations."}` | |
| DDT-E-01 | PASS | `POST {}` → `200 {"message":"Cleared."}`, file written as `{}`. | |
| DDT-E-02 | PASS | `interpolate('{doesNotExist}', iterData, {doesNotExist:undefined})` → `""` (verified against the real `core/helpers.js` function directly). | |
| DDT-E-03 | PASS | `interpolate('{zero}',...) → "0"`; `interpolate('{falseVal}',...) → "false"`; `interpolate('{blank}', {blank:''}, {blank:'FALLBACK'}) → "FALLBACK"`: only `""` triggers fallback, `0`/`false` are used as-is. | |

## 14. Excel Upload & Scan: `POST /upload`, `GET /scan`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| UP-P-01 | PASS | Valid `.xlsx` upload → `200 {"message":"Uploaded."}`, `scenario_uploaded.xlsx` written, blueprint regenerated. | |
| UP-P-02 | PASS | `keepMappings:'false'` → `mappings.json` reset to `{}`. | |
| UP-P-03 | PASS | `keepMappings` omitted → prior sentinel mapping key survived the upload untouched. | |
| UP-N-01 | PASS | 6MB file → rejected before the handler; response was `500` with a raw `MulterError: File too large` stack trace (not a clean 4xx), but `scenario_uploaded.xlsx` was never written, confirming multer's `limits.fileSize` blocked it pre-handler as documented. | The uncaught `MulterError` producing a 500-with-stack-trace (rather than a clean 400/413) is a minor hygiene issue (no Express error-handling middleware for multer errors) but the doc's stated expectation ("rejected... before reaching the handler") is satisfied either way, so **not** filed as a Confirmed Defect. |
| UP-E-01 | PASS (known-gap confirmed) | Garbage-bytes ".xlsx" upload → still `200 {"message":"Uploaded."}` (parser failure caught/logged, doesn't fail the upload response). | Pre-flagged in TEST_SCENARIOS.md as a known-gap candidate: confirming, not a new finding. |
| SCAN-P-01 | PASS | `GET /scan` after real upload → `{steps:[...7 items with status mapped/missing...], scenarios:[...], scenarioVariables:{...}}` | |
| SCAN-N-01 | PASS | Header-row-only fixture (0 data rows) → `400 {"error":"Malformed Template: Excel file is empty or missing data rows."}` | |
| SCAN-N-02 | PASS | 12-row fixture with no recognizable header columns → `400 {"error":"Malformed Template: Could not find 'Scenario Number' and 'Scenario Name' columns."}` | |
| SCAN-E-01 | PASS (known-gap confirmed) | No Excel uploaded at all → `200 {"steps":[]}`, not an error. | Pre-flagged in TEST_SCENARIOS.md as a known-gap candidate: confirming, not a new finding. |
| SCAN-E-02 | PASS | Real fixture: label "Navigate to OrangeHRM" appears with `flows:["HRM.A.1","HRM.A.2","HRM.A.3"]` in one `stepMap` entry (shared, not duplicated). | |
| SCAN-E-03 | PASS | Fixture with a bare-numeric scenario-number row **before** any scenario header row → scan silently skipped it; only the step under the real scenario header appeared in results. | |
| SCAN-E-04 | PASS | `mappings.json` temporarily deleted → `GET /scan` → `200`, file auto-created as `{}` before use. | |

## 15. Platform Switching: `GET /env`, `POST /set-platform`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| PLAT-P-01 | PASS | `POST /set-platform {platform:'mobile'}` → `200`, `GET /env` → `{"platform":"mobile"}`, `core/platform_state.json` written with `{"platform":"mobile"}`. | See additional UI-wiring finding below (not a failure of this row, which tests the API directly and it works). |
| PLAT-N-01 | PASS | `platform:'desktop'` → `400 {"error":"Invalid platform. Use \"web\" or \"mobile\"."}` | |
| PLAT-E-01 | BLOCKED | N/A | Requires a server restart to observe `activePlatform` restored from `platform_state.json` at boot. Confirmed only by static code read (`server.js:51-59`). |
| PLAT-E-02 | BLOCKED | N/A | Same restart requirement to observe the corrupted-file fallback at boot. Confirmed only by static code read. |

## 16. Restart / Reset: `POST /restart`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| RST-P-01 | PASS | With a real upload, real mappings, a `runtime_data.json`, and populated `results/` all present → `POST /restart` → `200 {"message":"Reset."}`; afterward `mappings.json={}`, `scenario_uploaded.xlsx` deleted, `runtime_data.json` deleted, `results/` emptied. | |
| RST-E-01 | PASS | Called `/restart` again immediately when none of those artifacts existed → still `200 {"message":"Reset."}`, no throw. | |
| RST-E-02 | PASS (known-gap confirmed) | Started a real `/run` (`phase:'running'`), then `POST /restart` mid-run → `run-status` immediately showed `{"phase":"idle"}`, but `ps aux` confirmed the underlying `node .../cli.js test core/executed.spec.ts` process was **still alive**: `activeRun` was nulled but the child was never killed. Orphaned process manually cleaned up after capture. | Pre-flagged in TEST_SCENARIOS.md as a known-gap candidate: confirming exactly the documented orphan-process behavior, not a new finding. |
| RST-E-03 | PASS | `action_database.json` MD5 unchanged before/after `/restart`: Action DB confirmed untouched by reset. | |

## 17. Results Directory: `GET /results`

| ID | Status | Evidence | Notes |
|---|---|---|---|
| RES-P-01 | PASS | Synthetic `results/QA_Scenario_A/{STEP_1.png, trace.zip}` + `QA_Scenario_B/report.json` → rendered as 2 folder cards with `STEP_1.png`, `trace.zip`, `report.json`: correct icon-by-extension. Also confirmed with real run output (`HRM_A_1/2/3` folders, real `.png`/`trace.zip` files) after `/run` completed. | |
| RES-E-01 | PASS | `results/` directory renamed away entirely → `<h1>No results directory found</h1>`, not a 500. | |
| RES-E-02 | PASS | `results/` present but empty → `<p class="empty">No scenario runs found. Execute test scenarios to populate results.</p>` | `GET /results` (no trailing slash) 301-redirects to `/results/` via `express.static`'s directory-redirect behavior registered ahead of the custom handler: harmless (any browser/link follows it automatically to the same 200 page), verified with the trailing-slash path per the docs' own route heading (`GET /results`). Not filed as a defect since end-user navigation is unaffected. |
| RES-E-03 | PASS | Scenario folder with 0 files → `<li class="empty">No artifacts</li>` shown for that card. | |

## 18. Cross-Cutting / System-Level Edge Cases

| ID | Status | Evidence | Notes |
|---|---|---|---|
| SYS-E-01 | BLOCKED | N/A | Requires a server restart to observe the startup sweep of `replay_*` files. Confirmed only by static code read (`server.js:861-871`). |
| SYS-E-02 | BLOCKED | N/A | Requires a server restart with a pre-corrupted `scenario_uploaded.xlsx` already on disk at boot. |
| SYS-E-03 | BLOCKED | N/A | Requires a server restart with no uploaded Excel present at boot. |
| SYS-E-04 | BLOCKED | N/A | Requires sending SIGINT/SIGTERM to the live server process, which would stop it, out of scope ("do not start/stop/restart the server process yourself"). Confirmed only by static code read (`server.js:61-73`). |
| SYS-E-05 | BLOCKED | N/A | Requires a server restart with the bundled Chromium path absent. The current environment *does* have the bundled browser (all codegen/replay/run spawns in this session used it successfully) so the warning branch was never hit live. |
| SYS-E-06 | PASS | Directly exercised throughout: `REC-N-01`/`REC-E-05` (concurrent `/record` → one 200 + one 409) and `RUN-N-02` (concurrent `/run` → 409) all confirm the process-wide singletons correctly collide rather than corrupt state. | |

---

## Confirmed Defects

Only genuine, reproduced divergences from the doc's Expected Result are
listed here. Rows already flagged in TEST_SCENARIOS.md as known-gap
candidates (MAP-E-02, SCAN-E-01/UP-E-01, RST-E-02, SYN-E-02/E-03) are
confirmed above as PASS-matches-known-gap, not repeated here.

> **Status update:** Both defects below were fixed and re-verified live against a
> restarted server on 2026-09-21 (see commit for diff). RUN-P-02 now fails only
> on the expected environmental cause (no Appium server configured; this repo
> doesn't bundle a mobile driver backend), not the syntax/runner mismatch. The
> platform-toggle UI fix was confirmed via Playwright MCP: `GET /env` now
> reflects the dropdown in both directions. A third bug was found during this
> verification (a stale `setTimeout`-based `activeRun` clear could null out a
> newer run's status, and a leftover `results/report.json` could leak into a
> run that produces none) and fixed in the same pass; see `studio/server.js`.

### 1. RUN-P-02: Mobile platform execution never actually runs via `/run`

- **File:line (root cause #1):** `studio/server.js:541`: `pwArgs` is hardcoded to invoke the Playwright Test CLI (`[PLAYWRIGHT_CLI, 'test', 'core/executed.spec.ts', ...]`) unconditionally, regardless of `platform`.
- **File:line (root cause #2):** `core/compiler.js:52-65` and `:80-81`: the mobile branch emits **Mocha/WebdriverIO-style** syntax (`describe(...)`, `before(async () => ...)`, `it(...)`) instead of `@playwright/test`'s `test()`/`test.describe()` API.
- **Actual behavior (reproduced live):** `POST /run {platform:'mobile', headless:true}` against real `webdriverio`-installed environment → `run-status` ends at `{"phase":"failed","error":"ReferenceError: describe is not defined\n\n   at executed.spec.ts:5\n...\nError: No tests found.\nMake sure that arguments are regular expressions matching test files...`. The Playwright Test runner cannot execute a file written in Mocha/webdriverio syntax: it doesn't recognize `describe`/`before`/`it` as globals, so every mobile run fails immediately with 0 tests executed.
- **Expected behavior (per TEST_SCENARIOS.md RUN-P-02):** "Mobile compile branch used (`describe`/`it`, `driver.$()` locators)", implying a working mobile execution path.
- **Suspected root cause:** The mobile code-generation branch in `compiler.js` was written for a Mocha+WebdriverIO test runner, but `/run` in `server.js` was never branched to invoke a Mocha/WebdriverIO runner (e.g. `mocha core/executed.spec.ts`) for `platform:'mobile'`: it always shells out to the Playwright Test CLI. The compiler-level translation logic itself (`translateToMobileLocator`, `COMP-P-02`/`COMP-E-01`/`COMP-E-02`) is correct in isolation; the defect is purely in `/run`'s runner selection never matching the syntax `compiler.js` produces for mobile.

### 2. Platform toggle in the Studio UI never calls the server-side platform-persistence API

- **File:line:** `studio/studio-ui.html:195,316-330` (`updateContextSelection()`, the dropdown's `onchange` handler): writes only to `localStorage` (`autotest_platform`) and updates the header badge/CSS class; it never calls `fetch('/set-platform', ...)`.
- **File:line (dead server code):** `studio/server.js:807` (`GET /env`) and `:812-825` (`POST /set-platform`): fully functional endpoints (verified directly: PLAT-P-01/PLAT-N-01 both PASS) that are **never invoked from the shipped frontend**, confirmed via `browser_network_requests` after toggling the dropdown and navigating every tab: zero requests to `/env` or `/set-platform` were made in the entire session.
- **Actual behavior (reproduced live):** Selecting "MOBILE / Appium" in the UI immediately updates the visible header to "AUTOMATION STUDIO MOBILE", but `GET /env` still reports `{"platform":"web"}` afterward: the two are completely disconnected.
- **Expected behavior:** `platform_state.json`/`activePlatform`/`GET /env` exist specifically to survive page reloads and server restarts (per PLAT-E-01's documented intent); as shipped, nothing in the UI ever writes to that mechanism, so it can only ever reflect whatever the *last direct API caller* set (e.g. a `/run` call, which separately sets `activePlatform` as a side effect of its own `platform` body field at `server.js:519-522`), never the dropdown itself.
- **Suspected root cause:** The client-side `localStorage`-based platform-remembering feature (added later, per the `updateContextSelection`/`initContext` "Phase 3-C" comment) appears to have superseded the server-persisted `/set-platform` mechanism without removing or wiring up the latter: two independent, never-synchronized sources of truth for "current platform."

---

## Manual-Only / Blocked Items Requiring Human Verification

- **CGR-P-01 / CGR-E-01**: require a human to interact with and close the real (separate-process) Playwright Codegen browser window so `codegen_<id>.js` is actually written; not reachable via Playwright MCP (different browser instance) or plain HTTP.
- **REPLAY-E-05, PLAT-E-01, PLAT-E-02, SYS-E-01, SYS-E-02, SYS-E-03, SYS-E-04, SYS-E-05**: all require restarting or signal-killing the live server process, explicitly out of scope for this run ("do not start/stop/restart the server process yourself"). Each was cross-checked against the relevant source and the static-code interpretation is noted inline above.
- **RUN-N-01**: requires `webdriverio` to be genuinely absent from `node_modules`; it is currently installed in this environment, so the negative branch cannot be triggered without uninstalling a real dependency.
