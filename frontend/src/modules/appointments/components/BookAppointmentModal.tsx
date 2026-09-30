import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Calendar,
  Clock,
  User,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Layers,
} from "lucide-react";
import {
  AppointmentType,
  AvailabilitySlot,
  BookAppointmentRequest,
  Doctor,
  QueueType,
  ReminderPreference,
} from "../types";
import { fetchPatientOptions, PatientOption } from '../../medicalrecords/patientOptions';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (req: BookAppointmentRequest) => Promise<void>;
  doctors: Doctor[];
  availableSlots: AvailabilitySlot[];
  preSelectedDoctor?: Doctor | null;
  preSelectedSlot?: AvailabilitySlot | null;
  preSelectedDate?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  doctors,
  availableSlots,
  preSelectedDoctor,
  preSelectedSlot,
  preSelectedDate,
}) => {
  const [patientSearch, setPatientSearch] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    gender: "Male" | "Female" | "Other";
    age: number;
    phone: string;
  } | null>(null);

  const [queueType, setQueueType] = useState<QueueType>("SCHEDULED_APPOINTMENT");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    preSelectedDoctor?.id || doctors[0]?.id || ""
  );
  const [date, setDate] = useState<string>(
    preSelectedDate || new Date().toISOString().split("T")[0] || ""
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    preSelectedSlot?.id || ""
  );
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("CONSULTATION");
  const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "PRIORITY">("ROUTINE");
  const [reasonForVisit, setReasonForVisit] = useState<string>("");
  const [clinicalNotes, setClinicalNotes] = useState<string>("");
  const [reminderPreference, setReminderPreference] = useState<ReminderPreference>("BOTH");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchPatientOptions().then(list => { if (active) setPatients(list); }).catch(() => { if (active) setErrorMsg('Unable to load the patient index.'); });
    setSelectedPatient(null);
    setPatientSearch('');
    setSelectedDoctorId(preSelectedDoctor?.id || doctors[0]?.id || '');
    setDate(preSelectedDate || new Date().toISOString().slice(0, 10));
    setSelectedSlotId(preSelectedSlot?.id || '');
    return () => { active = false; };
  }, [isOpen, preSelectedDoctor, preSelectedSlot, preSelectedDate, doctors]);

  if (!isOpen) return null;

  // Search filtered patients
  const searchResults = patientSearch.trim() === ""
    ? []
    : patients.filter(
        (p) =>
          p.mrn.toLowerCase().includes(patientSearch.toLowerCase()) ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.phone.includes(patientSearch)
      );

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Slots for the selected doctor and date
  const doctorDateSlots = availableSlots.filter(
    (s) =>
      s.doctorId === selectedDoctorId &&
      s.date === date && s.status === "AVAILABLE"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPatient) {
      setErrorMsg("Please select a registered patient from Medical Records.");
      return;
    }

    if (!currentDoctor) {
      setErrorMsg("Please select a consulting doctor.");
      return;
    }

    if (!date) {
      setErrorMsg("Please select an appointment date.");
      return;
    }

    if (!reasonForVisit.trim()) {
      setErrorMsg("Please enter the reason for visit / primary clinical indication.");
      return;
    }

    let startTime = "09:00";
    let endTime = "09:30";
    let slotId = selectedSlotId || "slot-manual";

    if (queueType === "GOPD_WALK_IN") {
      slotId = "slot-walkin";
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMins = String(now.getMinutes()).padStart(2, "0");
      startTime = `${currentHours}:${currentMins}`;
      endTime = `${currentHours}:30`;
    } else {
      const chosenSlot = doctorDateSlots.find((s) => s.id === selectedSlotId);
      if (chosenSlot) {
        startTime = chosenSlot.startTime;
        endTime = chosenSlot.endTime;
      } else if (doctorDateSlots.length > 0 && doctorDateSlots[0]) {
        startTime = doctorDateSlots[0].startTime;
        endTime = doctorDateSlots[0].endTime;
        slotId = doctorDateSlots[0].id;
      } else {
        setErrorMsg('No available slot for this doctor and date. Please choose another date.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        patientId: selectedPatient.id,
        patientMrn: selectedPatient.mrn,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientPhone: selectedPatient.phone,
        patientGender: selectedPatient.gender,
        patientAge: selectedPatient.age,
        doctorId: currentDoctor.id,
        doctorName: currentDoctor.name,
        specialty: currentDoctor.specialty,
        department: currentDoctor.department,
        slotId,
        date,
        startTime,
        endTime,
        type: appointmentType,
        priority,
        reasonForVisit,
        reminderPreference,
        notes: clinicalNotes,
        queueType,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to book appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Book Clinic Appointment</h2>
              <p className="text-xs text-blue-200">
                FR-AP-02: Linked to Medical Records & Availability Roster
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* FR-AP-05: Queue Type Selector (Scheduled vs GOPD Walk-in) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Queue Classification (FR-AP-05)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                  queueType === "SCHEDULED_APPOINTMENT"
                    ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="queueType"
                  checked={queueType === "SCHEDULED_APPOINTMENT"}
                  onChange={() => setQueueType("SCHEDULED_APPOINTMENT")}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Scheduled Specialist Appointment</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pre-booked timed slot for Consultant or Specialty Clinic.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                  queueType === "GOPD_WALK_IN"
                    ? "bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="queueType"
                  checked={queueType === "GOPD_WALK_IN"}
                  onChange={() => setQueueType("GOPD_WALK_IN")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-slate-900">GOPD Walk-in Arrival</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Same-day General Outpatient triage queue; assigned queue token.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Patient Selection (Linked to Medical Records) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Patient Selection (Master Patient Index)
              </span>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-blue-600 text-xs hover:underline normal-case font-normal"
                >
                  Change Patient
                </button>
              )}
            </label>

            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by MRN (e.g. MRN-2026-0001), patient name, or phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white shadow-md">
                    {searchResults.map((pat) => (
                      <div
                        key={pat.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPatient(pat); setPatientSearch(''); } }}
                        onClick={() => {
                          setSelectedPatient(pat);
                          setPatientSearch("");
                        }}
                        className="p-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {pat.firstName} {pat.lastName}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {pat.mrn} • {pat.gender}, {pat.age} yrs • {pat.phone}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-[11px]">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {patientSearch.trim() === "" && (
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quick Select: </span>
                    {patients.slice(0, 3).map((pat) => (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => setSelectedPatient(pat)}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        {pat.firstName} ({pat.mrn})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {selectedPatient.firstName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 text-sm">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </div>
                    <div className="text-emerald-700 text-xs">
                      {selectedPatient.mrn} • {selectedPatient.gender}, {selectedPatient.age} yrs • {selectedPatient.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Linked</span>
                </div>
              </div>
            )}
          </div>

          {/* Doctor & Specialty Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Consultant / Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Consulting Room / Location
              </label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                {currentDoctor?.roomNumber || "Clinic Suite"} ({currentDoctor?.department})
              </div>
            </div>
          </div>

          {/* Date & Time Slot (Only relevant for Scheduled Appointments) */}
          {queueType === "SCHEDULED_APPOINTMENT" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Available Time Slot
                </label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {doctorDateSlots.length === 0 ? (
                    <option value="">No open slots on selected date</option>
                  ) : (
                    doctorDateSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.startTime} - {s.endTime} ({s.clinicRoom})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                GOPD Walk-in arrival will be checked in immediately for today at current time stamp.
              </span>
            </div>
          )}

          {/* Appointment Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Clinic Visit Type
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="CONSULTATION">Standard Consultation</option>
                <option value="FOLLOW_UP">Follow-Up Review</option>
                <option value="SPECIALIST_CLINIC">Specialist Clinic</option>
                <option value="PRE_OP_REVIEW">Pre-Operative Review</option>
                <option value="POST_OP_REVIEW">Post-Operative Review</option>
                <option value="DIAGNOSTIC_REVIEW">Diagnostic / Lab Result Review</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Clinical Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "ROUTINE" | "URGENT" | "PRIORITY")}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ROUTINE">Routine Clinic Visit</option>
                <option value="PRIORITY">Priority / Fast-Track</option>
                <option value="URGENT">Urgent Medical Review</option>
              </select>
            </div>
          </div>

          {/* Clinical Reason for Visit */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Reason for Visit / Presenting Complaints *
            </label>
            <input
              type="text"
              placeholder="e.g. Hypertension management check, severe lower quadrant discomfort..."
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Reminder Channel Selection (FR-AP-04) */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                Automated Patient Reminders (FR-AP-04)
              </label>
              <span className="text-[11px] text-slate-500">24-hour dispatch trigger</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {(["BOTH", "SMS", "EMAIL", "NONE"] as ReminderPreference[]).map((pref) => (
                <label key={pref} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="reminderPreference"
                    value={pref}
                    checked={reminderPreference === pref}
                    onChange={() => setReminderPreference(pref)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {pref === "BOTH" ? "SMS + Email" : pref === "NONE" ? "Do Not Send" : pref}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Additional Triage / Reception Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any special handling instructions, wheelchair required, etc."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Confirming...</span>
              ) : queueType === "GOPD_WALK_IN" ? (
                <span>Register & Queue Walk-in</span>
              ) : (
                <span>Confirm Appointment Booking</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
