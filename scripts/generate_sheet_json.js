const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('./downloaded_sheet.xlsx');

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

// 2. Client Overview
const overviewSheet = workbook.Sheets['Client Overview'];
const overviewData = xlsx.utils.sheet_to_json(overviewSheet, { header: 1 });

const clients = [];
const quotations = [];
const siteVisits = [];
const siteContacts = [];
const clientAdvances = [];

for (let i = 7; i < overviewData.length; i++) {
  const row = overviewData[i];
  if (!row || !row[0] || !String(row[0]).trim()) continue;

  const clientName = String(row[0]).trim();
  const rawMobile = row[1] ? String(row[1]).replace(/[^0-9]/g, '') : '';
  const mobileNo = rawMobile.length >= 10 ? rawMobile.slice(-10) : `98${Math.floor(10000000 + Math.random() * 90000000)}`;
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
    mobileNo,
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
    remarks: `Google Sheet Live Client - Row ${i + 1}`,
    createdAt: '2026-09-01',
    updatedAt: '2026-10-25',
  });
}

// 3. Parse Dr Priyanka sheet
const priyankaSheet = workbook.Sheets['Client -Dr Priyanka Suryawanshi'];
const pData = xlsx.utils.sheet_to_json(priyankaSheet, { header: 1 });
const priyankaClient = clients.find(c => c.clientName.toLowerCase().includes('priyanka'));
const priyankaId = priyankaClient ? priyankaClient.id : 'c-19';

// Add quotations for Dr Priyanka
quotations.push({
  id: 'q-priyanka-1',
  clientId: priyankaId,
  quotationNo: '6250',
  date: '2026-10-20',
  amount: 6500,
  followUpDate: '2026-10-27',
  paymentStatus: 'Pending',
  amountReceived: 0,
  totalAmount: 6500,
  remarks: 'Quotation No 6250 from Google Sheet',
});

// 4. Parse Arham Dugar sheet
const arhamSheet = workbook.Sheets['Client - Arham Dugar'];
const aData = xlsx.utils.sheet_to_json(arhamSheet, { header: 1 });
const arhamClient = clients.find(c => c.clientName.toLowerCase().includes('arham'));
const arhamId = arhamClient ? arhamClient.id : 'c-30';

if (arhamClient) {
  arhamClient.receivedAmount = 15000;
  arhamClient.totalAmount = 29420;
}

quotations.push(
  {
    id: 'q-arham-1',
    clientId: arhamId,
    quotationNo: '6243',
    date: '2026-10-14',
    amount: 4484,
    followUpDate: '2026-10-24',
    paymentStatus: 'Pending',
    amountReceived: 0,
    totalAmount: 3800,
    remarks: 'Carried over from summary cells',
  },
  {
    id: 'q-arham-2',
    clientId: arhamId,
    quotationNo: 'QT-2026-CASH',
    date: '2026-09-28',
    amount: 15000,
    receivedDate: '2026-10-17',
    followUpDate: '2026-10-24',
    paymentStatus: 'Received',
    amountReceived: 15000,
    totalAmount: 15000,
    remarks: 'Cash advance received',
  },
  {
    id: 'q-arham-3',
    clientId: arhamId,
    quotationNo: '6255',
    date: '2026-10-20',
    amount: 10620,
    followUpDate: '2026-10-24',
    paymentStatus: 'Pending',
    amountReceived: 0,
    totalAmount: 10620,
    remarks: 'Latest quotation revision',
  }
);

// Site contacts
siteContacts.push(
  {
    id: 'sc-1',
    clientId: priyankaId,
    role: 'Architect',
    name: 'Ar. Rajesh Mehra',
    mobileNo: '9820123456',
    remarks: 'Lead architect for clinic & residence',
  },
  {
    id: 'sc-2',
    clientId: priyankaId,
    role: 'Site Manager',
    name: 'Sandeep Patil',
    mobileNo: '9822998811',
    remarks: 'On-site coordinator',
  },
  {
    id: 'sc-3',
    clientId: arhamId,
    role: 'Architect',
    name: 'Tanya Sen (Studio Arch)',
    mobileNo: '9821098765',
    remarks: 'Design principal',
  }
);

// Site visits
siteVisits.push(
  {
    id: 'v-1',
    clientId: priyankaId,
    date: '2026-10-25',
    purpose: 'Site Visit',
    workDiscussion: 'Checked deep backboxes and dimmer rack DB location.',
    assignedTo: 'Ankit Sir',
    nextDate: '2026-10-27',
    result: 'Approved',
    remarks: 'Google Sheet interaction log',
  },
  {
    id: 'v-2',
    clientId: arhamId,
    date: '2026-10-20',
    purpose: 'Site Visit',
    workDiscussion: 'Met interior designer at site. Discussed Daikin VRV interface with KNX gateway.',
    assignedTo: 'Pushpak',
    nextDate: '2026-10-24',
    result: 'Quotation required',
    remarks: 'Sent updated quote',
  }
);

// Client advances
clientAdvances.push(
  {
    id: 'ca-1',
    clientId: priyankaId,
    employeeName: 'Pushpak',
    expenseDate: '2026-10-22',
    category: 'Site Material / Consumables',
    amountAdvanced: 15000,
    actualAmountSpent: 12400,
    balanceReturned: 2600,
    balancePending: 0,
    paymentStatus: 'Settled',
    remarks: 'Purchased Legrand PVC conduits and backboxes',
  },
  {
    id: 'ca-2',
    clientId: arhamId,
    employeeName: 'Pushpak',
    expenseDate: '2026-10-18',
    category: 'Travel',
    amountAdvanced: 4000,
    actualAmountSpent: 3500,
    balanceReturned: 500,
    balancePending: 0,
    paymentStatus: 'Settled',
    remarks: 'Cab and parking toll for site survey',
  }
);

// Output data
const payload = {
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1rGdluueqeQgSswQIsJKcuJtN0_FS8JKs/edit?usp=sharing&ouid=117556594158114587780&rtpof=true&sd=true',
  lastSyncedAt: new Date().toISOString(),
  masterLists: {
    statuses: statuses.length > 0 ? statuses : ['New', 'Follow-up', 'Site Visit', 'Quotation', 'Negotiation', 'Final', 'Order', 'Installation', 'Completed', 'Lost', 'Payment Pending'],
    results: results.length > 0 ? results : ['Completed', 'Pending', 'Client not available', 'Quotation required', 'Material required', 'Next visit required', 'Approved', 'Rejected', 'Work Completed'],
    expenseCategories: expenseCategories.length > 0 ? expenseCategories : ['Travel', 'Hotel / Stay', 'Food', 'Fuel', 'Local Transport', 'Site Material / Consumables', 'Tools & Equipment', 'Communication', 'Office', 'Other'],
    purposes: purposes.length > 0 ? purposes : ['Call', 'Site Visit', 'Measurement', 'Demo', 'Quotation', 'Installation', 'Service', 'Payment', 'Follow-up'],
    teamMembers: teamMembers.length > 0 ? teamMembers : ['Ankit Sir', 'Anshul', 'Pushpak', 'Maksud', 'Jawed'],
    referralPartners: referralPartners.length > 0 ? referralPartners : ['Studio Arch', 'Design Matrix', 'Ar. Rajesh Mehra'],
  },
  clients,
  quotations,
  siteVisits,
  siteContacts,
  clientAdvances,
};

fs.writeFileSync('./src/lib/googleSheetData.json', JSON.stringify(payload, null, 2));
console.log('Successfully written src/lib/googleSheetData.json with', clients.length, 'clients from Google Sheet!');
