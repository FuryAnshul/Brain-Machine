'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Search,
  Plus,
  Trash2,
  Download,
  IndianRupee,
  Users,
  Pencil,
} from 'lucide-react';
import { ClientAdvanceExpense } from '@/types';
import { formatINR, formatDate, exportToCSV } from '@/lib/formatters';
import { AdvanceStatusBadge } from '@/components/shared/Badges';
import { useCRMStore } from '@/lib/store';
import { AddAdvanceModal } from './AddAdvanceModal';
import { EditAdvanceModal } from './EditAdvanceModal';

interface AdvancesSubTableProps {
  clientId: string;
  advances: ClientAdvanceExpense[];
}

export function AdvancesSubTable({ clientId, advances }: AdvancesSubTableProps) {
  const { deleteClientAdvance, masterLists } = useCRMStore();
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<ClientAdvanceExpense | null>(null);

  const filteredAdvances = useMemo(() => {
    return advances.filter((adv) => {
      if (search) {
        const q = search.toLowerCase();
        if (!adv.remarks.toLowerCase().includes(q)) return false;
      }
      if (employeeFilter !== 'all' && adv.employeeName !== employeeFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && adv.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [advances, search, employeeFilter, categoryFilter]);

  // Employee Roll-up Summary Calculation
  const employeeRollups = useMemo(() => {
    const map = new Map<
      string,
      { totalAdvanced: number; actualSpent: number; balanceReturned: number; netPending: number }
    >();

    advances.forEach((adv) => {
      const current = map.get(adv.employeeName) || {
        totalAdvanced: 0,
        actualSpent: 0,
        balanceReturned: 0,
        netPending: 0,
      };
      current.totalAdvanced += adv.amountAdvanced;
      current.actualSpent += adv.actualAmountSpent;
      current.balanceReturned += adv.balanceReturned;
      current.netPending += adv.balancePending;
      map.set(adv.employeeName, current);
    });

    return Array.from(map.entries()).map(([employee, stats]) => ({
      employee,
      ...stats,
    }));
  }, [advances]);

  const handleExport = () => {
    const data = filteredAdvances.map((adv) => ({
      Employee: adv.employeeName,
      Date: formatDate(adv.expenseDate),
      Category: adv.category,
      'Amount Advanced': formatINR(adv.amountAdvanced),
      'Actual Amount Spent': formatINR(adv.actualAmountSpent),
      'Balance Returned': formatINR(adv.balanceReturned),
      'Balance Pending': formatINR(adv.balancePending),
      'Payment Status': adv.paymentStatus,
      Remarks: adv.remarks,
    }));
    exportToCSV(data, `Site_Advances_${clientId}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sub-Table C: Site-Specific Employee Advances & Expenses
            </h3>
            <p className="text-[11px] text-slate-400">
              Cash disbursements, petty cash bills, and technician balance settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Advance</span>
          </button>
        </div>
      </div>

      {/* Employee Roll-up Summary Card */}
      {employeeRollups.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Employee Roll-up Summary (Site Specific)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {employeeRollups.map((emp) => (
              <div
                key={emp.employee}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs space-y-1"
              >
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{emp.employee}</span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      emp.netPending > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : emp.netPending < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {emp.netPending > 0
                      ? `+${formatINR(emp.netPending)} (Return)`
                      : emp.netPending < 0
                      ? `${formatINR(emp.netPending)} (Payable)`
                      : 'Settled'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Adv: {formatINR(emp.totalAdvanced)}</span>
                  <span>Spent: {formatINR(emp.actualSpent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense notes..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Employees</option>
          {masterLists.teamMembers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {masterLists.expenseCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Employee Name</th>
              <th className="py-2.5 px-3">Expense Date</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Amount Advanced</th>
              <th className="py-2.5 px-3 text-right">Actual Spent</th>
              <th className="py-2.5 px-3 text-right">Balance Returned</th>
              <th className="py-2.5 px-3 text-right">Balance Pending</th>
              <th className="py-2.5 px-3">Payment Status</th>
              <th className="py-2.5 px-3 min-w-[180px]">Remarks</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAdvances.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                  No site advances recorded yet. Click &quot;Record Advance&quot; to log expenses.
                </td>
              </tr>
            ) : (
              filteredAdvances.map((adv) => (
                <tr
                  key={adv.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {adv.employeeName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(adv.expenseDate)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {adv.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatINR(adv.amountAdvanced)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatINR(adv.actualAmountSpent)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatINR(adv.balanceReturned)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span
                      className={
                        adv.balancePending > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : adv.balancePending < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      {formatINR(adv.balancePending)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <AdvanceStatusBadge status={adv.paymentStatus} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[220px] truncate" title={adv.remarks}>
                    {adv.remarks || '-'}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingAdvance(adv)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit Advance / Expense"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this site advance entry?')) {
                            deleteClientAdvance(adv.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddAdvanceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        clientId={clientId}
      />

      <EditAdvanceModal
        isOpen={!!editingAdvance}
        onClose={() => setEditingAdvance(null)}
        advance={editingAdvance}
      />
    </div>
  );
}
