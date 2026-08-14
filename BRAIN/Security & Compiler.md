# Security & Compiler

The compilation engine (`core/compiler.js`) generates transient, secure Playwright test scripts entirely in memory based on UI JSON mappings. This is a critical component for ensuring the platform is not vulnerable to malicious script injections.

## AST Extraction (No Hallucinations)
- `studio/server.js` uses Acorn to parse user-provided Playwright code.
- It strictly extracts the raw locator string (e.g., `page.getByRole(...)`) using `code.substring(node.start, node.end)`.
- **Why**: This prevents reconstructed parameter hallucination that often occurs with generative AI or naive regex extraction.

## Security & Chaining (`isSafeChain`)
- The compiler leverages `isSafeChain` to securely evaluate target actions.
- It strictly permits Playwright native chains (`locator`, `getByRole`, `filter`, `frameLocator`).
- It aggressively blocks arbitrary code injections (e.g., `require`, `eval`, `process`, `window`).

## Verification & Resilient Load States
- **Negative Testing**: The AST unpacks `expect(locator).toBeVisible()` and `toHaveText()`, extracting the locator payload.
- **Navigation Resiliency**: `page.goto` calls should resolve naturally instead of waiting for `networkidle`.
- **Zero-Blank Screenshots**: The compiler enforces a sequence before screenshots: `await page.waitForTimeout(1000); await page.waitForLoadState('domcontentloaded'); await page.waitForLoadState('networkidle')`. This guarantees the DOM is fully painted, circumventing SPA flakiness.

For how data interacts with these scripts, proceed to [[Data-Driven Parameterization]].
