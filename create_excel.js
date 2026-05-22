const XLSX = require('xlsx');
const path = require('path');

const data = [
    ["", "Scenario / ID", "Step Label / Mapping Key", "", "", "", "", "", "", "", "", "", "", "Test Data"],
    ["", "A.1", "Login Audit", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "1", "Navigate to Practice Site", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "2", "Input Username", "", "", "", "", "", "", "", "", "", "", "{ \"username\": \"student\" }"],
    ["", "3", "Submit Login", "", "", "", "", "", "", "", "", "", "", ""]
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Scenarios");
XLSX.writeFile(wb, path.join(__dirname, "scenario_uploaded.xlsx"));
console.log("Excel file created.");
