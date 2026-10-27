const xlsx = require('xlsx');
const workbook = xlsx.readFile('./downloaded_sheet.xlsx');
const sheet = workbook.Sheets['Client Overview'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
for (let c = 0; c < 26; c++) {
  console.log(`Col ${c} (${xlsx.utils.encode_col(c)}): ${data[6]?.[c]}`);
}
