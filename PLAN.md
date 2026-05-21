# Strategic Project Plan: Accordion Data Matrix (Data-Driven Testing)

**Prepared by:** Elite PM & BA Team
**Date:** May 10, 2026
**Status:** APPROVED FOR PARALLEL EXECUTION
**Philosophy:** Minimal structural changes, zero execution logic changes, 100% Data-Driven Testing (DDT) capability. Strict Zero-Trust on data lifecycle and code generation.

## 1. Executive Summary
To enable true Data-Driven Testing (DDT) without corrupting the source Excel blueprint or introducing brittle runtime data injections, we are implementing the **Accordion Data Matrix**. 

This feature allows QA to manually manage, add, and iterate over data parameters directly within the AutoTest UI using a strict **single-bracket notation** (e.g., `{Username}`). Rather than touching the complex Playwright execution engine, this feature acts purely as an **Override Layer** during the compilation phase, generating multiple standalone test blocks for each data iteration.

## 2. Architectural Design: The Override Layer & Data Lifecycle
**Verdict: Implement UI Data Matrix and Compiler Expansion with Strict State Isolation.**
- **Standardized Notation:** All variable mapping and harvesting will strictly use single-bracket notation: `{VariableName}`. Double brackets or mixed notations are prohibited.
- **Zero Excel Modification:** The original uploaded Excel file remains the immutable blueprint. We never write back to it.
- **Data Storage & Lifecycle:** All user-defined data iterations are saved to a new, isolated local file: `core/runtime_data.json`. 
  - *Zero-Trust Lifecycle Reset:* Because `scenarioId`s (e.g., "A.1") are derived from the Excel content, uploading a new Excel file renders existing IDs stale or misaligned. **Therefore, `POST /upload` and `POST /restart` must explicitly delete `core/runtime_data.json`.** Overrides are strictly scoped to the lifecycle of the currently uploaded blueprint.
- **Compiler Injection:** The Playwright execution engine (`app.post('/run')`) remains **100% untouched**. The only logic change happens in `core/compiler.js`. The compiler will read `runtime_data.json`, and if a scenario has multiple data rows (iterations), it will generate a `for-loop` to spit out multiple, independent `test('Scenario X - Iteration Y', ...)` blocks into the final `executed.spec.ts` file.
- **Parallelism Maintained:** Because the compiler outputs physically separate test blocks, Playwright's native `--workers` flag will automatically execute these data iterations in parallel.

## 3. Parallel Execution Tracks (Immediate Action)
To maintain velocity, these tracks will be executed concurrently.

**Track A (Frontend): Accordion Data Matrix UI**
- Add a new "Data Matrix" tab to the main application interface.
- Implement an auto-harvesting function: When the tab is opened, scan all mapped steps for variables wrapped strictly in single brackets: `{VariableName}`.
- Generate an Accordion UI component for each Scenario (`scenarioId`).
- Inside each accordion, render an editable HTML table where columns = Harvested Variables, and rows = Test Iterations.
- Include "Add Row" and "Remove Row" functionality.
- *SIT Gate (Dev-Owned):* Dev must confirm the UI correctly harvests complex variables without crashing, successfully saves the grid state, and retrieves it upon tab refresh.

**Track B (Backend): State Management APIs & Lifecycle Hooks**
- Create `GET /data-matrix` to serve the current `runtime_data.json` to the frontend.
- Create `POST /data-matrix` to safely overwrite `runtime_data.json` with the new JSON payload from the frontend.
- **Lifecycle Update:** Modify `app.post('/upload')` and `app.post('/restart')` in `studio/server.js` to synchronously delete `core/runtime_data.json` if it exists, preventing stale data contamination.
- Implement strict validation to ensure the JSON payload is structurally sound.
- *SIT Gate (Dev-Owned):* Dev must simulate 50 consecutive save/load operations via API to ensure disk write integrity, and prove that uploading a new file successfully purges the old `runtime_data.json`.

**Track C (Core/Compiler): The Iteration Loop & Safe Interpolation**
- Modify `core/compiler.js` to load `runtime_data.json` alongside the blueprint and mappings.
- For each scenario, check if `runtime_data.json` contains multiple rows for that `scenarioId`.
- If multiple rows exist, wrap the test generation logic in a `for` loop, appending `- Iteration ${index + 1}` to the test title.
- **Safe Interpolation Mandate:** When substituting `{Variable}` with user-provided data from `runtime_data.json` or the Excel fallback, the compiler must **strictly escape** the string to prevent generating syntactically invalid TypeScript (e.g., unescaped quotes in `O'Brien` or template literals).
  - *Implementation:* Use `JSON.stringify(value)` when injecting the string into the generated `.spec.ts` code template to guarantee native JS escaping of all quotes, newlines, and special characters.
  - *Double-Quote Prevention Rule:* If the mapped step template already wraps the `{Variable}` in quotes (e.g., `fill('{Username}')`), the compiler must detect and **strip the surrounding quotes** from the template *before* injecting the `JSON.stringify` output. This ensures `JSON.stringify` provides the *only* set of quotes, preventing invalid outputs like `fill('"O\'Brien"')`.
- *SIT Gate (Dev-Owned):* Dev must compile a scenario containing malicious data values (e.g., `test"value`, `O'Brien`, `line1\nline2`) and verify the output `executed.spec.ts` compiles cleanly and executes without syntax errors.

**Track D (QA): Validation & Regression**
- QA will write specific tests to ensure Data-Driven Testing works end-to-end using single-bracket notation.
- Validate the "Fallback" logic (if a cell in the Data Matrix is empty, it must correctly use the Excel default).
- Validate that deleting all rows in the Data Matrix reverts the scenario back to a single baseline run.
- Validate the Lifecycle Reset: Uploading a new Excel file completely wipes the Data Matrix UI clean.
- *QA Extensive Testing Gate:* QA asserts that the Data Matrix UI persists data across refreshes, handles malicious string inputs without breaking the compiler, and that compiling 5 scenarios with 10 iterations each results in exactly 50 successful test executions in Playwright UI mode.

## 4. Phase Gates and Handoff Protocol
Adhering to the Zero-Trust Constitution:
- **SIT is Strictly Dev-Owned:** No QA agent touches any Track A, B, or C output until the SIT gate for that track is formally logged.
- **QA Extensive Testing:** Begins only after all Dev SIT gates pass. QA owns this phase fully, executing dynamic payloads against the Data Matrix to test for state corruption and compiler syntax breakages.
- **UAT Acceptance Gate:** UAT opens only when Track D passes completely. This confirms the new Data Matrix seamlessly integrates with the existing perfect execution flow without breaking parallel workers or UI tracing.

## 5. Phase 5: Appium Integration & Omnichannel Mapping
**Status:** PENDING CRITICAL BUG FIXES (DEF-077, DEF-078)
Once the core engine is stabilized and all CRITICAL defects are resolved, the AutoTest architecture must expand to support Omnichannel orchestration (Web + Mobile).

**Track E: Appium Mobile Engine**
- **Mobile Execution:** Integrate Appium to mirror the Playwright web mapping experience natively for iOS and Android applications.
- **Unified Blueprint:** The existing Excel blueprint format will be leveraged for both Web and Mobile. The engine will intelligently route `.click()` or `.fill()` actions to either the Playwright context or the Appium context based on the target specification.
- **Workflow Parity:** The manual recording and mapping process for Mobile must be fundamentally identical to the Web experience, ensuring QA engineers do not need to learn two different workflows.

**Track F: Contextual Visual Indicators (Web vs. Mobile)**
- **Explicit Context Badges:** The AutoTest UI will be updated to display persistent, unmistakable visual indicators declaring the active testing context (e.g., a "MOBILE" badge with device icons vs. a "WEB" badge with browser icons).
- **Zero Ambiguity Mandate:** The user must NEVER have to guess whether they are mapping for a mobile application or a website. This context must be explicitly requested when generating the scenario and visually enforced throughout the Studio, Mappings, Data Matrix, and Execution tabs.