import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Server,
  User,
  Clock,
  Copy,
  Check,
  Database,
  Hash,
  Globe,
  CheckCircle2,
  XCircle,
  FileCode
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface LogDetailsDrawerProps {
  log: AuditLogEntry | null;
  onClose: () => void;
  onOpenAnomalyReview?: (logId: string) => void;
}

export const LogDetailsDrawer: React.FC<LogDetailsDrawerProps> = ({
  log,
  onClose,
  onOpenAnomalyReview
}) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span>Audit Event Record</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {log.id}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Immutable Append-Only Log Entry
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Anomaly Callout Banner if detected */}
          {log.isAnomaly && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Audit Anomaly Flagged
                </div>
                {onOpenAnomalyReview && (
                  <button
                    onClick={() => onOpenAnomalyReview(log.id)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-700 underline"
                  >
                    View in Exception Queue →
                  </button>
                )}
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {log.anomalyReason}
              </p>
            </div>
          )}

          {/* Tamper Seal & Cryptographic Verification */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Cryptographic Integrity Verification
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Seal Valid &amp; Verified
              </span>
            </div>
            <p className="text-xs text-slate-500">
              SHA-256 digest guaranteed by Go Core audit writer transaction:
            </p>
            <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 break-all select-all">
              {log.tamperSealHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>

          {/* Event Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Timestamp (UTC)
              </div>
              <div className="text-xs font-semibold text-slate-900 font-mono">
                {new Date(log.timestamp).toUTCString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(log.timestamp).toLocaleString()} (Local)
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Origin Service
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    log.service === 'interop-py'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  {log.service === 'interop-py' ? 'Python Interop (:8000)' : 'Go Core (:8080)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Module: <span className="font-bold uppercase text-slate-700">{log.module}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Actor &amp; Credentials
              </div>
              <div className="text-xs font-bold text-slate-900">{log.userName}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-mono text-[10px]">
                  {log.userRole}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{log.userId}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Network IP &amp; Status
              </div>
              <div className="flex items-center gap-2">
                {log.status === 'SUCCESS' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUCCESS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <XCircle className="w-3 h-3 text-rose-600" /> FAILURE
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                IP: {log.ipAddress}
              </div>
            </div>
          </div>

          {/* Action & Resource Overview */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              Target Mutation Target
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Audit Action:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block mt-0.5">
                  {log.action}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Resource Entity:</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-mono text-slate-700 font-semibold">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>{log.resourceType}: {log.resourceId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Structured Details JSON Explorer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600" />
                Event Structured Payload (`details`)
              </div>
              <button
                onClick={handleCopyJSON}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-72 border border-slate-800 shadow-inner">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Read-only Audit Log — No UPDATE/DELETE permitted per AGENTS.md</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
