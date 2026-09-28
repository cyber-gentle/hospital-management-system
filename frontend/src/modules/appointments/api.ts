import {
  Appointment,
  AppointmentFilter,
  AvailabilitySlot,
  BookAppointmentRequest,
  CancelRequest,
  Doctor,
  RescheduleRequest,
} from "./types";
import { MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_SLOTS } from "./mockData";

const STORAGE_KEY_APPOINTMENTS = "hims_appointments_list_v1";
const STORAGE_KEY_SLOTS = "hims_appointment_slots_v1";
const STORAGE_KEY_DOCTORS = "hims_appointment_doctors_v1";

function getStoredDoctors(): Doctor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCTORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(MOCK_DOCTORS));
      return MOCK_DOCTORS;
    }
    return JSON.parse(raw) as Doctor[];
  } catch {
    return MOCK_DOCTORS;
  }
}

function getStoredSlots(): AvailabilitySlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(MOCK_SLOTS));
      return MOCK_SLOTS;
    }
    return JSON.parse(raw) as AvailabilitySlot[];
  } catch {
    return MOCK_SLOTS;
  }
}

function setStoredSlots(slots: AvailabilitySlot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(slots));
  } catch (e) {
    console.error("Failed to save appointment slots", e);
  }
}

function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(MOCK_APPOINTMENTS));
      return MOCK_APPOINTMENTS;
    }
    return JSON.parse(raw) as Appointment[];
  } catch {
    return MOCK_APPOINTMENTS;
  }
}

function setStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  } catch (e) {
    console.error("Failed to save appointments", e);
  }
}

export const appointmentsApi = {
  // FR-AP-01: Doctor Availability & Roster
  getDoctors: async (): Promise<Doctor[]> => {
    return getStoredDoctors();
  },

  getAvailability: async (doctorId?: string, date?: string): Promise<AvailabilitySlot[]> => {
    // Attempt real Go core call if available
    try {
      const params = new URLSearchParams();
      if (doctorId) params.set("doctorId", doctorId);
      if (date) params.set("date", date);
      const res = await fetch(`/api/v1/appointments/availability?${params.toString()}`);
      if (res.ok) {
        return (await res.json()) as AvailabilitySlot[];
      }
    } catch {
      // Fallback to local storage
    }

    let slots = getStoredSlots();
    if (doctorId) {
      slots = slots.filter((s) => s.doctorId === doctorId);
    }
    if (date) {
      slots = slots.filter((s) => s.date === date);
    }
    return slots;
  },

  // FR-AP-02 & FR-AP-05: List appointments with filtering (including GOPD queue separation)
  getAppointments: async (filter?: AppointmentFilter): Promise<Appointment[]> => {
    try {
      const res = await fetch("/api/v1/appointments");
      if (res.ok) {
        return (await res.json()) as Appointment[];
      }
    } catch {
      // fallback
    }

    let list = getStoredAppointments();

    if (filter) {
      if (filter.queueType && filter.queueType !== "ALL") {
        list = list.filter((a) => a.queueType === filter.queueType);
      }
      if (filter.status && filter.status !== "ALL") {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter.doctorId && filter.doctorId !== "ALL") {
        list = list.filter((a) => a.doctorId === filter.doctorId);
      }
      if (filter.department && filter.department !== "ALL") {
        list = list.filter((a) => a.department === filter.department);
      }
      if (filter.date) {
        list = list.filter((a) => a.date === filter.date);
      }
      if (filter.searchQuery && filter.searchQuery.trim() !== "") {
        const query = filter.searchQuery.toLowerCase();
        list = list.filter(
          (a) =>
            a.patientName.toLowerCase().includes(query) ||
            a.patientMrn.toLowerCase().includes(query) ||
            a.appointmentNumber.toLowerCase().includes(query) ||
            a.doctorName.toLowerCase().includes(query) ||
            a.specialty.toLowerCase().includes(query) ||
            a.reasonForVisit.toLowerCase().includes(query)
        );
      }
    }

    return list.sort((a, b) => {
      // Sort by date then start time
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  },

  getAppointmentById: async (id: string): Promise<Appointment | null> => {
    const list = getStoredAppointments();
    return list.find((a) => a.id === id) || null;
  },

  // FR-AP-02: Book Appointment (linked to Medical Records)
  bookAppointment: async (req: BookAppointmentRequest): Promise<Appointment> => {
    try {
      const res = await fetch("/api/v1/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return (await res.json()) as Appointment;
      }
    } catch {
      // fallback
    }

    const appointments = getStoredAppointments();
    const slots = getStoredSlots();

    // Mark slot as booked if it's a scheduled appointment
    if (req.slotId && req.slotId !== "slot-walkin") {
      const slotIndex = slots.findIndex((s) => s.id === req.slotId);
      if (slotIndex >= 0) {
        const targetSlot = slots[slotIndex];
        if (targetSlot) {
          slots[slotIndex] = {
            ...targetSlot,
            status: "BOOKED",
            currentBookings: targetSlot.currentBookings + 1,
          };
          setStoredSlots(slots);
        }
      }
    }

    const now = new Date().toISOString();
    const serial = String(appointments.length + 85).padStart(4, "0");
    const prefix = req.queueType === "GOPD_WALK_IN" ? "GOPD-2026-W" : "APT-2026-";

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: `${prefix}${serial}`,
      patientId: req.patientId,
      patientMrn: req.patientMrn,
      patientName: req.patientName,
      patientPhone: req.patientPhone,
      patientGender: req.patientGender,
      patientAge: req.patientAge,
      doctorId: req.doctorId,
      doctorName: req.doctorName,
      specialty: req.specialty,
      department: req.department,
      slotId: req.slotId,
      date: req.date,
      startTime: req.startTime,
      endTime: req.endTime,
      type: req.type,
      status: req.queueType === "GOPD_WALK_IN" ? "CHECKED_IN" : "SCHEDULED",
      queueType: req.queueType || "SCHEDULED_APPOINTMENT",
      priority: req.priority,
      reasonForVisit: req.reasonForVisit,
      clinicalNotes: req.notes,
      reminderPreference: req.reminderPreference,
      reminderStatus: req.reminderPreference === "NONE" ? "PENDING" : "SENT",
      reminderSentAt: req.reminderPreference === "NONE" ? undefined : now,
      checkInTime: req.queueType === "GOPD_WALK_IN" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    appointments.unshift(newAppointment);
    setStoredAppointments(appointments);
    return newAppointment;
  },

  // FR-AP-03: Reschedule Appointment
  rescheduleAppointment: async (req: RescheduleRequest): Promise<Appointment> => {
    try {
      const res = await fetch(`/api/v1/appointments/${req.appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE",
          newDate: req.newDate,
          newSlotId: req.newSlotId,
          newStartTime: req.newStartTime,
          newEndTime: req.newEndTime,
          reason: req.reason,
        }),
      });
      if (res.ok) {
        return (await res.json()) as Appointment;
      }
    } catch {
      // fallback
    }

    const appointments = getStoredAppointments();
    const aptIndex = appointments.findIndex((a) => a.id === req.appointmentId);
    if (aptIndex === -1) {
      throw new Error("Appointment not found");
    }

    const currentApt = appointments[aptIndex];
    if (!currentApt) {
      throw new Error("Appointment not found");
    }

    const slots = getStoredSlots();

    // Release old slot if booked
    const oldSlotIndex = slots.findIndex((s) => s.id === currentApt.slotId);
    if (oldSlotIndex >= 0) {
      const oldSlot = slots[oldSlotIndex];
      if (oldSlot) {
        slots[oldSlotIndex] = {
          ...oldSlot,
          status: "AVAILABLE",
          currentBookings: Math.max(0, oldSlot.currentBookings - 1),
        };
      }
    }

    // Book new slot
    const newSlotIndex = slots.findIndex((s) => s.id === req.newSlotId);
    if (newSlotIndex >= 0) {
      const newSlot = slots[newSlotIndex];
      if (newSlot) {
        slots[newSlotIndex] = {
          ...newSlot,
          status: "BOOKED",
          currentBookings: newSlot.currentBookings + 1,
        };
      }
    }
    setStoredSlots(slots);

    const now = new Date().toISOString();
    const updatedAppointment: Appointment = {
      ...currentApt,
      slotId: req.newSlotId,
      date: req.newDate,
      startTime: req.newStartTime,
      endTime: req.newEndTime,
      status: "RESCHEDULED",
      rescheduleReason: req.reason,
      rescheduledFromId: currentApt.id,
      reminderStatus: currentApt.reminderPreference === "NONE" ? "PENDING" : "SENT",
      reminderSentAt: now,
      updatedAt: now,
    };

    appointments[aptIndex] = updatedAppointment;
    setStoredAppointments(appointments);
    return updatedAppointment;
  },

  // FR-AP-03: Cancel Appointment (mandatory reason)
  cancelAppointment: async (req: CancelRequest): Promise<Appointment> => {
    try {
      const res = await fetch(`/api/v1/appointments/${req.appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          reason: req.reason,
        }),
      });
      if (res.ok) {
        return (await res.json()) as Appointment;
      }
    } catch {
      // fallback
    }

    const appointments = getStoredAppointments();
    const aptIndex = appointments.findIndex((a) => a.id === req.appointmentId);
    if (aptIndex === -1) {
      throw new Error("Appointment not found");
    }

    const currentApt = appointments[aptIndex];
    if (!currentApt) {
      throw new Error("Appointment not found");
    }

    // Release slot
    const slots = getStoredSlots();
    const slotIndex = slots.findIndex((s) => s.id === currentApt.slotId);
    if (slotIndex >= 0) {
      const slot = slots[slotIndex];
      if (slot) {
        slots[slotIndex] = {
          ...slot,
          status: "AVAILABLE",
          currentBookings: Math.max(0, slot.currentBookings - 1),
        };
        setStoredSlots(slots);
      }
    }

    const now = new Date().toISOString();
    const cancelledAppointment: Appointment = {
      ...currentApt,
      status: "CANCELLED",
      cancellationReason: req.reason,
      cancelledAt: now,
      cancelledBy: "Consultant Desk",
      updatedAt: now,
    };

    appointments[aptIndex] = cancelledAppointment;
    setStoredAppointments(appointments);
    return cancelledAppointment;
  },

  // Check-In Appointment (arrival at clinic)
  checkInAppointment: async (appointmentId: string): Promise<Appointment> => {
    const appointments = getStoredAppointments();
    const aptIndex = appointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) throw new Error("Appointment not found");

    const currentApt = appointments[aptIndex];
    if (!currentApt) throw new Error("Appointment not found");

    const now = new Date().toISOString();
    const checkedIn: Appointment = {
      ...currentApt,
      status: "CHECKED_IN",
      checkInTime: now,
      updatedAt: now,
    };

    appointments[aptIndex] = checkedIn;
    setStoredAppointments(appointments);
    return checkedIn;
  },

  // FR-AP-04: Trigger/resend reminder
  triggerReminder: async (appointmentId: string): Promise<Appointment> => {
    const appointments = getStoredAppointments();
    const aptIndex = appointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) throw new Error("Appointment not found");

    const currentApt = appointments[aptIndex];
    if (!currentApt) throw new Error("Appointment not found");

    const now = new Date().toISOString();
    const updated: Appointment = {
      ...currentApt,
      reminderStatus: "DELIVERED",
      reminderSentAt: now,
      updatedAt: now,
    };

    appointments[aptIndex] = updated;
    setStoredAppointments(appointments);
    return updated;
  },

  resetToMockData: (): void => {
    localStorage.removeItem(STORAGE_KEY_APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEY_SLOTS);
    localStorage.removeItem(STORAGE_KEY_DOCTORS);
  },
};
