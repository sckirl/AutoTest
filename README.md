# 🤖 AutoTest Studio

AutoTest Studio is a **Zero-Install, Air-Gapped, Data-Driven Playwright Engine** built specifically for hardened corporate and banking environments. It completely decouples Playwright logic from UAT Excel matrices, allowing manual testers to build dynamic, automated E2E test suites entirely from a web UI without ever writing code or using the command line.

---

## 🎯 The Vision
In many enterprise environments, QA and UAT testers lack the technical ability to write Playwright scripts, while developers struggle to keep test scripts synced with rapidly changing Excel testing matrices. Furthermore, strict banking networks block `npm install`, `npx`, and external browser downloads. 

AutoTest Studio bridges this gap by offering a **Zero-Trust, offline-first orchestration engine**. You drop an Excel file into the UI, record your actions visually, and the engine natively stitches, compiles, and executes the tests in the background—saving flawless screenshot evidence and traces into neatly organized folders.

---

## 🛠️ Tech Stack & Architecture
- **Backend Orchestrator**: Node.js & Express.js
- **Automation Engine**: Playwright & Playwright Test Runner
- **AST Parsing Engine**: Acorn (JavaScript AST parser) for securely extracting locators and verification assertions from raw Playwright codegen.
- **Frontend**: Vanilla HTML/JS/CSS (No build step required, maximizing offline portability)
- **Data Processor**: `xlsx` library for hierarchical parsing of complex UAT documents.

### How It Was Built
This framework was engineered with a strict "Air-Gapped" ideology. 
1. All Node modules and Chromium driver binaries are bundled directly within the `DRIVERS/` directory.
2. The compilation engine (`core/compiler.js`) generates transient, secure Playwright test scripts entirely in memory based on the UI's JSON mappings.
3. It utilizes a `isSafeChain` security model to prevent arbitrary code execution while still allowing robust Playwright locators (e.g., `getByRole`, `filter`, `locator`) and assertions (`toBeVisible`, `toHaveText`).

---

## 🚀 Quick Start Guide

Because AutoTest Studio is entirely self-contained, no installation is required assuming you have Node.js installed.

### 1. Start the Studio
```bash
# From the project root directory
node studio/server.js
```
*You will see a console confirmation that the bundled local Chromium driver was successfully located.*

### 2. Access the Application
Open your browser and navigate to: **`http://localhost:3000`**

### 3. The 4-Step E2E Workflow
1. **Upload Matrix**: Drag and drop your UAT Excel file (e.g., `DPR TEMPLATE.xlsx` format) into the UI dropzone.
2. **Map Actions**: The system detects all unique steps. Click **Record** to open the Playwright Inspector, perform the action, and paste the generated code (e.g., `await page.getByRole('button').click();`) into the Manual mapping field.
3. **Parameterize (DDT)**: Replace literal values in your pasted code with `{variable_name}` to dynamically inject payloads from your Excel sheets (e.g., `fill('{username}')`).
4. **Execute**: Click **Execute Test Scenarios**. The engine will run a Headless browser in the background and sequentially execute your entire matrix.

### 4. Auditing Results
Once execution completes, navigate to the `results/` folder in the project root. The system automatically provisions isolated directories for every scenario (e.g., `HRM_A_1/`). Inside, you will find:
- Red-marked `STEP_X.png` screenshots for every action.
- A `FINAL.png` state snapshot.
- A `trace.zip` file containing the full Playwright DOM interaction history.
