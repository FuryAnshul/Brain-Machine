'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { GOOGLE_SHEET_URL } from '@/lib/mockData';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSheetSyncModal({ isOpen, onClose }: GoogleSheetSyncModalProps) {
  const { clients, quotations, siteVisits, companyExpenses, syncFromGoogleSheet, isSyncing, lastSyncedAt } =
    useCRMStore();
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const handleSync = async () => {
    setSyncStatus({ type: 'idle' });
    const result = await syncFromGoogleSheet();
    if (result.success) {
      setSyncStatus({
        type: 'success',
        message: `Successfully synchronized ${result.count} clients from Google Sheets!`,
      });
    } else {
      setSyncStatus({
        type: 'error',
        message: result.error || 'Failed to sync with Google Sheets.',
      });
    }
  };

  const formattedLastSynced = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not synced yet';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Sheets Data Storage & Sync" maxWidth="lg">
      <div className="space-y-6">
        {/* Connection Header Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Google Sheet Connected
                </h4>
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Home Automation CRM Workbook v5.4
              </p>
            </div>
          </div>

          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
          >
            <span>Open in Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        {/* Dataset Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Clients</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {clients.length}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Quotations</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {quotations.length}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Site Visits</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {siteVisits.length}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Company Expenses</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {companyExpenses.length}
            </p>
          </div>
        </div>

        {/* Link Details */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            Connected Storage URL:
          </div>
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 select-all">
            {GOOGLE_SHEET_URL}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Last Synced: <strong className="text-slate-700 dark:text-slate-300">{formattedLastSynced}</strong></span>
            <span>API Route: <code className="text-blue-500 font-mono">/api/sync-google-sheet</code></span>
          </div>
        </div>

        {/* Status notification */}
        {syncStatus.type === 'success' && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncStatus.message}</span>
          </div>
        )}

        {syncStatus.type === 'error' && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* How It Works Explainer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Storage & Synchronization Architecture</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Initial Ingestion:</strong> All 68 client records, quotations, and expenses from your Google Sheet workbook are parsed and loaded into the CRM.
            </li>
            <li>
              <strong>Instant Local Persistence:</strong> Any edits you make in the CRM (Client details, Quotation amounts, Site Visits, Advances, Company Expenses) are instantly persisted in your browser's persistent store.
            </li>
            <li>
              <strong>Live Ingestion Sync:</strong> Click <em>&ldquo;Sync from Google Sheet&rdquo;</em> anytime to re-pull the newest rows directly from the live Google Drive spreadsheet.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Live from Google Sheet'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
