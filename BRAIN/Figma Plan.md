# Figma Plan — yellow boxes are the build list

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

> **Authority:** the FigJam board AutoTest-Blueprint `0:1` is the plan. **Yellow fill
> (`255,201,67`) = change to apply soon.** White = current flow as drawn. Blue
> (`194,229,255`) = already-applied reality correction, do not re-implement.
> No code outside these items until they are done.
>
> Source: board dump 2026-10-08 (4 sections, 11 yellow nodes). Code refs verified
> against master before writing. Conflicts with existing backend defaults are resolved
> explicitly per item — the resolution written here is the decision, not a suggestion.

## 0. Yellow inventory (complete — 11 nodes, 9 work items)

| # | Node | Section | Figma text | Work item |
|---|---|---|---|---|
| Y1 | `0:9` | Upload | Upload .xlsx or .csv with DPR Template. Limit is 5 MB | §1 CSV upload |
| Y2 | `0:15` | Upload | Same variables with mappings.json? | §2 mappings-compat gate |
| Y3a | `1:126` | Upload/Mappings | User wants Mapping AI Suggestion? | §3 Suggest branch |
| Y3b | `25:2842` | Upload/Mappings | AI API and Server available? | §3 availability gate |
| Y4 | `1:235` | Upload/Mappings | User wants to see Code Preview or input Manual Script Mapping? | §4 Preview-vs-Manual |
| Y5 | `1:1792` | Upload/Mappings | Request and thinking Process Displayed to the user (view-only, disabled text) | §5 thinking display |
| Y6 | `14:425` | Upload/Mappings | Manual Map is Data Matrix {var}? (+ blue `14:476` exclamation clears when iteration added) | §6 {var} indicator |
| Y7 | `14:877` | Data Matrix | All {vars} have >= 1 iteration? | §7 iteration gate |
| Y8a | `14:1120` | Execute | Worker Count == 1 | §8 worker-coupled headless |
| Y8b | `14:1231` | Execute | Headed Execution Checkbox Disabled (user can't change to TRUE), Change to FALSE | §8 forced headless |
| Y9 | `15:1997` | Execute | Execution Status Success/Failed? | §9 terminal status |

## 1. Y1 — CSV upload (`0:9`)

**Figma requires:** picker accepts `.xlsx` **or** `.csv` (DPR template), 5 MB limit stays.
**Current code:** `studio-ui.html:243` `accept=".xlsx"`; `server.js:251` staging forces
`.xlsx` suffix; `server.js:255` 5 MB limit (already correct); parser reads first sheet
via `XLSX.readFile` (CSV lands as single sheet — verify, don't assume).
**Change:**
1. UI `accept=".xlsx,.csv"` + drop-zone copy update (currently says `.xlsx`).
2. Multer: accept both extensions (fileFilter), staging filename preserves incoming ext.
3. Parser: prove CSV through `generateBlueprintFromExcel` with a committed fixture
   (e.g. `tests/fixtures/dpr_template.csv`); fix only what the fixture proves broken.
4. Keep: 5 MB, parse-then-rename atomicity, warnings channel, runtime-data wipe.
**Touchpoints:** `handleFile`, `POST /upload`, `generateBlueprintFromExcel`.
**Acceptance:** upload `.csv` → blueprint + scan rows identical shape to same-content `.xlsx`;
oversize `.csv` rejected with visible error; `.txt` still refused.
**Tests:** new CSV fixture through parser test + upload-path test.
**Split chunk:** `routes/intake.js`. **Order:** with intake slice.

## 2. Y2 — mappings-compat gate (`0:15`)

**Figma requires:** after parse, decide by compatibility with `mappings.json` before the
keep/wipe confirm (`0:18`) and Override? (`0:19`) branch.
**Current code:** `handleFile` (`studio-ui.html:552-581`) always shows one generic
confirm; no key/variable comparison exists.
**Change (safe — never auto-wipe):** server computes overlap of new blueprint
`Mapping_Key` set vs existing `mappings.json` keys and returns
`compat: {blueprintKeys, mappedKeys, overlap}` in `POST /upload` response. UI tailors
the confirm: overlap > 0 → keep/wipe choice as today; overlap = 0 → message says no
overlapping steps (fresh mappings recommended) but the user still decides.
**Touchpoints:** `POST /upload`, `handleFile`.
**Acceptance:** same-keys re-upload offers keep (today's behavior, now informed); wholly
new workbook says so explicitly; Cancel still wipes to `{}`; OK still keeps.
**Tests:** upload-response compat unit + UI copy branch. **Split chunk:** `routes/intake.js`.
**Order:** with intake slice, after Y1.

## 3. Y3 — Suggest branch + availability gate (`1:126`, `25:2842`)

**Figma requires:** Suggest is an explicit per-row branch; behind it, "AI API and Server
available?" decides Suggest-enabled vs **button disabled** (connector `25:2889` already
draws the disabled path).
**Current code:** Suggest button iff missing + `llmEnabled` + attempts < 3
(`studio-ui.html:717-731`); `llmEnabled` comes from `GET /suggest/status`, which checks
env presence only (`core/llm.js:resolveProvider`) — a dead/unreachable base URL still
shows an enabled button until the first request fails.
**Change:**
1. `GET /suggest/status` returns `{enabled, reachable, active}`; `reachable` via short-timeout
   probe of the configured base URL (any HTTP response = reachable; network error/timeout =
   not). No token-burning chat call for the probe.
2. UI disables Suggest when `!enabled` (tooltip: not configured) or `!reachable`
   (tooltip: server unreachable) — matching Figma's disabled path — attempts cap unchanged.
**Touchpoints:** `loadSuggestStatus`, `scanSteps` Suggest branch, `GET /suggest/status`,
`resolveProvider` + probe helper in `core/llm.js`.
**Acceptance:** bad URL/key → disabled button with unreachable copy before any click;
good server → enabled; matrix of 503/409/429 paths unchanged.
**Tests:** status-probe unit (mock fetch), UI disabled-state branch.
**Split chunk:** `routes/suggest.js` + UI suggest handlers. **Order:** with suggest slice.

## 4. Y4 — Preview vs Manual decision (`1:235`)

**Figma requires:** explicit fork — *see* code preview (read-only) **or** *input* manual code.
**Current code:** Preview button iff mapped (`previewStep`); Manual always, and it loads
existing code *into* the editable textarea (`openManualModal`, `studio-ui.html:1286-1301)
— view and edit are conflated.
**Change (minimal):** Manual modal gains a read-only "Current saved code" block fed by
`GET /preview/:label`; the textarea stays for new input. Preview button/modal unchanged.
**Touchpoints:** `openManualModal`, modal markup, `GET /preview/:label` (read-only reuse).
**Acceptance:** mapped step → Manual shows saved code read-only + empty-or-editable input;
unmapped step → read-only block shows `// Not mapped yet`; save path identical.
**Tests:** UI branch test. **Split chunk:** `routes/map-record.js` (preview stays).
**Order:** with map-record slice.

## 5. Y5 — thinking-process display (`1:1792`)

**Figma requires:** during generation, request + thinking process visible as view-only
disabled text.
**Current code:** `suggestStep` (`studio-ui.html:365-413`) clears the code area, sets
placeholder, locks controls via `setSuggestionLoading(true)` — no request summary shown.
**Change:** while loading, populate `codeArea.value` (still `readOnly`) with a short
request summary — step label, scenario, data keys present, rejected count, attempt
number — plus a "reasoning… controls disabled" line; replace with proposal on resolve.
Never dump the full aria snapshot or secrets; test data keys only, not a second scrollback.
**Touchpoints:** `suggestStep`, `rejectSuggestion`, `setSuggestionLoading`.
**Acceptance:** click Suggest → disabled textarea shows request summary before proposal
arrives; reject → summary updates with attempt+1; accept/edit path unchanged.
**Tests:** UI loading-state test. **Split chunk:** UI suggest handlers (no server change).
**Order:** with suggest slice, after Y3.

## 6. Y6 — Manual-{var} indicator (`14:425` + blue `14:476`)

**Figma requires:** after a manual save, if the mapping contains `{var}` the Data Matrix
shows an exclamation until an iteration is added; without `{var}` it lands straight in
`mappings.json`.
**Current code:** `/save-mapping` always writes mappings + tokenizes (no fork — correct);
Data Matrix renders no missing-iteration marker (`renderDataMatrixUI` skips var-less
scenarios, otherwise silent).
**Change (no server fork — derived UI state):** `renderDataMatrixUI` adds a ⚠ badge in
each scenario header whose harvested vars (`scenarioVariables` from `/scan`) have zero
saved iterations in `currentRuntimeData`; badge disappears the moment an iteration is
added/saved. Mappings tab shows the same hint on rows whose resolved steps carry vars
with no iteration. Save path untouched.
**Touchpoints:** `renderDataMatrixUI`, `scanSteps` row hint, `initDataMatrix` data.
**Acceptance:** manual save with `{username}` + no iteration → ⚠ on that scenario header;
add iteration → badge gone; steps without vars never badge.
**Tests:** matrix-render unit with var/iteration fixtures. **Split chunk:** intake/UI
(data flows from `/scan`).
**Order:** after intake slice.

## 7. Y7 — iteration gate (`14:877`)

**Figma requires:** all `{vars}` have ≥ 1 iteration before `AutoTest/Execute`; No loops
back to the Data Matrix tab.
**Current code:** compiler defaults to a single run when matrix is empty; `runBtn`
aborts only if matrix *save* fails (`studio-ui.html:1357-1384`) — zero iterations execute.
**Conflict resolution (decision):** enforce as a **UI gate**, keep the compiler single-run
fallback for direct API callers. `runBtn` handler (and a pre-flight in `pollRunStatus`
startup) compares `scenarioVariables` vs saved matrix; on any var with zero iterations:
block with named message, `switchTab('data-matrix')`, do not POST `/run`.
**Touchpoints:** `runBtn.onclick`, `initDataMatrix`/`saveDataMatrixStateFromDOM`.
**Acceptance:** var present + zero iterations → Execute blocked + lands on Data Matrix;
all vars covered (or no vars at all) → runs as today; API POST without matrix still
single-runs (documented fallback, not a UI path).
**Tests:** gate unit (var/iteration matrix) + blocked-run UI test.
**Split chunk:** `routes/run.js` (server unchanged) + execution UI. **Order:** after Y6.

## 8. Y8 — worker-coupled headless policy (`14:1120`, `14:1231`)

**Figma requires:** `Worker Count == 1` → user controls headless toggle (`14:1254`
semantics: checked = headless/hidden, unchecked = headed/visible); workers > 1 → headed
forced off and checkbox disabled (`14:1231`).
**Current code:** `worker-count` defaults to **4** (`studio-ui.html:299`) while server
defaults `workers || 2` (`server.js:715`) and Figma says default 2, min 1; toggle always
enabled; server appends `--headed` whenever `!headless` regardless of worker count.
**Change:**
1. UI default `worker-count` 4 → **2** (min 1, max 16 stay); server `|| 2` unchanged.
2. UI policy: workers > 1 → set headless checked + disable toggle (tooltip: parallel runs
   are headless); workers == 1 → enable toggle, respect user choice. Server continues to
   honor the posted flag (API callers unaffected).
**Touchpoints:** execution pane markup + `runBtn.onclick` + `pollRunStatus` reset behavior.
**Acceptance:** set workers 4 → toggle checked+disabled; back to 1 → toggle enabled with
prior choice restored; posted `/run` body matches visible state; single-worker headed run
opens browser as today.
**Tests:** policy unit + posted-body test. **Split chunk:** execution UI (`routes/run.js`
server unchanged). **Order:** with run slice.

## 9. Y9 — terminal status branch (`15:1997`)

**Figma requires:** explicit Success / Failed / Cancelled routing into per-scenario
results + `report.json` split and image check.
**Current code:** `pollRunStatus` (`studio-ui.html:1396-1435`) handles
completed/failed/cancelled but failure styling was historically neutral; dashboard
renders chips + PNG/folder links; cancelled clears to idle message.
**Change:** distinct terminal states — completed shows pass/fail counts + per-scenario
chips (exists, keep); failed additionally surfaces `activeRun.error` above partial
results (exists, keep prominent); **cancelled** gets its own terminal render ("Cancelled
by user — partial evidence below, if any") instead of falling through to idle text, and
stops the poller (already) without re-enabling Execute until render finishes.
**Touchpoints:** `pollRunStatus`, `renderResultsDashboard`, `GET /run-status` shape
(unchanged), `/run-cancel` (unchanged).
**Acceptance:** kill a run → cancelled render, no phantom "Status: idle"; failed run →
error block + partial chips; completed → counts + all chips + PNG links resolve.
**Tests:** poller terminal-state tests against canned `/run-status` payloads.
**Split chunk:** `routes/run.js` + execution UI. **Order:** with run slice, after Y8.

## 10. Execution order (interleaved with the server split)

Infra first, then per-flow split + yellow together (one flow, one commit series):

1. Split slices 1–3 (paths/process, browser, parse) — no yellow changes.
2. Intake slice + **Y1 → Y2** (upload/compat).
3. Map-record slice + **Y4**; suggest slice + **Y3 → Y5**.
4. Matrix derivations **Y6 → Y7** (UI-only, ride the intake/data flow).
5. Run slice + **Y8 → Y9**.
6. Full black-box loop per flow (AGENTS.md §4) + CHANGE-LOG per change (§2.1).

Rollback: one commit per item; split moves and yellow changes never share a commit.
Done-when per item: acceptance above + listed tests + black-box rerun of touched
`TEST_SCENARIOS.md` rows with zero defects for that scope.

→ skipped: code edits (plan only until approved), add when Y1 starts.
