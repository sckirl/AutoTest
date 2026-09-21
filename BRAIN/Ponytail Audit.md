# 🪁 Ponytail Audit — AutoTest Studio
**Date:** 2026-08-14  
**Method:** Full tree scan (all .js, .ts, .html, .md files)  
**Scope:** Over-engineering only — not correctness

---

## Findings (ranked: biggest cut first)

| Tag | What to cut | Replacement | Path |
|---|---|---|---|
| `delete` | `isSafeChain`, `interpolate`, `const q` all copy-pasted verbatim into `/record` handler | Extract to shared module `core/helpers.js`, `require` in both files | `studio/server.js` L348-371 vs `core/compiler.js` L27-67 |
| `delete` | `globalBrowser` state + 10-minute inactivity timer + `updateActivity()` | `updateActivity()` is defined but **never called anywhere** — the timer fires on wall-clock time regardless. Delete `updateActivity`, delete `lastActivity`, simplify timer to just `if (globalBrowser)` guard | `studio/server.js` L25-74 |
| `delete` | `core/executed.spec.ts` committed to repo | Add to `.gitignore` — it is 100% generated on every `/run`. Committing it leaks test data and causes merge conflicts | `core/executed.spec.ts` |
| `delete` | Duplicate startup replay cleanup runs twice — once for `CORE_DIR` and once for `ROOT_DIR` | Merge into a single `[CORE_DIR, ROOT_DIR].forEach(dir => ...)` loop. 5 lines → 2 | `studio/server.js` L796-816 |
| `yagni` | `sit_runner.js` — a manual SIT script that hardcodes `PT.1` scenario and requires a running server | Not a real test suite. `human_workflow_test.js` (referenced in AGENTS.md) and `qa_audit_round21.md` superseded it. Dead weight | `sit_runner.js` |
| `yagni` | `webdriverio` in `package.json` dependencies | Mobile Appium path has **never been E2E tested**. It should be an optional/peer dep or a note in README, not a mandatory install that adds ~100MB+ to `DRIVERS/node_modules` | `package.json` L29 |
| `shrink` | Data Matrix accordion (L716-731 in `studio-ui.html`) builds table HTML via string concatenation into `body.innerHTML` | `scenarioId` is server-derived (safe), `v` (variable names) come from mapped code (safe), but `iter[v]` (user-entered data) is escaped via `replace(/"/g, '&quot;')` — partial. Use `input.value = ...` via DOM after insertion. Medium XSS risk | `studio-ui.html` L708, L724, L726 |
| `shrink` | `header.innerHTML` in data matrix accordion interpolates `scenarioId` directly | `scenarioId` is an alphanumeric key from Excel parsing (safe per regex), but the comment on L303 says "no innerHTML with user data" — be consistent. Use `textContent` | `studio-ui.html` L708 |
| `shrink` | `getBundledBrowserPath()` has 5 hardcoded path variants, called 3× (spawn for codegen, replay, and /run) | Extract the result once at startup into a module-level `const BUNDLED_BROWSER = getBundledBrowserPath()` — currently re-scans disk on every single record/run request | `studio/server.js` L47-63 |
| `stdlib` | Orphan cleanup uses `fs.readdirSync(...).filter(f => f.startsWith('replay_') && ...)` | `glob` not needed — this `filter` pattern is correct and minimal. No cut here — already using stdlib | — |

---

## Net Removable
- **~80 lines** of duplicated `isSafeChain`/`interpolate`/`q` code across server.js + compiler.js  
- **~20 lines** of dead `updateActivity`/`lastActivity`/inactivity-timer complexity  
- **~20 lines** of duplicate replay cleanup loops  
- **164 lines** of `core/executed.spec.ts` (committed generated artifact)  
- **34 lines** of `sit_runner.js` (dead manual SIT script)  
- **1 dependency**: `webdriverio` (untested, ~100MB in DRIVERS)

**Total removable: ~320 lines + 1 heavy dependency**

---

## What NOT to touch (load-bearing complexity)
- `acorn` + `acorn-walk` — the AST parsing is the security backbone, not over-engineering  
- `isSafeChain` logic itself — complex-looking but every line earns its keep  
- The `trackedProcesses` Set — needed for SIGKILL cleanup  
- The startup replay glob sweep — necessary crash recovery  
- `playwright.config.ts` — minimal already  
- `start.js` symlink logic — needed for air-gapped deploy
