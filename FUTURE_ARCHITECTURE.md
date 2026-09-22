# FUTURE_ARCHITECTURE.md

Three sequential phases. **Each ships and is fully testable before the next starts.**

| | Phase A | Phase B | Phase C |
|---|---|---|---|
| **Goal** | Electron app, genuinely air-gapped, double-clickable | Recording sessions reuse the tester's real, already-logged-in Chrome via CDP | Office-network LLM assists mapping |
| **Delivers** | A tester installs one artifact and works. No Node, no terminal, no internet. | No more re-typing login/MFA on every recording session — codegen and replay-before-record both attach to a live tab instead of spawning fresh | "✨ Suggest" per step; tester accepts / rejects-retries / overrides |
| **Depends on** | Nothing but the test harness (§A0) | Nothing but the test harness (§A0) — orthogonal to Electron packaging, a `studio/server.js`-only change | All of Phase A |
| **Can ship alone?** | **Yes.** Phase A is a complete product. | **Yes.** Independent of Electron. | No |

Phase B and Phase C are each strictly additive and independent of each other. If CDP-attach recording is never built, Phase A still stands on its own; if the office LLM never materializes, Phases A and B still stand on their own.

Written against the code as it stands (`studio/server.js` 911 lines, `core/compiler.js`, `core/helpers.js`). Every claim about existing behavior was verified by running it.

---

## 0. Verified facts this plan rests on

Checked on this machine before writing, because each one changes the design if false:

| Fact | How verified | Consequence |
|---|---|---|
| `fetch` is global | `node -e` → `function` (Node 26) | LLM client needs **no new dependency** |
| `ariaSnapshot()` exists in bundled Playwright | Ran against `DRIVERS/ms-playwright` Chromium | Model gets a compact a11y tree, not an HTML dump |
| Bundled browser needs `PLAYWRIGHT_BROWSERS_PATH` + `channel:'chrome'` | First launch failed without it | `getBrowserEnv()` (`server.js:98`) already does this — reuse it |
| `playwright._electron` is available | `typeof → object` | Electron E2E needs **no new test dependency** |
| **Codegen emits a whole file, not a line** | Read all 5 orphaned `core/codegen_*.js` | Shapes both the parser contract and the Phase C prompt (§C4) |
| **Codegen emits redundant + noisy actions** | `getByText('Home Practice Courses AI Workshop Blog Contact open menu Test login This is a').click()`, and `click()` immediately before `fill()` on the same field | The system already tolerates noise. Phase C output must not be held to a cleaner standard than codegen itself. |

That fifth and sixth row are why the previous draft's prompt section was wrong — it assumed a single clean line, which is not what this system actually handles.

---

# PHASE A — Electron + True Air-Gap

**Definition of done:** a tester on a locked-down Windows machine with **no Node, no internet, no admin rights** installs one artifact, double-clicks, and completes a full Excel → map → run → evidence cycle.

## A0. Prerequisite: the test harness

Nothing here is independently testable until `npm test` means something. Currently it is `echo "Error: no test specified" && exit 1`.

- `tests/run_all.js` (~25 lines): spawn server on a free port, wait for `/env`, run the offline suite, exit with the failure count.
- `git rm --cached core/blueprint.json core/executed.spec.ts` — both are gitignored yet tracked (`git ls-files -i -c` proves it). Every test run dirties the tree, so `git diff` can't distinguish work from noise. This already caused a near-miss: a routine PR would have committed a wiped `mappings.json`.
- Fix the codegen leak at root cause — `server.js:892` sweeps `f.startsWith('replay_')` only, so cancelled recordings leak forever. **5 orphans on disk right now.** One predicate covers both prefixes; all callers route through this sweep.
- Readable `ECONNREFUSED` → *"Server not running. Use: npm test"* instead of a raw stack trace.
- **Scope `.gitignore`'s `codegen_*.js` to `core/`.** Line 14 is bare `codegen_*.js` — the exact landmine AGENTS.md rule 15 documents and already fixed for `replay_*` (lines 10-13 are correctly `core/`-scoped). A bare pattern silently excludes any `codegen_*.js` anywhere in the repo, including future test fixtures. Rule 15 is named in this plan's own contract as something that must not be violated; it is violated today, one line above the patterns that got it right.

**Gate:** `npm test` exits 0; `git status --porcelain` empty after a full run.

## A0.5. Four defects found by doubt-driven review — fix before anything else

These are not housekeeping. Each one breaks a guarantee the "hardened banking environment" pitch depends on, and each was confirmed by executing the actual code against real payloads, not inferred.

### A0.5.1 `isSafeChain` is a bypassable regex, not a real security boundary

`helpers.js:8` blocks by keyword (`require`, `eval`, `process`, …). Two payloads contain none of those keywords, pass the check, and compile into **executing** code:

```
getByRole('b').click(); await page.goto('http://evil.example.com').click()
locator('x').click(); await page.context().storageState({path:'/tmp/stolen.json'}).click()
```

Confirmed by running both through `isSafeChain()` then feeding the compiler's generated line through `new Function()` — both parse as valid JS and would execute inside the test runner. The second exfiltrates session storage (cookies, auth tokens) to an arbitrary local path; the first performs arbitrary navigation. This is the exact boundary Phase C's "LLM proposals get no special trust, same gate as codegen" (§C6) leans on — if the gate itself is broken, Phase C inherits the hole for free, and so does every tester who pastes recorded code today.

**Fix — AST structural check, not a keyword blocklist** (~8 lines, Acorn is already a dependency, no new one):

```js
function isSafeChain(target) {
  let ast;
  try { ast = acorn.parseExpressionAt('page.' + target, 0, { ecmaVersion: 2020 }); }
  catch { return null; }
  if (ast.end !== ('page.' + target).length) return null;  // trailing junk = injection
  let n = ast;
  while (n.type === 'CallExpression' || n.type === 'MemberExpression') n = n.callee || n.object;
  return (n.type === 'Identifier' && n.name === 'page') ? target : null;
}
```

Verified against both bypasses above (blocked) and every legitimate chain in the existing test suite (allowed). Add a method allowlist alongside it — `evaluate(() => ...)` still parses as a structurally valid `page.` chain but runs arbitrary JS in-page.

**Test:** `tests/safe_chain_test.js` — table of confirmed-bypass payloads → must all return `null`; table of legitimate chains from existing fixtures → must all pass.

### A0.5.2 Traces capture credentials verbatim into the evidence auditors receive

`compiler.js:89` — `tracing.start({ screenshots: true, snapshots: true, sources: true })`. This records full DOM state on every action, including whatever was typed into a `fill()`. `trace.zip` is the artifact this plan hands to auditors (§ "Audit & Evidence" in RUN_GUIDE.md). A password from the Excel Data column — the exact scenario `tokenizeLiterals` exists to handle correctly — ends up readable in the compliance evidence file itself.

**Fix:** before tracing starts a step, mask `fill()`/`selectOption()` values on any step whose `Mapping_Key` or Data key matches `/password|secret|token|pin/i` — either via Playwright's `maskSelector`-style redaction or by excluding `sources` for those specific frames. Must land in Phase A; this is not an LLM-era concern, it exists today.

**Test:** run a fixture login flow with a Data value of `S3cr3tPass!`, extract `trace.zip`, assert the literal string is absent from every frame.

### A0.5.3 File upload is silently dropped, not unsupported-with-an-error

No `setInputFiles` case in the AST parser whitelist (`server.js:665`) **or** the compiler's action-type dispatch (grepped `core/compiler.js` — zero matches). A tester who records a file-attach step gets no error at save time and no error at compile time; the step is simply absent from the generated spec. The test runs, screenshots successfully, and silently never attaches anything.

**Fix:** add the parser + compiler case for `setInputFiles`. Until it's wired all the way through, `/save-mapping` must **reject** a step it can't represent, naming it — not accept and drop it.

**Test:** already specified as A-13 in §A4.4; strengthened here — assert `/save-mapping` returns non-200 for an unmappable step type, not that it silently succeeds.

### A0.5.4 A missing Excel column produces a passing test that proves nothing

`interpolate()` (`helpers.js:24`) returns `""` for an undefined Data key — no error, no warning. Confirmed: `interpolate('{nope}', null, {})` → `""`. A typo'd Excel header (`"Usernme"` instead of `"Username"`) compiles clean, runs clean, screenshots clean, and fills every field with an empty string. Nothing in the pipeline reports this to the tester who will treat the green run as evidence the feature works.

**Fix:** `interpolate()` throws (or the compiler collects and surfaces) on an unresolved `{key}` rather than silently substituting empty string. This is a correctness gap in code the whole plan already depends on, independent of Electron or the LLM.

**Test:** compile a scenario referencing a Data key absent from that scenario's row; assert compile fails loudly, not that it silently produces an empty fill.

**Gate for A0.5:** all four fixes land and their four tests pass, before A1 begins. Phase C's entire security argument (§C6: "LLM output gets the same gate as codegen") is void until A0.5.1 is fixed — there would be nothing rigorous to inherit.

## A0.6. Seven more defects — doubt-driven cycle 3, all confirmed by execution

Cycle 3 scoped Excel ingestion, the Action Library's read-modify-write, and every remaining route handler — areas the first two cycles didn't touch. All seven were reproduced by running real code against real payloads (mine, or the reviewer's and independently re-verified by me), not inferred from reading.

### A0.6.1 (Critical) Unauthenticated path traversal reads and deletes arbitrary project files

`GET /codegen-result/:sessionId` ([server.js:481](studio/server.js:481)):

```js
const outputPath = path.join(CORE_DIR, `codegen_${req.params.sessionId}.js`);
const raw = fs.readFileSync(outputPath, 'utf8');
fs.unlinkSync(outputPath);   // deletes after reading
```

Confirmed by running `path.join` with the actual code: `sessionId = "../../../studio/server"` resolves to `.../studio/server.js` — the server's own source file. The `codegen_` prefix only neutralizes the *first* `../` segment (it becomes the literal directory name `codegen_..`); every subsequent `../` traverses normally. No auth on this route, and CORS ([server.js:121](studio/server.js:121)) only restricts browser-JS fetches — a plain `curl` on the port is unaffected. Result: an unauthenticated request reads full source of any `.js` file reachable by traversal, **then deletes it from disk**. This is the single most severe finding across all three review cycles — a worse violation of "must not write outside its own directories" than anything found so far, because it's a live pre-auth exploit today, not a packaging-time gap.

**Fix:** reject any `sessionId` containing `/`, `\`, or `..` before building the path; additionally validate the resolved path stays within `CORE_DIR` (`path.resolve` + prefix check) as defense in depth.

**Test:** `sessionId = "../../../studio/server"` → 400, `studio/server.js` still exists on disk afterward.

### A0.6.2 `/upload` always reports success, even when parsing fails completely

[server.js:203-216](studio/server.js:203): `execSync(...)` failure is caught, logged to a server console the tester can never see (no terminal, per contract), and `res.json({message: "Uploaded."})` runs unconditionally regardless. Two independent failure paths confirmed: a malformed-header Excel throws inside `scenario_parser.js` (caught, swallowed); a missing/unsaved file causes `scenario_parser.js:21` to `console.error` and `return` — **exit code 0**, no thrown error at all, same false-success response. `blueprint.json` is left stale or absent either way. `/scan` ([server.js:277](studio/server.js:277)) correctly returns 400 for the identical malformed-header case — the inconsistency is the evidence this isn't intentional.

**Fix:** `/upload` must check `execSync`'s result and the resulting `blueprint.json` before responding success; propagate the real error to the tester.

**Test:** upload a header-scrambled `.xlsx` → response is non-200 with the actual parse error, not `{"message":"Uploaded."}`.

### A0.6.3 A corrupted `action_database.json` is silently wiped to empty on next read — no backup

[action_db.js:61-74](core/action_db.js:61): any read failure (truncated file, bad hand-edit, crash mid-write) hits the catch, which **overwrites the file on disk** with an empty `{actions:[], groups:[]}` before returning it. Confirmed by truncating a copy of the real DB file and calling `read()` — the corrupted file was immediately destroyed, not preserved for recovery. Every route that reads the Action Library (`/action-db`, `/scan`, `/mapping/:label`, `/preview/:label`, `/preview-scenario/:id`) triggers this. This is the exact scenario the contract names as worst-case ("cannot recover from a corrupted state file by hand") — except here the tool actively destroys the recoverable file itself.

**Fix:** on parse failure, copy the corrupt file to `action_database.json.corrupt-<timestamp>` before writing the empty default. Never destroy without a backup.

**Test:** truncate a valid DB file, call `read()`, assert a `.corrupt-*` backup exists containing the original bytes.

### A0.6.4 A blank/merged-cell step label vanishes from the blueprint with no warning

[scenario_parser.js:52-88](core/scenario_parser.js:52) — a row with an empty label under an open scenario fails the `labelOrTitle` truthy check and is dropped with no `else`, no count, no log. This is exactly what Excel's vertically-merged cells produce when read via `sheet_to_json` — only the merge's top-left cell has a value; every other row in the merge reads empty. A real UAT matrix using merged "Scenario Name" cells (a common Excel authoring pattern) silently loses steps. The compiled test then "passes" having never executed the dropped step — the contract's named worst case, "a test that passes while testing nothing."

**Fix:** when a scenario is open and a row has no label but *does* have other populated columns (Test Data, Step notes), log/surface a warning rather than dropping silently. At minimum, report a per-scenario step count so a tester can sanity-check against their Excel row count.

**Test:** feed a blueprint fixture simulating a merged-cell gap; assert either a warning is surfaced or the step is not silently absent from the count.

### A0.6.5 Duplicate `Scenario_ID` → two scenarios' evidence overwrites into the same results folder

No dedup check on `Scenario_ID` in `scenario_parser.js`; `compiler.js:76` derives the results folder purely from the sanitized ID text, so two "A.1" header rows produce two blueprint entries that both write `STEP_1.png`/`FINAL.png`/`trace.zip` into the **identical** `results/A_1/` folder — concurrently, under the default `--workers 2` ([server.js:563](studio/server.js:563)), interleaving writes. Worse: `blueprint.find(s => s.Scenario_ID === scenarioId)` (used at [server.js:357](studio/server.js:357), `:511`, `:811`) only ever resolves the *first* duplicate, so the tester can never even see or map the second one through the UI — yet the flat execution loop in `compiler.js:66` still runs it. Evidence reviewed for "Scenario A.1" may silently be the wrong scenario's screenshots.

**Fix:** `scenario_parser.js` must reject (or auto-suffix and warn on) a repeated `Scenario_ID` at parse time — loud, at upload, not silent, at evidence-review time.

**Test:** blueprint fixture with two `Scenario_ID: "A.1"` rows → parser either errors or produces two distinct, non-colliding IDs; never two entries sharing one results folder.

### A0.6.6 Duplicate `Mapping_Key` within one scenario → replay under-shoots, wrong element gets mapped to both occurrences

A UAT flow can legitimately reuse a step label twice (e.g. "Click Submit" at step 3 and step 7). [server.js:362](studio/server.js:362) — `scenario.Flow.findIndex(step => step.Mapping_Key === label)` always resolves the *first* occurrence. Recording the *second* occurrence replays too few preceding steps (`slice(0, targetIdx)` stops at the first match's index), leaving the live browser in the wrong app state — invisible to a tester with no way to detect an under-replay. Because mappings are keyed by label text globally, whatever gets recorded against that wrong state is then applied to **both** occurrences at execution time. One of two real steps silently targets the wrong element on every run.

**Fix:** `Mapping_Key` must be scoped to (scenario, step-index), not label text alone, when a label repeats within one scenario — or the parser must detect and flag intra-scenario duplicates at upload time so the tester renames them.

**Test:** blueprint fixture with "Click Submit" at two different Flow indices in one scenario; assert recording the second occurrence replays the correct number of preceding steps, not `findIndex`'s first match.

### A0.6.7 No mutual exclusion between a live recording session and a live test run

`/record`'s guard ([server.js:338](studio/server.js:338)) checks only `activeCodegen`. `/run`'s guard ([server.js:540](studio/server.js:540)) checks only `activeRun.phase`. Confirmed by reading both guards side by side — neither checks the other's state. A tester can start a headed recording session (a live Playwright Inspector browser) and, in a second tab, start a full execution against the same target app while the recording session is still open. Two uncoordinated live sessions can race on shared app state (double-submit, a shared test account collision), contaminating results with side effects from the concurrent recording — with nothing in the UI indicating it happened.

**Fix:** `/run` must also reject when `activeCodegen` is live, and vice versa, with a clear "a recording session is in progress" message.

**Test:** start `/record`, then `/run` while it's active → 409, not a race.

**Gate for A0.6:** A0.6.1 (the path traversal) is a standalone blocker — it is exploitable in the code as it exists today, independent of every other phase in this plan, and should be fixed before anything else in this document ships or is demoed. A0.6.2–.7 land alongside A0.5 as part of the A0 prerequisite work.

## A0.7. Nine more defects — doubt-driven cycle 4, the UI and mobile path

Cycle 4 scoped `studio-ui.html` (1515 lines, previously unexamined) and the Data Matrix / mobile compile path. All confirmed against the real files — code was read and cross-checked, not just static-scanned. One important self-correction is included: an initial hypothesis about the mobile locator path turned out to be **noise** on inspection, and a different, real bug was found in its place. That discipline is worth preserving here as a model for future doubt cycles, not just the findings.

### A0.7.1 (Critical) The Mobile platform is not implemented in `/record` — selecting it silently records a Web (Playwright) mapping instead

[server.js:343](studio/server.js:343) — `const { label, url, scenarioId } = req.body;`. The UI posts `platform` to `/record` ([studio-ui.html:1055-1062](studio/studio-ui.html)), but the handler never reads it, never checks `activePlatform`, never checks `process.env.AUTOTEST_PLATFORM`. Confirmed by reading the full handler body: it unconditionally spawns Playwright's `codegen` (Chromium), every time, regardless of the Mobile/Web toggle. A tester who selects "MOBILE / Appium" and clicks Record gets a Web mapping with Playwright locator syntax saved under a scenario they believe is mobile-mapped.

This means AGENTS.md's own "Known gaps" entry — *"Mobile/Appium path has never been run against a real device... environmental limitation of this dev machine, not a known code defect"* — is stated too generously. The mapping entry point for mobile doesn't exist at all; this isn't an environment gap, it's missing implementation.

**Fix:** `/record` must branch on platform exactly as `/run` already does ([server.js:530-537](studio/server.js:530)) — either implement an Appium-based recording flow, or (minimum viable) reject `/record` with a clear "mobile mapping isn't supported yet, use Manual entry" when `platform === 'mobile'`, rather than silently producing a wrong-platform mapping.

**Test:** `POST /record` with `platform: 'mobile'` → either a mobile-specific session, or an explicit error — never a Playwright codegen spawn.

### A0.7.2 (Critical) A failing mobile test run always reports "completed" with no error and no results

Three-layer swallow, confirmed by reading each layer:
1. [compiler.js:152-153](core/compiler.js:152) — every mobile scenario is wrapped `try { ... } catch (e) { console.error(...) }`. The process always exits 0.
2. [server.js:598](studio/server.js:598) — `activeRun.error` is set only `if (code !== 0)`. Mobile's exit code is always 0 (point 1), so `error` stays `undefined`.
3. Mobile never runs with `--reporter=json` and `report.json` is `unlinkSync`'d before every run ([server.js:567](studio/server.js:567)) — so `activeRun.results` also stays `undefined`.

`/run-status` therefore returns `{phase: 'completed'}` with neither `error` nor `results` populated. In the UI's poll handler ([studio-ui.html:1193-1207](studio/studio-ui.html)), neither branch fires. A tester running mobile scenarios that fail on every single step sees only a plain "Status: completed" — no red, no PASS/FAIL, no indication anything is wrong. This is the contract's named worst case, realized exactly: a test that reports success while testing nothing, on the one platform where AGENTS.md already admits verification is weakest.

**Fix:** the mobile-generation catch block must set a process-level failure signal the compiler can propagate (non-zero exit, or a written status file) instead of only logging. `/run-status` must surface *some* explicit pass/fail state for mobile runs, even without a structured reporter.

**Test:** compile and run a mobile scenario with a step that throws; assert `/run-status` reports failure, not `{phase:'completed'}` with no data.

### A0.7.3 The Excel drop zone has no drop handler — following the UI's own instructions can navigate away and lose all session state

[studio-ui.html:230,323](studio/studio-ui.html) — the drop zone's copy reads *"Drag and drop your Scenario Excel here to begin parsing."* Confirmed by grep: the only `dragover`/`drop` listeners in the entire file are on the unrelated Library sidebar ([studio-ui.html:462-469](studio/studio-ui.html)), not the labeled drop zone. Dragging a file onto the zone the UI itself points at triggers the browser's default drop behavior — typically navigating the tab away from the Studio app entirely, discarding all in-progress mapping/session state, no warning.

**Fix:** add `dragover`/`drop` listeners to the actual drop zone (`preventDefault` + route to the same upload path as the click-to-browse handler), or remove the drag-and-drop copy if only click-to-upload is supported.

**Test:** dispatch a synthetic `drop` event on the drop zone element; assert it triggers upload, not default navigation.

### A0.7.4 File upload failure is silent — no error, no status, the tester has no idea anything went wrong

[studio-ui.html:409-417](studio/studio-ui.html) `handleFile` — no `try/catch`, and on `res.ok === false` the function just returns. Confirmed by reading the function in full: there is no `else` branch. Combined with A0.6.2 (`/upload` frequently reports false success anyway), this is two independent reasons a tester can end up looking at a Studio UI that silently did nothing after they uploaded their matrix.

**Fix:** surface `res.ok === false` (and thrown fetch errors) as an on-screen status message, matching the pattern already used elsewhere in the file for successful operations.

**Test:** stub `/upload` to return 500; assert an error message renders, not silence.

### A0.7.5 Data Matrix edits can be silently discarded, and a failed save doesn't block execution

Two compounding issues, both confirmed by reading the relevant handlers:
- [studio-ui.html:1505-1513](studio/studio-ui.html) `saveDataMatrix` has no `try/catch` and no failure branch — a failed save just doesn't show "Saved!," with no error shown either.
- [studio-ui.html:1147](studio/studio-ui.html) — `runBtn.onclick` calls `await window.saveDataMatrix()` but never checks its return value before proceeding to execute. **Execute Test Scenarios can run against stale server-side data even when the tester's just-edited Data Matrix failed to save**, with nothing telling them their edits weren't applied to this run.
- Separately, `initDataMatrix()` unconditionally re-fetches and overwrites the in-memory Data Matrix every time that tab is opened ([studio-ui.html:398](studio/studio-ui.html)) — navigating away and back without saving discards edits with no "unsaved changes" prompt.

**Fix:** `saveDataMatrix` must return success/failure and surface failure; `runBtn.onclick` must abort the run (with a clear message) if the save it depends on failed.

**Test:** stub `/data-matrix` POST to fail; assert Execute is blocked or the tester is warned, not silently proceeding on stale data.

### A0.7.6 XPath injection in the mobile locator translator — a self-corrected finding

Initial hypothesis (mobile skips `isSafeChain` entirely, so it must share A0.5.1's code-injection exposure) was checked and found to be **noise**: mobile always routes the locator through `q()` (`JSON.stringify`), so it's structurally a string argument to `driver.$(...)`, never interpolated as executable syntax the way `page.${safeTarget}` is on the web path. `isSafeChain`'s absence here doesn't reopen that hole.

But inspection surfaced a real, narrower bug in its place. [compiler.js:37-44](core/compiler.js:37) `translateToMobileLocator` builds an XPath string by interpolating the accessible name directly, with no quote-escaping:

```js
return `//*[@text="${roleMatch[2]}" or @content-desc="${roleMatch[2]}"]`;
```

Confirmed by running it: an accessible name containing `"` (e.g. a button labelled `Delete "All" Records`) produces a structurally broken XPath — `//*[@text="Delete "All" Records" or ...]` — which either fails the step outright or, depending on the Appium/UiAutomator2 XPath engine's error tolerance, matches an unintended element. This is the mobile-path analog of "wrong element silently mapped."

Also confirmed separately: only `getByRole`, `getByText`, `getByLabel` are translated at all. Anything else codegen commonly emits — `getByPlaceholder`, `getByTestId`, raw CSS `locator('#id')` — falls through unchanged at [compiler.js:47](core/compiler.js:47) and is handed to `driver.$(...)` as a literal Playwright-syntax string, which is not a valid webdriverio selector. Combined with A0.7.1 (mobile mapping doesn't actually record mobile-appropriate locators), this compounds into exactly the four-layer silent chain the reviewer traced: wrong platform recorded → untranslatable locator → invalid selector at runtime → swallowed by A0.7.2's catch → reported as "completed."

**Fix:** escape `"` in the interpolated name (or use XPath's `concat()` escaping for names containing quotes); extend translation to cover `getByPlaceholder`/`getByTestId`/CSS, or explicitly reject unsupported locator types at compile time rather than passing them through as invalid strings.

**Test:** a name containing `"` produces valid, escaped XPath; an untranslatable locator type fails compile with a clear message, not a silent runtime failure.

### A0.7.7 Live-run status is never rendered as an error, even when the run is failing

[studio-ui.html:1186](studio/studio-ui.html) checks `data.failureType === 'system'` to decide between red "error" and blue "info" styling during a run — but `failureType` is never set anywhere in `server.js` (confirmed by search across the whole file). The one piece of real-time feedback a tester has during a long-running execution is always rendered in the same neutral blue, whether the run is healthy or actively failing.

**Fix:** either implement `failureType` server-side, or remove the dead conditional and pick styling from `activeRun.phase`/`error` directly, which do exist.

**Test:** simulate an in-progress run with a failing step; assert the status line renders as an error state, not the default info style.

### A0.7.8 Concurrent polling intervals accumulate on repeated tab switches

[studio-ui.html:381-388,392-404](studio/studio-ui.html) — `DOMContentLoaded` calls `switchTab('execution')` (which itself starts `pollRunStatus()`) **and then** calls `pollRunStatus()` again directly, so page load with an active run starts two concurrent pollers. Worse: `switchTab('execution')` runs on every click of the Execution tab and starts a fresh `setInterval` with no de-duplication or cleanup — the interval id is a local variable, never tracked or cleared. Repeated tab-switching during a long run accumulates concurrently-running pollers all hitting `/run-status`.

**Fix:** track the interval id in module scope; `clearInterval` before starting a new one; call `pollRunStatus()` once, not from two code paths.

**Test:** switch to the Execution tab 5 times; assert exactly one active poll interval, not five.

### A0.7.9 One inconsistent `innerHTML` interpolation breaks an otherwise-enforced policy

[studio-ui.html:1077](studio/studio-ui.html) — `guideBanner.innerHTML = \`<span ...>${e.message}</span>\`` interpolates a caught error's message directly into `innerHTML`. Every other dynamic render in the file was deliberately converted to `textContent`/DOM-construction specifically to close this class of bug (the file's own comments reference DEF-H8, DEF-CRIT-002/003 fixes). Not exploitable today only because current `/record` error strings are static server-side literals — but it's the one gap in an otherwise real, deliberate policy, and any future error path that echoes a label or user-supplied string becomes a live XSS vector.

**Fix:** switch to `textContent` or `createElement`, matching the pattern used everywhere else in the file.

**Test:** trigger the error banner with a message containing `<script>`; assert it renders as literal text, not markup.

**Gate for A0.7:** A0.7.1 and A0.7.2 together mean the mobile path is not "untested" (AGENTS.md's framing) — it is non-functional at the recording step and unable to report its own failures at the execution step. Fixing or explicitly disabling the Mobile option in the UI is a prerequisite for claiming any mobile support in Phase A; shipping the toggle as-is actively misleads a tester into believing they've mapped and verified a mobile flow.

## A0.8. Code review notes — doubt-driven cycle 5 (max effort)

Cycle 5 performed a whole-tree line-by-line, removed-behavior, cross-file, and AST-level code review across the A0–A0.7 changes. Nine verified findings surfaced:

### A0.8.1 (Critical) `isSafeChain` ignores call arguments, permitting arbitrary RCE via nested expressions
[core/helpers.js:22](core/helpers.js:22) — `isSafeChain` parses `page.<target>` as an AST expression and walks only the callee/member chain (`member.object`) to verify that calls root at `page` and use methods in `SAFE_LOCATOR_METHODS`. It never inspects `CallExpression.arguments`. Confirmed by execution: `locator(global.process.mainModule.require('child_process').execSync('id').toString())` and `getByRole('button', { name: eval('...') })` return as safe targets because their callee is `page.locator` or `page.getByRole`. When compiled into `executed.spec.ts`, arbitrary shell commands execute in the test runner process. Phase C explicitly relies on `isSafeChain` as the untrusted LLM code gate (§C6) — this must be closed before Phase C.
**Fix:** recursively inspect all arguments of each `CallExpression` in the chain: ensure arguments are strictly `Literal`, `Identifier` (for allowed variables), or safe `ObjectExpression` with `Literal` values.

### A0.8.2 Sheet length check on row 0 breaks dynamic header detection
[core/scenario_parser.js:27](core/scenario_parser.js:27) — `if (!rows.length || rows[0].length < 3)` throws `Invalid Excel structure: expected scenario matrix with at least 3 columns.` immediately before the 10-row dynamic header search loop (lines 31-43) runs. If row 0 contains a title banner or metadata cell with < 3 columns, parsing aborts on row 0 even when valid headers exist on row 2. Because `/scan` in `server.js` now delegates to `generateBlueprintFromExcel`, any template with metadata headers fails `/scan` with a 400 error.
**Fix:** remove `rows[0].length < 3` and let the dynamic header loop validate whether required columns exist within the first 10 rows.

### A0.8.3 Hardcoded `process.cwd()` in `scenario_parser.js` causes ENOENT when server is started from another directory
[core/scenario_parser.js:117,128](core/scenario_parser.js:117) — `scenario_parser.js` writes `blueprint.json` and `blueprint_warnings.json` to `path.join(process.cwd(), 'core', ...)`. When `server.js` is started from `studio/` (`cd studio && node server.js`) or packaged in Electron where `cwd` is not project root, calling `generateBlueprintFromExcel` in `GET /scan` attempts to write to `studio/core/blueprint.json` and crashes with `ENOENT`.
**Fix:** resolve paths using `__dirname` (`path.join(__dirname, 'blueprint.json')`), consistent with `compiler.js` and `action_db.js`.

### A0.8.4 Intentionally blank Data Matrix value falls back to Excel default
[core/helpers.js:50](core/helpers.js:50) — `interpolate()` checks `if (iterData && iterData[key] !== undefined && iterData[key] !== null && iterData[key] !== "")`. If a tester sets an empty string `""` in the Data Matrix to test negative validation (e.g. empty password), the check evaluates to false and falls through to `fallbackObj[key]`. If Excel has a default password (`"admin123"`), `"admin123"` is used instead of the empty string.
**Fix:** check `iterData[key] !== undefined && iterData[key] !== null` without excluding `""`, respecting explicit empty overrides.

### A0.8.5 `POST /run` catch block hides `scenario_parser.js` error message
[studio/server.js:550,635](studio/server.js:550) — When `scenario_parser.js` fails during `POST /run`, it writes its error to `core/blueprint_warnings.json`. However, the `/run` catch block only attempts to read `core/compile_error.json`. As a result, `/run` responds with a generic `Command failed: node core/scenario_parser.js` error instead of the underlying parse failure reason.
**Fix:** check `blueprint_warnings.json` for `.error` in `/run`'s catch block if `compile_error.json` is absent.

### A0.8.6 Mobile locator regex rejects locators with options objects (e.g. `exact: true`)
[core/compiler.js:299-310](core/compiler.js:299) — `translateToMobileLocator` uses strict regexes that fail to match `getByRole('button', { name: 'Submit', exact: true })` or `getByText('Submit', { exact: true })`. Because `pwLocator` starts with `getBy*`, line 323 throws `Unsupported locator for mobile: ... — re-record this step using a role/text/label-based locator`, misinforming the user that their role/text locator is unsupported.
**Fix:** parse the AST of the locator or loosen regexes to extract `name` regardless of adjacent options in the object literal.

### A0.8.7 Mobile compiler silently skips assertions and check actions
[core/compiler.js:132-140](core/compiler.js:132) — On mobile, `compiler.js` only emits code for `goto`, `click`, `fill`, and `press`. If a mapped step contains `toBeVisible`, `toHaveText`, `check`, `uncheck`, or `selectOption`, zero statements are emitted, and the test silently passes without verifying assertions.
**Fix:** implement Appium equivalents for assertions (`expect(driver.$(...)).toBeDisplayed()`) or throw an explicit compile error when an unsupported action type is encountered on mobile.

### A0.8.8 Excel upload warnings are discarded by `studio-ui.html`
[studio/studio-ui.html:428](studio/studio-ui.html:428) — `handleFile` receives `{ message: "Uploaded.", warnings: [...] }` from `POST /upload`, but only displays `data.message`, ignoring `data.warnings`. Duplicate Scenario_ID renames and merged-cell step omissions are never displayed on screen.
**Fix:** display `data.warnings` in `#status-box` (e.g. as a warning banner) when warnings are present.

### A0.8.9 Leaked studio server process in `tests/ui_behavior_test.js`
[tests/ui_behavior_test.js:33-35](tests/ui_behavior_test.js:33) — `server = spawn(...)` runs outside the `try` block that cleans it up in `finally`. If `await chromium.launch()` throws (e.g. missing browser binary), the test exits without killing the child server, leaking port 3958.
**Fix:** wrap the spawn in `try/finally` or ensure `server.kill()` is registered on process exit / uncaught error.

## A1. Make the server relocatable

AGENTS.md §5 assumes wrapping the server is free. It is not — two reasons found by reading the code.

### A1.1 Writes land in the app directory — in **three** places, not one

An earlier draft of this plan proposed repointing `CORE_DIR` alone. That fix is incomplete, and the incompleteness is invisible to the test that was supposed to prove it. Verified write sites:

| Site | Path | What breaks under asar |
|---|---|---|
| `server.js:25` `CORE_DIR` | `../core` | `mappings.json`, `blueprint.json`, `executed.spec.ts`, `runtime_data.json` |
| `server.js:127` multer `destination` | **`ROOT_DIR`** | **Excel upload — the tester's very first action** |
| `server.js:29` `UPLOADED_EXCEL` | **`ROOT_DIR`** | Same file, read path |
| `server.js:26` `RESULTS_DIR` | **`ROOT_DIR/results`** | **Screenshots and traces — the auditor evidence** |
| `compiler.js:85` generated spec | **`process.cwd()`/results** | Evidence path resolved in the *child* process |

The last one is the subtlest: the generated spec computes `resultsDir` from `process.cwd()`, and the runner spawn (`server.js:569`) passes no `cwd`. Under Electron the server is `fork()`'d, so `cwd` is inherited from the Electron main process — not the app directory, and not predictable. Evidence would land somewhere arbitrary even if every other path were fixed.

```js
const STATE_DIR = process.env.AUTOTEST_STATE_DIR || CORE_DIR;
const DATA_DIR  = process.env.AUTOTEST_DATA_DIR  || ROOT_DIR;   // uploads
const RESULTS_DIR = process.env.AUTOTEST_RESULTS_DIR || path.join(ROOT_DIR, 'results');
```

…and pass `cwd: DATA_DIR` explicitly to the runner spawn, so the compiled spec resolves evidence deterministically.

Read-only assets (`studio-ui.html`) stay on `__dirname` — correct as-is. `DRIVERS/` does **not** — see A1.3.

### A1.2 Port is hardcoded

### A1.2 Port is hardcoded

`server.js:884` — `process.env.PORT || 3000`. Two instances, or anything else on 3000, and the window silently attaches to the wrong server.

```js
const server = app.listen(process.env.PORT || 0, () => {
  console.log(`STUDIO_PORT=${server.address().port}`);   // main.js parses this
});
```

`PORT` stays honored, so the existing suite is unaffected.

### A1.3 `DRIVERS/` resolution breaks the moment it is packaged

A3 requires `DRIVERS/` to ship in `extraResources`, **unpacked** (Playwright spawns browser binaries as real OS processes; they cannot execute from inside asar). But every resolution site computes it `__dirname`-relative:

| Site | Expression |
|---|---|
| `server.js:4-5` | `path.resolve(__dirname, '../DRIVERS/node_modules')` |
| `compiler.js:5` | `path.join(__dirname, '../DRIVERS/node_modules')` |
| `scenario_parser.js:5` | `path.join(__dirname, '../DRIVERS/node_modules')` |
| `playwright.config.ts:9-15` | `path.resolve(__dirname, 'DRIVERS/ms-playwright/…')` (4 platform paths) |

Once unpacked to `extraResources`, `DRIVERS/` lives under `process.resourcesPath`. From a file **inside** `app.asar`, `../DRIVERS` escapes only to the asar root — never out of the archive. All four sites resolve to a path that does not exist, and the failure is "browser won't launch," mid-session, on the tester's machine.

```js
const DRIVERS_ROOT = process.resourcesPath
  ? path.join(process.resourcesPath, 'DRIVERS')     // packaged
  : path.resolve(__dirname, '../DRIVERS');          // dev — unchanged
```

This is a required code change that AGENTS.md §5's "wrap them, don't rewrite them" quietly assumes away. It is small, but it is not zero, and it must be applied at all four sites.

**Known gap, found by cross-model doubt review, not yet fixable or testable — no Electron shell exists yet to verify against:** `resolveDriversRoot()` reads `process.resourcesPath`, which Electron sets on *its own* process object. `server.js` spawns `core/scenario_parser.js` and `core/compiler.js` as separate `execSync('node ...')` subprocesses (not `require()`d), which run under plain system Node — `process.resourcesPath` is `undefined` in that child regardless of what the parent Electron process had, so their own `ensureDriversPath()` call falls back to dev-mode `__dirname`-relative resolution, which is wrong inside a packaged asar. A2's `main.js` will need to bridge this explicitly (e.g. `env: { ...process.env, RESOURCES_PATH: process.resourcesPath }`, read by `resolveDriversRoot()` as a fallback when the native property is absent) — add when A2 lands and this becomes testable via `playwright._electron`.

## A2. Electron shell

`electron/main.js`, ~40 lines:

```js
const child = fork(serverPath, [], {
  cwd: app.getPath('userData'),                     // A1.1 — deterministic results path
  env: { ...process.env,
    AUTOTEST_STATE_DIR:   app.getPath('userData'),  // A1.1 — writable
    AUTOTEST_DATA_DIR:    app.getPath('userData'),
    AUTOTEST_RESULTS_DIR: path.join(app.getPath('userData'), 'results'),
    PORT: '0'                                       // A1.2 — dynamic
  }, silent: true });
child.stdout.on('data', d => {
  const m = /STUDIO_PORT=(\d+)/.exec(d.toString());
  if (m) win.loadURL(`http://127.0.0.1:${m[1]}`);
});
app.on('before-quit', () => child.kill());
```

`studio/server.js` and `studio-ui.html` keep their existing roles — but A1.1 and A1.3 are real edits to the server and compiler. "Wrap them, don't rewrite them" holds for the *architecture*, not literally for the diff.

## A3. What "air-gapped" must actually mean

Today it means *no outbound calls*. The target is *nothing to install*. Four things must be true, each independently checkable:

| Claim | Must be true | Failure if wrong |
|---|---|---|
| **No Node on target** | Electron's bundled Node runs the server | App won't start |
| **No `npx`, no downloads** | `DRIVERS/ms-playwright` ships in the installer | Browser launch fails mid-session |
| **No admin rights** | Per-user install (`electron-builder` NSIS `perMachine: false`) | Tester can't install |
| **Zero outbound** | Verified by assertion, not assumed | Silent failure in a monitored network |

**Packaging:** `DRIVERS/` goes in `extraResources` and **must stay unpacked** — Playwright spawns browser binaries as real OS processes; they cannot execute from inside asar. This is the single most likely packaging mistake.

**Size:** Electron ships its own Chromium alongside Playwright's (~300MB). AGENTS.md §5 flags this. Mitigation if it matters: ship `chromium-headless-shell` only for headless runs and reuse Electron's Chromium for headed via CDP. **Defer** — measure the real installer first, optimize only if IT objects.

**Open risk, unresolved:** code-signing / notarization. Electron is confirmed allowed; *unsigned* Electron is a separate question for IT. Does not block A0–A2, must be answered before distribution.

## A4. Phase A test suite

All unattended. No internet, no live sites.

### A4.1 The offline fixture app

Replaces OrangeHRM's demo site so tests never break because someone else's server changed. A static multi-page app under `tests/fixtures/app/`, served by the test runner on a local port:

| Page | Widgets | Why a test analyst hits it daily |
|---|---|---|
| `login.html` | text, password, submit, error banner | Auth — positive and negative |
| `search.html` | search box, dropdown filter, results table | Search and filter |
| `form.html` | text, select, checkbox, radio, `<input type=date>`, textarea | Data entry |
| `table.html` | paginated table, per-row Edit/Delete, confirm modal | Record maintenance |
| `wizard.html` | 3 steps, Next/Back, review page | Multi-page flows |
| `upload.html` | file input | Attachments |
| `iframe.html` | embedded form in an iframe | Legacy portals |
| `slow.html` | 2s delayed render, spinner | Timing / flake |

Static HTML+JS, no build step, no dependency. Matches the project's existing vanilla-frontend constraint.

### A4.2 Codegen fixtures are **real codegen output, recorded by a human — never fabricated**

Non-negotiable. A hand-written or model-written "example" of codegen output drifts from what Playwright actually emits, and then tests pass against a fiction. Evidence it drifts: real output contains `getByText('Home Practice Courses AI Workshop Blog Contact open menu Test login This is a')` and a redundant `click()` before every `fill()`. Nobody writes that by hand.

**One-time recording procedure** (documented in `tests/fixtures/codegen/README.md`):

```bash
npm run fixtures:serve                     # serve tests/fixtures/app on :3999
npx playwright codegen http://localhost:3999/login.html \
  --output tests/fixtures/codegen/login_success.js
```

A human performs each flow as a human would — clicks the field before typing, clicks stray text, records assertions via the Inspector's assert button. The resulting files are **committed verbatim, never edited**. They are golden files.

Fixtures to record, covering the day-to-day matrix:

| File | Flow recorded |
|---|---|
| `login_success.js` | Navigate, fill both fields, submit, assert success text |
| `login_failure.js` | Same with wrong password, assert error banner |
| `search_filter.js` | Type query, pick dropdown value, assert row count |
| `form_full.js` | Text + select + checkbox + radio + date + textarea, submit |
| `table_row_action.js` | Paginate, click row Edit, confirm modal |
| `wizard_3step.js` | Next / Next / Back / submit |
| `upload_file.js` | `setInputFiles` |
| `iframe_form.js` | `frameLocator` chain |
| `slow_page.js` | Action against delayed render |
| `noisy_real.js` | Deliberately sloppy: stray text clicks, redundant clicks, an accidental double-click |

`noisy_real.js` matters most. It proves the parser survives what a real tester actually records, which is not a clean script.

**Re-recording** is a documented manual step when Playwright's codegen output format changes — a real maintenance cost, accepted because the alternative is testing against fiction.

### A4.3 Codegen in a testable environment (the "plus point")

`playwright codegen` needs a human driving a GUI, so it cannot run in CI. The seam: **codegen's output is just a file**, and `/codegen-result/:sessionId` reads whatever sits at `core/codegen_<id>.js` (`server.js:481`).

A test copies a **golden fixture** into that path and drives the entire downstream pipeline headlessly:

```js
fs.copyFileSync('tests/fixtures/codegen/form_full.js', `core/codegen_${sid}.js`);
// → GET /codegen-result/:sid  → POST /save-mapping
// → assert parsed steps, tokenization, persistence
```

This covers AST extraction, `isSafeChain`, `tokenizeLiterals`, and persistence — every layer except the GUI. The untestable residue is one human mouse gesture, the same honest conclusion AGENTS.md already reached for drag-and-drop.

### A4.4 Test matrix — Phase A

**Relocatability (`tests/state_dir_test.js`)**

| ID | Expectation |
|---|---|
| A-1 | Unset env vars → identical to today; full suite passes |
| A-2 | Set → writes land there; `git status --porcelain` empty **repo-wide** (not just `core/`) |
| A-3 | **Read-only `core/` + `ROOT_DIR` + results dir** (`chmod -R a-w` on all three) + env set → full journey passes, including Excel upload and evidence write |
| A-4 | Two instances coexist on different ports |
| A-5 | `PORT=3101` still honored |
| A-6 | Runner spawn receives explicit `cwd`; compiled spec writes evidence to `AUTOTEST_RESULTS_DIR`, not `process.cwd()` |
| A-7 | `DRIVERS_ROOT` resolves via `process.resourcesPath` when set, `__dirname` otherwise (A1.3) |

**A-3 as originally specced (`chmod -R a-w core/` only) was a false-confidence test.** It locks the one directory the incomplete A1.1 fix already handled, while leaving `ROOT_DIR` — where Excel uploads and `results/` actually live — writable. It would have gone green against a build that fails on the tester's first click. Widened above to cover all three write roots.

**Codegen pipeline (`tests/codegen_golden_test.js`)** — one case per §A4.2 fixture

| ID | Expectation |
|---|---|
| A-10 | Every golden fixture parses without throwing |
| A-11 | `form_full` → select/checkbox/radio/date all become correct step types |
| A-12 | `iframe_form` → `frameLocator` chain survives `isSafeChain` |
| A-13 | `upload_file` → `setInputFiles` handled or **explicitly reported unsupported** (not silently dropped) |
| A-14 | **`noisy_real` → redundant clicks and stray-text clicks do not break the parse** |
| A-15 | Literal matching Test Data → tokenized to `{key}` |
| A-16 | Assertions (`toBeVisible`/`toHaveText`) unpack to the inner locator |
| A-17 | `/codegen-result` deletes the file after first read |
| A-18 | Orphaned `codegen_*.js` swept at boot (the A0 fix) |
| A-19 | Unsafe code saved but blocked at compile (matches existing T28) |

A-13 is deliberate: today's parser whitelist (`server.js:665`) has no `setInputFiles`. Either support it or fail loudly — a silently dropped upload step produces a test that passes while testing nothing.

**Full analyst journeys (`tests/journey_test.js`)** — golden fixture → mapping → compile → execute → evidence, against the local fixture app, headless

| ID | Journey |
|---|---|
| A-20 | Login success: 5 steps, screenshots per step, `FINAL.png` |
| A-21 | Login failure: asserts the error banner (negative path) |
| A-22 | **Same mapping key, two scenarios, different Data** → each honors its own (the `tokenizeLiterals` regression) |
| A-23 | Data Matrix: 3 iterations → 3 result folders, correct naming |
| A-24 | Wizard: multi-page flow keeps session state |
| A-25 | Slow page: no blank screenshots (AGENTS.md rule 4) |
| A-26 | Step with empty Test Data is skipped, not run blank (rule 14) — **see warning below** |
| A-27 | Mid-flow re-map: replay to step N, pause, resume |

> **A-26 is not a regression test — it is unbuilt scope.** AGENTS.md §4 rule 14 asserts "steps with empty test data are skipped rather than executed with blank values." Verified: `grep -c skip core/compiler.js` → **0**. There is no per-step skip logic anywhere in the compile path. `interpolate()` (`helpers.js:24`) returns `""` and never signals "skip"; the only existing default is the *iteration*-level fallback at `compiler.js:69-71`, which is a different rule entirely.
>
> So AGENTS.md rule 14 is **already violated today**. Writing A-26 honestly means it fails on day one and the compiler change becomes real Phase A work (tracked here, and coupled to A0.5.4 — both concern what `interpolate()` does with absent data). Writing A-26 to match current behavior would silently launder a documented rule violation into a green test, which is the exact failure this review exists to catch.

**Electron (`tests/electron_test.js`)** — via `playwright._electron`

| ID | Expectation |
|---|---|
| A-30 | App boots; window renders the Mappings tab |
| A-31 | Server child dies with the app — no orphaned node process |
| A-32 | **Read-only install**: package, `chmod -R a-w` the bundle, run a full A-20 journey |
| A-33 | Bundled Chromium resolves inside the package (`FOUND bundled Chromium` in log) |
| A-34 | Two instances coexist |
| A-35 | Excel upload → results land in `userData`, never in the app bundle |

**Air-gap proof (`tests/airgap_test.js`)** — the claim, actually asserted

| ID | Expectation |
|---|---|
| A-40 | **Zero outbound, process-wide** — see note; a per-page hook is insufficient |
| A-41 | Packaged app contains `DRIVERS/ms-playwright`, **unpacked** (not inside asar) |
| A-42 | App starts with `PATH` stripped of Node — proves Electron's own runtime is used |
| A-43 | Installer manifest declares per-user install (no admin) |
| A-44 | No `postinstall` / network step in the packaged app's startup path |

A-42 is the one that would catch accidentally depending on a developer's system Node.

> **A-40 must be process-wide, not per-page.** An earlier draft specced `page.route('**', …)` on one journey's page. The app spawns **three independent browser processes** that share no page object: codegen (`server.js:452`), replay (`server.js:421`), and the test runner (`server.js:569`). A per-page interceptor proves nothing about the other two — a telemetry ping from the standalone recording browser would go completely uncaught while the test reported "zero outbound."
>
> Real proof needs an OS-level check covering every spawned process: run the full journey behind a loopback-only proxy (or a deny-all egress rule) and assert no non-local connection is attempted by any child. The per-page hook can stay as a cheap secondary assertion, but it is not the air-gap proof.

## A5. Phase A sequence

| Step | Status | Gate |
|---|---|---|
| A0.0 — **path traversal (A0.6.1)** | ✅ Done | Standalone blocker, fix before anything else touches this codebase |
| A0 — test harness | ✅ Done | `npm test` exits 0, tree clean |
| A0.5 — four confirmed defects | ✅ Done | AST `isSafeChain`, trace redaction, `setInputFiles`, `interpolate` strictness |
| A0.6 — seven confirmed defects | ✅ Done | upload false-success, DB corruption wipe, merged-cell drop, duplicate-ID collisions, record/run race |
| A0.7 — nine confirmed defects | ✅ Done | mobile Record is a no-op, mobile failures always report "completed", drop zone has no handler, silent fetch failures, XPath injection |
| A0.8 — code review notes (max) | ✅ Done | RCE in `isSafeChain` args, Excel row-0 length check, `process.cwd()` paths, Data Matrix blank override fallback (incl. PR #9 rounds 1+2 review fixes) |
| A1 — relocatable server | 🟡 Partial | A-5 (dynamic port + clean `EADDRINUSE`) and A-7 (`DRIVERS_ROOT` via `resolveDriversRoot()`, `process.resourcesPath`-aware) done — `tests/state_dir_test.js`. A-1/A-2/A-3/A-4/A-6 (full `STATE_DIR`/`DATA_DIR`/`RESULTS_DIR` relocation across server.js, compiler.js, scenario_parser.js) deferred: no consumer exists yet — add when A2's Electron shell lands and actually needs a writable-outside-asar path. |
| A2 — fixture app + record goldens | 🟡 Partial | A4.1 offline fixture app done (`tests/fixtures/app/*.html`, `tests/fixtures_smoke_test.js`) — 8 pages, served via `npm run fixtures:serve`. A4.2 golden codegen recording is a **human-only step** (doc's own rule: "real codegen output, recorded by a human — never fabricated") — cannot be looped by an agent. A-10…A-19 blocked on those goldens existing. |
| A3 — analyst journeys | ⬜ Not started | A-20…A-27 |
| A4 — Electron shell | ⬜ Not started | A-30…A-35 |
| A5 — air-gap hardening | ⬜ Not started | A-40…A-44 |
| A6 — CI | ⬜ Not started | GitHub Actions running `npm test` (15 lines once A0 lands; impossible before) |

**Phase A ships here.** Phase B begins only after A5 is green.

---

# PHASE B — CDP-Attach Recording: Reuse the Tester's Logged-In Chrome

Today, every `/record` call spawns a brand-new, throwaway Playwright-managed Chromium window — for both the plain codegen path and the mid-flow "replay preceding steps then pause" path. Every session starts logged out; login is only restored by re-*executing* previously mapped login steps, which breaks down for MFA, SSO redirects, "remember this device" cookies, or CAPTCHAs — none of which a scripted replay can get through.

The fix: attach to the tester's **real, already-running Chrome** via the Chrome DevTools Protocol (CDP) instead of launching a fresh browser. The tester logs in once, manually; every recording session after that attaches to that same live, authenticated tab.

**Confirmed decisions, not up for re-litigation:**
- Both the plain codegen path and the replay-before-record path switch to CDP-attach. Neither spawns a fresh browser anymore.
- AutoTest Studio's own server launches the tester's Chrome (detecting/prompting if their normal Chrome needs closing first) — not a manual shortcut the tester runs themselves.
- It's their **real daily-driver Chrome profile** — real bookmarks, history, other logins, other tabs — not an isolated AutoTest-only profile. A deliberate tradeoff (§B8), not an oversight.

**Verified against the actual installed `playwright-core` in this repo** — by running code against `node_modules/playwright-core/lib/coreBundle.js`, not reading docs:
- `chromium.connectOverCDP(endpointURL)` exists and works with any Chromium exposing CDP, including a real logged-in Chrome — Microsoft's own bundled type docs name this exact "attach to a user's daily-driver browser" scenario as supported.
- The `codegen` CLI has **no** CDP-attach flag. Attaching and getting the recorder UI requires the library API directly: `context._enableRecorder({...})`, the same internal (underscore-prefixed, unstable-by-convention) call the CLI itself uses:
  ```js
  await context._enableRecorder({
    language, launchOptions, contextOptions, device: options.device,
    saveStorage: options.saveStorage, mode: "recording",
    testIdAttributeName, outputFile: outputFile ? path.resolve(outputFile) : void 0,
    handleSIGINT: false
  });
  ```
- `browser.close()` on a `connectOverCDP()`-obtained `Browser` only closes the WebSocket transport (`chromeTransport.closeAndWait()`) — never sends a real `Browser.close` to Chrome. **Safe to call without killing the tester's actual browser.**
- `globalBrowser` (`server.js:45`, referenced in both shutdown handlers at `:66-68` and `:115-116`) is **dead code today** — declared, never assigned. Not needed here; the debug-Chrome child process is deliberately excluded from both `trackedProcesses` and this variable (§B6).

## B1. New file: `core/cdp_session.js`

Follows this repo's flat-file style (`core/helpers.js`, `core/action_db.js`): plain functions, module-level state, one `module.exports`. Repeats the same `DRIVERS_PATH` module-resolution shim every `core/*.js` entry file already does independently (`compiler.js:4-8`) — not worth extracting for 5 lines.

```js
const { chromium } = require('playwright-core');
const CDP_PORT = process.env.CDP_DEBUG_PORT || 9333; // fixed default, avoids colliding with devtools' common 9222
let cachedBrowser = null, cachedPage = null;

function resolveSystemChromePath() { /* Windows-first candidate list, mac/linux fallback */ }
function resolveRealProfileDir()   { /* %LOCALAPPDATA%\Google\Chrome\User Data, etc. */ }
async function ensureDebugChrome() { /* detect-or-launch, throws typed .code errors — see B5 */ }
async function getPage()           { /* connect if needed, reuse the ONE tracked Page — see B4 */ }
async function startCodegenRecording({ url, outputPath }) { /* page.goto + context._enableRecorder(mode:'recording') */ }
async function stopCodegenRecording() { /* context._disableRecorder() */ }
async function runStepsThenPause(page, steps, iterData)   { /* live-exec preceding steps, then page.pause() */ }

module.exports = { ensureDebugChrome, getPage, startCodegenRecording, stopCodegenRecording, runStepsThenPause };
```

## B2. Chrome discovery & lock detection

Reuses `getBundledBrowserPath()`'s candidate-list pattern (`server.js:76-93`), pointed at the *real* system Chrome install locations instead of `DRIVERS/`.

Lock detection deliberately does **not** parse Chrome's internal `SingletonLock` mechanism (undocumented, version-fragile). Two-step, matching this app's existing "poll for async readiness" pattern (`/codegen-result` polling):
1. Proactive: `tasklist`/`pgrep` check for a running Chrome process before attempting anything.
2. Reactive fallback: launch with `--remote-debugging-port --user-data-dir=<real profile>`, then poll `http://127.0.0.1:9333/json/version` for ~8s. If it never responds and the spawned process already exited, that's Chrome forwarding the launch to an already-running instance — the real-world signature of a profile lock. Surface the same "please close Chrome" error either way.

## B3. Route changes in `studio/server.js`

**Codegen path** (`:452-476`, currently `spawn(PLAYWRIGHT_CLI, ['codegen', ...])`) → `cdpSession.getPage()` + `cdpSession.startCodegenRecording({url, outputPath})`. `GET /codegen-result/:sessionId` (`:481-490`) stays **untouched** — `_enableRecorder({outputFile})` writes the same live-updating file the CLI already wrote.

**Replay-before-record path** (`:379-445`) → delete the `replayCode` string-builder + temp-spec-file + `spawn(PLAYWRIGHT_CLI, ['test', ...])` block entirely (net code reduction). Replace with `cdpSession.getPage()` + `cdpSession.runStepsThenPause(page, precedingMappedSteps, iterData)`.

`runStepsThenPause` reuses `isSafeChain`/`interpolate`/`q` from `core/helpers.js` **as-is**. The per-action-type dispatch gets written **once**, live, in `cdp_session.js` — it can't literally share code with `core/compiler.js`'s version (that one emits spec-file text; this one executes against a live `Page`), but today's inline replay-string-builder in `server.js` already duplicates most of that same logic as a second string-emitter. This collapses two string-emitting copies into one live-executing one.

Two things to verify **during implementation**, both with a documented fallback:
- `isSafeChain`'s validated string needs to run live against a `Page`, not get embedded in generated source — evaluate it the same way it was always destined to run, just at recording time instead of test time (same trust boundary as today, not a new attack surface).
- `expect(loc).toBeVisible()` needs `expect` outside a `test()` block for assertion steps — if that throws, fall back to `loc.waitFor({state:'visible'})` / a manual text comparison, both plain `Locator`/`Page` APIs.
- `page.pause()` opening the Inspector on a CDP-*attached* (not launched) page — verify first in manual testing (§B9) before trusting it structurally.

## B4. Session/tab reuse model

**One tracked `Page`, cached at module level, reused for the server process's whole lifetime** — not a fresh tab per recording session. Cookies are profile-scoped, so a new tab would also stay logged in; pinning to one specific tab instead avoids tab accumulation over a full tester workday and ambiguity about which of the tester's many open tabs the automation is touching. `getPage()` reuses the previously-tracked page if still open; otherwise falls back to the context's first open page, then `newPage()` as a last resort.

## B5. Cancel/cleanup semantics change

`/record-cancel` (`:859-867`) currently `SIGKILL`s the spawned browser process. New behavior:
- Codegen path: `context._disableRecorder()` — a real "stop recording," tab stays open.
- Replay path: `page.pause()` has no public cancel API. "Cancel" here means "stop tracking this as the server's active session" (unblocks the `409` guard) — the Inspector, if left open, sits harmlessly until the tester dismisses it in their own browser. Update the guide-banner copy in `studio-ui.html` to stop implying the browser closes on cancel.

`cleanupAll()` and the `exit`/SIGINT/SIGTERM handlers (`:60-68`, `:113-117`) need **no changes** — the debug-Chrome process is deliberately never added to `trackedProcesses` and is `.unref()`'d at launch, already excluded from both kill paths. Ship with zero shutdown code for it; let the WebSocket die naturally with the Node process, which per the verified `connectOverCDP` close behavior above cannot kill the tester's real Chrome anyway.

## B6. Failure modes → tester-facing messages

No stack traces, no terminal — matches this document's contract everywhere else.

| Failure | Message |
|---|---|
| Chrome not installed at any known path | "Chrome wasn't found on this computer. Ask IT to install Google Chrome, then try again." |
| Tester's normal Chrome already open (profile lock) | "Please close all Chrome windows, then click Record again." + a Retry button |
| Debug port in use by something else | "Port 9333 is in use by another program. Restart your computer and try again." |
| `_enableRecorder` throws | "Recording couldn't start. Contact support with error code ENABLE_RECORDER_FAILED." (full stack logged server-side only) |
| Tester closes the debug Chrome mid-session | `browser.on('disconnected')` clears cached state; next `/record` transparently re-launches/re-attaches |
| Tester never actually logs in | Not detectable server-side — a guide-banner reminder, not an error path |

All as typed `err.code` values from `cdp_session.js`, mapped to messages using the exact `res.status(...).json({error:...})` shape already used elsewhere (e.g. the `409` guard at `:339-341`) — no new response envelope.

## B7. No fallback/opt-out

Hard replacement of the old spawn-based codegen, no toggle to keep both. The old path exists specifically to solve a problem ("I don't want my real Chrome touched") the confirmed decisions already ruled out by choosing the real daily-driver profile. `ponytail: no isolated-profile fallback; add a launch.json-style flag if a tester genuinely needs an untouched Chrome, add when someone asks for it.`

## B8. Air-gap/security call-out

This gives AutoTest Studio's automation live control of the tester's actual logged-in Chrome for the duration of the connection — their SSO session, any other open internal tools' cookies, browsing history, other open tabs. This is a materially larger blast radius than today's throwaway-browser-per-session model. The recorded mapping itself doesn't start persisting credentials anywhere new (still only captures locators and typed values, same as today) — the exposure is live, in-session access, not new data at rest. Worth a `ponytail:`-style comment at the top of `cdp_session.js` and a line in `AGENTS.md` §2: a deliberate tradeoff a future reader shouldn't have to reverse-engineer from the diff.

## B9. Verification — manual, cannot be exercised by `tests/*.js`

This fundamentally requires a real system Chrome and a real profile, which CI/sandboxed environments don't have. `tests/record_replay_sit.js` gets a runtime skip-guard (clear message when `resolveSystemChromePath()` returns null) rather than silently passing or failing wrong — it currently expects a spawned browser to appear, which no longer applies.

**Manual sequence** (repeat on a real Windows target before sign-off):
1. Start `node studio/server.js` with no Chrome running. Click Record on a step with no preceding mapped steps. Confirm: Chrome launches on the real profile (real bookmarks visible), attaches via CDP, recording populates the textarea via the existing `/codegen-result` poll — unchanged on that end.
2. With that Chrome still open, Record a second, different step. Confirm it reuses the same tab (no second window), any prior navigation/login state is still present.
3. Manually log into a real test login page in that tab. Map the login step, then Record a step *after* login (replay path). Confirm preceding steps execute live against the already-authenticated tab and `page.pause()` opens the Inspector on it — the specific assumption flagged in §B3.
4. Trigger `/record-cancel` mid-recording — confirm the tester's Chrome stays open and usable.
5. Manually close the debug Chrome entirely, then Record again — confirm clean re-launch, no hang/crash.
6. With the tester's normal (non-debug) Chrome already open, click Record — confirm the "please close Chrome" message, not a stack trace; close it, retry, confirm success.
7. Stop the server (Ctrl+C) while debug Chrome is open — confirm the tester's Chrome is still running afterward.

Per `AGENTS.md` §3.4, once implemented these become new `TEST_SCENARIOS.md` rows for the Black-Box Scenario Tester to run on every future change to `studio/server.js` or `core/cdp_session.js`.

**Phase B ships here.** Phase C begins only after §B9's manual verification sequence passes.

---

# PHASE C — Office-Network LLM Mapping Assist

Purely additive. Disabled and invisible unless a provider is configured.

## C1. What the tester experiences

```
○ Approve Leave Request     [Record] [Manual] [✨ Suggest]
```

- Enabled **only** for the next unmapped step in a scenario (sequential gating).
- Disabled with a hover when no provider is configured.
- Press → app replays preceding steps in a **headed** browser, snapshots the page, asks the model, **executes the proposal live** so the tester watches it land.
- Then: `[Accept]` · `[Reject & Retry]` · `[Edit manually]`.

## C2. Provider config — `.env`

Four blocks; the tester fills **exactly one**.

```dotenv
# ---- Pick ONE block. Leave the others commented out. ----

# OpenAI-compatible (vLLM, Ollama, LM Studio, TGI, LiteLLM) — default
LLM_PROVIDER=openai
LLM_BASE_URL=https://llm.corp.internal/v1
LLM_API_KEY=
LLM_MODEL=qwen2.5-coder-32b

# Azure OpenAI (internal tenant)
# LLM_PROVIDER=azure
# LLM_BASE_URL=https://corp.openai.azure.com
# LLM_API_KEY=
# LLM_MODEL=<deployment-name>
# LLM_API_VERSION=2024-06-01

# Ollama native
# LLM_PROVIDER=ollama
# LLM_BASE_URL=http://llm.corp.internal:11434
# LLM_MODEL=qwen2.5-coder:32b

# Bespoke in-house — implement adaptBespoke() in core/llm.js
# LLM_PROVIDER=custom
# LLM_BASE_URL=
# LLM_API_KEY=
# LLM_MODEL=
```

**Ambiguity fails loud.** You asked for "use whichever is filled." Silent precedence between two filled blocks is a 3am bug — a tester who edits the wrong block sees no error and wrong behavior. So:

- **0 configured** → feature disabled, button greyed, tooltip: *"No AI provider configured. Ask IT for your office LLM endpoint, then fill one block in .env."*
- **1 configured** → enabled.
- **2+ configured** → feature disabled, banner names both: *"Two providers configured (openai, ollama). Comment out one."*

In Electron, `.env` lives in `userData` (writable, per A1.1) — never inside the app bundle.

## C3. `core/llm.js` (~60 lines, zero dependencies)

```js
function resolveProvider(env)   // → {provider, baseUrl, …} | {error:'none'|'ambiguous', found:[]}
async function complete(prompt) // stdlib fetch, AbortSignal.timeout(30_000)
```

One `switch` shapes request/response per provider. A bespoke API is one `case` — the adapter seam without an adapter framework.

**Air-gap guard (trust boundary, non-negotiable):** before any request, assert the endpoint is internal. A typo'd `.env` pointing at a public endpoint would exfiltrate the tester's DOM — including whatever is on screen in a banking app. Refuse and name the host.

> **The naive version of this guard rejects our own documented default.** B2's headline example is `https://llm.corp.internal/v1` — a *hostname*, not an IP literal. A string check for private/loopback ranges cannot classify it without actually resolving DNS. So the guard must be specified concretely, or it either blocks every real corporate endpoint or degrades into an allowlist that makes the range check dead code.
>
> **Specified behavior:** resolve the hostname once at startup (`dns.lookup`), assert **every** returned address is in a private range (RFC1918, loopback, link-local, or unique-local). Cache the result; re-resolve on failure. If DNS is unavailable, the feature is **disabled with a clear message** — never fail open. An explicit `LLM_ALLOW_HOST` escape hatch exists for environments with split-horizon DNS, and using it is logged visibly in the UI, not silently honored.
>
> **Test C-7 (new):** the plan's own default `llm.corp.internal` (stubbed to resolve to 10.x.x.x) **passes** the guard. Without this test it is entirely possible to ship a guard that passes C-1…C-6 and still blocks every tester's working config out of the box.

## C4. The prompt — generalist by construction

The previous draft hardcoded a login example and implied one clean line of output. Both were wrong. Three corrections, each forced by real codegen output:

1. **Nothing domain-specific.** No login vocabulary, no field-name assumptions. The page tree and the step label are the only inputs; everything else is generic instruction.
2. **Multiple actions per step.** Real codegen emits `click()` then `fill()` for one logical step. Approving a leave request may be click → select → click. The contract is *a list of actions*, not one line.
3. **Match codegen's own shape.** Output goes through the same `parseRecordedCode` as codegen, so it must look like codegen: `await page.<locator>.<action>(…)` lines.

```
You map a test-step label to Playwright actions on the page shown below.

PAGE (accessibility tree):
{ariaSnapshot}

STEP LABEL: "{label}"
TEST DATA: {json}                       // may be {}
PREVIOUSLY REJECTED: {list}             // do not repeat these

RULES
1. Output ONLY `await page.…` lines. No imports, no test wrapper, no prose, no markdown.
2. Emit as many lines as the step needs — one, or several.
3. Every element you reference MUST appear in the page tree above. Never invent one.
4. For each TEST DATA key, use {key} — never the literal value.
5. Locator preference: getByRole > getByLabel > getByPlaceholder > getByText > locator().
6. If the step is a check/verification, use await expect(…).toBeVisible() or .toHaveText().
7. If no element in the tree can satisfy the label, output exactly: CANNOT_MAP
```

Rule 3 is the anti-hallucination clause and the reason a page snapshot is supplied at all (AGENTS.md rule 1). Rule 4 enforces AGENTS.md rule 3, with `tokenizeLiterals` (`helpers.js:45`) as the backstop. Rule 5 encodes AGENTS.md rule 13. Rule 7 gives the model a way to decline — without it, a model asked to map an impossible label invents a plausible locator, which is the worst outcome.

**The tree is generic, so the prompt is generic.** Worked examples across different domains, all from the same unchanged template:

| Step label | Page tree (excerpt) | Expected output |
|---|---|---|
| `Approve Leave Request` | `row "L-1042" → button "Approve"` | `await page.getByRole('row', { name: 'L-1042' }).getByRole('button', { name: 'Approve' }).click();` |
| `Set Effective Date` | `textbox "Effective Date"` | `await page.getByLabel('Effective Date').fill('{effective_date}');` |
| `Filter by Department` | `combobox "Department"` | `await page.getByLabel('Department').selectOption('{department}');` |
| `Confirm Deletion` | `dialog → button "Yes, Delete"` | `await page.getByRole('button', { name: 'Yes, Delete' }).click();` |
| `Verify Balance Updated` | `text "Balance: 1,250.00"` | `await expect(page.getByText('Balance: 1,250.00')).toBeVisible();` |
| `Attach Payslip` | `button "Choose File"` | `CANNOT_MAP` (file input needs a path, not a locator) |

Last row matters: declining is a correct answer, and the tester falls back to Record.

## C5. `core/ai_session.js` (~120 lines)

The existing `/record` replay (`server.js:380-445`) spawns `playwright test` and dies at `page.pause()`. AI mapping needs a session that **stays alive and controllable** across propose/reject rounds. So: drive `playwright-core` directly via the library API, reusing `getBrowserEnv()` for bundled-browser resolution.

```js
start(scenarioId, label)          // launch headed, replay preceding steps
snapshot()                        // page.locator('body').ariaSnapshot()
propose(label, data, exclude[])   // prompt → code string
execute(code)                     // parseRecordedCode → isSafeChain → run live
rewind()                          // re-replay to step N-1  (reject path)
stop()
```

**Reject → retry.** Executing mutates the DOM, so attempt 2 must not run against a page attempt 1 dirtied:

```
propose → execute → tester rejects
  → rewind()                       re-replay to step N-1, clean state
  → propose(exclude=[attempt1])    model told what already failed
  → execute → accept / reject again
```

Without `rewind()`, retry #2 proposes against a page where retry #1 already clicked something. This is the subtle bug the design exists to prevent.

## C6. Security: LLM output gets no special trust

A proposal is **just a code string**, so it takes the exact path codegen and manual paste take:

```
proposal → parseRecordedCode()  (server.js:647, Acorn AST)
         → isSafeChain()        (helpers.js:8, blocks require/eval/process/…)
         → execute
```

No new validation, no new attack surface. AGENTS.md rules 1–2 already cover it; the model is simply another untrusted source of `code`. **A proposal failing `isSafeChain` is a rejected proposal, not an error** — retry with it excluded.

## C7. Phase C test suite

Runs unattended against a **fake LLM** — no office network, no real model.

`tests/fixtures/fake_llm.js` (~30 lines): an `http.createServer` speaking OpenAI's response shape, scripted per test to return a good proposal, a wrong one, an unsafe one, `CANNOT_MAP`, or malformed JSON. Deterministic, and exercises failure paths a real model reaches only by luck.

**Provider resolution (`tests/llm_test.js`)** — no network, no browser

| ID | Expectation |
|---|---|
| C-1 | 0 providers → `{error:'none'}`, feature disabled |
| C-2 | 1 provider → resolves |
| C-3 | 2 providers → `{error:'ambiguous', found:[a,b]}`, **does not guess** |
| C-4 | Public `baseUrl` → **refused**, host named |
| C-7 | **The documented default `llm.corp.internal` (→10.x) passes the guard** — proves the guard doesn't block our own config |
| C-8 | DNS unavailable → feature disabled with a message, **never fail open** |
| C-5 | Each provider shape builds the right request |
| C-6 | Timeout → typed error, no hang |

**Prompt generality (`tests/prompt_test.js`)** — fake LLM, asserts the prompt, not the model

| ID | Expectation |
|---|---|
| C-10 | Prompt contains the page tree and label, and **no domain vocabulary** |
| C-11 | Every TEST DATA key appears as `{key}` in the instruction |
| C-12 | Rejected attempts are passed in `PREVIOUSLY REJECTED` |
| C-13 | **Multi-line proposal parses into multiple steps** |
| C-14 | `CANNOT_MAP` → surfaced to the tester as "use Record", not an error |
| C-15 | Proposal referencing an element absent from the tree → flagged, retried |
| C-16 | Six §C4 worked examples parse to the expected step types |

**AI session (`tests/ai_session_test.js`)** — headless, fake LLM, fixture app

| ID | Expectation |
|---|---|
| C-20 | `ariaSnapshot` of each fixture page contains its expected roles |
| C-21 | Good proposal executes; page state actually changed |
| C-22 | **Unsafe proposal (`require('fs')`) rejected by `isSafeChain`, never executed** |
| C-23 | Reject → `rewind()` → **assert DOM back to step N-1 state** |
| C-24 | Retry passes `exclude` |
| C-25 | Literal proposal tokenized to `{key}` before save |
| C-26 | Accept persists identically to a manual save |
| C-27 | Malformed LLM JSON → treated as rejection, not a crash |
| C-28 | Session survives 3 consecutive reject-retries without state leak |
| C-29 | LLM endpoint down → button reports unavailable; **Record/Manual still work** |

**UI gating (`tests/ai_ui_test.js`)**

| ID | Expectation |
|---|---|
| C-30 | No provider → button disabled, tooltip present |
| C-31 | Ambiguous → disabled, banner names both |
| C-32 | Suggest enabled only for the next unmapped step |
| C-33 | `Edit manually` loads the proposal into the Manual modal — **override always one click away** |

C-22, C-23 and C-29 matter most: the security boundary, the state-corruption bug, and the guarantee that a dead LLM never blocks the tester's existing workflow.

---

## Out of scope

- **Bulk / whole-sheet mapping.** Per-step only. Bulk needs the app to drive navigation, which it cannot infer before anything is mapped.
- **External / cloud LLM providers.** Actively blocked by C3's air-gap guard.
- **LLM driving navigation.** The tester's navigation supplies page state.
- **LLM-generated assertions.** Actions only. A wrong assertion silently passes a broken test — needs its own review before automating.
- **Code-signing / notarization.** Open risk (§A3), tracked not solved.
- **Bundle-size optimization.** Deferred until a real installer is measured.
- **`action_db.js` file lock.** AGENTS.md calls it a test-tooling artifact, not realistic single-tester usage.
- **Drag-gesture E2E.** AGENTS.md documents `dragTo()` as unreliable against custom HTML5 DnD; both halves verified independently.

---

## Ponytail notes

- **No new runtime dependency.** `fetch` is stdlib; `ariaSnapshot` and `_electron` are in the already-bundled Playwright. Only `electron` + `electron-builder` as devDeps, at A4.
- **Reused, not rebuilt:** `parseRecordedCode`, `isSafeChain`, `interpolate`, `tokenizeLiterals`, `getBrowserEnv`, and the compiler's step→action logic. Phase C adds ~180 lines across two files because the security and interpolation paths already exist.
- **`ariaSnapshot` over a DOM dump** — native Playwright feature, ~15 tokens for a login page instead of thousands.
- **Golden codegen fixtures over generated ones** — more maintenance (manual re-record on format change), but the alternative is testing against a fiction that drifts.
- **Fail loud on ambiguous config** — the one place this plan chooses more code over less. Three lines to prevent a silent-wrong-provider bug.
