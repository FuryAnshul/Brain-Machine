'use client';

import { create } from 'zustand';
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
  AdvancePaymentStatus,
  UserProfile,
  SafeUserProfile,
} from '@/types';
import {
  initialClients,
  initialSiteContacts,
  initialQuotations,
  initialSiteVisits,
  initialClientAdvances,
  initialCompanyExpenses,
  initialMasterLists,
  initialUsers,
} from './mockData';
import { STORAGE_KEYS } from './storageKeys';
import {
  validateClient,
  validateClients,
  validateQuotation,
  validateQuotations,
  validateSiteContact,
  validateSiteContacts,
  validateSiteVisit,
  validateSiteVisits,
  validateClientAdvance,
  validateClientAdvances,
  validateCompanyExpense,
  validateCompanyExpenses,
  validateMasterLists,
  validateSafeUserProfile,
  safeLoadStorage,
  safeSaveStorage,
  sanitizeSensitiveFields,
  sanitizeNumber,
  sanitizeString,
  sanitizeDate,
  validateAllowedEmail,
} from './validation';

interface CRMStoreState {
  clients: Client[];
  siteContacts: SiteContact[];
  quotations: Quotation[];
  siteVisits: SiteVisit[];
  clientAdvances: ClientAdvanceExpense[];
  companyExpenses: CompanyExpense[];
  masterLists: MasterLists;
  users: UserProfile[];
  currentUser: UserProfile | null;
  isHydrated: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  googleSheetWebhookUrl: string;
  storageHealth: {
    isRepaired: boolean;
    wasCorrupted: boolean;
    lastValidatedAt: string | null;
  };
  sessionTerminationReason: 'expired' | 'revoked' | null;
  clearSessionTerminationReason: () => void;
  setGoogleSheetWebhookUrl: (url: string) => void;
  syncAllToGoogleSheet: () => Promise<{ success: boolean; message: string; sheetPushed?: boolean }>;

  // Authentication & Session
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  validateSession: () => { valid: boolean; reason?: 'expired' | 'revoked' | 'notFound' };
  adminResetPassword: (
    email: string,
    recoveryKey: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Admin User Profile Management
  createUserProfile: (
    userData: Omit<UserProfile, 'id' | 'createdAt'>
  ) => { success: boolean; error?: string; id?: string };
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => void;
  revokeUserAccess: (id: string) => void;
  activateUserAccess: (id: string) => void;
  deleteUserProfile: (id: string) => { success: boolean; error?: string };

  // Hydration & Google Sheet Sync
  init: () => void;
  resetToFactoryDemo: () => void;
  syncFromGoogleSheet: () => Promise<{ success: boolean; count: number; error?: string }>;

  // Client actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updateClientStatus: (id: string, status: LeadStatus) => void;
  updateClientAssignedTo: (id: string, assignedTo: string) => void;
  updateClientResult: (id: string, result: FollowUpResult) => void;

  // Site Contacts
  addSiteContact: (contact: Omit<SiteContact, 'id'>) => string;
  updateSiteContact: (id: string, updates: Partial<SiteContact>) => void;
  deleteSiteContact: (id: string) => void;

  // Quotations
  addQuotation: (quotation: Omit<Quotation, 'id'>) => string;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  // Site Visits
  addSiteVisit: (visit: Omit<SiteVisit, 'id'>) => string;
  updateSiteVisit: (id: string, updates: Partial<SiteVisit>) => void;
  deleteSiteVisit: (id: string) => void;

  // Client Advances & Expenses
  addClientAdvance: (advance: Omit<ClientAdvanceExpense, 'id' | 'balancePending' | 'paymentStatus'>) => string;
  updateClientAdvance: (id: string, updates: Partial<ClientAdvanceExpense>) => void;
  deleteClientAdvance: (id: string) => void;

  // Company Expenses
  addCompanyExpense: (expense: Omit<CompanyExpense, 'id' | 'balanceOutstanding'>) => string;
  updateCompanyExpense: (id: string, updates: Partial<CompanyExpense>) => void;
  deleteCompanyExpense: (id: string) => void;
  markExpenseAsPaid: (id: string) => void;

  // Master Lists
  addItemToList: (category: keyof MasterLists, item: string) => void;
  removeItemFromList: (category: keyof MasterLists, item: string) => void;
  resetMasterLists: () => void;
}

function computeAdvanceStatus(
  advanced: number,
  spent: number,
  returned: number
): { balancePending: number; paymentStatus: AdvancePaymentStatus } {
  const pending = sanitizeNumber(advanced - spent - returned, 0, true);
  let status: AdvancePaymentStatus = 'Settled';
  if (pending > 0) {
    status = 'Pending Return';
  } else if (pending < 0) {
    status = 'Company Payable';
  }
  return { balancePending: pending, paymentStatus: status };
}

/**
 * Recomputes quotation rollup totals and latest quote number for a client,
 * ensuring consistency between Quotations sub-tables and Client overview rows.
 */
function recomputeClientQuotationRollup(
  clientId: string,
  quotations: Quotation[],
  clients: Client[]
): Client[] {
  const clientQuotes = quotations.filter((q) => q.clientId === clientId);
  const totalAmt = clientQuotes.reduce((acc, q) => acc + (q.totalAmount || q.amount || 0), 0);
  const recAmt = clientQuotes.reduce((acc, q: any) => acc + (q.amountReceived || q.receivedAmount || 0), 0);

  // Sort quotes by date descending to determine most recent quote number
  const sortedQuotes = [...clientQuotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestQuoteNo = sortedQuotes[0]?.quotationNo || '';

  return clients.map((c) =>
    c.id === clientId
      ? {
          ...c,
          totalAmount: totalAmt,
          receivedAmount: recAmt,
          quotationNo: latestQuoteNo || c.quotationNo,
        }
      : c
  );
}

/**
 * Recomputes follow-up dates, results, and assigned technician for a client
 * based on all historical site visits/calls, ensuring consistency across screens.
 */
function recomputeClientFollowUpRollup(
  clientId: string,
  visits: SiteVisit[],
  clients: Client[]
): Client[] {
  const clientVisits = visits.filter((v) => v.clientId === clientId);
  if (clientVisits.length === 0) return clients;

  // Sort visits by date descending
  const sorted = [...clientVisits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestVisit = sorted[0];

  // Determine the next scheduled follow-up
  const today = new Date().toISOString().split('T')[0];
  const upcomingVisits = clientVisits
    .filter((v) => v.nextDate && v.nextDate >= today)
    .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime());
  const nextDate = upcomingVisits[0]?.nextDate || latestVisit.nextDate;

  return clients.map((c) =>
    c.id === clientId
      ? {
          ...c,
          lastFollowUpDate: latestVisit.date || c.lastFollowUpDate,
          nextFollowUpDate: nextDate || c.nextFollowUpDate,
          result: latestVisit.result || c.result,
          assignedTo: latestVisit.assignedTo || c.assignedTo,
        }
      : c
  );
}

/**
 * Dispatch background sync payload to server / Google Sheets without leaking secrets.
 */
function syncToServer(payload: { action: string; data: any }) {
  if (typeof window === 'undefined') return;
  try {
    const state = useCRMStore.getState();
    const webhookUrl = state.googleSheetWebhookUrl;

    fetch('/api/sync-google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        webhookUrl: webhookUrl || undefined,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          console.warn('[DataSync] Google Sheet background sync warning:', json.error);
        } else if (json.sheetPushed) {
          console.log('[DataSync] Successfully pushed to Google Sheet:', json.message);
        }
      })
      .catch((err) => {
        console.warn('[DataSync] Background network issue (offline/unreachable)');
      });
  } catch (err) {
    console.warn('[DataSync] Failed to dispatch background sync');
  }
}

/**
 * Persists demo business data into dedicated DEMO_DATA partition.
 */
function persistDemoDataState(data: {
  clients: Client[];
  siteContacts: SiteContact[];
  quotations: Quotation[];
  siteVisits: SiteVisit[];
  clientAdvances: ClientAdvanceExpense[];
  companyExpenses: CompanyExpense[];
  masterLists: MasterLists;
  lastSyncedAt: string | null;
}) {
  safeSaveStorage(STORAGE_KEYS.DEMO_DATA, {
    clients: data.clients,
    siteContacts: data.siteContacts,
    quotations: data.quotations,
    siteVisits: data.siteVisits,
    clientAdvances: data.clientAdvances,
    companyExpenses: data.companyExpenses,
    masterLists: data.masterLists,
    lastSyncedAt: data.lastSyncedAt,
  });
}

/**
 * Persists user preferences into dedicated USER_PREFERENCES partition.
 */
function persistUserPreferences(prefs: { googleSheetWebhookUrl?: string }) {
  const current = safeLoadStorage(STORAGE_KEYS.USER_PREFERENCES, (raw) => raw || {}, {});
  safeSaveStorage(STORAGE_KEYS.USER_PREFERENCES, {
    ...current.data,
    ...prefs,
  });
}

/**
 * Persists active user session and admin-created custom users.
 * STRICT SECURITY GUARANTEE: Never serializes passwords, recovery keys, or tokens.
 */
function persistAuthSession(auth: {
  currentUser: UserProfile | null;
  users: UserProfile[];
}) {
  const safeCurrentUser = auth.currentUser ? sanitizeSensitiveFields(auth.currentUser) : null;
  // Persist only custom users created beyond initial built-in users
  const customUsers = auth.users
    .filter((u) => !initialUsers.some((iu) => iu.id === u.id))
    .map(sanitizeSensitiveFields);

  safeSaveStorage(STORAGE_KEYS.AUTH_SESSION, {
    currentUser: safeCurrentUser,
    customUsers,
  });
}

export const useCRMStore = create<CRMStoreState>((set, get) => ({
  clients: initialClients,
  siteContacts: initialSiteContacts,
  quotations: initialQuotations,
  siteVisits: initialSiteVisits,
  clientAdvances: initialClientAdvances,
  companyExpenses: initialCompanyExpenses,
  masterLists: initialMasterLists,
  users: initialUsers,
  currentUser: null,
  isHydrated: false,
  isSyncing: false,
  lastSyncedAt: null,
  googleSheetWebhookUrl: '',
  storageHealth: {
    isRepaired: false,
    wasCorrupted: false,
    lastValidatedAt: null,
  },
  sessionTerminationReason: null,
  clearSessionTerminationReason: () => set({ sessionTerminationReason: null }),

  setGoogleSheetWebhookUrl: (url: string) => {
    const sanitizedUrl = sanitizeString(url);
    set({ googleSheetWebhookUrl: sanitizedUrl });
    persistUserPreferences({ googleSheetWebhookUrl: sanitizedUrl });
  },

  syncAllToGoogleSheet: async () => {
    set({ isSyncing: true });
    try {
      const state = get();
      const res = await fetch('/api/sync-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_all',
          data: { clients: state.clients },
          webhookUrl: state.googleSheetWebhookUrl || undefined,
        }),
      });
      const json = await res.json();
      const syncedTimestamp = new Date().toISOString();
      set({ isSyncing: false, lastSyncedAt: syncedTimestamp });
      persistDemoDataState({
        clients: state.clients,
        siteContacts: state.siteContacts,
        quotations: state.quotations,
        siteVisits: state.siteVisits,
        clientAdvances: state.clientAdvances,
        companyExpenses: state.companyExpenses,
        masterLists: state.masterLists,
        lastSyncedAt: syncedTimestamp,
      });

      if (!json.success) throw new Error(json.error || 'Failed to sync');
      return {
        success: true,
        message: json.message || 'Pushed all records to Google Sheet',
        sheetPushed: json.sheetPushed,
      };
    } catch (err: any) {
      set({ isSyncing: false });
      return { success: false, message: err.message || 'Sync failed', sheetPushed: false };
    }
  },

  init: () => {
    if (typeof window === 'undefined') return;

    let wasCorrupted = false;
    let isRepaired = false;

    try {
      // 1. Backwards-compatible migration from legacy monolithic store key
      const legacyRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_MONOLITH);
      if (legacyRaw && !localStorage.getItem(STORAGE_KEYS.DEMO_DATA)) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw);
          if (parsedLegacy && typeof parsedLegacy === 'object') {
            // Migrate user preferences
            if (parsedLegacy.googleSheetWebhookUrl) {
              persistUserPreferences({ googleSheetWebhookUrl: parsedLegacy.googleSheetWebhookUrl });
            }
            // Migrate auth session
            if (parsedLegacy.currentUser || parsedLegacy.users) {
              persistAuthSession({
                currentUser: parsedLegacy.currentUser || null,
                users: parsedLegacy.users || initialUsers,
              });
            }
            // Migrate demo business records
            persistDemoDataState({
              clients: parsedLegacy.clients || initialClients,
              siteContacts: parsedLegacy.siteContacts || initialSiteContacts,
              quotations: parsedLegacy.quotations || initialQuotations,
              siteVisits: parsedLegacy.siteVisits || initialSiteVisits,
              clientAdvances: parsedLegacy.clientAdvances || initialClientAdvances,
              companyExpenses: parsedLegacy.companyExpenses || initialCompanyExpenses,
              masterLists: parsedLegacy.masterLists || initialMasterLists,
              lastSyncedAt: parsedLegacy.lastSyncedAt || new Date().toISOString(),
            });
          }
        } catch {
          wasCorrupted = true;
          isRepaired = true;
        }
      }

      // 2. Load and validate demo business data partition
      const demoResult = safeLoadStorage(
        STORAGE_KEYS.DEMO_DATA,
        (raw) => ({
          clients: validateClients(raw.clients, initialClients),
          siteContacts: validateSiteContacts(raw.siteContacts, initialSiteContacts),
          quotations: validateQuotations(raw.quotations, initialQuotations),
          siteVisits: validateSiteVisits(raw.siteVisits, initialSiteVisits),
          clientAdvances: validateClientAdvances(raw.clientAdvances, initialClientAdvances),
          companyExpenses: validateCompanyExpenses(raw.companyExpenses, initialCompanyExpenses),
          masterLists: validateMasterLists(raw.masterLists, initialMasterLists),
          lastSyncedAt: sanitizeDate(raw.lastSyncedAt, new Date().toISOString()),
        }),
        {
          clients: initialClients,
          siteContacts: initialSiteContacts,
          quotations: initialQuotations,
          siteVisits: initialSiteVisits,
          clientAdvances: initialClientAdvances,
          companyExpenses: initialCompanyExpenses,
          masterLists: initialMasterLists,
          lastSyncedAt: new Date().toISOString(),
        }
      );

      if (demoResult.wasCorrupted || demoResult.isRepaired) {
        wasCorrupted = wasCorrupted || demoResult.wasCorrupted;
        isRepaired = true;
      }

      // Upgrade small legacy demo datasets to full 68-record dataset if applicable
      const loadedClients =
        demoResult.data.clients && demoResult.data.clients.length > 10
          ? demoResult.data.clients
          : initialClients;

      // 3. Load user preferences partition
      const prefsResult = safeLoadStorage(
        STORAGE_KEYS.USER_PREFERENCES,
        (raw) => ({
          googleSheetWebhookUrl: sanitizeString(raw.googleSheetWebhookUrl, ''),
        }),
        { googleSheetWebhookUrl: '' }
      );

      // 4. Load auth session partition
      const authResult = safeLoadStorage(
        STORAGE_KEYS.AUTH_SESSION,
        (raw) => ({
          currentUser: raw.currentUser ? validateSafeUserProfile(raw.currentUser) : null,
          customUsers: Array.isArray(raw.customUsers)
            ? raw.customUsers.map(validateSafeUserProfile).filter(Boolean)
            : [],
        }),
        { currentUser: null, customUsers: [] }
      );

      // Assemble all user profiles: built-in initial users + persisted custom users
      const customUserList: UserProfile[] = (authResult.data.customUsers as SafeUserProfile[]).map((cu) => ({
        ...cu,
        password: 'password123', // Prototype default mock password for custom profiles
      }));

      // Combine built-in users and custom admin-created profiles
      const fullUsersList: UserProfile[] = [
        ...initialUsers,
        ...customUserList.filter((cu) => !initialUsers.some((iu) => iu.id === cu.id)),
      ];

      // Validate active session
      let activeUser: UserProfile | null = authResult.data.currentUser as UserProfile | null;
      let sessionTerminationReason: 'expired' | 'revoked' | null = null;
      if (activeUser) {
        if (activeUser.sessionExpiry && Date.now() > activeUser.sessionExpiry) {
          activeUser = null;
          sessionTerminationReason = 'expired';
          persistAuthSession({ currentUser: null, users: fullUsersList });
        } else {
          const fresh = fullUsersList.find((u) => u.id === activeUser?.id);
          if (!fresh) {
            activeUser = null;
            persistAuthSession({ currentUser: null, users: fullUsersList });
          } else if (fresh.status === 'revoked') {
            activeUser = null;
            sessionTerminationReason = 'revoked';
            persistAuthSession({ currentUser: null, users: fullUsersList });
          } else {
            activeUser = {
              ...fresh,
              sessionExpiry: activeUser.sessionExpiry,
            };
          }
        }
      }

      set({
        clients: loadedClients,
        siteContacts: demoResult.data.siteContacts,
        quotations: demoResult.data.quotations,
        siteVisits: demoResult.data.siteVisits,
        clientAdvances: demoResult.data.clientAdvances,
        companyExpenses: demoResult.data.companyExpenses,
        masterLists: demoResult.data.masterLists,
        users: fullUsersList,
        currentUser: activeUser,
        sessionTerminationReason,
        lastSyncedAt: demoResult.data.lastSyncedAt,
        googleSheetWebhookUrl: prefsResult.data.googleSheetWebhookUrl,
        storageHealth: {
          isRepaired,
          wasCorrupted,
          lastValidatedAt: new Date().toISOString(),
        },
        isHydrated: true,
      });
      return;
    } catch (e) {
      console.warn('[DataIntegrity] Storage recovery fallback initiated.');
    }

    set({
      isHydrated: true,
      storageHealth: {
        isRepaired: true,
        wasCorrupted: true,
        lastValidatedAt: new Date().toISOString(),
      },
    });
  },

  /**
   * FACTORY DEMO RESET:
   * Resets ONLY the business demo data back to Excel baseline values.
   * STRICT INTEGRITY GUARANTEE:
   * - Does NOT log the active user out (preserves currentUser)
   * - Does NOT clear unrelated user settings (preserves googleSheetWebhookUrl, theme, UI preferences)
   * - Does NOT delete admin-created user accounts
   */
  resetToFactoryDemo: () => {
    const state = get();
    const syncedTimestamp = new Date().toISOString();

    set({
      clients: initialClients,
      siteContacts: initialSiteContacts,
      quotations: initialQuotations,
      siteVisits: initialSiteVisits,
      clientAdvances: initialClientAdvances,
      companyExpenses: initialCompanyExpenses,
      masterLists: initialMasterLists,
      lastSyncedAt: syncedTimestamp,
    });

    // Remove or reset ONLY the business demo partition
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.DEMO_DATA);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_MONOLITH);
    }

    // Persist clean factory demo data
    persistDemoDataState({
      clients: initialClients,
      siteContacts: initialSiteContacts,
      quotations: initialQuotations,
      siteVisits: initialSiteVisits,
      clientAdvances: initialClientAdvances,
      companyExpenses: initialCompanyExpenses,
      masterLists: initialMasterLists,
      lastSyncedAt: syncedTimestamp,
    });

    // User preferences & session remain safely intact
  },

  syncFromGoogleSheet: async () => {
    set({ isSyncing: true });
    try {
      const res = await fetch('/api/sync-google-sheet');
      if (!res.ok) {
        throw new Error(`Sync failed with HTTP status ${res.status}`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to fetch Google Sheet data');
      }

      const { clients, siteContacts, quotations, siteVisits, companyExpenses, masterLists } = json.data;
      const syncedTimestamp = new Date().toISOString();

      set((state) => {
        const nextClients = clients && clients.length > 0 ? validateClients(clients, state.clients) : state.clients;
        const nextContacts = siteContacts && siteContacts.length > 0 ? validateSiteContacts(siteContacts, state.siteContacts) : state.siteContacts;
        const nextQuotes = quotations && quotations.length > 0 ? validateQuotations(quotations, state.quotations) : state.quotations;
        const nextVisits = siteVisits && siteVisits.length > 0 ? validateSiteVisits(siteVisits, state.siteVisits) : state.siteVisits;
        const nextExpenses = companyExpenses && companyExpenses.length > 0 ? validateCompanyExpenses(companyExpenses, state.companyExpenses) : state.companyExpenses;
        const nextLists = masterLists ? validateMasterLists(masterLists, state.masterLists) : state.masterLists;

        persistDemoDataState({
          clients: nextClients,
          siteContacts: nextContacts,
          quotations: nextQuotes,
          siteVisits: nextVisits,
          clientAdvances: state.clientAdvances,
          companyExpenses: nextExpenses,
          masterLists: nextLists,
          lastSyncedAt: syncedTimestamp,
        });

        return {
          clients: nextClients,
          siteContacts: nextContacts,
          quotations: nextQuotes,
          siteVisits: nextVisits,
          companyExpenses: nextExpenses,
          masterLists: nextLists,
          lastSyncedAt: syncedTimestamp,
          isSyncing: false,
        };
      });

      return { success: true, count: clients ? clients.length : 0 };
    } catch (err: any) {
      console.warn('[DataSync] Google Sheet Sync warning:', err.message);
      set({ isSyncing: false });
      return { success: false, count: 0, error: err.message || 'Sync failed' };
    }
  },

  // Client actions
  addClient: (clientData) => {
    const newId = `c-${Date.now().toString(36)}`;
    const now = new Date().toISOString().split('T')[0];

    const validated = validateClient(
      {
        ...clientData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      },
      newId
    );

    const clientToAdd: Client = validated || {
      ...clientData,
      id: newId,
      totalAmount: sanitizeNumber(clientData.totalAmount, 0),
      receivedAmount: sanitizeNumber(clientData.receivedAmount, 0),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const nextClients = [clientToAdd, ...state.clients];
      persistDemoDataState({
        ...state,
        clients: nextClients,
      });
      return { clients: nextClients };
    });

    syncToServer({ action: 'add_client', data: clientToAdd });
    return newId;
  },

  updateClient: (id, updates) => {
    let updatedClient: Client | undefined;
    set((state) => {
      const nextClients = state.clients.map((c) => {
        if (c.id === id) {
          const raw = {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          updatedClient = validateClient(raw, id) || raw;
          return updatedClient;
        }
        return c;
      });

      persistDemoDataState({
        ...state,
        clients: nextClients,
      });
      return { clients: nextClients };
    });

    if (updatedClient) {
      syncToServer({ action: 'update_client', data: updatedClient });
    }
  },

  deleteClient: (id) => {
    const clientToDelete = get().clients.find((c) => c.id === id);
    set((state) => {
      const nextClients = state.clients.filter((c) => c.id !== id);
      const nextContacts = state.siteContacts.filter((c) => c.clientId !== id);
      const nextQuotations = state.quotations.filter((q) => q.clientId !== id);
      const nextVisits = state.siteVisits.filter((v) => v.clientId !== id);
      const nextAdvances = state.clientAdvances.filter((a) => a.clientId !== id);

      persistDemoDataState({
        ...state,
        clients: nextClients,
        siteContacts: nextContacts,
        quotations: nextQuotations,
        siteVisits: nextVisits,
        clientAdvances: nextAdvances,
      });

      return {
        clients: nextClients,
        siteContacts: nextContacts,
        quotations: nextQuotations,
        siteVisits: nextVisits,
        clientAdvances: nextAdvances,
      };
    });

    if (clientToDelete) {
      syncToServer({ action: 'delete_client', data: clientToDelete });
    }
  },

  updateClientStatus: (id, status) => {
    get().updateClient(id, { status });
  },

  updateClientAssignedTo: (id, assignedTo) => {
    get().updateClient(id, { assignedTo });
  },

  updateClientResult: (id, result) => {
    get().updateClient(id, { result });
  },

  // Site Contacts
  addSiteContact: (contactData) => {
    const newId = `sc-${Date.now().toString(36)}`;
    const validContact = validateSiteContact({ ...contactData, id: newId }) || {
      ...contactData,
      id: newId,
    };

    set((state) => {
      const next = [...state.siteContacts, validContact];
      persistDemoDataState({
        ...state,
        siteContacts: next,
      });
      return { siteContacts: next };
    });
    return newId;
  },

  updateSiteContact: (id, updates) => {
    set((state) => {
      const next = state.siteContacts.map((sc) =>
        sc.id === id ? validateSiteContact({ ...sc, ...updates }) || { ...sc, ...updates } : sc
      );
      persistDemoDataState({
        ...state,
        siteContacts: next,
      });
      return { siteContacts: next };
    });
  },

  deleteSiteContact: (id) => {
    set((state) => {
      const next = state.siteContacts.filter((sc) => sc.id !== id);
      persistDemoDataState({
        ...state,
        siteContacts: next,
      });
      return { siteContacts: next };
    });
  },

  // Quotations (with synchronized Client rollups)
  addQuotation: (quotationData) => {
    const newId = `q-${Date.now().toString(36)}`;
    const validQuote = validateQuotation({
      ...quotationData,
      id: newId,
      totalAmount: quotationData.totalAmount || quotationData.amount || 0,
    }) || {
      ...quotationData,
      id: newId,
      amount: quotationData.totalAmount || quotationData.amount || 0,
      totalAmount: quotationData.totalAmount || quotationData.amount || 0,
    };

    set((state) => {
      const nextQuotes = [validQuote, ...state.quotations];
      // Automatically recompute Client total quoted, received, and quotation number
      const nextClients = recomputeClientQuotationRollup(
        quotationData.clientId,
        nextQuotes,
        state.clients
      );

      persistDemoDataState({
        ...state,
        quotations: nextQuotes,
        clients: nextClients,
      });

      const targetClient = nextClients.find((c) => c.id === quotationData.clientId);
      if (targetClient) {
        syncToServer({ action: 'update_client', data: targetClient });
      }

      return { quotations: nextQuotes, clients: nextClients };
    });

    return newId;
  },

  updateQuotation: (id, updates) => {
    set((state) => {
      const existingQuote = state.quotations.find((q) => q.id === id);
      if (!existingQuote) return state;

      const previousClientId = existingQuote.clientId;
      const nextQuotes = state.quotations.map((q) => {
        if (q.id === id) {
          const raw = {
            ...q,
            ...updates,
            totalAmount:
              updates.totalAmount !== undefined
                ? updates.totalAmount
                : updates.amount !== undefined
                ? updates.amount
                : q.totalAmount,
          };
          return validateQuotation(raw) || raw;
        }
        return q;
      });

      const updatedQuote = nextQuotes.find((q) => q.id === id);
      let nextClients = state.clients;

      if (updatedQuote) {
        // Rollup for current client
        nextClients = recomputeClientQuotationRollup(updatedQuote.clientId, nextQuotes, nextClients);

        // If client reassignment occurred, update previous client rollup as well
        if (previousClientId && previousClientId !== updatedQuote.clientId) {
          nextClients = recomputeClientQuotationRollup(previousClientId, nextQuotes, nextClients);
        }

        const targetClient = nextClients.find((c) => c.id === updatedQuote.clientId);
        if (targetClient) {
          syncToServer({ action: 'update_client', data: targetClient });
        }
      }

      persistDemoDataState({
        ...state,
        quotations: nextQuotes,
        clients: nextClients,
      });

      return { quotations: nextQuotes, clients: nextClients };
    });
  },

  deleteQuotation: (id) => {
    set((state) => {
      const quoteToDelete = state.quotations.find((q) => q.id === id);
      const nextQuotes = state.quotations.filter((q) => q.id !== id);

      let nextClients = state.clients;
      if (quoteToDelete) {
        nextClients = recomputeClientQuotationRollup(
          quoteToDelete.clientId,
          nextQuotes,
          state.clients
        );

        const targetClient = nextClients.find((c) => c.id === quoteToDelete.clientId);
        if (targetClient) {
          syncToServer({ action: 'update_client', data: targetClient });
        }
      }

      persistDemoDataState({
        ...state,
        quotations: nextQuotes,
        clients: nextClients,
      });

      return { quotations: nextQuotes, clients: nextClients };
    });
  },

  // Site Visits (with synchronized Client follow-up rollups)
  addSiteVisit: (visitData) => {
    const newId = `v-${Date.now().toString(36)}`;
    const validVisit = validateSiteVisit({ ...visitData, id: newId }) || {
      ...visitData,
      id: newId,
    };

    set((state) => {
      const nextVisits = [validVisit, ...state.siteVisits];
      // Automatically recompute Client follow-up dates, outcome result, and technician
      const nextClients = recomputeClientFollowUpRollup(
        visitData.clientId,
        nextVisits,
        state.clients
      );

      persistDemoDataState({
        ...state,
        siteVisits: nextVisits,
        clients: nextClients,
      });

      const updatedClient = nextClients.find((c) => c.id === visitData.clientId);
      if (updatedClient) {
        syncToServer({ action: 'update_client', data: updatedClient });
      }

      return { siteVisits: nextVisits, clients: nextClients };
    });

    return newId;
  },

  updateSiteVisit: (id, updates) => {
    set((state) => {
      const existingVisit = state.siteVisits.find((v) => v.id === id);
      if (!existingVisit) return state;

      const nextVisits = state.siteVisits.map((v) => {
        if (v.id === id) {
          const raw = { ...v, ...updates };
          return validateSiteVisit(raw) || raw;
        }
        return v;
      });

      // Synchronize client follow-up rollup dynamically
      const nextClients = recomputeClientFollowUpRollup(
        existingVisit.clientId,
        nextVisits,
        state.clients
      );

      persistDemoDataState({
        ...state,
        siteVisits: nextVisits,
        clients: nextClients,
      });

      return { siteVisits: nextVisits, clients: nextClients };
    });
  },

  deleteSiteVisit: (id) => {
    set((state) => {
      const visitToDelete = state.siteVisits.find((v) => v.id === id);
      const nextVisits = state.siteVisits.filter((v) => v.id !== id);

      let nextClients = state.clients;
      if (visitToDelete) {
        nextClients = recomputeClientFollowUpRollup(
          visitToDelete.clientId,
          nextVisits,
          state.clients
        );
      }

      persistDemoDataState({
        ...state,
        siteVisits: nextVisits,
        clients: nextClients,
      });

      return { siteVisits: nextVisits, clients: nextClients };
    });
  },

  // Client Advances
  addClientAdvance: (advanceData) => {
    const newId = `ca-${Date.now().toString(36)}`;
    const { balancePending, paymentStatus } = computeAdvanceStatus(
      advanceData.amountAdvanced,
      advanceData.actualAmountSpent,
      advanceData.balanceReturned
    );

    const validAdvance = validateClientAdvance({
      ...advanceData,
      id: newId,
      balancePending,
      paymentStatus,
    }) || {
      ...advanceData,
      id: newId,
      balancePending,
      paymentStatus,
    };

    set((state) => {
      const next = [validAdvance, ...state.clientAdvances];
      persistDemoDataState({
        ...state,
        clientAdvances: next,
      });
      return { clientAdvances: next };
    });

    return newId;
  },

  updateClientAdvance: (id, updates) => {
    set((state) => {
      const next = state.clientAdvances.map((adv) => {
        if (adv.id !== id) return adv;
        const advAmt = sanitizeNumber(
          updates.amountAdvanced !== undefined ? updates.amountAdvanced : adv.amountAdvanced,
          0
        );
        const spentAmt = sanitizeNumber(
          updates.actualAmountSpent !== undefined ? updates.actualAmountSpent : adv.actualAmountSpent,
          0
        );
        const retAmt = sanitizeNumber(
          updates.balanceReturned !== undefined ? updates.balanceReturned : adv.balanceReturned,
          0
        );
        const { balancePending, paymentStatus } = computeAdvanceStatus(advAmt, spentAmt, retAmt);

        const raw = {
          ...adv,
          ...updates,
          amountAdvanced: advAmt,
          actualAmountSpent: spentAmt,
          balanceReturned: retAmt,
          balancePending,
          paymentStatus,
        };

        return validateClientAdvance(raw) || raw;
      });

      persistDemoDataState({
        ...state,
        clientAdvances: next,
      });
      return { clientAdvances: next };
    });
  },

  deleteClientAdvance: (id) => {
    set((state) => {
      const next = state.clientAdvances.filter((a) => a.id !== id);
      persistDemoDataState({
        ...state,
        clientAdvances: next,
      });
      return { clientAdvances: next };
    });
  },

  // Company Expenses
  addCompanyExpense: (expData) => {
    const newId = `exp-${Date.now().toString(36)}`;
    const amt = sanitizeNumber(expData.amount, 0);
    const paid = sanitizeNumber(expData.amountPaid || 0, 0);
    const balance = sanitizeNumber(amt - paid, 0, true);

    const validExp = validateCompanyExpense({
      ...expData,
      id: newId,
      amount: amt,
      amountPaid: paid,
      balanceOutstanding: balance,
    }) || {
      ...expData,
      id: newId,
      amount: amt,
      amountPaid: paid,
      balanceOutstanding: balance,
    };

    set((state) => {
      const next = [validExp, ...state.companyExpenses];
      persistDemoDataState({
        ...state,
        companyExpenses: next,
      });
      return { companyExpenses: next };
    });

    return newId;
  },

  updateCompanyExpense: (id, updates) => {
    set((state) => {
      const next = state.companyExpenses.map((exp) => {
        if (exp.id !== id) return exp;
        const amt = sanitizeNumber(updates.amount !== undefined ? updates.amount : exp.amount, 0);
        const paid = sanitizeNumber(
          updates.amountPaid !== undefined ? updates.amountPaid : exp.amountPaid,
          0
        );
        const balance = sanitizeNumber(amt - paid, 0, true);

        const raw = {
          ...exp,
          ...updates,
          amount: amt,
          amountPaid: paid,
          balanceOutstanding: balance,
        };

        return validateCompanyExpense(raw) || raw;
      });

      persistDemoDataState({
        ...state,
        companyExpenses: next,
      });
      return { companyExpenses: next };
    });
  },

  deleteCompanyExpense: (id) => {
    set((state) => {
      const next = state.companyExpenses.filter((e) => e.id !== id);
      persistDemoDataState({
        ...state,
        companyExpenses: next,
      });
      return { companyExpenses: next };
    });
  },

  markExpenseAsPaid: (id) => {
    set((state) => {
      const next = state.companyExpenses.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              paymentStatus: 'Paid' as const,
              amountPaid: exp.amount,
              balanceOutstanding: 0,
            }
          : exp
      );

      persistDemoDataState({
        ...state,
        companyExpenses: next,
      });
      return { companyExpenses: next };
    });
  },

  // Master Lists
  addItemToList: (category, item) => {
    const trimmed = sanitizeString(item);
    if (!trimmed) return;
    set((state) => {
      const current = state.masterLists[category] || [];
      if (current.includes(trimmed)) return state;
      const nextLists = {
        ...state.masterLists,
        [category]: [...current, trimmed],
      };

      persistDemoDataState({
        ...state,
        masterLists: nextLists,
      });
      return { masterLists: nextLists };
    });
  },

  removeItemFromList: (category, item) => {
    set((state) => {
      const current = state.masterLists[category] || [];
      const nextLists = {
        ...state.masterLists,
        [category]: current.filter((x) => x !== item),
      };

      persistDemoDataState({
        ...state,
        masterLists: nextLists,
      });
      return { masterLists: nextLists };
    });
  },

  resetMasterLists: () => {
    set((state) => {
      persistDemoDataState({
        ...state,
        masterLists: initialMasterLists,
      });
      return { masterLists: initialMasterLists };
    });
  },

  // Authentication Actions
  login: async (email, password) => {
    const emailVal = validateAllowedEmail(email);
    if (!emailVal.valid) {
      return { success: false, error: emailVal.error || 'Please use your @brainmachine.com email address.' };
    }
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }
    const trimmedEmail = emailVal.normalized;

    // 1. Primary: Verify authorization on trusted server API endpoint
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid email address or password. Please verify your credentials.',
        };
      }

      const safeUser = data.user as SafeUserProfile;
      const state = get();
      const updatedUser: UserProfile = {
        ...safeUser,
      };

      const userExists = state.users.some((u) => u.id === safeUser.id);
      const nextUsers = userExists
        ? state.users.map((u) => (u.id === safeUser.id ? updatedUser : u))
        : [updatedUser, ...state.users];
      set({
        users: nextUsers,
        currentUser: updatedUser,
        sessionTerminationReason: null,
      });

      persistAuthSession({ currentUser: updatedUser, users: nextUsers });
      return { success: true };
    } catch {
      // 2. Offline fallback mode if server endpoint is unreachable
      const state = get();
      const user = state.users.find((u) => u.email.toLowerCase() === trimmedEmail);
      if (!user) {
        return { success: false, error: 'Invalid email address or password. Please verify your credentials.' };
      }
      if (user.status === 'revoked') {
        return {
          success: false,
          error:
            'Access Revoked. Your login profile has been deactivated by an administrator. Please contact your system administrator.',
        };
      }

      // Security check: Verify password in offline fallback
      if (user.password && user.password !== password) {
        return {
          success: false,
          error: 'Invalid email address or password. Please verify your credentials.',
        };
      }
      if (!user.password) {
        return {
          success: false,
          error: 'Authentication server is unreachable. Please verify your network connection or try again.',
        };
      }

      const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
      const updatedUser: UserProfile = {
        ...user,
        lastLoginAt: new Date().toISOString(),
        sessionExpiry: Date.now() + SESSION_DURATION_MS,
      };

      const nextUsers = state.users.map((u) => (u.id === user.id ? updatedUser : u));
      set({
        users: nextUsers,
        currentUser: updatedUser,
        sessionTerminationReason: null,
      });

      persistAuthSession({ currentUser: updatedUser, users: nextUsers });
      return { success: true };
    }
  },

  logout: () => {
    const state = get();
    set({ currentUser: null, sessionTerminationReason: null });
    persistAuthSession({ currentUser: null, users: state.users });
  },

  validateSession: () => {
    const state = get();
    if (!state.currentUser) return { valid: false };

    // 1. Session duration expiration
    if (state.currentUser.sessionExpiry && Date.now() > state.currentUser.sessionExpiry) {
      set({ currentUser: null });
      persistAuthSession({ currentUser: null, users: state.users });
      return { valid: false, reason: 'expired' as const };
    }

    // 2. Active status verification in users directory
    const freshUser = state.users.find((u) => u.id === state.currentUser?.id);
    if (!freshUser) {
      set({ currentUser: null });
      persistAuthSession({ currentUser: null, users: state.users });
      return { valid: false, reason: 'notFound' as const };
    }
    if (freshUser.status === 'revoked') {
      set({ currentUser: null });
      persistAuthSession({ currentUser: null, users: state.users });
      return { valid: false, reason: 'revoked' as const };
    }

    // 3. Keep current session synchronized with admin modifications
    if (
      freshUser.name !== state.currentUser.name ||
      freshUser.role !== state.currentUser.role ||
      freshUser.email !== state.currentUser.email
    ) {
      const syncedUser: UserProfile = {
        ...freshUser,
        sessionExpiry: state.currentUser.sessionExpiry,
      };
      set({ currentUser: syncedUser });
      persistAuthSession({ currentUser: syncedUser, users: state.users });
    }

    return { valid: true };
  },

  adminResetPassword: async (email, recoveryKey, newPassword) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedKey = recoveryKey.trim();

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters long.',
      };
    }

    // Verify on trusted server route
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, recoveryKey: trimmedKey, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Password reset failed.',
        };
      }
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'An unexpected network error occurred while communicating with verification server.',
      };
    }
  },

  // Admin User Profile Management Actions
  createUserProfile: (userData) => {
    const emailVal = validateAllowedEmail(userData.email);
    if (!emailVal.valid) {
      return { success: false, error: emailVal.error || 'Please use your @brainmachine.com email address.' };
    }
    const trimmedEmail = emailVal.normalized;
    const state = get();
    const existing = state.users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: 'A profile with this email address already exists.' };
    }

    const newId = `user-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      ...userData,
      id: newId,
      email: trimmedEmail,
      status: userData.status || 'active',
      recoveryKey: userData.role === 'admin' ? userData.recoveryKey || undefined : undefined,
      createdAt: now,
    };

    const nextUsers = [newUser, ...state.users];
    set({ users: nextUsers });
    persistAuthSession({ currentUser: state.currentUser, users: nextUsers });
    return { success: true, id: newId };
  },

  updateUserProfile: (id, updates) => {
    set((state) => {
      const normalizedUpdates = updates.email
        ? { ...updates, email: updates.email.trim().toLowerCase() }
        : updates;
      const nextUsers = state.users.map((u) => (u.id === id ? { ...u, ...normalizedUpdates } : u));
      let nextCurrentUser = state.currentUser;
      if (nextCurrentUser?.id === id) {
        nextCurrentUser = { ...nextCurrentUser, ...normalizedUpdates };
      }
      persistAuthSession({ currentUser: nextCurrentUser, users: nextUsers });
      return { users: nextUsers, currentUser: nextCurrentUser };
    });
  },

  revokeUserAccess: (id) => {
    set((state) => {
      const nextUsers = state.users.map((u) =>
        u.id === id ? { ...u, status: 'revoked' as const } : u
      );
      let nextCurrentUser = state.currentUser;
      if (nextCurrentUser?.id === id) {
        nextCurrentUser = null;
      }
      persistAuthSession({ currentUser: nextCurrentUser, users: nextUsers });
      return { users: nextUsers, currentUser: nextCurrentUser };
    });
  },

  activateUserAccess: (id) => {
    set((state) => {
      const nextUsers = state.users.map((u) =>
        u.id === id ? { ...u, status: 'active' as const } : u
      );
      persistAuthSession({ currentUser: state.currentUser, users: nextUsers });
      return { users: nextUsers };
    });
  },

  deleteUserProfile: (id) => {
    const state = get();
    const target = state.users.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: 'User profile not found.' };
    }
    const activeAdmins = state.users.filter((u) => u.role === 'admin' && u.status === 'active');
    if (target.role === 'admin' && activeAdmins.length <= 1) {
      return { success: false, error: 'Cannot delete the sole remaining active administrator account.' };
    }

    const nextUsers = state.users.filter((u) => u.id !== id);
    let nextCurrentUser = state.currentUser;
    if (nextCurrentUser?.id === id) {
      nextCurrentUser = null;
    }

    set({ users: nextUsers, currentUser: nextCurrentUser });
    persistAuthSession({ currentUser: nextCurrentUser, users: nextUsers });
    return { success: true };
  },
}));
