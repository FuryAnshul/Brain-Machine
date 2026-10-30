import test from 'node:test';
import assert from 'node:assert/strict';
import { jiti } from './setup.ts';

// Setup Mock Window and LocalStorage
class MockLocalStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
  removeItem(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

const mockStorage = new MockLocalStorage();
(global as any).window = global;
(global as any).localStorage = mockStorage;

const { useCRMStore } = jiti('./src/lib/store.ts');
const { STORAGE_KEYS } = jiti('./src/lib/storageKeys.ts');

test('CRM Operations & Relational Integrity Suite', async (t) => {
  t.beforeEach(() => {
    mockStorage.clear();
    useCRMStore.getState().init();
  });

  await t.test('Client Operations: adding a client prepends and persists record', () => {
    const store = useCRMStore.getState();
    const initialCount = store.clients.length;

    const newClientId = store.addClient({
      clientName: 'Dr. Vikram Malhotra',
      mobileNo: '9888877777',
      email: 'vikram@malhotra.com',
      projectName: 'Malhotra Villa',
      status: 'New',
      assignedTo: 'Ankit Sir',
      result: 'Pending',
      remarks: 'Automate home theatre and lighting',
      totalAmount: 450000,
      receivedAmount: 100000,
      lastFollowUpDate: '2026-10-25',
      nextFollowUpDate: '2026-10-30',
    });

    assert.ok(newClientId);
    const updatedStore = useCRMStore.getState();
    assert.equal(updatedStore.clients.length, initialCount + 1);

    const createdClient = updatedStore.clients.find((c: any) => c.id === newClientId);
    assert.ok(createdClient);
    assert.equal(createdClient.clientName, 'Dr. Vikram Malhotra');
    assert.equal(createdClient.totalAmount, 450000);
  });

  await t.test('Client Operations: updating a client preserves integrity', () => {
    const store = useCRMStore.getState();
    const firstClient = store.clients[0];
    assert.ok(firstClient);

    store.updateClient(firstClient.id, {
      status: 'Quotation',
      remarks: 'Updated remarks for Phase 8 test',
    });

    const updated = useCRMStore.getState().clients.find((c: any) => c.id === firstClient.id);
    assert.ok(updated);
    assert.equal(updated.status, 'Quotation');
    assert.equal(updated.remarks, 'Updated remarks for Phase 8 test');
  });

  await t.test('Quotation Operations: Rollup recomputation on client record', () => {
    const store = useCRMStore.getState();
    const testClient = store.clients[0];
    assert.ok(testClient);

    const initialTotal = testClient.totalAmount;
    const initialReceived = testClient.receivedAmount;

    // Add a quotation to this client
    const newQuoteId = store.addQuotation({
      clientId: testClient.id,
      quotationNo: 'QT-TEST-2026-001',
      date: '2026-10-29',
      version: 1,
      totalAmount: 250000,
      amountReceived: 50000,
      status: 'Pending',
      remarks: 'Test quote rollup',
    });

    assert.ok(newQuoteId);

    // Verify rollup was recomputed on the client record
    const clientAfterQuote = useCRMStore.getState().clients.find((c: any) => c.id === testClient.id);
    assert.ok(clientAfterQuote);
    // The client's totalAmount and receivedAmount now reflect the quotation total
    assert.ok(clientAfterQuote.totalAmount >= 250000);
    assert.ok(clientAfterQuote.receivedAmount >= 50000);
    assert.equal(clientAfterQuote.quotationNo, 'QT-TEST-2026-001');

    // Clean up quotation
    store.deleteQuotation(newQuoteId);
  });

  await t.test('Company Expenses: logging expense updates list and rollups', () => {
    const store = useCRMStore.getState();
    const initialExpenseCount = store.companyExpenses.length;

    const newExpenseId = store.addCompanyExpense({
      employeeName: 'Pushpak Sharma',
      expenseCategory: 'Travelling Expenses',
      date: '2026-10-29',
      amount: 4500,
      paymentStatus: 'Paid',
      amountPaid: 4500,
      balanceOutstanding: 0,
      remarks: 'Site visit fuel and cab toll',
    });

    assert.ok(newExpenseId);
    const updatedExpenses = useCRMStore.getState().companyExpenses;
    assert.equal(updatedExpenses.length, initialExpenseCount + 1);

    const logged = updatedExpenses.find((e: any) => e.id === newExpenseId);
    assert.ok(logged);
    assert.equal(logged.amount, 4500);
    assert.equal(logged.paymentStatus, 'Paid');
  });

  await t.test('Factory Demo Reset preserves active currentUser session and preferences', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');
    assert.ok(adminUser);

    // Set logged in user & custom webhook URL
    useCRMStore.setState({
      currentUser: {
        ...adminUser,
        sessionExpiry: Date.now() + 3600000,
      },
      googleSheetWebhookUrl: 'https://script.google.com/macros/s/TEST/exec',
    });

    // Add a dirty client
    store.addClient({
      clientName: 'Temporary Test Client',
      mobileNo: '0000000000',
      projectName: 'Temp',
      status: 'Lost',
      assignedTo: 'Nobody',
      result: 'Completed',
      totalAmount: 10,
      receivedAmount: 0,
      lastFollowUpDate: '',
      nextFollowUpDate: '',
    });

    // Perform Factory Reset
    store.resetToFactoryDemo();

    const stateAfterReset = useCRMStore.getState();

    // 1. Temporary client was purged
    const tempFound = stateAfterReset.clients.some((c: any) => c.clientName === 'Temporary Test Client');
    assert.equal(tempFound, false);

    // 2. Active session is strictly PRESERVED
    assert.ok(stateAfterReset.currentUser);
    assert.equal(stateAfterReset.currentUser.id, adminUser.id);

    // 3. Webhook URL preference is PRESERVED
    assert.equal(
      stateAfterReset.googleSheetWebhookUrl,
      'https://script.google.com/macros/s/TEST/exec'
    );
  });
});
