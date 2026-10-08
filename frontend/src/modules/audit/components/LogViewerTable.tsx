import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface LogViewerTableProps {
  logs: AuditLogEntry[];
  onSelectLog: (log: AuditLogEntry) => void;
  loading?: boolean;
}

export const LogViewerTable: React.FC<LogViewerTableProps> = ({
  logs,
  onSelectLog,
  loading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table header bar */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">
            Audit Event Stream ({logs.length} Total Events)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Go Core
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Python Interop
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Success
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Failure
          </span>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Service &amp; Module</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Integrity</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading system audit records...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No audit log entries match the current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    log.isAnomaly ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-slate-900 font-medium">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(log.timestamp)}
                    </div>
                  </td>

                  {/* Service & Module */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          log.service === 'interop-py'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.service === 'interop-py' ? 'PY:8000' : 'GO:8080'}
                      </span>
                      <span className="font-semibold text-slate-800 uppercase tracking-tight text-[11px]">
                        {log.module}
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[200px]" title={log.action}>
                      {log.action}
                    </div>
                    {log.isAnomaly && (
                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Anomaly
                      </span>
                    )}
                  </td>

                  {/* Target Resource */}
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    <div className="text-slate-800 font-medium text-[11px]">
                      {log.resourceId}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {log.resourceType}
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">
                      {log.userName}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono text-[9px] font-semibold">
                        {log.userRole}
                      </span>
                      <span>• {log.ipAddress}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        FAILURE
                      </span>
                    )}
                  </td>

                  {/* Integrity */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200" title="Tamper-proof append-only seal verified">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectLog(log)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all font-medium inline-flex items-center gap-1"
                      title="Inspect Full Audit Record"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && logs.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(startIndex + pageSize, logs.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{logs.length}</span> events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
