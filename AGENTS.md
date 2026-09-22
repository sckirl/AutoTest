# AutoTest Studio: Agent Orchestration & Context

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
14. **Data Matrix Execution Flow**: The compiler loops through Data Matrix iterations for a scenario, defaulting to a single run if the matrix is empty. Steps with empty test data (or explicitly bypassed by scenario logic) are skipped rather than executed with blank values.
15. **Clean Staged Files**: Temporary recording artifacts (`core/replay_*.spec.ts`, codegen output, local traces) must be deleted after use or `.gitignore`d — never committed. (See `.gitignore`'s `core/replay_*` patterns; keep them path-scoped to `core/`, not bare `replay_*`, or they'll silently exclude unrelated files elsewhere in the repo, e.g. `tests/replay_mapping_test.js`.)

---

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
