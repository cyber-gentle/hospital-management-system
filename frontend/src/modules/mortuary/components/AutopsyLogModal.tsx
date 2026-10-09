import React, { useState } from 'react';
import { X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DeceasedRecord, AutopsyLog } from '../types';

interface AutopsyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  deceased: DeceasedRecord;
  onSubmit: (log: Omit<AutopsyLog, 'id' | 'autopsyDate'>) => Promise<void>;
}

export const AutopsyLogModal: React.FC<AutopsyLogModalProps> = ({
  isOpen,
  onClose,
  deceased,
  onSubmit
}) => {
  const [pathologistName, setPathologistName] = useState('Prof. E. B. Adeyemi');
  const [pathologistLicense, setPathologistLicense] = useState('FMCPath/9821');
  const [externalFindings, setExternalFindings] = useState('Well-nourished deceased. No evidence of defensive wounds. Lividity fixed posteriorly.');
  const [internalFindings, setInternalFindings] = useState('');
  const [definitiveCauseOfDeath, setDefinitiveCauseOfDeath] = useState('');
  const [toxicologyInput, setToxicologyInput] = useState('Femoral blood, Vitreous humor');
  const [coronerVerdict, setCoronerVerdict] = useState('Post-mortem examination concludes natural cause. Death certificate endorsed.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const toxicologySamples = toxicologyInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await onSubmit({
        deceasedId: deceased.id,
        deceasedName: deceased.fullName,
        deceasedTagNumber: deceased.deceasedTagNumber,
        pathologistName: pathologistName.trim(),
        pathologistLicense: pathologistLicense.trim(),
        externalFindings: externalFindings.trim(),
        internalFindings: internalFindings.trim(),
        definitiveCauseOfDeath: definitiveCauseOfDeath.trim(),
        toxicologySamplesRetained: toxicologySamples,
        coronerVerdict: coronerVerdict.trim()
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
            <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Post-Mortem / Autopsy Protocol</h2>
              <p className="text-xs text-slate-400">
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

        {deceased.isCoronerCase && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Coroner Inquest Protocol:</strong> Medico-legal post-mortem requested under Police Ref: {deceased.policeRefNumber || 'N/A'}.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Pathologist Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Consultant Pathologist *</label>
              <input
                type="text"
                required
                value={pathologistName}
                onChange={(e) => setPathologistName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pathologist License Number *</label>
              <input
                type="text"
                required
                value={pathologistLicense}
                onChange={(e) => setPathologistLicense(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>
          </div>

          {/* Autopsy Findings */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                External Examination Findings *
              </label>
              <textarea
                required
                rows={2}
                value={externalFindings}
                onChange={(e) => setExternalFindings(e.target.value)}
                placeholder="External injuries, scars, rigor mortis, livor mortis, nutritional state..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Internal Examination (Head, Neck, Thorax &amp; Abdomen) *
              </label>
              <textarea
                required
                rows={3}
                value={internalFindings}
                onChange={(e) => setInternalFindings(e.target.value)}
                placeholder="Cardiac findings, coronary patency, lungs, liver, cranial vault and brain parenchyma..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Definitive Post-Mortem Cause of Death *
              </label>
              <textarea
                required
                rows={2}
                value={definitiveCauseOfDeath}
                onChange={(e) => setDefinitiveCauseOfDeath(e.target.value)}
                placeholder="e.g. Acute myocardial infarction secondary to critical coronary atherosclerosis..."
                className="w-full text-xs font-bold rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Toxicology & Verdict */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Toxicology &amp; Histology Samples Retained <span className="text-slate-400 font-normal">(Comma-separated)</span>
              </label>
              <input
                type="text"
                value={toxicologyInput}
                onChange={(e) => setToxicologyInput(e.target.value)}
                placeholder="e.g. Femoral blood, Vitreous humor, Liver wedge, Gastric contents"
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Pathologist / Coroner Verdict *</label>
              <input
                type="text"
                required
                value={coronerVerdict}
                onChange={(e) => setCoronerVerdict(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              {submitting ? 'Certifying...' : 'Finalize Autopsy Protocol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
