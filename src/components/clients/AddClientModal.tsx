'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { toISODateString } from '@/lib/formatters';
import { LeadStatus, FollowUpResult } from '@/types';

const clientSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  mobileNo: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  projectName: z.string().min(2, 'Project / House name is required'),
  architectBuilder: z.string().optional(),
  referredBy: z.string().optional(),
  referrerMobile: z.string().optional(),
  status: z.string(),
  assignedTo: z.string(),
  result: z.string(),
  nextFollowUpDate: z.string().min(1, 'Next follow-up date is required'),
  remarks: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const { addClient, masterLists } = useCRMStore();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: '',
      mobileNo: '',
      email: '',
      projectName: '',
      architectBuilder: '',
      referredBy: masterLists.referralPartners[0] || '',
      referrerMobile: '',
      status: 'New',
      assignedTo: masterLists.teamMembers[0] || 'Ankit Sir',
      result: 'Pending',
      nextFollowUpDate: toISODateString(tomorrow),
      remarks: '',
    },
  });

  const onSubmit = (data: ClientFormData) => {
    addClient({
      clientName: data.clientName,
      mobileNo: data.mobileNo,
      email: data.email || undefined,
      projectName: data.projectName,
      architectBuilder: data.architectBuilder || '',
      referredBy: data.referredBy || '',
      referrerMobile: data.referrerMobile || '',
      status: data.status as LeadStatus,
      assignedTo: data.assignedTo,
      result: data.result as FollowUpResult,
      quotationNo: '',
      totalAmount: 0,
      receivedAmount: 0,
      lastFollowUpDate: toISODateString(new Date()),
      nextFollowUpDate: data.nextFollowUpDate,
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
      title="Add New Client & Project"
      subtitle="Register a new home automation inquiry or luxury residential project"
      maxWidth="2xl"
      isDirty={isDirty}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Client Name & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('clientName')}
              type="text"
              placeholder="e.g. Dr Priyanka Suryawanshi"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.clientName && (
              <p className="text-[11px] text-red-500 mt-1">{errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile No. (10 Digits) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('mobileNo')}
              type="tel"
              maxLength={10}
              placeholder="98XXXXXXXX"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.mobileNo && (
              <p className="text-[11px] text-red-500 mt-1">{errors.mobileNo.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email & Project Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="client@example.com"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project / House Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('projectName')}
              type="text"
              placeholder="e.g. Bungalow 42, Green Meadows"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.projectName && (
              <p className="text-[11px] text-red-500 mt-1">{errors.projectName.message}</p>
            )}
          </div>
        </div>

        {/* Row 3: Architect / Builder & Referred By */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Architect / Builder
            </label>
            <input
              {...register('architectBuilder')}
              type="text"
              placeholder="e.g. Ar. Rajesh Mehra"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Referred By
            </label>
            <input
              {...register('referredBy')}
              list="referral-list"
              placeholder="Select or enter partner"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="referral-list">
              {masterLists.referralPartners.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Row 4: Status, Assigned To, Result */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pipeline Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {masterLists.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned To
            </label>
            <select
              {...register('assignedTo')}
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
              Initial Result
            </label>
            <select
              {...register('result')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {masterLists.results.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 5: Next Follow-Up Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Next Follow-Up Date <span className="text-red-500">*</span>
          </label>
          <input
            {...register('nextFollowUpDate')}
            type="date"
            className="w-full sm:w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nextFollowUpDate && (
            <p className="text-[11px] text-red-500 mt-1">{errors.nextFollowUpDate.message}</p>
          )}
        </div>

        {/* Row 6: Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Scope Notes
          </label>
          <textarea
            {...register('remarks')}
            rows={3}
            placeholder="Keypad preferences, automation scope (lighting, audio, HVAC), special client requirements..."
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            Create Client Record
          </button>
        </div>
      </form>
    </Modal>
  );
}
