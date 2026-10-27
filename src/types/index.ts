export type LeadStatus =
  | 'New'
  | 'Follow-up'
  | 'Site Visit'
  | 'Quotation'
  | 'Negotiation'
  | 'Final'
  | 'Order'
  | 'Installation'
  | 'Completed'
  | 'Lost'
  | 'Payment Pending';

export type FollowUpDueStatus = 'Overdue' | 'Today' | 'Upcoming' | 'None';

export type FollowUpResult =
  | 'Completed'
  | 'Pending'
  | 'Client not available'
  | 'Quotation required'
  | 'Material required'
  | 'Next visit required'
  | 'Approved'
  | 'Rejected'
  | 'Work Completed';

export type VisitPurpose =
  | 'Call'
  | 'Site Visit'
  | 'Measurement'
  | 'Demo'
  | 'Quotation'
  | 'Installation'
  | 'Service'
  | 'Payment'
  | 'Follow-up';

export type PaymentStatus = 'Pending' | 'Partially Received' | 'Received';

export type ExpensePaymentStatus = 'Pending' | 'Partially Paid' | 'Paid';

export type AdvancePaymentStatus = 'Settled' | 'Pending Return' | 'Company Payable';

export type SiteContactRole =
  | 'Architect'
  | 'Builder'
  | 'Site Manager'
  | 'Supervisor'
  | 'Electrician'
  | 'Interior Designer'
  | 'Client / Owner'
  | 'Other';

export interface SiteContact {
  id: string;
  clientId: string;
  role: SiteContactRole;
  name: string;
  mobileNo: string;
  remarks: string;
}

export interface Quotation {
  id: string;
  clientId: string;
  quotationNo: string;
  date: string; // YYYY-MM-DD
  amount: number;
  receivedDate?: string; // YYYY-MM-DD
  followUpDate: string; // YYYY-MM-DD
  paymentStatus: PaymentStatus;
  amountReceived: number;
  totalAmount: number;
  remarks: string;
}

export interface SiteVisit {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  purpose: VisitPurpose;
  workDiscussion: string;
  assignedTo: string;
  nextDate?: string; // YYYY-MM-DD
  result: FollowUpResult;
  remarks?: string;
}

export interface ClientAdvanceExpense {
  id: string;
  clientId: string;
  employeeName: string;
  expenseDate: string; // YYYY-MM-DD
  category: string;
  amountAdvanced: number;
  actualAmountSpent: number;
  balanceReturned: number;
  balancePending: number; // amountAdvanced - actualAmountSpent - balanceReturned
  paymentStatus: AdvancePaymentStatus;
  remarks: string;
}

export interface Client {
  id: string;
  clientName: string;
  mobileNo: string;
  email?: string;
  projectName: string;
  architectBuilder: string;
  referredBy: string;
  referrerMobile?: string;
  status: LeadStatus;
  quotationNo?: string;
  totalAmount: number;
  receivedAmount: number;
  lastFollowUpDate: string; // YYYY-MM-DD
  nextFollowUpDate: string; // YYYY-MM-DD
  assignedTo: string;
  result: FollowUpResult;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyExpense {
  id: string;
  employeeName: string;
  expenseCategory: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentStatus: ExpensePaymentStatus;
  remarks: string;
  amountPaid: number;
  balanceOutstanding: number; // amount - amountPaid
}

export interface MasterLists {
  statuses: string[];
  results: string[];
  expenseCategories: string[];
  purposes: string[];
  teamMembers: string[];
  referralPartners: string[];
}
