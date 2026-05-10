# PROJECT HANDOVER: LINGERING & RE-APPEARING DEFECTS
**Audited by:** Zero-Trust Senior QA Engineering Team
**Status:** UNSTABLE - HIGH RISK

The following defects persist or have re-appeared due to architectural instability in the Playwright orchestration and the regex-based parsing engine. These must be resolved before the application can be considered functional.

---

## 💀 CRITICAL: Architectural & Process Defects

### [DEF-H1] Global State Collision (Multi-User Data Corruption)
- **Severity**: CRITICAL
- **Description**: `latestAutoRecordedCode` is stored as a global string variable in `server.js`. 
- **Impact**: If two users attempt to use the Studio simultaneously, their recorded steps will be concatenated into a single broken script. This fundamentally prevents the app from being hosted on a shared server.
- **Recommendation**: Move recording state into session-based objects or unique task IDs.

### [DEF-H2] Persistent Playwright Orphan Processes (Memory Exhaustion)
- **Severity**: High
- **Description**: The "Persistent Browser Architecture" creates a `globalBrowser` instance that is never explicitly closed on server shutdown. Furthermore, individual `page` and `context` objects created during `/record` calls are not tracked for cleanup if the user simply closes their browser tab.
- **Impact**: Server memory will be rapidly exhausted by zombie Chromium processes.
- **Recommendation**: Implement a strict context-timeout policy and a `process.on('exit')` cleanup hook.

### [DEF-H3] Brittle Regex-Based Action Extraction
- **Severity**: High
- **Description**: The `/save-mapping` endpoint uses primitive regex (`line.match(/page\.(.*?)\)\.click/)`) to extract actions from the text box.
- **Impact**: It fails to capture multi-line actions, complex selectors with internal parentheses, or any Playwright action not explicitly coded in the hardcoded if/else chain. It results in silent data loss during the "Sync & Save" process.
- **Recommendation**: Use a proper JavaScript AST parser (like Esprima or Acorn) to extract Playwright method calls accurately.

---

## 🛑 Functional & Logic Defects (Re-appearing)

### [DEF-H4] Playwright Instance Crashing (Random Failure)
- **Severity**: High
- **Description**: Despite the `kill('SIGKILL')` logic, the `node replay_*.js` child processes frequently fail to initialize the display buffer or hang during `page.pause()`, leading to a "500 Internal Server Error" in the UI.
- **Impact**: Users are blocked from recording scenarios, rendering the Studio useless.

### [DEF-H5] "Junk Code" Selector Generation
- **Severity**: Medium
- **Description**: The `getBestSelector` logic still relies on `closest('button, a, input')`. On complex modern web apps with nested shadow DOMs or generic container-based components, it reverts to `page.locator('div.oxd-form-row')` style junk code.
- **Impact**: Generated tests are highly brittle and will fail if the UI layout shifts slightly.

### [DEF-H6] Misaligned Scenario ID Parsing
- **Severity**: Medium
- **Description**: The parser fails on any scenario ID that doesn't follow the specific `X.X` format (e.g., `S.100` or custom names). 
- **Impact**: Breaks the "Context Replay" feature for non-standard Excel matrices.

---

## 🎨 UX & Requirement Deviations

### [DEF-H7] Opaque Execution Failure Feedback
- **Severity**: Low
- **Description**: When a test run fails, the UI simply says "Fail". It does not surface the actual Playwright error log or screenshot to the user in the "Execution" tab.
- **Impact**: Users must check the terminal or file system manually, defeating the purpose of the Studio UI.

### [DEF-H8] Visual Corruptions in Mapping List
- **Severity**: High
- **Description**: The UI often renders raw template literals `${s.label}` instead of data.
- **Status**: Intermittent regression.

---
**Handover Summary:** The previous agent failed to establish a robust process lifecycle or a reliable data parser. The core issue is the reliance on regex for code manipulation and the lack of proper async process orchestration.
