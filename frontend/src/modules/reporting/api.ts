import { rethrowBackendRejection } from "../../lib/fallback";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import {
  ClinicalCensusData,
  ExecutiveDashboardSummary,
  FinancialReportData,
  OperationalMetricsData,
  ReportingPeriod,
} from './types';
import {
  INITIAL_CLINICAL_CENSUS,
  INITIAL_FINANCIAL_REPORT,
  INITIAL_OPERATIONAL_METRICS,
} from './mockData';

const STORAGE_KEY_FINANCIAL = 'hims_rep_financial_v1';
const STORAGE_KEY_CLINICAL = 'hims_rep_clinical_v1';
const STORAGE_KEY_OPERATIONAL = 'hims_rep_operational_v1';

class ReportingApi {
  private initStorage(): void {
    requireDemoMode();
    if (!localStorage.getItem(STORAGE_KEY_FINANCIAL)) {
      localStorage.setItem(STORAGE_KEY_FINANCIAL, JSON.stringify(INITIAL_FINANCIAL_REPORT));
    }
    if (!localStorage.getItem(STORAGE_KEY_CLINICAL)) {
      localStorage.setItem(STORAGE_KEY_CLINICAL, JSON.stringify(INITIAL_CLINICAL_CENSUS));
    }
    if (!localStorage.getItem(STORAGE_KEY_OPERATIONAL)) {
      localStorage.setItem(STORAGE_KEY_OPERATIONAL, JSON.stringify(INITIAL_OPERATIONAL_METRICS));
    }
  }

  // --- FR-REP-01: Financial Reports ---
  async getFinancialReport(period: ReportingPeriod = 'THIS_MONTH'): Promise<FinancialReportData> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch(`/api/v1/reporting/dashboards/financial?period=${period}`);
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_FINANCIAL);
    const parsed: FinancialReportData = data ? JSON.parse(data) : INITIAL_FINANCIAL_REPORT;

    // Period multiplier adjustments for realistic interactive demo switching
    let multiplier = 1.0;
    if (period === 'TODAY') multiplier = 0.05;
    else if (period === 'THIS_WEEK') multiplier = 0.28;
    else if (period === 'THIS_QUARTER') multiplier = 2.85;
    else if (period === 'YEAR_TO_DATE') multiplier = 9.4;

    const totalRev = Math.round(parsed.totalRevenue * multiplier);
    const totalColl = Math.round(parsed.totalCollected * multiplier);
    const totalOut = totalRev - totalColl;

    const formatted = (val: number) =>
      new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
      }).format(val);

    return {
      ...parsed,
      period,
      totalRevenue: totalRev,
      formattedTotalRevenue: formatted(totalRev),
      totalCollected: totalColl,
      formattedTotalCollected: formatted(totalColl),
      totalOutstanding: totalOut,
      formattedTotalOutstanding: formatted(totalOut),
      departmentRevenue: parsed.departmentRevenue.map((d) => ({
        ...d,
        revenue: Math.round(d.revenue * multiplier),
        formattedRevenue: formatted(Math.round(d.revenue * multiplier)),
        transactionCount: Math.max(1, Math.round(d.transactionCount * multiplier)),
      })),
      paymentChannels: parsed.paymentChannels.map((c) => ({
        ...c,
        amount: Math.round(c.amount * multiplier),
        formattedAmount: formatted(Math.round(c.amount * multiplier)),
        transactionCount: Math.max(1, Math.round(c.transactionCount * multiplier)),
      })),
    };
  }

  // --- FR-REP-02: Clinical Census & Morbidity ---
  async getClinicalCensus(period: ReportingPeriod = 'THIS_MONTH'): Promise<ClinicalCensusData> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch(`/api/v1/reporting/dashboards/clinical?period=${period}`);
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_CLINICAL);
    const parsed: ClinicalCensusData = data ? JSON.parse(data) : INITIAL_CLINICAL_CENSUS;
    return {
      ...parsed,
      period,
    };
  }

  // --- FR-REP-03: Operational Performance Metrics ---
  async getOperationalMetrics(period: ReportingPeriod = 'THIS_MONTH'): Promise<OperationalMetricsData> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch(`/api/v1/reporting/dashboards/operational?period=${period}`);
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_OPERATIONAL);
    const parsed: OperationalMetricsData = data ? JSON.parse(data) : INITIAL_OPERATIONAL_METRICS;
    return {
      ...parsed,
      period,
    };
  }

  // --- Executive Dashboard Aggregation ---
  async getExecutiveSummary(period: ReportingPeriod = 'THIS_MONTH'): Promise<ExecutiveDashboardSummary> {
    requireDemoMode();
    const [financials, clinicalCensus, operationalMetrics] = await Promise.all([
      this.getFinancialReport(period),
      this.getClinicalCensus(period),
      this.getOperationalMetrics(period),
    ]);

    return {
      financials,
      clinicalCensus,
      operationalMetrics,
      generatedAt: new Date().toISOString(),
    };
  }

  // --- Export Report Utility (CSV) ---
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const reportingApi = new ReportingApi();
