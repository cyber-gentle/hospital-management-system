import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Stethoscope,
  Building,
  Bell,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Ban,
  Layers,
  Send,
  UserCheck,
} from "lucide-react";
import { Appointment } from "../types";

interface AppointmentDetailDrawerProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onCheckIn: (appointmentId: string) => Promise<void>;
  onTriggerReminder: (appointmentId: string) => Promise<void>;
  onOpenReschedule: (apt: Appointment) => void;
  onOpenCancel: (apt: Appointment) => void;
}

export const AppointmentDetailDrawer: React.FC<AppointmentDetailDrawerProps> = ({
  isOpen,
  appointment,
  onClose,
  onCheckIn,
  onTriggerReminder,
  onOpenReschedule,
  onOpenCancel,
}) => {
  const [isActing, setIsActing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleCheckIn = async () => {
    try {
      setIsActing(true);
      await onCheckIn(appointment.id);
      setActionNotice("Patient marked as Checked-In for consultation triage.");
    } catch {
      setActionNotice("Failed to record check-in.");
    } finally {
      setIsActing(false);
    }
  };

  const handleResendReminder = async () => {
    try {
      setIsActing(true);
      await onTriggerReminder(appointment.id);
      setActionNotice("Appointment reminder dispatched via SMS & Email.");
    } catch {
      setActionNotice("Failed to dispatch reminder.");
    } finally {
      setIsActing(false);
    }
  };

  const isWalkIn = appointment.queueType === "GOPD_WALK_IN";
  const isScheduled = appointment.status === "SCHEDULED";
  const isCheckedIn = appointment.status === "CHECKED_IN";
  const isCompleted = appointment.status === "COMPLETED";
  const isCancelled = appointment.status === "CANCELLED";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl shadow-2xl h-full flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                {appointment.appointmentNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : isCheckedIn
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : isCancelled
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {appointment.status.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
              {appointment.patientName}
            </h2>
            <p className="text-xs text-slate-400">
              MRN: {appointment.patientMrn} • {appointment.patientGender}, {appointment.patientAge} yrs
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action notification banner */}
        {actionNotice && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-emerald-600 hover:text-emerald-950 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* FR-AP-05: Explicit Queue Distinction Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isWalkIn
                ? "bg-amber-50/60 border-amber-200 text-amber-900"
                : "bg-blue-50/60 border-blue-200 text-blue-900"
            }`}
          >
            <Layers
              className={`w-5 h-5 mt-0.5 shrink-0 ${
                isWalkIn ? "text-amber-600" : "text-blue-600"
              }`}
            />
            <div>
              <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>Queue Model:</span>
                <span className="font-extrabold underline">
                  {isWalkIn ? "GOPD Walk-in Queue" : "Specialist Booked Clinic"}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-600">
                {isWalkIn
                  ? "This record is a same-day general outpatient arrival in the triage queue, distinguished from scheduled consultant appointments (FR-AP-05)."
                  : "This record is a reserved consultation time slot booked in advance with a specialist physician."}
              </p>
            </div>
          </div>

          {/* Clinical Doctor Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Assigned Consultant & Location
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Doctor / Specialist:</span>
                <span className="font-bold text-slate-800 text-sm">{appointment.doctorName}</span>
                <span className="text-blue-700 block font-medium mt-0.5">
                  {appointment.specialty}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Department & Room:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {appointment.department}
                </span>
                <span className="text-slate-600 block mt-0.5">Clinic Suite 102</span>
              </div>
            </div>
          </div>

          {/* Time & Schedule Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Schedule & Arrival Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Appointment Date:</span>
                <span className="font-bold text-slate-800 text-sm">{appointment.date}</span>
                <span className="text-slate-600 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Clinic Arrival Status:</span>
                {appointment.checkInTime ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold mt-1">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Arrived @ {new Date(appointment.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold mt-1 block">
                    Awaiting Patient Arrival
                  </span>
                )}
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Priority: {appointment.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Reason for Visit & Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clinical Reason for Visit
            </h3>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium">
              {appointment.reasonForVisit}
            </div>
            {appointment.clinicalNotes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span className="font-bold text-slate-700 block mb-0.5">Triage / Clinical Notes:</span>
                {appointment.clinicalNotes}
              </div>
            )}
          </div>

          {/* FR-AP-04: Automated Reminders Status */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                Automated Reminders (FR-AP-04)
              </h3>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  appointment.reminderStatus === "DELIVERED"
                    ? "bg-emerald-100 text-emerald-800"
                    : appointment.reminderStatus === "SENT"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {appointment.reminderStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Channel:</span>
                <span className="font-semibold text-slate-800">
                  {appointment.reminderPreference === "BOTH"
                    ? "SMS & Email"
                    : appointment.reminderPreference}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Dispatch Time:</span>
                <span className="font-medium text-slate-700">
                  {appointment.reminderSentAt
                    ? new Date(appointment.reminderSentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                    : "Scheduled for T-24h"}
                </span>
              </div>
            </div>

            {appointment.reminderPreference !== "NONE" && !isCancelled && (
              <button
                type="button"
                disabled={isActing}
                onClick={handleResendReminder}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                Resend Reminder Notification Now
              </button>
            )}
          </div>

          {/* Patient Contact Info */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h3 className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              Patient Contact Details
            </h3>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {appointment.patientPhone}
              </span>
              <span className="text-blue-600 font-medium">MPI Registered Patient</span>
            </div>
          </div>

          {/* Cancellation Info if cancelled */}
          {appointment.status === "CANCELLED" && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Appointment Cancelled
              </div>
              <p>
                <strong>Reason:</strong> {appointment.cancellationReason || "Not specified"}
              </p>
              {appointment.cancelledAt && (
                <p className="text-[11px] text-rose-600">
                  Cancelled on: {new Date(appointment.cancelledAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Reschedule Info if rescheduled */}
          {appointment.status === "RESCHEDULED" && appointment.rescheduleReason && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                Appointment Rescheduled
              </div>
              <p>
                <strong>Reason:</strong> {appointment.rescheduleReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!isCancelled && !isCompleted && (
              <>
                {isScheduled && (
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={handleCheckIn}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Check-In Arrival
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenReschedule(appointment)}
                  className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  Reschedule
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCancel(appointment)}
                  className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-600" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
