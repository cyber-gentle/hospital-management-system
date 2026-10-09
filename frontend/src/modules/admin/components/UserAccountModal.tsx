import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserCheck,
  X,
  Save,
  AlertCircle,
  Building,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { AccountStatus, UserAccount, UserRole } from '../types';
import { adminApi } from '../api';

interface UserAccountModalProps {
  userToEdit: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: (user: UserAccount) => void;
}

const AVAILABLE_ROLES: { role: UserRole; label: string }[] = [
  { role: 'ADMIN', label: 'System Administrator (ICT)' },
  { role: 'DOCTOR', label: 'Medical Doctor / Consultant' },
  { role: 'NURSE', label: 'Staff Nurse / Nursing Lead' },
  { role: 'PHARMACIST', label: 'Pharmacist' },
  { role: 'ACCOUNTANT', label: 'Billing Officer / Cashier' },
  { role: 'CHIEF_ACCOUNTANT', label: 'Chief Accountant' },
  { role: 'NHIA_OFFICER', label: 'HMO / NHIA Desk Officer' },
  { role: 'AUDITOR', label: 'Internal Auditor' },
  { role: 'LAB_SCIENTIST', label: 'Medical Lab Scientist' },
  { role: 'RADIOLOGIST', label: 'Radiology Officer' },
  { role: 'STOREKEEPER', label: 'Inventory Storekeeper' },
  { role: 'RECORDS_OFFICER', label: 'Health Records Officer' },
];

const HOSPITAL_DEPARTMENTS = [
  'ICT & Systems Directorate',
  'Internal Medicine',
  'Surgery & Obstetrics',
  'Pediatrics & Child Health',
  'Inpatient Nursing Directorate',
  'Finance & Patient Accounts',
  'Pharmacy Services',
  'Medical Laboratory Services',
  'Radiology & PACS',
  'Procurement & Materials Management',
  'NHIA & Health Insurance Desk',
  'Health Records & Registry',
  'Internal Audit & Compliance',
];

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  userToEdit,
  isOpen,
  onClose,
  onUserSaved,
}) => {
  const isEditing = Boolean(userToEdit);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'DOCTOR' as UserRole,
    department: 'Internal Medicine',
    status: 'ACTIVE' as AccountStatus,
    twoFactorEnabled: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username,
        email: userToEdit.email,
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        phoneNumber: userToEdit.phoneNumber,
        role: userToEdit.role,
        department: userToEdit.department,
        status: userToEdit.status,
        twoFactorEnabled: userToEdit.twoFactorEnabled,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '+234 ',
        role: 'DOCTOR',
        department: 'Internal Medicine',
        status: 'ACTIVE',
        twoFactorEnabled: false,
      });
    }
    setErrorMessage(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.username.trim() || !formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please complete all required staff identity fields.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && userToEdit) {
        const updated = await adminApi.updateUser(userToEdit.id, formData);
        onUserSaved(updated);
      } else {
        const created = await adminApi.createUser(formData);
        onUserSaved(created);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isEditing ? 'Edit Hospital Staff Account' : 'Provision New Staff User'}
              </h3>
              <p className="text-xs text-slate-400">
                Identity Credentials & Granular RBAC Role Assignment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Amina"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Bello"
              />
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })
                }
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                placeholder="e.g. abello"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Hospital Email <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. a.bello@nsthabuja.gov.ng"
              />
            </div>
          </div>

          {/* Phone & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="+234 803 000 0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {HOSPITAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Assigned RBAC Role <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {AVAILABLE_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as AccountStatus })
                }
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ACTIVE">ACTIVE (Access Granted)</option>
                <option value="LOCKED">LOCKED (Temporarily Frozen)</option>
                <option value="SUSPENDED">SUSPENDED (Disciplinary / Departed)</option>
              </select>
            </div>
          </div>

          {/* 2FA Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition">
              <input
                type="checkbox"
                checked={formData.twoFactorEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, twoFactorEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <div>
                <div className="text-xs font-medium text-white">
                  Enforce Two-Factor Authentication (2FA)
                </div>
                <div className="text-[11px] text-slate-400">
                  Requires TOTP authenticator code upon signing in (Mandatory for Chief Accountant & ICT Admins)
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-900/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Account' : 'Provision User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
