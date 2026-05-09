const XLSX = require('xlsx');

const headers = [
    "Change ID", "Scenario Number", "Scenario Name - Script Name", "Expected Result", "Condition",
    "Application", "Complexity", "TF", "TF Reason", "Automation", "Automation Reason",
    "Due Date", "Prerequisites", "Test Data"
];

const data = [headers];

function addLoginSteps(data, username, password) {
    data.push([null, 1, "Navigate to OrangeHRM", "Login page loaded", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
    data.push([null, 2, "Input Username", "Username filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, `username=${username}`]);
    data.push([null, 3, "Input Password", "Password filled", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, `password=${password}`]);
    data.push([null, 4, "Click Login Button", "Login submitted", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
}

// Scenarios A.1 - A.5 (Login)
for (let i = 1; i <= 5; i++) {
    const sId = `A.${i}`;
    let name = `Login Scenario ${i}`;
    let user = "Admin";
    let pass = "admin123";
    let expected = "Dashboard loaded";
    
    if (i === 2) { name = "Invalid Username"; user = "WrongUser"; expected = "Error shown"; }
    if (i === 3) { name = "Invalid Password"; pass = "WrongPass"; expected = "Error shown"; }
    if (i === 4) { name = "Empty Login"; user = ""; pass = ""; expected = "Error shown"; }
    if (i === 5) { name = "Case Sensitive Password"; pass = "ADMIN123"; expected = "Error shown"; }

    data.push([`QA-${sId}`, sId, name, expected, "Normal", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, `username=${user}, password=${pass}`]);
    addLoginSteps(data, user, pass);
    if (i === 1) {
        data.push([null, 5, "Verify Dashboard Header", "Dashboard visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
    } else {
        data.push([null, 5, "Verify Login Error Message", "Error visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
    }
}

// Scenarios B.1 - B.10 (Navigation)
const menus = [
    ["Admin", "Admin Header"],
    ["PIM", "PIM Header"],
    ["Leave", "Leave Header"],
    ["Time", "Time Header"],
    ["Recruitment", "Recruitment Header"],
    ["My Info", "Personal Details Header"],
    ["Performance", "Performance Header"],
    ["Dashboard", "Dashboard Header"],
    ["Directory", "Directory Header"],
    ["Maintenance", "Maintenance Header"]
];

menus.forEach((menu, index) => {
    const sId = `B.${index + 1}`;
    data.push([`QA-${sId}`, sId, `Navigate to ${menu[0]}`, `${menu[1]} visible`, "Normal", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Admin, password=admin123"]);
    addLoginSteps(data, "Admin", "admin123");
    data.push([null, 5, `Click ${menu[0]} Menu`, "Transition started", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
    data.push([null, 6, `Verify ${menu[1]}`, "Header visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
});

// Scenarios C.1 - C.10 (Re-verification of Navigation - Parallel stress test)
menus.forEach((menu, index) => {
    const sId = `C.${index + 1}`;
    data.push([`QA-${sId}`, sId, `Stress Test: ${menu[0]}`, `${menu[1]} visible`, "Normal", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Admin, password=admin123"]);
    addLoginSteps(data, "Admin", "admin123");
    data.push([null, 5, `Click ${menu[0]} Menu`, "Transition started", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
    data.push([null, 6, `Verify ${menu[1]}`, "Header visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
});

// Scenarios D.1 - D.5 (Edge Cases / Repeated Navigation)
for (let i = 1; i <= 5; i++) {
    const sId = `D.${i}`;
    data.push([`QA-${sId}`, sId, `Quick Check ${i}`, "Dashboard visible", "Normal", "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, "username=Admin, password=admin123"]);
    addLoginSteps(data, "Admin", "admin123");
    data.push([null, 5, "Verify Dashboard Header", "Dashboard visible", null, "OrangeHRM", "Low", "No", null, "Yes", null, 46118, null, null]);
}

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "QA_Scenarios");
XLSX.writeFile(wb, "scenario_qa.xlsx");
console.log("✅ Created scenario_qa.xlsx with 30 scenarios.");
