# 🧭 Next Direction — Agent Briefing

> **READ THIS FIRST.** This is the single source of truth for any clean-context agent picking up this project. Everything below is verified against the current code as of 2026-08-14. No assumptions, no stale claims.

---

## 1. What This Project Is (30-second version)

AutoTest Studio is a **Zero-Install, Air-Gapped Playwright automation engine** for banking QA teams. Non-technical testers upload an Excel UAT matrix, visually record browser actions via Playwright Inspector, then execute fully automated tests — with zero command-line interaction.

**The constraint that drives every decision:** Internet is blocked in the target environment. `npm install` and `npx` do not work. All Node modules live in `DRIVERS/node_modules/`. All Chromium lives in `DRIVERS/ms-playwright/`.

---

## 2. Current Verified State (as of Round 21)

| Area | Status |
|---|---|
| Core execution loop (Upload → Map → Execute → Results) | ✅ Working |
| Screenshot evidence (STEP_N.png + FINAL.png per scenario) | ✅ Working |
| Playwright trace.zip per scenario | ✅ Working |
| Data-Driven Testing (Accordion Data Matrix) | ✅ Working |
| XSS fix in step label rendering (DEF-H8) | ✅ FIXED — uses `textContent`, confirmed at L306 in `studio-ui.html` |
| `/run-cancel` endpoint | ✅ Exists at L777 in `server.js` |
| `/save-mapping` label validation | ✅ Exists at L495 in `server.js` |
| Startup orphan replay script cleanup | ✅ Works (both `core/` and root dir swept) |
| Mobile (Appium) path | ⚠️ Code exists, never E2E tested with real device |
| Auto-recording after replay | ⚠️ Exists in code, produces unreliable output |
| `activePlatform` persistence across server restart | ❌ Resets to `'web'` on every boot |
| `core/executed.spec.ts` in `.gitignore` | ❓ Verify — should be there, check `.gitignore` |

---

## 3. The Exact Next Tasks (Ordered by Priority)

### 🔴 P0 — Verify Before Touching Anything

**Task:** Confirm `core/executed.spec.ts` is in `.gitignore`.  
**Why:** It contains user test data (credentials, URLs). If it's committed, that's a credential leak.  
**How to check:** `grep "executed.spec" .gitignore`  
**If missing:** Add `core/executed.spec.ts` to `.gitignore` immediately.

---

### 🟠 P1 — Clean Code (from [[Ponytail Audit]])

These are pure mechanical cuts. Do them in order. Each is independent.

**P1-A: Extract shared helpers to `core/helpers.js`**  
- `isSafeChain`, `interpolate`, and `const q` are copy-pasted identically in:
  - `studio/server.js` (lines ~348-371, inside `/record` handler)
  - `core/compiler.js` (lines ~27-67)
- **Fix:** Create `core/helpers.js` exporting all three. `require` it in both files. Delete the inline copies.
- **Risk:** Low. The functions are identical — verified by diff.

**P1-B: Delete `updateActivity()` and `lastActivity`**  
- `updateActivity()` is defined at L74 in `server.js` but **never called anywhere in the file**.
- The inactivity timer (L66-72) fires on wall-clock time regardless — it doesn't need `lastActivity` to work correctly.
- **Fix:** Delete `function updateActivity()` (L74), delete `let lastActivity = Date.now()` (L26). Timer stays as-is.
- **Risk:** Zero. The function is dead.

**P1-C: Merge duplicate orphan replay cleanup loops**  
- The startup cleanup scans `CORE_DIR` then separately scans `ROOT_DIR` for orphan `replay_*` files.
- **Fix:** `[CORE_DIR, ROOT_DIR].forEach(dir => { fs.readdirSync(dir).filter(...).forEach(f => fs.unlinkSync(...)) })`
- **Risk:** Zero.

**P1-D: Cache `getBundledBrowserPath()` at startup**  
- It scans 5 disk paths on every `/record` and every `/run` call.
- **Fix:** Call once at top of file: `const BUNDLED_BROWSER = getBundledBrowserPath();` Replace all 3 call sites.
- **Risk:** Zero. Browser path doesn't change at runtime.

**P1-E: Delete `sit_runner.js`**  
- Superseded by `qa_audit_round21.md` which documents a 21-scenario E2E audit script (`hitl_scenario_test.js`). `sit_runner.js` hardcodes a `PT.1` scenario that may not exist in a fresh setup.
- **Risk:** Zero. It's a dev utility, not runtime code.

---

### 🟡 P2 — Functional Gap (One Missing Feature)

**Task: Persist `activePlatform` across server restarts**  
- **Problem:** When server boots, `activePlatform` resets to `'web'`. If a tester had switched to mobile, they need to re-toggle.
- **Ponytail fix:** Write to `core/platform_state.json` on `/set-platform`. Read it on boot. That's 2 `fs` calls.

```js
// On boot (in app.listen callback):
const platformStatePath = path.join(CORE_DIR, 'platform_state.json');
if (fs.existsSync(platformStatePath)) {
    try { activePlatform = JSON.parse(fs.readFileSync(platformStatePath)).platform || 'web'; } catch(e) {}
}

// In /set-platform handler, after updating activePlatform:
fs.writeFileSync(platformStatePath, JSON.stringify({ platform: activePlatform }));
```

Add `core/platform_state.json` to `.gitignore`.

---

### 🟡 P2 — Partial XSS Remaining in Data Matrix

The step-label XSS (DEF-H8) is **fixed** at L306.

However, the **Data Matrix accordion** (L708, L724, L726 in `studio-ui.html`) still uses `innerHTML` with partial escaping:
- `header.innerHTML` interpolates `scenarioId` (safe — server-sanitized alphanumeric key)
- `iter[v]` (user-entered data) is escaped via `.replace(/"/g, '&quot;')` — this is incomplete (misses `<`, `>`, `'`)

**Fix:** After `body.innerHTML = html`, iterate inputs and set `input.value = iter[v]` via the DOM instead of baking values into the HTML string. Or use a proper `escapeHtml()` helper function.

---

### 🟢 P3 — Nice to Have (Do Last, Or Skip)

- **Mobile device frame opacity:** Change `.device-frame { opacity: 0.1 }` → `0.5` in `studio-ui.html`. One CSS line.
- **Responsive layout:** Add `@media (max-width: 768px)` block. Low banking relevance — desktop only.
- **`webdriverio` as optional dep:** Move out of `package.json` dependencies or document it as manually installed. It's 100MB+ of untested code.

---

## 4. How the System Works (For Code-Level Context)

```
Excel upload
    → POST /upload
    → node core/scenario_parser.js           # Excel → core/blueprint.json
    → GET /scan                              # Returns steps + mapped status to UI

Manual mapping
    → POST /record {label, url, scenarioId}  # Spawns playwright codegen or replay
    → GET /codegen-result/:sessionId         # Polls until file written, returns code
    → POST /save-mapping {label, code}       # acorn AST parses code → mappings.json

Execution
    → POST /run {workers, headless, platform}
    → node core/compiler.js                  # blueprint.json + mappings.json + runtime_data.json → executed.spec.ts
    → playwright test core/executed.spec.ts --workers N --reporter=json
    → Results written to results/{ScenarioId_Iter}/STEP_N.png + FINAL.png + trace.zip
    → GET /run-status polls phase (compiling/running/completed/failed)
```

**Key files:**
- `studio/server.js` — The only backend. 830 lines. All API routes live here.
- `core/compiler.js` — Generates `executed.spec.ts`. No state — pure input/output.
- `core/scenario_parser.js` — Parses Excel → `blueprint.json`. Called by server on upload + boot.
- `studio/studio-ui.html` — Entire frontend. Single file. No framework. No build step.
- `core/mappings.json` — The mapping store. Keys = step labels. Values = `{steps: [{type, target, value}]}`.
- `core/blueprint.json` — Generated from Excel. The scenario structure.
- `core/runtime_data.json` — DDT override data. Wiped on upload and restart.

---

## 5. Rules That Must Never Break

1. `{variable_name}` syntax — **never** `${variable}`. One pair of curly braces, no dollar sign.
2. `isSafeChain` runs on every locator before it enters generated TypeScript. Non-negotiable.
3. `fs.unlinkSync(RUNTIME_DATA_PATH)` fires on **both** `/upload` and `/restart`. Missing either = stale test data contamination.
4. Screenshots require: `waitForTimeout(1000)` → `waitForLoadState('domcontentloaded')` → `waitForLoadState('networkidle')` — in that order, all catch-guarded.
5. Acorn AST extracts locators via `code.substring(node.start, node.end)` — never reconstruct from parameters.
6. `DRIVERS/node_modules` must be unshifted into `module.paths` at the top of every entry file. Both `server.js` and `compiler.js` and `scenario_parser.js` do this. Any new file that requires bundled deps must do the same.

---

## 6. What to Ignore

- `DESIGN_SYSTEM.md` — design tokens document. Not wired to any code. Reference only.
- `architecture_orchestration.mmd` / `.png` — diagram artifact. Not runtime.
- `DPR TEMPLATE.xlsx`, `orangehrm_blueprint.xlsx`, `practicetest_scenario.xlsx`, `orangehrm_full_scenario.xlsx` — sample Excel files for testing. Not runtime.
- `changes.md` — historical. Trust `defect.md` and `qa_audit_round21.md` for current verified state.
