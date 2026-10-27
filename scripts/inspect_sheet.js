const xlsx = require('xlsx');

const workbook = xlsx.readFile('./downloaded_sheet.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n--- Sheet: "${sheetName}" (Rows: ${data.length}) ---`);
  // Print first 5 rows
  data.slice(0, 10).forEach((row, i) => {
    if (row && row.length > 0) {
      console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 15)));
    }
  });
});
