export type ReportingPeriod =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'YEAR_TO_DATE'
  | 'CUSTOM';

export interface DateRange {
  startDate: string; // ISO YYYY-MM-DD
  endDate: string;   // ISO YYYY-MM-DD
}

// --- FR-REP-01: Financial Reports ---

export interface DepartmentRevenue {
  department: string;
  revenue: number;
  formattedRevenue: string; // e.g. ₦4,850,000.00
  percentage: number;
  transactionCount: number;
}

export interface PaymentChannelBreakdown {
  channel: 'CASH' | 'POS' | 'BANK_TRANSFER' | 'NHIA_HMO';
  label: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  transactionCount: number;
}

export interface AgingReceivable {
  bucket: '0-30 Days' | '31-60 Days' | '61-90 Days' | '90+ Days';
  amount: number;
  formattedAmount: string;
  invoiceCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FinancialReportData {
  period: ReportingPeriod;
  dateRange: DateRange;
  totalRevenue: number;
  formattedTotalRevenue: string;
  totalCollected: number;
  formattedTotalCollected: string;
  totalOutstanding: number;
  formattedTotalOutstanding: string;
  collectionRate: number; // e.g. 88.5%
  departmentRevenue: DepartmentRevenue[];
  paymentChannels: PaymentChannelBreakdown[];
  agingReceivables: AgingReceivable[];
  dailyTrends: {
    date: string;
    billed: number;
    collected: number;
  }[];
}

// --- FR-REP-02: Clinical Census & Morbidity ---

export interface WardCensus {
  wardId: string;
  wardName: string;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number; // percentage
  admissionsToday: number;
  dischargesToday: number;
  criticalPatients: number;
}

export interface MorbidityEntry {
  icd10Code: string;
  diagnosisName: string;
  caseCount: number;
  percentage: number;
  category: 'INFECTIOUS' | 'CHRONIC' | 'MATERNAL' | 'TRAUMA' | 'OTHER';
}

export interface ClinicalCensusData {
  period: ReportingPeriod;
  dateRange: DateRange;
  totalHospitalBeds: number;
  totalOccupiedBeds: number;
  overallOccupancyRate: number; // e.g. 78.4%
  averageLengthOfStayDays: number; // e.g. 4.2 days
  admissionsCount: number;
  dischargesCount: number;
  mortalityCount: number;
  grossMortalityRate: number; // e.g. 1.2%
  wards: WardCensus[];
  topMorbidity: MorbidityEntry[];
  admissionTrends: {
    date: string;
    admissions: number;
    discharges: number;
  }[];
}

// --- FR-REP-03: Performance Metrics & Turnaround Times ---

export interface DepartmentTurnaroundTime {
  department: 'GOPD' | 'LABORATORY' | 'PHARMACY' | 'RADIOLOGY' | 'EMERGENCY';
  label: string;
  metricName: string;
  targetMinutes: number;
  actualAverageMinutes: number;
  status: 'EXCELLENT' | 'NORMAL' | 'DELAYED';
  sampleSize: number;
}

export interface ClinicalActivityVolume {
  cadre: string;
  metric: string;
  totalCount: number;
  periodChangePercent: number; // e.g. +8.5%
}

export interface OperationalMetricsData {
  period: ReportingPeriod;
  dateRange: DateRange;
  dailyPatientFootfall: number;
  newRegistrations: number;
  returnVisits: number;
  bedTurnoverRate: number; // patients per bed per period
  turnaroundTimes: DepartmentTurnaroundTime[];
  activityVolumes: ClinicalActivityVolume[];
  satisfactionScore: number; // out of 100
}

// --- Executive Overview Aggregation ---

export interface ExecutiveDashboardSummary {
  financials: FinancialReportData;
  clinicalCensus: ClinicalCensusData;
  operationalMetrics: OperationalMetricsData;
  generatedAt: string;
}
