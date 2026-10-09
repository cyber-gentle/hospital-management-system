import React from 'react';
import {
  DollarSign,
  CreditCard,
  Building,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { FinancialReportData, ReportingPeriod } from '../types';
import { reportingApi } from '../api';

interface FinancialReportsViewProps {
  data: FinancialReportData;
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

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  data,
  period,
  onPeriodChange,
}) => {
  const handleExportCsv = () => {
    const headers = ['Department', 'Billed Revenue (NGN)', 'Contribution %', 'Transactions'];
    const rows = data.departmentRevenue.map((d) => [
      d.department,
      d.revenue,
      `${d.percentage}%`,
      d.transactionCount,
    ]);
    reportingApi.exportToCsv(`HIMS_Financial_Report_${period}`, headers, rows);
  };

  const getAgingBadge = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CRITICAL':
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
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/30'
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
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Financial CSV</span>
        </button>
      </div>

      {/* Primary Financial Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Gross Invoiced</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 truncate">
            {data.formattedTotalRevenue}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all hospital revenue centers</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Collections (Paid)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2 truncate">
            {data.formattedTotalCollected}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Collection Efficiency: <strong className="text-emerald-300">{data.collectionRate}%</strong>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Outstanding Patient Balances</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2 truncate">
            {data.formattedTotalOutstanding}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Unsettled tariff balances</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fiscal Realization Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {data.collectionRate}%
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, data.collectionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Departmental Breakdown & Payment Channel Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Revenue Breakdown */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Revenue Invoiced by Department / Service Center
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {data.departmentRevenue.length} units
            </span>
          </div>

          <div className="space-y-3">
            {data.departmentRevenue.map((dept, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{dept.department}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{dept.formattedRevenue}</span>
                    <span className="text-slate-500 text-[11px]">({dept.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  {dept.transactionCount.toLocaleString()} billing transactions
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Channels & Tariff Aging */}
        <div className="lg:col-span-5 space-y-6">
          {/* Payment Channels */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Payment Collections Channel Mix</h3>
            </div>

            <div className="space-y-3">
              {data.paymentChannels.map((ch, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{ch.label}</span>
                    <span className="font-semibold text-white">{ch.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-emerald-400">{ch.formattedAmount}</span>
                    <span className="text-[11px] text-slate-500">{ch.transactionCount} transactions</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aging Receivables */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Tariff Aging & Debt Exposure</h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {data.agingReceivables.map((age, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">{age.bucket}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${getAgingBadge(
                        age.riskLevel
                      )}`}
                    >
                      {age.riskLevel}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-1">
                    {age.formattedAmount}
                  </div>
                  <div className="text-[10px] text-slate-500">{age.invoiceCount} open invoices</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
