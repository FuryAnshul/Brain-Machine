const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('./downloaded_sheet.xlsx');

// 1. Lists
const listsSheet = workbook.Sheets['Lists'];
const listsData = xlsx.utils.sheet_to_json(listsSheet, { header: 1 });
const statuses = [];
const results = [];
const expenseCategories = [];
const purposes = [];
const teamMembers = [];
const referralPartners = [];

for (let r = 1; r < listsData.length; r++) {
  const row = listsData[r];
  if (!row) continue;
  if (row[0] && String(row[0]).trim()) statuses.push(String(row[0]).trim());
  if (row[1] && String(row[1]).trim()) results.push(String(row[1]).trim());
  if (row[2] && String(row[2]).trim()) expenseCategories.push(String(row[2]).trim());
  if (row[3] && String(row[3]).trim()) purposes.push(String(row[3]).trim());
  if (row[6] && String(row[6]).trim()) teamMembers.push(String(row[6]).trim());
  if (row[7] && String(row[7]).trim()) referralPartners.push(String(row[7]).trim());
}

console.log('Parsed Statuses:', statuses.length);
console.log('Parsed Team Members:', teamMembers);
console.log('Parsed Expense Categories:', expenseCategories.length);

// 2. Client Overview
const overviewSheet = workbook.Sheets['Client Overview'];
const overviewData = xlsx.utils.sheet_to_json(overviewSheet, { header: 1 });

function excelDateToISO(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const date = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  if (typeof val === 'string') {
    if (val.includes('-')) return val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return '';
}

const clients = [];

// Header is at row 6, rows start at 7
for (let i = 7; i < overviewData.length; i++) {
  const row = overviewData[i];
  if (!row || !row[0] || !String(row[0]).trim()) continue;

  const clientName = String(row[0]).trim();
  const mobileNo = row[1] ? String(row[1]).replace(/[^0-9]/g, '') : '';
  const projectName = row[2] ? String(row[2]).trim() : `${clientName} Residence`;
  const architectBuilder = row[3] ? String(row[3]).trim() : '';
  const referredBy = row[4] ? String(row[4]).trim() : '';
  let status = row[5] ? String(row[5]).trim() : 'New';
  if (!status) status = 'New';
  const quotationNo = row[6] ? String(row[6]).trim() : '';
  const totalAmount = typeof row[7] === 'number' ? row[7] : 0;
  const lastFollowUpDate = excelDateToISO(row[8]) || '2026-10-25';
  const nextFollowUpDate = excelDateToISO(row[9]) || '2026-10-28';
  const assignedTo = row[10] ? String(row[10]).trim() : 'Ankit Sir';
  const result = row[11] ? String(row[11]).trim() : 'Pending';

  const id = `c-${i}`;
  clients.push({
    id,
    clientName,
    mobileNo: mobileNo || '9820000000',
    projectName,
    architectBuilder,
    referredBy,
    status,
    quotationNo,
    totalAmount,
    receivedAmount: 0,
    lastFollowUpDate,
    nextFollowUpDate,
    assignedTo: assignedTo || 'Ankit Sir',
    result: result || 'Pending',
    remarks: `Imported from Google Sheet Client Overview row ${i + 1}`,
    createdAt: '2026-09-01',
    updatedAt: '2026-10-25',
  });
}

console.log('Total Clients Parsed:', clients.length);
console.log('First 3 clients:', JSON.stringify(clients.slice(0, 3), null, 2));
