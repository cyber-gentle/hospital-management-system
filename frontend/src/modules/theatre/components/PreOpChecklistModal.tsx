import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Stethoscope } from "lucide-react";
import { SurgeryBooking, PreOpChecklist } from "../types";

interface PreOpChecklistModalProps {
  isOpen: boolean;
  booking: SurgeryBooking | null;
  onClose: () => void;
  onSaveChecklist: (bookingId: string, checklist: PreOpChecklist) => Promise<void>;
}

export const PreOpChecklistModal: React.FC<PreOpChecklistModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSaveChecklist,
}) => {
  const existing = booking?.preOpChecklist;

  const [patientIdentified, setPatientIdentified] = useState(existing?.patientIdentified ?? false);
  const [siteMarked, setSiteMarked] = useState(existing?.siteMarked ?? false);
  const [consentConfirmed, setConsentConfirmed] = useState(existing?.consentConfirmed ?? false);
  const [anaesthesiaSafetyCheckComplete, setAnaesthesiaSafetyCheckComplete] = useState(existing?.anaesthesiaSafetyCheckComplete ?? false);
  const [pulseOximeterFunctioning, setPulseOximeterFunctioning] = useState(existing?.pulseOximeterFunctioning ?? false);
  const [allergiesReviewed, setAllergiesReviewed] = useState(existing?.allergiesReviewed ?? false);
  const [airwayDifficultyAssessed, setAirwayDifficultyAssessed] = useState(existing?.airwayDifficultyAssessed ?? false);
  const [aspirationRiskAssessed, setAspirationRiskAssessed] = useState(existing?.aspirationRiskAssessed ?? false);
  const [bloodLossRiskAssessed, setBloodLossRiskAssessed] = useState(existing?.bloodLossRiskAssessed ?? false);
  const [adequateIvAccessVerified, setAdequateIvAccessVerified] = useState(existing?.adequateIvAccessVerified ?? false);
  const [completedBy, setCompletedBy] = useState(existing?.completedBy || "Theatre Charge Nurse");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !booking) return null;

  const allItemsChecked = 
    patientIdentified &&
    siteMarked &&
    consentConfirmed &&
    anaesthesiaSafetyCheckComplete &&
    pulseOximeterFunctioning &&
    allergiesReviewed &&
    airwayDifficultyAssessed &&
    aspirationRiskAssessed &&
    bloodLossRiskAssessed &&
    adequateIvAccessVerified;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedBy.trim()) {
      setError("Please specify the completing practitioner's name.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSaveChecklist(booking.id, {
        patientIdentified,
        siteMarked,
        consentConfirmed,
        anaesthesiaSafetyCheckComplete,
        pulseOximeterFunctioning,
        allergiesReviewed,
        airwayDifficultyAssessed,
        aspirationRiskAssessed,
        bloodLossRiskAssessed,
        adequateIvAccessVerified,
        completedBy: completedBy.trim(),
        completedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record checklist";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-xl text-teal-300 border border-teal-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">WHO Surgical Safety Checklist</h3>
              <p className="text-xs text-teal-200">
                Phase 1: Sign-In (Before Induction of Anaesthesia)
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

        {/* Patient Summary Card */}
        <div className="bg-teal-50/60 border-b border-teal-100/80 px-6 py-3 flex items-center justify-between text-xs text-teal-900">
          <div>
            <span className="font-semibold text-slate-800">{booking.patientName}</span> ({booking.hospitalNumber}) • {booking.age}y/{booking.gender}
          </div>
          <div className="font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
            {booking.procedureName}
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

          {!allItemsChecked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Patient Safety Guard:</strong> All items in the WHO Sign-In protocol must be verified with the patient and theatre team prior to starting surgical induction.
              </span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Patient & Site Verification
            </h4>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={patientIdentified}
                onChange={(e) => setPatientIdentified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Has the patient confirmed their identity?</span>
                Full name, MRN, date of birth, and wristband details matched against surgical chart.
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={siteMarked}
                onChange={(e) => setSiteMarked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Is the surgical site marked?</span>
                Anatomical laterality verified (Right / Left) and signed with surgical marker (or not applicable).
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Is surgical & anaesthetic consent signed?</span>
                Valid, signed consent form in medical folder with procedure details, risks explained.
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              Anaesthesia & Physiological Checks
            </h4>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={anaesthesiaSafetyCheckComplete}
                onChange={(e) => setAnaesthesiaSafetyCheckComplete(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Anaesthesia safety check completed?</span>
                Machine gas supplies, vaporizers, suction, ventilator circuits, and emergency drugs verified.
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={pulseOximeterFunctioning}
                onChange={(e) => setPulseOximeterFunctioning(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Pulse oximeter on patient and functioning?</span>
                Audible pitch and numerical saturation tracing verified on theatre monitor.
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={allergiesReviewed}
                onChange={(e) => setAllergiesReviewed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Does patient have a known allergy?</span>
                Reviewed drug, latex, and iodine allergies with Anaesthetist and Circulator.
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={airwayDifficultyAssessed}
                onChange={(e) => setAirwayDifficultyAssessed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Difficult airway / aspiration risk assessed?</span>
                Mallampati score, videolaryngoscope / bougie on standby if airway difficulty suspected.
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={aspirationRiskAssessed}
                onChange={(e) => setAspirationRiskAssessed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">NPO (fasting) status verified?</span>
                Verified last oral intake of solids (&gt;6h) and clear liquids (&gt;2h).
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={bloodLossRiskAssessed && adequateIvAccessVerified}
                onChange={(e) => {
                  setBloodLossRiskAssessed(e.target.checked);
                  setAdequateIvAccessVerified(e.target.checked);
                }}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800">
                <span className="font-semibold block">Risk of &gt;500ml blood loss & adequate IV access verified?</span>
                Two large-bore IV cannulae placed, cross-matched packed cells available in Blood Bank if required.
              </div>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Checklist Sign-Off Practitioner Name *
            </label>
            <input
              type="text"
              required
              value={completedBy}
              onChange={(e) => setCompletedBy(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <CheckCircle2 className={`w-4 h-4 ${allItemsChecked ? "text-teal-600" : "text-slate-300"}`} />
              {allItemsChecked ? "All safety items satisfied" : "Incomplete safety checklist"}
            </div>
            <div className="flex items-center gap-3">
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
                disabled={isSubmitting || !allItemsChecked}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Locking Checklist..." : "Confirm & Authorize Sign-In"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
