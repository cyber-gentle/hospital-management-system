import React, { useState } from 'react';
import {
  Building2,
  ShieldAlert,
  Phone,
  Mail,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Save,
  Lock,
} from 'lucide-react';
import { GlobalSystemConfig } from '../types';
import { adminApi } from '../api';

interface FacilityConfigViewProps {
  config: GlobalSystemConfig;
  onConfigUpdated: (updated: GlobalSystemConfig) => void;
}

export const FacilityConfigView: React.FC<FacilityConfigViewProps> = ({
  config,
  onConfigUpdated,
}) => {
  const [formData, setFormData] = useState<GlobalSystemConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleFacilityChange = (field: keyof GlobalSystemConfig['facility'], val: string) => {
    setFormData((prev) => ({
      ...prev,
      facility: {
        ...prev.facility,
        [field]: val,
      },
    }));
  };

  const handleSecurityChange = <K extends keyof GlobalSystemConfig['security']>(
    field: K,
    val: GlobalSystemConfig['security'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: val,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await adminApi.updateConfig(formData);
      onConfigUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white">System Configuration & Facility Profile</h2>
          <p className="text-xs text-slate-400">
            Institutional Parameters, Identity Accreditations, and Clinical Policy Gates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Settings Saved
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Facility Details & Security Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hospital Profile (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Hospital Institutional Profile</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Hospital / Institution Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.facility.hospitalName}
                onChange={(e) => handleFacilityChange('hospitalName', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Facility Classification Level
                </label>
                <select
                  value={formData.facility.facilityLevel}
                  onChange={(e) =>
                    handleFacilityChange(
                      'facilityLevel',
                      e.target.value as GlobalSystemConfig['facility']['facilityLevel']
                    )
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Tertiary Teaching Hospital">Tertiary Teaching Hospital</option>
                  <option value="Federal Medical Centre">Federal Medical Centre</option>
                  <option value="State Specialist Hospital">State Specialist Hospital</option>
                  <option value="General Hospital">General Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Accreditation / MDCN Code
                </label>
                <input
                  type="text"
                  value={formData.facility.accreditationCode}
                  onChange={(e) => handleFacilityChange('accreditationCode', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Corporate Reg (CAC / Ministry) #
                </label>
                <input
                  type="text"
                  value={formData.facility.registrationNumber}
                  onChange={(e) => handleFacilityChange('registrationNumber', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Fiscal Operating Year
                </label>
                <input
                  type="text"
                  value={formData.facility.fiscalYear}
                  onChange={(e) => handleFacilityChange('fiscalYear', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Physical Street Address
              </label>
              <input
                type="text"
                value={formData.facility.physicalAddress}
                onChange={(e) => handleFacilityChange('physicalAddress', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Official Desk Phone</span>
                </label>
                <input
                  type="text"
                  value={formData.facility.officialPhone}
                  onChange={(e) => handleFacilityChange('officialPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Emergency Hotline</span>
                </label>
                <input
                  type="text"
                  value={formData.facility.emergencyHotline}
                  onChange={(e) => handleFacilityChange('emergencyHotline', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-rose-300 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Official Email</span>
                </label>
                <input
                  type="email"
                  value={formData.facility.officialEmail}
                  onChange={(e) => handleFacilityChange('officialEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security Policies & Clinical Policy Gates (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Security & Access Policies */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Security & Authentication Policies</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Session Timeout</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={formData.security.sessionTimeoutMinutes}
                      onChange={(e) =>
                        handleSecurityChange('sessionTimeoutMinutes', parseInt(e.target.value) || 30)
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-500 text-[11px]">mins</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Lockout Threshold</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={formData.security.maxFailedLoginAttempts}
                      onChange={(e) =>
                        handleSecurityChange('maxFailedLoginAttempts', parseInt(e.target.value) || 5)
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-500 text-[11px]">fails</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-slate-500" />
                  <span>Password Expiration Cycle</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={formData.security.passwordExpiryDays}
                    onChange={(e) =>
                      handleSecurityChange('passwordExpiryDays', parseInt(e.target.value) || 90)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-500 text-[11px]">days</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.enforceTwoFactorForFinancialRoles}
                    onChange={(e) =>
                      handleSecurityChange('enforceTwoFactorForFinancialRoles', e.target.checked)
                    }
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold text-slate-200">Enforce 2FA for Finance/Audit</div>
                    <div className="text-[11px] text-slate-500">Chief Accountant, Cashiers, Auditors</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.security.allowEmergencyOverrideLogging}
                    onChange={(e) =>
                      handleSecurityChange('allowEmergencyOverrideLogging', e.target.checked)
                    }
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold text-slate-200">Mandatory Emergency Audit Trails</div>
                    <div className="text-[11px] text-slate-500">Log all bypasses in append-only table</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Clinical Policy Gates */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <KeyRound className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Clinical Operation Policy Gates</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Admission Deposit Policy (PRD Gate Decision)
                </label>
                <select
                  value={formData.security.inpatientDepositGate}
                  onChange={(e) =>
                    handleSecurityChange(
                      'inpatientDepositGate',
                      e.target.value as 'SOFT_WARNING' | 'STRICT_BLOCK'
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="SOFT_WARNING">Soft Warning Banner (Care-First, A&E Exempt)</option>
                  <option value="STRICT_BLOCK">Strict Block (Require Deposit Receipt Before Bed)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Discharge Checklist Enforcement (PRD Trigger Decision)
                </label>
                <select
                  value={formData.security.dischargeChecklistEnforcement}
                  onChange={(e) =>
                    handleSecurityChange(
                      'dischargeChecklistEnforcement',
                      e.target.value as 'STRICT_100_PERCENT' | 'DOCTOR_OVERRIDE_PERMITTED'
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="STRICT_100_PERCENT">Strict 100% Completion (Nursing Sign Required)</option>
                  <option value="DOCTOR_OVERRIDE_PERMITTED">Doctor/Matron Override Permitted With Audit Rationale</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
