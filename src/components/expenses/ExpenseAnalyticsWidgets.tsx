'use client';

import React, { useMemo } from 'react';
import { CompanyExpense, ClientAdvanceExpense } from '@/types';
import { formatINR } from '@/lib/formatters';
import { PieChart, Users, Wallet } from 'lucide-react';

interface ExpenseAnalyticsWidgetsProps {
  expenses: CompanyExpense[];
  clientAdvances: ClientAdvanceExpense[];
}

export function ExpenseAnalyticsWidgets({
  expenses,
  clientAdvances,
}: ExpenseAnalyticsWidgetsProps) {
  // 1. Summary by Category
  const categorySummary = useMemo(() => {
    const map = new Map<string, { total: number; outstanding: number; count: number }>();
    expenses.forEach((e) => {
      const cur = map.get(e.expenseCategory) || { total: 0, outstanding: 0, count: 0 };
      cur.total += e.amount;
      cur.outstanding += e.balanceOutstanding;
      cur.count += 1;
      map.set(e.expenseCategory, cur);
    });
    return Array.from(map.entries())
      .map(([cat, val]) => ({ category: cat, ...val }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  // 2. Summary by Employee
  const employeeSummary = useMemo(() => {
    const map = new Map<string, { totalClaimed: number; outstanding: number; count: number }>();
    expenses.forEach((e) => {
      const cur = map.get(e.employeeName) || { totalClaimed: 0, outstanding: 0, count: 0 };
      cur.totalClaimed += e.amount;
      cur.outstanding += e.balanceOutstanding;
      cur.count += 1;
      map.set(e.employeeName, cur);
    });
    return Array.from(map.entries())
      .map(([emp, val]) => ({ employee: emp, ...val }))
      .sort((a, b) => b.totalClaimed - a.totalClaimed);
  }, [expenses]);

  // 3. Client Advances Summary (Cross-client global roll-up)
  const advancesGlobalSummary = useMemo(() => {
    const map = new Map<string, { advanced: number; spent: number; netBalance: number }>();
    clientAdvances.forEach((a) => {
      const cur = map.get(a.employeeName) || { advanced: 0, spent: 0, netBalance: 0 };
      cur.advanced += a.amountAdvanced;
      cur.spent += a.actualAmountSpent;
      cur.netBalance += a.balancePending;
      map.set(a.employeeName, cur);
    });
    return Array.from(map.entries()).map(([emp, val]) => ({ employee: emp, ...val }));
  }, [clientAdvances]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Widget 1: Summary by Category */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="p-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <PieChart className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Expenses by Category
          </h4>
        </div>

        <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {categorySummary.length === 0 ? (
            <div className="py-4 text-center text-slate-400">No expenses recorded</div>
          ) : (
            categorySummary.map((item) => (
              <div key={item.category} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.count} items</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                    {formatINR(item.total)}
                  </span>
                  {item.outstanding > 0 && (
                    <span className="font-mono text-[10px] text-rose-500 font-semibold block">
                      Due: {formatINR(item.outstanding)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 2: Summary by Employee */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="p-1 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Claims by Employee
          </h4>
        </div>

        <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {employeeSummary.length === 0 ? (
            <div className="py-4 text-center text-slate-400">No claims recorded</div>
          ) : (
            employeeSummary.map((item) => (
              <div key={item.employee} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {item.employee}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.count} claims</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                    {formatINR(item.totalClaimed)}
                  </span>
                  {item.outstanding > 0 ? (
                    <span className="font-mono text-[10px] text-amber-500 font-semibold block">
                      Payable: {formatINR(item.outstanding)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-500 font-semibold block">Settled</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget 3: Global Client Advances Rollup */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Site Advances Overview
          </h4>
        </div>

        <div className="overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {advancesGlobalSummary.length === 0 ? (
            <div className="py-4 text-center text-slate-400">No site advances active</div>
          ) : (
            advancesGlobalSummary.map((item) => (
              <div key={item.employee} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {item.employee}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Adv: {formatINR(item.advanced)} | Spent: {formatINR(item.spent)}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-xs font-bold block ${
                      item.netBalance > 0
                        ? 'text-amber-500'
                        : item.netBalance < 0
                        ? 'text-rose-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {item.netBalance > 0
                      ? `+${formatINR(item.netBalance)} (Return)`
                      : item.netBalance < 0
                      ? `${formatINR(item.netBalance)} (Payable)`
                      : 'Settled'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
