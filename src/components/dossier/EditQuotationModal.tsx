'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { Quotation, PaymentStatus } from '@/types';

const quoteEditSchema = z.object({
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

type QuoteEditFormData = z.infer<typeof quoteEditSchema>;

interface EditQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export function EditQuotationModal({
  isOpen,
  onClose,
  quotation,
}: EditQuotationModalProps) {
  const { updateQuotation } = useCRMStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<QuoteEditFormData>({
    resolver: zodResolver(quoteEditSchema),
    defaultValues: {
      quotationNo: quotation?.quotationNo || '',
      date: quotation?.date || '',
      amount: quotation?.amount || 0,
      receivedDate: quotation?.receivedDate || '',
      followUpDate: quotation?.followUpDate || '',
      paymentStatus: quotation?.paymentStatus || 'Pending',
      amountReceived: quotation?.amountReceived || 0,
      totalAmount: quotation?.totalAmount || quotation?.amount || 0,
      remarks: quotation?.remarks || '',
    },
  });

  useEffect(() => {
    if (quotation) {
      reset({
        quotationNo: quotation.quotationNo,
        date: quotation.date,
        amount: quotation.amount,
        receivedDate: quotation.receivedDate || '',
        followUpDate: quotation.followUpDate,
        paymentStatus: quotation.paymentStatus,
        amountReceived: quotation.amountReceived,
        totalAmount: quotation.totalAmount || quotation.amount,
        remarks: quotation.remarks || '',
      });
    }
  }, [quotation, reset]);

  const paymentStatus = watch('paymentStatus');
  const amount = watch('amount');
  const totalAmount = watch('totalAmount');

  // Smart status handler
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as PaymentStatus;
    setValue('paymentStatus', val, { shouldDirty: true });
    if (val === 'Received') {
      const full = totalAmount || amount || 0;
      setValue('amountReceived', full, { shouldDirty: true });
      if (!watch('receivedDate')) {
        setValue('receivedDate', new Date().toISOString().split('T')[0], { shouldDirty: true });
      }
    } else if (val === 'Pending') {
      setValue('amountReceived', 0, { shouldDirty: true });
    }
  };

  if (!quotation) return null;

  const onSubmit = (data: QuoteEditFormData) => {
    const totalAmt = data.totalAmount || data.amount;
    updateQuotation(quotation.id, {
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
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Quotation & Payment Milestone"
      subtitle={`Updating Quotation ${quotation.quotationNo}`}
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
              value={paymentStatus}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received (Settled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount Received (₹) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('amountReceived')}
              type="number"
              step="1000"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.amountReceived && (
              <p className="text-[11px] text-red-500 mt-1">{errors.amountReceived.message}</p>
            )}
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
            Quotation & Payment Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={3}
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
            Save Quotation Updates
          </button>
        </div>
      </form>
    </Modal>
  );
}
