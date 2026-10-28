'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle } from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { normalizePhoneNumber } from '@/lib/formatters';
import { Client, LeadStatus } from '@/types';

const editSchema = z.object({
  clientName: z.string().trim().min(2, 'Name is required'),
  mobileNo: z
    .string()
    .trim()
    .min(1, 'Mobile number is required')
    .refine(
      (val) => {
        const cleaned = normalizePhoneNumber(val);
        return cleaned.length >= 7 && cleaned.length <= 15;
      },
      { message: 'Please enter a valid phone number (at least 7 to 10 digits)' }
    ),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Invalid email address',
    }),
  projectName: z.string().trim().optional(),
  architectBuilder: z.string().trim().optional(),
  referredBy: z.string().trim().optional(),
  referrerMobile: z.string().trim().optional(),
  status: z.string(),
  assignedTo: z.string(),
  nextFollowUpDate: z.string().optional(),
  remarks: z.string().trim().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const { updateClient, masterLists } = useCRMStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      clientName: client.clientName,
      mobileNo: client.mobileNo,
      email: client.email || '',
      projectName: client.projectName,
      architectBuilder: client.architectBuilder || '',
      referredBy: client.referredBy || '',
      referrerMobile: client.referrerMobile || '',
      status: client.status,
      assignedTo: client.assignedTo,
      nextFollowUpDate: client.nextFollowUpDate,
      remarks: client.remarks || '',
    },
  });

  const onSubmit = (data: EditFormData) => {
    const cleanedPhone = normalizePhoneNumber(data.mobileNo) || data.mobileNo.trim();
    const finalProjectName =
      data.projectName?.trim() || `${data.clientName.trim()} Residence`;

    updateClient(client.id, {
      clientName: data.clientName.trim(),
      mobileNo: cleanedPhone,
      email: data.email?.trim() || undefined,
      projectName: finalProjectName,
      architectBuilder: data.architectBuilder?.trim() || '',
      referredBy: data.referredBy?.trim() || '',
      referrerMobile: data.referrerMobile?.trim() || '',
      status: data.status as LeadStatus,
      assignedTo: data.assignedTo,
      nextFollowUpDate: data.nextFollowUpDate || client.nextFollowUpDate,
      remarks: data.remarks?.trim() || '',
    });
    onClose();
  };

  const errorList = Object.values(errors);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client & Site Details"
      subtitle={`Updating metadata for ${client.clientName}`}
      maxWidth="2xl"
      isDirty={isDirty}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorList.length > 0 && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Please correct the following fields:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                {errorList.map((err, idx) => (
                  <li key={idx}>{err?.message?.toString()}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('clientName')}
              type="text"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.clientName && (
              <p className="text-[11px] text-red-500 mt-1">{errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile No. <span className="text-red-500">*</span>
            </label>
            <input
              {...register('mobileNo')}
              type="tel"
              placeholder="e.g. 98XXXXXXXX or +91 98XXXXXXXX"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.mobileNo && (
              <p className="text-[11px] text-red-500 mt-1">{errors.mobileNo.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Site Name
            </label>
            <input
              {...register('projectName')}
              type="text"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Architect / Builder
            </label>
            <input
              {...register('architectBuilder')}
              type="text"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lead Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(masterLists?.statuses || []).map((s) => (
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
              {(masterLists?.teamMembers || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Next Follow-Up
            </label>
            <input
              {...register('nextFollowUpDate')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Referral Source
            </label>
            <input
              {...register('referredBy')}
              type="text"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Referrer Mobile
            </label>
            <input
              {...register('referrerMobile')}
              type="tel"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            General Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={3}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
