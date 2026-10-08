import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Clock,
  User,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { AuditAnomalyException, ExceptionReviewStatus } from '../types';

interface AnomalyCenterViewProps {
  exceptions: AuditAnomalyException[];
  onSelectException: (exception: AuditAnomalyException) => void;
  onInspectLog: (logId: string) => void;
  loading?: boolean;
}

export const AnomalyCenterView: React.FC<AnomalyCenterViewProps> = ({
  exceptions,
  onSelectException,
  onInspectLog,
  loading = false
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredExceptions = exceptions.filter((e) => {
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH').length;
  const underReviewCount = exceptions.filter((e) => e.status === 'UNDER_REVIEW').length;
  const clearedCount = exceptions.filter((e) => e.status === 'CLEARED').length;

  const getStatusBadge = (status: ExceptionReviewStatus) => {
    switch (status) {
      case 'FLAGGED':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 animate-pulse">
            FLAGGED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
            UNDER REVIEW
          </span>
        );
      case 'CLEARED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
            CLEARED
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">
            ESCALATED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>Critical Severity</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Dual approval / large deletion bypasses</div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-orange-700">
            <span>High Severity</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-900 mt-1">{highCount}</div>
          <div className="text-[11px] text-orange-600 mt-0.5">Nocturnal narcotics &amp; discharge force</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Under Investigation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{underReviewCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Assigned to departmental auditor</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Cleared / Adjudicated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{clearedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Legitimate medical emergency cleared</div>
        </div>
      </div>

      {/* Filter Tabs & Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Rule-Based Anomaly Exceptions Queue ({filteredExceptions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Heuristic &amp; rule violations flagged across clinical mutations and financial transactions
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-medium">
            {['ALL', 'FLAGGED', 'UNDER_REVIEW', 'CLEARED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Exception List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading anomaly exceptions...
            </div>
          ) : filteredExceptions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No anomalies found matching current status filter.
            </div>
          ) : (
            filteredExceptions.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {item.id}
                    </span>
                    {getStatusBadge(item.status)}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : item.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Log Ref: {item.logId}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 leading-snug">
                    {item.description}
                  </h4>

                  <div className="text-[11px] text-slate-500 font-mono bg-slate-100/80 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-700">Triggered Rule: </span>
                    {item.detectedRule}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.logEntry.userName} ({item.logEntry.userRole})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    {item.assignedAuditor && (
                      <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        Assigned: {item.assignedAuditor}
                      </span>
                    )}
                  </div>

                  {item.reviewNotes && (
                    <div className="text-xs text-slate-600 bg-amber-50/50 p-2 rounded border border-amber-200/60 mt-1 italic">
                      "{item.reviewNotes}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  <button
                    onClick={() => onInspectLog(item.logId)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
                    title="Inspect underlying audit entry"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Raw Event</span>
                  </button>

                  <button
                    onClick={() => onSelectException(item)}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Adjudicate</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
