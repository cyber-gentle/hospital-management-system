import React, { useState, useEffect } from 'react';
import { DischargeDossier } from '../types';
import { nursingApi } from '../api';

interface DischargeChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  onDischargeCompleted: () => void;
}

export const DischargeChecklistModal: React.FC<DischargeChecklistModalProps> = ({
  isOpen,
  onClose,
  admissionId,
  onDischargeCompleted
}) => {
  const [dossier, setDossier] = useState<DischargeDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [matronName, setMatronName] = useState('Matron R. Adeleke, CNO');
  const [isTriggering, setIsTriggering] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && admissionId) {
      loadDossier();
    }
  }, [isOpen, admissionId]);

  const loadDossier = async () => {
    setLoading(true);
    try {
      const data = await nursingApi.getDischargeDossier(admissionId);
      setDossier(data);
      if (data.billingInvoiceId) {
        setGeneratedInvoiceId(data.billingInvoiceId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleItem = async (itemId: string) => {
    if (!dossier || dossier.billingTriggered) return;
    try {
      const updated = await nursingApi.toggleDischargeItem(admissionId, itemId, 'Nurse B. Taiwo, RN');
      setDossier(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;

    try {
      const updated = await nursingApi.applyMatronOverride(admissionId, overrideReason, matronName);
      setDossier(updated);
      setShowOverrideModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerBilling = async () => {
    if (!dossier || !dossier.canTriggerBilling) return;

    setIsTriggering(true);
    try {
      const res = await nursingApi.triggerDischargeBilling(admissionId);
      setGeneratedInvoiceId(res.invoiceId);
      setDossier(prev => prev ? { ...prev, billingTriggered: true, billingInvoiceId: res.invoiceId } : null);
      onDischargeCompleted();
    } catch (err) {
      console.error(err);
      alert('Failed to trigger billing invoice.');
    } finally {
      setIsTriggering(false);
    }
  };

  const completedCount = dossier ? dossier.items.filter(i => i.completed).length : 0;
  const totalCount = dossier ? dossier.items.length : 6;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              📋
            </div>
            <div>
              <h2 className="text-lg font-bold">Discharge Checklist & Billing Gate (FR-NS-09 / 10)</h2>
              <p className="text-xs text-purple-100">
                {dossier?.patientName} • {dossier?.hospitalNumber} • {dossier?.wardName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading discharge dossier...</div>
          ) : dossier ? (
            <>
              {/* Progress & Gate Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Checklist Completion Status:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                    progressPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {completedCount} of {totalCount} Items Done ({progressPercent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Policy Gate: 100% completion required for automatic invoice trigger</span>
                  {dossier.hasMatronOverride && (
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚠️ Matron Override Active
                    </span>
                  )}
                </div>
              </div>

              {/* Success Notification if already triggered */}
              {generatedInvoiceId && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span>✅</span> Billing Trigger Dispatched Successfully!
                  </div>
                  <p className="text-xs">
                    Generated Final Invoice: <strong className="font-mono">{generatedInvoiceId}</strong>. Handover completed and patient discharge clearance issued.
                  </p>
                </div>
              )}

              {/* Checklist items */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Mandatory Discharge Verification Items
                </h3>

                <div className="space-y-2">
                  {dossier.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        readOnly
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 pointer-events-none"
                      />
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${item.completed ? 'text-emerald-950 line-through' : 'text-slate-800'}`}>
                          {item.label}
                        </p>
                        {item.completedBy && item.completedAt && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Verified by {item.completedBy} at {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matron Override Details if applied */}
              {dossier.hasMatronOverride && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>🛡️</span> Matron / Physician Override Audit Record:
                  </p>
                  <p className="text-slate-600">
                    Approved by: <strong>{dossier.matronOverrideBy}</strong>
                  </p>
                  <p className="text-slate-600 italic">
                    Reason: "{dossier.matronOverrideReason}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(true)}
                  disabled={dossier.billingTriggered || dossier.hasMatronOverride}
                  className="w-full sm:w-auto px-4 py-2 border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-40 rounded-xl text-xs font-bold transition-colors"
                >
                  ⚡ Matron / Doctor Override
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerBilling}
                    disabled={!dossier.canTriggerBilling || dossier.billingTriggered || isTriggering}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                      dossier.canTriggerBilling && !dossier.billingTriggered
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isTriggering
                      ? 'Generating Invoice...'
                      : dossier.billingTriggered
                      ? '✓ Billing Already Triggered'
                      : 'Trigger Billing & Discharge Patient →'}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Matron Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <span>🛡️</span> Matron / Doctor Discharge Override
              </h3>
              <p className="text-xs text-slate-500">
                This action bypasses remaining checklist items and unlocks the billing trigger. An immutable audit record will be logged with your credentials.
              </p>

              <form onSubmit={handleApplyOverride} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Authorizing Matron / Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={matronName}
                    onChange={(e) => setMatronName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical / Administrative Justification *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Patient transferring urgently to tertiary neurosurgical center via ambulance. Remaining oral meds dispensed directly into transit box."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOverrideModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Authorize & Sign Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
