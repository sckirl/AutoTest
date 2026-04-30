# 🚀 Automation Studio: Peer Run Guide

This project is a **No-Code Playwright Engine** that translates UAT Excel matrices into automated tests.

---

### 📋 Step 1: Prerequisites
Ensure you have the following installed:
1.  **Node.js** (v18 or higher)
2.  **Chrome Browser**

---

### 📂 Step 2: Project Setup
1.  **Place your Excel file** anywhere in the project root folder. 
    *   *Validation:* The engine will automatically find it if it contains a column with **"Scenario"** or headers like **"A.1"**.
2.  **Install dependencies:**
    ```bash
    npm install
    npx playwright install chromium
    ```

---

### 🖥️ Step 3: Launching the Studio (UI-First)
1.  **Start the Backend Server:**
    ```bash
    node studio/server.js
    ```
2.  **Open the UI:**
    Open `studio/studio-ui.html` in your Chrome browser.

---

### ▶️ Step 4: Execution
1.  **Click "Start Intelligent Replay"** in the UI.
    *   *What happens:* The system reads your Excel, matches the labels to the `core/mappings.json` library, and launches a **Headed Browser**.
2.  **Handling "Auto-Healing":**
    If a step fails (UI changed) or is missing, the browser will **pause**.
    *   *Action:* Use the Playwright Inspector to record the fix, or manually update `core/mappings.json`.

---

### 🗑️ Step 5: The "Restart" Workflow
If you want a clean slate for a new project:
1.  Click **"Restart (Wipe All)"** in the UI.
2.  *What happens:* It deletes all existing results and clears the action library.

---

### 📊 Step 6: Interpreting Results
After execution, check the `results/` folder:
*   **Separated Folders:** Each scenario (A.1, A.2) has its own folder.
*   **Visual Trace:** Open the `.zip` file in [trace.playwright.dev](https://trace.playwright.dev/) to see the **click-marks (dots)** on the screen.
*   **Screenshots:** `final_result.png` shows the end state.
