import { LabOrder } from "./types";

export const MOCK_LAB_ORDERS: LabOrder[] = [
  {
    id: "lab_01",
    orderNumber: "LAB-2026-00101",
    patientId: "pat_03",
    patientName: "Babajide Adeleke",
    hospitalNumber: "HIMS-2026-0003",
    age: 58,
    gender: "Male",
    orderingDoctor: "Dr. K. Bello, FWACS",
    originDepartment: "GOPD",
    clinicalNotes: "High fever for 3 days with intense frontal headache and shivering. Rule out malaria.",
    urgency: "URGENT",
    discipline: "PARASITOLOGY",
    testName: "Malaria Parasite (MP) Microscopy",
    testCode: "MP",
    status: "PENDING_COLLECTION",
    createdAt: new Date(Date.now() - 35 * 60000).toISOString()
  },
  {
    id: "lab_02",
    orderNumber: "LAB-2026-00102",
    patientId: "pat_03",
    patientName: "Babajide Adeleke",
    hospitalNumber: "HIMS-2026-0003",
    age: 58,
    gender: "Male",
    orderingDoctor: "Dr. K. Bello, FWACS",
    originDepartment: "GOPD",
    clinicalNotes: "Leukocytosis check, febrile illness evaluation.",
    urgency: "URGENT",
    discipline: "HEMATOLOGY",
    testName: "Full Blood Count (FBC / CBC)",
    testCode: "FBC",
    status: "SPECIMEN_COLLECTED",
    specimen: {
      specimenBarcode: "SMP-78219",
      sampleType: "Whole Blood",
      containerType: "EDTA Purple Top",
      collectedAt: new Date(Date.now() - 20 * 60000).toISOString(),
      collectedBy: "Phleb. T. Ajayi"
    },
    createdAt: new Date(Date.now() - 35 * 60000).toISOString()
  },
  {
    id: "lab_03",
    orderNumber: "LAB-2026-00103",
    patientId: "pat_05",
    patientName: "Emeka Eze",
    hospitalNumber: "HIMS-2026-0005",
    age: 67,
    gender: "Male",
    orderingDoctor: "Dr. A. Nnamdi",
    originDepartment: "EMERGENCY",
    clinicalNotes: "Acute substernal chest discomfort, known hypertensive. Check baseline renal and electrolytes.",
    urgency: "STAT",
    discipline: "CHEMICAL_PATHOLOGY",
    testName: "Electrolytes, Urea & Creatinine (E/U/Cr)",
    testCode: "EUCR",
    status: "IN_ANALYSIS",
    specimen: {
      specimenBarcode: "SMP-78220",
      sampleType: "Serum",
      containerType: "Plain Red Top",
      collectedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      collectedBy: "Phleb. T. Ajayi"
    },
    results: {
      enteredBy: "MLS O. Balogun, BMLS",
      enteredAt: new Date(Date.now() - 10 * 60000).toISOString(),
      parameters: [
        { name: "Sodium (Na+)", value: "138", unit: "mmol/L", referenceRange: "135 - 145", flag: "NORMAL" },
        { name: "Potassium (K+)", value: "5.8", unit: "mmol/L", referenceRange: "3.5 - 5.1", flag: "HIGH", criticalHigh: 6.2 },
        { name: "Chloride (Cl-)", value: "101", unit: "mmol/L", referenceRange: "98 - 108", flag: "NORMAL" },
        { name: "Bicarbonate (HCO3-)", value: "24", unit: "mmol/L", referenceRange: "22 - 29", flag: "NORMAL" },
        { name: "Blood Urea", value: "14.2", unit: "mmol/L", referenceRange: "2.5 - 6.7", flag: "HIGH" },
        { name: "Serum Creatinine", value: "185", unit: "umol/L", referenceRange: "60 - 110", flag: "HIGH" },
        { name: "Estimated GFR (eGFR)", value: "34", unit: "mL/min/1.73m2", referenceRange: "> 90", flag: "LOW" }
      ]
    },
    createdAt: new Date(Date.now() - 40 * 60000).toISOString()
  },
  {
    id: "lab_04",
    orderNumber: "LAB-2026-00104",
    patientId: "pat_02",
    patientName: "Chioma Okonkwo",
    hospitalNumber: "HIMS-2026-0002",
    age: 29,
    gender: "Female",
    orderingDoctor: "Dr. K. Bello, FWACS",
    originDepartment: "GOPD",
    clinicalNotes: "Dysuria, increased urinary frequency. Suspected acute cystitis.",
    urgency: "ROUTINE",
    discipline: "MICROBIOLOGY",
    testName: "Urinalysis (Dipstick & Microscopy)",
    testCode: "URINALYSIS",
    status: "AWAITING_VERIFICATION",
    specimen: {
      specimenBarcode: "SMP-78221",
      sampleType: "Clean Catch Midstream Urine",
      containerType: "Sterile Urine Cup",
      collectedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      collectedBy: "Nurse B. Taiwo, RN"
    },
    results: {
      enteredBy: "MLS C. Eze, BMLS",
      enteredAt: new Date(Date.now() - 15 * 60000).toISOString(),
      parameters: [
        { name: "Appearance / Color", value: "Turbid / Pale Yellow", unit: "text", referenceRange: "Clear / Amber Yellow", flag: "NORMAL" },
        { name: "Specific Gravity", value: "1.020", unit: "ratio", referenceRange: "1.005 - 1.030", flag: "NORMAL" },
        { name: "pH", value: "6.5", unit: "units", referenceRange: "5.0 - 8.0", flag: "NORMAL" },
        { name: "Protein", value: "Trace", unit: "qualitative", referenceRange: "Negative", flag: "NORMAL" },
        { name: "Glucose", value: "Negative", unit: "qualitative", referenceRange: "Negative", flag: "NORMAL" },
        { name: "Blood", value: "Moderate (++ / 50 Ery/uL)", unit: "qualitative", referenceRange: "Negative", flag: "HIGH" },
        { name: "Nitrites", value: "Positive (+)", unit: "qualitative", referenceRange: "Negative", flag: "HIGH" },
        { name: "Leukocyte Esterase", value: "Large (+++ / 500 Leu/uL)", unit: "qualitative", referenceRange: "Negative", flag: "HIGH" },
        { name: "Pus Cells / WBC", value: "25 - 30", unit: "cells/hpf", referenceRange: "0 - 4", flag: "HIGH" },
        { name: "RBCs", value: "8 - 10", unit: "cells/hpf", referenceRange: "0 - 2", flag: "HIGH" },
        { name: "Epithelial Cells", value: "3 - 5", unit: "cells/hpf", referenceRange: "Occasional (0 - 5)", flag: "NORMAL" },
        { name: "Casts / Crystals", value: "Occasional calcium oxalate", unit: "text", referenceRange: "None Seen", flag: "NORMAL" }
      ]
    },
    createdAt: new Date(Date.now() - 60 * 60000).toISOString()
  },
  {
    id: "lab_05",
    orderNumber: "LAB-2026-00098",
    patientId: "pat_04",
    patientName: "Fatima Garba",
    hospitalNumber: "HIMS-2026-0004",
    age: 34,
    gender: "Female",
    orderingDoctor: "Dr. S. Danladi",
    originDepartment: "GOPD",
    clinicalNotes: "Routine diabetes screening and fasting check.",
    urgency: "ROUTINE",
    discipline: "CHEMICAL_PATHOLOGY",
    testName: "Blood Glucose (Fasting / Random)",
    testCode: "GLUCOSE",
    status: "COMPLETED",
    specimen: {
      specimenBarcode: "SMP-78190",
      sampleType: "Fluoride Plasma",
      containerType: "Fluoride Grey Top",
      collectedAt: new Date(Date.now() - 180 * 60000).toISOString(),
      collectedBy: "Phleb. T. Ajayi"
    },
    results: {
      enteredBy: "MLS O. Balogun, BMLS",
      enteredAt: new Date(Date.now() - 150 * 60000).toISOString(),
      verifiedBy: "Dr. F. Alabi, FMCPath (Consultant Chemical Pathologist)",
      verifiedAt: new Date(Date.now() - 140 * 60000).toISOString(),
      pathologistComment: "Plasma glucose concentration is within normal non-diabetic fasting limits. Continue routine annual check.",
      parameters: [
        { name: "Plasma Glucose Concentration", value: "5.2", unit: "mmol/L", referenceRange: "3.9 - 6.1 (Fasting), < 7.8 (Random)", flag: "NORMAL" },
        { name: "Status / State", value: "Fasting (8 hours)", unit: "text", referenceRange: "Fasting or Random", flag: "NORMAL" }
      ]
    },
    createdAt: new Date(Date.now() - 200 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 140 * 60000).toISOString()
  },
  {
    id: "lab_06",
    orderNumber: "LAB-2026-00105",
    patientId: "pat_01",
    patientName: "Adekunle Ibrahim",
    hospitalNumber: "HIMS-2026-0001",
    age: 45,
    gender: "Male",
    orderingDoctor: "Dr. K. Bello, FWACS",
    originDepartment: "GOPD",
    clinicalNotes: "Persistent abdominal cramps and low grade fever. Check Widal reaction.",
    urgency: "ROUTINE",
    discipline: "MICROBIOLOGY",
    testName: "Widal Agglutination Reaction",
    testCode: "WIDAL",
    status: "PENDING_COLLECTION",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  }
];
