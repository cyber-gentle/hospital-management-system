export type UserRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'PHARMACIST'
  | 'ACCOUNTANT'
  | 'CHIEF_ACCOUNTANT'
  | 'NHIA_OFFICER'
  | 'AUDITOR'
  | 'LAB_SCIENTIST'
  | 'RADIOLOGIST'
  | 'STOREKEEPER'
  | 'RECORDS_OFFICER';

export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  department: string;
  status: AccountStatus;
  failedLoginAttempts: number;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PermissionAction =
  | 'READ'
  | 'WRITE'
  | 'APPROVE'
  | 'DELETE_SOFT'
  | 'ADMIN_OVERRIDE';

export interface PermissionDefinition {
  id: string; // e.g. billing:approve
  module: string;
  moduleLabel: string;
  action: PermissionAction;
  description: string;
}

export interface RolePermissionsMatrix {
  role: UserRole;
  roleLabel: string;
  description: string;
  permissions: string[]; // array of permission IDs
  userCount: number;
}

// --- FR-SEC-01: Global System Configuration & Facility Parameters ---

export interface FacilityProfile {
  hospitalName: string;
  facilityLevel: 'Tertiary Teaching Hospital' | 'Federal Medical Centre' | 'State Specialist Hospital' | 'General Hospital';
  accreditationCode: string;
  registrationNumber: string; // CAC / MoH Reg
  physicalAddress: string;
  state: string;
  country: string;
  officialPhone: string;
  emergencyHotline: string;
  officialEmail: string;
  defaultCurrency: string; // NGN (₦)
  fiscalYear: string; // e.g. 2026
}

export interface SecurityPolicyConfig {
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  passwordExpiryDays: number;
  enforceTwoFactorForFinancialRoles: boolean;
  allowEmergencyOverrideLogging: boolean;
  maintenanceMode: boolean;
  inpatientDepositGate: 'SOFT_WARNING' | 'STRICT_BLOCK';
  dischargeChecklistEnforcement: 'STRICT_100_PERCENT' | 'DOCTOR_OVERRIDE_PERMITTED';
}

export interface GlobalSystemConfig {
  facility: FacilityProfile;
  security: SecurityPolicyConfig;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface SecurityMetrics {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalRoles: number;
  twoFactorEnforcedCount: number;
  failedLoginsPast24h: number;
}
