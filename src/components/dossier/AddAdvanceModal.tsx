'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { toISODateString } from '@/lib/formatters';

const advanceSchema = z.object({
  employeeName: z.string(),
  expenseDate: z.string().min(1, 'Date is required'),
  category: z.string(),
  amountAdvanced: z.coerce.number().min(0, 'Must be positive or zero'),
  actualAmountSpent: z.coerce.number().min(0, 'Must be positive or zero'),
  balanceReturned: z.coerce.number().min(0, 'Must be positive or zero'),
  remarks: z.string().optional(),
});

type AdvanceFormData = z.infer<typeof advanceSchema>;

interface AddAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function AddAdvanceModal({
  isOpen,
  onClose,
  clientId,
}: AddAdvanceModalProps) {
  const { addClientAdvance, masterLists } = useCRMStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
      employeeName: masterLists.teamMembers[0] || 'Pushpak',
      expenseDate: toISODateString(new Date()),
      category: masterLists.expenseCategories[0] || 'Site Material / Consumables',
      amountAdvanced: 5000,
      actualAmountSpent: 0,
      balanceReturned: 0,
      remarks: '',
    },
  });

  const onSubmit = (data: AdvanceFormData) => {
    addClientAdvance({
      clientId,
      employeeName: data.employeeName,
      expenseDate: data.expenseDate,
      category: data.category,
      amountAdvanced: data.amountAdvanced,
      actualAmountSpent: data.actualAmountSpent,
      balanceReturned: data.balanceReturned,
      remarks: data.remarks || '',
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Site Employee Advance & Expense"
      subtitle="Track site cash advances, technician expenditures, and returned balances"
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
              Expense Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('expenseDate')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Expense Category <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {masterLists.expenseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Advanced (₹) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('amountAdvanced')}
              type="number"
              step="100"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amountAdvanced && (
              <p className="text-[11px] text-red-500 mt-1">{errors.amountAdvanced.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actual Amount Spent (₹)
            </label>
            <input
              {...register('actualAmountSpent')}
              type="number"
              step="100"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Balance Returned (₹)
            </label>
            <input
              {...register('balanceReturned')}
              type="number"
              step="100"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Bill Details / Item Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={2}
            placeholder="e.g. Bought CAT6 patch cords, PVC glands, and lunch for site team"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all"
          >
            Record Advance
          </button>
        </div>
      </form>
    </Modal>
  );
}
