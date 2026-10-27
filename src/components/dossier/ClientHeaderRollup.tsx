'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Edit,
  FileText,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Client, Quotation, SiteVisit } from '@/types';
import { formatINR, formatDate, getWhatsAppUrl } from '@/lib/formatters';
import { StatusBadge } from '@/components/shared/Badges';
import { EditClientModal } from './EditClientModal';

interface ClientHeaderRollupProps {
  client: Client;
  quotations: Quotation[];
  visits: SiteVisit[];
}

export function ClientHeaderRollup({ client, quotations, visits }: ClientHeaderRollupProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Compute live rollups directly from sub-tables
  const latestQuote = quotations.length > 0 ? quotations[0] : null;
  const quoteNo = latestQuote ? latestQuote.quotationNo : client.quotationNo || '-';

  const totalAmount = quotations.reduce(
    (sum, q) => sum + (q.totalAmount || q.amount || 0),
    0
  );

  const receivedAmount = quotations.reduce(
    (sum, q) => sum + (q.amountReceived || 0),
    0
  );

  const balanceDue = totalAmount - receivedAmount;

  // Latest visit and next follow up
  const latestVisit = visits.length > 0 ? visits[0] : null;
  const lastVisitDate = latestVisit ? latestVisit.date : client.lastFollowUpDate;
  const nextFollowUp = latestVisit?.nextDate || client.nextFollowUpDate;

  return (
    <>
      <div className="space-y-4">
        {/* Navigation Breadcrumb & Client Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Client Overview</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {client.clientName}
              </h1>
              <StatusBadge status={client.status} className="text-xs px-3 py-1 font-bold" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {client.projectName}
              </span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:+91${client.mobileNo}`}
                  className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 hover:text-blue-600 font-semibold"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  +91 {client.mobileNo}
                </a>
                <a
                  href={getWhatsAppUrl(
                    client.mobileNo,
                    `Hello ${client.clientName}, following up on your Home Automation project (${client.projectName}).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/60 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors self-start sm:self-center shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Dossier</span>
          </button>
        </div>

        {/* Live Rollup Summary Cards (5-Card Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: Quotation No. */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Quote Reference</span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-base font-bold font-mono text-blue-600 dark:text-blue-400 truncate">
              {quoteNo}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {quotations.length} {quotations.length === 1 ? 'quote entry' : 'quotes logged'}
            </div>
          </div>

          {/* Card 2: Total Amount */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Value</span>
              <IndianRupee className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-lg font-black font-mono text-slate-900 dark:text-white">
              {formatINR(totalAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Project Scope Sum</div>
          </div>

          {/* Card 3: Received Amount */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Received</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatINR(receivedAmount)}
            </div>
            <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              Settled payments
            </div>
          </div>

          {/* Card 4: Balance Due */}
          <div
            className={`border rounded-xl p-3.5 shadow-sm ${
              balanceDue > 0
                ? 'bg-rose-50/20 border-rose-300 dark:border-rose-900/70'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  balanceDue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400'
                }`}
              >
                Balance Due
              </span>
              <AlertCircle
                className={`w-4 h-4 ${
                  balanceDue > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'
                }`}
              />
            </div>
            <div
              className={`mt-2 text-lg font-black font-mono ${
                balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {formatINR(balanceDue)}
            </div>
            <div
              className={`text-[10px] mt-0.5 ${
                balanceDue > 0 ? 'text-rose-500 font-semibold' : 'text-slate-400'
              }`}
            >
              {balanceDue > 0 ? 'Outstanding collection' : 'Fully Cleared'}
            </div>
          </div>

          {/* Card 5: Follow-up Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Timeline</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
              Next: {formatDate(nextFollowUp)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Last Visit: {formatDate(lastVisitDate)}
            </div>
          </div>
        </div>
      </div>

      <EditClientModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        client={client}
      />
    </>
  );
}
