const XLSX = require('xlsx');

const headers = [
    "Change ID", "Scenario Number", "Scenario Name - Script Name", "Expected Result", "Condition",
    "Application", "Complexity", "TF", "TF Reason", "Automation", "Automation Reason",
    "Due Date", "Prerequisites", "Test Data"
];

const data = [
    headers,
    [null, "A", "OrangeHRM Standard Flows"],
    ["HRM001", "A.1", "Successful Admin Login", "User redirected to Dashboard", "Normal", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Admin, password=admin123"],
    [null, 1, "Navigate to OrangeHRM", "Login page loaded", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Input Username", "Username field filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Admin"],
    [null, 3, "Input Password", "Password field filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "password=admin123"],
    [null, 4, "Click Login Button", "Dashboard loaded", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    
    ["HRM002", "A.2", "Navigate to My Info", "Personal details page shown", "Normal", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 1, "Navigate to OrangeHRM", "Login page loaded", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Input Username", "Username field filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Admin"],
    [null, 3, "Input Password", "Password field filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "password=admin123"],
    [null, 4, "Click Login Button", "Dashboard loaded", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 5, "Click My Info Tab", "Page transition started", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 6, "Verify Personal Details Header", "Header is visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],

    ["HRM003", "B.1", "Invalid Login Attempt", "Error message displayed", "Negative", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Invalid, password=Wrong123"],
    [null, 1, "Navigate to OrangeHRM", "Login page loaded", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 2, "Input Username", "Username field filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Invalid"],
    [null, 3, "Input Password", "Password field filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "password=Wrong123"],
    [null, 4, "Click Login Button", "Stay on login page", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null],
    [null, 5, "Verify Login Error Message", "Error alert visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "OrangeHRM");
XLSX.writeFile(wb, "orangehrm_scenario.xlsx");
console.log("✅ Created orangehrm_scenario.xlsx");
