import React, { useState } from 'react';
import {
  X,
  Calendar,
  Send
} from 'lucide-react';
import { LeaveRequest, LeaveType, StaffProfile } from '../types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'appliedAt'>) => Promise<void>;
  staffList: StaffProfile[];
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  staffList
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [reason, setReason] = useState('');
  const [selectedReliefId, setSelectedReliefId] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate day difference
  const calculateDays = () => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) return 0;
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const totalDays = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const staff = staffList.find((s) => s.id === selectedStaffId);
    if (!staff) {
      setError('Please select an active staff member.');
      return;
    }

    if (totalDays <= 0) {
      setError('End date must be on or after start date.');
      return;
    }

    if (!reason.trim()) {
      setError('A valid reason for leave is required.');
      return;
    }

    const relief = staffList.find((s) => s.id === selectedReliefId);

    setSaving(true);
    try {
      await onSubmit({
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        department: staff.department,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason.trim(),
        reliefStaffId: relief?.id,
        reliefStaffName: relief ? `${relief.firstName} ${relief.lastName} (${relief.designation})` : undefined,
        status: 'PENDING_HOD'
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Apply for Staff Leave</h3>
              <p className="text-xs text-slate-400">
                Staff Leave &amp; Relief Officer Coverage (FR-HR-03)
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

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Staff Member */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Applicant Staff Member <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.staffNumber}) — {s.department}
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Classification <span className="text-rose-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ANNUAL">Annual Leave (Statutory Vacation)</option>
              <option value="SICK">Sick Leave (Medical Certificate Attached)</option>
              <option value="MATERNITY">Maternity Leave (16 Weeks Statutory)</option>
              <option value="PATERNITY">Paternity Leave (14 Days Statutory)</option>
              <option value="STUDY">Study / Examination Leave</option>
              <option value="CASUAL">Casual Leave (Emergency)</option>
              <option value="COMPASSIONATE">Compassionate / Bereavement</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resumption Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between font-semibold">
            <span>Total Leave Duration:</span>
            <span className="font-bold text-sm bg-blue-200/80 px-2.5 py-0.5 rounded-full text-blue-950 font-mono">
              {totalDays} Calendar Days
            </span>
          </div>

          {/* Relief Staffing */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominated Relief Officer (Duty Cover)
            </label>
            <select
              value={selectedReliefId}
              onChange={(e) => setSelectedReliefId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- No Relief Assigned --</option>
              {staffList
                .filter((s) => s.id !== selectedStaffId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.designation}) — {s.department}
                  </option>
                ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear purpose of leave, conference details, or personal justification..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Footer Controls */}
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
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit for HOD Approval
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
