'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Calendar,
  AlertCircle,
  FileText,
  Award,
  CheckCircle2,
  Phone,
  MessageCircle,
  MoreVertical,
  ExternalLink,
  PlusCircle,
  Trash2,
  Clock,
  Sparkles,
  Pencil,
  X,
  Plus,
} from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import {
  formatINR,
  formatDate,
  computeFollowUpDueStatus,
  getWhatsAppUrl,
  exportToCSV,
} from '@/lib/formatters';
import {
  SharedTableFilterBar,
  FacetConfig,
  PresetTab,
  ColumnItem,
} from '@/components/shared/SharedTableFilterBar';
import {
  FollowUpBadge,
  StatusBadge,
  ResultBadge,
} from '@/components/shared/Badges';
import { cn } from '@/lib/utils';
import { Client, LeadStatus, FollowUpResult } from '@/types';
import { LogVisitModal } from './LogVisitModal';
import { EditClientModal } from '@/components/dossier/EditClientModal';
import { AddClientModal } from './AddClientModal';
import { Modal } from '@/components/shared/Modal';

export function ClientOverviewTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    clients,
    updateClientStatus,
    updateClientAssignedTo,
    updateClientResult,
    deleteClient,
    masterLists,
  } = useCRMStore();

  // Quick Action Modal states
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [recentlyAddedClient, setRecentlyAddedClient] = useState<Client | null>(null);
  const [selectedClientForVisit, setSelectedClientForVisit] = useState<Client | null>(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Column visibility state
  const defaultColumns: ColumnItem[] = [
    { id: 'clientName', label: 'Client Name', isVisible: true },
    { id: 'mobileNo', label: 'Mobile No.', isVisible: true },
    { id: 'projectName', label: 'Project / House', isVisible: true },
    { id: 'architectBuilder', label: 'Architect / Builder', isVisible: true },
    { id: 'referredBy', label: 'Referred By', isVisible: true },
    { id: 'status', label: 'Status', isVisible: true },
    { id: 'quotationNo', label: 'Quotation No.', isVisible: true },
    { id: 'totalAmount', label: 'Total Amount', isVisible: true },
    { id: 'lastFollowUpDate', label: 'Last Follow-up', isVisible: true },
    { id: 'nextFollowUpDate', label: 'Next Follow-up', isVisible: true },
    { id: 'followUpDue', label: 'Follow-up Due', isVisible: true },
    { id: 'assignedTo', label: 'Assigned To', isVisible: true },
    { id: 'result', label: 'Result', isVisible: true },
    { id: 'remarks', label: 'Remarks', isVisible: true },
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
  const statusFilter = (searchParams.get('status') || '').split(',').filter(Boolean);
  const assignedToFilter = (searchParams.get('assignedTo') || '').split(',').filter(Boolean);
  const resultFilter = (searchParams.get('result') || '').split(',').filter(Boolean);
  const dueFilter = searchParams.get('due') || '';
  const dateRangePreset = searchParams.get('dateRange') || '';

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = clients.length;
    let todayCount = 0;
    let overdueCount = 0;
    let quotePendingCount = 0;
    let finalCount = 0;
    let orderCount = 0;
    let completedCount = 0;

    clients.forEach((c) => {
      const due = computeFollowUpDueStatus(c.nextFollowUpDate, c.status);
      if (due === 'Today') todayCount++;
      if (due === 'Overdue') overdueCount++;
      if (c.status === 'Quotation' || c.result === 'Quotation required') quotePendingCount++;
      if (c.status === 'Final') finalCount++;
      if (c.status === 'Order') orderCount++;
      if (c.status === 'Completed') completedCount++;
    });

    return {
      total,
      todayCount,
      overdueCount,
      quotePendingCount,
      finalCount,
      orderCount,
      completedCount,
    };
  }, [clients]);

  // Facet options with real dynamic counts
  const statusFacetOptions = useMemo(() => {
    return masterLists.statuses.map((st) => ({
      label: st,
      value: st,
      count: clients.filter((c) => c.status === st).length,
    }));
  }, [masterLists.statuses, clients]);

  const assignedToFacetOptions = useMemo(() => {
    return masterLists.teamMembers.map((member) => ({
      label: member,
      value: member,
      count: clients.filter((c) => c.assignedTo === member).length,
    }));
  }, [masterLists.teamMembers, clients]);

  const resultFacetOptions = useMemo(() => {
    return masterLists.results.map((res) => ({
      label: res,
      value: res,
      count: clients.filter((c) => c.result === res).length,
    }));
  }, [masterLists.results, clients]);

  const dueFacetOptions = [
    { label: 'Overdue', value: 'Overdue', count: kpis.overdueCount },
    { label: 'Today', value: 'Today', count: kpis.todayCount },
    {
      label: 'Upcoming',
      value: 'Upcoming',
      count: clients.filter((c) => computeFollowUpDueStatus(c.nextFollowUpDate, c.status) === 'Upcoming').length,
    },
  ];

  const facets: FacetConfig[] = [
    { key: 'status', title: 'Status', options: statusFacetOptions },
    { key: 'due', title: 'Follow-up Due', options: dueFacetOptions },
    { key: 'assignedTo', title: 'Assigned To', options: assignedToFacetOptions },
    { key: 'result', title: 'Result', options: resultFacetOptions },
  ];

  // Preset tabs
  const presetTabs: PresetTab[] = [
    { id: 'all', label: 'All Clients', count: clients.length },
    { id: 'overdue', label: 'Overdue', count: kpis.overdueCount },
    { id: 'today', label: "Today's Follow-ups", count: kpis.todayCount },
    { id: 'quotations', label: 'Quotation Pending', count: kpis.quotePendingCount },
    { id: 'orders', label: 'Active Orders', count: kpis.orderCount },
    { id: 'completed', label: 'Completed', count: kpis.completedCount },
  ];

  // Determine active preset tab
  const activePresetTab = useMemo(() => {
    if (dueFilter === 'Overdue') return 'overdue';
    if (dueFilter === 'Today') return 'today';
    if (statusFilter.includes('Order')) return 'orders';
    if (statusFilter.includes('Completed')) return 'completed';
    if (statusFilter.includes('Quotation') || resultFilter.includes('Quotation required')) return 'quotations';
    return 'all';
  }, [dueFilter, statusFilter, resultFilter]);

  const handlePresetTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('due');
    params.delete('status');
    params.delete('result');

    if (tabId === 'overdue') {
      params.set('due', 'Overdue');
    } else if (tabId === 'today') {
      params.set('due', 'Today');
    } else if (tabId === 'quotations') {
      params.set('status', 'Quotation');
    } else if (tabId === 'orders') {
      params.set('status', 'Order');
    } else if (tabId === 'completed') {
      params.set('status', 'Completed');
    }
    router.push(`/clients?${params.toString()}`);
  };

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // 1. Search Query
      if (searchQuery) {
        const match =
          c.clientName.toLowerCase().includes(searchQuery) ||
          c.mobileNo.includes(searchQuery) ||
          c.projectName.toLowerCase().includes(searchQuery) ||
          c.architectBuilder.toLowerCase().includes(searchQuery) ||
          c.remarks.toLowerCase().includes(searchQuery);
        if (!match) return false;
      }

      // 2. Status
      if (statusFilter.length > 0 && !statusFilter.includes(c.status)) {
        return false;
      }

      // 3. Assigned To
      if (assignedToFilter.length > 0 && !assignedToFilter.includes(c.assignedTo)) {
        return false;
      }

      // 4. Result
      if (resultFilter.length > 0 && !resultFilter.includes(c.result)) {
        return false;
      }

      // 5. Follow-up Due
      const computedDue = computeFollowUpDueStatus(c.nextFollowUpDate, c.status);
      if (dueFilter && dueFilter !== 'all') {
        const dues = dueFilter.split(',');
        if (!dues.includes(computedDue)) return false;
      }

      // 6. Date Range preset
      if (dateRangePreset === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (c.nextFollowUpDate !== todayStr && c.lastFollowUpDate !== todayStr) return false;
      }

      return true;
    });
  }, [
    clients,
    searchQuery,
    statusFilter,
    assignedToFilter,
    resultFilter,
    dueFilter,
    dateRangePreset,
  ]);

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredClients.map((c) => ({
      'Client Name': c.clientName,
      'Mobile No': c.mobileNo,
      'Project / House': c.projectName,
      'Architect / Builder': c.architectBuilder,
      'Referred By': c.referredBy,
      Status: c.status,
      'Quotation No': c.quotationNo || '-',
      'Total Amount': formatINR(c.totalAmount),
      'Last Follow-up': formatDate(c.lastFollowUpDate),
      'Next Follow-up': formatDate(c.nextFollowUpDate),
      'Follow-up Due': computeFollowUpDueStatus(c.nextFollowUpDate, c.status),
      'Assigned To': c.assignedTo,
      Result: c.result,
      Remarks: c.remarks,
    }));
    exportToCSV(exportData, 'Client_Overview_Home_Automation_CRM');
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Title & Prominent Add Client Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Client Overview & Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Replaces Excel sheet: <span className="font-mono font-semibold">Client Overview</span> (AutoFilter A7:X306). Track inquiries, site surveys, quotes, and delivery milestones.
          </p>
        </div>

        <button
          onClick={() => setIsAddClientOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Recently Added Client Success Notification Banner */}
      {recentlyAddedClient && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Successfully added client <strong>{recentlyAddedClient.clientName}</strong> ({recentlyAddedClient.projectName}).
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${recentlyAddedClient.id}`}
              className="font-bold underline hover:text-emerald-900 dark:hover:text-emerald-100 flex items-center gap-1"
            >
              <span>Open Client Record</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setRecentlyAddedClient(null)}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. KPI Metric Ribbon (7-Card Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Clients */}
        <div
          onClick={() => handlePresetTabChange('all')}
          className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Clients
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {kpis.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active in CRM</div>
        </div>

        {/* Today's Follow-ups */}
        <div
          onClick={() => handlePresetTabChange('today')}
          className={cn(
            'cursor-pointer bg-white dark:bg-slate-900 border rounded-xl p-3.5 shadow-sm hover:border-amber-400 transition-all group',
            kpis.todayCount > 0
              ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
              : 'border-slate-200 dark:border-slate-800'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Today&apos;s Calls
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {kpis.todayCount}
          </div>
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Scheduled today
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div
          onClick={() => handlePresetTabChange('overdue')}
          className={cn(
            'cursor-pointer bg-white dark:bg-slate-900 border rounded-xl p-3.5 shadow-sm hover:border-red-400 transition-all group',
            kpis.overdueCount > 0
              ? 'border-red-300 dark:border-red-900/80 bg-red-50/20'
              : 'border-slate-200 dark:border-slate-800'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
              Overdue
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-600 dark:text-red-400">
            {kpis.overdueCount}
          </div>
          <div className="text-[10px] text-red-500 mt-0.5 font-medium">Needs Attention</div>
        </div>

        {/* Quotation Pending */}
        <div
          onClick={() => handlePresetTabChange('quotations')}
          className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-purple-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quotes Pending
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {kpis.quotePendingCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">BOQ / Review</div>
        </div>

        {/* Final Clients */}
        <div
          onClick={() => {
            const params = new URLSearchParams();
            params.set('status', 'Final');
            router.push(`/clients?${params.toString()}`);
          }}
          className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-cyan-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Final Stage
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {kpis.finalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">High Probability</div>
        </div>

        {/* Orders Confirmed */}
        <div
          onClick={() => handlePresetTabChange('orders')}
          className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Confirmed Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpis.orderCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">PO / Execution</div>
        </div>

        {/* Completed Handover */}
        <div
          onClick={() => handlePresetTabChange('completed')}
          className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-green-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-green-700 dark:text-green-400">
            {kpis.completedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Delivered Jobs</div>
        </div>
      </div>

      {/* 2. Standardized Reusable SharedTableFilterBar */}
      <SharedTableFilterBar
        searchPlaceholder="Search client name, mobile, project, architect, notes..."
        presetTabs={presetTabs}
        activePresetTab={activePresetTab}
        onPresetTabChange={handlePresetTabChange}
        facets={facets}
        columns={columns}
        onToggleColumn={toggleColumn}
        onExportCSV={handleExportCSV}
        extraActions={
          <button
            type="button"
            onClick={() => setIsAddClientOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        }
      />

      {/* 3. Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {isColVisible('clientName') && (
                  <th className="py-3.5 px-4 sticky left-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)]">
                    Client Name
                  </th>
                )}
                {isColVisible('mobileNo') && <th className="py-3.5 px-3">Mobile No.</th>}
                {isColVisible('projectName') && <th className="py-3.5 px-3">Project / House</th>}
                {isColVisible('architectBuilder') && <th className="py-3.5 px-3">Architect / Builder</th>}
                {isColVisible('referredBy') && <th className="py-3.5 px-3">Referred By</th>}
                {isColVisible('status') && <th className="py-3.5 px-3">Status</th>}
                {isColVisible('quotationNo') && <th className="py-3.5 px-3">Quotation No.</th>}
                {isColVisible('totalAmount') && <th className="py-3.5 px-3 text-right">Total Amount</th>}
                {isColVisible('lastFollowUpDate') && <th className="py-3.5 px-3">Last Follow-up</th>}
                {isColVisible('nextFollowUpDate') && <th className="py-3.5 px-3">Next Follow-up</th>}
                {isColVisible('followUpDue') && <th className="py-3.5 px-3">Follow-up Due</th>}
                {isColVisible('assignedTo') && <th className="py-3.5 px-3">Assigned To</th>}
                {isColVisible('result') && <th className="py-3.5 px-3">Result</th>}
                {isColVisible('remarks') && <th className="py-3.5 px-3 min-w-[200px]">Remarks</th>}
                {isColVisible('actions') && <th className="py-3.5 px-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-16 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No clients found matching filters
                      </p>
                      <p className="text-xs text-slate-400">
                        Try resetting your search query or selected faceted filters.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => router.push('/clients')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Reset Filters
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddClientOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Client</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const due = computeFollowUpDueStatus(client.nextFollowUpDate, client.status);

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Client Name (Pinned Left) */}
                      {isColVisible('clientName') && (
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 shadow-[1px_0_0_0_rgba(226,232,240,1)] dark:shadow-[1px_0_0_0_rgba(30,41,59,1)]">
                          <Link
                            href={`/clients/${client.id}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
                          >
                            <span>{client.clientName}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                          </Link>
                        </td>
                      )}

                      {/* 2. Mobile No. (Tel link + WhatsApp button) */}
                      {isColVisible('mobileNo') && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:+91${client.mobileNo}`}
                              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 font-mono flex items-center gap-1"
                              title="Call client"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{client.mobileNo}</span>
                            </a>
                            <a
                              href={getWhatsAppUrl(
                                client.mobileNo,
                                `Hello ${client.clientName}, following up regarding your Home Automation project (${client.projectName}).`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      )}

                      {/* 3. Project / House */}
                      {isColVisible('projectName') && (
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={client.projectName}>
                          {client.projectName}
                        </td>
                      )}

                      {/* 4. Architect / Builder */}
                      {isColVisible('architectBuilder') && (
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={client.architectBuilder}>
                          {client.architectBuilder || '-'}
                        </td>
                      )}

                      {/* 5. Referred By */}
                      {isColVisible('referredBy') && (
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={client.referredBy}>
                          {client.referredBy || '-'}
                        </td>
                      )}

                      {/* 6. Status (Dropdown with inline mutation) */}
                      {isColVisible('status') && (
                        <td className="py-3 px-3">
                          <select
                            value={client.status}
                            onChange={(e) => updateClientStatus(client.id, e.target.value as LeadStatus)}
                            className="text-xs py-1 px-2 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 border-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                          >
                            {masterLists.statuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* 7. Quotation No. */}
                      {isColVisible('quotationNo') && (
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {client.quotationNo ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {client.quotationNo}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                      )}

                      {/* 8. Total Amount */}
                      {isColVisible('totalAmount') && (
                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100 font-mono whitespace-nowrap">
                          {formatINR(client.totalAmount)}
                        </td>
                      )}

                      {/* 9. Last Follow-up */}
                      {isColVisible('lastFollowUpDate') && (
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {formatDate(client.lastFollowUpDate)}
                        </td>
                      )}

                      {/* 10. Next Follow-up */}
                      {isColVisible('nextFollowUpDate') && (
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {formatDate(client.nextFollowUpDate)}
                        </td>
                      )}

                      {/* 11. Follow-up Due Badge */}
                      {isColVisible('followUpDue') && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <FollowUpBadge status={due} />
                        </td>
                      )}

                      {/* 12. Assigned To */}
                      {isColVisible('assignedTo') && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={client.assignedTo}
                            onChange={(e) => updateClientAssignedTo(client.id, e.target.value)}
                            className="text-xs py-1 px-1.5 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            {masterLists.teamMembers.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* 13. Result */}
                      {isColVisible('result') && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={client.result}
                            onChange={(e) => updateClientResult(client.id, e.target.value as FollowUpResult)}
                            className="text-xs py-1 px-1.5 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            {masterLists.results.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* 14. Remarks (Truncated with tooltip) */}
                      {isColVisible('remarks') && (
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-[240px] truncate" title={client.remarks}>
                          {client.remarks || '-'}
                        </td>
                      )}

                      {/* 15. Actions */}
                      {isColVisible('actions') && (
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/clients/${client.id}`}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View Client Dossier"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => setSelectedClientForEdit(client)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title="Edit Client & Site Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedClientForVisit(client)}
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Log Call / Site Visit"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setClientToDelete(client)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Count */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredClients.length}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{clients.length}</span> clients
          </div>
          <div className="flex items-center gap-4">
            <div>
              Total Pipeline Value:{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatINR(filteredClients.reduce((sum, c) => sum + (c.totalAmount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Visit Modal from Table Action */}
      {selectedClientForVisit && (
        <LogVisitModal
          isOpen={!!selectedClientForVisit}
          onClose={() => setSelectedClientForVisit(null)}
          clientId={selectedClientForVisit.id}
          clientName={selectedClientForVisit.clientName}
        />
      )}

      {/* Edit Client Modal from Table Action */}
      {selectedClientForEdit && (
        <EditClientModal
          isOpen={!!selectedClientForEdit}
          onClose={() => setSelectedClientForEdit(null)}
          client={selectedClientForEdit}
        />
      )}

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <Modal
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          title="Delete Client Record"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-xs">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-red-950 dark:text-red-100">
                  Delete Client and Associated Data?
                </p>
                <p className="leading-relaxed text-red-700 dark:text-red-300">
                  Are you sure you want to permanently delete the client record for{' '}
                  <span className="font-bold font-mono">{clientToDelete.clientName}</span>?
                  This will remove the client dossier, quotations, site visits, and advance entries.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteClient(clientToDelete.id);
                  setClientToDelete(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Client</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={(newId) => {
          setIsAddClientOpen(false);
          const found = clients.find((c) => c.id === newId);
          if (found) {
            setRecentlyAddedClient(found);
          }
          router.push('/clients');
        }}
      />
    </div>
  );
}
