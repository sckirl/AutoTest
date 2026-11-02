# AutoTest Studio: Agent Orchestration & Context

## Current engineering direction — 2026-10-17

Gabriel Alvin confirmed: independent offline desktop installs, easy tester and maintainer setup, manual Playwright codegen recording followed by complete workbook-scenario replay as MVP. AI-assisted mapping and real mobile execution are deferred. The detailed current plan is [BRAIN/Engineering Plan.md](BRAIN/Engineering%20Plan.md); file/function contracts are [BRAIN/Module Contracts.md](BRAIN/Module%20Contracts.md); agent assignments and runtime gates are [BRAIN/Recording Acceptance.md](BRAIN/Recording%20Acceptance.md). `blueprint.html` is the summarized view.

This amendment supersedes conflicting historical status/priority statements below and in older BRAIN plans. It does not waive security/data/isolation rules. Electron already exists; the handoff below is historical, not proof of a native installed release. Current `/record` uses visible CLI codegen; CDP helpers remain for optional paths. Rule 16 below is the earlier CDP-specific ownership contract: preserve normal-profile isolation and never kill unowned debug Chrome, but do not describe default CLI recording as CDP-attached. Changes to bundled-versus-stable-Chrome policy require an explicit documented architecture amendment and native recording proof.

### Delegated model policy — 2026-10-17

Gabriel Alvin requires every newly launched subagent to use `gpt-6-luna`. Spawn with an explicit model and fresh context (`fork_turns="none"`) plus a scoped task brief. Do not reuse earlier inherited-model audit agents for new work. The coordinating model can remain Sol. Model policy is an execution preference, not evidence of correctness.

### Verified lessons and mandatory prevention

1. **Do not promise zero defects.** State tested conditions and evidence limits. Record actual mistakes with trigger/consequence/prevention; do not invent future lessons.
2. **Read current code before trusting BRAIN checkmarks.** Old dates, comments and tests are not present release acceptance. Reconcile claims through [BRAIN/Plan Reconciliation.md](BRAIN/Plan%20Reconciliation.md).
3. **A successful spawn is not a working recorder.** Realistic acceptance uses browser-use with headed Chrome and actual clicks; ComputerUse operates native dialogs and actual Playwright codegen/Inspector controls when available. Programmatic file assignment and JavaScript click/handler injection are supplemental, not native-interaction proof. Launch-argument tests cannot close the real-codegen gate. ComputerUse must operate AutoTest, target browser and Inspector, transfer genuine generated code, save via UI and replay the whole scenario.
4. **A replay spec is not a recorder export.** `page.pause()` can open codegen controls but does not prove automatic output transfer. Use the shown, tested Copy/paste path when required; never manufacture codegen output for acceptance.
5. **Syntax checks cannot catch every regression.** The stray upload `d` is valid syntax yet throws on every upload. Require an actual valid and invalid request for changed intake behavior.
6. **Never accept partial recordings.** Unknown action, matcher, argument form, alias or control flow rejects the whole import with location; preserve the prior mapping. Missing mappings/unknown emitted actions must fail scenario preflight rather than disappear.
7. **Keep one action interpretation.** Record/library parsing, preview, preceding replay and final compile share validated semantics. A route-file split alone does not solve duplicated behavior.
8. **Every async callback belongs to one operation.** Timers and child exits may change only their matching run/session. Test cancel A → start B → delayed A close/timer. A kill signal is not proof the child exited.
9. **Protect developer data during tests.** Audit tests themselves for hardcoded repo paths/ports; separate state/data/results/profile roots per run. Do not run the complete legacy suite until both harness and individual tests are isolated. Never use normal Chrome data.
10. **Data corruption is not empty input.** Explicit blank remains deliberate; absent keys and corrupt JSON fail loudly. Never silently switch matrix values/iterations to defaults. First format-changing slice includes backup, legacy migration and rollback tests.
11. **Display labels are not unique artifact IDs.** `PT.1` and `PT-1` collide after cleaning. Quote all generated strings; preserve run/scenario/iteration identities and verify report counts/links.
12. **Package proof uses the package.** Source Electron launch is development coverage. Inspect resources and record/replay the native installed artifact with no Node/npm, no developer cache and no internet. macOS results cannot certify Windows.
13. **Single desktop still needs ownership.** Different ports do not isolate shared state/profile. Serialize GUI control, state migrations and same-file edits; one state owner per installation.
14. **Maintain independence.** Developer implements; static QA writes `defect.md`; fresh-context black-box tester reads observable contracts, runs the entire assigned scope and writes runtime evidence to `TEST_RESULTS.md`. Never marks PASS from source inspection or patches the system it certifies.
15. **Make status honest.** Label source inspection, bounded code probe, unit, API integration, real codegen and installed-package evidence separately. Required FAIL/BLOCKED/NOT RUN keeps its gate open; retain prior failures. Baseline capture can finish with assigned defects without claiming acceptance.
16. **Keep changes reviewable.** Preserve dirty work and unfinished plans. Move-only slices keep behavior; behavior changes get explicit regression checks. Group by ownership, not line count. No new framework/dependency or file-per-function architecture without a demonstrated need.
17. **Test the resources, not just their path strings.** During G1a a harness fixture passed while real Studio failed because temporary directories did not exist. A fixture must actually write to every promised root; verify real startup before using a harness result as application evidence. Explicitly blank optional-provider env settings so dotenv cannot refill them.

18. **Verify dependency absence directly.** During the full-workbook run an empty wrapped file-search result was incorrectly reported as missing Playwright Chrome. The exact bundled executable existed. Check the documented path with a direct listing and distinguish missing files from native app-access rejection before declaring an environmental blocker.

19. **Compare the displayed capture with the completed recorder output.** In the full-workbook native baseline, AutoTest advertised captured code containing only about:blank while the completed recorder file contained the OrangeHRM navigation. A first-created export or success banner does not prove the final source reached the modal. Verify source equality after recording ends; native Inspector Copy/Paste remains its own gate.

20. **Restart completed agents explicitly.** During final-delivery review, correction messages sent to a completed developer did not restart work. Use followup_task for an idle/completed agent, then verify its running status; send_message alone only queues context.

21. **An app path does not isolate its browser profile.** During final-delivery QA, the Studio UI browser was opened by app path without an explicit temporary user-data-dir. The recorder itself had an isolated profile, but that did not establish UI-browser isolation. Use a task-owned temporary profile or the in-app browser for Studio; never infer isolation from a bundled executable path, and never clear or kill an unowned browser to clean up.

22. **Test response order across related features.** Separate modal-preview and final-poll tests missed a combined race: a late old preview overwrote already delivered final code because automatic insertion did not advance the revision. Test final-result-first/preview-last explicitly; invalidate older writes when a newer programmatic result is applied.

### Automatic final-output delivery amendment — 2026-10-17

Gabriel Alvin authorized session-owned final codegen-file delivery as the primary path into AutoTest. Realistic ComputerUse recording remains mandatory, but native Inspector Copy/Paste is now a fallback rather than a prerequisite for this path. This supersedes conflicting Copy/Paste-only acceptance wording above. Wait for successful matching child close before final delivery; failed/cancelled sessions and stale callbacks cannot publish success or overwrite another session/user edits. Keep explicit review/save. Intermediate replay and installed packages require separate proof.

23. **Valid JavaScript is not necessarily a complete codegen snapshot.** Live-preview tests showed an import-only prefix passed Acorn yet was rendered as bogus action text by the wrapper fallback. Require the expected generated test-body envelope before publishing a live snapshot; retain the last valid version across partial writes.

### Live feedback requirement — 2026-10-17

Gabriel Alvin requires generated actions to appear during native recording. Provide a clearly provisional live preview via the existing polling route, then finalize only after successful owned child close. Early file existence remains insufficient for completed capture. Preserve actual edits and expose live/final source separately when needed; prevent provisional recordings from being saved as completed actions. This supersedes close-only display wording above.

24. **Verify native focus before typing.** During Oct 21 ComputerUse QA, an address-bar shortcut reached the Username field and an unverified address-bar selection produced malformed navigation; codegen correctly recorded those unintended actions. Inspect native AX focus/selected text before typing URLs, discard polluted captures without saving, and retain the failed attempts in runtime evidence.

Current source findings are in [defect.md](defect.md). The original planning pass changed documentation only. Current implemented slices and executed checks are tracked in [BRAIN/Implementation Progress.md](BRAIN/Implementation%20Progress.md); complete recording and installed-package acceptance remain separate gates.

---

This document encapsulates the complete project vision, architectural details, and specialized agent directives. All AI agents interacting with this repository MUST assimilate this context to ensure zero-defect continuity.

---

## 1. Project Vision
AutoTest Studio is a **Zero-Install, Air-Gapped, Omnichannel (Web) Data-Driven E2E Automation Engine** designed for hardened corporate environments where internet access and `npx` commands are strictly blocked.
- **Core Loop**: Upload Excel matrix (UAT Blueprint) -> Record actions in Playwright -> Compile and execute headless/headed tests -> Output screenshots and artifacts to the `/results/` folder.
- **Key Directive**: All Playwright browsers and Node dependencies are bundled locally inside the `DRIVERS/` directory.

---

## 2. Architectural Context & Hardened Rules
All modifications to the system must adhere to these architectural rules:

1. **AST Extraction (No Hallucinations)**: `studio/server.js` uses Acorn to parse user-provided Playwright code. It strictly extracts the raw locator string (e.g., `page.getByRole(...)`) using `code.substring(node.start, node.end)` to prevent reconstructed parameter hallucination.
2. **Security & Chaining (`isSafeChain`)**: `core/compiler.js` utilizes an `isSafeChain` evaluator. It strictly permits Playwright native chains (`locator`, `getByRole`, `filter`, `frameLocator`) while blocking arbitrary code injections.
3. **Data-Driven Parameterization (DDT)**: AutoTest uses `{variable_name}` syntax, **not** JavaScript template literals (`${variable}`). The compiler looks for `{}` and safely injects variables from the Data Matrix JSON override.
4. **Screenshot Synchronization (Zero-Blank Pages)**: In modern SPAs, `networkidle` returns instantly. The compiler enforces `await page.waitForTimeout(1000)` BEFORE `await page.waitForLoadState('networkidle')` to guarantee full DOM paint prior to screenshot captures.
5. **Regex Uniformity**: Both `core/scenario_parser.js` and `studio/server.js`'s `/scan` route use `^(?!\d+$)[a-zA-Z0-9_.-]+$` to differentiate between Scenario IDs (e.g., `HRM_01`) and Step Labels (e.g., `"1"`).
6. **Assertion Support (Negative Testing)**: The AST securely unpacks `expect(locator).toBeVisible()` and `toHaveText()` by extracting the locator payload inside the assertion, enabling deep negative and verification testing flows.
7. **Clean Startup State**: If no scenario spreadsheet (`scenario_uploaded.xlsx`) is present at server boot, `mappings.json` is automatically reset to `{}` to prevent ghost mappings.
8. **Preceding Script Replay**: Recording an intermediate step compiles preceding flow steps into a temporary spec `core/replay_${sessionId}.spec.ts` and halts at `await page.pause()`, allowing manual testers to resume recording at the exact DOM/session state.
9. **Nested Describe Harvester**: Playwright JSON output structures tests within nested `describe` blocks. Results dashboards must recursively harvest specs rather than assuming a single-level structure.
10. **Results Servability & Custom Index Listing**: The results directory is served statically under the `/results` route, and the `/results/` path serves a custom HTML directory index dynamically rendering scenario folders and artifacts with zero external package dependencies.
11. **Consistent Scenario ID Cleaning**: Both the compiler and the UI results dashboard parse scenario identifiers and iteration numbers using matching pattern rules (e.g., `Scenario PT.1 - Iteration 1` translates consistently to `PT_1_Iter1` on disk and links) to ensure correct image/trace resolving.
12. **Resilient Load States**: Page navigation `page.goto` calls should avoid rigid `networkidle` state requirements (which block/hang on telemetry, tracking, or polling scripts); instead, leverage default page load states combined with catch-guarded screenshot timings.
13. **Locator Strategy Preference**: When mapping a step, prefer resilient, accessible locators (`getByRole`, `getByText`, `getByLabel`) over raw `locator(...)` CSS/XPath; fall back to `locator(...)` only for queries those can't express. This is guidance for what testers paste, not something the compiler enforces.
14. **Data Matrix Execution Flow**: The compiler loops through Data Matrix iterations for a scenario, defaulting to a single run if the matrix is empty. A `{key}` a step references resolves in one of three ways, and there is no fourth: **present with a value** → used; **present but explicitly blank (`""`)** → the blank is used verbatim, because an empty string is a deliberate negative-validation input (A0.8.4), not missing data; **absent from both the Data Matrix row and the Excel step Data** → `interpolate()` throws and the compile fails loudly (A0.5.4), rather than filling the field blank and producing a green run that tested nothing. *(Superseded wording: this rule previously said steps with empty test data are "skipped rather than executed with blank values." No per-step skip logic ever existed — `grep -c skip core/compiler.js` → 0 — and implementing it literally would break the explicit-blank override A0.8.4 exists to protect. The two real failure states, absent and blank, are each handled above and each covered by `tests/interpolate_strict_test.js`.)*
15. **Clean Staged Files**: Temporary recording artifacts (`core/replay_*.spec.ts`, codegen output, local traces) must be deleted after use or `.gitignore`d — never committed. (See `.gitignore`'s `core/replay_*` patterns; keep them path-scoped to `core/`, not bare `replay_*`, or they'll silently exclude unrelated files elsewhere in the repo, e.g. `tests/replay_mapping_test.js`.)
16. **CDP-Attach Recording Uses AutoTest's Isolated Stable-Chrome Profile** (Phase B, `core/cdp_session.js`): `/record` attaches over the Chrome DevTools Protocol to a dedicated stable-Chrome profile named `autotest`, stored under the relocated writable state directory (`<stateDir>/autotest`). The default server and Electron paths never touch the tester's normal Chrome profile, SSO session, history, or other tabs. `AUTOTEST_CHROME_PATH` may point to a non-standard stable Chrome executable via `.env`/the process environment; Beta/Canary/Edge are out of scope. `AUTOTEST_CDP_PROFILE=real` is a controlled developer-only opt-out, not the packaged product behavior. The app has no profile reset/delete capability. The debug-Chrome process is **never** added to `trackedProcesses` and is `.unref()`'d, so `cleanupAll()` cannot kill it; `/record-cancel` stops the recorder and leaves the isolated browser open.

---

## 2.1 Change Log Requirement

Every code, configuration, documentation, or dependency change MUST update
`BRAIN/CHANGE-LOG.md` in the same change. Each entry must include the date,
the affected files, a concise description, and validation status. Do not
rewrite or delete prior entries; append the newest entry at the top.

## 3. Multi-Agent Orchestration Strategy
If further expansion is requested, deploy these specialized agent personas:

### 1. The Zero-Trust QA Agent
**Role:** Adversarial Attacker & Static Analyzer
- **Directives:** 
  - Assume the application is fundamentally broken.
  - Perform static code analysis on `server.js` and `compiler.js` for unhandled promise rejections, race conditions, or orphaned node processes.
  - Verify Playwright UI state via headless E2E tests.
  - *Must output findings strictly to `defect.md`.*

### 2. The Lead AutoTest Developer
**Role:** Executor & Architect
- **Directives:**
  - Ingests `defect.md` from the QA Agent and executes fixes linearly.
  - Never hallucinates new libraries; operates strictly within local bundled dependencies.
  - Writes integration tests (like `human_workflow_test.js`) to verify their own work before reporting completion.

### 3. The PM Compliance Auditor
**Role:** Vision Enforcer
- **Directives:**
  - Audits `RUN_GUIDE.md` and the Studio UI to ensure non-technical manual testers will not be confused.
  - Verifies that visual design (CSS) adheres to premium, modern enterprise standards.
  - Ensures the "Air-Gapped" vision is never compromised by unauthorized packages.

### 4. The Black-Box Scenario Tester
**Role:** Independent QA — Runtime Verification Only
**Agent definition:** [.claude/agents/blackbox-tester.md](.claude/agents/blackbox-tester.md)

Distinct from the Zero-Trust QA Agent (#1, which does *static* code analysis). This agent never reads `studio/server.js`, `core/*.js`, or `studio/studio-ui.html` to judge correctness — it only runs the live app and observes real behavior. It does not develop and does not fix; a tester who can also patch the code under test stops being independent.

**Mandatory loop, run on every developer change to `studio/server.js`, `core/*.js`, or `studio/studio-ui.html`:**

```
1. Developer targets a change (a feature, a fix, a refactor).
2. Developer implements it, states what changed and which routes/files it touches.
3. Black-Box Scenario Tester is assigned exactly that scope — nothing more, nothing
   assumed — and runs the affected rows from TEST_SCENARIOS.md plus one level of
   adjacent probing (see agent definition) against the real running server.
4. Tester writes an honest, evidence-backed report to TEST_RESULTS.md: every FAIL
   includes the literal request, the literal response, and what the catalog says
   should have happened instead.
5. If any defect is found: developer fixes it, tester re-runs the SAME scope from
   step 3 (not just the fixed row — regressions elsewhere are common).
6. Loop 3-5 until the tester reports zero defects for that change's full scope.
```

This loop does not end until every row in `TEST_SCENARIOS.md` that the current work touches is a confirmed PASS — not "probably fine," not "should work now." **Mobile/Appium scenarios are explicitly excluded from this loop for the current phase** (see §4 Known Gaps) — the tester skips them rather than reporting them blocked or failing.

**Ground truth for both roles in this loop:**
- [TEST_SCENARIOS.md](TEST_SCENARIOS.md) — the scenario catalog; every row is a contract.
- [FUTURE_ARCHITECTURE.md](FUTURE_ARCHITECTURE.md) §A0.5–A0.7 — 20 confirmed defects from doubt-driven review (security, data-integrity, UI, and reporting bugs — mobile-specific ones excluded per the above). Any change touching these areas must have its specific defect re-verified as fixed, not assumed fixed because the diff looks right.

---

## 4. Current State Checklist

Truthful snapshot as of the last working session. See `TEST_SCENARIOS.md` / `TEST_RESULTS.md` for the full scenario matrix and live QA pass.

**Implemented and verified live:**
- [x] Excel upload -> blueprint parse -> scenario/step scan (`/scan`)
- [x] Manual and Record (codegen) mapping, AST-parsed via Acorn, per-scenario `{key}` parameterization
- [x] Action Library: reusable actions, action groups (chains), synonym resolution, fallback used consistently across `/scan`, `/record`, `/preview`, and `core/compiler.js`
- [x] Preceding-steps replay-before-pause for mid-flow re-mapping — bug fixed (Library-resolved steps were silently dropped from the replay; regression test in `tests/replay_mapping_test.js`)
- [x] Shared-mapping literal tokenization — bug fixed (codegen always records a literal value, never a `{key}` placeholder, so a `Mapping_Key` reused across scenarios with different Data silently replayed whichever literal was recorded first; regression test in `tests/tokenize_literal_test.js`)
- [x] Web compilation/execution: Playwright Test spec, headed/headless toggle, worker count, results dashboard with screenshots + traces, custom `/results` directory index
- [x] Mobile compilation path: `core/executed.mobile.js` emits a plain async script (not Mocha) run directly with `node`, matching what `webdriverio` expects
- [x] Action Library drag-and-drop sidebar on the Mappings tab + inline "save mapping to Library" from the Record/Manual modal

**Known gaps / not yet done:**
- [ ] Mobile/Appium path has never been run against a real device or emulator with a live Appium server — only verified up to the point where it correctly errors on a missing Appium connection (environmental limitation of this dev machine, not a known code defect)
- [ ] No automated regression test exercises the drag gesture itself end-to-end — Playwright's own `dragTo()` automation is unreliable against custom HTML5 drag-and-drop (confirmed during testing: it fires drops on the wrong element). The underlying link function and the DOM event wiring are both verified independently (via direct call and manual `DragEvent` dispatch), but a real human mouse drag is the only thing that exercises the full gesture
- [ ] `core/action_db.js`'s read-modify-write on `action_database.json` has no file lock — a low-priority race only observed under rapid concurrent `/link-synonym` calls (an artifact of automated test tooling), not realistic single-tester usage
- [ ] Distribution is still "clone the repo, ensure `DRIVERS/` and `node_modules/` are present, run `node studio/server.js` manually and keep a terminal open" — not a single-artifact app a non-technical tester can just double-click. See HANDOFF below.

---

## 5. HANDOFF: Towards a Fully Air-Gapped Electron Build

**Why:** The current "air-gapped" story means *no outbound network calls* — it does not yet mean *zero install*. A target machine still needs Node, the bundled `DRIVERS/` and `node_modules/` already in place, and a manually-started server kept alive in a terminal. A true zero-install deliverable for a locked-down corporate machine is a single app the tester double-clicks, with no terminal and no separate browser tab to manage.

**Rough shape of the change** (directional, not a committed design):
- Keep `studio/server.js` and `studio/studio-ui.html` unchanged as the "backend" — wrap them, don't rewrite them. An Electron main process spawns the existing Express server on a local port and opens a `BrowserWindow` pointed at it, replacing "open Chrome to `localhost:3000`" with "double-click the app."
- Bundle `DRIVERS/` (Playwright's browsers and vendored `node_modules`) inside the Electron app's resources directory, so the packaged app is the only thing that needs to exist on the target machine.
- The app's own separate headed Chromium spawned for codegen/replay/Inspector sessions is already just a child process launched by `server.js` — that pattern doesn't need to change under Electron.

**Open risks to resolve before committing to this:**
- Code-signing / notarization requirements for distributing an unsigned Electron app inside a locked-down corporate environment.
- Total bundle size — an Electron shell ships its own Chromium alongside Playwright's already-bundled one, which may roughly double the "browser" footprint.
- Whether the target environment's lockdown policy blocks Electron apps the same way it blocks `npx`/unmanaged Node installs — this needs to be confirmed with the actual IT/security team before investing in the migration.
