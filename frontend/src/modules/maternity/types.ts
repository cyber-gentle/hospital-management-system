export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Genotype = 'AA' | 'AS' | 'AC' | 'SS' | 'SC';
export type PregnancyRiskLevel = 'LOW_RISK' | 'HIGH_RISK';
export type DeliveryMode = 'SPONTANEOUS_VAGINAL' | 'ASSISTED_VACUUM' | 'ASSISTED_FORCEPS' | 'EMERGENCY_CESAREAN' | 'ELECTIVE_CESAREAN';
export type PerineumStatus = 'INTACT' | 'EPISIOTOMY' | 'FIRST_DEGREE_TEAR' | 'SECOND_DEGREE_TEAR' | 'THIRD_DEGREE_TEAR';
export type FetalPresentation = 'CEPHALIC' | 'BREECH' | 'TRANSVERSE' | 'UNSTABLE';
export type MaternityStatus = 'ANC_ACTIVE' | 'IN_LABOR' | 'DELIVERED_PNC' | 'DISCHARGED' | 'TRANSFERRED_OR';

export interface AncVisit {
  id: string;
  visitDate: string;
  gestationalAgeWeeks: number;
  fundalHeightCm: number;
  fetalHeartRateBpm: number;
  fetalPresentation: FetalPresentation;
  maternalBloodPressure: string; // e.g. "118/74"
  maternalWeightKg: number;
  urineProtein: 'NIL' | 'TRACE' | '1+' | '2+' | '3+';
  urineGlucose: 'NIL' | 'TRACE' | '1+' | '2+';
  hemoglobinGdl: number;
  complaintsAndNotes: string;
  clinicianName: string;
  nextAppointmentDate: string;
}

export interface AncProfile {
  id: string;
  patientId: string;
  hospitalNumber: string;
  patientName: string;
  age: number;
  phone: string;
  gravida: number; // Total pregnancies
  para: number; // Deliveries > 28 weeks
  living: number; // Living children
  abortions: number; // Miscarriages/terminations
  lmpDate: string; // Last menstrual period
  eddDate: string; // Estimated delivery date
  currentGestationalAgeWeeks: number;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  hivStatus: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  hepatitisBStatus: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  vdrlRprStatus: 'NON_REACTIVE' | 'REACTIVE';
  tetanusToxoidDoses: number; // 0 to 5
  iptpMalariaDoses: number; // 0 to 3
  riskLevel: PregnancyRiskLevel;
  riskFactors: string[];
  status: MaternityStatus;
  visits: AncVisit[];
}

export interface ApgarScore {
  appearanceColor: number; // 0-2 (Blue/pale, Body pink/limbs blue, Completely pink)
  pulseHeartRate: number; // 0-2 (Absent, <100, >100)
  grimaceReflex: number; // 0-2 (No response, Grimace, Cry/cough/sneeze)
  activityTone: number; // 0-2 (Flaccid, Some flexion, Active motion)
  respirationEffort: number; // 0-2 (Absent, Slow/irregular, Vigorous cry)
  totalScore: number; // 0-10
}

export interface NewbornDetails {
  id: string;
  babySex: 'MALE' | 'FEMALE';
  birthWeightKg: number;
  lengthCm: number;
  headCircumferenceCm: number;
  birthTimestamp: string;
  apgarOneMinute: ApgarScore;
  apgarFiveMinute: ApgarScore;
  vitaminKAdministered: boolean;
  eyeProphylaxisAdministered: boolean;
  birthImmunization: {
    bcgGiven: boolean;
    opv0Given: boolean;
    hepBGiven: boolean;
  };
  resuscitationNeeded: 'ROUTINE_CARE' | 'TACTILE_STIMULATION' | 'SUCTION_AIRWAY' | 'BAG_VALVE_MASK';
}

export interface DeliveryRecord {
  id: string;
  ancProfileId: string;
  patientName: string;
  hospitalNumber: string;
  laborStartTime: string;
  deliveryTime: string;
  deliveryMode: DeliveryMode;
  cervicalDilationAtAdmissionCm: number;
  fetalStation: string; // e.g. "-1", "0", "+2"
  membranesStatus: 'INTACT' | 'RUPTURED_CLEAR' | 'RUPTURED_MECONIUM';
  perineumStatus: PerineumStatus;
  bloodLossMl: number;
  amtslOxytocinGiven: boolean; // Active Management of Third Stage of Labor
  placentaDelivery: 'COMPLETE' | 'INCOMPLETE_MANUAL_REMOVAL';
  leadMidwifeOrDoctor: string;
  deliveryNotes: string;
  newborns: NewbornDetails[];
}

export interface PncCheckup {
  id: string;
  checkupDate: string;
  maternalVitals: {
    bloodPressure: string;
    pulseRate: number;
    temperature: number;
  };
  uterineInvolution: 'WELL_CONTRACTED_BELOW_UMBILICUS' | 'SUBINVOLUTED_BOGGY';
  lochiaDescription: 'RUBRA_NORMAL' | 'SEROSA_NORMAL' | 'ALBA_NORMAL' | 'OFFENSIVE_EXCESSIVE';
  perinealWoundStatus: 'HEALING_CLEAN' | 'ERYTHEMA_SWELLING' | 'NA_INTACT';
  breastfeedingStatus: 'LATCHING_WELL' | 'ENGORGEMENT_DIFFICULTY' | 'FORMULA_FEEDING';
  neonatalStatus: {
    temperature: number;
    umbilicalCordStatus: 'CLEAN_DRY' | 'MOIST_DISCHARGE';
    neonatalJaundice: boolean;
  };
  contraceptiveCounselingGiven: boolean;
  clearanceForDischarge: boolean;
  clinicianName: string;
}
