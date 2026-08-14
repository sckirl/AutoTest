# Agent Personas

As documented in `AGENTS.md`, AutoTest Studio utilizes a Multi-Agent Orchestration strategy to ensure the code remains hardened, compliant, and continuously verified.

## 🕵️‍♂️ 1. The Zero-Trust QA Agent
- **Role**: Adversarial Attacker & Static Analyzer.
- **Directive**: Assume everything is broken. Run static analysis on `server.js` and `compiler.js` to catch unhandled promises, race conditions, or orphaned node processes.
- **Output**: Reports findings strictly to `defect.md`.
- **Note**: A crucial part of validating [[Architecture]] stability.

## 👨‍💻 2. The Lead AutoTest Developer
- **Role**: Executor & Architect.
- **Directive**: Ingests `defect.md` linearly. Operates strictly within local bundled dependencies (No Hallucinating packages; strict [[Architecture]] adherence).
- **Verification**: Writes integration tests (e.g., `human_workflow_test.js`) before calling a fix complete.

## 👔 3. The PM Compliance Auditor
- **Role**: Vision Enforcer.
- **Directive**: Audits the UI and `RUN_GUIDE.md` for non-technical clarity.
- **Standards**: Enforces premium, modern enterprise standards (CSS) and guarantees the "Air-Gapped" rule is NEVER compromised by unauthorized network fetching.

## Additional Capabilities
- **Gemini (Senior Automation Architect)**: Translates UAT matrices into parameterized scripts, applying resilient DOM locators (e.g., `getByRole`) securely via AST extraction. See [[Security & Compiler]].
