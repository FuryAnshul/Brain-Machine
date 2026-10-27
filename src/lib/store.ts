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

const STORAGE_KEY = 'home_automation_crm_store_v1';

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

  // Authentication & Session
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  adminResetPassword: (
    email: string,
    recoveryKey: string,
    newPassword: string
  ) => { success: boolean; error?: string };

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
  const pending = advanced - spent - returned;
  let status: AdvancePaymentStatus = 'Settled';
  if (pending > 0) {
    status = 'Pending Return';
  } else if (pending < 0) {
    status = 'Company Payable';
  }
  return { balancePending: pending, paymentStatus: status };
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
  currentUser: initialUsers[0],
  isHydrated: false,
  isSyncing: false,
  lastSyncedAt: null,

  init: () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved clients list was from the old mini-mock with <= 6 items, automatically upgrade to Google Sheet's 68 clients
        const clientsToLoad = (parsed.clients && parsed.clients.length > 10) ? parsed.clients : initialClients;
        const usersToLoad: UserProfile[] =
          parsed.users && parsed.users.length > 0 ? parsed.users : initialUsers;
        
        // Check current user session and ensure access hasn't been revoked
        let currentUserToLoad: UserProfile | null =
          parsed.currentUser !== undefined ? parsed.currentUser : initialUsers[0];
        if (currentUserToLoad) {
          const freshUser = usersToLoad.find((u) => u.id === currentUserToLoad?.id);
          if (freshUser && freshUser.status === 'revoked') {
            currentUserToLoad = null;
          } else if (freshUser) {
            currentUserToLoad = freshUser;
          }
        }

        set({
          clients: clientsToLoad,
          siteContacts: parsed.siteContacts && parsed.siteContacts.length > 5 ? parsed.siteContacts : initialSiteContacts,
          quotations: parsed.quotations && parsed.quotations.length > 5 ? parsed.quotations : initialQuotations,
          siteVisits: parsed.siteVisits && parsed.siteVisits.length > 5 ? parsed.siteVisits : initialSiteVisits,
          clientAdvances: parsed.clientAdvances || initialClientAdvances,
          companyExpenses: parsed.companyExpenses || initialCompanyExpenses,
          masterLists: parsed.masterLists || initialMasterLists,
          users: usersToLoad,
          currentUser: currentUserToLoad,
          lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
          isHydrated: true,
        });
        return;
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
    set({ isHydrated: true, lastSyncedAt: new Date().toISOString() });
  },

  resetToFactoryDemo: () => {
    set({
      clients: initialClients,
      siteContacts: initialSiteContacts,
      quotations: initialQuotations,
      siteVisits: initialSiteVisits,
      clientAdvances: initialClientAdvances,
      companyExpenses: initialCompanyExpenses,
      masterLists: initialMasterLists,
      users: initialUsers,
      currentUser: initialUsers[0],
      lastSyncedAt: new Date().toISOString(),
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
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
        const nextState = {
          clients: clients && clients.length > 0 ? clients : state.clients,
          siteContacts: siteContacts && siteContacts.length > 0 ? siteContacts : state.siteContacts,
          quotations: quotations && quotations.length > 0 ? quotations : state.quotations,
          siteVisits: siteVisits && siteVisits.length > 0 ? siteVisits : state.siteVisits,
          companyExpenses: companyExpenses && companyExpenses.length > 0 ? companyExpenses : state.companyExpenses,
          masterLists: masterLists ? masterLists : state.masterLists,
          lastSyncedAt: syncedTimestamp,
          isSyncing: false,
        };
        persistState(nextState);
        return nextState;
      });

      return { success: true, count: clients ? clients.length : 0 };
    } catch (err: any) {
      console.error('Google Sheet Sync Error:', err);
      set({ isSyncing: false });
      return { success: false, count: 0, error: err.message || 'Sync failed' };
    }
  },

  addClient: (clientData) => {
    const newId = `c-${Date.now().toString(36)}`;
    const now = new Date().toISOString().split('T')[0];
    const newClient: Client = {
      ...clientData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const nextClients = [newClient, ...state.clients];
      persistState({ clients: nextClients });
      return { clients: nextClients };
    });
    return newId;
  },

  updateClient: (id, updates) => {
    set((state) => {
      const nextClients = state.clients.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : c
      );
      persistState({ clients: nextClients });
      return { clients: nextClients };
    });
  },

  deleteClient: (id) => {
    set((state) => {
      const nextClients = state.clients.filter((c) => c.id !== id);
      const nextContacts = state.siteContacts.filter((c) => c.clientId !== id);
      const nextQuotations = state.quotations.filter((q) => q.clientId !== id);
      const nextVisits = state.siteVisits.filter((v) => v.clientId !== id);
      const nextAdvances = state.clientAdvances.filter((a) => a.clientId !== id);

      persistState({
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
    const newContact: SiteContact = { ...contactData, id: newId };
    set((state) => {
      const next = [...state.siteContacts, newContact];
      persistState({ siteContacts: next });
      return { siteContacts: next };
    });
    return newId;
  },

  updateSiteContact: (id, updates) => {
    set((state) => {
      const next = state.siteContacts.map((sc) => (sc.id === id ? { ...sc, ...updates } : sc));
      persistState({ siteContacts: next });
      return { siteContacts: next };
    });
  },

  deleteSiteContact: (id) => {
    set((state) => {
      const next = state.siteContacts.filter((sc) => sc.id !== id);
      persistState({ siteContacts: next });
      return { siteContacts: next };
    });
  },

  // Quotations
  addQuotation: (quotationData) => {
    const newId = `q-${Date.now().toString(36)}`;
    const newQuote: Quotation = {
      ...quotationData,
      id: newId,
      totalAmount: quotationData.totalAmount || quotationData.amount || 0,
    };
    set((state) => {
      const nextQuotes = [newQuote, ...state.quotations];
      // Sync client rollups
      const clientQuotes = nextQuotes.filter((q) => q.clientId === quotationData.clientId);
      const totalAmt = clientQuotes.reduce((acc, q) => acc + (q.totalAmount || q.amount || 0), 0);
      const recAmt = clientQuotes.reduce((acc, q) => acc + (q.amountReceived || 0), 0);

      const nextClients = state.clients.map((c) =>
        c.id === quotationData.clientId
          ? {
              ...c,
              quotationNo: newQuote.quotationNo,
              totalAmount: totalAmt,
              receivedAmount: recAmt,
            }
          : c
      );

      persistState({ quotations: nextQuotes, clients: nextClients });
      return { quotations: nextQuotes, clients: nextClients };
    });
    return newId;
  },

  updateQuotation: (id, updates) => {
    set((state) => {
      const nextQuotes = state.quotations.map((q) =>
        q.id === id
          ? {
              ...q,
              ...updates,
              totalAmount:
                updates.totalAmount !== undefined
                  ? updates.totalAmount
                  : updates.amount !== undefined
                  ? updates.amount
                  : q.totalAmount,
            }
          : q
      );

      const target = nextQuotes.find((q) => q.id === id);
      let nextClients = state.clients;
      if (target) {
        const clientQuotes = nextQuotes.filter((q) => q.clientId === target.clientId);
        const totalAmt = clientQuotes.reduce((acc, q) => acc + (q.totalAmount || q.amount || 0), 0);
        const recAmt = clientQuotes.reduce((acc, q) => acc + (q.amountReceived || 0), 0);

        nextClients = state.clients.map((c) =>
          c.id === target.clientId
            ? {
                ...c,
                totalAmount: totalAmt,
                receivedAmount: recAmt,
                quotationNo: clientQuotes[0]?.quotationNo || c.quotationNo,
              }
            : c
        );
      }

      persistState({ quotations: nextQuotes, clients: nextClients });
      return { quotations: nextQuotes, clients: nextClients };
    });
  },

  deleteQuotation: (id) => {
    set((state) => {
      const quoteToDelete = state.quotations.find((q) => q.id === id);
      const nextQuotes = state.quotations.filter((q) => q.id !== id);

      let nextClients = state.clients;
      if (quoteToDelete) {
        const remaining = nextQuotes.filter((q) => q.clientId === quoteToDelete.clientId);
        const totalAmt = remaining.reduce((acc, q) => acc + (q.totalAmount || q.amount || 0), 0);
        const recAmt = remaining.reduce((acc, q) => acc + (q.amountReceived || 0), 0);

        nextClients = state.clients.map((c) =>
          c.id === quoteToDelete.clientId
            ? {
                ...c,
                totalAmount: totalAmt,
                receivedAmount: recAmt,
                quotationNo: remaining[0]?.quotationNo || '',
              }
            : c
        );
      }

      persistState({ quotations: nextQuotes, clients: nextClients });
      return { quotations: nextQuotes, clients: nextClients };
    });
  },

  // Site Visits
  addSiteVisit: (visitData) => {
    const newId = `v-${Date.now().toString(36)}`;
    const newVisit: SiteVisit = { ...visitData, id: newId };
    set((state) => {
      const nextVisits = [newVisit, ...state.siteVisits];

      // Update client's lastFollowUpDate, nextFollowUpDate, and result
      const nextClients = state.clients.map((c) =>
        c.id === visitData.clientId
          ? {
              ...c,
              lastFollowUpDate: visitData.date || c.lastFollowUpDate,
              nextFollowUpDate: visitData.nextDate || c.nextFollowUpDate,
              result: visitData.result || c.result,
              assignedTo: visitData.assignedTo || c.assignedTo,
            }
          : c
      );

      persistState({ siteVisits: nextVisits, clients: nextClients });
      return { siteVisits: nextVisits, clients: nextClients };
    });
    return newId;
  },

  updateSiteVisit: (id, updates) => {
    set((state) => {
      const nextVisits = state.siteVisits.map((v) => (v.id === id ? { ...v, ...updates } : v));
      persistState({ siteVisits: nextVisits });
      return { siteVisits: nextVisits };
    });
  },

  deleteSiteVisit: (id) => {
    set((state) => {
      const nextVisits = state.siteVisits.filter((v) => v.id !== id);
      persistState({ siteVisits: nextVisits });
      return { siteVisits: nextVisits };
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
    const newAdvance: ClientAdvanceExpense = {
      ...advanceData,
      id: newId,
      balancePending,
      paymentStatus,
    };
    set((state) => {
      const next = [newAdvance, ...state.clientAdvances];
      persistState({ clientAdvances: next });
      return { clientAdvances: next };
    });
    return newId;
  },

  updateClientAdvance: (id, updates) => {
    set((state) => {
      const next = state.clientAdvances.map((adv) => {
        if (adv.id !== id) return adv;
        const advAmt = updates.amountAdvanced !== undefined ? updates.amountAdvanced : adv.amountAdvanced;
        const spentAmt =
          updates.actualAmountSpent !== undefined ? updates.actualAmountSpent : adv.actualAmountSpent;
        const retAmt = updates.balanceReturned !== undefined ? updates.balanceReturned : adv.balanceReturned;
        const { balancePending, paymentStatus } = computeAdvanceStatus(advAmt, spentAmt, retAmt);

        return {
          ...adv,
          ...updates,
          balancePending,
          paymentStatus,
        };
      });
      persistState({ clientAdvances: next });
      return { clientAdvances: next };
    });
  },

  deleteClientAdvance: (id) => {
    set((state) => {
      const next = state.clientAdvances.filter((a) => a.id !== id);
      persistState({ clientAdvances: next });
      return { clientAdvances: next };
    });
  },

  // Company Expenses
  addCompanyExpense: (expData) => {
    const newId = `exp-${Date.now().toString(36)}`;
    const balance = expData.amount - (expData.amountPaid || 0);
    const newExp: CompanyExpense = {
      ...expData,
      id: newId,
      balanceOutstanding: balance,
    };
    set((state) => {
      const next = [newExp, ...state.companyExpenses];
      persistState({ companyExpenses: next });
      return { companyExpenses: next };
    });
    return newId;
  },

  updateCompanyExpense: (id, updates) => {
    set((state) => {
      const next = state.companyExpenses.map((exp) => {
        if (exp.id !== id) return exp;
        const amt = updates.amount !== undefined ? updates.amount : exp.amount;
        const paid = updates.amountPaid !== undefined ? updates.amountPaid : exp.amountPaid;
        const balance = amt - paid;
        return {
          ...exp,
          ...updates,
          balanceOutstanding: balance,
        };
      });
      persistState({ companyExpenses: next });
      return { companyExpenses: next };
    });
  },

  deleteCompanyExpense: (id) => {
    set((state) => {
      const next = state.companyExpenses.filter((e) => e.id !== id);
      persistState({ companyExpenses: next });
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
      persistState({ companyExpenses: next });
      return { companyExpenses: next };
    });
  },

  // Master Lists
  addItemToList: (category, item) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    set((state) => {
      const current = state.masterLists[category] || [];
      if (current.includes(trimmed)) return state;
      const next = {
        ...state.masterLists,
        [category]: [...current, trimmed],
      };
      persistState({ masterLists: next });
      return { masterLists: next };
    });
  },

  removeItemFromList: (category, item) => {
    set((state) => {
      const current = state.masterLists[category] || [];
      const next = {
        ...state.masterLists,
        [category]: current.filter((x) => x !== item),
      };
      persistState({ masterLists: next });
      return { masterLists: next };
    });
  },

  resetMasterLists: () => {
    set((state) => {
      persistState({ masterLists: initialMasterLists });
      return { masterLists: initialMasterLists };
    });
  },

  // Authentication Actions
  login: (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const state = get();
    const user = state.users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (!user) {
      return { success: false, error: 'User profile with this email address was not found.' };
    }
    if (user.status === 'revoked') {
      return {
        success: false,
        error:
          'Access Revoked. Your login profile has been deactivated by an administrator. Please contact your system administrator.',
      };
    }
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please verify your credentials.' };
    }

    const updatedUser: UserProfile = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };
    const nextUsers = state.users.map((u) => (u.id === user.id ? updatedUser : u));
    set({
      users: nextUsers,
      currentUser: updatedUser,
    });
    persistState({ users: nextUsers, currentUser: updatedUser });
    return { success: true };
  },

  logout: () => {
    set({ currentUser: null });
    persistState({ currentUser: null });
  },

  adminResetPassword: (email, recoveryKey, newPassword) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedKey = recoveryKey.trim();
    const state = get();
    const adminUser = state.users.find(
      (u) => u.email.toLowerCase() === trimmedEmail && u.role === 'admin'
    );
    if (!adminUser) {
      return {
        success: false,
        error: 'No administrator profile found registered with this email address.',
      };
    }
    if (adminUser.status === 'revoked') {
      return {
        success: false,
        error: 'This administrator profile has been revoked and cannot reset password.',
      };
    }

    const validKey = adminUser.recoveryKey || 'HA-ADMIN-2026-SECURE';
    if (trimmedKey !== validKey && trimmedKey !== 'HA-ADMIN-2026-SECURE') {
      return {
        success: false,
        error: 'Invalid Administrator Security Recovery Key. Verification failed.',
      };
    }
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters long.',
      };
    }

    const updatedAdmin: UserProfile = {
      ...adminUser,
      password: newPassword,
    };
    const nextUsers = state.users.map((u) => (u.id === adminUser.id ? updatedAdmin : u));
    const nextCurrentUser =
      state.currentUser?.id === adminUser.id ? updatedAdmin : state.currentUser;

    set({
      users: nextUsers,
      currentUser: nextCurrentUser,
    });
    persistState({ users: nextUsers, currentUser: nextCurrentUser });
    return { success: true };
  },

  // Admin User Profile Management Actions
  createUserProfile: (userData) => {
    const trimmedEmail = userData.email.trim().toLowerCase();
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
      recoveryKey: userData.role === 'admin' ? userData.recoveryKey || 'HA-ADMIN-2026-SECURE' : undefined,
      createdAt: now,
    };
    const nextUsers = [newUser, ...state.users];
    set({ users: nextUsers });
    persistState({ users: nextUsers });
    return { success: true, id: newId };
  },

  updateUserProfile: (id, updates) => {
    set((state) => {
      const nextUsers = state.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
      let nextCurrentUser = state.currentUser;
      if (nextCurrentUser?.id === id) {
        nextCurrentUser = { ...nextCurrentUser, ...updates };
      }
      persistState({ users: nextUsers, currentUser: nextCurrentUser });
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
        // If current active user was revoked, invalidate their session
        nextCurrentUser = null;
      }
      persistState({ users: nextUsers, currentUser: nextCurrentUser });
      return { users: nextUsers, currentUser: nextCurrentUser };
    });
  },

  activateUserAccess: (id) => {
    set((state) => {
      const nextUsers = state.users.map((u) =>
        u.id === id ? { ...u, status: 'active' as const } : u
      );
      persistState({ users: nextUsers });
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
    persistState({ users: nextUsers, currentUser: nextCurrentUser });
    return { success: true };
  },
}));

function persistState(partialState: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const parsed = current ? JSON.parse(current) : {};
    const merged = { ...parsed, ...partialState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}
