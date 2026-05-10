# Strategic Project Plan: Resolving Mapping Instability & QA Visibility (Revised)

**Prepared by:** Senior PM & Architecture Team
**Date:** May 10, 2026
**Status:** APPROVED FOR TRACK START — ARCHITECTURE ROLLOUT PENDING TRACK D




## 1. Executive Summary
The AutoTest mapping process currently suffers from JS injection fragility, unmanaged child processes, and the "Playwright-in-Playwright" inception problem which leaves QA agents blind. This revised plan mandates a parallelized execution strategy, a critical shift to a "Shared Browser via CDP/WebSocket" architecture, and strictly defined HTTP assertion endpoints to ensure zero-defect stability.

## 2. Architecture Decision: Attach to Existing Browser (PENDING VALIDATION)
**Verdict: Attach to an existing browser instance instead of spawning new ones.**
Spawning new browsers causes zombie processes, memory leaks, and the QA blind-spot. 
- **Chrome Implementation:** Launch Chrome externally with `--remote-debugging-port=<DYNAMIC_PORT> --no-first-run --no-default-browser-check`. The AutoTest server and QA MCP will both connect via `playwright.chromium.connectOverCDP('http://localhost:<DYNAMIC_PORT>')`.
- **Firefox Implementation:** AutoTest server calls `playwright.firefox.launchServer()`. The returned `wsEndpoint` is exposed via a new `/browser/ws-endpoint` route. QA MCP connects via `playwright.firefox.connect(wsEndpoint)`.
- **Coordination:** Expose a `/browser/attach` endpoint accepting `{ browser: 'chrome' | 'firefox', port?: number }` to programmatically confirm the active browser and endpoint for QA agents. 
  - *Error Contract:* If Chrome is not running with the debug port open, or the Firefox server has crashed, the endpoint must return a 503 status code with a standardized JSON error schema: `{ "status": "unavailable" | "restarting", "error": "<detailed reason>" }` to allow for reliable QA assertions.

## 3. Parallel Execution Tracks (Immediate Action)
These tracks run concurrently from Day 1 to eliminate idle time and ensure speed without sacrificing integrity.

**Track A (Dev): Core Backend Stability**
- Implement structured logging.
- Build the `/record/status` REST endpoint returning structured JSON (session state, error codes, selector output, process health) for reliable QA assertions.
- Implement strict process lifecycle management (e.g., job queue enforcing single-session recording, explicit kill hooks on session end).
- Implement dynamic port allocation with a fallback range for Chrome CDP, plus a startup check that confirms the port is free before attempting connection.
- Implement a health check on the Firefox server process with automatic restart.
- Update the `/browser/attach` response to include a `status` field that distinguishes between `connected`, `restarting`, and `unavailable`.
- *SIT Gate (Dev-Owned):* Dev must run 100 consecutive API calls against `/record/status` with zero zombie processes, confirm dynamic port allocation resolves without collision across a minimum of 5 port conflict simulations, confirm Firefox auto-restart completes and the `/browser/attach` status field returns `restarting` then `connected` correctly, and confirm the 503 error contract fires on both Chrome unavailable and Firefox crash scenarios. All SIT results must be committed to a `sit-results/track-a.json` log file in the repo before QA is notified.
- *QA Extensive Testing Gate (QA-Owned):* QA agents assert against `/record/status` across all session states including error and edge cases, run a full regression of the Manual Map modal path against the new backend, validate the `/browser/attach` error contract returns correct status codes and schema on all failure modes, and confirm no endpoint returns an unstructured error under any tested condition. Coverage must hit all defined routes, all three status states, and all error contract paths before UAT is opened.

**Track B (Dev): Recording Engine Replacement Spike**
- Spike on the correct recording mechanism replacement: validate CDP-level input event interception directly OR use `@playwright/recorder` internals.
- *Risk Flag:* `@playwright/recorder` internals are a non-public, undocumented, and highly unstable API that can break on any minor version bump. The spike must validate not just that it works today, but that its interface is stable enough to justify the permanent maintenance cost.
- Time-box: 3 days.
- *Fallback Path:* If both CDP-level interception and recorder internals return a no-go, the spike memo must name the fallback approach: accelerating Phase 4 (Chrome Extension) to immediate priority.
- *SIT Gate (Dev-Owned):* The spike memo is not sufficient alone. If a go decision is made, Dev must produce a minimal working integration in a sandbox environment and run it through 10 recording cycles with zero crashes before the memo is marked complete and handed to QA. If no-go, the fallback memo triggers Phase 4 acceleration with no SIT required from Track B.

**Track C (QA): Unblock Testing**
- Immediately rewrite existing test scripts to exclusively use the Manual Map modal path.
- Stop touching the `/record` endpoint until Track A and D are complete.
- *UAT Entry Gate:* Three consecutive clean runs of the Manual Map path is the floor. QA must also cover negative paths: invalid selector input, empty mapping payload, and server timeout during save. UAT is only opened after Track C passes AND Track A's QA Extensive Testing Gate passes. Both must be green simultaneously.

**Track D (Architect): CDP Attachment Validation Spike**
- Validate CDP attachment feasibility (does Playwright MCP support `connectOverCDP`?).
- Time-box: 2 days (1 engineer).
- *Definition of Done:* 
  1. Hard technical answer on MCP CDP capabilities, which acts as a hard gate for scheduling the Shared Browser architecture rollout.
  2. A named ownership assignment identifying which team writes the QA agent's connection logic to the shared browser endpoint once CDP is confirmed.

## 4. Long-Term Architecture
**Phase 4: Chrome Extension Approach**
- Move recording logic out of the backend into a lightweight Chrome Extension. The extension records actions natively and sends JSON payloads to `localhost:3000/save-mapping`.
- This can be scoped and estimated in parallel without blocking Tracks A-D.
- *Definition of Done:* Extension POC successfully posts a valid mapped step to the server API, completely decoupling the AutoTest server from browser lifecycle management.

## 5. Phase Gates and Handoff Protocol
To ensure rigorous quality control and prevent premature handoffs, the following phase gates are strictly enforced:

- **SIT is Strictly Dev-Owned:** No QA agent touches any Track A or Track B output until the SIT gate for that track is formally logged and committed to the repository. Dev signals SIT completion by updating a `sit-results/` directory with a timestamped JSON result file per track.
- **QA Extensive Testing:** Begins immediately after SIT gates pass. QA owns this phase fully. Dev is in support mode only during this phase, available for bug fixes but not driving testing scope. QA extensive testing covers all happy paths, all error contract paths, all edge cases, and full regression of the Manual Map suite.
- **UAT Acceptance Gate:** UAT opens only when both of the following are true simultaneously: Track C Definition of Done is met, and Track A QA Extensive Testing Gate is met. UAT is stakeholder and PM sign-off that the system meets the original business requirement of zero blind spots for QA agents and zero zombie processes from the recording engine. 
  - UAT is *not* a testing phase, it is a formal acceptance decision. No new bugs are investigated during UAT. 
  - Any blocker found during UAT triggers an immediate return to QA Extensive Testing, not a hotfix bypass.