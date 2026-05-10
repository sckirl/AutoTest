# PROJECT OPERATIONAL GUIDELINES — THE ZERO-TRUST CONSTITUTION
Version: 2.0 | Last Updated: May 10, 2026
Status: MANDATORY COMPLIANCE

---

## SECTION 1: CORE PHILOSOPHY
This project operates under a **Zero-Trust Religion**. Assume every component is broken, every fix is a temporary patch, and every input is a potential exploit. Our goal is not development speed; it is **Maximum Competency and Industrial Stability**.

---

## SECTION 2: ARCHITECTURAL DECREES

### Decree 1: Persistent Shared Browser Context
Spawning new browsers per request is forbidden. It causes zombie processes and the QA blind-spot.
- **Mandate**: Use `connectOverCDP` or `launchServer()`.
- **Implementation**: The server holds a persistent context. Recording happens in **New Tabs** within that single window.

### Decree 2: Impenetrable RCE Shield
All string-based targets (locators) from user input must pass the **Character Whitelist Filter**.
- **Rule**: Allow alphanumeric, spaces, and basic CSS/Playwright symbols (`:`, `{`, `}`, `,`).
- **Reject**: Any mathematical operators, ternary blocks, logical operators (`||`, `&&`), or keywords (`require`, `eval`, `process`, `global`, `constructor`).

### Decree 3: Atomic Concurrency
The `/run` endpoint must use a synchronous memory lock.
- **Rule**: Check for `activeRun` and set the lock on the same tick. Do not allow async gaps where two requests can both pass the "idle" check.

### Decree 4: UI Resilience
The application must be a functional SPA (Single Page Application).
- **Tabs**: Studio, Mappings, and Execution must persist state across refreshes.
- **Transition**: Uploading a file must automatically push the UI state to the Mappings view.

---

## SECTION 3: TESTING & HANDOFF GATES

### SIT (System Integration Testing) - Dev Owned
- **Requirement**: Dev must commit a JSON result file to `sit-results/` before handing over any feature.
- **Benchmark**: 100 consecutive successful API calls and 100% coverage of negative/error paths.

### QA Audit - Zero-Trust Owned
- **Requirement**: Rigorous dynamic exploitation and headed Playwright simulations.
- **Defect Logging**: Every discrepancy between the Master Plan and the software must be logged in `defect.md` using the standard template.

### UAT Acceptance - Stakeholder Owned
- **Requirement**: Formal acceptance decision. No testing happens in UAT. 
- **Gate**: UAT only opens if Track C and Track A gates are both Green simultaneously.

---

## SECTION 4: PM AGENT KNOWLEDGE LOG

### POSITIVES — PATTERNS THAT WORKED
P-001 | Root cause analysis framed in two clear questions (why does it crash, why is QA blind).
P-002 | Chrome Extension for long-term browser decoupling.
P-003 | Parallelizing Dev, QA, and Architect tracks from Day 1.
P-004 | Hardening RCE via character whitelisting rather than simple keyword blacklisting.
P-005 | Using a persistent `.last_run_status` file to survive tab refreshes.

### NEVER-REPEAT — CONFIRMED ANTI-PATTERNS
NR-001 | NEVER include theoretical phases. Use time-boxed spikes.
NR-002 | NEVER assume structured stdout from interactive tools like `codegen`.
NR-003 | NEVER use file-tailing for QA assertions. Use structured JSON endpoints.
NR-004 | NEVER fix symptoms while leaving unmanaged process causes (Zombies).
NR-005 | NEVER spawn secondary browsers when CDP attachment is possible.
NR-006 | NEVER write a phase without a measurable Definition of Done.
NR-007 | NEVER approve rollouts before critical dependency spikes (Track D) clear.
NR-008 | NEVER hardcode ports without dynamic allocation fallbacks.
NR-009 | NEVER propose solutions without a defined Error Contract.
NR-010 | NEVER define success as "runs green." Use metrics (e.g., zero flaky retries across 3 runs).
NR-011 | NEVER allow Playwright boilerplate (imports/test wrappers) to break the parser. Implement filters.

---

## SECTION 5: DECISION QUICK-REFERENCE (ZERO-TRUST CHECKLIST)
1. Does it spawn a new process? -> **REJECT** (Use shared context).
2. Is the assertion log-based? -> **REJECT** (Use JSON status endpoint).
3. Is a port hardcoded? -> **REJECT** (Use dynamic range).
4. Is it a "Theoretical" fix? -> **REJECT** (Convert to Spike).
5. Does it lack an Error Contract? -> **REJECT** (Define 503/409/400 responses).
6. Are template literals unescaped? -> **REJECT** (Ensure UI rendering integrity).
7. Is the RCE shield regex-only? -> **REJECT** (Use strict character whitelist).
