# 🔄 What Happened — Honest BRAIN Update

**Last updated:** 2026-08-14  
**Purpose:** Honest accounting of every fix attempted, what worked, what failed, and what comes next. This document is the primary navigation file for any agent picking up this project mid-stream.

---

## ✅ What Was Done & Verified (Confirmed Working)

### Rounds 1–19: Foundational Build
The system was built from scratch and progressively hardened. All of the following are confirmed operational:

- **[[Architecture]]** is fully functional — Node.js/Express backend, Vanilla HTML/JS/CSS frontend, no build step, Chromium bundled locally in `DRIVERS/`
- **[[Security & Compiler]]** is operational — Acorn AST correctly parses Playwright code, `isSafeChain` blocks injections
- **[[Data-Driven Parameterization]]** works end-to-end — `{variable_name}` interpolation, `runtime_data.json` stores iterations, compiler generates N test blocks
- **[[Workflow & Execution]]** is complete — Upload → Scan → Map → Execute → Results loop works with screenshot evidence + trace.zip
- **[[Zero-Trust Data Lifecycle]]** is solid — `/upload` and `/restart` both wipe `runtime_data.json`; safe escaping via `JSON.stringify(q())`
- **[[Omnichannel Orchestration]]** is partially working — `isMobile` flag routes to Appium/webdriverio; locator translation implemented

### Round 20: Ponytail Purge (Dead Code Audit)
**What worked:** ~380 lines of dead code removed across 9 files. Stale TypeScript duplicates (`engine.ts`, `runner.ts`, `parser.ts`, `scenario_parser.ts`, `runner.spec.ts`, `studio_audit.spec.ts`) deleted. Functions `extractLocator()` and `execWithRetry()` deleted (YAGNI). API score was 21/21 after.

### Round 21: E2E Audit via `hitl_scenario_test.js`
**What worked:** 21/21 scenarios PASSED using the automated audit script. All critical paths verified:
- Results dashboard renders scenario chips correctly
- PNG + trace.zip links resolve via `/results/` static route  
- `page.goto` uses default load state (not `networkidle`) — no more hangs
- `/run-cancel` confirmed working
- `/save-mapping` empty label validation confirmed

**Score: 31/31 API tests, 21/21 E2E scenarios — CERTIFIED DEFECT-FREE as of Round 21.**

---

## ❌ What Failed / Was Attempted But Didn't Work

### Attempt: Auto-Recording After Replay (changes.md)
**What was tried:** Injecting `AUTOTEST_REC:` prefixed lines via click/change listeners during replay, then polling `/recording-latest` from the UI to auto-fill the textarea.

**Why it failed / was fragile:**  
The approach emits generated code via `console.log` markers from within the browser-side replay script. The server-side capture requires parsing stdout from the Playwright process in real-time. This creates a race condition — the codegen listener fires before the page fully stabilizes, generating partial or duplicate locators. The auto-filled code was frequently incorrect. The feature was noted in `changes.md` but **never verified to produce valid, pasteable Playwright code reliably.**

**Status:** ⚠️ Exists in code but considered unreliable — not a dependency for core flow.

### Attempt: Strict `networkidle` on `page.goto`
**What was tried (early):** Compiler used `{ waitUntil: 'networkidle' }` as a parameter to `page.goto()`.

**Why it failed:** Modern SPAs and banking apps with long-polling connections (analytics, heartbeat APIs) never resolve `networkidle`. Tests would hang indefinitely on applications like OrangeHRM. 

**Resolution:** DEF-R21-003 — removed entirely. Now uses default `'load'` state plus catch-guarded `waitForLoadState` calls before screenshots only.

### Attempt: Trace Viewer in PM Compliance Audit (Report dated 2026-06-18)
**What was tried:** Claiming trace viewer was implemented. `changes.md` stated "tracing.start/stop per scenario."

**Why it was initially false:** The PM audit confirmed zero instances of `tracing.start()` in `compiler.js` at that point. The UI message "Check your local desktop for the Trace Viewer window" was factually misleading users.

**Resolution:** DEF-NEW-004 fixed in Round 20 — `tracing.start({screenshots,snapshots,sources})` added before `try` block and `tracing.stop({path: trace.zip})` added in `finally` block. Round 21 audit confirmed `trace.zip` present in every scenario folder.

### Attempt: `/env` Endpoint as Authoritative Platform State
**What was tried:** `GET /env` was meant to return the server's current platform, so the UI badge would be authoritative.

**Why it failed:** `AUTOTEST_PLATFORM` env var is only set during `/run`. On fresh server start, `GET /env` returns `{}`. The UI badge falls back to `localStorage`, which is silent if cleared.

**Partial fix:** DEF-R20 added `activePlatform` state variable and `/set-platform` route. `GET /env` now returns `{ platform: activePlatform }`. However, if the server restarts, the server-side `activePlatform` resets to `'web'` — it is not persisted to disk. **This is a known accepted limitation.**

### Attempt: XSS Fix for Step Label Rendering (DEF-H8)
**What was tried:** The PM report and QA report both flagged XSS via `row.innerHTML` interpolating `s.label` directly from Excel.

**Status:** DEF-H8 was flagged in the original QA report (2026-06-18) and carried forward. Round 21 audit script (21/21 PASS) didn't test this specific attack vector — it used a safe test fixture. **It is unknown whether this was fixed or silently bypassed by the audit script.** Agents should verify `studio-ui.html` for `row.innerHTML` with `s.label` interpolation before claiming fix.

### Attempt: Responsive Layout (UX-06)
**What was tried:** PM report flagged fixed `max-width: 1000px` with no media queries.

**Status:** ❌ Never addressed. Still fixed-width. Accepted as low priority for banking desktop workstation context.

### Attempt: Mobile Device Frame (UX-05)
**What was tried:** PM report flagged `.device-frame` `opacity: 0.1` — nearly invisible.

**Status:** ❌ Never addressed. The red border CSS class on mobile mode is functional but the device frame visual indicator is cosmetically non-functional.

---

## 🎯 What Comes Next (Honest Prioritized Backlog)

These are the remaining gaps, ranked by impact. Ponytail principle: don't build what isn't needed yet.

### P0 — Unverified Claims (Must Verify Before Trusting)
1. **DEF-H8 XSS — Verify if actually fixed** in current `studio-ui.html`. Grep for `row.innerHTML` with `s.label` direct interpolation. If still present, fix with DOM API (`document.createElement` + `textContent`). This is a BLOCKER for any banking deployment.
2. **Auto-recording reliability** — The `startAutoRecordPolling()` path may produce garbage code. Test against a real recording session before marketing as a feature.

### P1 — Functional Gaps
3. **`activePlatform` persistence across server restarts** — Cheapest fix: write it to a tiny `core/platform_state.json` on every `/set-platform` call and read it on boot. One `fs.writeFileSync` + one `fs.readFileSync`. Pure Ponytail.
4. **Appium mobile integration full E2E test** — Has never been end-to-end tested with a real device/emulator. `translateToMobileLocator()` is implemented but untested.

### P2 — UX Polish
5. **Mobile device frame opacity** — Increase from `0.1` to `0.5`. One CSS line.
6. **Responsive layout** — Add a single `@media (max-width: 768px)` block. Probably 10 lines of CSS.

### P3 — Future Vision (From PLAN.md Tracks E/F)
7. **Omnichannel visual badges for scenario creation** — When generating a scenario, the user should explicitly declare Web vs Mobile. Enforce a persistent context badge that appears everywhere (Studio, Mappings, Data Matrix, Execution tabs) — not just a toggle.
8. **Appium bundled in DRIVERS/** — For true air-gapped mobile testing, the Appium server binary needs to be bundled the same way Chromium is.

---

## 🧠 Key Invariants — Things That Must Never Change

These are the load-bearing constraints of the system. Breaking any of these breaks the whole platform:

1. `{variable_name}` syntax — never `${variable}`. The compiler looks for `{}` not `${}`.
2. `isSafeChain` must run before any locator string becomes generated TypeScript. No exceptions.
3. `fs.unlinkSync(RUNTIME_DATA_PATH)` must fire on BOTH `/upload` and `/restart`. Missing either creates ghost data.
4. `await page.waitForTimeout(1000)` BEFORE `await page.waitForLoadState('networkidle')` — order matters for SPA screenshot reliability.
5. Acorn AST extraction uses `code.substring(node.start, node.end)` — never reconstruct parameters from scratch.
6. `DRIVERS/node_modules` must be unshifted to `module.paths` at startup — without this, the entire server fails in air-gapped environments.
