import React, { useState, useMemo } from "react";
import { X, HeartPulse, CheckCircle2, AlertTriangle, ShieldCheck, Bed, ArrowRight } from "lucide-react";
import { SurgeryBooking, PacuRecoveryLog, AldreteScore } from "../types";

interface PacuRecoveryModalProps {
  isOpen: boolean;
  booking: SurgeryBooking | null;
  onClose: () => void;
  onSavePacu: (bookingId: string, log: PacuRecoveryLog) => Promise<void>;
}

export const PacuRecoveryModal: React.FC<PacuRecoveryModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSavePacu,
}) => {
  const existing = booking?.pacuLog;

  const [bloodPressure, setBloodPressure] = useState(existing?.initialVitals.bloodPressure || "120/80");
  const [pulseRate, setPulseRate] = useState<number>(existing?.initialVitals.pulseRate || 76);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(existing?.initialVitals.respiratoryRate || 16);
  const [oxygenSaturation, setOxygenSaturation] = useState<number>(existing?.initialVitals.oxygenSaturation || 98);
  const [temperature, setTemperature] = useState<number>(existing?.initialVitals.temperature || 36.7);
  const [painScore, setPainScore] = useState<number>(existing?.initialVitals.painScore || 2);

  // Aldrete Criteria scores
  const [activity, setActivity] = useState<number>(existing?.aldreteScore.activity ?? 2);
  const [respiration, setRespiration] = useState<number>(existing?.aldreteScore.respiration ?? 2);
  const [circulation, setCirculation] = useState<number>(existing?.aldreteScore.circulation ?? 2);
  const [consciousness, setConsciousness] = useState<number>(existing?.aldreteScore.consciousness ?? 2);
  const [aldreteO2, setAldreteO2] = useState<number>(existing?.aldreteScore.oxygenSaturation ?? 2);

  const [analgesiaAdministered, setAnalgesiaAdministered] = useState(existing?.analgesiaAdministered || "IV Paracetamol 1g");
  const [ivFluidsAdministered, setIvFluidsAdministered] = useState(existing?.ivFluidsAdministered || "Normal Saline @ 80ml/hr");
  const [recoveryNotes, setRecoveryNotes] = useState(existing?.recoveryNotes || "Patient comfortable, airway clear, stable post-anesthetic course.");
  const [destinationWard, setDestinationWard] = useState(existing?.destinationWard || "Male Surgical Ward (Ward A)");
  const [authorizedBy, setAuthorizedBy] = useState(existing?.authorizedBy || "Duty PACU Anaesthetist");
  const [isAuthorizingTransfer, setIsAuthorizingTransfer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalAldreteScore = useMemo(() => {
    return activity + respiration + circulation + consciousness + aldreteO2;
  }, [activity, respiration, circulation, consciousness, aldreteO2]);

  const isFitForTransfer = totalAldreteScore >= 8;

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorizedBy.trim()) {
      setError("Authorizing clinician signature/name is required.");
      return;
    }

    if (isAuthorizingTransfer && !isFitForTransfer) {
      setError("Clinical Protocol: Aldrete score must be at least 8/10 to authorize ward transfer.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const aldrete: AldreteScore = {
        activity,
        respiration,
        circulation,
        consciousness,
        oxygenSaturation: aldreteO2,
        totalScore: totalAldreteScore,
      };

      await onSavePacu(booking.id, {
        admissionTime: existing?.admissionTime || new Date().toISOString(),
        initialVitals: {
          bloodPressure: bloodPressure.trim(),
          pulseRate: Number(pulseRate),
          respiratoryRate: Number(respiratoryRate),
          oxygenSaturation: Number(oxygenSaturation),
          temperature: Number(temperature),
          painScore: Number(painScore),
        },
        aldreteScore: aldrete,
        analgesiaAdministered: analgesiaAdministered.trim() || undefined,
        ivFluidsAdministered: ivFluidsAdministered.trim() || undefined,
        recoveryNotes: recoveryNotes.trim(),
        fitForWardTransfer: isFitForTransfer,
        authorizedBy: authorizedBy.trim(),
        destinationWard: isAuthorizingTransfer ? destinationWard : undefined,
        transferTime: isAuthorizingTransfer ? new Date().toISOString() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record PACU log";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300 border border-purple-400/30">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">PACU Post-Operative Recovery</h3>
              <p className="text-xs text-purple-200">
                Aldrete Scoring, Vitals Monitoring & Ward Transfer Clearance
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
        <div className="bg-purple-50/60 border-b border-purple-100/80 px-6 py-3 flex items-center justify-between text-xs text-purple-950">
          <div>
            <span className="font-semibold text-slate-900">{booking.patientName}</span> ({booking.hospitalNumber}) • {booking.procedureName}
          </div>
          <div className="font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
            Current Status: {booking.status}
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

          {/* Vitals Grid */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-purple-600" />
              Recovery Vital Signs
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  required
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  required
                  value={pulseRate}
                  onChange={(e) => setPulseRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Respiratory Rate (/min)</label>
                <input
                  type="number"
                  required
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  required
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pain Score (0 - 10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={painScore}
                  onChange={(e) => setPainScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Aldrete Score Calculator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Modified Aldrete Recovery Scoring System
              </h4>
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                isFitForTransfer
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                Score: {totalAldreteScore} / 10
                {isFitForTransfer ? " (Fit for Transfer)" : " (Requires PACU Stay)"}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Activity */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Motor Activity:</span>
                <select
                  value={activity}
                  onChange={(e) => setActivity(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value={2}>2 - Able to move 4 extremities voluntarily or on command</option>
                  <option value={1}>1 - Able to move 2 extremities</option>
                  <option value={0}>0 - Unable to move extremities</option>
                </select>
              </div>

              {/* Respiration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Respiration:</span>
                <select
                  value={respiration}
                  onChange={(e) => setRespiration(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value={2}>2 - Breathes deeply and coughs freely</option>
                  <option value={1}>1 - Dyspneic, shallow, or limited breathing</option>
                  <option value={0}>0 - Apneic</option>
                </select>
              </div>

              {/* Circulation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Circulation:</span>
                <select
                  value={circulation}
                  onChange={(e) => setCirculation(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value={2}>2 - BP within ±20% of pre-op baseline</option>
                  <option value={1}>1 - BP within ±20% to 49% of pre-op baseline</option>
                  <option value={0}>0 - BP within ±50% of pre-op baseline</option>
                </select>
              </div>

              {/* Consciousness */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Consciousness:</span>
                <select
                  value={consciousness}
                  onChange={(e) => setConsciousness(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value={2}>2 - Fully awake and oriented</option>
                  <option value={1}>1 - Arousable on calling name</option>
                  <option value={0}>0 - Unresponsive</option>
                </select>
              </div>

              {/* Oxygen Saturation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Oxygen Saturation:</span>
                <select
                  value={aldreteO2}
                  onChange={(e) => setAldreteO2(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value={2}>2 - SpO2 &gt; 92% on room air</option>
                  <option value={1}>1 - Requires supplemental O2 to maintain SpO2 &gt; 90%</option>
                  <option value={0}>0 - SpO2 &lt; 90% with supplemental oxygen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medications & Notes */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Post-op Analgesia Administered</label>
                <input
                  type="text"
                  value={analgesiaAdministered}
                  onChange={(e) => setAnalgesiaAdministered(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">IV Fluids Administered</label>
                <input
                  type="text"
                  value={ivFluidsAdministered}
                  onChange={(e) => setIvFluidsAdministered(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PACU Nursing Recovery Notes</label>
              <textarea
                rows={2}
                value={recoveryNotes}
                onChange={(e) => setRecoveryNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Discharge / Ward Transfer Authorization Gate */}
          <div className="p-4 bg-purple-50/70 border border-purple-200/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-purple-950">
                <input
                  type="checkbox"
                  checked={isAuthorizingTransfer}
                  onChange={(e) => setIsAuthorizingTransfer(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                />
                Authorize Immediate Transfer to Inpatient Ward
              </label>
              <span className="text-[11px] text-purple-700">Discharges patient from Theatre PACU</span>
            </div>

            {isAuthorizingTransfer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-purple-600" /> Destination Ward *
                  </label>
                  <select
                    value={destinationWard}
                    onChange={(e) => setDestinationWard(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  >
                    <option value="Male Surgical Ward (Ward A)">Male Surgical Ward (Ward A)</option>
                    <option value="Female Surgical Ward (Ward C)">Female Surgical Ward (Ward C)</option>
                    <option value="Orthopaedic Ward (Ward B)">Orthopaedic Ward (Ward B)</option>
                    <option value="Maternity / Postnatal Ward">Maternity / Postnatal Ward</option>
                    <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                    <option value="High Dependency Unit (HDU)">High Dependency Unit (HDU)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Authorizing Clinician *</label>
                  <input
                    type="text"
                    required
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 className={`w-4 h-4 ${isFitForTransfer ? "text-emerald-600" : "text-amber-500"}`} />
              Aldrete Status: {isFitForTransfer ? "Cleared (≥8/10)" : "Monitoring in PACU (<8/10)"}
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
                disabled={isSubmitting || (isAuthorizingTransfer && !isFitForTransfer)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? "Saving Log..." : isAuthorizingTransfer ? "Authorize Ward Transfer" : "Save PACU Vitals"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
