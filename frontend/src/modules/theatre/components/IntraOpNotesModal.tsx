import React, { useState } from "react";
import { X, FileText, CheckCircle2, AlertTriangle, Users, Scissors, Clock } from "lucide-react";
import { SurgeryBooking, IntraOpNotes } from "../types";

interface IntraOpNotesModalProps {
  isOpen: boolean;
  booking: SurgeryBooking | null;
  onClose: () => void;
  onSaveNotes: (bookingId: string, notes: IntraOpNotes) => Promise<void>;
}

export const IntraOpNotesModal: React.FC<IntraOpNotesModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSaveNotes,
}) => {
  const existing = booking?.intraOpNotes;

  const [timeOutConfirmed, setTimeOutConfirmed] = useState(existing?.timeOutConfirmed ?? true);
  const [incisionTime, setIncisionTime] = useState(existing?.incisionTime || "09:00");
  const [closureTime, setClosureTime] = useState(existing?.closureTime || "10:30");
  const [leadSurgeon, setLeadSurgeon] = useState(existing?.leadSurgeon || booking?.leadSurgeon || "");
  const [assistantSurgeon, setAssistantSurgeon] = useState(existing?.assistantSurgeon || "");
  const [anaesthetist, setAnaesthetist] = useState(existing?.anaesthetist || booking?.anaesthetist || "");
  const [scrubNurse, setScrubNurse] = useState(existing?.scrubNurse || "");
  const [circulatingNurse, setCirculatingNurse] = useState(existing?.circulatingNurse || "");
  const [procedurePerformed, setProcedurePerformed] = useState(existing?.procedurePerformed || booking?.procedureName || "");
  const [surgicalFindings, setSurgicalFindings] = useState(existing?.surgicalFindings || "");
  const [estimatedBloodLossMl, setEstimatedBloodLossMl] = useState<number>(existing?.estimatedBloodLossMl || 150);
  const [specimensCollected, setSpecimensCollected] = useState(existing?.specimensCollected ?? false);
  const [specimenLabelText, setSpecimenLabelText] = useState(existing?.specimenLabels?.join(", ") || "");
  const [spongeNeedleCountVerified, setSpongeNeedleCountVerified] = useState(existing?.spongeNeedleCountVerified ?? true);
  const [implantBatchNumbers, setImplantBatchNumbers] = useState(existing?.implantBatchNumbers || "");
  const [complications, setComplications] = useState(existing?.complications || "None. Uneventful surgical course.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedurePerformed.trim() || !surgicalFindings.trim() || !scrubNurse.trim()) {
      setError("Please fill out procedure findings and nursing team particulars.");
      return;
    }

    if (!spongeNeedleCountVerified) {
      setError("Mandatory Safety Protocol: Sponge, needle, and instrument counts must be verified correct prior to closure.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const labels = specimensCollected && specimenLabelText.trim()
        ? specimenLabelText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await onSaveNotes(booking.id, {
        timeOutConfirmed,
        incisionTime,
        closureTime,
        leadSurgeon: leadSurgeon.trim(),
        assistantSurgeon: assistantSurgeon.trim() || undefined,
        anaesthetist: anaesthetist.trim(),
        scrubNurse: scrubNurse.trim(),
        circulatingNurse: circulatingNurse.trim() || "Duty Circulating Nurse",
        procedurePerformed: procedurePerformed.trim(),
        surgicalFindings: surgicalFindings.trim(),
        estimatedBloodLossMl: Number(estimatedBloodLossMl),
        specimensCollected,
        specimenLabels: labels,
        spongeNeedleCountVerified,
        implantBatchNumbers: implantBatchNumbers.trim() || undefined,
        complications: complications.trim() || undefined,
        recordedBy: leadSurgeon.trim(),
        recordedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record intra-operative notes";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Intra-Operative Record & Operative Notes</h3>
              <p className="text-xs text-indigo-200">
                Surgical Team, Intra-op Findings, Swab Counts & PACU Handoff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Subheader */}
        <div className="bg-indigo-50/60 border-b border-indigo-100/80 px-6 py-3 flex items-center justify-between text-xs text-indigo-900">
          <div>
            <span className="font-semibold text-slate-800">{booking.patientName}</span> ({booking.hospitalNumber}) • {booking.theatreRoom}
          </div>
          <div className="font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
            Case: {booking.bookingNumber}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Time-Out Check & Timings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={timeOutConfirmed}
                onChange={(e) => setTimeOutConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-bold text-slate-900 block">WHO Time-Out Performed & Confirmed</span>
                Team members introduced, patient verbally confirmed, anticipated critical events reviewed prior to skin incision.
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Incision Time *
                </label>
                <input
                  type="time"
                  required
                  value={incisionTime}
                  onChange={(e) => setIncisionTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Skin Closure Time *
                </label>
                <input
                  type="time"
                  required
                  value={closureTime}
                  onChange={(e) => setClosureTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Surgical Personnel */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Operating Personnel
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lead Surgeon *</label>
                <input
                  type="text"
                  required
                  value={leadSurgeon}
                  onChange={(e) => setLeadSurgeon(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assistant Surgeon</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Registrar"
                  value={assistantSurgeon}
                  onChange={(e) => setAssistantSurgeon(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Anaesthetist *</label>
                <input
                  type="text"
                  required
                  value={anaesthetist}
                  onChange={(e) => setAnaesthetist(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Scrub Nurse *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Nurse Joy"
                  value={scrubNurse}
                  onChange={(e) => setScrubNurse(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Circulating Nurse</label>
                <input
                  type="text"
                  placeholder="e.g. Staff Nurse Danladi"
                  value={circulatingNurse}
                  onChange={(e) => setCirculatingNurse(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Procedure Description & Findings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Operative Findings & Technique
            </h4>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Procedure Performed *</label>
              <input
                type="text"
                required
                value={procedurePerformed}
                onChange={(e) => setProcedurePerformed(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Surgical Findings & Operative Narrative *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe anatomy, pathological findings, surgical steps, haemostasis, and closure..."
                value={surgicalFindings}
                onChange={(e) => setSurgicalFindings(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Estimated Blood Loss (mL)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={estimatedBloodLossMl}
                  onChange={(e) => setEstimatedBloodLossMl(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Implant / Prosthesis Details (if any)</label>
                <input
                  type="text"
                  placeholder="Batch, serial number, size"
                  value={implantBatchNumbers}
                  onChange={(e) => setImplantBatchNumbers(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Intra-op Complications & Events</label>
              <input
                type="text"
                placeholder="e.g. None. Uneventful surgical course."
                value={complications}
                onChange={(e) => setComplications(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Specimens & Swab Count Safety */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Surgical Count & Specimen Reconciliation
            </h4>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={spongeNeedleCountVerified}
                onChange={(e) => setSpongeNeedleCountVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
              />
              <div className="text-xs text-emerald-950">
                <span className="font-bold block">Sponges, Needles & Instruments Count Verified Correct *</span>
                Dual count confirmed by Scrub Nurse and Circulator before cavity closure and upon final dressing application.
              </div>
            </label>

            <div className="pt-2 border-t border-emerald-100 flex items-start gap-3">
              <input
                type="checkbox"
                checked={specimensCollected}
                onChange={(e) => setSpecimensCollected(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
              />
              <div className="flex-1 text-xs text-emerald-950">
                <span className="font-medium block mb-1">Tissue Specimen(s) collected for Pathology?</span>
                {specimensCollected && (
                  <input
                    type="text"
                    placeholder="Enter specimen description & lab destination (e.g. Gallbladder for Histology)"
                    value={specimenLabelText}
                    onChange={(e) => setSpecimenLabelText(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !spongeNeedleCountVerified}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Recording..." : "Save Notes & Move to PACU"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
