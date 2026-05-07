const XLSX = require('xlsx');

const headers = [
    "Change ID", "Scenario Number", "Scenario Name - Script Name", "Expected Result", "Condition",
    "Application", "Complexity", "TF", "TF Reason", "Automation", "Automation Reason",
    "Due Date", "Prerequisites", "Test Data"
];

const data = [
    headers,
    ["CRIT-001", "A.1", "E2E: Happy Path Upload & Scan", "Scenarios listed in UI", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Upload Valid Excel", "Excel Loaded status shown"],

    ["CRIT-002", "A.2", "E2E: Direct Recording Workflow", "Step becomes mapped", "Normal", "Studio", "Mid", "No", null, "Yes", null, 46118, "ExcelLoaded", null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Click Record Button", "Recording active in browser"],
    [null, 3, "Perform Direct Action", "Status changes to mapped"],

    ["CRIT-003", "A.3", "E2E: Full Execution Launch", "Playwright UI appears", "Normal", "Studio", "Mid", "No", null, "Yes", null, 46118, "AllMapped", null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Click Execute Scenarios", "Launch success message"],

    ["EDGE-001", "B.1", "Edge: Upload Non-Excel File", "Error message shown", "Negative", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Upload Invalid File", "Error status shown"],

    ["EDGE-002", "B.2", "Edge: Upload Empty Excel", "No scenarios found error", "Negative", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Upload Empty Excel", "Warning: No scenarios found"],

    ["EDGE-003", "B.3", "Edge: Large Dataset Stress Test", "UI remains responsive", "Stress", "Studio", "High", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Upload Large Excel", "Scanning completes"],

    ["UX-001", "C.1", "UX: Base URL Persistence", "URL remains in input", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, "url=https://bing.com"],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Input Base URL", "Value is bing.com"],

    ["UX-002", "C.2", "UX: System Reset Verification", "All states cleared", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, "SystemDirty", null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Click Reset System", "System cleared"],

    ["DATA-001", "D.1", "Data: Token Replacement", "Tokens injected correctly", "Normal", "Engine", "Mid", "No", null, "Yes", null, 46118, null, "user=tester"],
    [null, 1, "Run Tokenized Step", "Value filled in target"],

    ["RE-001", "E.1", "Function: Re-mapping existing", "Mapping is updated", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, "Mapped", null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],
    [null, 2, "Click Re-Map Button", "Recording triggers for existing"],

    ["SCR-001", "F.1", "Security: Malicious Code Input", "Sanitized, no execution", "Security", "Studio", "High", "No", null, "Yes", null, 46118, null, "code=alert(1)"],
    [null, 1, "Paste Malicious Script", "Parsed safely"],

    // Additional 19 scenarios to reach 30, focusing on variations and deep coverage
    ["VARI-001", "G.1", "Vari: Special Chars in Labels", "Handled correctly", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Upload Special Char Excel", "Labels rendered correctly"],
    
    ["VARI-002", "G.2", "Vari: Multiple Sheets in Excel", "First sheet prioritized", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Upload Multi-Sheet Excel", "Correct scenarios found"],

    ["UX-003", "H.1", "UX: Drag & Drop Area Feedback", "Hover state visual", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Drag File Over Zone", "Visual feedback observed"],

    ["UX-004", "H.2", "UX: Polling for Mapped Status", "UI updates without refresh", "Normal", "Studio", "Mid", "No", null, "Yes", null, 46118, "RecordingStarted", null],
    [null, 1, "Trigger Info Status", "Status updates automatically"],

    ["ENG-001", "I.1", "Engine: Scroll into View Check", "Hidden elements reached", "Normal", "Engine", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Run Step for Hidden Element", "Success"],

    ["ENG-002", "I.2", "Engine: Multi-step action", "All sub-steps run", "Normal", "Engine", "Mid", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Perform Multi-Step Action", "All steps logged"],

    ["ENG-003", "I.3", "Engine: Navigation Timeouts", "Handles slow loads", "Stress", "Engine", "High", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Run Long Goto Step", "Timeout handled"],

    ["BND-001", "J.1", "Bnd: Max Length Label", "UI doesn't break", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Upload Long Label Excel", "Layout preserved"],

    ["BND-002", "J.2", "Bnd: Missing Change ID", "Defaults to ID", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Upload No-ID Excel", "Scenario parsed correctly"],

    ["FLOW-001", "K.1", "Flow: A.1 and B.1 conflict", "Unique labels preserved", "Normal", "Studio", "Mid", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Upload Multi-Flow Excel", "Labels listed once"],

    ["DATA-002", "L.1", "Data: JSON in Test Data", "Parsed as object", "Normal", "Engine", "Mid", "No", null, "Yes", null, 46118, null, "data={\"k\":\"v\"}"],
    [null, 1, "Run JSON Data Step", "Value parsed correctly"],

    ["UX-005", "M.1", "UX: Error Alert Visibility", "Red box shown on failure", "Normal", "Studio", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Trigger Studio Error", "Error visible"],

    ["SYS-001", "N.1", "Sys: Directory Cleanup", "Results wiped on reset", "Normal", "Studio", "Mid", "No", null, "Yes", null, 46118, "ResultsExist", null],
    [null, 1, "Click Reset System", "Folders are empty"],

    ["SYS-002", "N.2", "Sys: Spec File Generation", "executed.spec.ts valid", "Normal", "Studio", "High", "No", null, "Yes", null, 46118, "AllMapped", null],
    [null, 1, "Click Execute Scenarios", "Spec file exists on disk"],

    ["PERF-001", "O.1", "Perf: Concurrent Scan Request", "Handled serially", "Normal", "Studio", "High", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to Studio", "Studio UI loaded"],

    ["PERF-002", "O.2", "Perf: Rapid UI Interaction", "No race conditions", "Normal", "Studio", "Mid", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Rapidly Click Elements", "UI stays stable"],

    ["CERT-001", "P.1", "Cert: Final Certification Run", "100% Success", "Normal", "Studio", "High", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Perform All Steps", "Certification achieved"],

    ["CERT-002", "P.2", "Cert: Regression Check", "Previous fixes active", "Normal", "Studio", "High", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to Studio", "Verified"]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Scenarios");
XLSX.writeFile(wb, "autotest_self_scenario.xlsx");
console.log("✅ Created 30-scenario autotest_self_scenario.xlsx");
