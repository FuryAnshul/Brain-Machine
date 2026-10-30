import test from 'node:test';
import assert from 'node:assert/strict';
import { jiti } from './setup.ts';

const {
  sanitizeRedirectUrl,
  sanitizeCsvCell,
  sanitizeUserFacingError,
} = jiti('./src/lib/security.ts');

const {
  sanitizeString,
  sanitizeNumber,
} = jiti('./src/lib/validation.ts');

test('Security & Routing Sanitization Suite', async (t) => {
  await t.test('sanitizeRedirectUrl allows valid internal routes', () => {
    assert.equal(sanitizeRedirectUrl('/clients'), '/clients');
    assert.equal(sanitizeRedirectUrl('/expenses'), '/expenses');
    assert.equal(sanitizeRedirectUrl('/settings/lists'), '/settings/lists');
    assert.equal(sanitizeRedirectUrl('/admin'), '/admin');
    assert.equal(sanitizeRedirectUrl('/clients?search=John&stage=Hot'), '/clients?search=John&stage=Hot');
  });

  await t.test('sanitizeRedirectUrl blocks external full URLs', () => {
    assert.equal(sanitizeRedirectUrl('https://evil.com'), '/clients');
    assert.equal(sanitizeRedirectUrl('http://attacker.com/dashboard'), '/clients');
    assert.equal(sanitizeRedirectUrl('https://malicious.org/phishing'), '/clients');
  });

  await t.test('sanitizeRedirectUrl blocks protocol-relative URLs (//)', () => {
    assert.equal(sanitizeRedirectUrl('//evil.com'), '/clients');
    assert.equal(sanitizeRedirectUrl('//attacker.com/path'), '/clients');
  });

  await t.test('sanitizeRedirectUrl blocks backslash evasion schemes', () => {
    assert.equal(sanitizeRedirectUrl('/\\evil.com'), '/clients');
    assert.equal(sanitizeRedirectUrl('\\\\evil.com'), '/clients');
    assert.equal(sanitizeRedirectUrl('\\attacker.com'), '/clients');
  });

  await t.test('sanitizeRedirectUrl blocks dangerous script schemes', () => {
    assert.equal(sanitizeRedirectUrl('javascript:alert(1)'), '/clients');
    assert.equal(sanitizeRedirectUrl('javascript://%0aalert(1)'), '/clients');
    assert.equal(sanitizeRedirectUrl('data:text/html,<script>alert(1)</script>'), '/clients');
    assert.equal(sanitizeRedirectUrl('vbscript:msgbox("test")'), '/clients');
  });

  await t.test('sanitizeRedirectUrl handles null, undefined, and empty string', () => {
    assert.equal(sanitizeRedirectUrl(null), '/clients');
    assert.equal(sanitizeRedirectUrl(undefined), '/clients');
    assert.equal(sanitizeRedirectUrl(''), '/clients');
    assert.equal(sanitizeRedirectUrl('   '), '/clients');
    assert.equal(sanitizeRedirectUrl(null, '/expenses'), '/expenses');
  });

  await t.test('sanitizeCsvCell mitigates CSV formula injection (CWE-1236)', () => {
    // Dangerous formula prefixes: =, +, -, @, \t, \r
    assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), `"'=SUM(A1:A10)"`);
    assert.equal(sanitizeCsvCell('+cmd|/c calc'), `"'+cmd|/c calc"`);
    assert.equal(sanitizeCsvCell('-2+3+cmd|/c calc'), `"'-2+3+cmd|/c calc"`);
    assert.equal(sanitizeCsvCell('@IMPORTXML("url")'), `"\'@IMPORTXML(""url"")"`);
    assert.equal(sanitizeCsvCell('\t=cmd'), `"'\t=cmd"`);

    // Safe regular values are RFC 4180 quoted
    assert.equal(sanitizeCsvCell('Acme Corporation'), '"Acme Corporation"');
    assert.equal(sanitizeCsvCell(125000), '"125000"');
    assert.equal(sanitizeCsvCell(null), '');
    assert.equal(sanitizeCsvCell(undefined), '');
  });

  await t.test('sanitizeUserFacingError prevents system internal leaks', () => {
    const leakedError = new Error('ENOENT: no such file or directory, open C:\\Users\\secret\\key.pem');
    assert.equal(
      sanitizeUserFacingError(leakedError),
      'An unexpected error occurred. Please try again or contact support.'
    );

    const safeError = new Error('Invalid email format. Please check your input.');
    assert.equal(
      sanitizeUserFacingError(safeError),
      'Invalid email format. Please check your input.'
    );
  });

  await t.test('sanitizeString strips malicious HTML and script tags', () => {
    assert.equal(sanitizeString('<b>Bold</b> Test'), 'Bold Test');
    assert.equal(sanitizeString('<img src="x" onerror="alert(1)"/>Hello'), 'Hello');
    assert.equal(sanitizeString('<script>console.log("hi")</script>'), 'console.log("hi")');
    assert.equal(sanitizeString('Standard Client Name'), 'Standard Client Name');
  });

  await t.test('sanitizeNumber enforces non-negative finite bounds', () => {
    assert.equal(sanitizeNumber(5000), 5000);
    assert.equal(sanitizeNumber('1250.50'), 1250.5);
    assert.equal(sanitizeNumber(NaN, 0), 0);
    assert.equal(sanitizeNumber(Infinity, 0), 0);
    assert.equal(sanitizeNumber(-500, 0), 0);
  });
});
