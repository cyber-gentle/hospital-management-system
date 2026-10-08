export type SurgeryPriority = "ELECTIVE" | "URGENT" | "EMERGENCY";

export type SurgeryStatus = 
  | "SCHEDULED" 
  | "PRE_OP" 
  | "IN_THEATRE" 
  | "PACU" 
  | "COMPLETED" 
  | "CANCELLED";

export type TheatreRoom = 
  | "OR 1 - General Surgery" 
  | "OR 2 - Orthopaedic" 
  | "OR 3 - Emergency / Trauma" 
  | "OR 4 - Laparoscopic & Endoscopy";

export interface PreOpChecklist {
  patientIdentified: boolean;
  siteMarked: boolean;
  consentConfirmed: boolean;
  anaesthesiaSafetyCheckComplete: boolean;
  pulseOximeterFunctioning: boolean;
  allergiesReviewed: boolean;
  airwayDifficultyAssessed: boolean;
  aspirationRiskAssessed: boolean;
  bloodLossRiskAssessed: boolean;
  adequateIvAccessVerified: boolean;
  completedBy: string;
  completedAt?: string;
}

export interface IntraOpNotes {
  timeOutConfirmed: boolean;
  incisionTime: string;
  closureTime: string;
  leadSurgeon: string;
  assistantSurgeon?: string;
  anaesthetist: string;
  scrubNurse: string;
  circulatingNurse: string;
  procedurePerformed: string;
  surgicalFindings: string;
  estimatedBloodLossMl: number;
  specimensCollected: boolean;
  specimenLabels: string[];
  spongeNeedleCountVerified: boolean;
  implantBatchNumbers?: string;
  complications?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AldreteScore {
  activity: number;       // 0: Unable, 1: 2 extremities, 2: 4 extremities
  respiration: number;    // 0: Apneic, 1: Dyspneic/shallow, 2: Deep/cough
  circulation: number;    // 0: BP +/-50%, 1: BP +/-20-49%, 2: BP +/-20% of normal
  consciousness: number;  // 0: Unresponsive, 1: Arousable, 2: Fully awake
  oxygenSaturation: number; // 0: <90% on O2, 1: Needs O2 for >90%, 2: >92% on room air
  totalScore: number;     // Sum (out of 10) - Score >= 8 required for transfer
}

export interface PacuRecoveryLog {
  admissionTime: string;
  initialVitals: {
    bloodPressure: string;
    pulseRate: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    temperature: number;
    painScore: number; // 0-10
  };
  aldreteScore: AldreteScore;
  analgesiaAdministered?: string;
  ivFluidsAdministered?: string;
  recoveryNotes: string;
  fitForWardTransfer: boolean;
  authorizedBy?: string;
  destinationWard?: string;
  transferTime?: string;
}

export interface SurgeryBooking {
  id: string;
  bookingNumber: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  procedureName: string;
  diagnosis: string;
  theatreRoom: TheatreRoom;
  leadSurgeon: string;
  anaesthetist: string;
  scheduledStartTime: string;
  estimatedDurationMinutes: number;
  priority: SurgeryPriority;
  status: SurgeryStatus;
  preOpChecklist?: PreOpChecklist;
  intraOpNotes?: IntraOpNotes;
  pacuLog?: PacuRecoveryLog;
  createdAt: string;
  updatedAt: string;
}
