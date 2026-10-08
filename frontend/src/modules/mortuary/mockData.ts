import { DeceasedRecord, ColdStorageUnit, AutopsyLog, BodyReleaseRecord } from './types';

export const INITIAL_COLD_STORAGE_UNITS: ColdStorageUnit[] = [
  {
    id: 'unit-a',
    unitName: 'Chamber Block A (Main Clinical)',
    targetTemperatureCelsius: 2.0,
    currentTemperatureCelsius: 2.3,
    totalChambers: 6,
    chambers: [
      {
        chamberId: 'ch-a-01',
        chamberNumber: 'Vault A-01',
        tier: 'TOP_TIER',
        status: 'OCCUPIED',
        currentDeceasedId: 'MOR-2026-001',
        currentDeceasedName: 'Alhaji Haruna Yakubu',
        currentDeceasedTag: 'TAG-2026-081'
      },
      {
        chamberId: 'ch-a-02',
        chamberNumber: 'Vault A-02',
        tier: 'MIDDLE_TIER',
        status: 'AVAILABLE'
      },
      {
        chamberId: 'ch-a-03',
        chamberNumber: 'Vault A-03',
        tier: 'BOTTOM_TIER',
        status: 'AVAILABLE'
      },
      {
        chamberId: 'ch-a-04',
        chamberNumber: 'Vault A-04',
        tier: 'TOP_TIER',
        status: 'AVAILABLE'
      },
      {
        chamberId: 'ch-a-05',
        chamberNumber: 'Vault A-05',
        tier: 'MIDDLE_TIER',
        status: 'OCCUPIED',
        currentDeceasedId: 'MOR-2026-003',
        currentDeceasedName: 'Grace Nnamdi',
        currentDeceasedTag: 'TAG-2026-079'
      },
      {
        chamberId: 'ch-a-06',
        chamberNumber: 'Vault A-06',
        tier: 'BOTTOM_TIER',
        status: 'DECONTAMINATION'
      }
    ]
  },
  {
    id: 'unit-b',
    unitName: 'Chamber Block B (Forensic & Coroner Reserve)',
    targetTemperatureCelsius: 1.5,
    currentTemperatureCelsius: 1.8,
    totalChambers: 4,
    chambers: [
      {
        chamberId: 'ch-b-01',
        chamberNumber: 'Vault B-01',
        tier: 'TOP_TIER',
        status: 'OCCUPIED',
        currentDeceasedId: 'MOR-2026-002',
        currentDeceasedName: 'Unidentified Male (Coroner Doe #18)',
        currentDeceasedTag: 'TAG-2026-082'
      },
      {
        chamberId: 'ch-b-02',
        chamberNumber: 'Vault B-02',
        tier: 'MIDDLE_TIER',
        status: 'AVAILABLE'
      },
      {
        chamberId: 'ch-b-03',
        chamberNumber: 'Vault B-03',
        tier: 'BOTTOM_TIER',
        status: 'AVAILABLE'
      },
      {
        chamberId: 'ch-b-04',
        chamberNumber: 'Vault B-04',
        tier: 'TOP_TIER',
        status: 'AVAILABLE'
      }
    ]
  }
];

export const INITIAL_DECEASED_RECORDS: DeceasedRecord[] = [
  {
    id: 'MOR-2026-001',
    deceasedTagNumber: 'TAG-2026-081',
    fullName: 'Alhaji Haruna Yakubu',
    isUnidentified: false,
    hospitalNumber: 'HIMS-2026-00192',
    age: 68,
    gender: 'MALE',
    dateOfAdmission: '2026-10-06T14:30:00Z',
    originDepartment: 'INPATIENT_WARD',
    dateOfDeath: '2026-10-06T13:45:00Z',
    causeOfDeath: 'Septic shock secondary to perforated diverticulitis with multi-organ dysfunction syndrome.',
    certifyingDoctor: 'Dr. A. Danbaba (Chief Consultant Surgeon)',
    certifyingDoctorLicense: 'MDCN/64821',
    isCoronerCase: false,
    nextOfKin: {
      name: 'Bashir Haruna',
      phone: '+234 803 765 4321',
      relationship: 'Eldest Son',
      address: '14 Crescent Way, GRA, Kaduna',
      nationalIdNumber: 'NIN-99238471928'
    },
    assignedChamberId: 'unit-a',
    assignedChamberUnit: 'Vault A-01',
    status: 'ADMITTED_IN_STORAGE',
    belongingsDeposited: ['Silver wrist watch', 'Leather wallet with ID cards', 'Clothing parcel'],
    storageFeeDaily: 5000,
    daysInStorage: 2,
    totalAccruedStorageFee: 10000,
    financialClearancePaid: true,
    updatedAt: '2026-10-07T09:00:00Z'
  },
  {
    id: 'MOR-2026-002',
    deceasedTagNumber: 'TAG-2026-082',
    fullName: 'Unidentified Male (Coroner Doe #18)',
    isUnidentified: true,
    hospitalNumber: 'HIMS-MOR-UNKNOWN-18',
    age: 35,
    gender: 'MALE',
    dateOfAdmission: '2026-10-07T03:15:00Z',
    originDepartment: 'ACCIDENT_EMERGENCY',
    dateOfDeath: '2026-10-07T02:40:00Z',
    causeOfDeath: 'Severe polytrauma & fatal skull base fracture sustained in hit-and-run highway collision.',
    certifyingDoctor: 'Dr. K. Bello (Emergency Consultant)',
    certifyingDoctorLicense: 'MDCN/88412',
    isCoronerCase: true,
    policeRefNumber: 'NPF/CR/DIV-B/2026/894',
    nextOfKin: {
      name: 'Police Investigating Officer Sgt. E. Musa',
      phone: '+234 802 112 3344',
      relationship: 'Investigating Officer',
      address: 'Central Police Command, Traffic Division',
      nationalIdNumber: 'NPF-AP-184920'
    },
    assignedChamberId: 'unit-b',
    assignedChamberUnit: 'Vault B-01',
    status: 'AUTOPSY_PENDING',
    belongingsDeposited: ['Fragmented watch', 'Pocket knife', 'Tattered boots'],
    storageFeeDaily: 5000,
    daysInStorage: 1,
    totalAccruedStorageFee: 5000,
    financialClearancePaid: false,
    updatedAt: '2026-10-07T04:00:00Z'
  },
  {
    id: 'MOR-2026-003',
    deceasedTagNumber: 'TAG-2026-079',
    fullName: 'Grace Nnamdi',
    isUnidentified: false,
    hospitalNumber: 'HIMS-2026-00482',
    age: 52,
    gender: 'FEMALE',
    dateOfAdmission: '2026-10-05T18:00:00Z',
    originDepartment: 'INPATIENT_WARD',
    dateOfDeath: '2026-10-05T17:10:00Z',
    causeOfDeath: 'Cardiogenic shock complicating acute anterior ST-elevation myocardial infarction.',
    certifyingDoctor: 'Dr. M. Sani (Consultant Physician)',
    certifyingDoctorLicense: 'MDCN/71923',
    isCoronerCase: false,
    nextOfKin: {
      name: 'Chukwudi Nnamdi',
      phone: '+234 805 999 8877',
      relationship: 'Husband',
      address: '22 Airport Road, Ikeja',
      nationalIdNumber: 'NIN-10948291039'
    },
    assignedChamberId: 'unit-a',
    assignedChamberUnit: 'Vault A-05',
    status: 'CLEARED_FOR_RELEASE',
    belongingsDeposited: ['Wedding band', 'Gold earrings', 'Personal bag'],
    storageFeeDaily: 5000,
    daysInStorage: 3,
    totalAccruedStorageFee: 15000,
    financialClearancePaid: true,
    autopsyId: 'AUT-2026-001',
    updatedAt: '2026-10-08T08:30:00Z'
  },
  {
    id: 'MOR-2026-004',
    deceasedTagNumber: 'TAG-2026-070',
    fullName: 'Pa Timothy Adeleke',
    isUnidentified: false,
    hospitalNumber: 'HIMS-2026-00812',
    age: 84,
    gender: 'MALE',
    dateOfAdmission: '2026-09-28T10:00:00Z',
    originDepartment: 'BROUGHT_IN_DEAD_BID',
    dateOfDeath: '2026-09-28T08:30:00Z',
    causeOfDeath: 'Natural causes consistent with advanced congestive cardiac failure and senility.',
    certifyingDoctor: 'Dr. F. Okoro (Medical Officer)',
    certifyingDoctorLicense: 'MDCN/90214',
    isCoronerCase: false,
    nextOfKin: {
      name: 'Dele Adeleke',
      phone: '+234 803 222 1100',
      relationship: 'Son',
      address: '5 Obafemi Awolowo Way',
      nationalIdNumber: 'NIN-44920194820'
    },
    status: 'RELEASED_TO_FAMILY',
    belongingsDeposited: ['Walking cane', 'Reading glasses'],
    storageFeeDaily: 5000,
    daysInStorage: 8,
    totalAccruedStorageFee: 40000,
    financialClearancePaid: true,
    releaseId: 'REL-2026-001',
    updatedAt: '2026-10-06T11:00:00Z'
  }
];

export const INITIAL_AUTOPSY_LOGS: AutopsyLog[] = [
  {
    id: 'AUT-2026-001',
    deceasedId: 'MOR-2026-003',
    deceasedName: 'Grace Nnamdi',
    deceasedTagNumber: 'TAG-2026-079',
    pathologistName: 'Prof. E. B. Adeyemi',
    pathologistLicense: 'FMCPath/9821',
    autopsyDate: '2026-10-06T11:00:00Z',
    externalFindings: 'Well-nourished female. No signs of blunt or penetrating external trauma. Bilateral dependent livor mortis.',
    internalFindings: 'Left anterior descending (LAD) coronary artery 95% occluded with acute plaque rupture and thrombus. Transmural anteroseptal myocardial necrosis.',
    definitiveCauseOfDeath: 'Acute transmural myocardial infarction secondary to atherosclerotic coronary thrombosis.',
    toxicologySamplesRetained: ['Femoral blood for troponin and tox screen'],
    coronerVerdict: 'Death due to natural cardiovascular disease. No foul play found.'
  }
];

export const INITIAL_BODY_RELEASES: BodyReleaseRecord[] = [
  {
    id: 'REL-2026-001',
    deceasedId: 'MOR-2026-004',
    deceasedName: 'Pa Timothy Adeleke',
    deceasedTagNumber: 'TAG-2026-070',
    releaseDate: '2026-10-06T11:00:00Z',
    releasedToName: 'Dele Adeleke',
    releasedToNIN: 'NIN-44920194820',
    releasedToRelationship: 'Son',
    funeralHomeOrUndertaker: 'Eternal Peace Funeral Services Ltd.',
    burialPermitNumber: 'BUR-PERMIT-2026-4482',
    coronerClearanceConfirmed: true,
    billingReceiptNumber: 'RCP-2026-09841',
    mortuaryOfficer: 'Chief Mortician J. Adamu',
    handoverNotes: 'Body identified by next of kin Dele Adeleke. Burial permit and cashier receipt for ₦40,000 verified. Belongings handed over in full.'
  }
];
