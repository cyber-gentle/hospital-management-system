import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Award,
  RefreshCw,
  Plus,
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import {
  StaffProfile,
  DutyShift,
  LeaveRequest,
  HRMetrics
} from './types';
import { hrApi } from './api';
import { StaffListView } from './components/StaffListView';
import { StaffModal } from './components/StaffModal';
import { DutyRosterView } from './components/DutyRosterView';
import { ShiftModal } from './components/ShiftModal';
import { LeaveManagementView } from './components/LeaveManagementView';
import { LeaveRequestModal } from './components/LeaveRequestModal';

interface HrViewProps {
  onBackToDashboard?: () => void;
}

export const HrView: React.FC<HrViewProps> = ({ onBackToDashboard }) => {
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [shifts, setShifts] = useState<DutyShift[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tabs: 'directory' | 'roster' | 'leaves'
  const [activeTab, setActiveTab] = useState<'directory' | 'roster' | 'leaves'>('directory');

  // Modals state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<DutyShift | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [sData, rData, lData, mData] = await Promise.all([
        hrApi.getStaff(),
        hrApi.getDutyRoster(),
        hrApi.getLeaveRequests(),
        hrApi.getHRMetrics()
      ]);
      setStaffList(sData);
      setShifts(rData);
      setLeaves(lData);
      setMetrics(mData);
    } catch (error) {
      setStaffList([]); setShifts([]); setLeaves([]); setMetrics(null); setEditingStaff(null); setEditingShift(null);
      setLoadError(error instanceof Error ? error.message : "Data could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Staff Handlers
  const handleSaveStaff = async (profile: Omit<StaffProfile, 'id'>) => {
    if (editingStaff) {
      await hrApi.updateStaff(editingStaff.id, profile);
    } else {
      await hrApi.createStaff(profile);
    }
    await loadData();
    setEditingStaff(null);
  };

  const openAddStaff = () => {
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const openEditStaff = (staff: StaffProfile) => {
    setEditingStaff(staff);
    setIsStaffModalOpen(true);
  };

  // Shift Handlers
  const handleSaveShift = async (shift: Omit<DutyShift, 'id'>) => {
    if (editingShift) {
      await hrApi.updateShift(editingShift.id, shift);
    } else {
      await hrApi.createShift(shift);
    }
    await loadData();
    setEditingShift(null);
  };

  const handleDeleteShift = async (shiftId: string) => {
    await hrApi.deleteShift(shiftId);
    await loadData();
  };

  const openAddShift = () => {
    setEditingShift(null);
    setIsShiftModalOpen(true);
  };

  const openEditShift = (shift: DutyShift) => {
    setEditingShift(shift);
    setIsShiftModalOpen(true);
  };

  // Leave Handlers
  const handleSubmitLeave = async (request: Omit<LeaveRequest, 'id' | 'appliedAt'>) => {
    await hrApi.submitLeaveRequest(request);
    await loadData();
  };

  const handleAdjudicateLeave = async (
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    notes: string,
    approvedBy: string
  ) => {
    await hrApi.adjudicateLeaveRequest(id, decision, notes, approvedBy);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{loadError}</p>}
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
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Hospital Administration &amp; Workforce Operations
              </span>
              <span className="text-xs text-slate-400">FR-HR-01 to FR-HR-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              HR &amp; Staff Management Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Clinical &amp; administrative staff directory, professional statutory credential tracking (MDCN/NMCN/PCN),
              departmental duty rosters, and leave coverage management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData()}
              className="px-4 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center gap-2 shadow-sm"
              title="Refresh staff data"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={openAddStaff}
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 ring-1 ring-white/20"
            >
              <Plus className="w-4 h-4" />
              + Onboard Staff
            </button>
          </div>
        </div>

        {/* Workforce Metrics Summary */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Hospital Staff</span>
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{metrics.activeStaff}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Total Registered: <span className="text-blue-300 font-bold">{metrics.totalStaff}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Statutory License Alerts</span>
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {metrics.expiringLicensesCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Expiring within 30 days</div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Shifts Active Today</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {metrics.activeShiftsToday}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Morning / Afternoon / Night</div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Pending Leave Approvals</span>
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 mt-1">
                {metrics.pendingLeaveRequests}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Awaiting HOD sign-off</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory &amp; Licenses (FR-HR-01)</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
            {staffList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Department Duty Roster (FR-HR-02)</span>
          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
            {shifts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'leaves'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-500" />
          <span>Staff Leave &amp; Relief Cover (FR-HR-03)</span>
          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {leaves.length}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'directory' && (
        <StaffListView
          staffList={staffList}
          onAddStaff={openAddStaff}
          onEditStaff={openEditStaff}
          loading={loading}
        />
      )}

      {activeTab === 'roster' && (
        <DutyRosterView
          shifts={shifts}
          onAddShift={openAddShift}
          onEditShift={openEditShift}
          onDeleteShift={handleDeleteShift}
          loading={loading}
        />
      )}

      {activeTab === 'leaves' && (
        <LeaveManagementView
          leaveRequests={leaves}
          onApplyLeave={() => setIsLeaveModalOpen(true)}
          onAdjudicateLeave={handleAdjudicateLeave}
          loading={loading}
        />
      )}

      {/* Modals */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaff(null);
        }}
        onSave={handleSaveStaff}
        initialStaff={editingStaff}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setEditingShift(null);
        }}
        onSave={handleSaveShift}
        staffList={staffList}
        initialShift={editingShift}
      />

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSubmit={handleSubmitLeave}
        staffList={staffList}
      />
    </div>
  );
};
