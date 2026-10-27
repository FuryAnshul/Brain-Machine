'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { toISODateString } from '@/lib/formatters';
import { PaymentStatus } from '@/types';

const quoteSchema = z.object({
  quotationNo: z.string().min(2, 'Quotation No. is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  receivedDate: z.string().optional(),
  followUpDate: z.string().min(1, 'Follow-up Date is required'),
  paymentStatus: z.string(),
  amountReceived: z.coerce.number().min(0, 'Must be 0 or positive'),
  totalAmount: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function AddQuotationModal({
  isOpen,
  onClose,
  clientId,
}: AddQuotationModalProps) {
  const { addQuotation } = useCRMStore();

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      quotationNo: `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: toISODateString(new Date()),
      amount: 1500000,
      receivedDate: '',
      followUpDate: toISODateString(nextWeek),
      paymentStatus: 'Pending',
      amountReceived: 0,
      totalAmount: 1500000,
      remarks: '',
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    const totalAmt = data.totalAmount || data.amount;
    addQuotation({
      clientId,
      quotationNo: data.quotationNo,
      date: data.date,
      amount: data.amount,
      receivedDate: data.receivedDate || undefined,
      followUpDate: data.followUpDate,
      paymentStatus: data.paymentStatus as PaymentStatus,
      amountReceived: data.amountReceived,
      totalAmount: totalAmt,
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
      title="Create Quotation & Payment Milestone"
      subtitle="Log official BOQ proposal and advance payment status"
      maxWidth="lg"
      isDirty={isDirty}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quotation Reference No. <span className="text-red-500">*</span>
            </label>
            <input
              {...register('quotationNo')}
              type="text"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.quotationNo && (
              <p className="text-[11px] text-red-500 mt-1">{errors.quotationNo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quotation Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quoted Base Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('amount')}
              type="number"
              step="1000"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amount && (
              <p className="text-[11px] text-red-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Scope Amount (₹)
            </label>
            <input
              {...register('totalAmount')}
              type="number"
              step="1000"
              placeholder="Defaults to base amount"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Status
            </label>
            <select
              {...register('paymentStatus')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received (Settled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Received (₹)
            </label>
            <input
              {...register('amountReceived')}
              type="number"
              step="1000"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Received Date
            </label>
            <input
              {...register('receivedDate')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Follow-up Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('followUpDate')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Quotation & Payment Terms Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={2}
            placeholder="e.g. 50% advance on PO, 40% on delivery, 10% on commissioning"
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
            Save Quotation
          </button>
        </div>
      </form>
    </Modal>
  );
}
