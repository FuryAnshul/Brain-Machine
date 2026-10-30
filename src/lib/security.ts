/**
 * Security & Sanitization Utilities
 *
 * Enforces production security standards:
 * 1. Open redirect and unsafe navigation prevention
 * 2. CSV formula injection mitigation
 * 3. Safe error message formatting (no internal path / stack trace leaks)
 * 4. Safe URL parameter parsing
 */

/**
 * Whitelist of safe internal navigation route prefixes.
 * Any destination outside this list will be rejected and redirected to fallback.
 */
const ALLOWED_INTERNAL_ROUTES = [
  '/clients',
  '/expenses',
  '/settings',
  '/admin',
];

/**
 * Validates and sanitizes a return or redirect URL.
 * Strictly prevents Open Redirects, Protocol-relative schemes (//evil.com),
 * backslash obfuscation (/\evil.com, /\\evil.com), javascript: URIs,
 * and external domain navigation.
 */
export function sanitizeRedirectUrl(
  rawUrl: string | null | undefined,
  fallback = '/clients'
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }

  try {
    // 1. Decode potential URL encoding
    let decoded = decodeURIComponent(rawUrl).trim();

    // 2. Reject control characters, carriage returns, null bytes
    if (/[\r\n\0\t\x00-\x1f]/.test(decoded)) {
      return fallback;
    }

    // 3. Reject protocol-relative URLs (e.g. "//evil.com", "///evil.com")
    // and backslash tricks (e.g. "/\evil.com", "/\\evil.com")
    if (
      decoded.startsWith('//') ||
      decoded.startsWith('/\\') ||
      decoded.startsWith('\\') ||
      decoded.includes('\\')
    ) {
      return fallback;
    }

    // 4. Reject dangerous URI schemes
    const lower = decoded.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      return fallback;
    }

    // 5. Must start with a single forward slash
    if (!decoded.startsWith('/')) {
      return fallback;
    }

    // 6. Prevent redirect loop back to login
    if (decoded.startsWith('/login')) {
      return fallback;
    }

    // 7. Verify origin isolation using dummy base URL
    const parsed = new URL(decoded, 'https://crm.local');
    if (parsed.origin !== 'https://crm.local') {
      return fallback;
    }

    // 8. Whitelist route check
    const isAllowed = ALLOWED_INTERNAL_ROUTES.some(
      (allowed) => parsed.pathname === allowed || parsed.pathname.startsWith(`${allowed}/`)
    );

    if (!isAllowed && parsed.pathname !== '/') {
      return fallback;
    }

    // Return the sanitized relative path + search query
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    // If URL parsing or decoding fails, return fallback
    return fallback;
  }
}

/**
 * Neutralizes CSV / Spreadsheet Formula Injection (CWE-1236).
 * If a cell string starts with '=', '+', '-', '@', '\t', or '\r',
 * spreadsheet programs (Excel, LibreOffice, Google Sheets) may execute it as a formula.
 * Prepends a single quote "'" to force plain-text interpretation.
 */
export function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // If the cell starts with a formula trigger character, prepend a single quote
  if (/^[=\+\-@\t\r%]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them for RFC 4180 CSV compliance
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Formats user-facing error messages to prevent internal stack traces,
 * database paths, or filesystem structures from leaking to end users.
 */
export function sanitizeUserFacingError(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again or contact support.'
): string {
  if (!err) return fallbackMessage;

  const rawMessage = err instanceof Error ? err.message : String(err);

  // Check for common internal exception signatures to censor
  const isInternalLeak =
    rawMessage.includes('ENOENT') ||
    rawMessage.includes('EPERM') ||
    rawMessage.includes('at ') ||
    rawMessage.includes('node:') ||
    rawMessage.includes('webpack') ||
    rawMessage.includes('src/') ||
    rawMessage.includes('C:\\') ||
    rawMessage.includes('/var/') ||
    rawMessage.includes('SELECT') ||
    rawMessage.includes('SyntaxError');

  if (isInternalLeak) {
    return fallbackMessage;
  }

  return rawMessage;
}

