'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCRMStore } from '@/lib/store';
import { Modal } from '@/components/shared/Modal';
import { SiteContactRole } from '@/types';

const contactSchema = z.object({
  role: z.string(),
  name: z.string().min(2, 'Contact name is required'),
  mobileNo: z.string().min(10, 'Mobile number must be at least 10 digits'),
  remarks: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface AddSiteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function AddSiteContactModal({
  isOpen,
  onClose,
  clientId,
}: AddSiteContactModalProps) {
  const { addSiteContact } = useCRMStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      role: 'Site Manager',
      name: '',
      mobileNo: '',
      remarks: '',
    },
  });

  const onSubmit = (data: ContactFormData) => {
    addSiteContact({
      clientId,
      role: data.role as SiteContactRole,
      name: data.name,
      mobileNo: data.mobileNo,
      remarks: data.remarks || '',
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const roles: SiteContactRole[] = [
    'Architect',
    'Builder',
    'Site Manager',
    'Supervisor',
    'Electrician',
    'Interior Designer',
    'Client / Owner',
    'Other',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Site Stakeholder / Contact"
      subtitle="Architects, site supervisors, and electrical contractors for this site"
      maxWidth="md"
      isDirty={isDirty}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Site Role <span className="text-red-500">*</span>
          </label>
          <select
            {...register('role')}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="e.g. Ramesh Mistri"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('mobileNo')}
            type="tel"
            placeholder="98XXXXXXXX"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.mobileNo && <p className="text-[11px] text-red-500 mt-1">{errors.mobileNo.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Operational Notes
          </label>
          <input
            {...register('remarks')}
            type="text"
            placeholder="e.g. Available 9 AM - 6 PM, coordinates conduit routing"
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
            Add Contact
          </button>
        </div>
      </form>
    </Modal>
  );
}
