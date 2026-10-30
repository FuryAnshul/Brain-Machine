import {
  Client,
  SiteContact,
  Quotation,
  SiteVisit,
  ClientAdvanceExpense,
  CompanyExpense,
  MasterLists,
  LeadStatus,
  FollowUpResult,
  PaymentStatus,
  AdvancePaymentStatus,
  ExpensePaymentStatus,
  VisitPurpose,
  SiteContactRole,
  UserProfile,
  SafeUserProfile,
} from '@/types';

// Valid constant enums for validation
export const VALID_LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Follow-up',
  'Site Visit',
  'Quotation',
  'Negotiation',
  'Final',
  'Order',
  'Installation',
  'Completed',
  'Lost',
  'Payment Pending',
];

export const VALID_FOLLOW_UP_RESULTS: FollowUpResult[] = [
  'Completed',
  'Pending',
  'Client not available',
  'Quotation required',
  'Material required',
  'Next visit required',
  'Approved',
  'Rejected',
  'Work Completed',
];

export const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  'Pending',
  'Partially Received',
  'Received',
];

export const VALID_EXPENSE_STATUSES: ExpensePaymentStatus[] = [
  'Pending',
  'Partially Paid',
  'Paid',
];

export const VALID_ADVANCE_STATUSES: AdvancePaymentStatus[] = [
  'Settled',
  'Pending Return',
  'Company Payable',
];

export const VALID_VISIT_PURPOSES: VisitPurpose[] = [
  'Call',
  'Site Visit',
  'Measurement',
  'Demo',
  'Quotation',
  'Installation',
  'Service',
  'Payment',
  'Follow-up',
];

export const VALID_CONTACT_ROLES: SiteContactRole[] = [
  'Architect',
  'Builder',
  'Site Manager',
  'Supervisor',
  'Electrician',
  'Interior Designer',
  'Client / Owner',
  'Other',
];

export const ALLOWED_EMAIL_DOMAIN = '@brainmachine.com';

/**
 * Validates that an email has a complete format, trims whitespace,
 * normalizes to lowercase, and enforces the allowed @brainmachine.com domain.
 */
export function validateAllowedEmail(rawEmail: unknown): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { valid: false, normalized: '', error: 'Please enter your email address.' };
  }
  const normalized = rawEmail.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, normalized: '', error: 'Please enter your email address.' };
  }

  // Validate complete email address format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, normalized, error: 'Please enter a valid email address format.' };
  }

  // Enforce allowed domain
  if (!normalized.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return { valid: false, normalized, error: 'Please use your @brainmachine.com email address.' };
  }

  return { valid: true, normalized };
}

/**
 * Strips script tags and trims whitespace to prevent stored injection.
 */
export function sanitizeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  // Strip dangerous html/script tags
  return str.replace(/<[^>]*>?/gm, '');
}

/**
 * Ensures numbers are finite, non-NaN, and optionally non-negative.
 */
export function sanitizeNumber(val: any, fallback = 0, allowNegative = false): number {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return fallback;
  if (!allowNegative && num < 0) return 0;
  return Math.round(num * 100) / 100; // 2 decimal precision
}

/**
 * Validates date string format (YYYY-MM-DD) or returns safe fallback.
 */
export function sanitizeDate(val: any, fallback = ''): string {
  if (!val || typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return trimmed;
  }
  return fallback;
}

/**
 * Deeply strips sensitive fields (passwords, recovery keys, private tokens)
 * from any object before writing to browser storage or client-side logs.
 */
export function sanitizeSensitiveFields<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeSensitiveFields(item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop sensitive authentication keys
    if (
      key === 'password' ||
      key === 'recoveryKey' ||
      key === 'secret' ||
      key === 'token' ||
      key === 'apiKey'
    ) {
      continue;
    }
    if (value && typeof value === 'object') {
      cleaned[key] = sanitizeSensitiveFields(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

/**
 * Validates and repairs a single Client record.
 */
export function validateClient(raw: any, fallbackId?: string): Client | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sanitizeString(raw.id, fallbackId || `c-${Date.now().toString(36)}`);
  const clientName = sanitizeString(raw.clientName, 'Unnamed Client');
  if (!clientName) return null;

  const status: LeadStatus = VALID_LEAD_STATUSES.includes(raw.status)
    ? raw.status
    : 'New';

  const result: FollowUpResult = VALID_FOLLOW_UP_RESULTS.includes(raw.result)
    ? raw.result
    : 'Pending';

  const now = new Date().toISOString().split('T')[0];

  return {
    id,
    clientName,
    mobileNo: sanitizeString(raw.mobileNo, ''),
    email: raw.email ? sanitizeString(raw.email) : undefined,
    projectName: sanitizeString(raw.projectName, ''),
    architectBuilder: sanitizeString(raw.architectBuilder, ''),
    referredBy: sanitizeString(raw.referredBy, ''),
    referrerMobile: raw.referrerMobile ? sanitizeString(raw.referrerMobile) : undefined,
    status,
    quotationNo: raw.quotationNo ? sanitizeString(raw.quotationNo) : undefined,
    totalAmount: sanitizeNumber(raw.totalAmount, 0),
    receivedAmount: sanitizeNumber(raw.receivedAmount, 0),
    lastFollowUpDate: sanitizeDate(raw.lastFollowUpDate, ''),
    nextFollowUpDate: sanitizeDate(raw.nextFollowUpDate, ''),
    assignedTo: sanitizeString(raw.assignedTo, 'Unassigned'),
    result,
    remarks: sanitizeString(raw.remarks, ''),
    createdAt: sanitizeDate(raw.createdAt, now),
    updatedAt: sanitizeDate(raw.updatedAt, now),
  };
}

/**
 * Validates an array of Client records, filtering out corrupted items.
 */
export function validateClients(rawList: any, fallback: Client[]): Client[] {
  if (!Array.isArray(rawList)) return fallback;
  const validated: Client[] = [];
  for (const item of rawList) {
    const valid = validateClient(item);
    if (valid) validated.push(valid);
  }
  return validated.length > 0 ? validated : fallback;
}

/**
 * Validates and repairs a single Quotation.
 */
export function validateQuotation(raw: any): Quotation | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = sanitizeString(raw.id);
  const clientId = sanitizeString(raw.clientId);
  if (!id || !clientId) return null;

  const totalAmount = sanitizeNumber(
    raw.totalAmount !== undefined ? raw.totalAmount : raw.amount,
    0
  );
  const amountReceived = sanitizeNumber(
    raw.amountReceived !== undefined ? raw.amountReceived : raw.receivedAmount,
    0
  );

  let paymentStatus: PaymentStatus = 'Pending';
  if (VALID_PAYMENT_STATUSES.includes(raw.paymentStatus)) {
    paymentStatus = raw.paymentStatus;
  } else if (amountReceived >= totalAmount && totalAmount > 0) {
    paymentStatus = 'Received';
  } else if (amountReceived > 0) {
    paymentStatus = 'Partially Received';
  }

  return {
    id,
    clientId,
    quotationNo: sanitizeString(raw.quotationNo, 'Draft-Q'),
    date: sanitizeDate(raw.date, new Date().toISOString().split('T')[0]),
    amount: totalAmount,
    totalAmount,
    amountReceived,
    receivedDate: raw.receivedDate ? sanitizeDate(raw.receivedDate) : undefined,
    followUpDate: sanitizeDate(raw.followUpDate, ''),
    paymentStatus,
    remarks: sanitizeString(raw.remarks, ''),
  };
}

export function validateQuotations(rawList: any, fallback: Quotation[]): Quotation[] {
  if (!Array.isArray(rawList)) return fallback;
  const validated: Quotation[] = [];
  for (const item of rawList) {
    const valid = validateQuotation(item);
    if (valid) validated.push(valid);
  }
  return validated.length > 0 ? validated : fallback;
}

/**
 * Validates and repairs a SiteContact.
 */
export function validateSiteContact(raw: any): SiteContact | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id);
  const clientId = sanitizeString(raw.clientId);
  if (!id || !clientId) return null;

  const role: SiteContactRole = VALID_CONTACT_ROLES.includes(raw.role)
    ? raw.role
    : 'Other';

  return {
    id,
    clientId,
    role,
    name: sanitizeString(raw.name, 'Contact'),
    mobileNo: sanitizeString(raw.mobileNo, ''),
    remarks: sanitizeString(raw.remarks, ''),
  };
}

export function validateSiteContacts(rawList: any, fallback: SiteContact[]): SiteContact[] {
  if (!Array.isArray(rawList)) return fallback;
  const validated: SiteContact[] = [];
  for (const item of rawList) {
    const valid = validateSiteContact(item);
    if (valid) validated.push(valid);
  }
  return validated.length > 0 ? validated : fallback;
}

/**
 * Validates and repairs a SiteVisit.
 */
export function validateSiteVisit(raw: any): SiteVisit | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id);
  const clientId = sanitizeString(raw.clientId);
  if (!id || !clientId) return null;

  const purpose: VisitPurpose = VALID_VISIT_PURPOSES.includes(raw.purpose)
    ? raw.purpose
    : 'Site Visit';

  const result: FollowUpResult = VALID_FOLLOW_UP_RESULTS.includes(raw.result)
    ? raw.result
    : 'Pending';

  return {
    id,
    clientId,
    date: sanitizeDate(raw.date, new Date().toISOString().split('T')[0]),
    purpose,
    workDiscussion: sanitizeString(raw.workDiscussion, ''),
    assignedTo: sanitizeString(raw.assignedTo, 'Unassigned'),
    nextDate: raw.nextDate ? sanitizeDate(raw.nextDate) : undefined,
    result,
    remarks: raw.remarks ? sanitizeString(raw.remarks) : undefined,
  };
}

export function validateSiteVisits(rawList: any, fallback: SiteVisit[]): SiteVisit[] {
  if (!Array.isArray(rawList)) return fallback;
  const validated: SiteVisit[] = [];
  for (const item of rawList) {
    const valid = validateSiteVisit(item);
    if (valid) validated.push(valid);
  }
  return validated.length > 0 ? validated : fallback;
}

/**
 * Validates and repairs a ClientAdvanceExpense.
 */
export function validateClientAdvance(raw: any): ClientAdvanceExpense | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id);
  const clientId = sanitizeString(raw.clientId);
  if (!id || !clientId) return null;

  const advanced = sanitizeNumber(raw.amountAdvanced, 0);
  const spent = sanitizeNumber(raw.actualAmountSpent, 0);
  const returned = sanitizeNumber(raw.balanceReturned, 0);
  const balancePending = sanitizeNumber(advanced - spent - returned, 0, true);

  let paymentStatus: AdvancePaymentStatus = 'Settled';
  if (balancePending > 0) {
    paymentStatus = 'Pending Return';
  } else if (balancePending < 0) {
    paymentStatus = 'Company Payable';
  }

  return {
    id,
    clientId,
    employeeName: sanitizeString(raw.employeeName, 'Staff'),
    expenseDate: sanitizeDate(raw.expenseDate, new Date().toISOString().split('T')[0]),
    category: sanitizeString(raw.category, 'Site Expense'),
    amountAdvanced: advanced,
    actualAmountSpent: spent,
    balanceReturned: returned,
    balancePending,
    paymentStatus,
    remarks: sanitizeString(raw.remarks, ''),
  };
}

export function validateClientAdvances(rawList: any, fallback: ClientAdvanceExpense[]): ClientAdvanceExpense[] {
  if (!Array.isArray(rawList)) return fallback;
  const validated: ClientAdvanceExpense[] = [];
  for (const item of rawList) {
    const valid = validateClientAdvance(item);
    if (valid) validated.push(valid);
  }
  return validated.length > 0 ? validated : fallback;
}

/**
 * Validates and repairs a CompanyExpense.
 */
export function validateCompanyExpense(raw: any): CompanyExpense | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id);
  if (!id) return null;

  const amount = sanitizeNumber(raw.amount, 0);
  const amountPaid = sanitizeNumber(raw.amountPaid, 0);
  const balanceOutstanding = sanitizeNumber(amount - amountPaid, 0, true);

  let paymentStatus: ExpensePaymentStatus = 'Pending';
  if (VALID_EXPENSE_STATUSES.includes(raw.paymentStatus)) {
    paymentStatus = raw.paymentStatus;
  } else if (amountPaid >= amount && amount > 0) {
    paymentStatus = 'Paid';
  } else if (amountPaid > 0) {
    paymentStatus = 'Partially Paid';
  }

  return {
    id,
    employeeName: sanitizeString(raw.employeeName, 'Employee'),
    expenseCategory: sanitizeString(raw.expenseCategory, 'Overhead'),
    date: sanitizeDate(raw.date, new Date().toISOString().split('T')[0]),
    amount,
    paymentStatus,
    remarks: sanitizeString(raw.remarks, ''),
    amountPaid,
    balanceOutstanding,
  };
}

export function validateCompanyExpenses(rawList: any, fallback: CompanyExpense[]): CompanyExpense[] {
  if (!Array.isArray(rawList)) return fallback;
  const validated: CompanyExpense[] = [];
  for (const item of rawList) {
    const valid = validateCompanyExpense(item);
    if (valid) validated.push(valid);
  }
  return validated.length > 0 ? validated : fallback;
}

/**
 * Validates MasterLists categories.
 */
export function validateMasterLists(raw: any, fallback: MasterLists): MasterLists {
  if (!raw || typeof raw !== 'object') return fallback;

  const validateStringArray = (arr: any, fallbackArr: string[]): string[] => {
    if (!Array.isArray(arr)) return fallbackArr;
    const clean = arr
      .map((item) => sanitizeString(item))
      .filter((item) => item.length > 0);
    return clean.length > 0 ? Array.from(new Set(clean)) : fallbackArr;
  };

  return {
    statuses: validateStringArray(raw.statuses, fallback.statuses),
    results: validateStringArray(raw.results, fallback.results),
    expenseCategories: validateStringArray(raw.expenseCategories, fallback.expenseCategories),
    purposes: validateStringArray(raw.purposes, fallback.purposes),
    teamMembers: validateStringArray(raw.teamMembers, fallback.teamMembers),
    referralPartners: validateStringArray(raw.referralPartners, fallback.referralPartners),
  };
}

/**
 * Validates User Profile metadata for safe persistence (strictly omitting secrets).
 */
export function validateSafeUserProfile(raw: any): SafeUserProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id);
  const email = sanitizeString(raw.email).toLowerCase();
  if (!id || !email) return null;

  return {
    id,
    name: sanitizeString(raw.name, 'User'),
    email,
    role: raw.role === 'admin' || raw.role === 'engineer' ? raw.role : 'staff',
    status: raw.status === 'revoked' ? 'revoked' : 'active',
    mobileNo: raw.mobileNo ? sanitizeString(raw.mobileNo) : undefined,
    createdAt: sanitizeDate(raw.createdAt, new Date().toISOString()),
    lastLoginAt: raw.lastLoginAt ? sanitizeString(raw.lastLoginAt) : undefined,
    sessionExpiry: typeof raw.sessionExpiry === 'number' ? raw.sessionExpiry : undefined,
  };
}

/**
 * Safe Browser LocalStorage Read with schema validation and corruption recovery.
 */
export function safeLoadStorage<T>(
  key: string,
  validator: (raw: any) => T,
  fallback: T
): { data: T; isRepaired: boolean; wasCorrupted: boolean } {
  if (typeof window === 'undefined') {
    return { data: fallback, isRepaired: false, wasCorrupted: false };
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { data: fallback, isRepaired: false, wasCorrupted: false };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Malformed JSON string in storage
      console.warn(`[DataIntegrity] Malformed JSON found in storage key "${key}". Restoring defaults.`);
      return { data: fallback, isRepaired: true, wasCorrupted: true };
    }

    const validated = validator(parsed);
    return { data: validated, isRepaired: false, wasCorrupted: false };
  } catch (err) {
    console.warn(`[DataIntegrity] Validation error while parsing key "${key}". Gracefully falling back.`);
    return { data: fallback, isRepaired: true, wasCorrupted: true };
  }
}

/**
 * Safe Browser LocalStorage Write with sensitive field stripping and quota error handling.
 */
export function safeSaveStorage<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Strip any potential sensitive fields before writing
    const sanitized = sanitizeSensitiveFields(data);
    const serialized = JSON.stringify(sanitized);

    // 2. Perform write
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    // Handle storage quota exceeded or private mode restrictions
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn(
        `[DataIntegrity] LocalStorage quota exceeded while saving key "${key}". Changes cannot be saved locally.`
      );
    } else {
      console.warn(`[DataIntegrity] Storage write error for key "${key}".`);
    }
    return false;
  }
}
