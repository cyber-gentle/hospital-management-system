export interface ICD10Entry {
  code: string;
  description: string;
  category: string;
  keywords?: string[];
}

export const COMMON_ICD10_CODES: ICD10Entry[] = [
  // Infectious and Parasitic
  {
    code: "B50.9",
    description: "Plasmodium falciparum malaria, unspecified",
    category: "Infectious & Parasitic",
    keywords: ["malaria", "falciparum", "fever", "parasite", "chills", "rigors"]
  },
  {
    code: "B54",
    description: "Unspecified malaria",
    category: "Infectious & Parasitic",
    keywords: ["malaria", "fever", "chills"]
  },
  {
    code: "A09",
    description: "Infectious gastroenteritis and colitis, unspecified",
    category: "Infectious & Parasitic",
    keywords: ["diarrhea", "vomiting", "stomach bug", "gastroenteritis", "food poisoning"]
  },
  {
    code: "A01.0",
    description: "Typhoid fever",
    category: "Infectious & Parasitic",
    keywords: ["typhoid", "salmonella", "enteric fever", "fever"]
  },
  {
    code: "B20",
    description: "Human immunodeficiency virus [HIV] disease",
    category: "Infectious & Parasitic",
    keywords: ["hiv", "aids", "retrovirus", "immunodeficiency"]
  },
  {
    code: "A15.0",
    description: "Tuberculosis of lung",
    category: "Infectious & Parasitic",
    keywords: ["tb", "tuberculosis", "pulmonary", "cough", "hemoptysis"]
  },
  {
    code: "B01.9",
    description: "Varicella without complication (Chickenpox)",
    category: "Infectious & Parasitic",
    keywords: ["chickenpox", "varicella", "rash", "blisters"]
  },
  {
    code: "B02.9",
    description: "Zoster without complications (Shingles)",
    category: "Infectious & Parasitic",
    keywords: ["herpes zoster", "shingles", "dermatomal rash", "neuralgia"]
  },

  // Respiratory System
  {
    code: "J00",
    description: "Acute nasopharyngitis (common cold)",
    category: "Respiratory",
    keywords: ["cold", "coryza", "runny nose", "sneezing", "congestion"]
  },
  {
    code: "J02.9",
    description: "Acute pharyngitis, unspecified",
    category: "Respiratory",
    keywords: ["sore throat", "pharyngitis", "throat infection"]
  },
  {
    code: "J03.90",
    description: "Acute tonsillitis, unspecified",
    category: "Respiratory",
    keywords: ["tonsils", "tonsillitis", "sore throat", "difficulty swallowing"]
  },
  {
    code: "J06.9",
    description: "Acute upper respiratory infection, unspecified",
    category: "Respiratory",
    keywords: ["urti", "upper respiratory", "cough", "catarrh", "cold"]
  },
  {
    code: "J18.9",
    description: "Pneumonia, unspecified organism",
    category: "Respiratory",
    keywords: ["pneumonia", "chest infection", "fever", "productive cough", "crackles"]
  },
  {
    code: "J20.9",
    description: "Acute bronchitis, unspecified",
    category: "Respiratory",
    keywords: ["bronchitis", "chest cold", "cough", "wheezing"]
  },
  {
    code: "J45.909",
    description: "Unspecified asthma, uncomplicated",
    category: "Respiratory",
    keywords: ["asthma", "wheezing", "shortness of breath", "bronchospasm"]
  },
  {
    code: "J44.9",
    description: "Chronic obstructive pulmonary disease, unspecified",
    category: "Respiratory",
    keywords: ["copd", "emphysema", "chronic bronchitis", "breathlessness"]
  },
  {
    code: "J01.90",
    description: "Acute sinusitis, unspecified",
    category: "Respiratory",
    keywords: ["sinusitis", "sinus infection", "facial pain", "nasal blockage"]
  },

  // Circulatory / Cardiovascular
  {
    code: "I10",
    description: "Essential (primary) hypertension",
    category: "Cardiovascular",
    keywords: ["hypertension", "high blood pressure", "htn", "bp"]
  },
  {
    code: "I11.9",
    description: "Hypertensive heart disease without heart failure",
    category: "Cardiovascular",
    keywords: ["hypertensive heart", "hhd", "hypertension"]
  },
  {
    code: "I20.9",
    description: "Angina pectoris, unspecified",
    category: "Cardiovascular",
    keywords: ["angina", "chest pain", "ischemia", "cardiac"]
  },
  {
    code: "I50.9",
    description: "Heart failure, unspecified",
    category: "Cardiovascular",
    keywords: ["congestive heart failure", "chf", "edema", "dyspnea"]
  },
  {
    code: "I64",
    description: "Stroke, not specified as hemorrhage or infarction",
    category: "Cardiovascular",
    keywords: ["cva", "stroke", "cerebrovascular accident", "hemiparesis"]
  },
  {
    code: "I80.209",
    description: "Deep vein thrombosis (DVT), unspecified",
    category: "Cardiovascular",
    keywords: ["dvt", "deep vein thrombosis", "leg swelling", "clot"]
  },

  // Endocrine, Nutritional & Metabolic
  {
    code: "E11.9",
    description: "Type 2 diabetes mellitus without complications",
    category: "Endocrine & Metabolic",
    keywords: ["diabetes", "t2dm", "hyperglycemia", "sugar", "insulin resistant"]
  },
  {
    code: "E10.9",
    description: "Type 1 diabetes mellitus without complications",
    category: "Endocrine & Metabolic",
    keywords: ["type 1 diabetes", "t1dm", "insulin dependent", "juvenile diabetes"]
  },
  {
    code: "E03.9",
    description: "Hypothyroidism, unspecified",
    category: "Endocrine & Metabolic",
    keywords: ["thyroid", "hypothyroid", "fatigue", "weight gain"]
  },
  {
    code: "E05.90",
    description: "Thyrotoxicosis without mentions of goiter (Hyperthyroidism)",
    category: "Endocrine & Metabolic",
    keywords: ["hyperthyroid", "thyrotoxicosis", "palpitations", "weight loss"]
  },
  {
    code: "E66.9",
    description: "Obesity, unspecified",
    category: "Endocrine & Metabolic",
    keywords: ["obesity", "overweight", "bmi", "weight"]
  },
  {
    code: "E78.5",
    description: "Hyperlipidemia, unspecified",
    category: "Endocrine & Metabolic",
    keywords: ["high cholesterol", "hypercholesterolemia", "lipids", "dyslipidemia"]
  },
  {
    code: "E86.0",
    description: "Dehydration",
    category: "Endocrine & Metabolic",
    keywords: ["dehydration", "volume depletion", "fluid deficit"]
  },

  // Digestive System
  {
    code: "K29.70",
    description: "Gastritis, unspecified, without bleeding",
    category: "Gastrointestinal",
    keywords: ["gastritis", "stomach pain", "epigastric", "indigestion", "heartburn"]
  },
  {
    code: "K21.9",
    description: "Gastro-esophageal reflux disease without esophagitis",
    category: "Gastrointestinal",
    keywords: ["gerd", "acid reflux", "heartburn", "indigestion"]
  },
  {
    code: "K25.9",
    description: "Gastric ulcer, unspecified",
    category: "Gastrointestinal",
    keywords: ["peptic ulcer", "pud", "stomach ulcer", "gastric ulcer"]
  },
  {
    code: "K35.80",
    description: "Unspecified acute appendicitis",
    category: "Gastrointestinal",
    keywords: ["appendicitis", "right lower quadrant", "rlq pain", "acute abdomen"]
  },
  {
    code: "K80.20",
    description: "Calculus of gallbladder without cholecystitis (Gallstones)",
    category: "Gastrointestinal",
    keywords: ["gallstones", "cholelithiasis", "biliary colic", "ruq pain"]
  },
  {
    code: "K58.9",
    description: "Irritable bowel syndrome without diarrhea",
    category: "Gastrointestinal",
    keywords: ["ibs", "bowel syndrome", "cramping", "bloating"]
  },
  {
    code: "K59.00",
    description: "Constipation, unspecified",
    category: "Gastrointestinal",
    keywords: ["constipation", "hard stool", "irregular bowel"]
  },
  {
    code: "K64.9",
    description: "Hemorrhoids, unspecified",
    category: "Gastrointestinal",
    keywords: ["piles", "hemorrhoids", "rectal bleeding"]
  },

  // Genitourinary System
  {
    code: "N39.0",
    description: "Urinary tract infection, site not specified",
    category: "Genitourinary",
    keywords: ["uti", "urinary infection", "dysuria", "frequency", "cystitis"]
  },
  {
    code: "N18.9",
    description: "Chronic kidney disease, unspecified",
    category: "Genitourinary",
    keywords: ["ckd", "renal failure", "kidney disease", "creatinine"]
  },
  {
    code: "N20.0",
    description: "Calculus of kidney (Kidney stones)",
    category: "Genitourinary",
    keywords: ["kidney stones", "renal calculi", "flank pain", "nephrolithiasis"]
  },
  {
    code: "N40.0",
    description: "Benign prostatic hyperplasia without lower urinary tract symptoms",
    category: "Genitourinary",
    keywords: ["bph", "prostate", "prostatic hyperplasia", "hesitancy"]
  },
  {
    code: "N76.0",
    description: "Acute vaginitis",
    category: "Genitourinary",
    keywords: ["vaginitis", "vaginal discharge", "pruritus", "yeast"]
  },
  {
    code: "N94.6",
    description: "Dysmenorrhea, unspecified",
    category: "Genitourinary",
    keywords: ["painful menses", "period cramps", "dysmenorrhea"]
  },
  {
    code: "N92.0",
    description: "Excessive and frequent menstruation with regular cycle (Menorrhagia)",
    category: "Genitourinary",
    keywords: ["heavy periods", "menorrhagia", "abnormal bleeding"]
  },

  // Musculoskeletal System
  {
    code: "M54.5",
    description: "Low back pain",
    category: "Musculoskeletal",
    keywords: ["lumbago", "backache", "lumbar strain", "back pain"]
  },
  {
    code: "M54.2",
    description: "Cervicalgia (Neck pain)",
    category: "Musculoskeletal",
    keywords: ["neck pain", "cervical sprain", "stiff neck"]
  },
  {
    code: "M25.50",
    description: "Pain in unspecified joint (Arthralgia)",
    category: "Musculoskeletal",
    keywords: ["joint pain", "arthralgia", "aching joints"]
  },
  {
    code: "M19.90",
    description: "Osteoarthritis, unspecified site",
    category: "Musculoskeletal",
    keywords: ["osteoarthritis", "oa", "degenerative joint", "arthritis"]
  },
  {
    code: "M10.9",
    description: "Gout, unspecified",
    category: "Musculoskeletal",
    keywords: ["gout", "uric acid", "podagra", "joint inflammation"]
  },
  {
    code: "M79.1",
    description: "Myalgia (Muscle pain)",
    category: "Musculoskeletal",
    keywords: ["myalgia", "muscle aches", "fibromyalgia"]
  },

  // Hematologic & Immunologic
  {
    code: "D50.9",
    description: "Iron deficiency anemia, unspecified",
    category: "Hematology",
    keywords: ["anemia", "low hemoglobin", "iron deficiency", "pallor", "fatigue"]
  },
  {
    code: "D57.1",
    description: "Sickle-cell disease without crisis",
    category: "Hematology",
    keywords: ["sickle cell", "hb ss", "hemoglobinopathy"]
  },
  {
    code: "D57.0",
    description: "Sickle-cell disease with crisis",
    category: "Hematology",
    keywords: ["sickle cell crisis", "vaso-occlusive", "bone pain"]
  },

  // Neurological & Mental
  {
    code: "G43.909",
    description: "Migraine, unspecified, not intractable",
    category: "Neurology",
    keywords: ["migraine", "hemicrania", "photophobia", "throbbing headache"]
  },
  {
    code: "G44.209",
    description: "Tension-type headache, unspecified",
    category: "Neurology",
    keywords: ["tension headache", "stress headache", "band-like pain"]
  },
  {
    code: "G40.909",
    description: "Epilepsy, unspecified",
    category: "Neurology",
    keywords: ["seizure", "convulsions", "epilepsy", "fits"]
  },
  {
    code: "F41.9",
    description: "Anxiety disorder, unspecified",
    category: "Mental Health",
    keywords: ["anxiety", "panic", "generalized anxiety", "nervousness"]
  },
  {
    code: "F32.9",
    description: "Major depressive disorder, single episode, unspecified",
    category: "Mental Health",
    keywords: ["depression", "depressive episode", "low mood", "anhedonia"]
  },
  {
    code: "G47.00",
    description: "Insomnia, unspecified",
    category: "Neurology",
    keywords: ["insomnia", "sleeplessness", "sleep disturbance"]
  },

  // Skin & Subcutaneous
  {
    code: "L03.90",
    description: "Cellulitis, unspecified",
    category: "Dermatology",
    keywords: ["cellulitis", "skin infection", "erythema", "swelling", "warmth"]
  },
  {
    code: "L20.9",
    description: "Atopic dermatitis, unspecified (Eczema)",
    category: "Dermatology",
    keywords: ["eczema", "dermatitis", "itchy rash", "atopy"]
  },
  {
    code: "L50.9",
    description: "Urticaria, unspecified (Hives)",
    category: "Dermatology",
    keywords: ["hives", "urticaria", "allergic rash", "wheals"]
  },
  {
    code: "L70.0",
    description: "Acne vulgaris",
    category: "Dermatology",
    keywords: ["acne", "pimples", "comedones", "blemishes"]
  },
  {
    code: "B35.9",
    description: "Dermatophytosis, unspecified (Fungal infection)",
    category: "Dermatology",
    keywords: ["ringworm", "tinea", "fungal rash"]
  },

  // Symptoms, Signs & General Findings
  {
    code: "R50.9",
    description: "Fever, unspecified",
    category: "Symptoms & General",
    keywords: ["pyrexia", "fever", "hyperthermia", "high temperature"]
  },
  {
    code: "R51",
    description: "Headache",
    category: "Symptoms & General",
    keywords: ["headache", "cephalalgia", "head pain"]
  },
  {
    code: "R10.9",
    description: "Abdominal pain, unspecified",
    category: "Symptoms & General",
    keywords: ["stomach pain", "tummy ache", "abdominal cramps"]
  },
  {
    code: "R11.2",
    description: "Nausea with vomiting, unspecified",
    category: "Symptoms & General",
    keywords: ["nausea", "vomiting", "emesis", "queasiness"]
  },
  {
    code: "R42",
    description: "Dizziness and giddiness",
    category: "Symptoms & General",
    keywords: ["dizziness", "vertigo", "lightheadedness", "presyncope"]
  },
  {
    code: "R05",
    description: "Cough",
    category: "Symptoms & General",
    keywords: ["cough", "dry cough", "productive cough", "throat tickle"]
  },
  {
    code: "R07.9",
    description: "Chest pain, unspecified",
    category: "Symptoms & General",
    keywords: ["chest pain", "thoracic pain", "chest discomfort"]
  },
  {
    code: "R53.83",
    description: "Other fatigue and malaise",
    category: "Symptoms & General",
    keywords: ["tiredness", "exhaustion", "fatigue", "weakness", "lethargy"]
  },

  // Injuries & Trauma
  {
    code: "S93.409A",
    description: "Sprain of unspecified ligament of ankle, initial encounter",
    category: "Trauma & Injuries",
    keywords: ["ankle sprain", "twisted ankle", "ligament injury"]
  },
  {
    code: "T14.90",
    description: "Injury, unspecified",
    category: "Trauma & Injuries",
    keywords: ["trauma", "wound", "cut", "laceration", "bruise"]
  }
];
