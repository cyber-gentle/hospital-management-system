import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  RotateCcw,
  Ban,
  User,
  Stethoscope,
} from "lucide-react";
import { Appointment, AvailabilitySlot } from "../types";

interface RescheduleCancelModalProps {
  isOpen: boolean;
  mode: "RESCHEDULE" | "CANCEL";
  appointment: Appointment | null;
  availableSlots: AvailabilitySlot[];
  onClose: () => void;
  onConfirmReschedule: (
    appointmentId: string,
    newDate: string,
    newSlotId: string,
    newStartTime: string,
    newEndTime: string,
    reason: string
  ) => Promise<void>;
  onConfirmCancel: (appointmentId: string, reason: string) => Promise<void>;
}

export const RescheduleCancelModal: React.FC<RescheduleCancelModalProps> = ({
  isOpen,
  mode,
  appointment,
  availableSlots,
  onClose,
  onConfirmReschedule,
  onConfirmCancel,
}) => {
  const [newDate, setNewDate] = useState<string>(
    appointment?.date || new Date().toISOString().split("T")[0] || ""
  );
  const [newSlotId, setNewSlotId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  // Filter slots for this doctor on the selected date that are available
  const doctorSlots = availableSlots.filter(
    (s) => s.doctorId === appointment.doctorId && s.status === "AVAILABLE"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reason.trim()) {
      setErrorMsg("A mandatory audit reason is required for clinical records.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === "RESCHEDULE") {
        const slot = doctorSlots.find((s) => s.id === newSlotId);
        if (!slot) {
          setErrorMsg("Please select an available new time slot.");
          setIsSubmitting(false);
          return;
        }
        await onConfirmReschedule(
          appointment.id,
          newDate,
          slot.id,
          slot.startTime,
          slot.endTime,
          reason
        );
      } else {
        await onConfirmCancel(appointment.id, reason);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between ${
            mode === "RESCHEDULE"
              ? "bg-gradient-to-r from-indigo-700 to-blue-800"
              : "bg-gradient-to-r from-rose-700 to-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              {mode === "RESCHEDULE" ? (
                <RotateCcw className="w-5 h-5 text-indigo-200" />
              ) : (
                <Ban className="w-5 h-5 text-rose-200" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {mode === "RESCHEDULE" ? "Reschedule Appointment" : "Cancel Appointment"}
              </h2>
              <p className="text-xs text-white/80">
                FR-AP-03 • {appointment.appointmentNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Appointment Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {appointment.patientName} ({appointment.patientMrn})
              </span>
              <span className="text-slate-500">{appointment.type}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                <span>{appointment.doctorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {appointment.date} @ {appointment.startTime}
                </span>
              </div>
            </div>
          </div>

          {mode === "RESCHEDULE" ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Select New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Select Available Time Slot
                </label>
                <select
                  value={newSlotId}
                  onChange={(e) => setNewSlotId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose open slot --</option>
                  {doctorSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.startTime} - {s.endTime} ({s.clinicRoom})
                    </option>
                  ))}
                </select>
                {doctorSlots.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No open slots currently available for this doctor on {newDate}.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Reschedule Clinical Reason *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient requested postponement due to travel; consultant unavailable..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Slot Release Warning
                </div>
                <p>
                  Cancelling will immediately release slot{" "}
                  <strong>
                    {appointment.date} ({appointment.startTime} - {appointment.endTime})
                  </strong>{" "}
                  back to the doctor availability pool.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mandatory Cancellation Reason (Audit Log) *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Patient admitted to IPD, patient deceased, duplicate booking..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors shadow-sm disabled:opacity-50 ${
                mode === "RESCHEDULE"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isSubmitting
                ? "Processing..."
                : mode === "RESCHEDULE"
                ? "Confirm Reschedule"
                : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
