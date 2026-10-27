'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  FollowUpDueStatus,
  PaymentStatus,
  ExpensePaymentStatus,
  AdvancePaymentStatus,
  LeadStatus,
  FollowUpResult,
} from '@/types';

// Follow-up Due Status Badge
export function FollowUpBadge({
  status,
  className,
}: {
  status: FollowUpDueStatus;
  className?: string;
}) {
  if (status === 'Overdue') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Overdue
      </span>
    );
  }

  if (status === 'Today') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Today
      </span>
    );
  }

  if (status === 'Upcoming') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Upcoming
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs text-slate-400 border border-transparent',
        className
      )}
    >
      -
    </span>
  );
}

// Payment Status Badge (Received, Partially Received, Pending)
export function PaymentBadge({
  status,
  className,
}: {
  status: PaymentStatus | ExpensePaymentStatus;
  className?: string;
}) {
  if (status === 'Received' || status === 'Paid') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    );
  }

  if (status === 'Partially Received' || status === 'Partially Paid') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        {status}
      </span>
    );
  }

  // Pending
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      Pending
    </span>
  );
}

// Client Advance Payment Status Badge
export function AdvanceStatusBadge({
  status,
  className,
}: {
  status: AdvancePaymentStatus;
  className?: string;
}) {
  if (status === 'Settled') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
          className
        )}
      >
        Settled
      </span>
    );
  }

  if (status === 'Pending Return') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
          className
        )}
      >
        Pending Return
      </span>
    );
  }

  // Company Payable
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        className
      )}
    >
      Company Payable
    </span>
  );
}

// Lead Status Badge
export function StatusBadge({
  status,
  className,
}: {
  status: LeadStatus | string;
  className?: string;
}) {
  const map: Record<string, string> = {
    New: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    'Follow-up': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    'Site Visit': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    Quotation: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    Negotiation: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
    Final: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
    Order: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    Installation: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    Completed: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800 font-bold',
    Lost: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900',
    'Payment Pending': 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
  };

  const style = map[status] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}

// Result Badge
export function ResultBadge({
  result,
  className,
}: {
  result: FollowUpResult | string;
  className?: string;
}) {
  const map: Record<string, string> = {
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    'Work Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    Completed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300',
    'Quotation required': 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    'Material required': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
    'Next visit required': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300',
    Pending: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    'Client not available': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
    Rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
  };

  const style = map[result] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs border truncate max-w-[160px]',
        style,
        className
      )}
      title={result}
    >
      {result}
    </span>
  );
}
