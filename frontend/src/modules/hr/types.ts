export type StaffCadre =
  | 'MEDICAL'
  | 'NURSING'
  | 'PHARMACY'
  | 'LABORATORY'
  | 'ADMINISTRATIVE'
  | 'ALLIED_HEALTH';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'LOCUM'
  | 'INTERN';

export type LicenseType =
  | 'MDCN'
  | 'NMCN'
  | 'PCN'
  | 'MLSCN'
  | 'RRBN'
  | 'NOT_APPLICABLE';

export type LicenseStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'NOT_APPLICABLE';

export type StaffStatus =
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'RESIGNED'
  | 'RETIRED';

export interface StaffProfile {
  id: string;
  staffNumber: string; // e.g. HOSP/DOC/084
  firstName: string;
  lastName: string;
  otherNames?: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  email: string;
  phone: string;
  department: string;
  cadre: StaffCadre;
  designation: string;
  employmentType: EmploymentType;
  dateJoined: string;
  licenseType: LicenseType;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  licenseStatus: LicenseStatus;
  status: StaffStatus;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
  };
}

export type ShiftType =
  | 'MORNING'
  | 'AFTERNOON'
  | 'NIGHT'
  | 'CALL_DUTY'
  | 'OFF_DUTY';

export type ShiftStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'SWAPPED'
  | 'ABSENT';

export interface DutyShift {
  id: string;
  department: string;
  wardOrUnit?: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  shiftDate: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: ShiftStatus;
  notes?: string;
}

export type LeaveType =
  | 'ANNUAL'
  | 'SICK'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'STUDY'
  | 'CASUAL'
  | 'COMPASSIONATE';

export type LeaveStatus =
  | 'PENDING_HOD'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  reliefStaffId?: string;
  reliefStaffName?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvalNotes?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export interface HRMetrics {
  totalStaff: number;
  activeStaff: number;
  onLeave: number;
  expiringLicensesCount: number;
  activeShiftsToday: number;
  pendingLeaveRequests: number;
}
