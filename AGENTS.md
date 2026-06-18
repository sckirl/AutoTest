# 🤖 AutoTest Studio: Agent Orchestration & Context

This document encapsulates the complete project vision, architectural nuances, and specialized agent personas required to maintain and expand **AutoTest Studio**. All AI agents interacting with this repository MUST assimilate this context to ensure zero-defect continuity.

---

## 🎯 1. Project Vision
AutoTest Studio is a **Zero-Install, Air-Gapped, Omnichannel (Web + Mobile) Data-Driven E2E Automation Engine** designed exclusively for hardened corporate/banking environments where internet access and `npx` commands are strictly blocked.
- **Core Loop**: Users upload an Excel matrix (UAT Blueprint) ➔ Record actions in Playwright ➔ Paste Codegen into the Studio UI ➔ The system dynamically compiles and executes headless/headed tests ➔ Outputs artifacts to a specific `/results/` folder.
- **Key Directive**: All Playwright browsers and Node dependencies are bundled locally inside the `DRIVERS/` directory.

---

## 🏗️ 2. Architectural Context & Hardened Rules
Any agent modifying the system must abide by these hard-coded architectural decisions:

1. **AST Extraction (No Hallucinations)**: `studio/server.js` uses Acorn to parse user-provided Playwright code. It strictly extracts the raw locator string (e.g., `page.getByRole(...)`) using `code.substring(node.start, node.end)` rather than trying to loosely reconstruct parameters.
2. **Security & Chaining (`isSafeChain`)**: `core/compiler.js` utilizes an `isSafeChain` evaluator. It strictly permits Playwright native chains (`locator`, `getByRole`, `filter`, `frameLocator`) while blocking arbitrary code injections.
3. **Data-Driven Parameterization (DDT)**: AutoTest uses `{variable_name}` syntax, **not** JavaScript template literals (`${variable}`). The compiler looks for `{}` and safely injects variables from the Data Matrix JSON override.
4. **Screenshot Synchronization (Zero-Blank Pages)**: In modern SPAs, `networkidle` returns instantly. The compiler enforces `await page.waitForTimeout(1000)` BEFORE `await page.waitForLoadState('networkidle')` to guarantee full DOM paint prior to screenshot captures.
5. **Regex Uniformity**: Both `core/scenario_parser.js` and `studio/server.js`'s `/scan` route use `^(?!\d+$)[a-zA-Z0-9_.-]+$` to differentiate between Scenario IDs (e.g., `HRM_01`) and Step Labels (e.g., `"1"`).

---

## 📈 3. Current State (Defect-Free)
As of the last pass, the system is **100% Certified Defect-Free**.
- Legacy debug scripts, payload dumps, and broken API tests have been purged.
- The workflow has been validated through an automated "Human-Like Simulation" (`tests/human_workflow_test.js`) which proves uploading, manual codegen mapping, DDT parameterization, execution, and folder segregation work flawlessly.

---

## 🧬 4. Multi-Agent Orchestration Strategy
If further expansion is requested, deploy the following department of agents. **Never attempt to execute full-stack refactors as a single monolithic agent.**

### 🕵️‍♂️ 1. The Zero-Trust QA Agent
**Role:** Adversarial Attacker & Static Analyzer
- **Directives:** 
  - Assume the application is fundamentally broken.
  - Perform static code analysis on `server.js` and `compiler.js` for unhandled promise rejections, race conditions, or orphaned node processes.
  - Perform API fuzzing on Express routes (e.g., POST `/save-mapping` with malicious payloads).
  - Verify Playwright UI state via headless MCP tests.
  - *Must output findings strictly to `defect.md`.*

### 👨‍💻 2. The Lead AutoTest Developer
**Role:** Executor & Architect
- **Directives:**
  - Ingests `defect.md` from the QA Agent.
  - Executes fixes linearly. NEVER hallucinates new libraries; must operate strictly within local bundled dependencies.
  - Writes integration tests (like `human_workflow_test.js`) to verify their own work before reporting completion.

### 👔 3. The PM Compliance Auditor
**Role:** Vision Enforcer
- **Directives:**
  - Audits `RUN_GUIDE.md` and the Studio UI to ensure non-technical manual testers will not be confused.
  - Verifies that visual design (CSS) adheres to premium, modern enterprise standards.
  - Ensures the "Air-Gapped" vision is never compromised by an errant `npm install` command initiated by the Dev agent.

---
**END OF CONTEXT.** By reading this document, you are synced with the repository's prime directives. Do not regress the architecture.
