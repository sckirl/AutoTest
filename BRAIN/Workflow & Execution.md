# Workflow & Execution

The AutoTest Studio lifecycle enables non-technical testers to bridge the gap between UAT definition and automated execution through a 4-step GUI-driven workflow.

## 1. Upload Matrix
Users drag and drop their UAT Excel file into the UI. The server uses `xlsx` to parse the scenarios into a JSON blueprint, establishing the test matrix structure.

## 2. Map Actions (Playwright Inspector)
- Unmapped steps allow the user to click **Record**.
- If recording an intermediate step, the backend compiles a temporary replay script (`core/replay_${sessionId}.spec.ts`) of all *preceding* steps.
- The headless script halts at `await page.pause()`, launching the Playwright Inspector so the user can interact at the exact requisite DOM state.

## 3. Parameterize
- Testers substitute literal values (e.g., `"John"`) with `{username}` strings in the UI.
- The system correlates these with Excel column headers or dynamic variables. See [[Data-Driven Parameterization]].

## 4. Execute & Harvest
- Clicking Execute launches the headless browser in the background.
- Scenarios can execute multiple iterations simultaneously.
- **Results Servability**: Artifacts are automatically written to `/results/Scenario_Name_Iter_X/`. The folder contains:
  - `STEP_X.png`: Visual evidence of every mapped action.
  - `FINAL.png`: The end-state snapshot.
  - `trace.zip`: The complete Playwright DOM trace.
- The `/results/` path acts as a custom static directory index, allowing testers to natively browse and view these artifacts from the UI.

## Clean-State Enforcement
- If no Excel file (`scenario_uploaded.xlsx`) is present at server boot, the system forcefully drops all ghost mappings by resetting `mappings.json` to `{}`.
- All temporary recording artifacts (e.g., the replay scripts) are ignored or deleted to maintain repository hygiene.
