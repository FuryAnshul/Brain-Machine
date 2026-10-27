'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useCRMStore } from '@/lib/store';
import { ClientHeaderRollup } from '@/components/dossier/ClientHeaderRollup';
import { ClientInfoSection } from '@/components/dossier/ClientInfoSection';
import { QuotationsSubTable } from '@/components/dossier/QuotationsSubTable';
import { SiteVisitsSubTable } from '@/components/dossier/SiteVisitsSubTable';
import { AdvancesSubTable } from '@/components/dossier/AdvancesSubTable';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDossierPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const clientId = unwrappedParams.id;
  const router = useRouter();

  const {
    clients,
    siteContacts,
    quotations,
    siteVisits,
    clientAdvances,
    isHydrated,
  } = useCRMStore();

  const client = clients.find((c) => c.id === clientId);

  if (!isHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Client Record Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested client record may have been deleted or the link is invalid.
        </p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Client Overview</span>
        </Link>
      </div>
    );
  }

  const clientContacts = siteContacts.filter((sc) => sc.clientId === clientId);
  const clientQuotations = quotations.filter((q) => q.clientId === clientId);
  const clientVisits = siteVisits.filter((v) => v.clientId === clientId);
  const clientAdvanceList = clientAdvances.filter((a) => a.clientId === clientId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header & Live Rollup Cards */}
      <ClientHeaderRollup
        client={client}
        quotations={clientQuotations}
        visits={clientVisits}
      />

      {/* 2. Client & Site Info (2-Column Layout) */}
      <ClientInfoSection client={client} contacts={clientContacts} />

      {/* 3. Sub-Table A: Quotations & Payments */}
      <QuotationsSubTable clientId={client.id} quotations={clientQuotations} />

      {/* 4. Sub-Table B: Follow-up & Site Visit History */}
      <SiteVisitsSubTable
        clientId={client.id}
        clientName={client.clientName}
        visits={clientVisits}
      />

      {/* 5. Sub-Table C: Site-Specific Employee Advances & Expenses */}
      <AdvancesSubTable clientId={client.id} advances={clientAdvanceList} />
    </div>
  );
}
