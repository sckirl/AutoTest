# AutoTest Studio Knowledge Graph (Index)

> **🚀 New agent? Go straight to [[Next Direction]].** It has the verified current state, exact ordered task list, system flow diagram, and invariants. Everything else here is deeper context.

Welcome to the central hub for the AutoTest Studio mental knowledge graph. This system is designed as a zero-install, air-gapped, data-driven Playwright testing engine.

## Core Concepts & God Nodes
- [[Architecture]]: Overview of the offline-first, vanilla frontend, and bundled driver approach (a true Ponytail minimalist architecture).
- [[Security & Compiler]]: Details on AST Extraction, the `isSafeChain` evaluator, and how Playwright scripts are generated in memory safely.
- [[Data-Driven Parameterization]]: How UAT Excel matrices feed dynamic variables into the generated scripts using `{variable_name}` syntax.
- [[Workflow & Execution]]: The step-by-step process of uploading matrices, mapping, executing, and harvesting artifacts.
- [[Omnichannel Orchestration]]: How the same engine flawlessly handles both Web (Playwright) and Mobile (Appium) contexts via simple boolean conditionals instead of complex abstractions.
- [[Zero-Trust Data Lifecycle]]: The flat-file override architecture (`runtime_data.json`) and strict garbage collection to prevent stale states.
- [[Agent Personas]]: The zero-trust orchestration strategy for autonomous development and testing.
- [[What Happened]]: **START HERE if picking up mid-stream.** Honest log of everything done, what worked, what failed, what's unverified, and the real backlog.

## Current Status (as of 2026-08-14)

> Round 21 certified defect-free. DEF-H8 (XSS via step label innerHTML) status unconfirmed in current code. Auto-recording feature exists but is unreliable. Mobile Appium path never E2E tested. Server restarts reset `activePlatform` to `web` — no disk persistence.

## Why this exists?
To empower non-technical QA testers to automate tests via a web UI without needing developer environment setups (`npm`, `npx`), bridging the gap between manual Excel matrices and automated Playwright execution.

## Design Philosophy (Ponytail)
AutoTest embraces a strict minimalist footprint: **No build steps**, **Vanilla HTML/CSS/JS frontend**, and **local bundled dependencies**. Over-engineering is strictly rejected in favor of raw, offline-capable execution.
