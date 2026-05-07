# 🚀 Automation Studio: Run Guide

This project is a **No-Code Playwright Engine** that translates UAT Excel matrices into automated tests.

---

## 📋 Step 1: Prerequisites

Ensure you have the following installed:
1. **Node.js** (v18 or higher)
2. **Chrome Browser**

---

## 📂 Step 2: Project Setup

Install dependencies and Playwright browsers (only needed once):

```bash
npm install
npx playwright install chromium
```

---

## 🖥️ Step 3: Launch the Studio

```bash
node studio/server.js
```

Then open your browser to: **http://localhost:3000**

---

## ▶️ Step 4: Using the Studio (UI Workflow)

1. **Upload your Excel file** (drag & drop onto the drop zone)
   - The engine auto-detects scenarios — your Excel must have headers like **"A.1"**, **"A.2"**, etc.
2. **Record missing actions** — for any "MISSING" step, click **⏺ Record** to open a live browser session and capture the action via the Playwright Inspector.
3. **Click "🚀 Execute Test Scenarios"** once all actions are mapped.

---

## 🗑️ Step 5: Clean Reset

Click **"Reset System (Wipe All)"** in the Studio UI to:
- Clear all mappings and results
- Remove the uploaded Excel for a fresh start

---

## 📊 Step 6: Viewing Results

After execution, screenshots appear in the `results/` folder:
- Each scenario (A.1, A.2…) gets its own subfolder
- `FINAL_STATE.png` shows the end state
- Open the Playwright Trace Viewer for click-level debugging

## 🧪 Step 7: Running Tests Directly (Without Studio UI)

If you already have `core/blueprint.json` and `core/mappings.json` set up:

```bash
# Headed mode (interactive)
npx playwright test core/runner.spec.ts

# E2E Studio audit
npx playwright test core/studio_audit.spec.ts
```

---

## 🐳 Docker (CI / Headless)

```bash
docker build -t autotest .
docker run autotest
```
