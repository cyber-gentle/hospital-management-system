import { StaffProfile, DutyShift, LeaveRequest, HRMetrics } from './types';
import { INITIAL_STAFF, INITIAL_SHIFTS, INITIAL_LEAVE_REQUESTS } from './mockData';

const STORAGE_KEY_STAFF = 'hims_hr_staff_v1';
const STORAGE_KEY_SHIFTS = 'hims_hr_shifts_v1';
const STORAGE_KEY_LEAVES = 'hims_hr_leaves_v1';

class HrApi {
  private initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEY_STAFF)) {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(INITIAL_STAFF));
    }
    if (!localStorage.getItem(STORAGE_KEY_SHIFTS)) {
      localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    }
    if (!localStorage.getItem(STORAGE_KEY_LEAVES)) {
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(INITIAL_LEAVE_REQUESTS));
    }
  }

  private getStoredStaff(): StaffProfile[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_STAFF);
      return data ? JSON.parse(data) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  }

  private saveStaff(staff: StaffProfile[]): void {
    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(staff));
  }

  private getStoredShifts(): DutyShift[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_SHIFTS);
      return data ? JSON.parse(data) : INITIAL_SHIFTS;
    } catch {
      return INITIAL_SHIFTS;
    }
  }

  private saveShifts(shifts: DutyShift[]): void {
    localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(shifts));
  }

  private getStoredLeaves(): LeaveRequest[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEAVES);
      return data ? JSON.parse(data) : INITIAL_LEAVE_REQUESTS;
    } catch {
      return INITIAL_LEAVE_REQUESTS;
    }
  }

  private saveLeaves(leaves: LeaveRequest[]): void {
    localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(leaves));
  }

  // --- Staff Profiles ---

  async getStaff(params?: {
    department?: string;
    cadre?: string;
    status?: string;
    search?: string;
  }): Promise<StaffProfile[]> {
    try {
      const q = new URLSearchParams();
      if (params?.department && params.department !== 'ALL') q.append('department', params.department);
      if (params?.cadre && params.cadre !== 'ALL') q.append('cadre', params.cadre);
      if (params?.status && params.status !== 'ALL') q.append('status', params.status);
      if (params?.search) q.append('search', params.search);

      const res = await fetch(`/api/v1/hr/staff?${q.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    let staff = this.getStoredStaff();
    if (params) {
      if (params.department && params.department !== 'ALL') {
        staff = staff.filter((s) => s.department === params.department);
      }
      if (params.cadre && params.cadre !== 'ALL') {
        staff = staff.filter((s) => s.cadre === params.cadre);
      }
      if (params.status && params.status !== 'ALL') {
        staff = staff.filter((s) => s.status === params.status);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        staff = staff.filter(
          (s) =>
            s.firstName.toLowerCase().includes(query) ||
            s.lastName.toLowerCase().includes(query) ||
            s.staffNumber.toLowerCase().includes(query) ||
            s.designation.toLowerCase().includes(query) ||
            (s.licenseNumber && s.licenseNumber.toLowerCase().includes(query))
        );
      }
    }
    return staff;
  }

  async getStaffById(id: string): Promise<StaffProfile | null> {
    try {
      const res = await fetch(`/api/v1/hr/staff/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const staff = this.getStoredStaff();
    return staff.find((s) => s.id === id) || null;
  }

  async createStaff(profile: Omit<StaffProfile, 'id'>): Promise<StaffProfile> {
    try {
      const res = await fetch('/api/v1/hr/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const staffList = this.getStoredStaff();
    const newStaff: StaffProfile = {
      ...profile,
      id: `STF-2026-${String(staffList.length + 1).padStart(3, '0')}`
    };
    staffList.unshift(newStaff);
    this.saveStaff(staffList);
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<StaffProfile>): Promise<StaffProfile> {
    try {
      const res = await fetch(`/api/v1/hr/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const staffList = this.getStoredStaff();
    const index = staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with ID ${id} not found`);

    const updated = { ...staffList[index]!, ...updates };
    staffList[index] = updated;
    this.saveStaff(staffList);
    return updated;
  }

  // --- Duty Shifts ---

  async getDutyRoster(params?: {
    department?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DutyShift[]> {
    try {
      const q = new URLSearchParams();
      if (params?.department && params.department !== 'ALL') q.append('department', params.department);
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);

      const res = await fetch(`/api/v1/hr/shifts?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let shifts = this.getStoredShifts();
    if (params) {
      if (params.department && params.department !== 'ALL') {
        shifts = shifts.filter((s) => s.department === params.department);
      }
      if (params.startDate) {
        shifts = shifts.filter((s) => s.shiftDate >= params.startDate!);
      }
      if (params.endDate) {
        shifts = shifts.filter((s) => s.shiftDate <= params.endDate!);
      }
    }
    return shifts;
  }

  async createShift(shift: Omit<DutyShift, 'id'>): Promise<DutyShift> {
    try {
      const res = await fetch('/api/v1/hr/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shift)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const shifts = this.getStoredShifts();
    const newShift: DutyShift = {
      ...shift,
      id: `SHF-2026-${String(shifts.length + 101).padStart(3, '0')}`
    };
    shifts.push(newShift);
    this.saveShifts(shifts);
    return newShift;
  }

  async updateShift(id: string, updates: Partial<DutyShift>): Promise<DutyShift> {
    try {
      const res = await fetch(`/api/v1/hr/shifts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const shifts = this.getStoredShifts();
    const index = shifts.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Shift ${id} not found`);

    const updated = { ...shifts[index]!, ...updates };
    shifts[index] = updated;
    this.saveShifts(shifts);
    return updated;
  }

  async deleteShift(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/v1/hr/shifts/${id}`, { method: 'DELETE' });
      if (res.ok) return;
    } catch {
      // Fallback
    }

    const shifts = this.getStoredShifts();
    const filtered = shifts.filter((s) => s.id !== id);
    this.saveShifts(filtered);
  }

  // --- Leave Requests ---

  async getLeaveRequests(params?: { status?: string; staffId?: string }): Promise<LeaveRequest[]> {
    try {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') q.append('status', params.status);
      if (params?.staffId) q.append('staffId', params.staffId);

      const res = await fetch(`/api/v1/hr/leaves?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let leaves = this.getStoredLeaves();
    if (params) {
      if (params.status && params.status !== 'ALL') {
        leaves = leaves.filter((l) => l.status === params.status);
      }
      if (params.staffId) {
        leaves = leaves.filter((l) => l.staffId === params.staffId);
      }
    }
    return leaves;
  }

  async submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'appliedAt'>): Promise<LeaveRequest> {
    try {
      const res = await fetch('/api/v1/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const leaves = this.getStoredLeaves();
    const newLeave: LeaveRequest = {
      ...request,
      id: `LEV-2026-${String(leaves.length + 41).padStart(3, '0')}`,
      appliedAt: new Date().toISOString()
    };
    leaves.unshift(newLeave);
    this.saveLeaves(leaves);
    return newLeave;
  }

  async adjudicateLeaveRequest(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    notes: string,
    approvedBy: string
  ): Promise<LeaveRequest> {
    try {
      const res = await fetch(`/api/v1/hr/leaves/${id}/adjudicate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes, approvedBy })
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const leaves = this.getStoredLeaves();
    const index = leaves.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Leave request ${id} not found`);

    const updated: LeaveRequest = {
      ...leaves[index]!,
      status: decision,
      approvedBy,
      approvalNotes: notes,
      reviewedAt: new Date().toISOString()
    };
    leaves[index] = updated;
    this.saveLeaves(leaves);
    return updated;
  }

  async getHRMetrics(): Promise<HRMetrics> {
    const staff = this.getStoredStaff();
    const shifts = this.getStoredShifts();
    const leaves = this.getStoredLeaves();

    const activeStaff = staff.filter((s) => s.status === 'ACTIVE').length;
    const onLeave = staff.filter((s) => s.status === 'ON_LEAVE').length;
    const expiringLicensesCount = staff.filter((s) => s.licenseStatus === 'EXPIRING_SOON').length;
    const todayStr = new Date().toISOString().substring(0, 10);
    const activeShiftsToday = shifts.filter((s) => s.shiftDate === todayStr).length;
    const pendingLeaveRequests = leaves.filter((l) => l.status === 'PENDING_HOD').length;

    return {
      totalStaff: staff.length,
      activeStaff,
      onLeave,
      expiringLicensesCount,
      activeShiftsToday,
      pendingLeaveRequests
    };
  }
}

export const hrApi = new HrApi();
