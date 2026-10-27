'use client';

import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Building,
  User,
  Share2,
  Plus,
  Trash2,
  HardHat,
  Briefcase,
  Layers,
  Pencil,
} from 'lucide-react';
import { Client, SiteContact } from '@/types';
import { useCRMStore } from '@/lib/store';
import { getWhatsAppUrl } from '@/lib/formatters';
import { AddSiteContactModal } from './AddSiteContactModal';
import { EditSiteContactModal } from './EditSiteContactModal';

interface ClientInfoSectionProps {
  client: Client;
  contacts: SiteContact[];
}

export function ClientInfoSection({ client, contacts }: ClientInfoSectionProps) {
  const { deleteSiteContact } = useCRMStore();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<SiteContact | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Panel: Client & Project Metadata */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Client & Site Profile
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">ID: {client.id}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block mb-0.5">Project / Residence</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              {client.projectName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block mb-0.5">Assigned Lead</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              {client.assignedTo}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block mb-0.5">Architect / Builder</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              {client.architectBuilder || 'Not specified'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block mb-0.5">Referral Partner</span>
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {client.referredBy || 'Direct'}
              </span>
              {client.referrerMobile && (
                <span className="font-mono text-[10px] text-slate-400">({client.referrerMobile})</span>
              )}
            </div>
          </div>
        </div>

        {client.remarks && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-400 font-medium text-[11px] block mb-1">
              Project Scope & Notes
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              {client.remarks}
            </p>
          </div>
        )}
      </div>

      {/* Right Panel: Site Contacts Mini-Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Site Stakeholders & Contacts
              </h3>
              <p className="text-[10px] text-slate-400">Architects, contractors & supervisors</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddContactOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No site stakeholders registered yet. Click &quot;Add Contact&quot; to add architects or supervisors.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="py-2.5 flex items-center justify-between text-xs group"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {contact.name}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {contact.role}
                    </span>
                  </div>
                  {contact.remarks && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {contact.remarks}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:+91${contact.mobileNo}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={`Call ${contact.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={getWhatsAppUrl(
                      contact.mobileNo,
                      `Hello ${contact.name}, regarding ${client.projectName} home automation site coordinates.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                    title={`WhatsApp ${contact.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setSelectedContactForEdit(contact)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Contact"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Remove stakeholder contact "${contact.name}"?`)) {
                        deleteSiteContact(contact.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddSiteContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        clientId={client.id}
      />

      <EditSiteContactModal
        isOpen={!!selectedContactForEdit}
        onClose={() => setSelectedContactForEdit(null)}
        contact={selectedContactForEdit}
      />
    </div>
  );
}
