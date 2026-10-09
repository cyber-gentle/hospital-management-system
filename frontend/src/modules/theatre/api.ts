import { rethrowBackendRejection } from "../../lib/fallback";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import { 
  SurgeryBooking, 
  PreOpChecklist, 
  IntraOpNotes, 
  PacuRecoveryLog, 
  SurgeryStatus 
} from "./types";
import { initialSurgeryBookings } from "./mockData";
import { DEMO_MODE } from "../../lib/demo";

const API_BASE = "/api/v1/theatre";
const STORAGE_KEY = "hims_theatre_bookings_v1";

function getStoredBookings(): SurgeryBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSurgeryBookings));
      return initialSurgeryBookings;
    }
    return JSON.parse(raw) as SurgeryBooking[];
  } catch (error) {
      rethrowBackendRejection(error);
    return initialSurgeryBookings;
  }
}

function saveBookings(bookings: SurgeryBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error("Failed to save surgery bookings to storage", err);
  }
}

export const theatreApi = {
  getBookings: async (): Promise<SurgeryBooking[]> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(res => setTimeout(res, 200));
      return getStoredBookings();
    }
    try {
      const res = await strictModuleFetch(`${API_BASE}/bookings`);
      if (!res.ok) throw new Error("Backend unavailable");
      return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      return getStoredBookings();
    }
  },

  createBooking: async (booking: Omit<SurgeryBooking, "id" | "bookingNumber" | "createdAt" | "updatedAt">): Promise<SurgeryBooking> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(res => setTimeout(res, 300));
      const bookings = getStoredBookings();
      const count = bookings.length + 1;
      const newBooking: SurgeryBooking = {
        ...booking,
        id: `SURG-${String(count).padStart(3, "0")}`,
        bookingNumber: `OR-2026-${String(80 + count).padStart(4, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      bookings.unshift(newBooking);
      saveBookings(bookings);
      return newBooking;
    }
    try {
      const res = await strictModuleFetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (!res.ok) throw new Error("Failed to create surgery booking");
      return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      const bookings = getStoredBookings();
      const count = bookings.length + 1;
      const newBooking: SurgeryBooking = {
        ...booking,
        id: `SURG-${String(count).padStart(3, "0")}`,
        bookingNumber: `OR-2026-${String(80 + count).padStart(4, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      bookings.unshift(newBooking);
      saveBookings(bookings);
      return newBooking;
    }
  },

  updatePreOpChecklist: async (bookingId: string, checklist: PreOpChecklist): Promise<SurgeryBooking> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(res => setTimeout(res, 300));
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.preOpChecklist = checklist;
      if (target.status === "SCHEDULED") {
        target.status = "PRE_OP";
      }
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
    try {
      const res = await strictModuleFetch(`${API_BASE}/bookings/${bookingId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checklist),
      });
      if (!res.ok) throw new Error("Failed to update pre-op checklist");
      return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.preOpChecklist = checklist;
      if (target.status === "SCHEDULED") {
        target.status = "PRE_OP";
      }
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
  },

  recordIntraOpNotes: async (bookingId: string, notes: IntraOpNotes): Promise<SurgeryBooking> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(res => setTimeout(res, 300));
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.intraOpNotes = notes;
      target.status = "PACU";
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
    try {
      const res = await strictModuleFetch(`${API_BASE}/bookings/${bookingId}/intraop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notes),
      });
      if (!res.ok) throw new Error("Failed to record intra-operative notes");
      return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.intraOpNotes = notes;
      target.status = "PACU";
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
  },

  updatePacuLog: async (bookingId: string, pacuLog: PacuRecoveryLog): Promise<SurgeryBooking> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(res => setTimeout(res, 300));
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.pacuLog = pacuLog;
      if (pacuLog.fitForWardTransfer && pacuLog.transferTime) {
        target.status = "COMPLETED";
      }
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
    try {
      const res = await strictModuleFetch(`${API_BASE}/bookings/${bookingId}/pacu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pacuLog),
      });
      if (!res.ok) throw new Error("Failed to update PACU log");
      return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.pacuLog = pacuLog;
      if (pacuLog.fitForWardTransfer && pacuLog.transferTime) {
        target.status = "COMPLETED";
      }
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
  },

  updateStatus: async (bookingId: string, status: SurgeryStatus): Promise<SurgeryBooking> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(res => setTimeout(res, 200));
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.status = status;
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
    try {
      const res = await strictModuleFetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      const bookings = getStoredBookings();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error("Booking not found");
      const target = bookings[idx];
      if (!target) throw new Error("Booking not found");

      target.status = status;
      target.updatedAt = new Date().toISOString();
      saveBookings(bookings);
      return target;
    }
  },
};
