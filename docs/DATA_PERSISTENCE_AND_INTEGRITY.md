# Phase 6: Data Integrity & Persistence Architecture

## 1. Executive Summary & Overview
This document defines the storage architecture, data validation framework, cross-screen state consistency guarantees, and documented limitations of browser-local persistence for the **Home Automation CRM & Operations Suite** (v5.4).

---

## 2. Where Application Data Is Stored & How State Is Updated

### 2.1 State Tiers
Application data resides in three coordinated operational tiers:

```
┌──────────────────────────────────────────────────────────────┐
│                    Zustand Reactive Store                    │
│            (Single source of truth in React state)           │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  Browser LocalStorage Tier   │ │   Google Sheets / Webhook    │
│  (Offline fast-cache & demo) │ │   (Enterprise cloud sync)    │
└──────────────────────────────┘ └──────────────────────────────┘
```

1. **Zustand Reactive State (`src/lib/store.ts`)**:
   - Primary in-memory state engine.
   - All UI components across screens subscribe reactively to this store.
   - Instant re-rendering when data changes without full-page reloads.

2. **Partitioned Browser LocalStorage (`src/lib/storageKeys.ts`)**:
   - To prevent destructive side-effects during demo resets, storage is partitioned into **three isolated keys**:
     - **Business Demo Data Key (`home_automation_crm_demo_data_v2`)**: Holds operational entities: `clients`, `siteContacts`, `quotations`, `siteVisits`, `clientAdvances`, `companyExpenses`, `masterLists`, and `lastSyncedAt`.
     - **User Preferences Key (`home_automation_crm_user_prefs_v1`)**: Holds UI and system preferences: `theme`, `googleSheetWebhookUrl`, and table column/pagination preferences.
     - **Auth Session Key (`home_automation_crm_auth_session_v1`)**: Holds the active `currentUser` metadata and custom admin-created user accounts. **Strictly omits all passwords and security recovery keys.**

3. **External Sync Tier (`/api/sync-google-sheet`)**:
   - Pushes additions and updates asynchronously to Google Sheets / App Script webhooks for multi-device team backup.

---

## 3. Cross-Screen Consistency & Relational Rollups

To ensure data changes are reflected consistently across relevant screens (Overview Table `/clients`, Client Dossier `/clients/[id]`, Expenses `/expenses`, and Navigation Badges):

### 3.1 Quotation <-> Client Rollup Synchronization
- When a quotation is created, updated, or deleted via `addQuotation`, `updateQuotation`, or `deleteQuotation`:
  - `recomputeClientQuotationRollup` automatically recalculates `totalAmount` (sum of quotation totals), `receivedAmount` (sum of amounts received), and `quotationNo` (latest quote identifier).
  - Handles client re-assignment (if a quotation is moved from one client to another, both the origin and target client records update).
  - Guarantees that the overview table row and the dossier header summary cards display identical financials.

### 3.2 Site Visit <-> Client Follow-up Synchronization
- When a site visit or call log is added, updated, or deleted via `addSiteVisit`, `updateSiteVisit`, or `deleteSiteVisit`:
  - `recomputeClientFollowUpRollup` automatically sorts all visits for that client and recalculates:
    - `lastFollowUpDate`: Date of the most recent interaction.
    - `nextFollowUpDate`: Nearest upcoming follow-up commitment.
    - `result`: Outcome status of the latest interaction.
    - `assignedTo`: Engineer or project manager assigned.
  - Updates the Client entity in Zustand so the Client Overview table, the Dossier history, and the Navbar **Overdue Alert Badge** update in real time.

### 3.3 Relational Cascade Deletion
- Deleting a client via `deleteClient(clientId)` automatically cascades:
  - Deletes all site contacts associated with `clientId`.
  - Deletes all quotations associated with `clientId`.
  - Deletes all site visits associated with `clientId`.
  - Deletes all site employee cash advances associated with `clientId`.
  - Dispatches `delete_client` action to server sync.

### 3.4 Cross-Screen Expense Aggregation
- Global client advances and company expenses are subscribed reactively by the `/expenses` dashboard.
- Any advance logged inside an individual client dossier (`/clients/[id]`) immediately recalculates the KPI metrics on the central `/expenses` page.

---

## 4. LocalStorage Usage: Non-Sensitive Demo Data & Preferences

Browser storage is strictly limited to non-sensitive operational demo data and user preferences:
- Only plain metadata, dates, non-sensitive financial numbers, and UI preferences are written to `localStorage`.
- Storage is divided into distinct namespaces so clearing demo records does not affect user preferences.

---

## 5. Data Validation & Graceful Corruption Recovery

The validation engine (`src/lib/validation.ts`) enforces integrity before writing to storage:

### 5.1 Pre-Save Schema Validation & Sanitization
- **String Sanitization**: Drops potential HTML/script injection tags and trims excess whitespace.
- **Number Sanitization**: Clamps amounts to non-negative, finite numbers; rounds to 2 decimal places; prevents `NaN` or `Infinity` from polluting state.
- **Date Sanitization**: Verifies strict `YYYY-MM-DD` ISO formatting or falls back safely.
- **Enum Guarding**: Validates lead statuses, results, payment statuses, and categories against defined system constants.

### 5.2 Graceful Corruption Recovery (`safeLoadStorage`)
- If browser storage contains invalid JSON (SyntaxError caused by manual editing or storage glitches), the system catches the error, logs a clean non-sensitive diagnostic warning, and restores clean defaults without crashing the React application.
- If individual items within an array are corrupted, `validateClients`, `validateQuotations`, etc. filter or repair defective records while preserving valid records.
- Storage quota errors (`QuotaExceededError`) are caught gracefully without interrupting user interactions.

---

## 6. Protection of Sensitive Information

### 6.1 Storage Security
- Plaintext passwords and security recovery keys are **NEVER** serialized to browser storage.
- The `sanitizeSensitiveFields` utility recursively strips keys named `password`, `recoveryKey`, `secret`, `token`, and `apiKey` before saving.
- The prototype auth provider keeps demo user credentials in memory; persisted profiles contain only safe metadata (`id`, `name`, `email`, `role`, `status`, `createdAt`, `lastLoginAt`).

### 6.2 Logs and Error Messages
- All catch blocks sanitize error payloads before logging to the browser console.
- Authentication failures return generic, non-enumerative error messages (`"Invalid email address or password. Please verify your credentials."`) rather than exposing specific credential discrepancies.
- Security recovery keys are never exposed in toast alerts or network payloads.

---

## 7. Independent Factory Demo Reset

### 7.1 Separation Guarantee
The `resetToFactoryDemo()` action resets only the business sample records:
- **What is Reset**: `clients`, `siteContacts`, `quotations`, `siteVisits`, `clientAdvances`, `companyExpenses`, and `masterLists` are restored to the baseline Excel dataset (`Home_Automation_CRM_v5_4.xlsx`).
- **What is Preserved**:
  - The active user session (`currentUser`) is **retained**; the user is **NOT** logged out.
  - User UI preferences (Light/Dark mode) are **retained**.
  - Google Sheet Webhook URL configuration is **retained**.
  - Admin-registered custom accounts in the user directory are **retained**.

---

## 8. Limitations of Browser-Local Persistence

While browser-local storage provides instant, offline-capable prototype operation, it has specific architectural boundaries that users and administrators must understand:

1. **Device & Browser Scope (Single-Origin Isolation)**:
   - Browser storage is strictly confined to the specific browser application and device profile where the data was entered.
   - Changes made in Google Chrome on a desktop laptop will **not** appear on an iPhone or another colleague's laptop unless synchronized via Google Sheets or an external backend.

2. **Storage Capacity Limits (5MB to 10MB Quota)**:
   - Web browsers allocate approximately 5MB to 10MB per origin for `localStorage`.
   - While sufficient for thousands of CRM client records and quotation lines, large PDF documents, blueprint CAD files, or extensive image attachments should not be stored in `localStorage`.

3. **Private / Incognito Browsing Volatility**:
   - In Incognito/Private browsing windows, browser storage is held in temporary memory and is purged upon closing the browser window.

4. **Lack of Distributed Concurrency Locks**:
   - `localStorage` does not provide distributed transactions or optimistic concurrency locks across separate browser tabs or windows.
   - If a user edits the same client simultaneously in two different browser tabs, the last tab to write will overwrite previous edits.

5. **Client-Side Security Perimeter**:
   - Browser storage is accessible by any JavaScript executing within the origin.
   - For enterprise production deployment, sensitive user authentication tokens must be stored in secure, `HttpOnly`, `SameSite=Strict` cookies issued by an authenticated server backend.
