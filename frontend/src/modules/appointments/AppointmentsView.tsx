import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Users,
  RotateCcw,
  Ban,
  Layers,
  RefreshCw,
  Bell,
  Stethoscope,
} from "lucide-react";
import {
  Appointment,
  AppointmentFilter,
  AppointmentStatus,
  AvailabilitySlot,
  BookAppointmentRequest,
  Doctor,
  QueueType,
} from "./types";
import { appointmentsApi } from "./api";
import { DoctorAvailabilityCalendar } from "./components/DoctorAvailabilityCalendar";
import { BookAppointmentModal } from "./components/BookAppointmentModal";
import { RescheduleCancelModal } from "./components/RescheduleCancelModal";
import { AppointmentDetailDrawer } from "./components/AppointmentDetailDrawer";

export const AppointmentsView: React.FC = () => {
  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"SCHEDULE" | "CALENDAR" | "QUEUE_COMPARISON">("SCHEDULE");

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] || "2026-09-28"
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [selectedQueueType, setSelectedQueueType] = useState<QueueType | "ALL">("ALL");

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [preSelectedDoctor, setPreSelectedDoctor] = useState<Doctor | null>(null);
  const [preSelectedSlot, setPreSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const [rescheduleCancelModal, setRescheduleCancelModal] = useState<{
    isOpen: boolean;
    mode: "RESCHEDULE" | "CANCEL";
    appointment: Appointment | null;
  }>({
    isOpen: false,
    mode: "RESCHEDULE",
    appointment: null,
  });

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docs, allSlots] = await Promise.all([
        appointmentsApi.getDoctors(),
        appointmentsApi.getAvailability(),
      ]);
      setDoctors(docs);
      setSlots(allSlots);

      const filter: AppointmentFilter = {
        date: selectedDate,
        doctorId: selectedDoctorId,
        status: selectedStatus,
        queueType: selectedQueueType,
        searchQuery,
      };

      const apts = await appointmentsApi.getAppointments(filter);
      setAppointments(apts);
    } catch (e) {
      console.error("Failed to load appointment data", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedDoctorId, selectedStatus, selectedQueueType, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Book
  const handleBookAppointment = async (req: BookAppointmentRequest) => {
    const created = await appointmentsApi.bookAppointment(req);
    showToast(`Appointment ${created.appointmentNumber} successfully booked.`);
    await loadData();
  };

  // Handle Reschedule
  const handleConfirmReschedule = async (
    appointmentId: string,
    newDate: string,
    newSlotId: string,
    newStartTime: string,
    newEndTime: string,
    reason: string
  ) => {
    const updated = await appointmentsApi.rescheduleAppointment({
      appointmentId,
      newDate,
      newSlotId,
      newStartTime,
      newEndTime,
      reason,
    });
    showToast(`Appointment ${updated.appointmentNumber} rescheduled to ${newDate} @ ${newStartTime}.`);
    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment(updated);
    }
    await loadData();
  };

  // Handle Cancel
  const handleConfirmCancel = async (appointmentId: string, reason: string) => {
    const cancelled = await appointmentsApi.cancelAppointment({
      appointmentId,
      reason,
    });
    showToast(`Appointment ${cancelled.appointmentNumber} cancelled.`);
    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment(cancelled);
    }
    await loadData();
  };

  // Handle Check In
  const handleCheckIn = async (appointmentId: string) => {
    const updated = await appointmentsApi.checkInAppointment(appointmentId);
    showToast(`Patient arrived. Marked Checked-In.`);
    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment(updated);
    }
    await loadData();
  };

  // Handle Reminder
  const handleTriggerReminder = async (appointmentId: string) => {
    const updated = await appointmentsApi.triggerReminder(appointmentId);
    showToast(`Automated SMS and Email reminder dispatched.`);
    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment(updated);
    }
    await loadData();
  };

  // Quick book from slot
  const handleBookFromSlot = (doctor: Doctor, slot: AvailabilitySlot) => {
    setPreSelectedDoctor(doctor);
    setPreSelectedSlot(slot);
    setIsBookModalOpen(true);
  };

  // Metrics
  const totalToday = appointments.length;
  const scheduledCount = appointments.filter((a) => a.queueType === "SCHEDULED_APPOINTMENT").length;
  const walkInCount = appointments.filter((a) => a.queueType === "GOPD_WALK_IN").length;
  const checkedInCount = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const availableSlotsCount = slots.filter((s) => s.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase">
              Build Group 1 • §2.5
            </span>
            <span className="text-xs text-slate-500 font-medium">FR-AP-01 to FR-AP-05</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            Appointment Scheduling & Clinics
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Consultant clinic bookings, doctor availability calendars, automated reminders, and explicit
            queue separation from GOPD walk-ins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              appointmentsApi.resetToMockData();
              loadData();
              showToast("Reset appointment data to demo baseline.");
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reset Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data
          </button>

          <button
            type="button"
            onClick={() => {
              setPreSelectedDoctor(null);
              setPreSelectedSlot(null);
              setIsBookModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            Book Appointment (FR-AP-02)
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Clinic Visits</span>
            <CalendarIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalToday}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Clinic date: {selectedDate}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Specialist Booked</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{scheduledCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Reserved time slots</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>GOPD Walk-in Queue</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{walkInCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">FR-AP-05 distinct queue</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Checked-In / Arrived</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{checkedInCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for consulting</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
            <span>Open Doctor Slots</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">{availableSlotsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all rosters</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("SCHEDULE")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "SCHEDULE"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Clinic Appointments List
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CALENDAR")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "CALENDAR"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Doctor Availability Grid (FR-AP-01)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("QUEUE_COMPARISON")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "QUEUE_COMPARISON"
                ? "border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            FR-AP-05: GOPD vs Booked Queue Separation
          </button>
        </div>
      </div>

      {/* Tab 1: SCHEDULE & APPOINTMENTS LIST */}
      {activeTab === "SCHEDULE" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, MRN, doctor, appointment #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Queue:</span>
                <select
                  value={selectedQueueType}
                  onChange={(e) => setSelectedQueueType(e.target.value as QueueType | "ALL")}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Queues</option>
                  <option value="SCHEDULED_APPOINTMENT">Booked Specialist</option>
                  <option value="GOPD_WALK_IN">GOPD Walk-in</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as AppointmentStatus | "ALL")}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CHECKED_IN">Checked-In</option>
                  <option value="IN_CONSULTATION">In Consultation</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span>Doctor:</span>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none max-w-[150px] truncate"
                >
                  <option value="ALL">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading appointments...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No appointments found</p>
                <p className="text-xs text-slate-400">
                  Try adjusting the date, doctor, or queue filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Ref / Queue Type</th>
                      <th className="py-3 px-4">Patient Demographics</th>
                      <th className="py-3 px-4">Consultant Doctor</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Visit Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reminder (FR-AP-04)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {appointments.map((apt) => {
                      const isWalkIn = apt.queueType === "GOPD_WALK_IN";
                      const isScheduled = apt.status === "SCHEDULED";
                      const isCheckedIn = apt.status === "CHECKED_IN";
                      const isCompleted = apt.status === "COMPLETED";
                      const isCancelled = apt.status === "CANCELLED";

                      return (
                        <tr
                          key={apt.id}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedAppointment(apt)}
                        >
                          {/* Ref & Queue Type (FR-AP-05) */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900">
                              {apt.appointmentNumber}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                isWalkIn
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                            >
                              <Layers className="w-2.5 h-2.5" />
                              {isWalkIn ? "GOPD Walk-in" : "Booked Specialist"}
                            </span>
                          </td>

                          {/* Patient */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{apt.patientName}</div>
                            <div className="text-[11px] text-slate-500">
                              {apt.patientMrn} • {apt.patientGender}, {apt.patientAge}y
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{apt.doctorName}</div>
                            <div className="text-[11px] text-blue-600 font-medium">
                              {apt.specialty}
                            </div>
                          </td>

                          {/* Date & Slot */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{apt.date}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {apt.startTime} - {apt.endTime}
                            </div>
                          </td>

                          {/* Visit Type */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700">
                              {apt.type.replace("_", " ")}
                            </span>
                            {apt.priority !== "ROUTINE" && (
                              <span
                                className={`block text-[10px] font-bold uppercase mt-0.5 ${
                                  apt.priority === "URGENT" ? "text-rose-600" : "text-indigo-600"
                                }`}
                              >
                                {apt.priority}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border inline-flex items-center gap-1 ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isCheckedIn
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : isCancelled
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {apt.status.replace("_", " ")}
                            </span>
                            {apt.checkInTime && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                Arr: {new Date(apt.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </td>

                          {/* Reminder (FR-AP-04) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Bell className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-slate-700">
                                {apt.reminderPreference}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-medium block mt-0.5 ${
                                apt.reminderStatus === "DELIVERED"
                                  ? "text-emerald-600"
                                  : apt.reminderStatus === "SENT"
                                  ? "text-blue-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {apt.reminderStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3 px-4 text-right space-x-1 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isScheduled && (
                              <button
                                type="button"
                                onClick={() => handleCheckIn(apt.id)}
                                className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
                                title="Check In"
                              >
                                Check-in
                              </button>
                            )}

                            {!isCancelled && !isCompleted && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRescheduleCancelModal({
                                      isOpen: true,
                                      mode: "RESCHEDULE",
                                      appointment: apt,
                                    })
                                  }
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                                  title="Reschedule (FR-AP-03)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRescheduleCancelModal({
                                      isOpen: true,
                                      mode: "CANCEL",
                                      appointment: apt,
                                    })
                                  }
                                  className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                  title="Cancel (FR-AP-03)"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedAppointment(apt)}
                              className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: DOCTOR AVAILABILITY CALENDAR (FR-AP-01) */}
      {activeTab === "CALENDAR" && (
        <DoctorAvailabilityCalendar
          doctors={doctors}
          slots={slots}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedDoctorId={selectedDoctorId}
          onDoctorChange={setSelectedDoctorId}
          onBookSlot={handleBookFromSlot}
        />
      )}

      {/* Tab 3: GOPD VS BOOKED QUEUE SEPARATION (FR-AP-05) */}
      {activeTab === "QUEUE_COMPARISON" && (
        <div className="space-y-6">
          {/* FR-AP-05 Architectural Explanation Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-amber-200 text-amber-600">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                FR-AP-05: Strict Architectural Separation of Queues
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold">
                  PRD Requirement
                </span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                The Hospital Management System strictly decouples the <strong>General Outpatient (GOPD) Walk-in Queue</strong>{" "}
                from <strong>Specialist / Consultant Timed Appointments</strong>. Walk-in arrivals are triaged by emergency priority
                and served on tokenized arrival order, whereas Consultant Clinics honor pre-reserved time slots and dedicated physician rosters.
              </p>
            </div>
          </div>

          {/* Side by Side Queue Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Booked Specialist Appointments */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Booked Specialist Clinic Roster ({scheduledCount})
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  Timed Slots
                </span>
              </div>

              <div className="space-y-3">
                {appointments
                  .filter((a) => a.queueType === "SCHEDULED_APPOINTMENT")
                  .map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{apt.patientName}</span>
                          <span className="text-slate-400 font-normal">({apt.patientMrn})</span>
                        </div>
                        <div className="text-slate-500 mt-0.5 flex items-center gap-2 text-[11px]">
                          <span className="text-blue-700 font-medium">{apt.doctorName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {apt.startTime} - {apt.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === "CHECKED_IN"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {apt.status}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                          {apt.appointmentNumber}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: GOPD Walk-in Queue */}
            <div className="bg-white rounded-2xl border border-amber-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    GOPD Walk-in Arrival Queue ({walkInCount})
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  Triage Tokens
                </span>
              </div>

              <div className="space-y-3">
                {appointments
                  .filter((a) => a.queueType === "GOPD_WALK_IN")
                  .map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="p-3 rounded-xl border border-amber-100 bg-amber-50/20 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{apt.patientName}</span>
                          <span className="text-slate-400 font-normal">({apt.patientMrn})</span>
                        </div>
                        <div className="text-slate-500 mt-0.5 flex items-center gap-2 text-[11px]">
                          <span className="text-amber-800 font-medium">GOPD Triage Desk</span>
                          <span>•</span>
                          <span>{apt.reasonForVisit}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          Token Queue
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                          {apt.appointmentNumber}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSubmit={handleBookAppointment}
        doctors={doctors}
        availableSlots={slots}
        preSelectedDoctor={preSelectedDoctor}
        preSelectedSlot={preSelectedSlot}
        preSelectedDate={selectedDate}
      />

      <RescheduleCancelModal
        isOpen={rescheduleCancelModal.isOpen}
        mode={rescheduleCancelModal.mode}
        appointment={rescheduleCancelModal.appointment}
        availableSlots={slots}
        onClose={() =>
          setRescheduleCancelModal({ isOpen: false, mode: "RESCHEDULE", appointment: null })
        }
        onConfirmReschedule={handleConfirmReschedule}
        onConfirmCancel={handleConfirmCancel}
      />

      <AppointmentDetailDrawer
        isOpen={selectedAppointment !== null}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCheckIn={handleCheckIn}
        onTriggerReminder={handleTriggerReminder}
        onOpenReschedule={(apt) =>
          setRescheduleCancelModal({ isOpen: true, mode: "RESCHEDULE", appointment: apt })
        }
        onOpenCancel={(apt) =>
          setRescheduleCancelModal({ isOpen: true, mode: "CANCEL", appointment: apt })
        }
      />
    </div>
  );
};
