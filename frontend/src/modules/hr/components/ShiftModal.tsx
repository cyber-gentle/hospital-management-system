import React, { useState } from 'react';
import {
  X,
  Clock,
  Save
} from 'lucide-react';
import { DutyShift, ShiftType, ShiftStatus, StaffProfile } from '../types';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Omit<DutyShift, 'id'>) => Promise<void>;
  staffList: StaffProfile[];
  initialShift?: DutyShift | null;
}

const DEPARTMENTS = [
  'Nursing Services',
  'Accident & Emergency',
  'Obstetrics & Gynaecology',
  'Internal Medicine',
  'General Surgery',
  'Pharmacy',
  'Laboratory',
  'Mortuary & Pathology Services'
];

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  staffList,
  initialShift
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState(initialShift?.staffId || staffList[0]?.id || '');
  const [department, setDepartment] = useState(initialShift?.department || DEPARTMENTS[0]!);
  const [wardOrUnit, setWardOrUnit] = useState(initialShift?.wardOrUnit || '');
  const [shiftDate, setShiftDate] = useState(initialShift?.shiftDate || new Date().toISOString().substring(0, 10));
  const [shiftType, setShiftType] = useState<ShiftType>(initialShift?.shiftType || 'MORNING');
  const [startTime, setStartTime] = useState(initialShift?.startTime || '07:30');
  const [endTime, setEndTime] = useState(initialShift?.endTime || '15:30');
  const [status, setStatus] = useState<ShiftStatus>(initialShift?.status || 'SCHEDULED');
  const [notes, setNotes] = useState(initialShift?.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type);
    switch (type) {
      case 'MORNING':
        setStartTime('07:30');
        setEndTime('15:30');
        break;
      case 'AFTERNOON':
        setStartTime('15:30');
        setEndTime('21:30');
        break;
      case 'NIGHT':
        setStartTime('21:30');
        setEndTime('07:30');
        break;
      case 'CALL_DUTY':
        setStartTime('08:00');
        setEndTime('08:00');
        break;
      case 'OFF_DUTY':
        setStartTime('00:00');
        setEndTime('00:00');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const staff = staffList.find((s) => s.id === selectedStaffId);
    if (!staff) {
      setError('Please select a valid staff member.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        staffId: staff.id,
        staffName: `${staff.firstName} ${staff.lastName}`,
        staffRole: staff.designation,
        department,
        wardOrUnit: wardOrUnit.trim() || undefined,
        shiftDate,
        shiftType,
        startTime,
        endTime,
        status,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule shift.');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {initialShift ? 'Modify Duty Shift' : 'Schedule Department Shift'}
              </h3>
              <p className="text-xs text-slate-400">
                Weekly Duty Roster &amp; Staff Station Assignment (FR-HR-02)
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
              Select Staff Member <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.staffNumber}) — {s.designation} [{s.department}]
                </option>
              ))}
            </select>
          </div>

          {/* Department & Station */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ward / Station Unit
              </label>
              <input
                type="text"
                value={wardOrUnit}
                onChange={(e) => setWardOrUnit(e.target.value)}
                placeholder="e.g. Ward 4 / Triage Desk"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date & Shift Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Schedule
              </label>
              <select
                value={shiftType}
                onChange={(e) => handleShiftTypeChange(e.target.value as ShiftType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="MORNING">Morning (07:30 - 15:30)</option>
                <option value="AFTERNOON">Afternoon (15:30 - 21:30)</option>
                <option value="NIGHT">Night (21:30 - 07:30)</option>
                <option value="CALL_DUTY">24h Call Duty (On-Call)</option>
                <option value="OFF_DUTY">Scheduled Off-Duty</option>
              </select>
            </div>
          </div>

          {/* Time & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShiftStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="SWAPPED">Swapped</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Notes / Responsibilities
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ward in-charge nurse / Stat crossmatch duty"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
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
                <>Scheduling Shift...</>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Shift Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
