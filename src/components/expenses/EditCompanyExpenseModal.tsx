'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { CompanyExpense, ExpensePaymentStatus } from '@/types';

const editExpenseSchema = z.object({
  employeeName: z.string(),
  expenseCategory: z.string(),
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentStatus: z.string(),
  amountPaid: z.coerce.number().min(0, 'Must be positive or zero'),
  remarks: z.string().optional(),
});

type EditExpenseFormData = z.infer<typeof editExpenseSchema>;

interface EditCompanyExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: CompanyExpense | null;
}

export function EditCompanyExpenseModal({
  isOpen,
  onClose,
  expense,
}: EditCompanyExpenseModalProps) {
  const { updateCompanyExpense, masterLists } = useCRMStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditExpenseFormData>({
    resolver: zodResolver(editExpenseSchema),
    defaultValues: {
      employeeName: expense?.employeeName || masterLists.teamMembers[0] || 'Ankit Sir',
      expenseCategory: expense?.expenseCategory || masterLists.expenseCategories[0] || 'Travel',
      date: expense?.date || '',
      amount: expense?.amount || 0,
      paymentStatus: expense?.paymentStatus || 'Pending',
      amountPaid: expense?.amountPaid || 0,
      remarks: expense?.remarks || '',
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        employeeName: expense.employeeName,
        expenseCategory: expense.expenseCategory,
        date: expense.date,
        amount: expense.amount,
        paymentStatus: expense.paymentStatus,
        amountPaid: expense.amountPaid,
        remarks: expense.remarks || '',
      });
    }
  }, [expense, reset]);

  const paymentStatus = watch('paymentStatus');
  const amount = watch('amount');
  const amountPaid = watch('amountPaid');
  const balanceOutstanding = (amount || 0) - (amountPaid || 0);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ExpensePaymentStatus;
    setValue('paymentStatus', val, { shouldDirty: true });
    if (val === 'Paid') {
      setValue('amountPaid', amount || 0, { shouldDirty: true });
    } else if (val === 'Pending') {
      setValue('amountPaid', 0, { shouldDirty: true });
    }
  };

  if (!expense) return null;

  const onSubmit = (data: EditExpenseFormData) => {
    updateCompanyExpense(expense.id, {
      employeeName: data.employeeName,
      expenseCategory: data.expenseCategory,
      date: data.date,
      amount: data.amount,
      paymentStatus: data.paymentStatus as ExpensePaymentStatus,
      amountPaid: data.amountPaid,
      remarks: data.remarks || '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Overhead / Company Expense"
      subtitle={`Updating expense claim by ${expense.employeeName}`}
      maxWidth="lg"
      isDirty={isDirty}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <select
              {...register('employeeName')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {masterLists.teamMembers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('expenseCategory')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {masterLists.expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Claim Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('amount')}
              type="number"
              step="50"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amount && (
              <p className="text-[11px] text-red-500 mt-1">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid (Settled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Paid by Company (₹)
            </label>
            <input
              {...register('amountPaid')}
              type="number"
              step="50"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Real-time balance preview */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">Balance Outstanding:</span>
          <span
            className={`font-mono font-bold ${
              balanceOutstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            ₹{balanceOutstanding.toLocaleString('en-IN')} {balanceOutstanding === 0 && '(Fully Paid)'}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Bill Details / Vendor / Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={2}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all"
          >
            Save Expense Updates
          </button>
        </div>
      </form>
    </Modal>
  );
}
