# Change Log

**Purpose:** Concise, chronological record of repository changes and their
validation status. Newest entries are added at the top.

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
