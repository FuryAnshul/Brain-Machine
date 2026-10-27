const xlsx = require('xlsx');
const workbook = xlsx.readFile('./downloaded_sheet.xlsx');
const sheet = workbook.Sheets['Client Overview'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log('Headers (Row 6):', JSON.stringify(data[6]));
for (let c = 0; c < data[6].length; c++) {
  console.log(`Col ${c} (${xlsx.utils.encode_col(c)}): ${data[6][c]}`);
}
