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
