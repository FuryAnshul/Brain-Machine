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
