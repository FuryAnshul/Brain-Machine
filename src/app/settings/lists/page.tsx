'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Plus,
  Trash2,
  RotateCcw,
  Users,
  CheckCircle2,
  FolderKanban,
  Tags,
  Receipt,
  Share2,
  ShieldAlert,
} from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { MasterLists } from '@/types';
import { cn } from '@/lib/utils';

export default function MasterListsPage() {
  const { masterLists, addItemToList, removeItemFromList, resetMasterLists, currentUser, isHydrated } =
    useCRMStore();
  const isAdmin = currentUser?.role === 'admin';
  const [activeCategory, setActiveCategory] = useState<keyof MasterLists>('statuses');
  const [newItemText, setNewItemText] = useState('');

  const categoriesConfig: {
    key: keyof MasterLists;
    title: string;
    description: string;
    icon: any;
  }[] = [
    {
      key: 'statuses',
      title: 'Pipeline Statuses',
      description: 'Lead progression phases from initial inquiry to execution and handover',
      icon: FolderKanban,
    },
    {
      key: 'results',
      title: 'Interaction Results',
      description: 'Outcome statuses logged after client calls, demos, or site surveys',
      icon: CheckCircle2,
    },
    {
      key: 'teamMembers',
      title: 'Team & Field Engineers',
      description: 'Internal employees, project managers, and field technicians',
      icon: Users,
    },
    {
      key: 'expenseCategories',
      title: 'Expense Categories',
      description: 'Classification for company overhead claims and site cash advances',
      icon: Receipt,
    },
    {
      key: 'purposes',
      title: 'Visit & Call Purposes',
      description: 'Standard activity classifications for field interactions',
      icon: Tags,
    },
    {
      key: 'referralPartners',
      title: 'Referral Directory',
      description: 'Architects, interior designers, and builder consulting partners',
      icon: Share2,
    },
  ];

  const currentCategoryConfig =
    categoriesConfig.find((c) => c.key === activeCategory) || categoriesConfig[0];
  const items = masterLists[activeCategory] || [];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addItemToList(activeCategory, newItemText.trim());
    setNewItemText('');
  };

  if (isHydrated && !isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Administrator Access Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          Master Lists & System Configuration is restricted to system administrators. Please sign in with an Administrator profile to configure lists and system settings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/clients"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
          >
            Return to Overview
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Master Lists & System Configuration
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Replaces Excel sheet: <span className="font-mono font-semibold">Lists</span>. Configure pipeline statuses, interaction results, expense categories, and team rosters.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all master lists to default Excel values?')) {
              resetMasterLists();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Category Navigation Sidebar */}
        <div className="space-y-1">
          {categoriesConfig.map((cat) => {
            const Icon = cat.icon;
            const count = (masterLists[cat.key] || []).length;
            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setNewItemText('');
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                  <span>{cat.title}</span>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List Content Manager */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {currentCategoryConfig.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentCategoryConfig.description}
            </p>
          </div>

          {/* Add New Item Form */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={`Add new ${currentCategoryConfig.title.toLowerCase().replace(/s$/, '')}...`}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          </form>

          {/* Active Items Grid */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Configured Options ({items.length})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs group hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (items.length <= 1) {
                        alert('At least one option must remain in the list.');
                        return;
                      }
                      if (confirm(`Remove "${item}" from ${currentCategoryConfig.title}?`)) {
                        removeItemFromList(activeCategory, item);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
