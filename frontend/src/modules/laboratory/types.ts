export type LabDiscipline = "HEMATOLOGY" | "CHEMICAL_PATHOLOGY" | "MICROBIOLOGY" | "PARASITOLOGY";

export type LabOrderStatus =
  | "PENDING_COLLECTION"
  | "SPECIMEN_COLLECTED"
  | "IN_ANALYSIS"
  | "AWAITING_VERIFICATION"
  | "COMPLETED"
  | "REJECTED";

export type UrgencyLevel = "ROUTINE" | "URGENT" | "STAT";

export type ResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL";

export interface SpecimenDetails {
  specimenBarcode: string;
  sampleType: string;
  containerType: string;
  collectedAt: string;
  collectedBy: string;
  rejectionReason?: string;
}

export interface ResultParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: ResultFlag;
  lowNormal?: number;
  highNormal?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface TestResult {
  parameters: ResultParameter[];
  pathologistComment?: string;
  enteredBy: string;
  enteredAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  criticalEscalated?: boolean;
  escalatedTo?: string;
  escalatedAt?: string;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  age: number;
  gender: string;
  orderingDoctor: string;
  originDepartment: "GOPD" | "INPATIENT_WARD" | "EMERGENCY" | "THEATRE";
  clinicalNotes?: string;
  urgency: UrgencyLevel;
  discipline: LabDiscipline;
  testName: string;
  testCode: string;
  status: LabOrderStatus;
  specimen?: SpecimenDetails;
  results?: TestResult;
  createdAt: string;
  completedAt?: string;
}

export interface DisciplineStat {
  discipline: LabDiscipline;
  total: number;
  pendingCollection: number;
  inAnalysis: number;
  awaitingVerification: number;
  completed: number;
}
