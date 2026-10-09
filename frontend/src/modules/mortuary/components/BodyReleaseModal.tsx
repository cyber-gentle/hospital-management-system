import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { DeceasedRecord, BodyReleaseRecord } from '../types';

interface BodyReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  deceased: DeceasedRecord;
  onSubmit: (release: Omit<BodyReleaseRecord, 'id' | 'releaseDate'>) => Promise<void>;
}

export const BodyReleaseModal: React.FC<BodyReleaseModalProps> = ({
  isOpen,
  onClose,
  deceased,
  onSubmit
}) => {
  const [releasedToName, setReleasedToName] = useState(deceased.nextOfKin?.name || '');
  const [releasedToNIN, setReleasedToNIN] = useState(deceased.nextOfKin?.nationalIdNumber || '');
  const [releasedToRelationship, setReleasedToRelationship] = useState(deceased.nextOfKin?.relationship || 'Next of Kin');
  const [funeralHomeOrUndertaker, setFuneralHomeOrUndertaker] = useState('Eternal Peace Funeral Undertakers Ltd.');
  const [burialPermitNumber, setBurialPermitNumber] = useState('');
  const [coronerClearanceConfirmed, setCoronerClearanceConfirmed] = useState(true);
  const [billingReceiptNumber, setBillingReceiptNumber] = useState(deceased.financialClearancePaid ? 'RCP-PAID-CLEARANCE' : '');
  const [mortuaryOfficer, setMortuaryOfficer] = useState('Chief Mortician J. Adamu');
  const [handoverNotes, setHandoverNotes] = useState('Body verified and tagged. All personal property handed over to Next of Kin.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        deceasedId: deceased.id,
        deceasedName: deceased.fullName,
        deceasedTagNumber: deceased.deceasedTagNumber,
        releasedToName: releasedToName.trim(),
        releasedToNIN: releasedToNIN.trim(),
        releasedToRelationship: releasedToRelationship.trim(),
        funeralHomeOrUndertaker: funeralHomeOrUndertaker.trim(),
        burialPermitNumber: burialPermitNumber.trim(),
        coronerClearanceConfirmed,
        billingReceiptNumber: billingReceiptNumber.trim(),
        mortuaryOfficer: mortuaryOfficer.trim(),
        handoverNotes: handoverNotes.trim()
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Body Release &amp; Handover Clearance</h2>
              <p className="text-xs text-slate-300">
                FR-MOR-03 • Deceased: <span className="font-semibold text-white">{deceased.fullName}</span> ({deceased.deceasedTagNumber}) • Vault: {deceased.assignedChamberUnit || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Recipient Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-purple-600" /> Authorized Recipient (Next of Kin)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Recipient Full Name *</label>
                <input
                  type="text"
                  required
                  value={releasedToName}
                  onChange={(e) => setReleasedToName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Relationship to Deceased *</label>
                <input
                  type="text"
                  required
                  value={releasedToRelationship}
                  onChange={(e) => setReleasedToRelationship(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">National ID (NIN) Number *</label>
                <input
                  type="text"
                  required
                  value={releasedToNIN}
                  onChange={(e) => setReleasedToNIN(e.target.value)}
                  placeholder="e.g. NIN-99238471928"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Licensed Funeral Home / Hearse Service *</label>
              <input
                type="text"
                required
                value={funeralHomeOrUndertaker}
                onChange={(e) => setFuneralHomeOrUndertaker(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>
          </div>

          {/* Statutory Clearances */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Statutory &amp; Financial Clearances
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Government Burial Permit Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BUR-PERMIT-2026-9921"
                  value={burialPermitNumber}
                  onChange={(e) => setBurialPermitNumber(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mortuary Fee Clearance Receipt *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCP-2026-90412"
                  value={billingReceiptNumber}
                  onChange={(e) => setBillingReceiptNumber(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Total accrued storage fee: ₦{deceased.totalAccruedStorageFee?.toLocaleString() ?? 'Not configured'}
                </span>
              </div>
            </div>

            {deceased.isCoronerCase && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coronerClearanceConfirmed}
                    onChange={(e) => setCoronerClearanceConfirmed(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  Coroner / Magistrate release order &amp; police clearance verified on file
                </label>
              </div>
            )}
          </div>

          {/* Officer & Belongings Handover */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mortuary Officer Releasing Body *</label>
              <input
                type="text"
                required
                value={mortuaryOfficer}
                onChange={(e) => setMortuaryOfficer(e.target.value)}
                className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Handover Notes &amp; Property Receipt *</label>
              <textarea
                required
                rows={2}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Releasing...' : 'Confirm Release & Decommission Chamber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
