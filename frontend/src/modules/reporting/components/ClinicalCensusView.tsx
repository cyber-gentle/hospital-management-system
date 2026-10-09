import React from 'react';
import {
  Bed,
  Activity,
  HeartPulse,
  UserCheck,
  Download,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react';
import { ClinicalCensusData, ReportingPeriod } from '../types';
import { reportingApi } from '../api';

interface ClinicalCensusViewProps {
  data: ClinicalCensusData;
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

export const ClinicalCensusView: React.FC<ClinicalCensusViewProps> = ({
  data,
  period,
  onPeriodChange,
}) => {
  const handleExportCsv = () => {
    const headers = ['Ward Name', 'Total Beds', 'Occupied Beds', 'Occupancy Rate (%)', 'Critical Patients'];
    const rows = data.wards.map((w) => [
      w.wardName,
      w.totalBeds,
      w.occupiedBeds,
      `${w.occupancyRate}%`,
      w.criticalPatients,
    ]);
    reportingApi.exportToCsv(`HIMS_Clinical_Census_${period}`, headers, rows);
  };

  const getMorbidityCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'INFECTIOUS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CHRONIC':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'MATERNAL':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'TRAUMA':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30'
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
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export Census CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Bed Occupancy Rate */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bed Occupancy Rate (BOR)</span>
            <Bed className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {data.overallOccupancyRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {data.totalOccupiedBeds} of {data.totalHospitalBeds} operational beds filled
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                data.overallOccupancyRate > 85 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, data.overallOccupancyRate)}%` }}
            />
          </div>
        </div>

        {/* ALOS */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Length of Stay (ALOS)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {data.averageLengthOfStayDays} <span className="text-sm font-normal text-slate-400">Days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Hospital-wide inpatient stay metric</div>
        </div>

        {/* Inpatient Flow */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Inpatient Flow (Admit / Disch)</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {data.admissionsCount} <span className="text-xs text-slate-400">in</span> / {data.dischargesCount} <span className="text-xs text-slate-400">out</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Net Inpatient Admissions ratio</div>
        </div>

        {/* Gross Mortality */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gross Hospital Death Rate</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {data.grossMortalityRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {data.mortalityCount} deaths recorded in period
          </div>
        </div>
      </div>

      {/* Grid: Ward Census Breakdown & Top ICD-10 Morbidities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ward Bed Census */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Inpatient Wards Real-Time Census & Bed Utilization
              </h3>
            </div>
            <span className="text-xs text-slate-500">{data.wards.length} wards</span>
          </div>

          <div className="space-y-3">
            {data.wards.map((ward) => (
              <div
                key={ward.wardId}
                className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{ward.wardName}</span>
                    <span className="text-slate-500 text-[11px] ml-2">({ward.wardId})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300">
                      {ward.occupiedBeds} / {ward.totalBeds} Beds
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        ward.occupancyRate >= 85
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : ward.occupancyRate >= 70
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ward.occupancyRate}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ward.occupancyRate >= 85
                        ? 'bg-rose-500'
                        : ward.occupancyRate >= 70
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${ward.occupancyRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span>Admit Today: <strong className="text-slate-300">+{ward.admissionsToday}</strong></span>
                    <span>Discharge Today: <strong className="text-slate-300">-{ward.dischargesToday}</strong></span>
                  </div>
                  {ward.criticalPatients > 0 && (
                    <div className="flex items-center gap-1 text-rose-400 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{ward.criticalPatients} critical</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top ICD-10 Morbidities */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Top 10 ICD-10 Morbidity Distribution</h3>
            </div>
            <span className="text-xs text-slate-500">Diagnosis Index</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {data.topMorbidity.map((mob, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/30 shrink-0 text-[11px]">
                      {mob.icd10Code}
                    </span>
                    <span className="font-medium text-slate-200 truncate">{mob.diagnosisName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${getMorbidityCategoryBadge(
                      mob.category
                    )}`}
                  >
                    {mob.category}
                  </span>
                  <div className="text-slate-400 text-xs">
                    <strong className="text-white">{mob.caseCount}</strong> cases ({mob.percentage}%)
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-1">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, mob.percentage * 3.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
