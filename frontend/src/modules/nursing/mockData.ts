import {
  InpatientAdmission,
  Ward,
  VitalSign,
  NursingTask,
  NursingNote,
  CarePlan,
  ShiftHandover,
  DischargeDossier
} from './types';

export const INITIAL_WARDS: Ward[] = [
  {
    id: 'ward-mmw',
    name: 'Male Medical Ward (MMW)',
    department: 'Internal Medicine',
    totalBeds: 12,
    occupiedBeds: 4,
    availableBeds: 8,
    beds: [
      { id: 'b-mmw-01', wardId: 'ward-mmw', bedNumber: 'MMW-01', status: 'occupied', currentAdmissionId: 'adm-001', patientName: 'Chidi Okafor', hospitalNumber: 'HIMS/2026/000101', acuity: 'critical', occupiedSince: '2026-09-26T08:00:00Z' },
      { id: 'b-mmw-02', wardId: 'ward-mmw', bedNumber: 'MMW-02', status: 'occupied', currentAdmissionId: 'adm-002', patientName: 'David Adeyemi', hospitalNumber: 'HIMS/2026/000103', acuity: 'high_risk', occupiedSince: '2026-09-27T10:30:00Z' },
      { id: 'b-mmw-03', wardId: 'ward-mmw', bedNumber: 'MMW-03', status: 'available' },
      { id: 'b-mmw-04', wardId: 'ward-mmw', bedNumber: 'MMW-04', status: 'occupied', currentAdmissionId: 'adm-004', patientName: 'Musa Abubakar', hospitalNumber: 'HIMS/2026/000107', acuity: 'stable', occupiedSince: '2026-09-25T14:15:00Z' },
      { id: 'b-mmw-05', wardId: 'ward-mmw', bedNumber: 'MMW-05', status: 'cleaning' },
      { id: 'b-mmw-06', wardId: 'ward-mmw', bedNumber: 'MMW-06', status: 'occupied', currentAdmissionId: 'adm-005', patientName: 'Emeka Nwosu', hospitalNumber: 'HIMS/2026/000109', acuity: 'stable', occupiedSince: '2026-09-28T09:00:00Z' },
      { id: 'b-mmw-07', wardId: 'ward-mmw', bedNumber: 'MMW-07', status: 'available' },
      { id: 'b-mmw-08', wardId: 'ward-mmw', bedNumber: 'MMW-08', status: 'available' },
      { id: 'b-mmw-09', wardId: 'ward-mmw', bedNumber: 'MMW-09', status: 'available' },
      { id: 'b-mmw-10', wardId: 'ward-mmw', bedNumber: 'MMW-10', status: 'maintenance' },
      { id: 'b-mmw-11', wardId: 'ward-mmw', bedNumber: 'MMW-11', status: 'available' },
      { id: 'b-mmw-12', wardId: 'ward-mmw', bedNumber: 'MMW-12', status: 'available' },
    ]
  },
  {
    id: 'ward-fsw',
    name: 'Female Surgical Ward (FSW)',
    department: 'General Surgery',
    totalBeds: 10,
    occupiedBeds: 2,
    availableBeds: 8,
    beds: [
      { id: 'b-fsw-01', wardId: 'ward-fsw', bedNumber: 'FSW-01', status: 'occupied', currentAdmissionId: 'adm-003', patientName: 'Amina Bello', hospitalNumber: 'HIMS/2026/000102', acuity: 'stable', occupiedSince: '2026-09-27T16:00:00Z' },
      { id: 'b-fsw-02', wardId: 'ward-fsw', bedNumber: 'FSW-02', status: 'occupied', currentAdmissionId: 'adm-006', patientName: 'Folake Adeleke', hospitalNumber: 'HIMS/2026/000104', acuity: 'high_risk', occupiedSince: '2026-09-28T07:20:00Z' },
      { id: 'b-fsw-03', wardId: 'ward-fsw', bedNumber: 'FSW-03', status: 'available' },
      { id: 'b-fsw-04', wardId: 'ward-fsw', bedNumber: 'FSW-04', status: 'available' },
      { id: 'b-fsw-05', wardId: 'ward-fsw', bedNumber: 'FSW-05', status: 'available' },
      { id: 'b-fsw-06', wardId: 'ward-fsw', bedNumber: 'FSW-06', status: 'cleaning' },
      { id: 'b-fsw-07', wardId: 'ward-fsw', bedNumber: 'FSW-07', status: 'available' },
      { id: 'b-fsw-08', wardId: 'ward-fsw', bedNumber: 'FSW-08', status: 'available' },
      { id: 'b-fsw-09', wardId: 'ward-fsw', bedNumber: 'FSW-09', status: 'available' },
      { id: 'b-fsw-10', wardId: 'ward-fsw', bedNumber: 'FSW-10', status: 'available' },
    ]
  },
  {
    id: 'ward-ae',
    name: 'A&E Resuscitation & Observation',
    department: 'Accident & Emergency',
    totalBeds: 6,
    occupiedBeds: 1,
    availableBeds: 5,
    beds: [
      { id: 'b-ae-01', wardId: 'ward-ae', bedNumber: 'A&E-RESUS-1', status: 'occupied', currentAdmissionId: 'adm-007', patientName: 'Ibrahim Danjuma', hospitalNumber: 'HIMS/2026/000110', acuity: 'critical', occupiedSince: '2026-09-28T12:00:00Z' },
      { id: 'b-ae-02', wardId: 'ward-ae', bedNumber: 'A&E-RESUS-2', status: 'available' },
      { id: 'b-ae-03', wardId: 'ward-ae', bedNumber: 'A&E-OBS-1', status: 'available' },
      { id: 'b-ae-04', wardId: 'ward-ae', bedNumber: 'A&E-OBS-2', status: 'available' },
      { id: 'b-ae-05', wardId: 'ward-ae', bedNumber: 'A&E-OBS-3', status: 'available' },
      { id: 'b-ae-06', wardId: 'ward-ae', bedNumber: 'A&E-OBS-4', status: 'available' },
    ]
  }
];

export const INITIAL_ADMISSIONS: InpatientAdmission[] = [
  {
    id: 'adm-001',
    patientId: 'p-001',
    patientName: 'Chidi Okafor',
    hospitalNumber: 'HIMS/2026/000101',
    age: 45,
    gender: 'Male',
    admissionDate: '2026-09-26T08:00:00Z',
    wardId: 'ward-mmw',
    wardName: 'Male Medical Ward (MMW)',
    bedNumber: 'MMW-01',
    admittingDoctor: 'Dr. O. Adeleke (Consultant Cardiologist)',
    primaryDiagnosis: 'Hypertensive Emergency with Acute Left Ventricular Failure',
    triageAcuity: 'critical',
    depositStatus: 'paid',
    admissionChecklist: {
      consentSigned: true,
      idWristbandApplied: true,
      allergyBandApplied: true,
      orientationCompleted: true,
      belongingsDocumented: true,
      initialVitalsDone: true,
      valuablesStorageSigned: true,
    },
    status: 'admitted',
    allergies: ['Penicillin', 'Sulphonamides'],
    resuscitationStatus: 'Full Code',
    bloodGroup: 'O+',
    tariffType: 'Cash',
    lastVitalsRecordedAt: '2026-09-28T14:30:00Z'
  },
  {
    id: 'adm-002',
    patientId: 'p-003',
    patientName: 'David Adeyemi',
    hospitalNumber: 'HIMS/2026/000103',
    age: 58,
    gender: 'Male',
    admissionDate: '2026-09-27T10:30:00Z',
    wardId: 'ward-mmw',
    wardName: 'Male Medical Ward (MMW)',
    bedNumber: 'MMW-02',
    admittingDoctor: 'Dr. N. Okonjo',
    primaryDiagnosis: 'Decompensated Type 2 Diabetes Mellitus with Right Foot Ulcer (Wagner Grade 2)',
    triageAcuity: 'high_risk',
    depositStatus: 'pending', // Soft warning flag per integration decision
    admissionChecklist: {
      consentSigned: true,
      idWristbandApplied: true,
      allergyBandApplied: false,
      orientationCompleted: true,
      belongingsDocumented: true,
      initialVitalsDone: true,
      valuablesStorageSigned: true,
    },
    status: 'admitted',
    allergies: ['None Reported'],
    resuscitationStatus: 'Full Code',
    bloodGroup: 'A+',
    tariffType: 'Cash',
    lastVitalsRecordedAt: '2026-09-28T13:00:00Z'
  },
  {
    id: 'adm-003',
    patientId: 'p-002',
    patientName: 'Amina Bello',
    hospitalNumber: 'HIMS/2026/000102',
    age: 32,
    gender: 'Female',
    admissionDate: '2026-09-27T16:00:00Z',
    wardId: 'ward-fsw',
    wardName: 'Female Surgical Ward (FSW)',
    bedNumber: 'FSW-01',
    admittingDoctor: 'Dr. K. Ibrahim (Chief Surgeon)',
    primaryDiagnosis: 'Post-operative Day 1: Laparoscopic Cholecystectomy',
    triageAcuity: 'stable',
    depositStatus: 'paid',
    admissionChecklist: {
      consentSigned: true,
      idWristbandApplied: true,
      allergyBandApplied: true,
      orientationCompleted: true,
      belongingsDocumented: true,
      initialVitalsDone: true,
      valuablesStorageSigned: true,
    },
    status: 'discharge_in_progress',
    allergies: ['NSAIDs (Bronchospasm)'],
    resuscitationStatus: 'Full Code',
    bloodGroup: 'B+',
    tariffType: 'NHIA',
    insuranceNumber: 'NHIA-88492019-A',
    lastVitalsRecordedAt: '2026-09-28T12:00:00Z'
  },
  {
    id: 'adm-004',
    patientId: 'p-007',
    patientName: 'Musa Abubakar',
    hospitalNumber: 'HIMS/2026/000107',
    age: 62,
    gender: 'Male',
    admissionDate: '2026-09-25T14:15:00Z',
    wardId: 'ward-mmw',
    wardName: 'Male Medical Ward (MMW)',
    bedNumber: 'MMW-04',
    admittingDoctor: 'Dr. C. Eze',
    primaryDiagnosis: 'Community Acquired Pneumonia (Resolving)',
    triageAcuity: 'stable',
    depositStatus: 'paid',
    admissionChecklist: {
      consentSigned: true,
      idWristbandApplied: true,
      allergyBandApplied: false,
      orientationCompleted: true,
      belongingsDocumented: true,
      initialVitalsDone: true,
      valuablesStorageSigned: false,
    },
    status: 'admitted',
    allergies: ['None Reported'],
    resuscitationStatus: 'Full Code',
    bloodGroup: 'O+',
    tariffType: 'Retainership',
    insuranceNumber: 'RET-NNPC-0092',
    lastVitalsRecordedAt: '2026-09-28T11:45:00Z'
  },
  {
    id: 'adm-006',
    patientId: 'p-004',
    patientName: 'Folake Adeleke',
    hospitalNumber: 'HIMS/2026/000104',
    age: 28,
    gender: 'Female',
    admissionDate: '2026-09-28T07:20:00Z',
    wardId: 'ward-fsw',
    wardName: 'Female Surgical Ward (FSW)',
    bedNumber: 'FSW-02',
    admittingDoctor: 'Dr. K. Ibrahim',
    primaryDiagnosis: 'Acute Appendicitis - Pre-operative Workup',
    triageAcuity: 'high_risk',
    depositStatus: 'paid',
    admissionChecklist: {
      consentSigned: true,
      idWristbandApplied: true,
      allergyBandApplied: true,
      orientationCompleted: true,
      belongingsDocumented: true,
      initialVitalsDone: true,
      valuablesStorageSigned: true,
    },
    status: 'admitted',
    allergies: ['Iodine Contrast'],
    resuscitationStatus: 'Full Code',
    bloodGroup: 'A-',
    tariffType: 'Cash',
    lastVitalsRecordedAt: '2026-09-28T14:15:00Z'
  },
  {
    id: 'adm-007',
    patientId: 'p-010',
    patientName: 'Ibrahim Danjuma',
    hospitalNumber: 'HIMS/2026/000110',
    age: 39,
    gender: 'Male',
    admissionDate: '2026-09-28T12:00:00Z',
    wardId: 'ward-ae',
    wardName: 'A&E Resuscitation & Observation',
    bedNumber: 'A&E-RESUS-1',
    admittingDoctor: 'Dr. B. Yusuf (Emergency Specialist)',
    primaryDiagnosis: 'Multiple Trauma secondary to Motor Vehicle Crash (Blunt Chest Trauma)',
    triageAcuity: 'critical',
    depositStatus: 'exempt_ae', // Emergency admission is always exempt per PRD
    admissionChecklist: {
      consentSigned: false, // Unconscious/Emergency triage
      idWristbandApplied: true,
      allergyBandApplied: false,
      orientationCompleted: false,
      belongingsDocumented: true,
      initialVitalsDone: true,
      valuablesStorageSigned: false,
    },
    status: 'admitted',
    allergies: ['Unknown'],
    resuscitationStatus: 'Full Code',
    bloodGroup: 'O-',
    tariffType: 'Cash',
    lastVitalsRecordedAt: '2026-09-28T15:10:00Z'
  }
];

export const INITIAL_VITALS: VitalSign[] = [
  {
    id: 'vit-001',
    admissionId: 'adm-001',
    patientName: 'Chidi Okafor',
    hospitalNumber: 'HIMS/2026/000101',
    recordedAt: '2026-09-28T14:30:00Z',
    recordedBy: 'Nurse B. Taiwo, RN',
    bloodPressureSystolic: 175,
    bloodPressureDiastolic: 105,
    pulseRate: 112,
    respiratoryRate: 26,
    temperature: 37.4,
    oxygenSaturation: 91,
    painScore: 5,
    consciousnessLevel: 'Alert',
    bloodGlucose: 142,
    earlyWarningScore: 7, // High NEWS2
    isAbnormal: true,
    source: 'device_stub',
    clinicalNotes: 'Connected via Mindray Bedside Monitor Port 2. Persistent bibasilar crepitations noted.'
  },
  {
    id: 'vit-002',
    admissionId: 'adm-001',
    patientName: 'Chidi Okafor',
    hospitalNumber: 'HIMS/2026/000101',
    recordedAt: '2026-09-28T10:00:00Z',
    recordedBy: 'Nurse M. Lawal, RN',
    bloodPressureSystolic: 188,
    bloodPressureDiastolic: 112,
    pulseRate: 120,
    respiratoryRate: 28,
    temperature: 37.6,
    oxygenSaturation: 89,
    painScore: 6,
    consciousnessLevel: 'Alert',
    earlyWarningScore: 9,
    isAbnormal: true,
    source: 'manual',
    clinicalNotes: 'High-flow O2 via nasal cannula 4L/min initiated.'
  },
  {
    id: 'vit-003',
    admissionId: 'adm-003',
    patientName: 'Amina Bello',
    hospitalNumber: 'HIMS/2026/000102',
    recordedAt: '2026-09-28T12:00:00Z',
    recordedBy: 'Nurse B. Taiwo, RN',
    bloodPressureSystolic: 122,
    bloodPressureDiastolic: 78,
    pulseRate: 74,
    respiratoryRate: 16,
    temperature: 36.8,
    oxygenSaturation: 98,
    painScore: 2,
    consciousnessLevel: 'Alert',
    earlyWarningScore: 0,
    isAbnormal: false,
    source: 'manual',
    clinicalNotes: 'Tolerating oral fluids, surgical port dressing clean and dry.'
  },
  {
    id: 'vit-004',
    admissionId: 'adm-002',
    patientName: 'David Adeyemi',
    hospitalNumber: 'HIMS/2026/000103',
    recordedAt: '2026-09-28T13:00:00Z',
    recordedBy: 'Nurse S. Balogun, RN',
    bloodPressureSystolic: 146,
    bloodPressureDiastolic: 92,
    pulseRate: 88,
    respiratoryRate: 18,
    temperature: 38.2,
    oxygenSaturation: 97,
    painScore: 4,
    consciousnessLevel: 'Alert',
    bloodGlucose: 245,
    earlyWarningScore: 3,
    isAbnormal: true,
    source: 'manual',
    clinicalNotes: 'Elevated fasting blood sugar and pyrexia. Wound swab taken.'
  }
];

export const INITIAL_TASKS: NursingTask[] = [
  {
    id: 'tsk-001',
    admissionId: 'adm-001',
    patientName: 'Chidi Okafor',
    bedNumber: 'MMW-01',
    wardName: 'Male Medical Ward (MMW)',
    title: 'IV Furosemide 40mg Stat & Infusion',
    description: 'Administer slow IV push over 5 minutes. Monitor hourly urine output.',
    category: 'medication',
    scheduledTime: '2026-09-28T16:00:00Z',
    status: 'pending',
    assignedNurse: 'Nurse B. Taiwo, RN',
    marLinked: true,
    medicationDetails: {
      drugName: 'Furosemide',
      dosage: '40mg',
      route: 'IV',
      frequency: 'TDS (8-hourly)',
      prescribedBy: 'Dr. O. Adeleke'
    }
  },
  {
    id: 'tsk-002',
    admissionId: 'adm-001',
    patientName: 'Chidi Okafor',
    bedNumber: 'MMW-01',
    wardName: 'Male Medical Ward (MMW)',
    title: 'Hourly Blood Pressure & SpO2 Monitoring',
    description: 'NEWS2 monitoring protocol for critical patient.',
    category: 'vitals',
    scheduledTime: '2026-09-28T15:30:00Z',
    status: 'in_progress',
    assignedNurse: 'Nurse B. Taiwo, RN',
    marLinked: false
  },
  {
    id: 'tsk-003',
    admissionId: 'adm-002',
    patientName: 'David Adeyemi',
    bedNumber: 'MMW-02',
    wardName: 'Male Medical Ward (MMW)',
    title: 'Diabetic Foot Ulcer Sterile Dressing',
    description: 'Cleanse with normal saline, apply intrasite gel and sterile gauze.',
    category: 'dressing',
    scheduledTime: '2026-09-28T16:30:00Z',
    status: 'pending',
    assignedNurse: 'Nurse S. Balogun, RN',
    marLinked: false
  },
  {
    id: 'tsk-004',
    admissionId: 'adm-003',
    patientName: 'Amina Bello',
    bedNumber: 'FSW-01',
    wardName: 'Female Surgical Ward (FSW)',
    title: 'Oral Analgesia: Paracetamol 1g PO',
    description: 'Post-op analgesia protocol as tolerated.',
    category: 'medication',
    scheduledTime: '2026-09-28T14:00:00Z',
    status: 'completed',
    assignedNurse: 'Nurse M. Lawal, RN',
    completedAt: '2026-09-28T14:05:00Z',
    completedBy: 'Nurse M. Lawal, RN',
    marLinked: true,
    medicationDetails: {
      drugName: 'Paracetamol',
      dosage: '1g (2 tablets)',
      route: 'Oral',
      frequency: 'QDS (6-hourly)',
      prescribedBy: 'Dr. K. Ibrahim'
    }
  }
];

export const INITIAL_NOTES: NursingNote[] = [
  {
    id: 'nt-001',
    admissionId: 'adm-001',
    patientName: 'Chidi Okafor',
    noteType: 'progress',
    tags: ['Cardiology', 'ICU Step-down', 'Critical'],
    content: 'Patient received sitting upright at 45 degrees. Complaining of orthopnea. Oxygen saturations fluctuating between 89% and 92% on room air; increased to 95% on 4L/min nasal cannula. IV lines patent in left antecubital fossa. Catheterized with 450ml clear amber urine draining over 4 hours.',
    writtenAt: '2026-09-28T14:40:00Z',
    authorName: 'Nurse B. Taiwo, RN',
    authorRole: 'Senior Staff Nurse (Cardiology Unit)',
    isSigned: true,
    signedAt: '2026-09-28T14:45:00Z',
    signedBy: 'Nurse B. Taiwo (RN/RM)'
  },
  {
    id: 'nt-002',
    admissionId: 'adm-003',
    patientName: 'Amina Bello',
    noteType: 'doctor_visit',
    tags: ['Surgical Ward Round', 'Discharge Plan'],
    content: 'Reviewed with Consultant Surgeon Dr. Ibrahim during morning ward rounds. Vitals stable. Abdomen soft, non-tender outside port sites. Bowel sounds present. Tolerating light diet. Cleared for discharge pending pharmacy reconciliation and discharge briefing.',
    writtenAt: '2026-09-28T11:30:00Z',
    authorName: 'Nurse M. Lawal, RN',
    authorRole: 'Ward Sister (FSW)',
    isSigned: true,
    signedAt: '2026-09-28T11:35:00Z',
    signedBy: 'Nurse M. Lawal (RN)'
  }
];

export const INITIAL_CARE_PLANS: CarePlan[] = [
  {
    id: 'cp-001',
    admissionId: 'adm-001',
    patientName: 'Chidi Okafor',
    nursingDiagnosis: 'Decreased cardiac output related to impaired ventricular contractility as evidenced by elevated BP (175/105) and bilateral crackles',
    clinicalGoal: 'Patient will maintain adequate tissue perfusion with systolic BP < 140 mmHg and SpO2 > 94% within 24 hours',
    status: 'active',
    createdAt: '2026-09-26T10:00:00Z',
    nurseInCharge: 'Nurse B. Taiwo, RN',
    interventions: [
      { id: 'int-01', description: 'Maintain patient in semi-Fowler position at 45 degrees to ease breathing', frequency: 'Continuous', status: 'active', evaluation: 'Patient reports decreased dyspnea in semi-fowler.' },
      { id: 'int-02', description: 'Administer IV diuretics as ordered and strictly record Intake & Output (Fluid Balance)', frequency: 'Every 2 hours', status: 'active', evaluation: 'Strict fluid chart maintained. Output exceeds input by 350ml.' },
      { id: 'int-03', description: 'Monitor heart rate and rhythm via bedside cardiac telemetry', frequency: 'Continuous', status: 'active', evaluation: 'Sinus tachycardia observed.' }
    ]
  }
];

export const INITIAL_SHIFTS: ShiftHandover[] = [
  {
    id: 'sh-001',
    wardId: 'ward-mmw',
    wardName: 'Male Medical Ward (MMW)',
    shift: 'morning',
    handoverDate: '2026-09-28',
    outgoingNurse: 'Nurse B. Taiwo, RN',
    incomingNurse: 'Nurse K. Oshodi, RN',
    isDualSigned: true,
    outgoingSignedAt: '2026-09-28T14:00:00Z',
    incomingSignedAt: '2026-09-28T14:10:00Z',
    generalWardNotes: 'Total 4 patients admitted on MMW. 1 critical (Bed 01, Chidi Okafor) requiring strict Q1H vitals and fluid chart. Central medical gas line pressure checked and nominal at 4.2 bar.',
    patientEndorsements: [
      {
        admissionId: 'adm-001',
        patientName: 'Chidi Okafor',
        bedNumber: 'MMW-01',
        acuity: 'critical',
        clinicalSummary: 'Hypertensive emergency with LV failure. On IV Furosemide and 4L O2.',
        pendingTasks: 'Follow up on repeat serum electrolytes from laboratory. Stat dose of IV diuretic due at 16:00.'
      },
      {
        admissionId: 'adm-002',
        patientName: 'David Adeyemi',
        bedNumber: 'MMW-02',
        acuity: 'high_risk',
        clinicalSummary: 'Diabetic foot ulcer. Blood glucose elevated at 245 mg/dL.',
        pendingTasks: 'Wound swab pending lab dispatch. Sterile dressing scheduled for 16:30.'
      }
    ]
  }
];

export const INITIAL_DISCHARGES: DischargeDossier[] = [
  {
    admissionId: 'adm-003',
    patientName: 'Amina Bello',
    hospitalNumber: 'HIMS/2026/000102',
    wardName: 'Female Surgical Ward (FSW)',
    bedNumber: 'FSW-01',
    doctorDischargeOrderSigned: true,
    doctorName: 'Dr. K. Ibrahim (Chief Surgeon)',
    orderSignedAt: '2026-09-28T10:30:00Z',
    isChecklist100Percent: false,
    hasMatronOverride: false,
    canTriggerBilling: false,
    billingTriggered: false,
    items: [
      { id: 'dc-1', label: 'Doctor discharge clinical summary finalized & signed', category: 'clinical', completed: true, mandatory: true, completedBy: 'Dr. K. Ibrahim', completedAt: '2026-09-28T10:30:00Z' },
      { id: 'dc-2', label: 'Take-Home Medications (TTO) reconciled with Pharmacy', category: 'pharmacy', completed: true, mandatory: true, completedBy: 'Pharm. U. Chukwu', completedAt: '2026-09-28T11:45:00Z' },
      { id: 'dc-3', label: 'Peripheral IV cannula & surgical drains safely removed', category: 'equipment', completed: true, mandatory: true, completedBy: 'Nurse M. Lawal', completedAt: '2026-09-28T12:15:00Z' },
      { id: 'dc-4', label: 'Patient education: wound care, red-flag symptoms & dietary advice given', category: 'education', completed: false, mandatory: true },
      { id: 'dc-5', label: 'Follow-up outpatient surgical clinic appointment date scheduled', category: 'clinical', completed: false, mandatory: true },
      { id: 'dc-6', label: 'Hospital wristband intact until gate exit clearance', category: 'clinical', completed: false, mandatory: true }
    ]
  }
];
