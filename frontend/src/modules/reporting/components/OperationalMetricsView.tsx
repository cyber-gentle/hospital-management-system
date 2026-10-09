import React from 'react';
import {
  Clock,
  Activity,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Award,
  Zap,
} from 'lucide-react';
import { OperationalMetricsData, ReportingPeriod } from '../types';
import { reportingApi } from '../api';

interface OperationalMetricsViewProps {
  data: OperationalMetricsData;
  period: ReportingPeriod;
  onPeriodChange: (period: ReportingPeriod) => void;
}

const PERIOD_OPTIONS: { label: string; value: ReportingPeriod }[] = [
  { label: 'Today', value: 'TODAY' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'This Quarter', value: 'THIS_QUARTER' },
  { label: 'Year To Date', value: 'YEAR_TO_DATE' },
];

export const OperationalMetricsView: React.FC<OperationalMetricsViewProps> = ({
  data,
  period,
  onPeriodChange,
}) => {
  const handleExportCsv = () => {
    const headers = ['Department', 'Service Metric', 'SLA Target (min)', 'Actual Average (min)', 'Status', 'Sample Size'];
    const rows = data.turnaroundTimes.map((t) => [
      t.label,
      t.metricName,
      t.targetMinutes,
      t.actualAverageMinutes,
      t.status,
      t.sampleSize,
    ]);
    reportingApi.exportToCsv(`HIMS_Operational_TAT_${period}`, headers, rows);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Within Target SLA
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Acceptable SLA
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            SLA Exceeded / Delayed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPeriodChange(opt.value)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
                period === opt.value
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Export TAT Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Footfall */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily Patient Footfall</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {data.dailyPatientFootfall} <span className="text-sm font-normal text-slate-400">Patients</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {data.newRegistrations} New | {data.returnVisits} Returning
          </div>
        </div>

        {/* Bed Turnover */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bed Turnover Rate (BTR)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {data.bedTurnoverRate}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Patients per bed per cycle</div>
        </div>

        {/* Overall Satisfaction */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Patient Satisfaction Index</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {data.satisfactionScore}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Exit survey sentiment score</div>
        </div>

        {/* Clinical Efficiency */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SLA Compliance Index</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            80.0%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">4 of 5 service departments within SLA</div>
        </div>
      </div>

      {/* Grid: Department Turnaround Times & Clinical Activity Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Turnaround Time SLA Monitor */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">
                Departmental Clinical Turnaround Times (TAT) vs. Target SLA
              </h3>
            </div>
            <span className="text-xs text-slate-500">Service Benchmarks</span>
          </div>

          <div className="space-y-3">
            {data.turnaroundTimes.map((tat, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{tat.label}</span>
                    <div className="text-[11px] text-slate-400">{tat.metricName}</div>
                  </div>
                  {getStatusBadge(tat.status)}
                </div>

                <div className="flex items-baseline justify-between text-xs text-slate-300 pt-1">
                  <div>
                    Target: <span className="font-mono text-slate-400 font-medium">{tat.targetMinutes} mins</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 text-[11px]">Actual Avg:</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        tat.status === 'DELAYED'
                          ? 'text-rose-400'
                          : tat.status === 'EXCELLENT'
                          ? 'text-emerald-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {tat.actualAverageMinutes} mins
                    </span>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tat.status === 'DELAYED'
                        ? 'bg-rose-500'
                        : tat.status === 'EXCELLENT'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((tat.actualAverageMinutes / (tat.targetMinutes * 1.5)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="text-[10px] text-slate-500">
                  Sample size: {tat.sampleSize.toLocaleString()} patient events recorded
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Activity Volumes */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Staff Activity Volume & Workload</h3>
            </div>
            <span className="text-xs text-slate-500">Departmental Workload</span>
          </div>

          <div className="space-y-3">
            {data.activityVolumes.map((vol, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{vol.cadre}</span>
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-0.5">
                    +{vol.periodChangePercent}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{vol.metric}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-base font-bold text-white">
                    {vol.totalCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
