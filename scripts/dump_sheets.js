const xlsx = require('xlsx');
const workbook = xlsx.readFile('./downloaded_sheet.xlsx');

function dumpSheet(name, maxRows = 25) {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    console.log(`Sheet "${name}" not found!`);
    return;
  }
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n=================== Sheet: ${name} (Total rows: ${data.length}) ===================`);
  data.slice(0, maxRows).forEach((row, i) => {
    if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
      console.log(`R${i}:`, JSON.stringify(row));
    }
  });
}

dumpSheet('Client Overview', 15);
dumpSheet('Client -Dr Priyanka Suryawanshi', 40);
dumpSheet('Client - Arham Dugar', 40);
dumpSheet('Other Expenses', 30);
dumpSheet('Lists', 15);
