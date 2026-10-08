export interface GopdPatient {
  id: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  age: number;
  gender: string;
  status: "WAITING_TRIAGE" | "WAITING_DOCTOR" | "IN_CONSULTATION" | "COMPLETED";
  triagePriority: "EMERGENCY" | "URGENT" | "STANDARD" | "NON_URGENT";
  queueNumber: string;
  registeredAt: string;
  vitals?: Vitals;
  consultation?: ConsultationRecord;
}

export interface Vitals {
  bloodPressure: string;
  systolic?: number;
  diastolic?: number;
  pulseRate: number;
  temperature: number;
  spO2: number;
  respiratoryRate: number;
  weight: number;
  height: number;
  bmi?: number;
  painScore?: number;
  bloodGlucose?: number;
  consciousnessLevel?: "Alert" | "Voice" | "Pain" | "Unresponsive";
  triageNotes?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface Diagnosis {
  icd10Code: string;
  description: string;
  type: "PRIMARY" | "SECONDARY";
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
}

export interface InvestigationOrder {
  id: string;
  type: "LABORATORY" | "RADIOLOGY";
  testName: string;
  clinicalNotes?: string;
  urgency: "ROUTINE" | "URGENT" | "STAT";
}

export interface ConsultationRecord {
  id: string;
  gopdPatientId: string;
  doctorId: string;
  doctorName?: string;
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  physicalExamination: string;
  diagnoses: Diagnosis[];
  prescriptions?: PrescriptionItem[];
  investigations?: InvestigationOrder[];
  notes: string;
  disposition?: "DISCHARGED" | "ADMIT_WARD" | "REFER_SPECIALIST" | "FOLLOW_UP";
  createdAt: string;
}
