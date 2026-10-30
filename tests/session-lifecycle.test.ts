import test from 'node:test';
import assert from 'node:assert/strict';
import { jiti } from './setup.ts';

// Setup Mock Window and LocalStorage for Node testing
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

const mockStorage = new MockLocalStorage();
(global as any).window = global;
(global as any).localStorage = mockStorage;

const { STORAGE_KEYS } = jiti('./src/lib/storageKeys.ts');
const { useCRMStore } = jiti('./src/lib/store.ts');

test('Session Lifecycle & Storage Partitioning Suite', async (t) => {
  t.beforeEach(() => {
    mockStorage.clear();
  });

  await t.test('Initial state: user is unauthenticated', () => {
    const store = useCRMStore.getState();
    assert.equal(store.currentUser, null);
    assert.equal(store.sessionTerminationReason, null);
  });

  await t.test('Hydration initializes clean storage partitions without leaks', () => {
    const store = useCRMStore.getState();
    store.init();

    // Verify storage partitions exist and are isolated
    const authRaw = mockStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    assert.equal(authRaw, null); // No active session initially

    assert.equal(useCRMStore.getState().currentUser, null);
    assert.equal(useCRMStore.getState().isHydrated, true);
  });

  await t.test('Active session validation: valid active session', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');
    assert.ok(adminUser);

    // Simulate active session
    useCRMStore.setState({
      currentUser: {
        ...adminUser,
        sessionExpiry: Date.now() + 3600000, // 1 hour in future
      },
    });

    const res = store.validateSession();
    assert.equal(res.valid, true);
    assert.equal(res.reason, undefined);
  });

  await t.test('Session expiration: expired session is automatically cleared', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');
    assert.ok(adminUser);

    // Set an expired session (10 seconds in past)
    useCRMStore.setState({
      currentUser: {
        ...adminUser,
        sessionExpiry: Date.now() - 10000,
      },
    });

    const res = store.validateSession();
    assert.equal(res.valid, false);
    assert.equal(res.reason, 'expired');
    // Verifies currentUser is set to null
    assert.equal(useCRMStore.getState().currentUser, null);
  });

  await t.test('Account revocation: revoked user session is invalidated', () => {
    const store = useCRMStore.getState();
    const revokedUser = store.users.find((u: any) => u.status === 'revoked');
    assert.ok(revokedUser);

    // If a revoked user somehow had an active session
    useCRMStore.setState({
      currentUser: {
        ...revokedUser,
        sessionExpiry: Date.now() + 3600000,
      },
    });

    const res = store.validateSession();
    assert.equal(res.valid, false);
    assert.equal(res.reason, 'revoked');
    assert.equal(useCRMStore.getState().currentUser, null);
  });

  await t.test('Logout immediately terminates session and purges auth partition', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');
    assert.ok(adminUser);

    useCRMStore.setState({
      currentUser: {
        ...adminUser,
        sessionExpiry: Date.now() + 3600000,
      },
    });

    // Call logout
    store.logout();

    // Verify currentUser is null
    assert.equal(useCRMStore.getState().currentUser, null);

    // Verify auth partition in localStorage has null currentUser
    const savedAuth = JSON.parse(mockStorage.getItem(STORAGE_KEYS.AUTH_SESSION) || '{}');
    assert.equal(savedAuth.currentUser, null);
  });

  await t.test('Storage hygiene: AUTH_SESSION never contains passwords or recovery keys', () => {
    const store = useCRMStore.getState();
    
    // Create a new user via createUserProfile
    const result = store.createUserProfile({
      name: 'Custom User',
      email: 'custom@brainmachine.com',
      role: 'staff',
      status: 'active',
      mobileNo: '9998887776',
    });
    assert.equal(result.success, true);

    const savedAuth = JSON.parse(mockStorage.getItem(STORAGE_KEYS.AUTH_SESSION) || '{}');
    assert.ok(Array.isArray(savedAuth.customUsers));
    
    // Strict audit: Ensure no password, passwordHash, or recoveryKey exists
    for (const u of savedAuth.customUsers) {
      assert.equal((u as any).password, undefined);
      assert.equal((u as any).passwordHash, undefined);
      assert.equal((u as any).recoveryKey, undefined);
    }
  });

  await t.test('Init with expired session in storage sets sessionTerminationReason to expired', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');

    // Manually write an expired session into localStorage
    mockStorage.setItem(
      STORAGE_KEYS.AUTH_SESSION,
      JSON.stringify({
        currentUser: {
          ...adminUser,
          sessionExpiry: Date.now() - 50000,
        },
        customUsers: [],
      })
    );

    // Call init
    store.init();

    // Verify session was terminated with 'expired'
    assert.equal(useCRMStore.getState().currentUser, null);
    assert.equal(useCRMStore.getState().sessionTerminationReason, 'expired');

    // Clean up reason
    useCRMStore.getState().clearSessionTerminationReason();
    assert.equal(useCRMStore.getState().sessionTerminationReason, null);
  });
});
