# AutoTest Studio: Zero-Trust Orchestration Guide

AutoTest Studio is a **Zero-Install, Air-Gapped, Data-Driven Playwright Engine** built specifically for hardened corporate and banking environments. It completely decouples Playwright logic from UAT Excel matrices, allowing manual testers to build dynamic test suites entirely from the UI without writing code.

---

## Step 1: Environment & Setup (Zero-Install)
This engine requires **NO** internet access and **NO** `npx` execution. Everything is self-contained.

1. **Prerequisites**: Ensure you have `Node.js` installed. 
2. **Local Drivers**: Playwright dependencies and Chromium binaries are bundled in the `DRIVERS/` directory. The system automatically routes execution through these internal binaries.
3. **Start the Studio Server**:
   ```bash
   # From the project root
   node studio/server.js
   ```
   *You should see `FOUND bundled Chromium` in the terminal logs.*
4. **Access the Application**: Open your browser and navigate to `http://localhost:3000`.

---

## Step 2: The E2E Workflow (Human Usage Guide)

### 1. Uploading the Blueprint (UAT Matrix)
- Prepare your UAT Excel file (e.g., `DPR TEMPLATE.xlsx` or `orangehrm_blueprint.xlsx`). The parser supports hierarchical flows (e.g., Scenario A.1, A.2) and will dynamically find "Scenario ID", "Step Label", and "Test Data" headers.
- Drag and drop your Excel file into the **"Upload Matrix"** dropzone in the UI. 
- The system will automatically scan the file, generate a unified `blueprint.json`, and navigate you to the **Mappings** tab.

### 2. Mapping Steps (AutoTest Chrome Recorder)
For every unique step found in your Excel file, you must map it to Playwright actions:
- Click the **"Record"** button next to an unmapped step. AutoTest opens visible Playwright Chrome with the separate `autotest` profile. Your normal Chrome profile is not used.
- Perform the action in the AutoTest Chrome window. You do not need to close your normal Chrome.
- For a new recording, AutoTest shows generated actions as a **live preview** while you work. Finish and close the recorder to finalize the capture and enable **Sync & Save Action**. If you edit the box while recording, your edits stay and the live/final source appears in a separate expandable section.
- For replay-before-recording, follow the modal’s manual-copy instructions. Automatic export for this mode remains an open engineering gate.
- Default recording prefers the bundled Playwright browser, with stable Chrome as fallback. `AUTOTEST_CHROME_PATH` configures the optional CDP path.
- **Parameterization (DDT)**: If the step requires dynamic variables from the Excel's "Test Data" column, replace literal values with `{variable_name}` syntax (e.g., `fill('{username}')`).
- Click **"Sync & Save Action"**. The step will turn blue. The system's AST engine securely extracts and validates your target commands automatically.

### 3. Configuring Data Matrix
- Navigate to the **Data Matrix** tab. The UI will automatically pull dynamic `{variables}` from your mapped scripts and map them to scenarios that use those steps.
- Ensure the data injected from your Excel matrix overrides is populated properly. You can modify runtime data here.

### 4. Test Execution
- Navigate to the **Execution** tab.
- Click **"Execute Test Scenarios"**. 
- The Compiler dynamically stitches your Playwright mappings with the Data Matrix payloads to create transient test scripts, which are routed to the bundled Playwright test runner.
- **Auto-Healing**: The engine safely extracts targets to ensure execution won't break if Playwright wrapped the locator awkwardly, and dynamically waits for `networkidle` paint-states to prevent white, blank screenshots.

---

## Step 3: Audit & Evidence
Once the test finishes, verification artifacts are stored natively for auditors.

- **Check the `results/` folder.** Every scenario (e.g., `HRM_01/`) gets its own isolated directory.
- **Evidence Images**: Inside, you'll find perfect `STEP_X.png` images for each action, and `FINAL.png` for the completion state. Locators clicked are marked with a red target box.
- **Playwright Traces**: Open the `trace.zip` in [trace.playwright.dev](https://trace.playwright.dev) for a full DOM snapshot reconstruction.

---

## Step 4: Resetting the System
When moving to a completely new project, click the **"Reset System"** button on the top right of the application. This securely wipes:
1. All generated scripts.
2. The `mappings.json` library.
3. The `blueprint.json` cache.
4. Old uploaded Excel configurations.
