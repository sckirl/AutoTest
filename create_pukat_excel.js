const XLSX = require('xlsx');

const data = [
    [null, 'A.4 Pukat Test'],
    ['Navigate to Pukat', 'run'],
    ['Filter Ticker/name', 'KEJU'],
    ['Trade First Row', 'click']
];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Scenarios");

XLSX.writeFile(wb, "scenario_pukat.xlsx");
console.log("Created scenario_pukat.xlsx");
