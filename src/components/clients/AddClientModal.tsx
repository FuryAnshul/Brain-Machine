'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { toISODateString, normalizePhoneNumber } from '@/lib/formatters';
import { LeadStatus, FollowUpResult } from '@/types';

const clientSchema = z.object({
  clientName: z.string().trim().min(2, 'Client name must be at least 2 characters'),
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
  status: z.string().default('New'),
  assignedTo: z.string().default('Ankit Sir'),
  result: z.string().default('Pending'),
  nextFollowUpDate: z.string().min(1, 'Next follow-up date is required'),
  remarks: z.string().trim().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newClientId: string) => void;
}

export function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
  const router = useRouter();
  const { addClient, masterLists } = useCRMStore();
  const [redirectAfterCreate, setRedirectAfterCreate] = useState(true);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODateString(tomorrow);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: '',
      mobileNo: '',
      email: '',
      projectName: '',
      architectBuilder: '',
      referredBy: (masterLists?.referralPartners && masterLists.referralPartners[0]) || '',
      referrerMobile: '',
      status: 'New',
      assignedTo: (masterLists?.teamMembers && masterLists.teamMembers[0]) || 'Ankit Sir',
      result: 'Pending',
      nextFollowUpDate: getTomorrowDate(),
      remarks: '',
    },
  });

  // Reset form whenever modal opens cleanly
  useEffect(() => {
    if (isOpen) {
      reset({
        clientName: '',
        mobileNo: '',
        email: '',
        projectName: '',
        architectBuilder: '',
        referredBy: (masterLists?.referralPartners && masterLists.referralPartners[0]) || '',
        referrerMobile: '',
        status: 'New',
        assignedTo: (masterLists?.teamMembers && masterLists.teamMembers[0]) || 'Ankit Sir',
        result: 'Pending',
        nextFollowUpDate: getTomorrowDate(),
        remarks: '',
      });
    }
  }, [isOpen, reset, masterLists]);

  const watchedClientName = watch('clientName');

  const onSubmit = (data: ClientFormData) => {
    const cleanedPhone = normalizePhoneNumber(data.mobileNo) || data.mobileNo.trim();
    const finalProjectName =
      data.projectName?.trim() || `${data.clientName.trim()} Residence`;

    const newClientId = addClient({
      clientName: data.clientName.trim(),
      mobileNo: cleanedPhone,
      email: data.email?.trim() || undefined,
      projectName: finalProjectName,
      architectBuilder: data.architectBuilder?.trim() || '',
      referredBy: data.referredBy?.trim() || '',
      referrerMobile: data.referrerMobile?.trim() || '',
      status: (data.status as LeadStatus) || 'New',
      assignedTo: data.assignedTo || 'Ankit Sir',
      result: (data.result as FollowUpResult) || 'Pending',
      quotationNo: '',
      totalAmount: 0,
      receivedAmount: 0,
      lastFollowUpDate: toISODateString(new Date()),
      nextFollowUpDate: data.nextFollowUpDate,
      remarks: data.remarks?.trim() || '',
    });

    reset();
    onClose();

    if (onSuccess) {
      onSuccess(newClientId);
    } else if (redirectAfterCreate) {
      router.push(`/clients/${newClientId}`);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorList = Object.values(errors);

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
        {/* Error Summary Banner */}
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
              Mobile No. <span className="text-red-500">*</span>
            </label>
            <input
              {...register('mobileNo')}
              type="tel"
              placeholder="e.g. 98XXXXXXXX or +91 98XXXXXXXX"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.mobileNo ? (
              <p className="text-[11px] text-red-500 mt-1">{errors.mobileNo.message}</p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">Accepts 10 digits, +91, spaces, or hyphens</p>
            )}
          </div>
        </div>

        {/* Row 2: Email & Project Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
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
              Project / House Name{' '}
              <span className="text-slate-400 font-normal">
                {watchedClientName?.trim()
                  ? `(Defaults to "${watchedClientName.trim()} Residence")`
                  : '(Optional)'}
              </span>
            </label>
            <input
              {...register('projectName')}
              type="text"
              placeholder={
                watchedClientName?.trim()
                  ? `${watchedClientName.trim()} Residence`
                  : 'e.g. Bungalow 42, Green Meadows'
              }
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
              {(masterLists?.referralPartners || []).map((p) => (
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
              {(masterLists?.statuses || ['New', 'Follow-up', 'Site Visit', 'Quotation']).map((s) => (
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
              {(masterLists?.teamMembers || ['Ankit Sir', 'Anshul', 'Pushpak']).map((m) => (
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
              {(masterLists?.results || ['Pending', 'Quotation required', 'Completed']).map((r) => (
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
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRedirectAfterCreate(false);
              handleSubmit(onSubmit)();
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Create Record Only
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRedirectAfterCreate(true);
              handleSubmit(onSubmit)();
            }}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Create & Open Dossier</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
