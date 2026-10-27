import React, { Suspense } from 'react';
import { ClientOverviewTable } from '@/components/clients/ClientOverviewTable';

export const metadata = {
  title: 'Client Overview & Pipeline | Home Automation CRM',
  description:
    'Luxury Home Automation CRM overview, follow-up tracking, quote statuses, and site operations',
};

export default function ClientsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Client Overview & Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Replaces Excel sheet: <span className="font-mono font-semibold">Client Overview</span> (AutoFilter A7:X306). Track inquiries, site surveys, quotes, and delivery milestones.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-7 gap-3 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        }
      >
        <ClientOverviewTable />
      </Suspense>
    </div>
  );
}
