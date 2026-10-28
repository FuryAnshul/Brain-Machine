'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UserX,
  UserCheck,
  Search,
  KeyRound,
  Trash2,
  Edit,
  Clock,
  Phone,
  ArrowLeft,
  Users,
  Lock,
} from 'lucide-react';
import { useCRMStore } from '@/lib/store';
import { UserProfile, UserRole, UserStatus } from '@/types';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { Modal } from '@/components/shared/Modal';

export default function AdminPage() {
  const {
    users,
    currentUser,
    revokeUserAccess,
    activateUserAccess,
    deleteUserProfile,
    isHydrated,
  } = useCRMStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const revokedUsers = users.filter((u) => u.status === 'revoked').length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.mobileNo && u.mobileNo.includes(searchTerm));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRevoke = (u: UserProfile) => {
    if (confirm(`Are you sure you want to REVOKE website access for "${u.name}" (${u.email})? They will immediately be denied login.`)) {
      revokeUserAccess(u.id);
      setActionMessage({
        type: 'success',
        text: `Access revoked for ${u.name}. Their active session was terminated.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleActivate = (u: UserProfile) => {
    activateUserAccess(u.id);
    setActionMessage({
      type: 'success',
      text: `Access restored for ${u.name}. They can now sign in normally.`,
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeleteClick = (u: UserProfile) => {
    if (currentUser?.id === u.id) {
      setActionMessage({
        type: 'error',
        text: 'Cannot delete active session profile: You are currently signed in as this administrator. Switch to another administrator profile if you wish to delete this account.',
      });
      setTimeout(() => setActionMessage(null), 5000);
      return;
    }
    setUserToDelete(u);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUserProfile(userToDelete.id);
    if (!res.success) {
      setActionMessage({
        type: 'error',
        text: res.error || 'Failed to delete user profile.',
      });
    } else {
      setActionMessage({
        type: 'success',
        text: `User profile for "${userToDelete.name}" (${userToDelete.email}) has been permanently deleted.`,
      });
    }
    setUserToDelete(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // If unauthenticated or non-admin access
  if (isHydrated && !isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Administrator Access Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
          The User Management & Permissions Console is restricted to system administrators. Please sign in with an Administrator profile to provision or revoke website access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all text-center"
          >
            Sign In as Admin
          </Link>
          <Link
            href="/clients"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all text-center"
          >
            Return to Client Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/clients" className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to CRM</span>
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Admin Console: Website Access & Profiles
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provision new user accounts, revoke website access, and manage credentials
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User Profile</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 4-Card KPI Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Profiles</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalUsers}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Registered website accounts
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span>Active Logins</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {activeUsers}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
            Full operational access permitted
          </p>
        </div>

        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
          <div className="flex items-center justify-between text-red-700 dark:text-red-400 text-xs font-semibold">
            <span>Revoked Profiles</span>
            <UserX className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-700 dark:text-red-400 mt-1">
            {revokedUsers}
          </div>
          <p className="text-[11px] text-red-600/80 dark:text-red-500/80 mt-0.5">
            Access suspended by admin
          </p>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <span>Administrators</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">
            {adminUsers}
          </div>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-500/80 mt-0.5">
            Superuser control privileges
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-1/2 sm:w-auto px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff / Sales</option>
            <option value="engineer">Site Engineers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-1/2 sm:w-auto px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="revoked">Revoked Only</option>
          </select>
        </div>
      </div>

      {/* User Profiles Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">User Profile</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Access Status</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No user profiles found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isRevoked = u.status === 'revoked';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isRevoked ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-blue-600 text-white'
                                : u.role === 'engineer'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {u.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            u.role === 'admin'
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : u.role === 'engineer'
                              ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            u.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900 animate-pulse'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {u.mobileNo ? (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.mobileNo}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {u.lastLoginAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(u.lastLoginAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Revoke / Restore Toggle */}
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleRevoke(u)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors flex items-center gap-1"
                              title="Revoke Website Access"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Revoke</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(u)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1"
                              title="Restore Website Access"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Activate</span>
                            </button>
                          )}

                          {/* Edit Profile */}
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Credentials & Role"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Profile */}
                          <button
                            onClick={() => handleDeleteClick(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500'
                                : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                            title={isCurrent ? 'Current active session profile (click for details)' : `Delete profile for ${u.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Master Key Security Reference */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              Emergency Password Recovery Architecture
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Administrators who lose their passwords can reset via the login page using the Master Recovery Key:
            </p>
          </div>
        </div>

        <code className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400 select-all">
          HA-ADMIN-2026-SECURE
        </code>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
      />

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <Modal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          title="Confirm Profile Deletion"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-xs">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-red-950 dark:text-red-100">
                  Permanently Delete User Profile?
                </p>
                <p className="leading-relaxed text-red-700 dark:text-red-300">
                  Are you sure you want to delete the user profile for{' '}
                  <span className="font-bold font-mono">{userToDelete.name}</span> ({userToDelete.email})?
                  This account will be permanently erased from system rosters and website access revoked immediately.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Name:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Role:</span>
                <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {userToDelete.role}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
