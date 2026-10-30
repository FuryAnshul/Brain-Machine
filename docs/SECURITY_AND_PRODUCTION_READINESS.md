# Phase 7: Security & Production Readiness Specification

## 1. Executive Summary
This document establishes the security standards, credential management policies, input sanitization controls, and architectural boundaries implemented for the **Home Automation CRM & Operations Suite** in accordance with Phase 7.

---

## 2. Removal of Hardcoded Secrets & Client-Side Bundle Hygiene

### 2.1 Problem & Vulnerability
In standard client-rendered Next.js applications (`'use client'`), any data imported into client components or state stores is compiled directly into publicly downloadable `.js` webpack chunks. In past prototypes, mock passwords or recovery keys declared in client-side files could be discovered using browser DevTools.

### 2.2 Implemented Resolution
1. **Sanitized Client Mock Profiles (`src/lib/mockData.ts`)**:
   - All plaintext `password` and `recoveryKey` properties were purged from `initialUsers`.
   - Client bundles now strictly hold `SafeUserProfile` metadata (`id`, `name`, `email`, `role`, `status`, `mobileNo`, `createdAt`, `lastLoginAt`).
2. **Server-Side Authentication Vault (`src/app/api/auth/login/route.ts`)**:
   - Authentication verification has been migrated to a trusted server route.
   - Login requests are sent via `POST /api/auth/login`.
   - The server verifies credentials against server-side environment variables or server memory, completely insulated from client-side bundles.
   - IP-based rate limiting (10 attempts / minute) protects against brute-force attacks.
3. **Server-Side Password Recovery (`src/app/api/auth/reset-password/route.ts`)**:
   - Master Administrator Recovery Keys are verified strictly on the server against `ADMIN_RECOVERY_KEY`.

---

## 3. Environment Variable Security & Frontend Leaks

### 3.1 Directive on `NEXT_PUBLIC_`
Next.js automatically embeds any environment variable starting with `NEXT_PUBLIC_` into client-side JavaScript at build time.

### 3.2 Configuration Audited
- **Removed**: Any usage or suggestion of `NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL`.
- **Enforced**: Server-side sync routes (`src/app/api/sync-google-sheet/route.ts`) strictly read `process.env.GOOGLE_SHEET_WEBHOOK_URL` in Node.js server context.
- **Template (`.env.example`)**: Created with clear security directives instructing engineers never to prefix secrets with `NEXT_PUBLIC_`.

---

## 4. Open Redirect & Unsafe Navigation Prevention

### 4.1 Threat Model
Attackers can craft phishing links such as:
`https://crm.example.com/login?returnUrl=https://attacker.com`
or utilize browser parsing quirks:
`returnUrl=//attacker.com` or `returnUrl=/\attacker.com` or `returnUrl=javascript:...`

### 4.2 Hardened Sanitization Engine (`src/lib/security.ts`)
The `sanitizeRedirectUrl` function enforces strict controls:
1. **Protocol-Relative Schemes Rejected**: Rejects `//` and backslashes `/\` or `\\`.
2. **Dangerous Protocols Rejected**: Blocks `javascript:`, `data:`, `vbscript:`, `file:`.
3. **Control Characters Censored**: Rejects carriage returns (`\r\n`), null bytes (`\0`), and tab characters.
4. **Origin Validation**: Parses the target against an internal dummy origin to guarantee the destination remains on the same origin.
5. **Whitelist Route Check**: The path must match designated internal application routes (`/clients`, `/expenses`, `/settings`, `/admin`). Any unlisted destination safely defaults to `/clients`.

---

## 5. Input Handling, Rendering & Injection Mitigation

### 5.1 CSV / Spreadsheet Formula Injection (CWE-1236)
- **Vulnerability**: If client names or notes begin with `=`, `+`, `-`, `@`, `\t`, or `\r`, opening the exported CSV in Excel or Google Sheets executes malicious formulas or command payloads.
- **Remediation**: The `sanitizeCsvCell` utility inspects every exported cell. If an initial formula character is detected, it prepends a single quote (`'`), ensuring spreadsheet software parses the cell strictly as plain text.

### 5.2 Stored Script & Tag Sanitization
- All user inputs in client and expense forms pass through `sanitizeString` to strip HTML/script tags before updating state or storage.
- Numerical fields (`totalAmount`, `amountPaid`, `balanceReturned`) are clamped using `sanitizeNumber` to prevent `NaN`, `Infinity`, or negative values from corrupting financial rollups.

---

## 6. Authorization Boundaries: Client vs. Server

### 6.1 Clear Architectural Principle
> **Client-side route guards (e.g. `AuthGuard.tsx`) are for user experience and navigation flow ONLY. They are NOT a security boundary.**

Any determined user can open browser developer tools to alter client-side React state, modify `currentUser`, or tamper with route guards.

### 6.2 Trusted Server Enforcement
- Real security boundaries exist on the **server**:
  - API routes (`/api/sync-google-sheet`, `/api/auth/login`, `/api/auth/reset-password`) validate permissions and input payloads independently of client state.
  - In enterprise production, API routes should inspect secure `HttpOnly`, `SameSite=Strict` session cookies issued by a trusted authentication service (e.g. NextAuth.js, Supabase Auth, Firebase Auth).

---

## 7. Error Handling & Information Leakage Prevention

### 7.1 Global Error Boundary (`src/app/error.tsx`)
Next.js App Router error component catches unhandled runtime rendering exceptions:
- Displays a clean error screen with "Try Again" and "Return to Workspace" actions.
- Avoids crashing the browser or showing raw white-screen errors.

### 7.2 Sanitized User-Facing Messages (`sanitizeUserFacingError`)
- Catches internal exceptions (such as filesystem errors `ENOENT`, database connection timeouts, or node runtime stacks).
- Strips filesystem paths (`C:\...`, `/var/...`) and system internals before displaying to end users.
- Full diagnostic traces are logged only to internal server logs for engineering review.

---

## 8. UX States: Loading, Error, Empty, and Session-Expired

1. **Loading States**:
   - Skeleton placeholders on `/clients` and `/expenses` prevent layout shifts during hydration.
   - Button submit spinners (`isSubmitting`) prevent duplicate submissions.
2. **Empty States**:
   - Filtered tables display actionable empty states with reset filters and quick-create shortcuts.
3. **Session Expired & Revoked States**:
   - Automatic 60-second expiration checks redirect to `/login?reason=expired` with an alert.
   - Administrator-revoked accounts are immediately blocked with `/login?reason=revoked`.

