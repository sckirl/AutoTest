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
    // --- MODULE PT ---
    ["", "PT.A", "Practice Test Login", "", "", "", "", "Practice Test", "High", "Yes"],
    
    // --- SCENARIO PT.1: Success ---
    ["", "PT.1", "Normal Scenario - Successful Login", "User has valid credentials", "Normal", "User successfully logs in", "", "Practice Test", "High", "Yes"],
    ["1", "1", "Navigate to PracticeTest", "", "", "Login page is displayed", "", "Practice Test", "High", "Yes"],
    ["2", "2", "Input Username", "", "", "Username is filled", '{"username": "student"}', "Practice Test", "High", "Yes"],
    ["3", "3", "Input Password", "", "", "Password is filled", '{"password": "Password123"}', "Practice Test", "High", "Yes"],
    ["4", "4", "Submit Login", "", "", "Login form is submitted", "", "Practice Test", "High", "Yes"],
    ["5", "5", "Verify Login Success", "", "", "Success message is visible", "", "Practice Test", "High", "Yes"],

    // --- SCENARIO PT.2: Invalid Password ---
    ["", "PT.2", "Negative Scenario - Incorrect Password", "User is on login page", "Negative", "Error message is shown", "", "Practice Test", "High", "Yes"],
    ["1", "1", "Navigate to PracticeTest", "", "", "Login page is displayed", "", "Practice Test", "High", "Yes"],
    ["2", "2", "Input Username", "", "", "Username is filled", '{"username": "student"}', "Practice Test", "High", "Yes"],
    ["3", "3", "Input Password", "", "", "Password is filled", '{"password": "wrongpassword"}', "Practice Test", "High", "Yes"],
    ["4", "4", "Submit Login", "", "", "Login form is submitted", "", "Practice Test", "High", "Yes"],
    ["5", "6", "Verify Error Message", "", "", "Error message is visible", "", "Practice Test", "High", "Yes"],

    // --- SCENARIO PT.3: Invalid Username ---
    ["", "PT.3", "Negative Scenario - Incorrect Username", "User is on login page", "Negative", "Error message is shown", "", "Practice Test", "High", "Yes"],
    ["1", "1", "Navigate to PracticeTest", "", "", "Login page is displayed", "", "Practice Test", "High", "Yes"],
    ["2", "2", "Input Username", "", "", "Username is filled", '{"username": "wronguser"}', "Practice Test", "High", "Yes"],
    ["3", "3", "Input Password", "", "", "Password is filled", '{"password": "Password123"}', "Practice Test", "High", "Yes"],
    ["4", "4", "Submit Login", "", "", "Login form is submitted", "", "Practice Test", "High", "Yes"],
    ["5", "6", "Verify Error Message", "", "", "Error message is visible", "", "Practice Test", "High", "Yes"],
];

const ws = XLSX.utils.aoa_to_sheet(data);

const wscols = [
    {wch: 5},  {wch: 15}, {wch: 40}, {wch: 25}, {wch: 15}, {wch: 40}, {wch: 35}, {wch: 15}, {wch: 10}, {wch: 15}
];
ws['!cols'] = wscols;

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Test Scenarios");
XLSX.writeFile(wb, "practicetest_scenario.xlsx");
console.log("✅ Created practicetest_scenario.xlsx");
