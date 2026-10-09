import { rethrowBackendRejection } from "../../lib/fallback";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import { EmergencyPatient, EmergencyBay, StabilizationNote, CrashMedicationEntry } from './types';
import { INITIAL_EMERGENCY_PATIENTS, INITIAL_EMERGENCY_BAYS, INITIAL_STABILIZATION_NOTES } from './mockData';

const PATIENTS_STORAGE_KEY = 'hims_emergency_patients_v1';
const BAYS_STORAGE_KEY = 'hims_emergency_bays_v1';
const NOTES_STORAGE_KEY = 'hims_emergency_notes_v1';

// Seed initial mock data if not already present in localStorage
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  try { requireDemoMode(); } catch { return; }
  if (!localStorage.getItem(PATIENTS_STORAGE_KEY)) {
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(INITIAL_EMERGENCY_PATIENTS));
  }
  if (!localStorage.getItem(BAYS_STORAGE_KEY)) {
    localStorage.setItem(BAYS_STORAGE_KEY, JSON.stringify(INITIAL_EMERGENCY_BAYS));
  }
  if (!localStorage.getItem(NOTES_STORAGE_KEY)) {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(INITIAL_STABILIZATION_NOTES));
  }
};

initializeStorage();

export const emergencyApi = {
  // Fetch active A&E patients
  async getEmergencyPatients(): Promise<EmergencyPatient[]> {
    requireDemoMode();
    try {
      const res = await strictModuleFetch('/api/v1/emergency/patients');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Backend unavailable or 404, fallback to localStorage
    }
    const data = localStorage.getItem(PATIENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_EMERGENCY_PATIENTS;
  },

  // Rapid Triage Intake (FR-AE-01)
  async createEmergencyTriage(payload: Omit<EmergencyPatient, 'id' | 'updatedAt' | 'zeroDepositWaived' | 'medicationsAdministered'>): Promise<EmergencyPatient> {
    requireDemoMode();
    const newPatient: EmergencyPatient = {
      ...payload,
      id: `EP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      zeroDepositWaived: true, // Hard rule: Emergency life-saving intake is unconditionally waived from admission deposits
      medicationsAdministered: [],
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await strictModuleFetch('/api/v1/emergency/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback to localStorage
    }

    const currentPatients = await this.getEmergencyPatients();
    const updated = [newPatient, ...currentPatients];
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(updated));

    // If a bay and bed were specified, allocate the bed
    if (newPatient.assignedBayId && newPatient.assignedBedNumber) {
      await this.assignPatientBed(newPatient.id, newPatient.assignedBayId, newPatient.assignedBedNumber);
    }

    return newPatient;
  },

  // Fetch Bay & Bed Occupancy Board (FR-AE-02)
  async getEmergencyBays(): Promise<EmergencyBay[]> {
    requireDemoMode();
    try {
      const res = await strictModuleFetch('/api/v1/emergency/bays');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }
    const data = localStorage.getItem(BAYS_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_EMERGENCY_BAYS;
  },

  // Assign or transfer patient to a specific Bay bed (FR-AE-02)
  async assignPatientBed(patientId: string, bayId: string, bedNumber: string): Promise<EmergencyBay[]> {
    requireDemoMode();
    const bays = await this.getEmergencyBays();
    const patients = await this.getEmergencyPatients();
    const patient = patients.find(p => p.id === patientId);

    // Free any old bed patient had
    const updatedBays = bays.map(bay => {
      const updatedBeds = bay.beds.map(bed => {
        if (bed.currentPatientId === patientId) {
          return {
            ...bed,
            status: 'AVAILABLE' as const,
            currentPatientId: undefined,
            currentPatientName: undefined,
            triageCategory: undefined
          };
        }
        return bed;
      });
      return { ...bay, beds: updatedBeds };
    });

    // Allocate new bed
    const targetBay = updatedBays.find(b => b.id === bayId);
    if (targetBay) {
      targetBay.beds = targetBay.beds.map(bed => {
        if (bed.bedNumber === bedNumber) {
          return {
            ...bed,
            status: 'OCCUPIED' as const,
            currentPatientId: patientId,
            currentPatientName: patient?.patientName || 'Emergency Patient',
            triageCategory: patient?.triageCategory || 'YELLOW'
          };
        }
        return bed;
      });
    }

    localStorage.setItem(BAYS_STORAGE_KEY, JSON.stringify(updatedBays));

    // Also update patient record
    if (patient && targetBay) {
      const updatedPatients = patients.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            assignedBayId: bayId,
            assignedBayName: targetBay.name,
            assignedBedNumber: bedNumber,
            status: (targetBay.bayType === 'RESUSCITATION' ? 'IN_RESUS' : 'OBSERVATION') as EmergencyPatient['status'],
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(updatedPatients));
    }

    return updatedBays;
  },

  // Release bed when patient is transferred or discharged
  async releasePatientBed(patientId: string): Promise<EmergencyBay[]> {
    requireDemoMode();
    const bays = await this.getEmergencyBays();
    const updatedBays = bays.map(bay => {
      const updatedBeds = bay.beds.map(bed => {
        if (bed.currentPatientId === patientId) {
          return {
            ...bed,
            status: 'CLEANING' as const, // Automatically flag for infection control cleaning!
            currentPatientId: undefined,
            currentPatientName: undefined,
            triageCategory: undefined
          };
        }
        return bed;
      });
      return { ...bay, beds: updatedBeds };
    });

    localStorage.setItem(BAYS_STORAGE_KEY, JSON.stringify(updatedBays));
    return updatedBays;
  },

  // Record Crash Medication in real time (FR-AE-03)
  async recordCrashMedication(patientId: string, med: Omit<CrashMedicationEntry, 'id'>): Promise<EmergencyPatient> {
    requireDemoMode();
    const patients = await this.getEmergencyPatients();
    const newMed: CrashMedicationEntry = {
      ...med,
      id: `med-${Date.now()}`
    };

    let updatedPatient: EmergencyPatient | undefined;

    const updatedPatients = patients.map(p => {
      if (p.id === patientId) {
        updatedPatient = {
          ...p,
          medicationsAdministered: [newMed, ...p.medicationsAdministered],
          updatedAt: new Date().toISOString()
        };
        return updatedPatient;
      }
      return p;
    });

    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(updatedPatients));
    return updatedPatient!;
  },

  // Fetch stabilization and resuscitation notes (FR-AE-03)
  async getStabilizationNotes(patientId?: string): Promise<StabilizationNote[]> {
    requireDemoMode();
    try {
      const res = await strictModuleFetch(`/api/v1/emergency/notes${patientId ? `?patientId=${patientId}` : ''}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(NOTES_STORAGE_KEY);
    const notes: StabilizationNote[] = data ? JSON.parse(data) : INITIAL_STABILIZATION_NOTES;
    if (patientId) {
      return notes.filter(n => n.emergencyPatientId === patientId);
    }
    return notes;
  },

  // Save Stabilization Note & Final Disposition Transfer (FR-AE-03)
  async addStabilizationNote(payload: Omit<StabilizationNote, 'id' | 'recordedAt'>): Promise<StabilizationNote> {
    requireDemoMode();
    const newNote: StabilizationNote = {
      ...payload,
      id: `NOTE-AE-${Math.floor(100 + Math.random() * 900)}`,
      recordedAt: new Date().toISOString()
    };

    try {
      const res = await strictModuleFetch('/api/v1/emergency/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const currentNotes = await this.getStabilizationNotes();
    const updatedNotes = [newNote, ...currentNotes];
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));

    // Update patient status and disposition
    const patients = await this.getEmergencyPatients();
    let nextStatus: EmergencyPatient['status'] = 'OBSERVATION';
    if (newNote.disposition === 'EMERGENCY_OR') nextStatus = 'TRANSFERRED_OR';
    else if (newNote.disposition === 'ICU_ADMISSION') nextStatus = 'TRANSFERRED_ICU';
    else if (newNote.disposition === 'WARD_ADMISSION') nextStatus = 'TRANSFERRED_WARD';
    else if (newNote.disposition === 'DISCHARGE_HOME') nextStatus = 'DISCHARGED';
    else if (newNote.disposition === 'MORTUARY_TRANSFER') nextStatus = 'DECEASED';

    const updatedPatients = patients.map(p => {
      if (p.id === newNote.emergencyPatientId) {
        return {
          ...p,
          status: nextStatus,
          primarySurvey: newNote.primarySurvey,
          dispositionNotes: `${newNote.dispositionDestination}: ${newNote.clinicalHandoverSummary}`,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(updatedPatients));

    // Release bed if transferred or discharged
    if (['TRANSFERRED_OR', 'TRANSFERRED_ICU', 'TRANSFERRED_WARD', 'DISCHARGED', 'DECEASED'].includes(nextStatus)) {
      await this.releasePatientBed(newNote.emergencyPatientId);
    }

    return newNote;
  }
};
