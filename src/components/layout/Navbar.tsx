'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Receipt,
  Settings,
  Plus,
  Moon,
  Sun,
  AlertCircle,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { computeFollowUpDueStatus } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AddClientModal } from '../clients/AddClientModal';
import { GoogleSheetSyncModal } from '../shared/GoogleSheetSyncModal';

export function Navbar() {
  const pathname = usePathname();
  const { clients, init, isHydrated, resetToFactoryDemo } = useCRMStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    init();
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [init]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Overdue follow-ups count
  const overdueCount = isHydrated
    ? clients.filter((c) => computeFollowUpDueStatus(c.nextFollowUpDate, c.status) === 'Overdue').length
    : 0;

  const navLinks = [
    { href: '/clients', label: 'Client Overview', icon: Users },
    { href: '/expenses', label: 'Other Expenses & Overhead', icon: Receipt },
    { href: '/settings/lists', label: 'Master Lists & Config', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-6">
              <Link href="/clients" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                      Home Automation
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      CRM v5.4
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                    Luxury Automation & Operations Suite
                  </p>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === '/clients'
                      ? pathname === '/' || pathname.startsWith('/clients')
                      : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Hand Controls */}
            <div className="flex items-center gap-3">
              {/* Overdue alert indicator */}
              {overdueCount > 0 && (
                <Link
                  href="/clients?due=Overdue"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900 animate-pulse hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  title="Click to view overdue follow-ups"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>{overdueCount} Overdue</span>
                </Link>
              )}

              {/* Google Sheet Live Storage & Sync Trigger */}
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm transition-colors"
                title="Google Sheet Live Storage & Sync"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Google Sheet</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-800/70 font-bold">
                  {clients.length}
                </span>
              </button>

              {/* Quick Add Client Button */}
              <button
                onClick={() => setIsAddClientOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Client</span>
              </button>

              {/* Demo Reset Button */}
              <button
                onClick={() => {
                  if (confirm('Reset CRM to factory demo data from Home_Automation_CRM_v5_4.xlsx?')) {
                    resetToFactoryDemo();
                    window.location.reload();
                  }
                }}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset to Excel Demo Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Dark/Light mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/clients'
                ? pathname === '/' || pathname.startsWith('/clients')
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 py-1 px-2 font-medium rounded-md',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Add Client Modal */}
      <AddClientModal isOpen={isAddClientOpen} onClose={() => setIsAddClientOpen(false)} />

      {/* Google Sheet Live Storage & Sync Modal */}
      <GoogleSheetSyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
    </>
  );
}
