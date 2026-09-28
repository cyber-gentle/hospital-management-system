// Strict TypeScript definitions for Nursing Services Module
// Traceable to FR-NS-01 through FR-NS-10

export type TriageAcuity = 'critical' | 'high_risk' | 'stable';

export type DepositStatus = 'paid' | 'pending' | 'exempt_ae';

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'postponed';

export type TaskCategory = 'medication' | 'vitals' | 'dressing' | 'intake_output' | 'assessment' | 'other';

export type NoteType = 'progress' | 'shift_report' | 'incident' | 'doctor_visit' | 'procedure';

export interface AdmissionChecklist {
  consentSigned: boolean;
  idWristbandApplied: boolean;
  allergyBandApplied: boolean;
  orientationCompleted: boolean;
  belongingsDocumented: boolean;
  initialVitalsDone: boolean;
  valuablesStorageSigned: boolean;
}

export interface InpatientAdmission {
  id: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  admissionDate: string;
  wardId: string;
  wardName: string;
  bedNumber: string;
  admittingDoctor: string;
  primaryDiagnosis: string;
  triageAcuity: TriageAcuity;
  depositStatus: DepositStatus; // Soft warning flag per resolved decision; A&E exempt
  admissionChecklist: AdmissionChecklist;
  status: 'admitted' | 'discharge_in_progress' | 'discharged';
  allergies: string[];
  resuscitationStatus: 'Full Code' | 'DNR' | 'Modified';
  bloodGroup: string;
  tariffType: 'Cash' | 'NHIA' | 'Retainership';
  insuranceNumber?: string;
  lastVitalsRecordedAt?: string;
}

export interface Bed {
  id: string;
  wardId: string;
  bedNumber: string;
  status: BedStatus;
  currentAdmissionId?: string;
  patientName?: string;
  hospitalNumber?: string;
  acuity?: TriageAcuity;
  occupiedSince?: string;
}

export interface Ward {
  id: string;
  name: string;
  department: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  beds: Bed[];
}

export interface VitalSign {
  id: string;
  admissionId: string;
  patientName: string;
  hospitalNumber: string;
  recordedAt: string;
  recordedBy: string;
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  pulseRate: number; // bpm
  respiratoryRate: number; // bpm
  temperature: number; // °C
  oxygenSaturation: number; // % SpO2
  painScore: number; // 0 - 10
  consciousnessLevel: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';
  bloodGlucose?: number; // mg/dL
  earlyWarningScore: number; // NEWS2 score (0-20)
  isAbnormal: boolean;
  source: 'manual' | 'device_stub';
  clinicalNotes?: string;
}

export interface MedicationMARDetails {
  drugName: string;
  dosage: string;
  route: 'Oral' | 'IV' | 'IM' | 'SC' | 'Topical' | 'Inhalation';
  frequency: string;
  prescribedBy: string;
}

export interface NursingTask {
  id: string;
  admissionId: string;
  patientName: string;
  bedNumber: string;
  wardName: string;
  title: string;
  description: string;
  category: TaskCategory;
  scheduledTime: string;
  status: TaskStatus;
  assignedNurse: string;
  marLinked: boolean;
  medicationDetails?: MedicationMARDetails;
  completedAt?: string;
  completedBy?: string;
  postponeReason?: string;
}

export interface NursingNote {
  id: string;
  admissionId: string;
  patientName: string;
  noteType: NoteType;
  tags: string[];
  content: string;
  writtenAt: string;
  authorName: string;
  authorRole: string;
  isSigned: boolean;
  signedAt?: string;
  signedBy?: string;
}

export interface CarePlanIntervention {
  id: string;
  description: string;
  frequency: string;
  status: 'active' | 'completed';
  evaluation: string;
}

export interface CarePlan {
  id: string;
  admissionId: string;
  patientName: string;
  nursingDiagnosis: string;
  clinicalGoal: string;
  status: 'active' | 'resolved' | 'revised';
  interventions: CarePlanIntervention[];
  createdAt: string;
  nurseInCharge: string;
}

export interface PatientEndorsement {
  admissionId: string;
  patientName: string;
  bedNumber: string;
  acuity: TriageAcuity;
  clinicalSummary: string;
  pendingTasks: string;
}

export interface ShiftHandover {
  id: string;
  wardId: string;
  wardName: string;
  shift: 'morning' | 'afternoon' | 'night';
  handoverDate: string;
  outgoingNurse: string;
  incomingNurse?: string;
  isDualSigned: boolean;
  outgoingSignedAt: string;
  incomingSignedAt?: string;
  generalWardNotes: string;
  patientEndorsements: PatientEndorsement[];
}

export interface DischargeChecklistItem {
  id: string;
  label: string;
  category: 'clinical' | 'pharmacy' | 'equipment' | 'education';
  completed: boolean;
  mandatory: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface DischargeDossier {
  admissionId: string;
  patientName: string;
  hospitalNumber: string;
  wardName: string;
  bedNumber: string;
  doctorDischargeOrderSigned: boolean;
  doctorName?: string;
  orderSignedAt?: string;
  items: DischargeChecklistItem[];
  isChecklist100Percent: boolean;
  hasMatronOverride: boolean;
  matronOverrideReason?: string;
  matronOverrideBy?: string;
  canTriggerBilling: boolean;
  billingTriggered: boolean;
  billingInvoiceId?: string;
  dischargedAt?: string;
}
