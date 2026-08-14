# Data-Driven Parameterization

AutoTest relies heavily on Data-Driven Testing (DDT) to scale a single recorded scenario across numerous permutations defined in Excel UAT matrices.

## Variable Interpolation
- Variables are defined in the manual mapping field using curly braces, e.g., `{variable_name}`.
- **CRITICAL**: The system does **not** use JavaScript template literals (`${variable}`).
- The `compiler.js` contains an `interpolate(templateStr, iterData, fallbackObj)` function that locates `{}` variables and injects data safely.

## Resolution Fallback Chain
When a script runs, the compiler resolves the variable `{username}` in the following priority:
1. **Matrix Iteration Data (`iterData`)**: The specific row data defined in the data-matrix override JSON for a given iteration.
2. **Scenario Default Data (`fallbackObj`)**: The original step-level data defined in the Excel document.

## Uniform Routing and Cleaning
Both `scenario_parser.js` and the server routes enforce rigorous regex standardizations (e.g., `^(?!\d+$)[a-zA-Z0-9_.-]+$`) to differentiate Scenario IDs from step logic. When scenarios run, their names are uniformly sanitized (e.g., replacing spaces with underscores) so that output artifacts and logs align perfectly.

To see how end-users execute this parameterization loop, read [[Workflow & Execution]].
