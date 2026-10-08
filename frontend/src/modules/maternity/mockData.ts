import { AncProfile, DeliveryRecord, PncCheckup } from './types';

export const INITIAL_ANC_PROFILES: AncProfile[] = [
  {
    id: 'ANC-2026-001',
    patientId: 'P-001',
    hospitalNumber: 'HIMS-2026-00341',
    patientName: 'Aisha Bello',
    age: 26,
    phone: '+234 803 111 2233',
    gravida: 2,
    para: 1,
    living: 1,
    abortions: 0,
    lmpDate: '2026-01-15',
    eddDate: '2026-10-22',
    currentGestationalAgeWeeks: 38,
    bloodGroup: 'O+',
    genotype: 'AA',
    hivStatus: 'NEGATIVE',
    hepatitisBStatus: 'NEGATIVE',
    vdrlRprStatus: 'NON_REACTIVE',
    tetanusToxoidDoses: 3,
    iptpMalariaDoses: 2,
    riskLevel: 'LOW_RISK',
    riskFactors: [],
    status: 'IN_LABOR',
    visits: [
      {
        id: 'VIS-001',
        visitDate: '2026-05-10',
        gestationalAgeWeeks: 16,
        fundalHeightCm: 16,
        fetalHeartRateBpm: 144,
        fetalPresentation: 'UNSTABLE',
        maternalBloodPressure: '110/70',
        maternalWeightKg: 62.5,
        urineProtein: 'NIL',
        urineGlucose: 'NIL',
        hemoglobinGdl: 11.8,
        complaintsAndNotes: 'Booking visit. Mild morning sickness resolved. Iron & Folate prescribed.',
        clinicianName: 'Midwife H. Danjuma',
        nextAppointmentDate: '2026-06-07'
      },
      {
        id: 'VIS-002',
        visitDate: '2026-08-20',
        gestationalAgeWeeks: 31,
        fundalHeightCm: 31,
        fetalHeartRateBpm: 140,
        fetalPresentation: 'CEPHALIC',
        maternalBloodPressure: '116/74',
        maternalWeightKg: 68.0,
        urineProtein: 'NIL',
        urineGlucose: 'NIL',
        hemoglobinGdl: 12.1,
        complaintsAndNotes: 'Good fetal movements felt. Tetanus Toxoid dose 2 given.',
        clinicianName: 'Dr. S. Okon',
        nextAppointmentDate: '2026-09-15'
      },
      {
        id: 'VIS-003',
        visitDate: '2026-10-01',
        gestationalAgeWeeks: 37,
        fundalHeightCm: 36,
        fetalHeartRateBpm: 138,
        fetalPresentation: 'CEPHALIC',
        maternalBloodPressure: '120/78',
        maternalWeightKg: 71.2,
        urineProtein: 'NIL',
        urineGlucose: 'NIL',
        hemoglobinGdl: 12.0,
        complaintsAndNotes: 'Head engaged. Birth preparedness plan reviewed with partner.',
        clinicianName: 'Dr. S. Okon',
        nextAppointmentDate: '2026-10-15'
      }
    ]
  },
  {
    id: 'ANC-2026-002',
    patientId: 'P-002',
    hospitalNumber: 'HIMS-2026-00412',
    patientName: 'Grace Chukwu',
    age: 34,
    phone: '+234 802 444 5566',
    gravida: 4,
    para: 2,
    living: 2,
    abortions: 1,
    lmpDate: '2026-02-10',
    eddDate: '2026-11-17',
    currentGestationalAgeWeeks: 34,
    bloodGroup: 'B+',
    genotype: 'AS',
    hivStatus: 'NEGATIVE',
    hepatitisBStatus: 'NEGATIVE',
    vdrlRprStatus: 'NON_REACTIVE',
    tetanusToxoidDoses: 4,
    iptpMalariaDoses: 3,
    riskLevel: 'HIGH_RISK',
    riskFactors: ['Chronic Gestational Hypertension', 'Previous Cesarean Section'],
    status: 'ANC_ACTIVE',
    visits: [
      {
        id: 'VIS-004',
        visitDate: '2026-09-28',
        gestationalAgeWeeks: 33,
        fundalHeightCm: 33,
        fetalHeartRateBpm: 148,
        fetalPresentation: 'CEPHALIC',
        maternalBloodPressure: '142/92',
        maternalWeightKg: 78.5,
        urineProtein: '1+',
        urineGlucose: 'NIL',
        hemoglobinGdl: 10.9,
        complaintsAndNotes: 'Blood pressure elevated. Initiated on oral Methyldopa 250mg tds. Close weekly monitoring ordered.',
        clinicianName: 'Dr. M. Kalu (Consultant Obstetrician)',
        nextAppointmentDate: '2026-10-12'
      }
    ]
  },
  {
    id: 'ANC-2026-003',
    patientId: 'P-003',
    hospitalNumber: 'HIMS-2026-00789',
    patientName: 'Zainab Usman',
    age: 22,
    phone: '+234 816 777 8899',
    gravida: 1,
    para: 0,
    living: 0,
    abortions: 0,
    lmpDate: '2026-01-02',
    eddDate: '2026-10-09',
    currentGestationalAgeWeeks: 40,
    bloodGroup: 'O+',
    genotype: 'AA',
    hivStatus: 'NEGATIVE',
    hepatitisBStatus: 'NEGATIVE',
    vdrlRprStatus: 'NON_REACTIVE',
    tetanusToxoidDoses: 2,
    iptpMalariaDoses: 2,
    riskLevel: 'LOW_RISK',
    riskFactors: ['Primigravida at Term'],
    status: 'DELIVERED_PNC',
    visits: [
      {
        id: 'VIS-005',
        visitDate: '2026-09-22',
        gestationalAgeWeeks: 38,
        fundalHeightCm: 37,
        fetalHeartRateBpm: 142,
        fetalPresentation: 'CEPHALIC',
        maternalBloodPressure: '114/72',
        maternalWeightKg: 64.0,
        urineProtein: 'NIL',
        urineGlucose: 'NIL',
        hemoglobinGdl: 11.5,
        complaintsAndNotes: 'Term pregnancy. Mild braxton-hicks contractions. Reassured.',
        clinicianName: 'Midwife H. Danjuma',
        nextAppointmentDate: '2026-10-06'
      }
    ]
  },
  {
    id: 'ANC-2026-004',
    patientId: 'P-004',
    hospitalNumber: 'HIMS-2026-00902',
    patientName: 'Blessing Adeyemi',
    age: 29,
    phone: '+234 809 333 4455',
    gravida: 2,
    para: 1,
    living: 1,
    abortions: 0,
    lmpDate: '2026-05-15',
    eddDate: '2027-02-19',
    currentGestationalAgeWeeks: 21,
    bloodGroup: 'A+',
    genotype: 'AA',
    hivStatus: 'NEGATIVE',
    hepatitisBStatus: 'NEGATIVE',
    vdrlRprStatus: 'NON_REACTIVE',
    tetanusToxoidDoses: 2,
    iptpMalariaDoses: 1,
    riskLevel: 'LOW_RISK',
    riskFactors: [],
    status: 'ANC_ACTIVE',
    visits: [
      {
        id: 'VIS-006',
        visitDate: '2026-10-02',
        gestationalAgeWeeks: 20,
        fundalHeightCm: 20,
        fetalHeartRateBpm: 150,
        fetalPresentation: 'UNSTABLE',
        maternalBloodPressure: '108/68',
        maternalWeightKg: 59.0,
        urineProtein: 'NIL',
        urineGlucose: 'NIL',
        hemoglobinGdl: 12.3,
        complaintsAndNotes: 'Second trimester ultrasound confirms single viable intrauterine fetus. Anatomy survey normal.',
        clinicianName: 'Dr. S. Okon',
        nextAppointmentDate: '2026-10-30'
      }
    ]
  }
];

export const INITIAL_DELIVERY_RECORDS: DeliveryRecord[] = [
  {
    id: 'DEL-2026-001',
    ancProfileId: 'ANC-2026-003',
    patientName: 'Zainab Usman',
    hospitalNumber: 'HIMS-2026-00789',
    laborStartTime: '2026-10-07T22:30:00Z',
    deliveryTime: '2026-10-08T06:45:00Z',
    deliveryMode: 'SPONTANEOUS_VAGINAL',
    cervicalDilationAtAdmissionCm: 4,
    fetalStation: '+2',
    membranesStatus: 'RUPTURED_CLEAR',
    perineumStatus: 'FIRST_DEGREE_TEAR',
    bloodLossMl: 250,
    amtslOxytocinGiven: true,
    placentaDelivery: 'COMPLETE',
    leadMidwifeOrDoctor: 'Senior Midwife M. Ibrahim (RN/RM)',
    deliveryNotes: 'Normal spontaneous vaginal delivery of a live female infant. AMTSL executed with 10 IU Oxytocin IM. First-degree perineal tear sutured with Vicryl 2-0 under local lidocaine.',
    newborns: [
      {
        id: 'NB-2026-001',
        babySex: 'FEMALE',
        birthWeightKg: 3.25,
        lengthCm: 50.0,
        headCircumferenceCm: 34.5,
        birthTimestamp: '2026-10-08T06:45:00Z',
        apgarOneMinute: {
          appearanceColor: 2,
          pulseHeartRate: 2,
          grimaceReflex: 2,
          activityTone: 1,
          respirationEffort: 2,
          totalScore: 9
        },
        apgarFiveMinute: {
          appearanceColor: 2,
          pulseHeartRate: 2,
          grimaceReflex: 2,
          activityTone: 2,
          respirationEffort: 2,
          totalScore: 10
        },
        vitaminKAdministered: true,
        eyeProphylaxisAdministered: true,
        birthImmunization: {
          bcgGiven: true,
          opv0Given: true,
          hepBGiven: true
        },
        resuscitationNeeded: 'ROUTINE_CARE'
      }
    ]
  }
];

export const INITIAL_PNC_CHECKUPS: PncCheckup[] = [
  {
    id: 'PNC-2026-001',
    checkupDate: '2026-10-08T10:00:00Z',
    maternalVitals: {
      bloodPressure: '116/74',
      pulseRate: 78,
      temperature: 36.7
    },
    uterineInvolution: 'WELL_CONTRACTED_BELOW_UMBILICUS',
    lochiaDescription: 'RUBRA_NORMAL',
    perinealWoundStatus: 'HEALING_CLEAN',
    breastfeedingStatus: 'LATCHING_WELL',
    neonatalStatus: {
      temperature: 36.8,
      umbilicalCordStatus: 'CLEAN_DRY',
      neonatalJaundice: false
    },
    contraceptiveCounselingGiven: true,
    clearanceForDischarge: true,
    clinicianName: 'Midwife H. Danjuma (RM)'
  }
];
