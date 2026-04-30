const XLSX = require('xlsx');
const workbook = XLSX.readFile('scenario.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log("Excel Structure (First 10 rows):");
console.log(data.slice(0, 10));
