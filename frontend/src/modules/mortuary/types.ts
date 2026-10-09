export type DeceasedOrigin = 
  | 'INPATIENT_WARD' 
  | 'ACCIDENT_EMERGENCY' 
  | 'OPERATING_THEATRE' 
  | 'BROUGHT_IN_DEAD_BID' 
  | 'POLICE_CASE';

export type MortuaryStatus = 
  | 'ADMITTED_IN_STORAGE' 
  | 'AUTOPSY_PENDING' 
  | 'AUTOPSY_COMPLETED' 
  | 'EMBALMING_IN_PROGRESS' 
  | 'CLEARED_FOR_RELEASE' 
  | 'RELEASED_TO_FAMILY';

export type ChamberTier = 'TOP_TIER' | 'MIDDLE_TIER' | 'BOTTOM_TIER';

export interface NextOfKin {
  name: string;
  phone: string;
  relationship: string;
  address: string;
  nationalIdNumber: string;
}

export interface DeceasedRecord {
  id: string;
  deceasedTagNumber: string;
  fullName: string;
  isUnidentified: boolean;
  hospitalNumber: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfAdmission: string;
  originDepartment: DeceasedOrigin;
  dateOfDeath: string;
  causeOfDeath: string;
  certifyingDoctor: string;
  certifyingDoctorLicense: string;
  isCoronerCase: boolean;
  policeRefNumber?: string;
  nextOfKin: NextOfKin;
  assignedChamberId?: string;
  assignedChamberUnit?: string;
  status: MortuaryStatus;
  belongingsDeposited: string[];
  storageFeeDaily: number;
  daysInStorage: number | null;
  storageBillingStatus?: 'NOT_CONFIGURED';
  totalAccruedStorageFee: number | null;
  financialClearancePaid: boolean;
  autopsyId?: string;
  releaseId?: string;
  updatedAt: string;
}

export interface ChamberSlot {
  chamberId: string;
  chamberNumber: string;
  tier: ChamberTier;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DECONTAMINATION';
  currentDeceasedId?: string;
  currentDeceasedName?: string;
  currentDeceasedTag?: string;
}

export interface ColdStorageUnit {
  id: string;
  unitName: string;
  targetTemperatureCelsius: number;
  currentTemperatureCelsius: number;
  totalChambers: number;
  chambers: ChamberSlot[];
}

export interface AutopsyLog {
  id: string;
  deceasedId: string;
  deceasedName: string;
  deceasedTagNumber: string;
  pathologistName: string;
  pathologistLicense: string;
  autopsyDate: string;
  externalFindings: string;
  internalFindings: string;
  definitiveCauseOfDeath: string;
  toxicologySamplesRetained: string[];
  coronerVerdict: string;
}

export interface BodyReleaseRecord {
  id: string;
  deceasedId: string;
  deceasedName: string;
  deceasedTagNumber: string;
  releaseDate: string;
  releasedToName: string;
  releasedToNIN: string;
  releasedToRelationship: string;
  funeralHomeOrUndertaker: string;
  burialPermitNumber: string;
  coronerClearanceConfirmed: boolean;
  billingReceiptNumber: string;
  mortuaryOfficer: string;
  handoverNotes: string;
}
