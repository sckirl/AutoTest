# Server Split Plan — `studio/server.js` → thin bootstrap + routers

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

> **Status:** plan, not yet executed. **Rule:** pure moves, zero logic changes. Every slice keeps
> route strings, guard order, response shapes, and path constants byte-identical.
> Source: [`blueprint.html`](../blueprint.html) §9.1 (component ownership), §12 (acceptance gates);
> Figma board AutoTest-Blueprint `0:1` (4 flows + reality boxes); `studio/server.js` @1391 lines.

## 0. Ponytail verdict on "one file per function" (read first)

Requested: a chunk per function. **Rejected as execution shape — kept as inventory.**
50+ files (15 server fns + 31 routes + 50 UI handlers + 30 core fns) would *increase*
breakage surface: more import graph, more cycle risk, more merge conflicts, harder
`grep`. Ponytail ladder: fewest files that hold. What follows maps **every function**
to its chunk (§2–§4) so nothing is unplaced, but chunks stay **flow-grouped (10 files)**.
Split a chunk further only when it passes ~350 lines *and* the two halves have zero
shared mutable state. See [[Ponytail Audit]].

## 1. Why split (and why this shape)

`server.js` owns 7 jobs today: bootstrap, path/env resolution, browser launching, process
cleanup, AST parsing, 31 routes, and listen/startup. Any edit risks an unrelated flow because
everything shares module scope. Target: **one job per file, one flow per router**, so a
Mappings change can never break Execute. No new abstractions (no service layer, no DI
container, no router factory); routers are plain `express.Router()` functions taking one
shared `ctx` object.

```
studio/
  server.js            # thin: env → ctx → app → listen (~60 lines)
  app.js               # express app, CORS, static, multer, mount routers (~120)
  context.js           # THE shared mutable state + path constants (~80)
  lib/
    paths.js           # isPackaged, runNodeScript, dir constants (~60)
    browser.js         # PLAYWRIGHT_CLI, BUNDLED_BROWSER, getBrowserEnv, launch* (~140)
    process.js         # trackedProcesses, cleanupAll, signals (~40)
    parse.js           # parseRecordedCode, stepsToLines (~120)
  routes/
    intake.js          # /upload, /scan, /save-expected-result, /data-matrix ×2,
                       # /env, /set-platform (~260)
    map-record.js      # /record, /codegen-result/:id, /record-cancel, /save-mapping,
                       # /mapping/:label, /preview/:label, /preview-scenario/:id (~330)
    library.js         # /action-db, /action-db/action, /action-db/action/:id,
                       # /action-db/group, /action-db/group/:id, /link-synonym (~120)
    suggest.js         # /suggest/status, /suggest, /reject, /accept, /cancel
                       # + readSuggestionContext/parseSuggestion/persistMapping (~250)
    run.js             # /run, /run-status, /run-cancel, /restart, GET /results (~280)
```

`GET /` + `/results` static stay in `app.js` (mounting, not business logic).
`studio-ui.html` (1761 lines, 50 handlers) is **NOT split** — single-file vanilla UI is
the air-gap contract (no build step, open-and-read). Its handler inventory lives in §4
for cross-referencing routes only.

## 2. Every function in `server.js` → target chunk (complete)

### 2.1 Module-scope state (→ `context.js`)

| Name | Line | Kind | Shared with | Move note |
|---|---|---|---|---|
| `activeRun` | 64 | `let null` | `/run`, `/run-cancel`, `/restart`, `/record` guard, `/suggest` guard, `GET /run-status` | field `ctx.state.activeRun`; never destructure |
| `globalBrowser` | 65 | `let null` | `cleanupAll`, exit hook only — nothing assigns | **delete** per [[Ponytail Audit]] #1 (with exit-hook handler), do not move |
| `trackedProcesses` | 66 | `Set` | `cleanupAll`, `launchVisible*`, `/run` spawn, cancels | `ctx.proc.tracked`; lib/process owns add/remove helpers |
| `activeCodegen` | 67 | `let` | `/record`, `/run` guard, `/suggest` guard, `/record-cancel`, `/restart` | `ctx.state.activeCodegen`; sentinel object shape (`{killed,exitCode,isSuggestion?,isCdp?}`) preserved |
| `activeRunner` | 68 | `let` | `/run`, `/run-cancel` | `ctx.state.activeRunner` |
| `activeSuggestion` | 69 | `let` | 5 suggest routes, `/restart`, `/record-cancel` suggestion branch | `ctx.state.activeSuggestion` |
| `activePlatform` | 72 | `let 'web'` + restore 73–80 | `/run`, `/set-platform`, `GET /env` | `ctx.state.activePlatform`; restore block moves into `context.js` init |
| path consts `CORE_DIR/ROOT_DIR/DATA_DIR/RESULTS_DIR/MAPPINGS_PATH/UPLOADED_EXCEL/RUNTIME_DATA_PATH/PLATFORM_STATE_PATH` | 40–47 | `const` | every route | `ctx.paths.*`; routers never recompute |
| `PLAYWRIGHT_CLI` | 52–62 | `let` + try/catch chain | `launchVisibleCodegen`, `/run` pwArgs | resolved once in `lib/browser.js`, exposed as `ctx.bundled.playwrightCli` |
| `BUNDLED_BROWSER` | 162 | `const` cached | `getBrowserEnv`, launchers, `/run` env | `ctx.bundled.browser`; cache-at-startup preserved |

### 2.2 `lib/paths.js` — packaged-path logic (load-bearing, move verbatim)

| Fn | Line | Callers | Ponytail note |
|---|---|---|---|
| `isPackaged()` | 109 | `runNodeScript`, launchers, `/run` config-copy branch | one-liner; `__dirname.includes('app.asar')` — keys off file location, keep fn in `studio/` tree |
| `runNodeScript(relScript, args)` | 110–123 | `/upload`, `/run` (parser+compiler), startup rebuild | dev/packaged two-branch + `RUN_AS_NODE`; each branch encodes a real `.dmg` failure — never "simplify" to one branch |

### 2.3 `lib/process.js` — lifecycle

| Fn | Line | Callers | Note |
|---|---|---|---|
| `cleanupAll()` | 82–91 | SIGINT/SIGTERM | kills `trackedProcesses`; `globalBrowser` branch deleted with var |
| signal registration | 93–94 | boot only | registered once by `server.js`, never by routers |
| exit hook (`process.on('exit')`) | 235–239 | — | deleted with `globalBrowser` (dead: only closes never-assigned var) |

### 2.4 `lib/browser.js` — browser resolution + spawning

| Fn | Line | Callers | Note |
|---|---|---|---|
| `getBundledBrowserPath()` | 130–159 | startup (once) | OS-first order (win32→darwin→linux + fallback); dedup with `playwright.config.ts:resolveBundledBrowser` is [[Ponytail Audit]] #2 — do as separate shrink *after* split |
| `getBrowserEnv(extraEnv)` | 165–177 | launchers, `/run` pwEnv | pure env merge; takes `ctx.bundled` values as params, no ctx import |
| `launchVisibleCodegen({targetUrl,outputPath})` | 179–204 | `/record` plain-codegen branch | spawn + track + `activeCodegen` set/clear + close-unlink log; receives `ctx` for guard refs |
| `launchVisibleReplay({specPath})` | 206–232 | `/record` replay branch | + packaged config-copy + `--headed` + spec-unlink on close; merge with codegen launcher is audit #3 — *after* split, guarded by replay regression test |

### 2.5 `lib/parse.js` — AST + rendering (security load-bearing)

| Fn | Line | Callers | Note |
|---|---|---|---|
| `parseRecordedCode(code)` | 880–943 | `/save-mapping`, `persistMapping` (suggest accept), `parseSuggestion` | Acorn+walk, `substring(node.start,node.end)`, `setInputFiles` throw, assertion unpack — **verbatim, no simplification** |
| `stepsToLines(steps)` | 1236–1247 | `/preview/:label`, `/preview-scenario/:id` | renderer dedup with compiler emit is audit #4 — *after* split, with preview golden tests |

### 2.6 `routes/intake.js` — upload / scan / matrix / platform

| Route/handler | Line | Uses (fns/state/stores) | Note |
|---|---|---|---|
| `POST /upload` | 326–365 | `runNodeScript`, `MAPPINGS_PATH/RUNTIME_DATA_PATH/UPLOADED_EXCEL`, `blueprint_warnings.json` | execFileSync argv (space-in-path), parse-then-rename atomicity, keepMappings gate — move whole |
| `GET /data-matrix` | 367–372 | `RUNTIME_DATA_PATH` | trivial read |
| `POST /data-matrix` | 374–396 | `RUNTIME_DATA_PATH` | strict-shape validation block moves whole; empty `{}` clears |
| `GET /scan` | 398–453 | `MAPPINGS_PATH/UPLOADED_EXCEL/blueprint.json`, `generateBlueprintFromExcel`, `ActionDB.resolveSteps/extractVariables` | real-parser route (A0.6.5), mappings→ActionDB fallback, `scenarioVariables` harvest |
| `POST /save-expected-result` | 455–476 | `blueprint.json` | field validation + row lookup moves whole |
| `GET /env` | 1286 | `ctx.state.activePlatform` | one-liner |
| `POST /set-platform` | 1291–1304 | `ctx.state.activePlatform`, `PLATFORM_STATE_PATH`, `process.env.AUTOTEST_PLATFORM` | allowlist `web/mobile` only; persists + env sets |

### 2.7 `routes/map-record.js` — record / replay / mapping / preview / cancel

| Route/handler | Line | Uses | Note |
|---|---|---|---|
| `cdpErrorMessage / cdpErrorStatus` | 487–498 | `CDP_MESSAGES` const | move const + both fns together; no-stack-to-tester policy |
| `POST /record` | 500–623 | guards (`activeCodegen→activeRun→platform allowlist`), blueprint+mappings read, `interpolate/isSafeChain/q`, `ActionDB.resolveSteps`, `RUNTIME_DATA_PATH`, `launchVisibleReplay/launchVisibleCodegen` | **guard order frozen**; replay-precursor builder (574–609) moves whole incl. Library fallback + `waitForTimeout(1000)` + `page.pause()` |
| `GET /codegen-result/:sessionId` | 627–645 | `safeSessionId`, `CORE_DIR` containment | traversal guard + single-read-delete moves whole |
| `POST /save-mapping` | 648–678 | `parseRecordedCode`, `tokenizeLiterals`, `blueprint.json`, `MAPPINGS_PATH` | label/code validation + literal-tokenize-with-scenarioId moves together |
| `GET /mapping/:label` | 1215–1231 | `MAPPINGS_PATH`, `ActionDB.resolveSteps` | mappings→ActionDB fallback |
| `GET /preview/:label` | 1249–1263 | same + `stepsToLines` | `// Not mapped yet` contract |
| `GET /preview-scenario/:scenarioId` | 1266–1283 | `blueprint.json`, mappings, ActionDB, `stepsToLines` | execution-order lines + `NOT MAPPED YET` markers |
| `POST /record-cancel` | 1311–1331 | `ctx.state.activeCodegen/activeSuggestion`, `cdpSession.stopCodegenRecording` | 3 branches: suggestion / CDP / spawned kill — **kills codegen only, never runner** |

### 2.8 `routes/suggest.js` — optional LLM (all-or-nothing move)

| Fn/route | Line | Uses | Note |
|---|---|---|---|
| `readSuggestionContext` | 945–986 | blueprint, mappings, `ActionDB.resolveSteps`, `RUNTIME_DATA_PATH` | sequential-map computation (`firstMissing`), 400s with `statusCode` |
| `parseSuggestion` | 988–1005 | `parseRecordedCode`, `isSafeChain` | `CANNOT_MAP` + unsafe-locator reject |
| `persistMapping` | 1007–1021 | `parseRecordedCode`, `tokenizeLiterals`, blueprint, `MAPPINGS_PATH` | shared with `/save-mapping` logic — import from `lib/parse.js`, do not duplicate |
| `generateSuggestion` | 1023–1052 | `resolveProvider/complete/buildPrompt`, `cdpSession.executeSteps`, aria snapshot (2000ch cap) | propose→parse→execute→snapshot-refresh; throw→rejected path |
| `GET /suggest/status` | 1055–1058 | `resolveProvider`, `activeSuggestion` | tiny; disabled-without-key contract |
| `POST /suggest` | 1060–1111 | all above + `cdpSession.getPage/rewind` | 409 matrix (disabled / busy / run-active / sequential-next-first) + 3-attempt loop + `cannot_map`/exhaust teardown |
| `POST /suggest/reject` | 1113–1135 | `rewind`, `generateSuggestion` | 429 at ≥3; rejected-list grows |
| `POST /suggest/accept` | 1137–1150 | `persistMapping` | custom-code-or-proposal body; clears session |
| `POST /suggest/cancel` | 1152–1156 | session clear | clears suggestion-guarded codegen only |

### 2.9 `routes/library.js` — canonical store (smallest router)

| Route | Line | Uses | Note |
|---|---|---|---|
| `GET /action-db` | 1159–1164 | `ActionDB.read` | — |
| `POST /action-db/action` | 1166–1172 | `ActionDB.saveAction` | upsert w/ stable id |
| `DELETE /action-db/action/:id` | 1174–1179 | `ActionDB.deleteAction` | + group-ref detach inside ActionDB |
| `POST /action-db/group` | 1181–1187 | `ActionDB.saveGroup` | member-id order persisted |
| `DELETE /action-db/group/:id` | 1189–1194 | `ActionDB.deleteGroup` | — |
| `POST /link-synonym` | 1196–1212 | `ActionDB.linkSynonym/resolveSteps`, `MAPPINGS_PATH` sync | synonym-append + mappings-cache write move **together** (split-brain risk if separated) |

### 2.10 `routes/run.js` — execution lifecycle

| Route | Line | Uses | Note |
|---|---|---|---|
| `POST /run` | 682–860 | `normalizePlatform`, webdriverio resolve, `ctx.state.*`, `runNodeScript` (parser+compiler), `PLAYWRIGHT_CLI/BUNDLED_BROWSER/getBrowserEnv`, `RESULTS_DIR`, packaged `--config` copy | longest handler; phase `compiling→running→completed/failed`, stale-report unlink, `thisRun` 60s guard, `RUN_AS_NODE` packaged env, real-error readback (`compile_error.json`/`blueprint_warnings.json`) — move whole, split internally never |
| `GET /run-status` | 1306–1309 | `activeRun` | `idle` when null |
| `POST /run-cancel` | 1334–1346 | `activeRunner/activeRun` | kills runner only; `cancelled` + 5s clear |
| `POST /restart` | 862–876 | `activeRun/activeSuggestion/activeCodegen(isSuggestion)`, `MAPPINGS_PATH/UPLOADED_EXCEL/RUNTIME_DATA_PATH/RESULTS_DIR` | destructive; suggestion-session clear included |
| `GET /results` index | 258–325 | `RESULTS_DIR` | string-concat HTML (audit #6: escape `${dir}/${f}` in same move — safe: output-only, no route change) |

### 2.11 `app.js` + thin `server.js` (what stays at top level)

`app.js`: `express()` + CORS (`localhost:3000` allowlist) + `express.json()` + static
`studio/` + `/results` static + multer (destination `ctx.paths.DATA_DIR`, per-request
`scenario_upload_staging_<uuid>.xlsx`, 5MB) + `GET /` + router mounts.
`server.js` (~60 lines): DRIVERS bootstrap (module.paths hack **first**) → `loadRuntimeEnv`
→ build `ctx` → `require('./app')(ctx)` → PORT validation (digits + ≤65535) →
`listen(PORT||0)` + error/exit handlers → on `listening`: `STUDIO_PORT=` log (Electron
parses), orphan sweep, mappings ensure, blueprint rebuild.

## 3. Every function in `core/*` / `electron` / `config` (usage map — mostly already split)

| File | Fn | Used by | Chunk verdict |
|---|---|---|---|
| `helpers.js` (245) | `getAcorn/resolveDriversRoot/ensureDriversPath` | server boot, parser, compiler | **keep** — single shared home, already correct |
| | `isSafeArg/isSafeChainNode/isSafeChain` | compiler, `parseRecordedCode`, `parseSuggestion` | keep, never duplicate |
| | `interpolate/q/tokenizeLiterals` | `/record` replay, `/save-mapping`, `persistMapping`, compiler | keep |
| | `sweepOrphans/safeSessionId/normalizePlatform/hasSensitiveKey/buildCodegenArgs/buildCodegenEnv` | boot sweep, codegen-result guard, platform allowlists, launchers | keep |
| `action_db.js` (261) | `extractVariables/parseCodeToSteps` (pure) + `ActionDB.{init/read/write/saveAction/deleteAction/saveGroup/deleteGroup/resolveAction/resolveGroup/getGroupSteps/linkSynonym/resolveSteps}` | `/scan`, previews, replay, compiler, library routes, `/link-synonym` | **keep whole** — splitting the object litters 13 files for one JSON store; internal methods share `DB_PATH` + corrupt-backup policy |
| `compiler.js` (233) | `compile()` (single entry; emit branches web/mobile + evidence/redaction inline) | `/run` child process | **keep whole** — one pure in/out unit; split only if mobile emitter exceeds ~100 lines (then `emitMobile.js`, not per-fn) |
| `scenario_parser.js` (151) | `generateBlueprintFromExcel` | `/upload`, `/scan` fallback, `/run`, boot rebuild | keep whole — single parse+warn unit |
| `cdp_session.js` (278) | `err/resolveSystemChromePath/isIsolatedProfile/resolveRealProfileDir/isChromeRunning/probeCdp/ensureDebugChrome/getPage/startCodegenRecording/stopCodegenRecording/executeSteps/runStepsThenPause/rewind/evalChain/_reset` | `/suggest*` (getPage/execute/rewind), `/record-cancel` (stop), record-CDP branch | **largest split candidate after server.js**: `chrome.js` (resolve/ensure/probe) + `session.js` (getPage/execute/rewind/runSteps) + keep `evalChain` quarantined with its warning comment. Only if touched — else leave |
| `llm.js` (39) | `resolveProvider/buildRequest/complete` | suggest status + `generateSuggestion` | keep — 39 lines, splitting is the joke |
| `prompt.js` (24) | `buildPrompt` | `generateSuggestion` | keep |
| `runtime_env.js` (40) | `parseDotEnv/loadDotEnv/loadRuntimeEnv` | server boot, electron main | keep |
| `electron/main.js` (79) | `startServerAndWindow` (+exit/stdout handlers) | app lifecycle | keep — one lifecycle unit; window-before-fork order is load-bearing (startup test) |
| `playwright.config.ts` (77) | `resolveBundledBrowser` | runner | dedup with `getBundledBrowserPath` per audit #2 — after split, not during |

## 4. `studio-ui.html` handler inventory (50 — NOT split, mapped for route cross-ref)

Single file stays. Groups + the routes they call, so a UI edit finds its server chunk:

- **Suggest:** `loadSuggestStatus, setSuggestionLoading, suggestStep, rejectSuggestion, acceptSuggestion, editSuggestion` → `routes/suggest.js`
- **Tabs/storage:** `safeStorageGet/Set, updateContextSelection, initContext, switchTab` → local only
- **Intake:** `handleFile` → `/upload`; `scanSteps` → `/scan`+`/action-db`; `renderSidebar` → local drag cards
- **Library:** `loadActionLibrary, renderActionLibList, renderGroupLibList, openCreateActionModal, openEditActionModal, closeActionLibModal, saveActionLibFromModal, deleteActionFromLib, openCreateGroupModal, openEditGroupModal, renderGroupActionsPicker, closeGroupLibModal, saveGroupLibFromModal, deleteGroupFromLib, linkStepToLibrary` → `routes/library.js` (+`/link-synonym`)
- **Record/manual:** `extractCodegenBody, startCodegenPoll, resetSaveToLibToggle, openRecordModal, openManualModal, closeModal, saveMapping` → `routes/map-record.js`
- **Run/results:** `cancelRun, pollRunStatus, getAllSpecs, renderResultsDashboard` → `routes/run.js`
- **Shared:** `showStatus, previewStep, previewScenario, copyPreview, restartSystem, pasteFromClipboard, initDataMatrix, renderDataMatrixUI, saveDataMatrixStateFromDOM` → map-record / run.js / intake.js per call

If the UI ever passes ~2000 lines: extract by **tab** (mappings.js, library.js, matrix.js, execution.js as plain `<script>` includes — no bundler, air-gap safe), never per-function.

## 5. The one breakage risk: shared mutable sentinels

`activeCodegen/activeRun/activeRunner/activeSuggestion` are cross-route mutexes
(record↔run 409s, suggest↔record 409s, cancel branches). If each router gets its own copy,
guards silently stop working and recordings race runs.

**Fix:** `context.js` exports one object; routers mutate `ctx.state.*`, never
destructure. `launchVisibleCodegen` receives `ctx` and sets `ctx.state.activeCodegen`.

```js
// context.js — the only shared-mutable module. No requires of routers/lib (no cycles).
module.exports = { paths: {...}, state: { activeRun:null, activeCodegen:null, ... } };
```

Cycle rule: `context.js` ← `lib/*` ← `routes/*` ← `app.js` ← `server.js`. Nothing points up.

## 6. Slice order (each independently verifiable, abort-safe)

| Slice | Move | Verify (must all pass before next) |
|---|---|---|
| 1 | `lib/paths.js` + `lib/process.js` + `context.js` shell; server.js requires them | `node --check`, `npm test`, boot log same sweep count |
| 2 | `lib/browser.js` (§2.4) | record smoke (409 when busy), `/run` dry path; black-box record rows |
| 3 | `lib/parse.js` (§2.5) | `tokenize_literal_test` + preview golden diff |
| 4 | `routes/library.js` (§2.9) + `routes/intake.js` (§2.6) | upload→scan→link loop; AL rows; `replay_mapping_test` |
| 5 | `routes/map-record.js` (§2.7) | replay incl. Library steps; manual save; cancel kills codegen only |
| 6 | `routes/suggest.js` (§2.8) + `routes/run.js` (§2.10) + thin `server.js` + `app.js` (§2.11) | suggest 409 matrix; run lifecycle; EX rows |

Rollback per slice: `git revert` — slices never overlap, single-commit revert.
Ponytail cuts (audit #1 delete, #6 escape) ride inside slices 1 and 6 — no separate
"cleanup" commits that touch the same lines twice.

## 7. Scalability rules for future routes (enforced in review)

1. New flow → new file in `routes/`; never append past ~350 lines — split the flow instead.
2. New shared pure function → `core/helpers.js`; `lib/parse.js` only for AST-dependent code.
3. New writable JSON → path constant in `context.js` from `AUTOTEST_STATE_DIR`; never `__dirname`-relative (AL-03 lesson).
4. New cross-route guard → field on `ctx.state` + branch in owning cancel route; document in §5 table.
5. No router requires another router. Shared reads via `ActionDB`/`context.js`/JSON stores.
6. No per-function files. A chunk splits only when >350 lines AND halves share no mutable state.

## 8. Done-when

- `node --check studio/*.js studio/**/*.js` clean; `npm test` green; route list diff identical (31).
- Black-box loop (AGENTS.md §4) re-runs touched TEST_SCENARIOS rows per slice; zero defects per slice scope.
- CHANGE-LOG entry per slice (AGENTS.md §2.1); this file's status line flips to `executed`.
