'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { Client, LeadStatus } from '@/types';

const editSchema = z.object({
  clientName: z.string().min(2, 'Name is required'),
  mobileNo: z.string().regex(/^[0-9]{10}$/, 'Must be 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  projectName: z.string().min(2, 'Project name is required'),
  architectBuilder: z.string().optional(),
  referredBy: z.string().optional(),
  referrerMobile: z.string().optional(),
  status: z.string(),
  assignedTo: z.string(),
  nextFollowUpDate: z.string().optional(),
  remarks: z.string().optional(),
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
    reset,
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
    updateClient(client.id, {
      clientName: data.clientName,
      mobileNo: data.mobileNo,
      email: data.email || undefined,
      projectName: data.projectName,
      architectBuilder: data.architectBuilder,
      referredBy: data.referredBy,
      referrerMobile: data.referrerMobile,
      status: data.status as LeadStatus,
      assignedTo: data.assignedTo,
      nextFollowUpDate: data.nextFollowUpDate || client.nextFollowUpDate,
      remarks: data.remarks || '',
    });
    onClose();
  };

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
              Mobile No. (10 Digits) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('mobileNo')}
              type="tel"
              maxLength={10}
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
              Project Site Name <span className="text-red-500">*</span>
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
