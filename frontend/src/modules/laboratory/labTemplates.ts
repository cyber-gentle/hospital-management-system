import { ResultParameter } from "./types";

export interface LabTemplate {
  testCode: string;
  testName: string;
  discipline: "HEMATOLOGY" | "CHEMICAL_PATHOLOGY" | "MICROBIOLOGY" | "PARASITOLOGY";
  containerType: string;
  sampleType: string;
  parameters: Omit<ResultParameter, "value" | "flag">[];
}

export const LAB_TEMPLATES: Record<string, LabTemplate> = {
  FBC: {
    testCode: "FBC",
    testName: "Full Blood Count (FBC / CBC)",
    discipline: "HEMATOLOGY",
    containerType: "EDTA Purple Top",
    sampleType: "Whole Blood",
    parameters: [
      { name: "White Blood Cells (WBC)", unit: "x10^9/L", referenceRange: "4.0 - 11.0", lowNormal: 4.0, highNormal: 11.0, criticalLow: 1.5, criticalHigh: 30.0 },
      { name: "Red Blood Cells (RBC)", unit: "x10^12/L", referenceRange: "4.2 - 5.8", lowNormal: 4.2, highNormal: 5.8, criticalLow: 2.0, criticalHigh: 7.0 },
      { name: "Hemoglobin (Hb)", unit: "g/dL", referenceRange: "12.0 - 16.5", lowNormal: 12.0, highNormal: 16.5, criticalLow: 7.0, criticalHigh: 20.0 },
      { name: "Hematocrit (PCV)", unit: "%", referenceRange: "36.0 - 50.0", lowNormal: 36.0, highNormal: 50.0, criticalLow: 20.0, criticalHigh: 60.0 },
      { name: "Platelet Count", unit: "x10^9/L", referenceRange: "150 - 450", lowNormal: 150, highNormal: 450, criticalLow: 30, criticalHigh: 1000 },
      { name: "Neutrophils %", unit: "%", referenceRange: "40 - 75", lowNormal: 40, highNormal: 75 },
      { name: "Lymphocytes %", unit: "%", referenceRange: "20 - 45", lowNormal: 20, highNormal: 45 },
      { name: "Monocytes %", unit: "%", referenceRange: "2 - 10", lowNormal: 2, highNormal: 10 },
      { name: "Eosinophils %", unit: "%", referenceRange: "1 - 6", lowNormal: 1, highNormal: 6 }
    ]
  },

  MP: {
    testCode: "MP",
    testName: "Malaria Parasite (MP) Microscopy",
    discipline: "PARASITOLOGY",
    containerType: "EDTA Purple Top",
    sampleType: "Capillary / Venous Blood",
    parameters: [
      { name: "Plasmodium Species", unit: "text", referenceRange: "None Seen" },
      { name: "Microscopy Result", unit: "text", referenceRange: "Negative" },
      { name: "Parasite Density", unit: "parasites/uL", referenceRange: "0", lowNormal: 0, highNormal: 0, criticalHigh: 50000 },
      { name: "Trophozoite Stage", unit: "text", referenceRange: "None" }
    ]
  },

  EUCR: {
    testCode: "EUCR",
    testName: "Electrolytes, Urea & Creatinine (E/U/Cr)",
    discipline: "CHEMICAL_PATHOLOGY",
    containerType: "Plain Red Top or Lithium Heparin",
    sampleType: "Serum",
    parameters: [
      { name: "Sodium (Na+)", unit: "mmol/L", referenceRange: "135 - 145", lowNormal: 135, highNormal: 145, criticalLow: 120, criticalHigh: 160 },
      { name: "Potassium (K+)", unit: "mmol/L", referenceRange: "3.5 - 5.1", lowNormal: 3.5, highNormal: 5.1, criticalLow: 2.8, criticalHigh: 6.2 },
      { name: "Chloride (Cl-)", unit: "mmol/L", referenceRange: "98 - 108", lowNormal: 98, highNormal: 108, criticalLow: 80, criticalHigh: 125 },
      { name: "Bicarbonate (HCO3-)", unit: "mmol/L", referenceRange: "22 - 29", lowNormal: 22, highNormal: 29, criticalLow: 12, criticalHigh: 40 },
      { name: "Blood Urea", unit: "mmol/L", referenceRange: "2.5 - 6.7", lowNormal: 2.5, highNormal: 6.7, criticalHigh: 25.0 },
      { name: "Serum Creatinine", unit: "umol/L", referenceRange: "60 - 110", lowNormal: 60, highNormal: 110, criticalHigh: 350 },
      { name: "Estimated GFR (eGFR)", unit: "mL/min/1.73m2", referenceRange: "> 90", lowNormal: 90, criticalLow: 15 }
    ]
  },

  GLUCOSE: {
    testCode: "GLUCOSE",
    testName: "Blood Glucose (Fasting / Random)",
    discipline: "CHEMICAL_PATHOLOGY",
    containerType: "Fluoride Grey Top",
    sampleType: "Fluoride Plasma",
    parameters: [
      { name: "Plasma Glucose Concentration", unit: "mmol/L", referenceRange: "3.9 - 6.1 (Fasting), < 7.8 (Random)", lowNormal: 3.9, highNormal: 7.8, criticalLow: 2.5, criticalHigh: 22.0 },
      { name: "Status / State", unit: "text", referenceRange: "Fasting or Random" }
    ]
  },

  URINALYSIS: {
    testCode: "URINALYSIS",
    testName: "Urinalysis (Dipstick & Microscopy)",
    discipline: "MICROBIOLOGY",
    containerType: "Sterile Urine Cup",
    sampleType: "Clean Catch Midstream Urine",
    parameters: [
      { name: "Appearance / Color", unit: "text", referenceRange: "Clear / Amber Yellow" },
      { name: "Specific Gravity", unit: "ratio", referenceRange: "1.005 - 1.030", lowNormal: 1.005, highNormal: 1.030 },
      { name: "pH", unit: "units", referenceRange: "5.0 - 8.0", lowNormal: 5.0, highNormal: 8.0 },
      { name: "Protein", unit: "qualitative", referenceRange: "Negative" },
      { name: "Glucose", unit: "qualitative", referenceRange: "Negative" },
      { name: "Ketones", unit: "qualitative", referenceRange: "Negative" },
      { name: "Bilirubin", unit: "qualitative", referenceRange: "Negative" },
      { name: "Blood", unit: "qualitative", referenceRange: "Negative" },
      { name: "Nitrites", unit: "qualitative", referenceRange: "Negative" },
      { name: "Leukocyte Esterase", unit: "qualitative", referenceRange: "Negative" },
      { name: "Pus Cells / WBC", unit: "cells/hpf", referenceRange: "0 - 4", lowNormal: 0, highNormal: 4 },
      { name: "RBCs", unit: "cells/hpf", referenceRange: "0 - 2", lowNormal: 0, highNormal: 2 },
      { name: "Epithelial Cells", unit: "cells/hpf", referenceRange: "Occasional (0 - 5)", lowNormal: 0, highNormal: 5 },
      { name: "Casts / Crystals", unit: "text", referenceRange: "None Seen" }
    ]
  },

  LFT: {
    testCode: "LFT",
    testName: "Liver Function Tests (LFT)",
    discipline: "CHEMICAL_PATHOLOGY",
    containerType: "Plain Red Top",
    sampleType: "Serum",
    parameters: [
      { name: "Total Bilirubin", unit: "umol/L", referenceRange: "3 - 21", lowNormal: 3, highNormal: 21, criticalHigh: 85 },
      { name: "Direct (Conjugated) Bilirubin", unit: "umol/L", referenceRange: "0 - 5", lowNormal: 0, highNormal: 5 },
      { name: "ALT (SGPT)", unit: "U/L", referenceRange: "10 - 40", lowNormal: 10, highNormal: 40, criticalHigh: 500 },
      { name: "AST (SGOT)", unit: "U/L", referenceRange: "10 - 35", lowNormal: 10, highNormal: 35, criticalHigh: 500 },
      { name: "Alkaline Phosphatase (ALP)", unit: "U/L", referenceRange: "40 - 130", lowNormal: 40, highNormal: 130 },
      { name: "Total Protein", unit: "g/L", referenceRange: "60 - 80", lowNormal: 60, highNormal: 80 },
      { name: "Albumin", unit: "g/L", referenceRange: "35 - 50", lowNormal: 35, highNormal: 50, criticalLow: 20 }
    ]
  },

  WIDAL: {
    testCode: "WIDAL",
    testName: "Widal Agglutination Reaction",
    discipline: "MICROBIOLOGY",
    containerType: "Plain Red Top",
    sampleType: "Serum",
    parameters: [
      { name: "Salmonella typhi O (S. typhi O)", unit: "titer", referenceRange: "< 1:80 (Negative)" },
      { name: "Salmonella typhi H (S. typhi H)", unit: "titer", referenceRange: "< 1:80 (Negative)" },
      { name: "Salmonella paratyphi AO", unit: "titer", referenceRange: "< 1:80 (Negative)" },
      { name: "Salmonella paratyphi BO", unit: "titer", referenceRange: "< 1:80 (Negative)" }
    ]
  }
};

export const calculateFlag = (param: Omit<ResultParameter, "value" | "flag">, rawValue: string): "NORMAL" | "LOW" | "HIGH" | "CRITICAL" => {
  const val = parseFloat(rawValue);
  if (isNaN(val)) {
    const lower = rawValue.toLowerCase();
    if (lower.includes("positive") || lower.includes("+++") || lower.includes("reactive") || lower.includes("abnormal")) {
      return "HIGH";
    }
    return "NORMAL";
  }

  // Check criticals first
  if (param.criticalLow !== undefined && val <= param.criticalLow) return "CRITICAL";
  if (param.criticalHigh !== undefined && val >= param.criticalHigh) return "CRITICAL";

  // Check normal bounds
  if (param.lowNormal !== undefined && val < param.lowNormal) return "LOW";
  if (param.highNormal !== undefined && val > param.highNormal) return "HIGH";

  return "NORMAL";
};
