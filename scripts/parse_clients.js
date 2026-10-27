const xlsx = require('xlsx');
const workbook = xlsx.readFile('./downloaded_sheet.xlsx');
const sheet = workbook.Sheets['Client Overview'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows in Client Overview:', data.length);
// Find header row
for (let i = 0; i < 15; i++) {
  if (data[i]) console.log(`Row ${i}:`, JSON.stringify(data[i]));
}

console.log('\n--- Client rows ---');
for (let i = 7; i < data.length; i++) {
  const row = data[i];
  if (row && row[0] && String(row[0]).trim()) {
    console.log(`Client ${i}:`, row[0], '| Mobile:', row[1], '| Project:', row[2], '| Builder:', row[3], '| Status:', row[5], '| Total:', row[7]);
  }
}
