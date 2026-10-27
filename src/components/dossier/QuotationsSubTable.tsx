'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Download,
  Pencil,
} from 'lucide-react';
import { Quotation, PaymentStatus } from '@/types';
import { formatINR, formatDate, exportToCSV } from '@/lib/formatters';
import { PaymentBadge } from '@/components/shared/Badges';
import { useCRMStore } from '@/lib/store';
import { AddQuotationModal } from './AddQuotationModal';
import { EditQuotationModal } from './EditQuotationModal';

interface QuotationsSubTableProps {
  clientId: string;
  quotations: Quotation[];
}

export function QuotationsSubTable({ clientId, quotations }: QuotationsSubTableProps) {
  const { deleteQuotation } = useCRMStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);

  const filteredQuotes = useMemo(() => {
    return quotations.filter((q) => {
      if (search) {
        const query = search.toLowerCase();
        const match =
          q.quotationNo.toLowerCase().includes(query) ||
          q.remarks.toLowerCase().includes(query);
        if (!match) return false;
      }
      if (statusFilter !== 'all' && q.paymentStatus !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [quotations, search, statusFilter]);

  // Aggregated sums for table footer
  const totalAmountSum = filteredQuotes.reduce(
    (sum, q) => sum + (q.totalAmount || q.amount || 0),
    0
  );
  const totalReceivedSum = filteredQuotes.reduce(
    (sum, q) => sum + (q.amountReceived || 0),
    0
  );

  const handleExport = () => {
    const data = filteredQuotes.map((q) => ({
      'Quotation No': q.quotationNo,
      Date: formatDate(q.date),
      Amount: formatINR(q.amount),
      'Payment Status': q.paymentStatus,
      'Amount Received': formatINR(q.amountReceived),
      'Total Amount': formatINR(q.totalAmount || q.amount),
      'Received Date': formatDate(q.receivedDate),
      'Follow-up Date': formatDate(q.followUpDate),
      Remarks: q.remarks,
    }));
    exportToCSV(data, `Quotations_${clientId}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden space-y-3 p-4">
      {/* Sub-Table Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sub-Table A: Quotations & Payment Milestones
            </h3>
            <p className="text-[11px] text-slate-400">
              Commercial proposals, revisions, and payment receipt tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotation no, terms or remarks..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          {['all', 'Pending', 'Partially Received', 'Received'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Quotation No.</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right">Base Amount</th>
              <th className="py-2.5 px-3">Payment Status</th>
              <th className="py-2.5 px-3 text-right">Amount Received</th>
              <th className="py-2.5 px-3 text-right">Total Scope Amount</th>
              <th className="py-2.5 px-3">Received Date</th>
              <th className="py-2.5 px-3">Follow-up Date</th>
              <th className="py-2.5 px-3 min-w-[180px]">Remarks</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                  No quotations recorded yet. Click &quot;Add Quotation&quot; to log a quote.
                </td>
              </tr>
            ) : (
              filteredQuotes.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {q.quotationNo}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {formatDate(q.date)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatINR(q.amount)}
                  </td>
                  <td className="py-2.5 px-3">
                    <PaymentBadge status={q.paymentStatus} />
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINR(q.amountReceived)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(q.totalAmount || q.amount)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {q.receivedDate ? formatDate(q.receivedDate) : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {formatDate(q.followUpDate)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[220px] truncate" title={q.remarks}>
                    {q.remarks || '-'}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingQuote(q)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit Quotation / Amount"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete quotation ${q.quotationNo}?`)) {
                            deleteQuotation(q.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Quotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* Aggregated Footer Sum */}
          {filteredQuotes.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-t-2 border-slate-200 dark:border-slate-800 text-xs">
                <td colSpan={4} className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Total Aggregations:
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {formatINR(totalReceivedSum)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {formatINR(totalAmountSum)}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <AddQuotationModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        clientId={clientId}
      />

      <EditQuotationModal
        isOpen={!!editingQuote}
        onClose={() => setEditingQuote(null)}
        quotation={editingQuote}
      />
    </div>
  );
}
