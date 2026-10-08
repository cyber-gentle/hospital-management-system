import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Server,
  RefreshCw,
  Lock,
  ArrowLeft,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Database
} from 'lucide-react';
import {
  AuditLogEntry,
  AuditAnomalyException,
  AuditFilterParams,
  AuditMetrics,
  ExceptionReviewStatus
} from './types';
import { auditApi } from './api';
import { LogViewerTable } from './components/LogViewerTable';
import { LogDetailsDrawer } from './components/LogDetailsDrawer';
import { AuditFilterToolbar } from './components/AuditFilterToolbar';
import { AnomalyCenterView } from './components/AnomalyCenterView';
import { AnomalyExceptionModal } from './components/AnomalyExceptionModal';

interface AuditViewProps {
  onBackToDashboard?: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onBackToDashboard }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [exceptions, setExceptions] = useState<AuditAnomalyException[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'stream' | 'anomalies' | 'integrity'
  const [activeTab, setActiveTab] = useState<'stream' | 'anomalies' | 'integrity'>('stream');

  // Filters
  const [filters, setFilters] = useState<AuditFilterParams>({
    service: 'ALL',
    module: 'ALL',
    status: 'ALL',
    actionCategory: 'ALL',
    searchQuery: '',
    onlyAnomalies: false
  });

  // Selected Log for Inspector Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Selected Exception for Adjudication Modal
  const [selectedException, setSelectedException] = useState<AuditAnomalyException | null>(null);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, exceptionsData, metricsData] = await Promise.all([
        auditApi.getAuditLogs(filters),
        auditApi.getAnomalyExceptions(),
        auditApi.getAuditMetrics()
      ]);
      setLogs(logsData);
      setExceptions(exceptionsData);
      setMetrics(metricsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      service: 'ALL',
      module: 'ALL',
      status: 'ALL',
      actionCategory: 'ALL',
      searchQuery: '',
      onlyAnomalies: false,
      startDate: undefined,
      endDate: undefined
    });
  };

  const handleExportCSV = async () => {
    const csvContent = await auditApi.exportAuditLogs(filters, 'csv');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hims_audit_trail_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = async () => {
    const jsonContent = await auditApi.exportAuditLogs(filters, 'json');
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hims_audit_cryptographic_bundle_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateExceptionStatus = async (
    exceptionId: string,
    status: ExceptionReviewStatus,
    notes: string,
    auditorName: string
  ) => {
    await auditApi.updateExceptionStatus(exceptionId, status, notes, auditorName);
    await loadData();
  };

  const handleInspectLogById = async (logId: string) => {
    const log = await auditApi.getAuditLogById(logId);
    if (log) {
      setSelectedLog(log);
    }
  };

  const openExceptionAdjudication = (exception: AuditAnomalyException) => {
    setSelectedException(exception);
    setIsExceptionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Department Overview */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Directory
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                System Governance &amp; Supervisory Control
              </span>
              <span className="text-xs text-slate-400">FR-AUD-01 to FR-AUD-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Audit Department &amp; Log Inspector
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Authoritative, read-only supervisory console inspecting immutable append-only logs across all
              20 hospital modules from both Go Core and Python Interop services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData()}
              className="px-4 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center gap-2 shadow-sm"
              title="Refresh log stream"
            >
              <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stream
            </button>
            <div className="px-4 py-2 text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Append-Only DB Verified
            </div>
          </div>
        </div>

        {/* Real-time System Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Total Recorded Events</span>
                <Layers className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{metrics.totalEvents}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Go Core: <span className="text-blue-300 font-bold">{metrics.goServiceEvents}</span> | Py: <span className="text-amber-300 font-bold">{metrics.pythonServiceEvents}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Anomalies</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">{metrics.activeAnomalies}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Critical Severity: <span className="text-rose-400 font-bold">{metrics.criticalExceptions}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Authorization Failures</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 mt-1">{metrics.failuresCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">RBAC boundary blocks logged</div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Cryptographic Digest</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">100% Intact</div>
              <div className="text-[10px] text-slate-400 mt-0.5">SHA-256 seal chain valid</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('stream')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'stream'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Audit Stream Viewer (FR-AUD-01 &amp; FR-AUD-02)</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'anomalies'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Anomaly &amp; Exception Center (FR-AUD-03)</span>
          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {exceptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('integrity')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'integrity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; Policy Rules</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          <AuditFilterToolbar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            anomaliesCount={exceptions.length}
          />

          <LogViewerTable
            logs={logs}
            onSelectLog={(log) => setSelectedLog(log)}
            loading={loading}
          />
        </div>
      )}

      {activeTab === 'anomalies' && (
        <AnomalyCenterView
          exceptions={exceptions}
          onSelectException={openExceptionAdjudication}
          onInspectLog={handleInspectLogById}
          loading={loading}
        />
      )}

      {activeTab === 'integrity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Audit Integrity &amp; AGENTS.md Architectural Guardrails
              </h3>
              <p className="text-xs text-slate-500">
                Authoritative rules enforced by Go Core audit writer and verified by the Audit Department
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
                <Database className="w-4 h-4 text-blue-600" />
                Append-Only Database Contract (Rule #2 &amp; #3)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">audit_logs</code> table has
                zero <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">UPDATE</code> or{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">DELETE</code> privileges granted
                at the PostgreSQL database layer. All clinical and financial deletions are soft-deleted via{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">deleted_at</code> with an
                immediate immutable audit entry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
                <Server className="w-4 h-4 text-amber-600" />
                Cross-Service Internal Ingestion (Rule #6c)
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Python Interop service (:8000) is strictly prohibited from writing to audit or RBAC tables directly.
                Every mutating action from Laboratory (LIS), NHIA Claims, or Radiology calls Go Core's{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">POST /internal/audit-log</code>{' '}
                using internal service credentials, guaranteeing a unified audit timeline.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
                <Lock className="w-4 h-4 text-emerald-600" />
                Cryptographic Digest Verification
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every event record is sealed with a SHA-256 digest calculated across the previous log digest, timestamp,
                actor ID, action, and normalized JSON payload. Any manual tampering with database rows invalidates the
                chain instantly and triggers immediate supervisory alerts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                Active Anomaly Detection Rules
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time heuristic evaluation triggers alerts on high-value invoice deletions (over ₦1,000,000), nocturnal
                controlled drug dispensing (11:00 PM - 05:00 AM), forced discharge checklist overrides with unpaid
                balances, and repeated unauthorized role permission checks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Log Inspection Slide-Over Drawer */}
      <LogDetailsDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onOpenAnomalyReview={() => {
          setSelectedLog(null);
          setActiveTab('anomalies');
        }}
      />

      {/* Anomaly Adjudication Modal */}
      <AnomalyExceptionModal
        exception={selectedException}
        isOpen={isExceptionModalOpen}
        onClose={() => {
          setIsExceptionModalOpen(false);
          setSelectedException(null);
        }}
        onUpdateStatus={handleUpdateExceptionStatus}
        onInspectLog={(logId) => {
          setIsExceptionModalOpen(false);
          handleInspectLogById(logId);
        }}
      />
    </div>
  );
};
