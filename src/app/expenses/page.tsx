import React, { Suspense } from 'react';
import { ExpensesTable } from '@/components/expenses/ExpensesTable';

export const metadata = {
  title: 'Company Expenses & Overhead | Home Automation CRM',
  description:
    'Comprehensive operational expense tracking, reimbursements, category analytics, and site advances management',
};

export default function ExpensesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Other Expenses & Company Overhead
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Operational expenses, tool purchases, travel reimbursements, and cross-site advance rollups
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-5 gap-3 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        }
      >
        <ExpensesTable />
      </Suspense>
    </div>
  );
}
