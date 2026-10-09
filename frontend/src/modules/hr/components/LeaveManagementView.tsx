import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  User,
  ShieldCheck
} from 'lucide-react';
import { LeaveRequest, LeaveStatus } from '../types';

interface LeaveManagementViewProps {
  leaveRequests: LeaveRequest[];
  onApplyLeave: () => void;
  onAdjudicateLeave: (
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    notes: string,
    approvedBy: string
  ) => Promise<void>;
  loading?: boolean;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  leaveRequests,
  onApplyLeave,
  onAdjudicateLeave,
  loading = false
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [adjudicatingId, setAdjudicatingId] = useState<string | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [approverName, setApproverName] = useState('Dr. Head of Department');

  const filteredLeaves = leaveRequests.filter((l) => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    await onAdjudicateLeave(
      id,
      decision,
      decisionNotes || (decision === 'APPROVED' ? 'Approved per department staffing quota.' : 'Rejected due to shift coverage constraints.'),
      approverName
    );
    setAdjudicatingId(null);
    setDecisionNotes('');
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING_HOD':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-amber-600" />
            Pending HOD
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-medium">
            {['ALL', 'PENDING_HOD', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'PENDING_HOD' ? 'Pending Approval' : st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onApplyLeave}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Apply for Leave</span>
        </button>
      </div>

      {/* Leave List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Staff Leave Applications ({filteredLeaves.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading leave requests...
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No leave requests found matching this filter.
            </div>
          ) : (
            filteredLeaves.map((req) => (
              <div key={req.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900">{req.id}</span>
                    {getStatusBadge(req.status)}
                    <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                      {req.leaveType} LEAVE
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      • {req.totalDays} Days ({req.startDate} to {req.endDate})
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Applied: {new Date(req.appliedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px]">Applicant:</div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{req.staffName}</span>
                      <span className="text-slate-400 font-normal">({req.department})</span>
                    </div>
                    <p className="text-slate-600 mt-1 italic">"{req.reason}"</p>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Relief Duty Cover:</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {req.reliefStaffName || 'No designated relief officer'}
                    </div>

                    {req.approvedBy && (
                      <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        <span className="font-bold">Reviewed By: </span>
                        {req.approvedBy} — "{req.approvalNotes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* HOD Adjudication Action */}
                {req.status === 'PENDING_HOD' && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {adjudicatingId === req.id ? (
                      <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Approver Designation
                            </label>
                            <input
                              type="text"
                              value={approverName}
                              onChange={(e) => setApproverName(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              HOD Remarks
                            </label>
                            <input
                              type="text"
                              value={decisionNotes}
                              onChange={(e) => setDecisionNotes(e.target.value)}
                              placeholder="e.g. Approved per roster staffing cover"
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAdjudicatingId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(req.id, 'REJECTED')}
                            className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                          >
                            Reject Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision(req.id, 'APPROVED')}
                            className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                          >
                            Approve Leave
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => setAdjudicatingId(req.id)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Adjudicate Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
