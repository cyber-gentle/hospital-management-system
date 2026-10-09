import { UserRole } from '../../lib/auth';

export type ServiceOrigin = 'core-go' | 'interop-py';

export type AuditActionCategory =
  | 'ALL'
  | 'CLINICAL'
  | 'FINANCIAL'
  | 'SECURITY'
  | 'OVERRIDE';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalyCategory =
  | 'AFTER_HOURS_CLINICAL'
  | 'FINANCIAL_DELETION'
  | 'OVERRIDE_ABUSE'
  | 'AUTH_FAILURE_BURST'
  | 'HIGH_VALUE_TRANSACTION';

export type ExceptionReviewStatus =
  | 'FLAGGED'
  | 'UNDER_REVIEW'
  | 'CLEARED'
  | 'ESCALATED';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 UTC
  userId: string;
  userName: string;
  userRole: UserRole | string;
  service: ServiceOrigin;
  module: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE';
  tamperSealHash?: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface AuditFilterParams {
  service?: 'ALL' | ServiceOrigin;
  module?: string;
  userRole?: string;
  status?: 'ALL' | 'SUCCESS' | 'FAILURE';
  actionCategory?: AuditActionCategory;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  onlyAnomalies?: boolean;
}

export interface AuditAnomalyException {
  id: string;
  logId: string;
  timestamp: string;
  severity: AnomalySeverity;
  category: AnomalyCategory;
  description: string;
  detectedRule: string;
  status: ExceptionReviewStatus;
  assignedAuditor?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  logEntry: AuditLogEntry;
}

export interface AuditMetrics {
  totalEvents: number;
  goServiceEvents: number;
  pythonServiceEvents: number;
  failuresCount: number;
  activeAnomalies: number;
  criticalExceptions: number;
  integrityStatus: 'VALID' | 'VERIFIED' | 'TAMPER_DETECTED';
}
