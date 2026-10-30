'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Receipt,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Download,
  Wallet,
  Pencil,
} from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { formatINR, formatDate, exportToCSV } from '@/lib/formatters';
import { PaymentBadge } from '@/components/shared/Badges';
import {
  SharedTableFilterBar,
  FacetConfig,
  PresetTab,
  ColumnItem,
} from '@/components/shared/SharedTableFilterBar';
import { ExpenseAnalyticsWidgets } from './ExpenseAnalyticsWidgets';
import { AddCompanyExpenseModal } from './AddCompanyExpenseModal';
import { EditCompanyExpenseModal } from './EditCompanyExpenseModal';
import { ExpensePaymentStatus, CompanyExpense } from '@/types';

export function ExpensesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    companyExpenses,
    clientAdvances,
    markExpenseAsPaid,
    updateCompanyExpense,
    deleteCompanyExpense,
    masterLists,
  } = useCRMStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<CompanyExpense | null>(null);

  // Column visibility
  const defaultColumns: ColumnItem[] = [
    { id: 'employeeName', label: 'Employee Name', isVisible: true },
    { id: 'expenseCategory', label: 'Expense Category', isVisible: true },
    { id: 'date', label: 'Date', isVisible: true },
    { id: 'amount', label: 'Amount', isVisible: true },
    { id: 'paymentStatus', label: 'Payment Status', isVisible: true },
    { id: 'remarks', label: 'Remarks', isVisible: true },
    { id: 'amountPaid', label: 'Amount Paid', isVisible: true },
    { id: 'balanceOutstanding', label: 'Balance Outstanding', isVisible: true },
    { id: 'actions', label: 'Actions', isVisible: true },
  ];
  const [columns, setColumns] = useState<ColumnItem[]>(defaultColumns);

  const toggleColumn = (colId: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, isVisible: !c.isVisible } : c))
    );
  };

  const isColVisible = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    return col ? col.isVisible : true;
  };

  // URL search params
  const searchQuery = (searchParams.get('q') || '').toLowerCase().trim();
  const categoryFilter = (searchParams.get('category') || '').split(',').filter(Boolean);
  const statusFilter = (searchParams.get('status') || '').split(',').filter(Boolean);
  const employeeFilter = (searchParams.get('employee') || '').split(',').filter(Boolean);
  const dateRange = searchParams.get('dateRange') || '';

  // 1. Financial KPI Cards
  const kpis = useMemo(() => {
    const totalExpenses = companyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidAmount = companyExpenses.reduce((sum, e) => sum + (e.amountPaid || 0), 0);
    const outstanding = companyExpenses.reduce(
      (sum, e) => sum + (e.balanceOutstanding || e.amount - (e.amountPaid || 0)),
      0
    );
    const totalEntries = companyExpenses.length;
    const openItems = companyExpenses.filter((e) => e.paymentStatus !== 'Paid').length;

    // Global client advances rollup
    const totalAdvanced = clientAdvances.reduce((sum, a) => sum + a.amountAdvanced, 0);
    const totalSpent = clientAdvances.reduce((sum, a) => sum + a.actualAmountSpent, 0);
    const totalReturned = clientAdvances.reduce((sum, a) => sum + a.balanceReturned, 0);
    const netAdvancePending = totalAdvanced - totalSpent - totalReturned;

    return {
      totalExpenses,
      paidAmount,
      outstanding,
      totalEntries,
      openItems,
      totalAdvanced,
      totalSpent,
      totalReturned,
      netAdvancePending,
    };
  }, [companyExpenses, clientAdvances]);

  // Facet configs
  const categoryFacetOptions = useMemo(() => {
    return masterLists.expenseCategories.map((cat) => ({
      label: cat,
      value: cat,
      count: companyExpenses.filter((e) => e.expenseCategory === cat).length,
    }));
  }, [masterLists.expenseCategories, companyExpenses]);

  const employeeFacetOptions = useMemo(() => {
    return masterLists.teamMembers.map((emp) => ({
      label: emp,
      value: emp,
      count: companyExpenses.filter((e) => e.employeeName === emp).length,
    }));
  }, [masterLists.teamMembers, companyExpenses]);

  const statusFacetOptions = [
    {
      label: 'Pending',
      value: 'Pending',
      count: companyExpenses.filter((e) => e.paymentStatus === 'Pending').length,
    },
    {
      label: 'Partially Paid',
      value: 'Partially Paid',
      count: companyExpenses.filter((e) => e.paymentStatus === 'Partially Paid').length,
    },
    {
      label: 'Paid',
      value: 'Paid',
      count: companyExpenses.filter((e) => e.paymentStatus === 'Paid').length,
    },
  ];

  const facets: FacetConfig[] = [
    { key: 'category', title: 'Category', options: categoryFacetOptions },
    { key: 'status', title: 'Payment Status', options: statusFacetOptions },
    { key: 'employee', title: 'Employee', options: employeeFacetOptions },
  ];

  // Preset tabs
  const presetTabs: PresetTab[] = [
    { id: 'all', label: 'All Expenses', count: companyExpenses.length },
    { id: 'pending', label: 'Pending Reimbursements', count: kpis.openItems },
    {
      id: 'paid',
      label: 'Paid & Settled',
      count: companyExpenses.filter((e) => e.paymentStatus === 'Paid').length,
    },
  ];

  const activePresetTab = useMemo(() => {
    if (statusFilter.includes('Pending')) return 'pending';
    if (statusFilter.includes('Paid')) return 'paid';
    return 'all';
  }, [statusFilter]);

  const handlePresetTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    if (tabId === 'pending') {
      params.set('status', 'Pending,Partially Paid');
    } else if (tabId === 'paid') {
      params.set('status', 'Paid');
    }
    router.push(`/expenses?${params.toString()}`);
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return companyExpenses.filter((e) => {
      if (searchQuery) {
        const match =
          e.employeeName.toLowerCase().includes(searchQuery) ||
          e.remarks.toLowerCase().includes(searchQuery);
        if (!match) return false;
      }
      if (categoryFilter.length > 0 && !categoryFilter.includes(e.expenseCategory)) {
        return false;
      }
      if (employeeFilter.length > 0 && !employeeFilter.includes(e.employeeName)) {
        return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(e.paymentStatus)) {
        return false;
      }
      return true;
    });
  }, [companyExpenses, searchQuery, categoryFilter, employeeFilter, statusFilter]);

  const handleExportCSV = () => {
    const data = filteredExpenses.map((e) => ({
      Employee: e.employeeName,
      Category: e.expenseCategory,
      Date: formatDate(e.date),
      Amount: formatINR(e.amount),
      'Payment Status': e.paymentStatus,
      Remarks: e.remarks,
      'Amount Paid': formatINR(e.amountPaid),
      'Balance Outstanding': formatINR(e.balanceOutstanding),
    }));
    exportToCSV(data, 'Company_Overhead_Expenses');
  };

  return (
    <div className="space-y-6">
      {/* 1. Financial KPI Ribbon (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Claims</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-black font-mono text-slate-900 dark:text-white">
            {formatINR(kpis.totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {kpis.totalEntries} logged overheads
          </div>
        </div>

        {/* Card 2: Settled Paid Amount */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Paid Amount</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(kpis.paidAmount)}
          </div>
          <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
            Settled reimbursements
          </div>
        </div>

        {/* Card 3: Outstanding Balance */}
        <div
          className={`border rounded-xl p-3.5 shadow-sm ${
            kpis.outstanding > 0
              ? 'bg-rose-50/20 border-rose-300 dark:border-rose-900/70'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                kpis.outstanding > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400'
              }`}
            >
              Outstanding Due
            </span>
            <AlertCircle
              className={`w-4 h-4 ${
                kpis.outstanding > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`mt-2 text-xl font-black font-mono ${
              kpis.outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatINR(kpis.outstanding)}
          </div>
          <div
            className={`text-[10px] mt-0.5 ${
              kpis.outstanding > 0 ? 'text-rose-500 font-semibold' : 'text-slate-400'
            }`}
          >
            {kpis.openItems} items pending payout
          </div>
        </div>

        {/* Card 4: Open Items Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Claims</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400">
            {kpis.openItems}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting full payment</div>
        </div>

        {/* Card 5: Global Client Advance Rollup */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Site Advances Net</span>
            <Wallet className="w-4 h-4 text-purple-500" />
          </div>
          <div
            className={`mt-2 text-xl font-black font-mono ${
              kpis.netAdvancePending > 0
                ? 'text-amber-600 dark:text-amber-400'
                : kpis.netAdvancePending < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatINR(kpis.netAdvancePending)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all client sites</div>
        </div>
      </div>

      {/* 2. Analytics Breakdown Widgets (Side Panels / Sub-Widgets) */}
      <ExpenseAnalyticsWidgets
        expenses={companyExpenses}
        clientAdvances={clientAdvances}
      />

      {/* 3. Reusable Filter Bar */}
      <SharedTableFilterBar
        searchPlaceholder="Search employee name, notes, bills..."
        presetTabs={presetTabs}
        activePresetTab={activePresetTab}
        onPresetTabChange={handlePresetTabChange}
        facets={facets}
        columns={columns}
        onToggleColumn={toggleColumn}
        onExportCSV={handleExportCSV}
        extraActions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        }
      />

      {/* 4. Main Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {isColVisible('employeeName') && <th className="py-3 px-3">Employee Name</th>}
                {isColVisible('expenseCategory') && <th className="py-3 px-3">Expense Category</th>}
                {isColVisible('date') && <th className="py-3 px-3">Date</th>}
                {isColVisible('amount') && <th className="py-3 px-3 text-right">Claim Amount</th>}
                {isColVisible('paymentStatus') && <th className="py-3 px-3">Payment Status</th>}
                {isColVisible('remarks') && <th className="py-3 px-3 min-w-[200px]">Remarks / Purpose</th>}
                {isColVisible('amountPaid') && <th className="py-3 px-3 text-right">Amount Paid</th>}
                {isColVisible('balanceOutstanding') && (
                  <th className="py-3 px-3 text-right">Balance Outstanding</th>
                )}
                {isColVisible('actions') && <th className="py-3 px-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No expense records found matching filters
                      </p>
                      <p className="text-xs text-slate-400">
                        Try clearing search terms or selecting different categories.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record New Expense</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {isColVisible('employeeName') && (
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {exp.employeeName}
                      </td>
                    )}

                    {isColVisible('expenseCategory') && (
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {exp.expenseCategory}
                        </span>
                      </td>
                    )}

                    {isColVisible('date') && (
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                    )}

                    {isColVisible('amount') && (
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatINR(exp.amount)}
                      </td>
                    )}

                    {isColVisible('paymentStatus') && (
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <PaymentBadge status={exp.paymentStatus} />
                      </td>
                    )}

                    {isColVisible('remarks') && (
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[240px] truncate" title={exp.remarks}>
                        {exp.remarks || '-'}
                      </td>
                    )}

                    {isColVisible('amountPaid') && (
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatINR(exp.amountPaid)}
                      </td>
                    )}

                    {isColVisible('balanceOutstanding') && (
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            exp.balanceOutstanding > 0
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          {formatINR(exp.balanceOutstanding)}
                        </span>
                      </td>
                    )}

                    {isColVisible('actions') && (
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedExpenseForEdit(exp)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {exp.paymentStatus !== 'Paid' && (
                            <button
                              onClick={() => markExpenseAsPaid(exp.id)}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors flex items-center gap-1"
                              title="Mark as Full Paid"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Paid</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm('Delete this company expense record?')) {
                                deleteCompanyExpense(exp.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredExpenses.length}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{companyExpenses.length}</span> entries
          </div>
          <div className="flex items-center gap-4">
            <div>
              Total Filtered Claims:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatINR(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}
              </span>
            </div>
            <div>
              Total Outstanding:{' '}
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                {formatINR(filteredExpenses.reduce((sum, e) => sum + e.balanceOutstanding, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AddCompanyExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <EditCompanyExpenseModal
        isOpen={!!selectedExpenseForEdit}
        onClose={() => setSelectedExpenseForEdit(null)}
        expense={selectedExpenseForEdit}
      />
    </div>
  );
}
