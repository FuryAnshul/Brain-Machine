# Home Automation CRM & Operations Suite (v5.4)

A responsive, high-performance web application designed for luxury automation operations, lead pipelines, client dossiers, and overhead expense management.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, TanStack Table, and Zustand with local storage persistence and Google Sheets integration.

## Key Features

- **Google Sheets Live Data Storage & Sync:**
  - Direct ingestion & real-time sync with Google Sheets via `/api/sync-google-sheet`.
  - Backed by the official workbook with 68 client records, quotations, site contacts, and master lists.
  - Dedicated Google Sheet Live Sync modal in the navigation bar.

- **Client Overview & Interactive Pipeline:**
  - 7-card interactive metric ribbon: Total Clients, Today's Calls, Overdue, Quotes Pending, Final Stage, Confirmed Orders, Completed.
  - Faceted filters (Search, Date Range, Status, Follow-up Due, Assigned To, Result).
  - Column visibility toggle and CSV export.
  - WhatsApp deep-link generation (`wa.me/91...`) and telephone click-to-call.
  - Full Edit Client modal (✏️) on all rows.

- **Client Workspace Dossier (`/clients/[id]`):**
  - Live metric roll-up cards: Quote Reference, Total Amount, Received Amount, Balance Due with accent styling, Project Timeline.
  - 2-Column layout with Client Profile & Site Contacts mini-table (with add/edit modal).
  - **Sub-Table A (Quotations & Milestones):** Total amount, received amount, balance due, payment status, aggregated footer summary, and full quotation edit modal.
  - **Sub-Table B (Follow-up & Site Visits):** Visit date, attendees, purpose, result, expandable discussion notes, and site visit edit modal.
  - **Sub-Table C (Site Advances & Expenses):** Advance given, expenses spent, balance pending, auto-settlement status, employee roll-up summary card, and advances edit modal.

- **Other Expenses & Overhead (`/expenses`):**
  - 5 Financial KPI metric cards: Total Incurred, Total Settled, Balance Outstanding, Monthly Burn Rate, Pending Vendor Invoices.
  - Visual analytics breakdown widgets (Expenses by Category, Top Payees, Settlement Progress).
  - Inline Mark Paid, delete, and full company expense edit modal.

- **Master Lists & Config (`/settings/lists`):**
  - Dynamic master list management for Lead Statuses, Follow-up Results, Expense Categories, Advance Purposes, Team Roster, and Referral Partners.

- **Aesthetics & UX:**
  - Dark mode support with persistent theme switcher.
  - Currency formatting in Indian Rupee (`₹#,##,###` Lakhs & Crores).
  - Standardized date formatting (`DD/MM/YYYY`).
  - Accessible modal dialogs with unsaved change warnings.

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm / yarn / pnpm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```
