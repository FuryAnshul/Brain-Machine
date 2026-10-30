'use client';

import React, { useState } from 'react';
import {
  Database,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Settings,
  Lock,
  Info,
} from 'lucide-react';
import { Modal } from './Modal';
import { useCRMStore } from '@/lib/store';
import { STORAGE_KEYS } from '@/lib/storageKeys';

interface DataPersistenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataPersistenceModal({ isOpen, onClose }: DataPersistenceModalProps) {
  const {
    clients,
    quotations,
    siteVisits,
    clientAdvances,
    companyExpenses,
    masterLists,
    currentUser,
    users,
    googleSheetWebhookUrl,
    storageHealth,
    resetToFactoryDemo,
  } = useCRMStore();

  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = () => {
    if (
      confirm(
        'Reset business demo data to Excel factory defaults?\n\n' +
          'NOTE: Your user account, active login session, webhook URL, and theme will remain safe and unaffected.'
      )
    ) {
      resetToFactoryDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Integrity & Persistence Architecture"
      subtitle="Phase 6 Data Storage, Validation & Limitations Overview"
      maxWidth="2xl"
    >
      <div className="space-y-6 text-xs text-slate-600 dark:text-slate-300">
        {/* Reset Success Alert */}
        {resetSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Business demo records successfully restored to factory Excel defaults. Active user session and preferences were preserved!
            </span>
          </div>
        )}

        {/* 1. Storage Architecture & Partitioning */}
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span>Storage Partitions & Data Locations</span>
          </h4>
          <p className="text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            Data is strictly segregated into three isolated browser storage partitions. Resetting business demo data never touches user preferences or active sessions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Demo Data Partition */}
            <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Business Demo Data</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono">
                  Partition 1
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">
                {STORAGE_KEYS.DEMO_DATA}
              </p>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside space-y-0.5 pt-1">
                <li>{clients.length} Clients</li>
                <li>{quotations.length} Quotations</li>
                <li>{siteVisits.length} Site Visits</li>
                <li>{clientAdvances.length} Client Advances</li>
                <li>{companyExpenses.length} Company Expenses</li>
              </ul>
            </div>

            {/* User Preferences Partition */}
            <div className="p-3 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">User Preferences</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-mono">
                  Partition 2
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">
                {STORAGE_KEYS.USER_PREFERENCES}
              </p>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside space-y-0.5 pt-1">
                <li>Theme (Light / Dark)</li>
                <li>Table column visibility</li>
                <li>Webhook Endpoint: {googleSheetWebhookUrl ? 'Configured' : 'Default'}</li>
              </ul>
            </div>

            {/* Auth Session Partition */}
            <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Auth Session</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-mono">
                  Partition 3
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">
                {STORAGE_KEYS.AUTH_SESSION}
              </p>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside space-y-0.5 pt-1">
                <li>User: {currentUser?.name || 'Guest'}</li>
                <li>Role: {currentUser?.role || 'None'}</li>
                <li>{users.length} Registered Accounts</li>
                <li className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero passwords saved</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Security & Zero Secret Exposure Guarantee */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-slate-900 dark:text-white">
              Data Validation & Privacy Shield
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                Pre-Save Data Validation
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                All mutations pass through runtime schema guards. Amounts are clamped to non-negative numbers, dates are verified, and corrupted JSON is automatically repaired.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                Zero Sensitive Data Exposure
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Plaintext passwords and recovery keys are strictly filtered and omitted prior to serialization. They never appear in browser storage, console logs, or client-facing errors.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Clearly Documented Limitations */}
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Documented Limitations of Browser-Local Persistence</span>
          </h4>
          <div className="space-y-2 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">1. Device & Browser Isolation:</span>
              <span className="text-slate-600 dark:text-slate-300">
                Data saved in browser localStorage is restricted to this exact browser and machine. Edits made on one device will not automatically sync to mobile phones or other team laptops unless pushed through Google Sheets sync or backend integration.
              </span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">2. Storage Quota Limits:</span>
              <span className="text-slate-600 dark:text-slate-300">
                Standard web browsers allocate 5MB to 10MB of storage per origin for localStorage. Large file attachments or hundreds of thousands of historical logs should be archived to external cloud storage or Google Drive.
              </span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">3. Private / Incognito Mode:</span>
              <span className="text-slate-600 dark:text-slate-300">
                Browsing in Private/Incognito windows creates a temporary in-memory store that is completely erased once the browser tab or window is closed.
              </span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">4. Multi-Tab Concurrency:</span>
              <span className="text-slate-600 dark:text-slate-300">
                LocalStorage lacks distributed optimistic concurrency locks. If two tabs modify data concurrently without refreshing, the last writer overrides previous changes.
              </span>
            </div>
          </div>
        </div>

        {/* 4. Controls Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">
              Storage Health: {storageHealth.wasCorrupted ? 'Repaired' : 'Healthy'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetDemo}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data Only</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
