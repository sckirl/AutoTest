# Omnichannel Orchestration

AutoTest Studio inherently supports both **Web (Playwright)** and **Mobile (Appium)** automation testing seamlessly from the exact same UI and blueprint structure.

## Contextual Segregation
- The server maintains an `activePlatform` state (either `web` or `mobile`), set via the `/set-platform` route and persisted in `process.env.AUTOTEST_PLATFORM`.
- **Ponytail Simplicity**: Instead of writing two entirely different compilation engines or managing complex polymorphic object-oriented abstractions, the `compiler.js` simply uses an `isMobile` boolean.
  - If `isMobile`, it injects Appium `webdriverio` boilerplate and translates locators using simple Regex patterns (e.g., converting `getByRole` to Android `//*[@text=...]` XPath).
  - If not, it natively utilizes Playwright syntax.

## Workflow Parity
The manual recording and mapping process for Mobile is fundamentally identical to the Web experience. QA engineers use the same Excel structure and identical `{VariableName}` interpolation logic without needing to learn two separate testing workflows.

See [[Architecture]] for the foundation and [[Workflow & Execution]] for execution logic.
