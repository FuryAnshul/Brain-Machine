'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Shield,
  LogIn,
  LogOut,
  ChevronDown,
  UserCheck,
  Database,
} from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { computeFollowUpDueStatus } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AddClientModal } from '../clients/AddClientModal';
import { GoogleSheetSyncModal } from '../shared/GoogleSheetSyncModal';
import { DataPersistenceModal } from '../shared/DataPersistenceModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clients, init, isHydrated, resetToFactoryDemo, currentUser, logout, users, login } =
    useCRMStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPersistenceModalOpen, setIsPersistenceModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setIsUserMenuOpen(true);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 300);
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.replace('/login');
  };

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
  ];

  if (pathname === '/login') {
    return null;
  }

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
                  if (
                    confirm(
                      'Reset CRM business records to factory Excel demo dataset?\n\n' +
                        'NOTE: Your active user account, session, theme, and webhook configuration will be safely preserved.'
                    )
                  ) {
                    resetToFactoryDemo();
                  }
                }}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset to Excel Demo Data (Preserves User Settings & Session)"
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

              {/* User Account / Profile Dropdown */}
              {isHydrated && currentUser ? (
                <div
                  className="relative"
                  ref={userMenuRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs"
                    title="User Profile & System Controls"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                        currentUser.role === 'admin'
                          ? 'bg-blue-600'
                          : currentUser.role === 'engineer'
                          ? 'bg-cyan-600'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] truncate hidden sm:inline">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded hidden md:inline ${
                        currentUser.role === 'admin'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 text-slate-400 transition-transform duration-200',
                        isUserMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* Popover Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl py-2 z-50 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                      {/* User Info Header */}
                      <div className="px-3.5 py-2.5">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                              currentUser.role === 'admin'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {currentUser.role}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Session
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-medium">
                            Prototype Mode
                          </span>
                        </div>
                      </div>

                      {/* Administrator Only Features: Google Sheet Sync, System Configuration & Master Lists */}
                      {currentUser.role === 'admin' && (
                        <div className="py-1.5 px-1 space-y-0.5">
                          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            Administrator Controls
                          </div>

                          {/* Google Sheet Live Storage & Sync */}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsSyncModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group"
                            title="Google Sheet Live Storage & Sync"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div className="font-semibold text-xs leading-none">Google Sheet Sync</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Live storage & sync</div>
                              </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                              {clients.length} rows
                            </span>
                          </button>

                          {/* System Configuration & Master Lists */}
                          <Link
                            href="/settings/lists"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                          >
                            <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                              <Settings className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs leading-none">System Configuration</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Master lists & rosters</div>
                            </div>
                          </Link>

                          {/* Admin Console */}
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                          >
                            <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                              <Shield className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs leading-none">Admin Console</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">User accounts & roles</div>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* General Profile Options */}
                      <div className="py-1 px-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsPersistenceModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <Database className="w-3.5 h-3.5 text-blue-500" />
                          <span>Data Storage & Integrity</span>
                        </button>

                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            router.replace('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Switch Profile / Login</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
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

      {/* Data Integrity & Persistence Architecture Modal */}
      <DataPersistenceModal
        isOpen={isPersistenceModalOpen}
        onClose={() => setIsPersistenceModalOpen(false)}
      />
    </>
  );
}
