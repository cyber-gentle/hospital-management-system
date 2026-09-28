import {
  Drug,
  Prescription,
  PrescriptionStatus,
  PatientType,
  DrugCategory,
  AllergyAlert,
  PharmacyStockSummary
} from './types';
import { INITIAL_DRUGS, INITIAL_PRESCRIPTIONS } from './mockData';

const DRUGS_STORAGE_KEY = 'hims_pharmacy_drugs_v1';
const RX_STORAGE_KEY = 'hims_pharmacy_prescriptions_v1';

function getStoredDrugs(): Drug[] {
  try {
    const raw = localStorage.getItem(DRUGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DRUGS_STORAGE_KEY, JSON.stringify(INITIAL_DRUGS));
      return INITIAL_DRUGS;
    }
    return JSON.parse(raw) as Drug[];
  } catch {
    return INITIAL_DRUGS;
  }
}

function setStoredDrugs(drugs: Drug[]): void {
  try {
    localStorage.setItem(DRUGS_STORAGE_KEY, JSON.stringify(drugs));
  } catch (e) {
    console.error('Failed to save drugs to storage', e);
  }
}

function getStoredPrescriptions(): Prescription[] {
  try {
    const raw = localStorage.getItem(RX_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RX_STORAGE_KEY, JSON.stringify(INITIAL_PRESCRIPTIONS));
      return INITIAL_PRESCRIPTIONS;
    }
    return JSON.parse(raw) as Prescription[];
  } catch {
    return INITIAL_PRESCRIPTIONS;
  }
}

function setStoredPrescriptions(prescriptions: Prescription[]): void {
  try {
    localStorage.setItem(RX_STORAGE_KEY, JSON.stringify(prescriptions));
  } catch (e) {
    console.error('Failed to save prescriptions to storage', e);
  }
}

export const pharmacyApi = {
  // FR-PH-01: Receive & View Prescriptions Queue
  getPrescriptions: async (filters?: {
    status?: PrescriptionStatus | 'all';
    patientType?: PatientType | 'all';
    search?: string;
  }): Promise<Prescription[]> => {
    let list = getStoredPrescriptions();

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(rx => rx.status === filters.status);
    }

    if (filters?.patientType && filters.patientType !== 'all') {
      list = list.filter(rx => rx.patientType === filters.patientType);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        rx =>
          rx.prescriptionNumber.toLowerCase().includes(q) ||
          rx.patientName.toLowerCase().includes(q) ||
          rx.hospitalNumber.toLowerCase().includes(q) ||
          (rx.wardName && rx.wardName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime());
  },

  getPrescriptionById: async (id: string): Promise<Prescription | null> => {
    const list = getStoredPrescriptions();
    return list.find(rx => rx.id === id) || null;
  },

  // FR-PH-04: Drug Formulary & Stock Level View
  getDrugFormulary: async (filters?: {
    category?: DrugCategory | 'all';
    search?: string;
  }): Promise<Drug[]> => {
    let list = getStoredDrugs();

    if (filters?.category && filters.category !== 'all') {
      list = list.filter(d => d.category === filters.category);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        d =>
          d.genericName.toLowerCase().includes(q) ||
          d.brandName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.genericName.localeCompare(b.genericName));
  },

  // FR-PH-02: Clinical Allergy & Interaction Check
  checkAllergySafety: async (prescription: Prescription, drug: Drug): Promise<AllergyAlert> => {
    const patientAllergies = prescription.knownAllergies.map(a => a.toLowerCase().trim());
    if (patientAllergies.length === 0 || patientAllergies.includes('none reported')) {
      return { hasConflict: false, severity: 'none', requiresOverride: false };
    }

    // Check Penicillin conflicts
    const hasPenicillinAllergy = patientAllergies.some(a => a.includes('penicillin'));
    const isPenicillinDrug =
      drug.contraindications.some(c => c.toLowerCase().includes('penicillin')) ||
      drug.genericName.toLowerCase().includes('amoxicillin') ||
      drug.genericName.toLowerCase().includes('ampicillin');

    if (hasPenicillinAllergy && isPenicillinDrug) {
      return {
        hasConflict: true,
        conflictingAllergy: 'Penicillin',
        conflictingDrug: drug.brandName,
        severity: 'critical',
        requiresOverride: true,
        alertMessage: `CRITICAL ALLERGY ALERT: Patient has a documented Penicillin allergy. ${drug.brandName} (${drug.genericName}) is a penicillin-class antibiotic and risks anaphylaxis.`
      };
    }

    // Check NSAID conflicts
    const hasNsaidAllergy = patientAllergies.some(a => a.includes('nsaid'));
    const isNsaidDrug =
      drug.category.includes('Analgesics') &&
      (drug.genericName.toLowerCase().includes('ibuprofen') || drug.genericName.toLowerCase().includes('diclofenac'));

    if (hasNsaidAllergy && isNsaidDrug) {
      return {
        hasConflict: true,
        conflictingAllergy: 'NSAIDs',
        conflictingDrug: drug.brandName,
        severity: 'critical',
        requiresOverride: true,
        alertMessage: `CRITICAL ALLERGY ALERT: Patient has documented NSAID hypersensitivity. ${drug.brandName} (${drug.genericName}) is contraindicated.`
      };
    }

    // Check Sulphonamide conflicts
    const hasSulphaAllergy = patientAllergies.some(a => a.includes('sulphonamide') || a.includes('sulfa'));
    const isSulphaDrug = drug.contraindications.some(c => c.toLowerCase().includes('sulphonamide'));

    if (hasSulphaAllergy && isSulphaDrug) {
      return {
        hasConflict: true,
        conflictingAllergy: 'Sulphonamides',
        conflictingDrug: drug.brandName,
        severity: 'warning',
        requiresOverride: true,
        alertMessage: `CAUTION: Patient has documented Sulphonamide hypersensitivity. Cross-reactivity possible with ${drug.brandName}.`
      };
    }

    return { hasConflict: false, severity: 'none', requiresOverride: false };
  },

  // FR-PH-03: Dispense + Stock Deduction Workflow
  dispensePrescription: async (
    prescriptionId: string,
    dispenseItems: { itemId: string; quantityToDispense: number }[],
    pharmacistName: string,
    overrideReason?: string
  ): Promise<Prescription> => {
    const rxList = getStoredPrescriptions();
    const rxIndex = rxList.findIndex(r => r.id === prescriptionId);
    if (rxIndex === -1) throw new Error('Prescription not found');

    const rx = rxList[rxIndex];
    if (!rx) throw new Error('Prescription not found');

    const drugs = getStoredDrugs();

    // 1. Verify and deduct stock for each dispensed item
    for (const disp of dispenseItems) {
      const rxItem = rx.items.find(i => i.id === disp.itemId);
      if (!rxItem) continue;

      const drugIndex = drugs.findIndex(d => d.id === rxItem.drugId);
      if (drugIndex === -1) continue;

      const targetDrug = drugs[drugIndex];
      if (!targetDrug) continue;

      if (targetDrug.stockOnHand < disp.quantityToDispense) {
        throw new Error(`Insufficient stock for ${targetDrug.brandName}. Requested: ${disp.quantityToDispense}, Available: ${targetDrug.stockOnHand}`);
      }

      // Deduct stock
      drugs[drugIndex] = {
        ...targetDrug,
        stockOnHand: targetDrug.stockOnHand - disp.quantityToDispense
      };
    }

    setStoredDrugs(drugs);

    // 2. Update prescription item status
    const updatedItems = rx.items.map(item => {
      const match = dispenseItems.find(d => d.itemId === item.id);
      if (match) {
        const totalDisp = item.quantityDispensed + match.quantityToDispense;
        return {
          ...item,
          quantityDispensed: totalDisp,
          isDispensed: totalDisp >= item.quantityPrescribed
        };
      }
      return item;
    });

    const allDispensed = updatedItems.every(i => i.isDispensed);
    const someDispensed = updatedItems.some(i => i.quantityDispensed > 0);

    const updatedPrescription: Prescription = {
      ...rx,
      items: updatedItems,
      status: allDispensed ? 'dispensed' : someDispensed ? 'partially_dispensed' : rx.status,
      dispensedAt: new Date().toISOString(),
      dispensedBy: pharmacistName,
      ...(overrideReason ? { pharmacistOverrideReason: overrideReason, pharmacistOverrideBy: pharmacistName } : {})
    };

    rxList[rxIndex] = updatedPrescription;
    setStoredPrescriptions(rxList);

    return updatedPrescription;
  },

  // Restock drug action
  restockDrug: async (drugId: string, quantityToAdd: number): Promise<Drug> => {
    const drugs = getStoredDrugs();
    const index = drugs.findIndex(d => d.id === drugId);
    if (index === -1) throw new Error('Drug not found');

    const drug = drugs[index];
    if (!drug) throw new Error('Drug not found');

    const updated: Drug = {
      ...drug,
      stockOnHand: drug.stockOnHand + quantityToAdd
    };

    drugs[index] = updated;
    setStoredDrugs(drugs);
    return updated;
  },

  // Pharmacy Summary KPIs
  getSummary: async (): Promise<PharmacyStockSummary> => {
    const drugs = getStoredDrugs();
    const rxs = getStoredPrescriptions();

    const lowStock = drugs.filter(d => d.stockOnHand > 0 && d.stockOnHand <= d.reorderLevel).length;
    const outOfStock = drugs.filter(d => d.stockOnHand <= 0).length;
    const adequate = drugs.filter(d => d.stockOnHand > d.reorderLevel).length;

    const pending = rxs.filter(r => r.status === 'pending' || r.status === 'partially_dispensed').length;
    const dispensed = rxs.filter(r => r.status === 'dispensed').length;

    return {
      totalFormularyItems: drugs.length,
      adequateStockCount: adequate,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      totalPrescriptionsToday: rxs.length,
      pendingDispenseCount: pending,
      dispensedCount: dispensed
    };
  }
};
