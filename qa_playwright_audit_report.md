# 🔴 QA Audit Report — AutoTest Automation Studio
**Audit Type:** Zero-Trust Adversarial QA  
**Date:** 2026-06-18  
**Auditor:** Lead QA Agent (Automated — Antigravity Orchestrated)  
**Audit Round:** Playwright Agent Audit (API + Static Analysis)  
**Server Under Test:** `http://localhost:3000` (node studio/server.js)  
**Test Fixture:** `demo_blueprint.xlsx`

---

## 📋 Executive Summary

| Metric | Value |
|---|---|
| API Tests Run | 22 |
| API Tests PASSED | 18 |
| API Tests FAILED | 4 |
| Static Defects (Critical) | 1 |
| Static Defects (High) | 4 |
| Static Defects (Medium) | 1 |
| Known Defects Re-Verified | 12 |
| Known Defects Still Open | 3 |
| New Defects Discovered | 5 |

> OVERALL VERDICT: ❌ REJECTED — NOT CERTIFIED FOR PRODUCTION
> 4 API tests failed. 1 CRITICAL and 4 HIGH defects confirmed open.
> The app fails banking-grade zero-tolerance KPIs.

---

## 🧪 Phase 1: API Adversarial Test Results

### Category 1: Core Status Endpoints
| ID | Test | HTTP | Result | Notes |
|---|---|---|---|---|
| T01 | GET /run-status → 200 + idle phase | 200 | PASS | {"phase":"idle"} |
| T02 | GET /env → 200 + platform key | 200 | FAIL | Returns {} — AUTOTEST_PLATFORM env var not set at server startup |

### Category 2: Scan Endpoint
| ID | Test | HTTP | Result | Notes |
|---|---|---|---|---|
| T03 | GET /scan (no excel) → 200 | 200 | PASS | Returns steps from current scenario |

### Category 3: Data Matrix Validation (10 tests)
| ID | Test | HTTP | Result | Notes |
|---|---|---|---|---|
| T04 | GET /data-matrix → 200 JSON | 200 | PASS | Returns {} correctly |
| T05 | POST /data-matrix [ARRAY] → 400 | 400 | PASS | Correctly rejected |
| T06 | POST /data-matrix valid payload → 200 | 200 | PASS | Saved correctly |
| T07 | POST /data-matrix empty object → 200 | 200 | PASS | Cleared correctly |
| T08 | SQL injection payload → stored safely | 200 | PASS | '; DROP TABLE users; -- stored as literal |
| T09 | Shell injection payload → stored safely | 200 | PASS | '; rm -rf /; ' stored as literal |
| T10 | Env var injection → stored as literal | 200 | PASS | ${process.env.SECRET} NOT evaluated |
| T11 | 100KB payload → no crash | 200 | PASS | Server handled gracefully |
| T12 | Non-array value for scenarioId → 400 | 400 | PASS | Properly rejected |

### Category 4: Save Mapping Validation
| ID | Test | HTTP | Result | Notes |
|---|---|---|---|---|
| T13 | Empty label → should 400 | 200 | FAIL | BUG: Accepted "" label — writes {"": {...}} to mappings.json |
| T14 | Null label → should 400 | 200 | FAIL | BUG: Accepted null label — writes {"null": {...}} to mappings.json |
| T15 | RCE code → AST parses safely | 200 | PASS | require('child_process').exec not extracted |
| T16 | XSS in code → empty steps | 200 | PASS | <script> tag → 0 steps, stored as {steps:[]} |

### Category 5: Restart Endpoint
| ID | Test | HTTP | Result | Notes |
|---|---|---|---|---|
| T17 | POST /restart clearMappings:true → 200 | 200 | PASS | Returns {"message":"Reset."} |
| T18 | Restart deletes core/runtime_data.json | file | PASS | File deleted correctly |
| T19 | Restart deletes scenario_uploaded.xlsx | file | PASS | File deleted correctly |

### Category 6: State Guard
| ID | Test | HTTP | Result | Notes |
|---|---|---|---|---|
| T20 | /run-status after restart → idle | 200 | PASS | Clean state |

### Category 7: File System Integrity
| ID | Test | Type | Result | Notes |
|---|---|---|---|---|
| T21 | No orphan replay_* files in root | file | FAIL | 10 orphaned replay scripts found in project root |
| T22 | mappings.json no "" or null key | file | PASS | Clean after restart |

**Orphaned Replay Files (10):**
replay_1778330952361.js, replay_1778331643045.js, replay_1778503427134.js,
replay_1779376931765.js, replay_1779425020640.js, replay_1779431000427.spec.js,
replay_1779670836990.spec.js, replay_1779671400169.spec.js,
replay_1779718383282.spec.js, replay_1779718901467.spec.js

Root Cause: child.on('close') cleanup only fires on normal process exit.
Server kill (SIGKILL/crash) before close event = permanent artifact pollution.
These scripts may contain user credentials and target URLs.

---

## 🔬 Phase 2: Static Code Analysis

### 2.1 server.js (511 lines)

| Check | Finding | Status |
|---|---|---|
| latestAutoRecordedCode global (DEF-H1) | NOT found — removed | RESOLVED |
| trackedProcesses Set (DEF-H2) | Line 25: const trackedProcesses = new Set() | RESOLVED |
| SIGINT handler (DEF-088) | Line 38: process.on('SIGINT', cleanupAll) | RESOLVED |
| SIGTERM handler (DEF-088) | Line 39: process.on('SIGTERM', cleanupAll) | RESOLVED |
| Inactivity timeout (DEF-H2) | Lines 61-67: 10min inactivity closes browser | RESOLVED |
| acorn AST parser (DEF-H3) | Lines 431-476: acorn.parse() + walk.simple() | RESOLVED |
| /save-mapping label validation (DEF-NEW-003) | Lines 321-328: ZERO validation on label | OPEN |
| Concurrency guard on /run (DEF-031) | Lines 342-344: activeRun guard present | RESOLVED |
| /run-cancel endpoint | NOT found — UI has cancelRun() but no backend route | NEW DEFECT |
| /env returns platform key | Returns process.env.AUTOTEST_PLATFORM — only set during /run | MISLEADING |

### 2.2 compiler.js (169 lines)

| Check | Finding | Status |
|---|---|---|
| tracing.start() / tracing.stop() | ZERO instances — complete absence | OPEN (DEF-NEW-004) |
| waitForLoadState('networkidle') before screenshots | Line 149: Present | RESOLVED (DEF-077) |
| waitForTimeout(800) before screenshots | Line 149: Present | RESOLVED (DEF-077) |
| DDT iteration loop | Lines 92-98: Full iteration loop confirmed | RESOLVED (DEF-078) |
| safeGetBy() allowlist | Lines 46-54: allowlist regex + keyword blocklist | PARTIAL (DEF-H5) |
| Safe interpolation via JSON.stringify q() | Line 27: const q = (v) => JSON.stringify(String(v ?? '')) | RESOLVED |
| Mobile translation translateToMobileLocator() | Lines 29-44: Implemented | PRESENT |

### 2.3 executed.spec.ts (63 lines) — Compiled Output

CRITICAL FINDING: Previously entered malicious/sensitive data compiled into spec:

Line 20: page.locator("input").fill("'; rm -rf /; '");    <- shell injection literal
Line 36: page.locator("input").fill("${process.env.SECRET}");  <- env probe literal
Line 52: page.locator("input").fill("AAAA...10KB...AAAA");    <- buffer overflow literal

Assessment: q() function (JSON.stringify) correctly escapes all values.
Strings stored as TypeScript literals — NOT server-executed.
HOWEVER: arbitrary user data flows into generated test code with zero content policy.
Risk: credentials stored in committed executed.spec.ts file.

### 2.4 studio-ui.html — XSS Surface Analysis

CRITICAL FINDING — DEF-H8 CONFIRMED OPEN:

Lines 251-259 (scanSteps function):
  row.innerHTML = `
      <div class="step-label">${s.label} <small>(Flow: ${s.scenarioId})</small></div>
      <button onclick="openRecordModal('${s.label}', '${s.scenarioId}')">
      <button onclick="openManualModal('${s.label}', '${s.scenarioId}')">
  `;

Attack Vector: Excel step label containing:
  '); alert(document.cookie); openRecordModal('
becomes executable JavaScript in the DOM via onclick injection.

This is STORED XSS via Excel upload in a banking environment — CRITICAL severity.

---

## 📋 Phase 3: Known Defect Re-Verification

| DEF ID | Description | Previous Status | Current Status |
|---|---|---|---|
| DEF-H1 | Global latestAutoRecordedCode collision | OPEN | RESOLVED |
| DEF-H2 | Orphan processes / missing signal handlers | OPEN | RESOLVED |
| DEF-H3 | Regex-based action extraction | OPEN | RESOLVED (Acorn AST) |
| DEF-H4 | Replay crash without DRIVERS/ binaries | OPEN | CANNOT TEST (graceful 500 fallback confirmed) |
| DEF-H5 | Junk selector generation | OPEN | PARTIAL (safeGetBy present but bypassable) |
| DEF-H6 | Misaligned Scenario ID parsing | OPEN | STILL OPEN — regex only matches single-letter |
| DEF-H7 | Opaque failure feedback | OPEN | STILL OPEN — UI only gets phase:'failed' |
| DEF-H8 | Visual corruptions / XSS in mappings list | INTERMITTENT | CONFIRMED OPEN — s.label directly in innerHTML |
| DEF-077 | White PNG screenshots | OPEN | RESOLVED — waitForLoadState + waitForTimeout(800) |
| DEF-078 | DDT iteration silently failing | OPEN | RESOLVED — DDT loop confirmed in compiler |
| DEF-079 | Missing platform context indicators | OPEN | PARTIAL — badge exists but /env returns {} |
| DEF-088 | Zombie browser / missing signal handlers | OPEN | RESOLVED |

---

## 🆕 Phase 4: New Defects Discovered

### DEF-NEW-001: HIGH — Injected Data Preserved in Committed Spec (Credential Leak Risk)
- Severity: HIGH
- File: core/executed.spec.ts (lines 20, 36, 52)
- Description: Previously entered test data (${process.env.SECRET}, shell commands, buffer overflows)
  is persisted in committed executed.spec.ts. While not executed server-side, may be committed
  to version control, leaking credentials or sensitive test payloads.
- Recommendation: Add executed.spec.ts to .gitignore. Add git pre-commit hook warning.

### DEF-NEW-002: HIGH — 10 Orphaned Replay Scripts Persist in Root
- Severity: HIGH
- Files: replay_1778330952361.js through replay_1779718901467.spec.js (10 files)
- Description: Recording replay scripts not cleaned up on abnormal server exit.
  Scripts may contain user-supplied base URLs and recorded credential sequences.
- Recommendation: On server startup, glob-delete all replay_*.js and replay_*.spec.js from root.

### DEF-NEW-003: HIGH — /save-mapping Accepts Empty/Null Labels (Silent Corruption)
- Severity: HIGH
- File: studio/server.js lines 321-328
- Description: POST /save-mapping with label:"" or label:null writes {"": {...}} or {"null": {...}}
  to mappings.json — no input validation. Corrupts mapping library silently.
- Reproduction: POST /save-mapping {"label": "", "code": "..."} → HTTP 200 (should be 400)
- Fix: Add: if (!label || typeof label !== 'string' || label.trim() === '')
            return res.status(400).json({ error: 'Label required.' });

### DEF-NEW-004: HIGH — Playwright Tracing NOT Generated (UI Misleads Users)
- Severity: HIGH
- File: core/compiler.js (entire file)
- Description: compiler.js contains ZERO references to tracing.start() or tracing.stop().
  PLAN.md and changes.md both document per-scenario traces should be generated.
  Execution tab UI says "Check your local desktop for the Trace Viewer window" — factually false.
  No .zip trace files are generated in results/.
- Fix: Add tracing.start() before try block and tracing.stop() in finally block in compiled spec.

### DEF-NEW-005: MEDIUM — /run-cancel Endpoint Missing from Backend
- Severity: MEDIUM
- File: studio/server.js (absent)
- Description: UI Cancel button calls POST /run-cancel. Server only has POST /record-cancel (line 505).
  changes.md line 171 states "/run-cancel endpoint exists" — this is INCORRECT.
  Cancel button is non-functional. Clicking it returns 404.
- Fix: Add app.post('/run-cancel', ...) that kills the tracked Playwright process.

---

## 🎨 Phase 5: PM UX Compliance (Static HTML Analysis)

| Element | Present? | Notes |
|---|---|---|
| Header "AUTOMATION STUDIO" | YES | h1 with letter-spacing |
| WEB/MOBILE badge (#env-badge) | YES | Color-coded |
| Platform dropdown (#platform-toggle) | YES | Web + Mobile options |
| Mobile mode visual (mobile-mode class) | YES | Red border CSS |
| File drop zone | YES | Click + drag/drop |
| Base URL input | YES | With localStorage hint |
| Reset button with confirmation | YES | confirm() dialog |
| All 4 tabs (Studio/Mappings/Data Matrix/Execution) | YES | Correct IDs |
| Recording modal + guidance modal | YES | Both present |
| Worker count input (default: 4) | YES | #worker-count |
| Execute button | YES | #run-btn |
| Cancel button (hidden default) | PARTIAL | Present but backend missing |
| Results dashboard | YES | #results-dashboard |
| localStorage persistence | YES | safeStorageGet/Set |
| XSS sanitization in step list | NO | Raw innerHTML with s.label |

### Design Quality
| Criterion | Assessment |
|---|---|
| Typography | Montserrat + Open Sans — professional |
| Color system | CSS variables — banking blue palette |
| Banking aesthetic | Professional, understated |
| Mobile mode differentiation | Partial — red border, barely-visible frame (opacity 0.1) |
| Responsive layout | Fixed 1000px max-width — not mobile-responsive |
| Status message feedback | Color-coded info/success/error |

---

## 📊 Final Verdict

API Tests:         18/22 PASSED (82%)
Static Defects:    5 NEW defects identified
Known DEFs Fixed:  7 out of 12 verified
Known DEFs Open:   3 still unresolved (H6, H7, H8)
CRITICAL Open:     DEF-H8 (XSS via Excel => innerHTML)
HIGH Open:         DEF-NEW-002, DEF-NEW-003, DEF-NEW-004

STATUS: REJECTED — NOT CERTIFIED FOR PRODUCTION

MUST FIX before certification:
  1. DEF-H8:     XSS via Excel step labels in innerHTML onclick
  2. DEF-NEW-003: /save-mapping empty label corruption
  3. DEF-NEW-004: Add Playwright tracing to compiler output
  4. DEF-NEW-005: /run-cancel endpoint missing from backend
  5. DEF-NEW-002: Startup cleanup of orphan replay scripts

Report generated by: Antigravity QA Orchestration Agent
Run against: AutoTest Studio v1.0.0 @ http://localhost:3000
