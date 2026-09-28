// Strict TypeScript definitions for Pharmacy Module
// Traceable to FR-PH-01 through FR-PH-04

export type PrescriptionStatus = 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled';

export type PatientType = 'Outpatient' | 'Inpatient';

export type DrugCategory =
  | 'Antibiotics'
  | 'Antihypertensives'
  | 'Analgesics / NSAIDs'
  | 'Antidiabetics'
  | 'Antimalarials'
  | 'Fluids & Electrolytes'
  | 'Respiratory'
  | 'Gastrointestinal';

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Injection'
  | 'Syrup / Suspension'
  | 'Inhaler'
  | 'Infusion (IV)'
  | 'Topical Ointment';

export interface Drug {
  id: string;
  genericName: string;
  brandName: string;
  category: DrugCategory;
  dosageForm: DosageForm;
  strength: string; // e.g. 500mg, 10mg/mL
  unitPrice: number; // in ₦
  stockOnHand: number;
  reorderLevel: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  activeIngredients: string[];
  contraindications: string[];
}

export interface PrescriptionItem {
  id: string;
  drugId: string;
  drugName: string;
  genericName: string;
  dosageForm: DosageForm;
  strength: string;
  dosage: string; // e.g. 500mg
  route: 'Oral' | 'IV' | 'IM' | 'SC' | 'Inhalation' | 'Topical';
  frequency: string; // e.g. TDS (8-hourly), BD, Stat
  durationDays: number;
  quantityPrescribed: number;
  quantityDispensed: number;
  instructions: string;
  isDispensed: boolean;
  unitPrice: number;
}

export interface AllergyAlert {
  hasConflict: boolean;
  conflictingAllergy?: string;
  conflictingDrug?: string;
  severity: 'critical' | 'warning' | 'none';
  alertMessage?: string;
  requiresOverride: boolean;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g. RX-2026-00412
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  patientType: PatientType;
  wardName?: string;
  bedNumber?: string;
  prescriberName: string;
  prescriberDepartment: string;
  prescribedAt: string;
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  knownAllergies: string[];
  payerScheme: 'Cash' | 'NHIA' | 'Retainership';
  paymentStatus: 'paid' | 'pending' | 'exempt';
  dispensedAt?: string;
  dispensedBy?: string;
  clinicalNotes?: string;
  pharmacistOverrideReason?: string;
  pharmacistOverrideBy?: string;
}

export interface PharmacyStockSummary {
  totalFormularyItems: number;
  adequateStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalPrescriptionsToday: number;
  pendingDispenseCount: number;
  dispensedCount: number;
}
