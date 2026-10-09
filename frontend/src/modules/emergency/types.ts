export type TriageCategory = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | 'BLACK';

export type PatientArrivalMode = 'AMBULANCE' | 'WALK_IN' | 'TRANSFER_IN' | 'POLICE_BYSTANDER';

export type EmergencyStatus = 
  | 'TRIAGED'
  | 'IN_RESUS'
  | 'OBSERVATION'
  | 'TRANSFERRED_OR'
  | 'TRANSFERRED_ICU'
  | 'TRANSFERRED_WARD'
  | 'DISCHARGED'
  | 'DECEASED';

export type BayType = 
  | 'RESUSCITATION'
  | 'TRAUMA'
  | 'ACUTE_OBSERVATION'
  | 'FAST_TRACK_MINORS'
  | 'ISOLATION';

export interface VitalsTriage {
  heartRate: number; // bpm
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  respiratoryRate: number; // cpm
  spo2: number; // %
  temperature: number; // °C
  gcs: number; // Glasgow Coma Scale 3-15
  bloodGlucose?: number; // mmol/L or mg/dL
  painScore: number; // 0-10
}

export interface PrimarySurvey {
  airway: 'PATENT' | 'AT_RISK' | 'OBSTRUCTED' | 'INTUBATED';
  airwayIntervention?: string;
  cSpinePrecautions: boolean;
  breathing: 'NORMAL' | 'TACHYPNEIC' | 'WHEEZING' | 'STRIDOR' | 'ABSENT_UNILATERAL' | 'MECHANICAL_VENTILATION';
  oxygenDelivery?: string; // e.g. "Room Air", "15L Non-Rebreather", "BVM"
  circulation: 'STRONG_RADIAL' | 'WEAK_THREADY' | 'CENTRAL_ONLY' | 'ABSENT';
  capillaryRefillSeconds: number;
  ivAccessSites: string[]; // e.g. ["16G Left Antecubital", "18G Right Forearm"]
  disabilityPupils: 'EQUAL_REACTIVE' | 'SLUGGISH' | 'FIXED_DILATED' | 'PINPOINT';
  disabilityMotorResponse: string;
  exposureFindings: string; // e.g. "Severe road rash right flank, open distal femur deformity"
  activeHemorrhageControlled: boolean;
}

export interface CrashMedicationEntry {
  id: string;
  drugName: string;
  dose: string;
  route: 'IV_PUSH' | 'IV_INFUSION' | 'IM' | 'NEBULIZED' | 'IO' | 'ET_TUBE';
  administeredAt: string; // ISO timestamp
  administeredBy: string;
  indication: string;
}

export interface EmergencyPatient {
  id: string;
  hospitalNumber: string;
  patientName: string;
  isUnidentifiedJohnDoe: boolean;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  arrivalTime: string;
  arrivalMode: PatientArrivalMode;
  triageCategory: TriageCategory;
  triageNurse: string;
  chiefComplaint: string;
  vitals: VitalsTriage;
  assignedBayId?: string;
  assignedBayName?: string;
  assignedBedNumber?: string;
  status: EmergencyStatus;
  zeroDepositWaived: boolean; // Always true for A&E
  primarySurvey?: PrimarySurvey;
  medicationsAdministered: CrashMedicationEntry[];
  attendingDoctor?: string;
  dispositionNotes?: string;
  updatedAt: string;
}

export interface BedSlot {
  bedId: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  currentPatientId?: string;
  currentPatientName?: string;
  triageCategory?: TriageCategory;
}

export interface EmergencyBay {
  id: string;
  name: string;
  bayType: BayType;
  floorZone: string;
  totalBeds: number;
  beds: BedSlot[];
}

export type DispositionType = 
  | 'EMERGENCY_OR'
  | 'ICU_ADMISSION'
  | 'WARD_ADMISSION'
  | 'DISCHARGE_HOME'
  | 'MORTUARY_TRANSFER';

export interface StabilizationNote {
  id: string;
  emergencyPatientId: string;
  patientName: string;
  hospitalNumber: string;
  recordedAt: string;
  clinicianName: string;
  clinicianRole: string;
  primarySurvey: PrimarySurvey;
  interventionSummary: string;
  crashMeds: CrashMedicationEntry[];
  disposition: DispositionType;
  dispositionDestination: string;
  clinicalHandoverSummary: string;
}
