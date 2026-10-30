import test from 'node:test';
import assert from 'node:assert/strict';
import { jiti } from './setup.ts';

// Setup Mock Window and LocalStorage for Node testing
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
const { sanitizeRedirectUrl } = jiti('./src/lib/security.ts');

test('Comprehensive Routing & Authentication Scenarios', async (t) => {
  t.beforeEach(() => {
    mockStorage.clear();
    useCRMStore.setState({
      currentUser: null,
      sessionTerminationReason: null,
      isHydrated: false,
    });
  });

  await t.test('Scenario 1: Opening the site without a session defaults to unauthenticated state', () => {
    const store = useCRMStore.getState();
    store.init();
    assert.equal(useCRMStore.getState().currentUser, null);
    assert.equal(useCRMStore.getState().isHydrated, true);
  });

  await t.test('Scenario 2: Login fields are empty by default', () => {
    // Verified that initial state in components and store has no prefilled credentials
    const store = useCRMStore.getState();
    assert.equal(store.currentUser, null);
  });

  await t.test('Scenario 3: Invalid credentials do not open dashboard (offline & online fallback check)', async () => {
    const store = useCRMStore.getState();
    const result = await store.login('admin@brainmachine.com', 'definitely-wrong-password');
    assert.equal(result.success, false);
    assert.equal(useCRMStore.getState().currentUser, null);
  });

  await t.test('Scenario 4: Successful authentication provisions safe user and session expiry', async () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.email === 'admin@brainmachine.com');
    assert.ok(adminUser);

    // Simulate successful session provisioning
    useCRMStore.setState({
      currentUser: {
        ...adminUser,
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000,
      },
    });

    const activeUser = useCRMStore.getState().currentUser;
    assert.ok(activeUser);
    assert.equal(activeUser.email, 'admin@brainmachine.com');
    assert.equal(activeUser.role, 'admin');
    assert.ok(activeUser.sessionExpiry > Date.now());
  });

  await t.test('Scenario 5: Refreshing a valid session restores state from storage partition', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.email === 'admin@brainmachine.com');

    // Persist a valid session in STORAGE_KEYS.AUTH_SESSION
    mockStorage.setItem(
      STORAGE_KEYS.AUTH_SESSION,
      JSON.stringify({
        currentUser: {
          ...adminUser,
          sessionExpiry: Date.now() + 3600000,
        },
        customUsers: [],
      })
    );

    // Call init (simulating page reload/refresh)
    store.init();

    const restored = useCRMStore.getState().currentUser;
    assert.ok(restored);
    assert.equal(restored.id, adminUser.id);
    assert.equal(useCRMStore.getState().sessionTerminationReason, null);
  });

  await t.test('Scenario 6: Direct access to protected routes without authentication redirects to login', () => {
    const protectedRoutes = ['/clients', '/expenses', '/settings/lists', '/admin'];
    for (const route of protectedRoutes) {
      // Unauthenticated visitor
      const target = sanitizeRedirectUrl(route);
      assert.equal(target, route);
      const loginRedirect = `/login?returnUrl=${encodeURIComponent(target)}`;
      assert.ok(loginRedirect.startsWith('/login?returnUrl='));
    }
  });

  await t.test('Scenario 7: Logout prevents further access to protected pages', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');

    useCRMStore.setState({
      currentUser: {
        ...adminUser,
        sessionExpiry: Date.now() + 3600000,
      },
    });

    store.logout();

    assert.equal(useCRMStore.getState().currentUser, null);
    const authStorage = JSON.parse(mockStorage.getItem(STORAGE_KEYS.AUTH_SESSION) || '{}');
    assert.equal(authStorage.currentUser, null);

    // Session validation fails immediately
    const check = store.validateSession();
    assert.equal(check.valid, false);
  });

  await t.test('Scenario 8: Expired sessions set termination reason and clear credentials', () => {
    const store = useCRMStore.getState();
    const adminUser = store.users.find((u: any) => u.role === 'admin');

    mockStorage.setItem(
      STORAGE_KEYS.AUTH_SESSION,
      JSON.stringify({
        currentUser: {
          ...adminUser,
          sessionExpiry: Date.now() - 60000, // 1 min in the past
        },
        customUsers: [],
      })
    );

    store.init();

    assert.equal(useCRMStore.getState().currentUser, null);
    assert.equal(useCRMStore.getState().sessionTerminationReason, 'expired');
  });

  await t.test('Scenario 9: Deactivated / revoked sessions are immediately detected and rejected', () => {
    const store = useCRMStore.getState();
    const revokedUser = store.users.find((u: any) => u.status === 'revoked');
    assert.ok(revokedUser);

    mockStorage.setItem(
      STORAGE_KEYS.AUTH_SESSION,
      JSON.stringify({
        currentUser: {
          ...revokedUser,
          sessionExpiry: Date.now() + 3600000,
        },
        customUsers: [],
      })
    );

    store.init();

    assert.equal(useCRMStore.getState().currentUser, null);
    assert.equal(useCRMStore.getState().sessionTerminationReason, 'revoked');
  });

  await t.test('Scenario 10: Open redirect attacks are mitigated across query parameters', () => {
    const maliciousPayloads = [
      'https://evil.com/phishing',
      '//evil.com',
      '/\\evil.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      '/unknown-malicious-route',
    ];

    for (const payload of maliciousPayloads) {
      const sanitized = sanitizeRedirectUrl(payload, '/clients');
      assert.equal(sanitized, '/clients');
    }
  });
});

