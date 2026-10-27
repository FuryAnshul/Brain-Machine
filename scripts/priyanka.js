const xlsx = require('xlsx');
const workbook = xlsx.readFile('./downloaded_sheet.xlsx');
const sheet = workbook.Sheets['Client -Dr Priyanka Suryawanshi'];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
for (let i = 20; i < 70; i++) {
  if (data[i] && data[i].some(c => c !== null && c !== undefined && c !== '')) {
    console.log(`R${i}:`, JSON.stringify(data[i]));
  }
}
