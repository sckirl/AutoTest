# SPEC.md — Phase C: Office-Network LLM Mapping Assist (DRAFT, temporary plan)

> Status: **draft for approval — no branch, no code.**

## 0. Decisions (locked)

1. Provider is **OpenAI-compatible only** (Nvidia NIM speaks this shape; tested later with a real key).
2. Suggest **reuses the Phase B CDP-attached Chrome** via `core/cdp_session.js`.
3. Slice 1 is **backend only**: `core/llm.js` + `.env.example` + `tests/llm_test.js`.
4. No fake LLM fixture in the repo. Live call tested only when a real key is present, otherwise skipped.
5. No key means the Suggest button is disabled. Nothing else changes.
6. Secrets in local `.env` only (gitignored). Only `.env.example` is committed.

## 1. Objective

Per-step Suggest button on the Mappings tab, next unmapped step only. Replay
preceding steps, snapshot the page (`ariaSnapshot`), ask the LLM for
`await page.` lines shaped like codegen output, execute live, then
Accept / Reject-Retry / Edit manually.

## 2. Build order

| ID | Module | Ships |
|---|---|---|
| M1 | `core/llm.js`: `resolveProvider` + `complete` + `.env.example` + `tests/llm_test.js` | Slice 1 |
| M2 | Prompt builder + proposal through `parseRecordedCode` / `isSafeChain` / `tokenizeLiterals` | Slice 2 |
| M3 | Replay + snapshot + execute + `rewind()` via `cdp_session` | Slice 2 |
| M4 | Routes: status, suggest, accept, reject | Slice 2 |
| M5 | UI: Suggest button, gating, Accept/Reject/Edit wiring | Slice 3 |

## 3. Commands

```bash
node tests/llm_test.js   # slice 1 gate (skips live call without a key)
npm test                 # full suite
cp .env.example .env     # then fill the single block
```

## 4. Files (slice 1 only)

- New: `core/llm.js`, `.env.example`, `tests/llm_test.js`
- Edit: `tests/run_all.js` (one suite entry), `studio/server.js` (small `.env` loader at boot)
- Reuse untouched: `isSafeChain`, `interpolate`, `tokenizeLiterals`, `cdp_session`, `parseRecordedCode`, `activeCodegen` guards

## 5. Style

Flat `core/*.js` style, plain functions, `module.exports`. Stdlib `fetch` with
30s timeout. No new dependency. Typed errors mapped to existing
`res.status().json({error})` shape.

## 6. Tests

Pure node `assert`, no framework. `resolveProvider` on/off cases plus
request-shape checks. One live `complete()` call gated on a real key, skipped
otherwise. Gate: `node tests/llm_test.js` green, `npm test` green, tree clean.

## 7. Boundaries

Always: proposals through the codegen trust path; `{key}` placeholders never
literals; sequential gating; Edit one click away; `rewind()` before retry.
Ask first: anything beyond OpenAI-compatible; touching `/record` or `/run` guards.
Never: new runtime dependency; committing a real key; bulk mapping; LLM navigation
or assertions.
No host blocking: any OpenAI-compatible base URL works, public or private.

*Source: `FUTURE_ARCHITECTURE.md` Phase C, verified against `studio/server.js`,
`core/cdp_session.js`, `core/helpers.js`, `tests/run_all.js`, `.gitignore`.*
