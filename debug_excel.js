const XLSX = require('xlsx');
const workbook = XLSX.readFile('CORRECT SCENARIO.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 10), null, 2));
