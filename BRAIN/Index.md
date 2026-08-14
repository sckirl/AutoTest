# AutoTest Studio Knowledge Graph (Index)

Welcome to the central hub for the AutoTest Studio mental knowledge graph. This system is designed as a zero-install, air-gapped, data-driven Playwright testing engine.

## Core Concepts & God Nodes
- [[Architecture]]: Overview of the offline-first, vanilla frontend, and bundled driver approach (a true Ponytail minimalist architecture).
- [[Security & Compiler]]: Details on AST Extraction, the `isSafeChain` evaluator, and how Playwright scripts are generated in memory safely.
- [[Data-Driven Parameterization]]: How UAT Excel matrices feed dynamic variables into the generated scripts using `{variable_name}` syntax.
- [[Workflow & Execution]]: The step-by-step process of uploading matrices, mapping, executing, and harvesting artifacts.
- [[Omnichannel Orchestration]]: How the same engine flawlessly handles both Web (Playwright) and Mobile (Appium) contexts via simple boolean conditionals instead of complex abstractions.
- [[Zero-Trust Data Lifecycle]]: The flat-file override architecture (`runtime_data.json`) and strict garbage collection to prevent stale states.
- [[Agent Personas]]: The zero-trust orchestration strategy for autonomous development and testing.

## Why this exists?
To empower non-technical QA testers to automate tests via a web UI without needing developer environment setups (`npm`, `npx`), bridging the gap between manual Excel matrices and automated Playwright execution.

## Design Philosophy (Ponytail)
AutoTest embraces a strict minimalist footprint: **No build steps**, **Vanilla HTML/CSS/JS frontend**, and **local bundled dependencies**. Over-engineering is strictly rejected in favor of raw, offline-capable execution.
