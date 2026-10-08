import { EmergencyPatient, EmergencyBay, StabilizationNote } from './types';

export const INITIAL_EMERGENCY_BAYS: EmergencyBay[] = [
  {
    id: 'bay-resus',
    name: 'Resuscitation Bay',
    bayType: 'RESUSCITATION',
    floorZone: 'Zone A - Critical Care Hub',
    totalBeds: 2,
    beds: [
      {
        bedId: 'resus-01',
        bedNumber: 'Resus Bay 1',
        status: 'OCCUPIED',
        currentPatientId: 'EP-2026-001',
        currentPatientName: 'Musa Abdullahi',
        triageCategory: 'RED'
      },
      {
        bedId: 'resus-02',
        bedNumber: 'Resus Bay 2',
        status: 'OCCUPIED',
        currentPatientId: 'EP-2026-006',
        currentPatientName: 'Unidentified Male (Doe #44)',
        triageCategory: 'RED'
      }
    ]
  },
  {
    id: 'bay-trauma',
    name: 'Trauma Bay',
    bayType: 'TRAUMA',
    floorZone: 'Zone B - Trauma & Surgical Entry',
    totalBeds: 3,
    beds: [
      {
        bedId: 'trauma-01',
        bedNumber: 'Trauma Bay 1',
        status: 'OCCUPIED',
        currentPatientId: 'EP-2026-002',
        currentPatientName: 'Chidinma Okafor',
        triageCategory: 'ORANGE'
      },
      {
        bedId: 'trauma-02',
        bedNumber: 'Trauma Bay 2',
        status: 'AVAILABLE'
      },
      {
        bedId: 'trauma-03',
        bedNumber: 'Trauma Bay 3',
        status: 'CLEANING'
      }
    ]
  },
  {
    id: 'bay-obs',
    name: 'Acute Observation Bay',
    bayType: 'ACUTE_OBSERVATION',
    floorZone: 'Zone C - Intermediate Monitoring',
    totalBeds: 6,
    beds: [
      {
        bedId: 'obs-01',
        bedNumber: 'Obs Bed 1',
        status: 'AVAILABLE'
      },
      {
        bedId: 'obs-02',
        bedNumber: 'Obs Bed 2',
        status: 'OCCUPIED',
        currentPatientId: 'EP-2026-003',
        currentPatientName: 'Ibrahim Danladi',
        triageCategory: 'ORANGE'
      },
      {
        bedId: 'obs-03',
        bedNumber: 'Obs Bed 3',
        status: 'AVAILABLE'
      },
      {
        bedId: 'obs-04',
        bedNumber: 'Obs Bed 4',
        status: 'OCCUPIED',
        currentPatientId: 'EP-2026-004',
        currentPatientName: 'Fatima Aliyu',
        triageCategory: 'YELLOW'
      },
      {
        bedId: 'obs-05',
        bedNumber: 'Obs Bed 5',
        status: 'AVAILABLE'
      },
      {
        bedId: 'obs-06',
        bedNumber: 'Obs Bed 6',
        status: 'AVAILABLE'
      }
    ]
  },
  {
    id: 'bay-minors',
    name: 'Fast-Track Minors Unit',
    bayType: 'FAST_TRACK_MINORS',
    floorZone: 'Zone D - Ambulatory & Suturing',
    totalBeds: 4,
    beds: [
      {
        bedId: 'minor-01',
        bedNumber: 'Couch 1',
        status: 'OCCUPIED',
        currentPatientId: 'EP-2026-005',
        currentPatientName: 'David Adeleke',
        triageCategory: 'GREEN'
      },
      {
        bedId: 'minor-02',
        bedNumber: 'Couch 2',
        status: 'AVAILABLE'
      },
      {
        bedId: 'minor-03',
        bedNumber: 'Couch 3',
        status: 'AVAILABLE'
      },
      {
        bedId: 'minor-04',
        bedNumber: 'Couch 4',
        status: 'AVAILABLE'
      }
    ]
  },
  {
    id: 'bay-iso',
    name: 'Negative Pressure Isolation',
    bayType: 'ISOLATION',
    floorZone: 'Zone E - Infection Barrier',
    totalBeds: 1,
    beds: [
      {
        bedId: 'iso-01',
        bedNumber: 'Iso Bay 1',
        status: 'AVAILABLE'
      }
    ]
  }
];

export const INITIAL_EMERGENCY_PATIENTS: EmergencyPatient[] = [
  {
    id: 'EP-2026-001',
    hospitalNumber: 'HIMS-2026-00891',
    patientName: 'Musa Abdullahi',
    isUnidentifiedJohnDoe: false,
    age: 28,
    gender: 'MALE',
    arrivalTime: '2026-10-08T11:15:00Z',
    arrivalMode: 'AMBULANCE',
    triageCategory: 'RED',
    triageNurse: 'Staff Nurse B. Garba (RN)',
    chiefComplaint: 'Major polytrauma post-motor vehicle accident. Severe hemorrhagic shock & blunt abdominal trauma.',
    vitals: {
      heartRate: 138,
      systolicBp: 75,
      diastolicBp: 42,
      respiratoryRate: 32,
      spo2: 88,
      temperature: 35.6,
      gcs: 7,
      bloodGlucose: 6.2,
      painScore: 10
    },
    assignedBayId: 'bay-resus',
    assignedBayName: 'Resuscitation Bay',
    assignedBedNumber: 'Resus Bay 1',
    status: 'IN_RESUS',
    zeroDepositWaived: true,
    primarySurvey: {
      airway: 'INTUBATED',
      airwayIntervention: 'Rapid Sequence Intubation with 7.5mm cuffed ETT at 22cm lips',
      cSpinePrecautions: true,
      breathing: 'MECHANICAL_VENTILATION',
      oxygenDelivery: 'Hamilton T1 Transport Ventilator FiO2 1.0',
      circulation: 'WEAK_THREADY',
      capillaryRefillSeconds: 4,
      ivAccessSites: ['16G Left Antecubital', '16G Right Forearm', 'Cordis Sheath Right Femoral'],
      disabilityPupils: 'SLUGGISH',
      disabilityMotorResponse: 'Withdrawal to pain, localized left limb posturing',
      exposureFindings: 'Massive pelvic instability with pelvic binder applied. Abdomen rigid, distended.',
      activeHemorrhageControlled: true
    },
    medicationsAdministered: [
      {
        id: 'med-01',
        drugName: 'Tranexamic Acid (TXA)',
        dose: '1g IV in 100mL Normal Saline over 10 min',
        route: 'IV_INFUSION',
        administeredAt: '2026-10-08T11:22:00Z',
        administeredBy: 'Nurse B. Garba',
        indication: 'CRASH-2 Protocol for severe hemorrhagic trauma'
      },
      {
        id: 'med-02',
        drugName: 'O-Negative Packed Red Blood Cells (PRBC)',
        dose: '2 Units Uncrossmatched via Rapid Infuser',
        route: 'IV_INFUSION',
        administeredAt: '2026-10-08T11:28:00Z',
        administeredBy: 'Dr. K. Bello',
        indication: 'Massive Transfusion Protocol Activation'
      }
    ],
    attendingDoctor: 'Dr. K. Bello (Emergency Consultant)',
    dispositionNotes: 'Emergency FAST positive in Morrison pouch and splenorenal recess. Immediate booking for Emergency Exploratory Laparotomy in Main OR 1.',
    updatedAt: '2026-10-08T11:45:00Z'
  },
  {
    id: 'EP-2026-002',
    hospitalNumber: 'HIMS-2026-00452',
    patientName: 'Chidinma Okafor',
    isUnidentifiedJohnDoe: false,
    age: 54,
    gender: 'FEMALE',
    arrivalTime: '2026-10-08T11:30:00Z',
    arrivalMode: 'WALK_IN',
    triageCategory: 'ORANGE',
    triageNurse: 'Nurse P. Eze (RN)',
    chiefComplaint: 'Acute retrosternal crushing chest pain radiating to left jaw, diaphoresis and acute shortness of breath x 2 hours.',
    vitals: {
      heartRate: 104,
      systolicBp: 168,
      diastolicBp: 98,
      respiratoryRate: 24,
      spo2: 92,
      temperature: 36.8,
      gcs: 15,
      bloodGlucose: 7.8,
      painScore: 9
    },
    assignedBayId: 'bay-trauma',
    assignedBayName: 'Trauma Bay',
    assignedBedNumber: 'Trauma Bay 1',
    status: 'OBSERVATION',
    zeroDepositWaived: true,
    primarySurvey: {
      airway: 'PATENT',
      cSpinePrecautions: false,
      breathing: 'TACHYPNEIC',
      oxygenDelivery: '4L/min via Nasal Cannula',
      circulation: 'STRONG_RADIAL',
      capillaryRefillSeconds: 2,
      ivAccessSites: ['18G Right Antecubital'],
      disabilityPupils: 'EQUAL_REACTIVE',
      disabilityMotorResponse: 'Normal symmetrical motor function',
      exposureFindings: 'Diaphoretic, cold extremities, no trauma marks',
      activeHemorrhageControlled: true
    },
    medicationsAdministered: [
      {
        id: 'med-03',
        drugName: 'Aspirin (Soluble)',
        dose: '300mg orally chewed',
        route: 'IV_PUSH',
        administeredAt: '2026-10-08T11:35:00Z',
        administeredBy: 'Nurse P. Eze',
        indication: 'Acute Coronary Syndrome Loading'
      },
      {
        id: 'med-04',
        drugName: 'Clopidogrel',
        dose: '300mg oral loading',
        route: 'IV_PUSH',
        administeredAt: '2026-10-08T11:36:00Z',
        administeredBy: 'Nurse P. Eze',
        indication: 'Dual Antiplatelet Therapy'
      },
      {
        id: 'med-05',
        drugName: 'Glyceryl Trinitrate (GTN)',
        dose: '500mcg sublingual tablet',
        route: 'IV_PUSH',
        administeredAt: '2026-10-08T11:38:00Z',
        administeredBy: 'Dr. A. Sanusi',
        indication: 'Coronary Vasodilation / Pain Relief'
      }
    ],
    attendingDoctor: 'Dr. A. Sanusi (Cardiology Registrar on-call)',
    dispositionNotes: '12-lead ECG demonstrates ST-elevation in leads V2-V4 (Anterior STEMI). Preparing urgent cardiology ICU admission and coronary care protocol.',
    updatedAt: '2026-10-08T11:50:00Z'
  },
  {
    id: 'EP-2026-003',
    hospitalNumber: 'HIMS-2026-00109',
    patientName: 'Ibrahim Danladi',
    isUnidentifiedJohnDoe: false,
    age: 19,
    gender: 'MALE',
    arrivalTime: '2026-10-08T11:40:00Z',
    arrivalMode: 'WALK_IN',
    triageCategory: 'ORANGE',
    triageNurse: 'Staff Nurse B. Garba (RN)',
    chiefComplaint: 'Acute severe asthma attack, speaking in single words, widespread expiratory wheeze, failed home inhaler.',
    vitals: {
      heartRate: 122,
      systolicBp: 130,
      diastolicBp: 82,
      respiratoryRate: 34,
      spo2: 89,
      temperature: 37.1,
      gcs: 15,
      bloodGlucose: 5.5,
      painScore: 5
    },
    assignedBayId: 'bay-obs',
    assignedBayName: 'Acute Observation Bay',
    assignedBedNumber: 'Obs Bed 2',
    status: 'OBSERVATION',
    zeroDepositWaived: true,
    medicationsAdministered: [
      {
        id: 'med-06',
        drugName: 'Salbutamol + Ipratropium Bromide',
        dose: '5mg / 0.5mg driven by 8L O2',
        route: 'NEBULIZED',
        administeredAt: '2026-10-08T11:42:00Z',
        administeredBy: 'Nurse B. Garba',
        indication: 'Severe bronchodilation'
      },
      {
        id: 'med-07',
        drugName: 'Hydrocortisone Sodium Succinate',
        dose: '200mg IV stat',
        route: 'IV_PUSH',
        administeredAt: '2026-10-08T11:45:00Z',
        administeredBy: 'Nurse B. Garba',
        indication: 'Acute anti-inflammatory asthma steroid therapy'
      }
    ],
    attendingDoctor: 'Dr. F. Okoro (ED Medical Officer)',
    updatedAt: '2026-10-08T11:55:00Z'
  },
  {
    id: 'EP-2026-004',
    hospitalNumber: 'HIMS-2026-00783',
    patientName: 'Fatima Aliyu',
    isUnidentifiedJohnDoe: false,
    age: 23,
    gender: 'FEMALE',
    arrivalTime: '2026-10-08T10:50:00Z',
    arrivalMode: 'WALK_IN',
    triageCategory: 'YELLOW',
    triageNurse: 'Nurse P. Eze (RN)',
    chiefComplaint: 'Right iliac fossa pain worsening over 18 hours, anorexia, nausea, and low-grade pyrexia. Positive McBurney rebound tenderness.',
    vitals: {
      heartRate: 98,
      systolicBp: 118,
      diastolicBp: 74,
      respiratoryRate: 20,
      spo2: 98,
      temperature: 38.6,
      gcs: 15,
      bloodGlucose: 5.9,
      painScore: 7
    },
    assignedBayId: 'bay-obs',
    assignedBayName: 'Acute Observation Bay',
    assignedBedNumber: 'Obs Bed 4',
    status: 'OBSERVATION',
    zeroDepositWaived: true,
    medicationsAdministered: [
      {
        id: 'med-08',
        drugName: 'Paracetamol IV Infusion',
        dose: '1g IV piggyback',
        route: 'IV_INFUSION',
        administeredAt: '2026-10-08T11:05:00Z',
        administeredBy: 'Nurse P. Eze',
        indication: 'Antipyresis and visceral pain relief'
      }
    ],
    attendingDoctor: 'Dr. M. Sani (General Surgery SHO)',
    dispositionNotes: 'Surgical consult evaluated: acute appendicitis. IV Ceftriaxone & Metronidazole ordered; booking surgical queue.',
    updatedAt: '2026-10-08T11:30:00Z'
  },
  {
    id: 'EP-2026-005',
    hospitalNumber: 'HIMS-2026-00912',
    patientName: 'David Adeleke',
    isUnidentifiedJohnDoe: false,
    age: 35,
    gender: 'MALE',
    arrivalTime: '2026-10-08T11:20:00Z',
    arrivalMode: 'WALK_IN',
    triageCategory: 'GREEN',
    triageNurse: 'Staff Nurse B. Garba (RN)',
    chiefComplaint: '5cm jagged laceration over dorsal left forearm with minor venous ooze following glass break at work. Distal pulse intact.',
    vitals: {
      heartRate: 78,
      systolicBp: 124,
      diastolicBp: 80,
      respiratoryRate: 16,
      spo2: 99,
      temperature: 36.6,
      gcs: 15,
      bloodGlucose: 5.1,
      painScore: 4
    },
    assignedBayId: 'bay-minors',
    assignedBayName: 'Fast-Track Minors Unit',
    assignedBedNumber: 'Couch 1',
    status: 'TRIAGED',
    zeroDepositWaived: true,
    medicationsAdministered: [
      {
        id: 'med-09',
        drugName: 'Tetanus Toxoid Vaccine',
        dose: '0.5mL IM deep into deltoid',
        route: 'IM',
        administeredAt: '2026-10-08T11:25:00Z',
        administeredBy: 'Nurse B. Garba',
        indication: 'Tetanus prophylaxis post-contaminated wound'
      }
    ],
    attendingDoctor: 'Dr. F. Okoro (ED Medical Officer)',
    dispositionNotes: 'Awaiting local lidocaine infiltration and 3-0 nylon interrupted suturing.',
    updatedAt: '2026-10-08T11:40:00Z'
  },
  {
    id: 'EP-2026-006',
    hospitalNumber: 'HIMS-EMERG-UNKNOWN-44',
    patientName: 'Unidentified Male (Doe #44)',
    isUnidentifiedJohnDoe: true,
    age: 45,
    gender: 'MALE',
    arrivalTime: '2026-10-08T11:45:00Z',
    arrivalMode: 'POLICE_BYSTANDER',
    triageCategory: 'RED',
    triageNurse: 'Staff Nurse B. Garba (RN)',
    chiefComplaint: 'Found unconscious on roadside by Federal Road Safety Corps (FRSC). Profoundly unresponsive, clammy, no identification documents.',
    vitals: {
      heartRate: 110,
      systolicBp: 92,
      diastolicBp: 56,
      respiratoryRate: 14,
      spo2: 94,
      temperature: 35.8,
      gcs: 5,
      bloodGlucose: 1.4, // Profound hypoglycemia!
      painScore: 0
    },
    assignedBayId: 'bay-resus',
    assignedBayName: 'Resuscitation Bay',
    assignedBedNumber: 'Resus Bay 2',
    status: 'IN_RESUS',
    zeroDepositWaived: true,
    primarySurvey: {
      airway: 'AT_RISK',
      airwayIntervention: 'Guedel oropharyngeal airway inserted; suctioned secretions',
      cSpinePrecautions: true,
      breathing: 'NORMAL',
      oxygenDelivery: '10L/min Face Mask with Reservoir',
      circulation: 'STRONG_RADIAL',
      capillaryRefillSeconds: 3,
      ivAccessSites: ['18G Left Forearm'],
      disabilityPupils: 'EQUAL_REACTIVE',
      disabilityMotorResponse: 'Slow extensor response to pain',
      exposureFindings: 'Hypothermic skin, no major fractures on quick palpation',
      activeHemorrhageControlled: true
    },
    medicationsAdministered: [
      {
        id: 'med-10',
        drugName: '50% Dextrose in Water (D50W)',
        dose: '50mL IV push stat',
        route: 'IV_PUSH',
        administeredAt: '2026-10-08T11:48:00Z',
        administeredBy: 'Dr. K. Bello',
        indication: 'Profound neuroglycopenia / Hypoglycemic coma'
      },
      {
        id: 'med-11',
        drugName: 'Thiamine (Vitamin B1)',
        dose: '100mg IV in 100mL Saline',
        route: 'IV_INFUSION',
        administeredAt: '2026-10-08T11:50:00Z',
        administeredBy: 'Dr. K. Bello',
        indication: 'Wernicke encephalopathy prevention'
      }
    ],
    attendingDoctor: 'Dr. K. Bello (Emergency Consultant)',
    dispositionNotes: 'Post-D50 administration blood glucose rechecked at 5.8 mmol/L. Patient began opening eyes, GCS improved to 11. Police contact notified for family tracing.',
    updatedAt: '2026-10-08T11:58:00Z'
  }
];

export const INITIAL_STABILIZATION_NOTES: StabilizationNote[] = [
  {
    id: 'NOTE-AE-001',
    emergencyPatientId: 'EP-2026-001',
    patientName: 'Musa Abdullahi',
    hospitalNumber: 'HIMS-2026-00891',
    recordedAt: '2026-10-08T11:45:00Z',
    clinicianName: 'Dr. K. Bello',
    clinicianRole: 'Emergency Medicine Consultant',
    primarySurvey: {
      airway: 'INTUBATED',
      airwayIntervention: 'Rapid Sequence Intubation with 7.5mm cuffed ETT at 22cm lips',
      cSpinePrecautions: true,
      breathing: 'MECHANICAL_VENTILATION',
      oxygenDelivery: 'Hamilton T1 Transport Ventilator FiO2 1.0',
      circulation: 'WEAK_THREADY',
      capillaryRefillSeconds: 4,
      ivAccessSites: ['16G Left Antecubital', '16G Right Forearm', 'Cordis Sheath Right Femoral'],
      disabilityPupils: 'SLUGGISH',
      disabilityMotorResponse: 'Withdrawal to pain, localized left limb posturing',
      exposureFindings: 'Massive pelvic instability with pelvic binder applied. Abdomen rigid, distended.',
      activeHemorrhageControlled: true
    },
    interventionSummary: 'Patient arrived in profound hemorrhagic shock following high-speed RTA. Immediate RSI executed due to GCS 7 and airway collapse. Bilateral large-bore peripheral access secured. Resuscitation initiated with Tranexamic Acid and uncrossmatched O-negative PRBC. Pelvic binder placed.',
    crashMeds: [
      {
        id: 'med-01',
        drugName: 'Tranexamic Acid (TXA)',
        dose: '1g IV in 100mL Normal Saline over 10 min',
        route: 'IV_INFUSION',
        administeredAt: '2026-10-08T11:22:00Z',
        administeredBy: 'Nurse B. Garba',
        indication: 'CRASH-2 Protocol for severe hemorrhagic trauma'
      },
      {
        id: 'med-02',
        drugName: 'O-Negative Packed Red Blood Cells (PRBC)',
        dose: '2 Units Uncrossmatched via Rapid Infuser',
        route: 'IV_INFUSION',
        administeredAt: '2026-10-08T11:28:00Z',
        administeredBy: 'Dr. K. Bello',
        indication: 'Massive Transfusion Protocol Activation'
      }
    ],
    disposition: 'EMERGENCY_OR',
    dispositionDestination: 'Main Operating Theatre 1 (Exploratory Laparotomy)',
    clinicalHandoverSummary: 'FAST exam strongly positive for free hemoperitoneum. Lead Surgeon Dr. A. Danbaba notified and scrubbed. Transferring directly from Resus Bay 1 to Main Theatre 1 with blood infuser running.'
  }
];
