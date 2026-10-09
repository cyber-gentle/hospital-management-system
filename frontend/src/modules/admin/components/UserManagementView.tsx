import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Lock,
  Unlock,
  KeyRound,
  Edit,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AccountStatus, UserAccount, UserRole } from '../types';
import { adminApi } from '../api';
import { UserAccountModal } from './UserAccountModal';
import { PasswordResetModal } from './PasswordResetModal';

interface UserManagementViewProps {
  users: UserAccount[];
  onUsersUpdated: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onUsersUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedUserForReset, setSelectedUserForReset] = useState<UserAccount | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleToggleLock = async (user: UserAccount) => {
    const nextStatus: AccountStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    setLoadingActionId(user.id);
    setErrorMessage(null);

    try {
      await adminApi.toggleUserLock(user.id, nextStatus);
      setActionSuccess(
        `Account for @${user.username} is now ${nextStatus === 'ACTIVE' ? 'Unlocked' : 'Locked'}.`
      );
      setTimeout(() => setActionSuccess(null), 3500);
      onUsersUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to change account status.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUserForEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenReset = (user: UserAccount) => {
    setSelectedUserForReset(user);
    setIsResetModalOpen(true);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'CHIEF_ACCOUNTANT':
      case 'ACCOUNTANT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DOCTOR':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'NURSE':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'PHARMACIST':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'LAB_SCIENTIST':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'RADIOLOGIST':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'AUDITOR':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Header & Filters */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Hospital Staff Directory & User Accounts
            </h2>
            <p className="text-xs text-slate-400">
              User identity provisioning, credential resets, and account access authorization
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New Staff User</span>
          </button>
        </div>

        {/* Action feedback */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by staff name, username, email or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="ADMIN">System Administrator</option>
              <option value="DOCTOR">Medical Doctor</option>
              <option value="NURSE">Staff Nurse</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="ACCOUNTANT">Billing Officer</option>
              <option value="CHIEF_ACCOUNTANT">Chief Accountant</option>
              <option value="NHIA_OFFICER">NHIA Officer</option>
              <option value="AUDITOR">Auditor</option>
              <option value="LAB_SCIENTIST">Lab Scientist</option>
              <option value="RADIOLOGIST">Radiologist</option>
              <option value="STOREKEEPER">Storekeeper</option>
              <option value="RECORDS_OFFICER">Records Officer</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE Only</option>
              <option value="LOCKED">LOCKED Only</option>
              <option value="SUSPENDED">SUSPENDED Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Staff Member</th>
                <th className="py-3 px-4 font-medium">Role & Department</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Security & 2FA</th>
                <th className="py-3 px-4 font-medium">Failed Logins</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No staff accounts match your current search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isLocked = user.status === 'LOCKED';
                  const isSuspended = user.status === 'SUSPENDED';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Staff Member */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{user.username} • {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            {user.department}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Lock className="w-3 h-3 text-rose-400" />
                            Locked
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/60 text-slate-400 border border-slate-600">
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Security & 2FA */}
                      <td className="py-3.5 px-4">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            2FA Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                            Password Only
                          </span>
                        )}
                      </td>

                      {/* Failed Logins */}
                      <td className="py-3.5 px-4">
                        {user.failedLoginAttempts > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {user.failedLoginAttempts} failed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">0</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Lock */}
                          <button
                            type="button"
                            disabled={loadingActionId === user.id}
                            onClick={() => handleToggleLock(user)}
                            title={isLocked ? 'Unlock Account' : 'Lock Account'}
                            className={`p-1.5 rounded-lg border transition ${
                              isLocked
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {isLocked ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenReset(user)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-amber-300 hover:bg-slate-700 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Staff Account"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-indigo-300 hover:bg-slate-700 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
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

      {/* Modals */}
      <UserAccountModal
        userToEdit={selectedUserForEdit}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserSaved={() => {
          onUsersUpdated();
          setIsEditModalOpen(false);
        }}
      />

      <PasswordResetModal
        user={selectedUserForReset}
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onPasswordReset={() => {
          onUsersUpdated();
        }}
      />
    </div>
  );
};
