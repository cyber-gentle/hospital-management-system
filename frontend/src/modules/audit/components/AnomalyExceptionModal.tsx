import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  User,
  AlertOctagon,
  FileText,
  Send,
  ExternalLink
} from 'lucide-react';
import { AuditAnomalyException, ExceptionReviewStatus } from '../types';

interface AnomalyExceptionModalProps {
  exception: AuditAnomalyException | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    exceptionId: string,
    status: ExceptionReviewStatus,
    notes: string,
    auditorName: string
  ) => Promise<void>;
  onInspectLog: (logId: string) => void;
}

export const AnomalyExceptionModal: React.FC<AnomalyExceptionModalProps> = ({
  exception,
  isOpen,
  onClose,
  onUpdateStatus,
  onInspectLog
}) => {
  const [status, setStatus] = useState<ExceptionReviewStatus>(exception?.status || 'UNDER_REVIEW');
  const [auditorName, setAuditorName] = useState(exception?.assignedAuditor || 'Auditor In-Charge');
  const [reviewNotes, setReviewNotes] = useState(exception?.reviewNotes || '');
  const [saving, setSaving] = useState(false);

  // Sync state if exception changes
  React.useEffect(() => {
    if (exception) {
      setStatus(exception.status);
      setAuditorName(exception.assignedAuditor || 'Auditor In-Charge');
      setReviewNotes(exception.reviewNotes || '');
    }
  }, [exception]);

  if (!isOpen || !exception) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateStatus(exception.id, status, reviewNotes, auditorName);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const getSeverityBadge = (severity: AuditAnomalyException['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> CRITICAL SEVERITY
          </span>
        );
      case 'HIGH':
        return (
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-orange-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> HIGH SEVERITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> MEDIUM SEVERITY
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-300">
            LOW SEVERITY
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Audit Exception Adjudication</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {exception.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rule-Based Anomaly Investigation &amp; Remediation Workflow (FR-AUD-03)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Severity & Triggered Rule */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>{getSeverityBadge(exception.severity)}</div>
            <div className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold">
              Log Ref: {exception.logId}
            </div>
          </div>

          {/* Description & Detection Rule */}
          <div className="space-y-3">
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1.5">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Detected Anomaly Summary
              </div>
              <p className="text-amber-800 leading-relaxed font-medium">
                {exception.description}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                Triggered Compliance Policy Rule:
              </span>
              <span className="font-mono text-slate-700 font-medium mt-0.5 block">
                {exception.detectedRule}
              </span>
            </div>
          </div>

          {/* Target Event Quick Summary */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 text-[11px] block">Actor &amp; Origin:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-slate-500" />
                {exception.logEntry.userName} ({exception.logEntry.userRole})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {exception.logEntry.service} / {exception.logEntry.module}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Detected At:</span>
              <span className="text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                {new Date(exception.timestamp).toUTCString()}
              </span>
              <button
                type="button"
                onClick={() => onInspectLog(exception.logId)}
                className="mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Inspect Full JSON Payload <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Adjudication Inputs */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Auditor Adjudication &amp; Investigation
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Investigation Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExceptionReviewStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="FLAGGED">FLAGGED (Under Initial Alert)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
                  <option value="CLEARED">CLEARED (Justified Medical Emergency)</option>
                  <option value="ESCALATED">ESCALATED (Forward to CMD / Disciplinary)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Auditor Name
                </label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="e.g. Chief Auditor Nwachukwu"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Investigation Findings &amp; Rationale Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Document findings, cross-references with ward logbooks, corroborating physician statements, or disciplinary recommendations..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>Updating Exception...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Save Adjudication Decision
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
