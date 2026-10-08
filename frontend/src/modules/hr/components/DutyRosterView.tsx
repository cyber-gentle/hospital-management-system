import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Sun,
  Sunset,
  Moon,
  PhoneCall,
  Edit2,
  Trash2,
  MapPin
} from 'lucide-react';
import { DutyShift, ShiftType } from '../types';

interface DutyRosterViewProps {
  shifts: DutyShift[];
  onAddShift: () => void;
  onEditShift: (shift: DutyShift) => void;
  onDeleteShift: (shiftId: string) => Promise<void>;
  loading?: boolean;
}

const DEPARTMENTS = [
  'ALL',
  'Nursing Services',
  'Accident & Emergency',
  'Obstetrics & Gynaecology',
  'Internal Medicine',
  'Pharmacy',
  'Laboratory',
  'Mortuary & Pathology Services'
];

export const DutyRosterView: React.FC<DutyRosterViewProps> = ({
  shifts,
  onAddShift,
  onEditShift,
  onDeleteShift,
  loading = false
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const filteredShifts = shifts.filter((s) => {
    const matchesDept = selectedDepartment === 'ALL' || s.department === selectedDepartment;
    const matchesDate = !selectedDate || s.shiftDate === selectedDate;
    return matchesDept && matchesDate;
  });

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case 'MORNING':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'AFTERNOON':
        return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'NIGHT':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'CALL_DUTY':
        return <PhoneCall className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const shiftTypes: { id: ShiftType; label: string; time: string; color: string }[] = [
    { id: 'MORNING', label: 'Morning Shift', time: '07:30 – 15:30', color: 'border-amber-200 bg-amber-50/30' },
    { id: 'AFTERNOON', label: 'Afternoon Shift', time: '15:30 – 21:30', color: 'border-orange-200 bg-orange-50/30' },
    { id: 'NIGHT', label: 'Night Shift', time: '21:30 – 07:30', color: 'border-indigo-200 bg-indigo-50/30' },
    { id: 'CALL_DUTY', label: 'Call Duty / On-Call', time: '24 Hours', color: 'border-rose-200 bg-rose-50/30' }
  ];

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Department:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onAddShift}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Schedule Shift</span>
        </button>
      </div>

      {/* Shift Buckets */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Loading departmental duty shifts...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shiftTypes.map((st) => {
            const bucketShifts = filteredShifts.filter((s) => s.shiftType === st.id);

            return (
              <div
                key={st.id}
                className={`rounded-2xl border ${st.color} flex flex-col h-full shadow-sm overflow-hidden bg-white`}
              >
                {/* Bucket Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    {getShiftIcon(st.id)}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{st.label}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{st.time}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {bucketShifts.length}
                  </span>
                </div>

                {/* Shift Cards in Bucket */}
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
                  {bucketShifts.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No staff scheduled
                    </div>
                  ) : (
                    bucketShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {shift.staffName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {shift.staffRole}
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {shift.status}
                          </span>
                        </div>

                        {shift.wardOrUnit && (
                          <div className="text-[10px] text-slate-600 flex items-center gap-1 font-medium bg-slate-50 p-1.5 rounded border border-slate-100">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{shift.wardOrUnit}</span>
                          </div>
                        )}

                        {shift.notes && (
                          <p className="text-[10px] text-slate-500 italic">
                            "{shift.notes}"
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {shift.startTime} – {shift.endTime}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditShift(shift)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit shift"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteShift(shift.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Cancel shift"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
