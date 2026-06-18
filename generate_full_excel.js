const XLSX = require('xlsx');

const headers = [
    'No',
    'Scenario Number',
    'Scenario Name / Test Case',
    'Pre-condition',
    'Jenis Skenario (Normal/Negative)',
    'Expected Result',
    'Test Data',
    'Application Name',
    'Priority',
    'Automated (Yes/No)'
];

const data = [
    headers,
    // --- MODULE A ---
    ["", "HRM.A", "Authentication Module", "", "", "", "", "OrangeHRM", "High", "Yes"],
    
    // --- SCENARIO A.1: Success ---
    ["", "HRM.A.1", "Normal Scenario - Successful Login", "User has valid credentials", "Normal", "User successfully logs in and sees dashboard", "", "OrangeHRM", "High", "Yes"],
    ["1", "1", "Navigate to OrangeHRM", "", "", "Login page is displayed", "", "OrangeHRM", "High", "Yes"],
    ["2", "2", "Input Username", "", "", "Username is filled", '{"username": "Admin"}', "OrangeHRM", "High", "Yes"],
    ["3", "3", "Input Password", "", "", "Password is filled", '{"password": "admin123"}', "OrangeHRM", "High", "Yes"],
    ["4", "4", "Submit Login", "", "", "Login form is submitted", "", "OrangeHRM", "High", "Yes"],
    ["5", "5", "Verify Dashboard", "", "", "Dashboard header is visible", "", "OrangeHRM", "High", "Yes"],

    // --- SCENARIO A.2: Invalid Password ---
    ["", "HRM.A.2", "Negative Scenario - Invalid Password", "User is on login page", "Negative", "Error message 'Invalid credentials' is shown", "", "OrangeHRM", "High", "Yes"],
    ["1", "1", "Navigate to OrangeHRM", "", "", "Login page is displayed", "", "OrangeHRM", "High", "Yes"],
    ["2", "2", "Input Username", "", "", "Username is filled", '{"username": "Admin"}', "OrangeHRM", "High", "Yes"],
    ["3", "3", "Input Password", "", "", "Password is filled", '{"password": "wrongpassword"}', "OrangeHRM", "High", "Yes"],
    ["4", "4", "Submit Login", "", "", "Login form is submitted", "", "OrangeHRM", "High", "Yes"],
    ["5", "6", "Verify Invalid Credentials Error", "", "", "Error message is visible", "", "OrangeHRM", "High", "Yes"],

    // --- SCENARIO A.3: Empty Credentials ---
    ["", "HRM.A.3", "Negative Scenario - Empty Credentials", "User is on login page", "Negative", "Validation 'Required' is shown below fields", "", "OrangeHRM", "High", "Yes"],
    ["1", "1", "Navigate to OrangeHRM", "", "", "Login page is displayed", "", "OrangeHRM", "High", "Yes"],
    ["2", "4", "Submit Login", "", "", "Login form is submitted empty", "", "OrangeHRM", "High", "Yes"],
    ["3", "7", "Verify Required Validation", "", "", "'Required' text appears", "", "OrangeHRM", "High", "Yes"],
];

const ws = XLSX.utils.aoa_to_sheet(data);

// Adjust column widths for beauty
const wscols = [
    {wch: 5},  // No
    {wch: 15}, // Scenario Number
    {wch: 40}, // Scenario Name
    {wch: 25}, // Pre-condition
    {wch: 15}, // Jenis Skenario
    {wch: 40}, // Expected Result
    {wch: 35}, // Test Data
    {wch: 15}, // Application Name
    {wch: 10}, // Priority
    {wch: 15}  // Automated
];
ws['!cols'] = wscols;

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test Scenarios");
XLSX.writeFile(wb, "orangehrm_full_scenario.xlsx");
console.log("✅ Created orangehrm_full_scenario.xlsx mirroring DPR TEMPLATE structure.");
