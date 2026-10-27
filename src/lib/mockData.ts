import {
  Client,
  SiteContact,
  Quotation,
  SiteVisit,
  ClientAdvanceExpense,
  CompanyExpense,
  MasterLists,
} from '@/types';
import googleSheetPayload from './googleSheetData.json';

export const GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1rGdluueqeQgSswQIsJKcuJtN0_FS8JKs/edit?usp=sharing&ouid=117556594158114587780&rtpof=true&sd=true';

export const initialMasterLists: MasterLists = googleSheetPayload.masterLists as MasterLists;

export const initialClients: Client[] = googleSheetPayload.clients as Client[];

export const initialQuotations: Quotation[] = googleSheetPayload.quotations as Quotation[];

export const initialSiteVisits: SiteVisit[] = googleSheetPayload.siteVisits as SiteVisit[];

export const initialSiteContacts: SiteContact[] = googleSheetPayload.siteContacts as SiteContact[];

export const initialClientAdvances: ClientAdvanceExpense[] =
  googleSheetPayload.clientAdvances as ClientAdvanceExpense[];

export const initialCompanyExpenses: CompanyExpense[] = [
  {
    id: 'exp-1',
    employeeName: 'Pushpak',
    expenseCategory: 'Travel',
    date: '2026-10-24',
    amount: 4500,
    paymentStatus: 'Paid',
    remarks: 'Inter-city highway toll and cab fares for Alibaug and South Mumbai site visits.',
    amountPaid: 4500,
    balanceOutstanding: 0,
  },
  {
    id: 'exp-2',
    employeeName: 'Maksud',
    expenseCategory: 'Tools & Equipment',
    date: '2026-10-21',
    amount: 18500,
    paymentStatus: 'Partially Paid',
    remarks: 'Bosch Laser Distance Meter GLM 50-27 CG and Klein Tools multi-meter for site team.',
    amountPaid: 10000,
    balanceOutstanding: 8500,
  },
  {
    id: 'exp-3',
    employeeName: 'Jawed',
    expenseCategory: 'Fuel',
    date: '2026-10-23',
    amount: 3200,
    paymentStatus: 'Pending',
    remarks: 'Company service van fuel reimbursement for 550km site visits in Mumbai metro.',
    amountPaid: 0,
    balanceOutstanding: 3200,
  },
  {
    id: 'exp-4',
    employeeName: 'Anshul',
    expenseCategory: 'Office',
    date: '2026-10-20',
    amount: 6800,
    paymentStatus: 'Paid',
    remarks: 'Office printer ink cartridges, blueprint plot paper rolls, and technical binders.',
    amountPaid: 6800,
    balanceOutstanding: 0,
  },
  {
    id: 'exp-5',
    employeeName: 'Ankit Sir',
    expenseCategory: 'Hotel / Stay',
    date: '2026-10-15',
    amount: 22000,
    paymentStatus: 'Paid',
    remarks: 'Client architectural coordination summit at Grand Hyatt Mumbai with overseas smart home principals.',
    amountPaid: 22000,
    balanceOutstanding: 0,
  },
  {
    id: 'exp-6',
    employeeName: 'Pushpak',
    expenseCategory: 'Communication',
    date: '2026-10-18',
    amount: 2499,
    paymentStatus: 'Pending',
    remarks: 'Monthly 5G unlimited hotspot and eSIM data for site remote testing laptops.',
    amountPaid: 0,
    balanceOutstanding: 2499,
  },
];
