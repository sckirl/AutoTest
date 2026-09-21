# Architecture

AutoTest Studio's architecture is fundamentally built on an **Air-Gapped, Zero-Install** philosophy, reflecting a highly disciplined, "Ponytail-compliant" minimalist engineering approach.

## Key Components
- **Backend Orchestrator**: Node.js & Express.js. Serves the API and static files without complex bundling.
- **Automation Engine**: Playwright & Playwright Test Runner.
- **Frontend**: Vanilla HTML/JS/CSS. **No build step required** (No Webpack, Vite, or React). Maximizes offline portability and eliminates frontend bloat.
- **Data Processor**: `xlsx` library for hierarchical parsing of complex UAT documents.

## The "Air-Gapped" Paradigm
To operate in strict banking environments where `npx` and `npm install` are blocked:
- All Node modules and Chromium driver binaries are bundled directly within the `DRIVERS/` directory.
- The `compiler.js` script overrides `process.env.NODE_PATH` and modifies `module.paths` to forcefully resolve dependencies locally from `DRIVERS/node_modules`.

## Minimalist Edge (Ponytail Philosophy)
By relying on Vanilla UI elements and completely circumventing external package managers at runtime, the application achieves a **0-dependency operational state**. 
If you need to understand how tests are generated dynamically, see [[Security & Compiler]].
To understand how test matrices interact with the system, see [[Workflow & Execution]].
