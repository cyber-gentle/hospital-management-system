import {
  InpatientAdmission,
  Ward,
  VitalSign,
  NursingTask,
  NursingNote,
  CarePlan,
  ShiftHandover,
  DischargeDossier,
  TriageAcuity,
  TaskStatus
} from './types';
import {
  INITIAL_WARDS,
  INITIAL_ADMISSIONS,
  INITIAL_VITALS,
  INITIAL_TASKS,
  INITIAL_NOTES,
  INITIAL_CARE_PLANS,
  INITIAL_SHIFTS,
  INITIAL_DISCHARGES
} from './mockData';
import { billingApi } from '../billing/api';
import { requireDemoMode, AUTOMATIC_DISCHARGE_BILLING_ENABLED } from '../../lib/demo';

const STORAGE_KEYS = {
  WARDS: 'hims_nursing_wards_v1',
  ADMISSIONS: 'hims_nursing_admissions_v1',
  VITALS: 'hims_nursing_vitals_v1',
  TASKS: 'hims_nursing_tasks_v1',
  NOTES: 'hims_nursing_notes_v1',
  CARE_PLANS: 'hims_nursing_care_plans_v1',
  SHIFTS: 'hims_nursing_shifts_v1',
  DISCHARGES: 'hims_nursing_discharges_v1',
  OFFLINE_QUEUE: 'hims_nursing_offline_queue_v1',
};

// Safe storage utilities with hydration
function getStored<T>(key: string, fallback: T): T {
	requireDemoMode();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return structuredClone(fallback);
    }
    return JSON.parse(raw) as T;
  } catch {
    return structuredClone(fallback);
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to persist to localStorage [${key}]`, e);
	throw new Error('Unable to save this action. Browser storage is unavailable.', { cause: e });
  }
}

// NEWS2 Early Warning Score calculation (0 - 20)
export function calculateNEWS2(v: {
  respiratoryRate: number;
  oxygenSaturation: number;
  bloodPressureSystolic: number;
  pulseRate: number;
  temperature: number;
  consciousnessLevel: string;
}): number {
  let score = 0;

  // Respiratory Rate
  if (v.respiratoryRate <= 8 || v.respiratoryRate >= 25) score += 3;
  else if (v.respiratoryRate >= 21) score += 2;
  else if (v.respiratoryRate >= 9 && v.respiratoryRate <= 11) score += 1;

  // Oxygen Saturation
  if (v.oxygenSaturation <= 91) score += 3;
  else if (v.oxygenSaturation <= 93) score += 2;
  else if (v.oxygenSaturation <= 95) score += 1;

  // Systolic BP
  if (v.bloodPressureSystolic <= 90 || v.bloodPressureSystolic >= 220) score += 3;
  else if (v.bloodPressureSystolic <= 100) score += 2;
  else if (v.bloodPressureSystolic <= 110) score += 1;

  // Pulse
  if (v.pulseRate <= 40 || v.pulseRate >= 131) score += 3;
  else if (v.pulseRate >= 111) score += 2;
  else if (v.pulseRate <= 50 || (v.pulseRate >= 91 && v.pulseRate <= 110)) score += 1;

  // Consciousness
  if (v.consciousnessLevel !== 'Alert') score += 3;

  // Temperature
  if (v.temperature <= 35.0) score += 3;
  else if (v.temperature >= 39.1) score += 2;
  else if (v.temperature <= 36.0 || (v.temperature >= 38.1 && v.temperature <= 39.0)) score += 1;

  return score;
}

export const nursingApi = {
  // FR-NS-01: Inpatient Admissions & Intake
  getAdmissions: async (wardFilter?: string): Promise<InpatientAdmission[]> => {
    const admissions = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS);
    if (wardFilter && wardFilter !== 'all') {
      return admissions.filter(a => a.wardId === wardFilter);
    }
    return admissions;
  },

  createAdmission: async (admissionData: Omit<InpatientAdmission, 'id' | 'admissionDate' | 'status'>): Promise<InpatientAdmission> => {
    const admissions = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS);
    const selectedWard = getStored<Ward[]>(STORAGE_KEYS.WARDS, INITIAL_WARDS).find(w => w.id === admissionData.wardId);
    if (!selectedWard?.beds.some(b => b.bedNumber === admissionData.bedNumber && b.status === 'available')) {
      throw new Error('The selected bed is no longer available. Please select another bed.');
    }
    if (admissions.some(a => a.patientId === admissionData.patientId && a.status !== 'discharged')) {
      throw new Error('This patient already has an active admission.');
    }
    const newAdmission: InpatientAdmission = {
      ...admissionData,
      id: `adm-${crypto.randomUUID()}`,
      depositStatus: selectedWard.id.includes('ae') ? 'exempt_ae' : admissionData.depositStatus,
      admissionDate: new Date().toISOString(),
      status: 'admitted'
    };

    const updated = [newAdmission, ...admissions];
    setStored(STORAGE_KEYS.ADMISSIONS, updated);

    // Also occupy the bed in the ward map (FR-NS-08)
    const wards = getStored<Ward[]>(STORAGE_KEYS.WARDS, INITIAL_WARDS);
    const updatedWards = wards.map(ward => {
      if (ward.id === admissionData.wardId) {
        return {
          ...ward,
          occupiedBeds: ward.occupiedBeds + 1,
          availableBeds: Math.max(0, ward.availableBeds - 1),
          beds: ward.beds.map(bed => {
            if (bed.bedNumber === admissionData.bedNumber) {
              return {
                ...bed,
                status: 'occupied' as const,
                currentAdmissionId: newAdmission.id,
                patientName: newAdmission.patientName,
                hospitalNumber: newAdmission.hospitalNumber,
                acuity: newAdmission.triageAcuity,
                occupiedSince: newAdmission.admissionDate
              };
            }
            return bed;
          })
        };
      }
      return ward;
    });
    setStored(STORAGE_KEYS.WARDS, updatedWards);

    return newAdmission;
  },

  // FR-NS-02: My Patients list with acuity filter
  getPatientsByAcuity: async (acuityFilter?: TriageAcuity | 'all'): Promise<InpatientAdmission[]> => {
    const admissions = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS);
    if (!acuityFilter || acuityFilter === 'all') {
      return admissions.filter(a => a.status !== 'discharged');
    }
    return admissions.filter(a => a.status !== 'discharged' && a.triageAcuity === acuityFilter);
  },

  // FR-NS-04: Vital Signs Entry & History
  getVitalsForAdmission: async (admissionId: string): Promise<VitalSign[]> => {
    const allVitals = getStored<VitalSign[]>(STORAGE_KEYS.VITALS, INITIAL_VITALS);
    return allVitals
      .filter(v => v.admissionId === admissionId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  },

  getAllVitals: async (): Promise<VitalSign[]> => {
    return getStored<VitalSign[]>(STORAGE_KEYS.VITALS, INITIAL_VITALS);
  },

  recordVitals: async (vitalInput: Omit<VitalSign, 'id' | 'recordedAt' | 'earlyWarningScore' | 'isAbnormal'>): Promise<VitalSign> => {
    const score = calculateNEWS2({
      respiratoryRate: vitalInput.respiratoryRate,
      oxygenSaturation: vitalInput.oxygenSaturation,
      bloodPressureSystolic: vitalInput.bloodPressureSystolic,
      pulseRate: vitalInput.pulseRate,
      temperature: vitalInput.temperature,
      consciousnessLevel: vitalInput.consciousnessLevel
    });

    const isAbnormal = score >= 3 || vitalInput.oxygenSaturation < 94 || vitalInput.bloodPressureSystolic >= 160;

    const newVital: VitalSign = {
      ...vitalInput,
      id: `vit-${Date.now().toString().slice(-6)}`,
      recordedAt: new Date().toISOString(),
      earlyWarningScore: score,
      isAbnormal
    };

    const vitals = getStored<VitalSign[]>(STORAGE_KEYS.VITALS, INITIAL_VITALS);
    const updated = [newVital, ...vitals];
    setStored(STORAGE_KEYS.VITALS, updated);

    // Update patient's last vitals timestamp
    const admissions = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS);
    const updatedAdmissions = admissions.map(adm => {
      if (adm.id === vitalInput.admissionId) {
        return { ...adm, lastVitalsRecordedAt: newVital.recordedAt };
      }
      return adm;
    });
    setStored(STORAGE_KEYS.ADMISSIONS, updatedAdmissions);

    return newVital;
  },

  // FR-NS-03: Nursing Tasks & Medication Administration Record (MAR)
  getTasks: async (statusFilter?: TaskStatus | 'all'): Promise<NursingTask[]> => {
    const tasks = getStored<NursingTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    if (!statusFilter || statusFilter === 'all') {
      return tasks;
    }
    return tasks.filter(t => t.status === statusFilter);
  },

  updateTaskStatus: async (taskId: string, newStatus: TaskStatus, actor: string, reason?: string): Promise<NursingTask> => {
    const tasks = getStored<NursingTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    let targetTask: NursingTask | undefined;

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        targetTask = {
          ...t,
          status: newStatus,
          ...(newStatus === 'completed' ? { completedAt: new Date().toISOString(), completedBy: actor } : {}),
          ...(reason ? { postponeReason: reason } : {})
        };
        return targetTask;
      }
      return t;
    });

    setStored(STORAGE_KEYS.TASKS, updated);
    if (!targetTask) throw new Error(`Task ${taskId} not found`);
    return targetTask;
  },

  // FR-NS-05: Nursing Notes (sign-and-lock)
  getNotes: async (admissionId?: string): Promise<NursingNote[]> => {
    const notes = getStored<NursingNote[]>(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    if (admissionId) {
      return notes.filter(n => n.admissionId === admissionId);
    }
    return notes;
  },

  addNote: async (note: Omit<NursingNote, 'id' | 'writtenAt' | 'isSigned'>): Promise<NursingNote> => {
    const notes = getStored<NursingNote[]>(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    const newNote: NursingNote = {
      ...note,
      id: `nt-${Date.now().toString().slice(-6)}`,
      writtenAt: new Date().toISOString(),
      isSigned: false
    };

    const updated = [newNote, ...notes];
    setStored(STORAGE_KEYS.NOTES, updated);
    return newNote;
  },

  signAndLockNote: async (noteId: string, signatoryName: string): Promise<NursingNote> => {
    const notes = getStored<NursingNote[]>(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    let signedNote: NursingNote | undefined;

    const updated = notes.map(n => {
      if (n.id === noteId) {
        signedNote = {
          ...n,
          isSigned: true,
          signedAt: new Date().toISOString(),
          signedBy: signatoryName
        };
        return signedNote;
      }
      return n;
    });

    setStored(STORAGE_KEYS.NOTES, updated);
    if (!signedNote) throw new Error(`Note ${noteId} not found`);
    return signedNote;
  },

  // FR-NS-06: Care Plans
  getCarePlans: async (admissionId?: string): Promise<CarePlan[]> => {
    const plans = getStored<CarePlan[]>(STORAGE_KEYS.CARE_PLANS, INITIAL_CARE_PLANS);
    if (admissionId) {
      return plans.filter(p => p.admissionId === admissionId);
    }
    return plans;
  },

  // FR-NS-07: Shift Handover
  createShiftHandover: async (wardId: string, shift: ShiftHandover['shift'], outgoingNurse: string, generalWardNotes: string): Promise<ShiftHandover> => {
    if (!outgoingNurse.trim() || !generalWardNotes.trim()) throw new Error('Outgoing nurse and ward summary are required.');
    const ward = (await nursingApi.getWards()).find(w => w.id === wardId);
    if (!ward) throw new Error('Ward not found');
    const admissions = (await nursingApi.getAdmissions(wardId)).filter(a => a.status !== 'discharged');
    const tasks = await nursingApi.getTasks();
    const now = new Date().toISOString();
    const handover: ShiftHandover = {
      id: `sh-${crypto.randomUUID()}`, wardId, wardName: ward.name, shift,
      handoverDate: now.slice(0, 10), outgoingNurse: outgoingNurse.trim(), outgoingSignedAt: now,
      isDualSigned: false, generalWardNotes: generalWardNotes.trim(),
      patientEndorsements: admissions.map(a => ({ admissionId: a.id, patientName: a.patientName,
        bedNumber: a.bedNumber, acuity: a.triageAcuity, clinicalSummary: a.primaryDiagnosis,
        pendingTasks: tasks.filter(t => t.admissionId === a.id && t.status !== 'completed').map(t => t.title).join('; ') || 'No pending tasks recorded',
      })),
    };
    const shifts = getStored<ShiftHandover[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
    setStored(STORAGE_KEYS.SHIFTS, [handover, ...shifts]);
    return handover;
  },

  getShiftHandovers: async (wardId?: string): Promise<ShiftHandover[]> => {
    const shifts = getStored<ShiftHandover[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
    if (wardId) {
      return shifts.filter(s => s.wardId === wardId);
    }
    return shifts;
  },

  signShiftHandover: async (shiftId: string, incomingNurseName: string): Promise<ShiftHandover> => {
    const shifts = getStored<ShiftHandover[]>(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS);
    const current = shifts.find(s => s.id === shiftId);
    if (current?.isDualSigned) return current;
    if (!incomingNurseName.trim() || current?.outgoingNurse.toLowerCase() === incomingNurseName.trim().toLowerCase()) {
      throw new Error('A different incoming nurse must counter-sign the handover.');
    }
    let updatedShift: ShiftHandover | undefined;

    const updated = shifts.map(s => {
      if (s.id === shiftId) {
        updatedShift = {
          ...s,
          incomingNurse: incomingNurseName,
          isDualSigned: true,
          incomingSignedAt: new Date().toISOString()
        };
        return updatedShift;
      }
      return s;
    });

    setStored(STORAGE_KEYS.SHIFTS, updated);
    if (!updatedShift) throw new Error(`Shift handover ${shiftId} not found`);
    return updatedShift;
  },

  // FR-NS-08: Ward Management & Bed Maps
  getWards: async (): Promise<Ward[]> => {
    return getStored<Ward[]>(STORAGE_KEYS.WARDS, INITIAL_WARDS).map(ward => ({ ...ward,
      occupiedBeds: ward.beds.filter(b => b.status === 'occupied').length,
      availableBeds: ward.beds.filter(b => b.status === 'available').length,
    }));
  },

  // FR-NS-09 & FR-NS-10: Discharge Checklist & Billing Trigger Gate
  getDischargeDossier: async (admissionId: string): Promise<DischargeDossier> => {
    const dossiers = getStored<DischargeDossier[]>(STORAGE_KEYS.DISCHARGES, INITIAL_DISCHARGES);
    const existing = dossiers.find(d => d.admissionId === admissionId);
    if (existing) return existing;

    // Create a new template dossier if none exists yet
    const admissions = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS);
    const admission = admissions.find(a => a.id === admissionId);
    if (!admission) throw new Error('Admission not found');

    const newDossier: DischargeDossier = {
      admissionId,
      patientName: admission?.patientName || 'Inpatient',
      hospitalNumber: admission?.hospitalNumber || 'HIMS/2026/000000',
      wardName: admission?.wardName || 'Ward',
      bedNumber: admission?.bedNumber || 'Bed',
      doctorDischargeOrderSigned: false,
      isChecklist100Percent: false,
      hasMatronOverride: false,
      canTriggerBilling: false,
      billingTriggered: false,
      items: [
        { id: 'dc-1', label: 'Doctor discharge clinical summary finalized & signed', category: 'clinical', completed: false, mandatory: true },
        { id: 'dc-2', label: 'Take-Home Medications (TTO) reconciled with Pharmacy', category: 'pharmacy', completed: false, mandatory: true },
        { id: 'dc-3', label: 'Peripheral IV cannula & surgical drains safely removed', category: 'equipment', completed: false, mandatory: true },
        { id: 'dc-4', label: 'Patient education: wound care, red-flag symptoms & dietary advice given', category: 'education', completed: false, mandatory: true },
        { id: 'dc-5', label: 'Follow-up outpatient surgical clinic appointment date scheduled', category: 'clinical', completed: false, mandatory: true },
        { id: 'dc-6', label: 'Hospital wristband intact until gate exit clearance', category: 'clinical', completed: false, mandatory: true }
      ]
    };

    setStored(STORAGE_KEYS.DISCHARGES, [newDossier, ...dossiers]);
    return newDossier;
  },

  toggleDischargeItem: async (admissionId: string, itemId: string, nurseName: string): Promise<DischargeDossier> => {
    const dossiers = getStored<DischargeDossier[]>(STORAGE_KEYS.DISCHARGES, INITIAL_DISCHARGES);
    let target: DischargeDossier | undefined;

    const updated = dossiers.map(d => {
      if (d.admissionId === admissionId) {
        const updatedItems = d.items.map(item => {
          if (item.id === itemId) {
            const nextVal = !item.completed;
            return {
              ...item,
              completed: nextVal,
              completedBy: nextVal ? nurseName : undefined,
              completedAt: nextVal ? new Date().toISOString() : undefined
            };
          }
          return item;
        });

        const is100Percent = updatedItems.every(i => i.completed);
        const canTrigger = is100Percent || d.hasMatronOverride;

        target = {
          ...d,
          items: updatedItems,
          isChecklist100Percent: is100Percent,
          canTriggerBilling: canTrigger
        };
        return target;
      }
      return d;
    });

    setStored(STORAGE_KEYS.DISCHARGES, updated);
    if (!target) throw new Error('Dossier not found');
    return target;
  },

  applyMatronOverride: async (admissionId: string, reason: string, matronName: string): Promise<DischargeDossier> => {
    if (!reason.trim() || !matronName.trim()) throw new Error('Override requires a signatory and audit rationale.');
    const dossiers = getStored<DischargeDossier[]>(STORAGE_KEYS.DISCHARGES, INITIAL_DISCHARGES);
    let target: DischargeDossier | undefined;

    const updated = dossiers.map(d => {
      if (d.admissionId === admissionId) {
        target = {
          ...d,
          hasMatronOverride: true,
          matronOverrideReason: reason,
          matronOverrideBy: matronName,
          canTriggerBilling: true
        };
        return target;
      }
      return d;
    });

    setStored(STORAGE_KEYS.DISCHARGES, updated);
    if (!target) throw new Error('Dossier not found');
    return target;
  },

  // FR-NS-10: Trigger billing invoice generation upon verified discharge
  triggerDischargeBilling: async (admissionId: string): Promise<{ invoiceId: string; dischargedAt: string }> => {
	if (!AUTOMATIC_DISCHARGE_BILLING_ENABLED) throw new Error('Automatic discharge billing is disabled until approved tariffs are configured.');
    const dossiers = getStored<DischargeDossier[]>(STORAGE_KEYS.DISCHARGES, INITIAL_DISCHARGES);
    const dossier = dossiers.find(d => d.admissionId === admissionId);

    if (!dossier || !dossier.items.length || !dossier.items.every(item => item.completed)) {
      throw new Error('Discharge checklist must be 100% complete before generating billing invoice');
    }

    if (dossier.billingTriggered && dossier.billingInvoiceId && dossier.dischargedAt) {
      return { invoiceId: dossier.billingInvoiceId, dischargedAt: dossier.dischargedAt };
    }
    const admission = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS).find(a => a.id === admissionId);
    if (!admission) throw new Error('Admission not found');
    const items = await billingApi.pullConsolidatedNursingCharges(admissionId);
    const invoice = await billingApi.createInvoice({
      patientId: admission.patientId,
      patientName: admission.patientName,
      hospitalNumber: admission.hospitalNumber,
      admissionId,
      payerScheme: admission.tariffType,
      nhiaNumber: admission.insuranceNumber,
      items,
      notes: 'Mock discharge consolidation. Tariffs are demonstration values.',
    });
    const invoiceId = invoice.invoiceNumber;
    const dischargedAt = new Date().toISOString();

    const updatedDossiers = dossiers.map(d => {
      if (d.admissionId === admissionId) {
        return {
          ...d,
          billingTriggered: true,
          billingInvoiceId: invoiceId,
          dischargedAt
        };
      }
      return d;
    });
    setStored(STORAGE_KEYS.DISCHARGES, updatedDossiers);

    // Update admission status to discharged
    const admissions = getStored<InpatientAdmission[]>(STORAGE_KEYS.ADMISSIONS, INITIAL_ADMISSIONS);
    const updatedAdmissions = admissions.map(a => {
      if (a.id === admissionId) {
        return { ...a, status: 'discharged' as const };
      }
      return a;
    });
    setStored(STORAGE_KEYS.ADMISSIONS, updatedAdmissions);

    const wards = getStored<Ward[]>(STORAGE_KEYS.WARDS, INITIAL_WARDS).map(ward => {
      const beds = ward.beds.map(bed => bed.currentAdmissionId === admissionId ? {
        ...bed, status: 'cleaning' as const, currentAdmissionId: undefined,
        patientName: undefined, hospitalNumber: undefined, acuity: undefined, occupiedSince: undefined,
      } : bed);
      return { ...ward, beds, occupiedBeds: beds.filter(b => b.status === 'occupied').length, availableBeds: beds.filter(b => b.status === 'available').length };
    });
    setStored(STORAGE_KEYS.WARDS, wards);

    return { invoiceId, dischargedAt };
  }
};
