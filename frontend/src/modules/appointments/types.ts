export type AppointmentType =
  | "CONSULTATION"
  | "FOLLOW_UP"
  | "SPECIALIST_CLINIC"
  | "PRE_OP_REVIEW"
  | "POST_OP_REVIEW"
  | "DIAGNOSTIC_REVIEW";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "NO_SHOW";

export type QueueType = "SCHEDULED_APPOINTMENT" | "GOPD_WALK_IN";

export type ReminderPreference = "SMS" | "EMAIL" | "BOTH" | "NONE";

export type ReminderStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED" | "ON_LEAVE";

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  department: string;
  roomNumber: string;
  phone: string;
  email: string;
  maxPatientsPerSlot: number;
  availableDays: string[]; // e.g. ["Monday", "Wednesday", "Friday"]
}

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: SlotStatus;
  maxCapacity: number;
  currentBookings: number;
  clinicRoom: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string; // e.g. "APT-2026-0042"
  patientId: string;
  patientMrn: string;
  patientName: string;
  patientPhone: string;
  patientGender: "Male" | "Female" | "Other";
  patientAge: number;
  doctorId: string;
  doctorName: string;
  specialty: string;
  department: string;
  slotId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: AppointmentType;
  status: AppointmentStatus;
  queueType: QueueType; // FR-AP-05: Distinguish from GOPD walk-in queue
  priority: "ROUTINE" | "URGENT" | "PRIORITY";
  reasonForVisit: string;
  clinicalNotes?: string;
  reminderPreference: ReminderPreference;
  reminderStatus: ReminderStatus;
  reminderSentAt?: string;
  checkInTime?: string;
  rescheduledFromId?: string;
  rescheduleReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookAppointmentRequest {
  patientId: string;
  patientMrn: string;
  patientName: string;
  patientPhone: string;
  patientGender: "Male" | "Female" | "Other";
  patientAge: number;
  doctorId: string;
  doctorName: string;
  specialty: string;
  department: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  priority: "ROUTINE" | "URGENT" | "PRIORITY";
  reasonForVisit: string;
  reminderPreference: ReminderPreference;
  notes?: string;
  queueType?: QueueType;
}

export interface RescheduleRequest {
  appointmentId: string;
  newDate: string;
  newSlotId: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}

export interface CancelRequest {
  appointmentId: string;
  reason: string;
}

export interface AppointmentFilter {
  date?: string;
  doctorId?: string;
  department?: string;
  status?: AppointmentStatus | "ALL";
  queueType?: QueueType | "ALL";
  searchQuery?: string;
}
