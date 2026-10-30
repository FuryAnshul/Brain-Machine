import test from 'node:test';
import assert from 'node:assert/strict';
import { jiti } from './setup.ts';

const { POST: loginHandler } = jiti('./src/app/api/auth/login/route.ts');
const { POST: resetHandler } = jiti('./src/app/api/auth/reset-password/route.ts');
const { ClientPrototypeAuthProvider } = jiti('./src/lib/auth/authProvider.ts');

test('Auth API & Temporary Admin Credentials Suite', async (t) => {
  await t.test('POST /api/auth/login with valid temporary admin credentials succeeds', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brainmachine.com',
        password: 'admin@123',
      }),
    });

    const res = await loginHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'admin@brainmachine.com');
    assert.equal(data.user.role, 'admin');
    assert.equal(data.user.status, 'active');
    // Ensure no plaintext password or hash is exposed
    assert.equal(data.user.password, undefined);
    assert.equal(data.user.passwordHash, undefined);
    assert.ok(data.user.sessionExpiry > Date.now());
  });

  await t.test('POST /api/auth/login normalizes whitespace and uppercase domain', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '  Admin@BrainMachine.com  ',
        password: 'admin@123',
      }),
    });

    const res = await loginHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'admin@brainmachine.com');
  });

  await t.test('POST /api/auth/login with invalid password for temp admin fails with generic error (401)', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brainmachine.com',
        password: 'wrongpassword999',
      }),
    });

    const res = await loginHandler(req);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, 'Invalid email address or password. Please verify your credentials.');
    assert.equal(data.user, undefined);
  });

  await t.test('POST /api/auth/login rejects non-@brainmachine.com domain with specific message (400)', async () => {
    const foreignEmails = [
      'admin@homeautomation.com',
      'user@gmail.com',
      'attacker@otherdomain.com',
      'admin@brainmachine.org',
    ];

    for (const email of foreignEmails) {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });

      const res = await loginHandler(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error, 'Please use your @brainmachine.com email address.');
    }
  });

  await t.test('POST /api/auth/login rejects invalid email address format (400)', async () => {
    const invalidFormats = [
      'not-an-email',
      '@brainmachine.com',
      'missingatsign.com',
      'user@brainmachine',
    ];

    for (const email of invalidFormats) {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });

      const res = await loginHandler(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error, 'Please enter a valid email address format.');
    }
  });

  await t.test('POST /api/auth/login with valid staff credentials succeeds', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ankit@brainmachine.com',
        password: 'ankit123',
      }),
    });

    const res = await loginHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'ankit@brainmachine.com');
    assert.equal(data.user.role, 'staff');
  });

  await t.test('POST /api/auth/login with revoked account fails (403)', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'contractor@brainmachine.com',
        password: 'password123',
      }),
    });

    const res = await loginHandler(req);
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /access revoked/i);
  });

  await t.test('POST /api/auth/reset-password enforces @brainmachine.com domain', async () => {
    const badReq = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@external.com',
        recoveryKey: 'HA-ADMIN-2026-SECURE',
        newPassword: 'newAdminPassword123',
      }),
    });
    const badRes = await resetHandler(badReq);
    assert.equal(badRes.status, 400);
    const badData = await badRes.json();
    assert.equal(badData.error, 'Please use your @brainmachine.com email address.');

    const goodReq = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brainmachine.com',
        recoveryKey: 'HA-ADMIN-2026-SECURE',
        newPassword: 'newAdminPassword123',
      }),
    });
    const goodRes = await resetHandler(goodReq);
    assert.equal(goodRes.status, 200);
  });

  await t.test('ClientPrototypeAuthProvider enforces @brainmachine.com domain', async () => {
    const provider = new ClientPrototypeAuthProvider();
    const badDomain = await provider.login({
      email: 'user@yahoo.com',
      password: 'password123',
    });
    assert.equal(badDomain.success, false);
    assert.equal(badDomain.error, 'Please use your @brainmachine.com email address.');
  });
});
