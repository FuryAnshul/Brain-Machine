'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { SiteVisit, VisitPurpose, FollowUpResult } from '@/types';

const editVisitSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  purpose: z.string(),
  workDiscussion: z.string().min(3, 'Discussion/Work description is required'),
  assignedTo: z.string(),
  nextDate: z.string().optional(),
  result: z.string(),
  remarks: z.string().optional(),
});

type EditVisitFormData = z.infer<typeof editVisitSchema>;

interface EditSiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SiteVisit | null;
}

export function EditSiteVisitModal({
  isOpen,
  onClose,
  visit,
}: EditSiteVisitModalProps) {
  const { updateSiteVisit, masterLists } = useCRMStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditVisitFormData>({
    resolver: zodResolver(editVisitSchema),
    defaultValues: {
      date: visit?.date || '',
      purpose: visit?.purpose || 'Site Visit',
      workDiscussion: visit?.workDiscussion || '',
      assignedTo: visit?.assignedTo || masterLists.teamMembers[0] || 'Ankit Sir',
      nextDate: visit?.nextDate || '',
      result: visit?.result || 'Completed',
      remarks: visit?.remarks || '',
    },
  });

  useEffect(() => {
    if (visit) {
      reset({
        date: visit.date,
        purpose: visit.purpose,
        workDiscussion: visit.workDiscussion,
        assignedTo: visit.assignedTo,
        nextDate: visit.nextDate || '',
        result: visit.result,
        remarks: visit.remarks || '',
      });
    }
  }, [visit, reset]);

  if (!visit) return null;

  const onSubmit = (data: EditVisitFormData) => {
    updateSiteVisit(visit.id, {
      date: data.date,
      purpose: data.purpose as VisitPurpose,
      workDiscussion: data.workDiscussion,
      assignedTo: data.assignedTo,
      nextDate: data.nextDate || undefined,
      result: data.result as FollowUpResult,
      remarks: data.remarks || '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Site Visit / Call Log"
      subtitle={`Updating interaction log from ${visit.date}`}
      maxWidth="lg"
      isDirty={isDirty}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Visit / Call Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="text-[11px] text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose
            </label>
            <select
              {...register('purpose')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {masterLists.purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Work Done / Discussion Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('workDiscussion')}
            rows={3}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.workDiscussion && (
            <p className="text-[11px] text-red-500 mt-1">{errors.workDiscussion.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Interaction Result
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Next Follow-Up Date
          </label>
          <input
            {...register('nextDate')}
            type="date"
            className="w-full sm:w-1/2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Notes
          </label>
          <textarea
            {...register('remarks')}
            rows={2}
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
            Save Visit Updates
          </button>
        </div>
      </form>
    </Modal>
  );
}
