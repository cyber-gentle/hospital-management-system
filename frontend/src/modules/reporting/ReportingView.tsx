import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Bed,
  Activity,
  Users,
  RefreshCw,
  Building,
  CheckCircle2,
  PieChart,
  BarChart3,
  Gauge,
  Clock,
} from 'lucide-react';
import { ExecutiveDashboardSummary, ReportingPeriod } from './types';
import { reportingApi } from './api';
import { FinancialReportsView } from './components/FinancialReportsView';
import { ClinicalCensusView } from './components/ClinicalCensusView';
import { OperationalMetricsView } from './components/OperationalMetricsView';

export const ReportingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'CLINICAL' | 'OPERATIONAL'>('FINANCIAL');
  const [period, setPeriod] = useState<ReportingPeriod>('THIS_MONTH');
  const [summary, setSummary] = useState<ExecutiveDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportingApi.getExecutiveSummary(period);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load reporting data', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodChange = (newPeriod: ReportingPeriod) => {
    setPeriod(newPeriod);
    showToast(`Updated reporting analytics for period: ${newPeriod.replace(/_/g, ' ')}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-blue-500/40 text-blue-400 rounded-xl shadow-2xl animate-fade-in text-sm">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Reporting & Hospital Analytics
              </h1>
              <p className="text-xs text-slate-400">
                Hospital Intelligence: Institutional Revenue, Ward Bed Census, Morbidity Index & Turnaround Times
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Billed */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gross Invoiced</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1.5 truncate">
            {summary ? summary.financials.formattedTotalRevenue : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total hospital billings</div>
        </div>

        {/* Collection Rate */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Collection Rate</span>
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">
            {summary ? `${summary.financials.collectionRate}%` : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Realized cash/bank/POS</div>
        </div>

        {/* Bed Occupancy Rate */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bed Occupancy</span>
            <Bed className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-1.5">
            {summary ? `${summary.clinicalCensus.overallOccupancyRate}%` : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Operational beds active</div>
        </div>

        {/* ALOS */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ALOS (Stay)</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400 mt-1.5">
            {summary ? `${summary.clinicalCensus.averageLengthOfStayDays}d` : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Inpatient average duration</div>
        </div>

        {/* Daily Patient Footfall */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily Footfall</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-1.5">
            {summary ? summary.operationalMetrics.dailyPatientFootfall : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Patients through facility</div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SLA Benchmarks</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5">
            80%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Departmental clinical TAT</div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('FINANCIAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'FINANCIAL'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financial Reports & Revenue Analytics (FR-REP-01)</span>
        </button>

        <button
          onClick={() => setActiveTab('CLINICAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'CLINICAL'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Clinical Census, Morbidity & Bed Occupancy (FR-REP-02)</span>
        </button>

        <button
          onClick={() => setActiveTab('OPERATIONAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'OPERATIONAL'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Operational Performance & Turnaround Times (FR-REP-03)</span>
        </button>
      </div>

      {/* Tab Views */}
      {summary && (
        <div className="space-y-4">
          {activeTab === 'FINANCIAL' && (
            <FinancialReportsView
              data={summary.financials}
              period={period}
              onPeriodChange={handlePeriodChange}
            />
          )}

          {activeTab === 'CLINICAL' && (
            <ClinicalCensusView
              data={summary.clinicalCensus}
              period={period}
              onPeriodChange={handlePeriodChange}
            />
          )}

          {activeTab === 'OPERATIONAL' && (
            <OperationalMetricsView
              data={summary.operationalMetrics}
              period={period}
              onPeriodChange={handlePeriodChange}
            />
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center pt-4 border-t border-slate-800/60 text-xs text-slate-500 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5" />
          Hospital Medical Intelligence & Administrative Analytics
        </span>
        <span>•</span>
        <span>Build Group 4 — Support & Governance</span>
        <span>•</span>
        <span>FR-REP-01 to FR-REP-03</span>
      </div>
    </div>
  );
};
