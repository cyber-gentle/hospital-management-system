import { MOCK_QUEUE } from "./mockData";
import { GopdPatient, ConsultationRecord, Vitals } from "./types";

const STORAGE_KEY = "hims_gopd_queue";
const API_BASE = "/api/v1/gopd";

const getLocalQueue = (): GopdPatient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_QUEUE));
      return MOCK_QUEUE;
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_QUEUE;
  }
};

const setLocalQueue = (queue: GopdPatient[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to save GOPD queue to localStorage", err);
  }
};

export const gopdApi = {
  getQueue: async (): Promise<GopdPatient[]> => {
    try {
      const res = await fetch(`${API_BASE}/queue`);
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      return getLocalQueue();
    }
  },

  recordTriageVitals: async (
    patientId: string,
    vitals: Vitals,
    priority: "EMERGENCY" | "URGENT" | "STANDARD" | "NON_URGENT"
  ): Promise<GopdPatient> => {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitals, triagePriority: priority }),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const queue = getLocalQueue();
      const updated = queue.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            vitals: {
              ...vitals,
              recordedAt: new Date().toISOString(),
              recordedBy: vitals.recordedBy || "Nurse B. Taiwo, RN"
            },
            triagePriority: priority,
            status: "WAITING_DOCTOR" as const
          };
        }
        return p;
      });
      setLocalQueue(updated);
      const found = updated.find(p => p.id === patientId);
      if (!found) throw new Error("Patient not found");
      return found;
    }
  },

  startConsultation: async (patientId: string): Promise<GopdPatient> => {
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}/start-consultation`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const queue = getLocalQueue();
      const updated = queue.map(p => {
        if (p.id === patientId && p.status === "WAITING_DOCTOR") {
          return { ...p, status: "IN_CONSULTATION" as const };
        }
        return p;
      });
      setLocalQueue(updated);
      const found = updated.find(p => p.id === patientId);
      if (!found) throw new Error("Patient not found");
      return found;
    }
  },

  saveConsultation: async (
    patientId: string,
    record: Partial<ConsultationRecord>
  ): Promise<ConsultationRecord> => {
    try {
      const res = await fetch(`${API_BASE}/consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, ...record }),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const fullRecord: ConsultationRecord = {
        id: "cons_" + Date.now(),
        gopdPatientId: patientId,
        doctorId: "doc_01",
        doctorName: "Dr. K. Bello, FWACS",
        chiefComplaint: record.chiefComplaint || "",
        historyOfPresentingIllness: record.historyOfPresentingIllness || "",
        physicalExamination: record.physicalExamination || "",
        diagnoses: record.diagnoses || [],
        prescriptions: record.prescriptions || [],
        investigations: record.investigations || [],
        notes: record.notes || "",
        disposition: record.disposition || "DISCHARGED",
        createdAt: new Date().toISOString()
      };

      const queue = getLocalQueue();
      const updated = queue.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            status: "COMPLETED" as const,
            consultation: fullRecord
          };
        }
        return p;
      });
      setLocalQueue(updated);
      return fullRecord;
    }
  },

  resetQueue: async (): Promise<GopdPatient[]> => {
    localStorage.removeItem(STORAGE_KEY);
    return getLocalQueue();
  }
};
