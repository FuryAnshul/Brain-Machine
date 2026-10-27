'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  Pencil,
} from 'lucide-react';
import { SiteVisit } from '@/types';
import { formatDate, exportToCSV } from '@/lib/formatters';
import { ResultBadge } from '@/components/shared/Badges';
import { useCRMStore } from '@/lib/store';
import { LogVisitModal } from '@/components/clients/LogVisitModal';
import { EditSiteVisitModal } from './EditSiteVisitModal';

interface SiteVisitsSubTableProps {
  clientId: string;
  clientName: string;
  visits: SiteVisit[];
}

export function SiteVisitsSubTable({
  clientId,
  clientName,
  visits,
}: SiteVisitsSubTableProps) {
  const { deleteSiteVisit, masterLists } = useCRMStore();
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SiteVisit | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (search) {
        const query = search.toLowerCase();
        const match =
          v.workDiscussion.toLowerCase().includes(query) ||
          (v.remarks && v.remarks.toLowerCase().includes(query));
        if (!match) return false;
      }
      if (purposeFilter !== 'all' && v.purpose !== purposeFilter) {
        return false;
      }
      if (assignedFilter !== 'all' && v.assignedTo !== assignedFilter) {
        return false;
      }
      if (resultFilter !== 'all' && v.result !== resultFilter) {
        return false;
      }
      return true;
    });
  }, [visits, search, purposeFilter, assignedFilter, resultFilter]);

  const handleExport = () => {
    const data = filteredVisits.map((v) => ({
      Date: formatDate(v.date),
      Purpose: v.purpose,
      'Work / Discussion': v.workDiscussion,
      'Assigned To': v.assignedTo,
      'Next Follow-up': formatDate(v.nextDate),
      Result: v.result,
      Remarks: v.remarks || '',
    }));
    exportToCSV(data, `Site_Visits_${clientId}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden space-y-3 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sub-Table B: Follow-up & Site Visit History
            </h3>
            <p className="text-[11px] text-slate-400">
              Field inspection logs, technical discussions, and next visit commitments
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
            <span>Log Visit / Call</span>
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
            placeholder="Search work notes, discussion, scope..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Purpose Filter */}
        <select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Purposes</option>
          {masterLists.purposes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Assigned To Filter */}
        <select
          value={assignedFilter}
          onChange={(e) => setAssignedFilter(e.target.value)}
          className="text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Team</option>
          {masterLists.teamMembers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Result Filter */}
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Results</option>
          {masterLists.results.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Purpose</th>
              <th className="py-2.5 px-3 min-w-[260px]">Work / Discussion Notes</th>
              <th className="py-2.5 px-3">Assigned To</th>
              <th className="py-2.5 px-3">Next Date</th>
              <th className="py-2.5 px-3">Result</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No visits or calls logged yet. Click &quot;Log Visit / Call&quot; to add an entry.
                </td>
              </tr>
            ) : (
              filteredVisits.map((v) => {
                const isExpanded = expandedIds.includes(v.id);
                return (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(v.date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {v.purpose}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div
                        onClick={() => toggleExpand(v.id)}
                        className="cursor-pointer text-slate-800 dark:text-slate-200 hover:text-blue-600"
                      >
                        <p className={isExpanded ? '' : 'line-clamp-2'}>{v.workDiscussion}</p>
                        {v.remarks && isExpanded && (
                          <p className="mt-1 text-[11px] text-slate-400 italic">
                            Remarks: {v.remarks}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {v.assignedTo}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {v.nextDate ? formatDate(v.nextDate) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <ResultBadge result={v.result} />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingVisit(v)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Edit Visit Log"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this site visit log entry?')) {
                              deleteSiteVisit(v.id);
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <LogVisitModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        clientId={clientId}
        clientName={clientName}
      />

      <EditSiteVisitModal
        isOpen={!!editingVisit}
        onClose={() => setEditingVisit(null)}
        visit={editingVisit}
      />
    </div>
  );
}
