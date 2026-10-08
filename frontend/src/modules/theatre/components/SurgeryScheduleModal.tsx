import React, { useState } from "react";
import { X, Calendar, AlertTriangle, User, FileText, Stethoscope } from "lucide-react";
import { SurgeryBooking, SurgeryPriority, TheatreRoom } from "../types";

interface SurgeryScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (booking: Omit<SurgeryBooking, "id" | "bookingNumber" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const SurgeryScheduleModal: React.FC<SurgeryScheduleModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
}) => {
  const [patientName, setPatientName] = useState("");
  const [hospitalNumber, setHospitalNumber] = useState("");
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Female");
  const [procedureName, setProcedureName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [theatreRoom, setTheatreRoom] = useState<TheatreRoom>("OR 1 - General Surgery");
  const [leadSurgeon, setLeadSurgeon] = useState("");
  const [anaesthetist, setAnaesthetist] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number>(90);
  const [priority, setPriority] = useState<SurgeryPriority>("ELECTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !hospitalNumber.trim() || !procedureName.trim() || !leadSurgeon.trim()) {
      setError("Please complete all required fields (*).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSchedule({
        patientId: `PAT-${Date.now()}`,
        patientName: patientName.trim(),
        hospitalNumber: hospitalNumber.trim(),
        age: Number(age),
        gender,
        procedureName: procedureName.trim(),
        diagnosis: diagnosis.trim() || "Pending intra-operative assessment",
        theatreRoom,
        leadSurgeon: leadSurgeon.trim(),
        anaesthetist: anaesthetist.trim() || "Duty Anaesthetist",
        scheduledStartTime: new Date(scheduledStartTime).toISOString(),
        estimatedDurationMinutes: Number(estimatedDurationMinutes),
        priority,
        status: "SCHEDULED",
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to schedule surgery";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Schedule Surgical Procedure</h3>
              <p className="text-xs text-indigo-200">Operating Theatre Booking & Resource Allocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Priority Ribbon */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Surgical Priority *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["ELECTIVE", "URGENT", "EMERGENCY"] as SurgeryPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-2 ${
                    priority === p
                      ? p === "EMERGENCY"
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20"
                        : p === "URGENT"
                        ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {p === "EMERGENCY" && <AlertTriangle className="w-3.5 h-3.5" />}
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              Patient Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Ibrahim"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hospital Number (MRN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HIMS-2026-00412"
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "Male" | "Female" | "Other")}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Procedure & Clinical Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Surgical Case Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Proposed Procedure *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laparoscopic Appendectomy"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Primary Pre-op Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Appendicitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Room & Surgical Team Allocation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              Operating Room & Clinical Team
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Operating Theatre (OR) *</label>
                <select
                  value={theatreRoom}
                  onChange={(e) => setTheatreRoom(e.target.value as TheatreRoom)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="OR 1 - General Surgery">OR 1 - General Surgery</option>
                  <option value="OR 2 - Orthopaedic">OR 2 - Orthopaedic</option>
                  <option value="OR 3 - Emergency / Trauma">OR 3 - Emergency / Trauma</option>
                  <option value="OR 4 - Laparoscopic & Endoscopy">OR 4 - Laparoscopic & Endoscopy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lead Surgeon (Consultant) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Babatunde Alabi"
                  value={leadSurgeon}
                  onChange={(e) => setLeadSurgeon(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Anaesthetist</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Okafor"
                  value={anaesthetist}
                  onChange={(e) => setAnaesthetist(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Estimated Duration (min)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={estimatedDurationMinutes}
                  onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Scheduled Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
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
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
