import React, { useState } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  AlertTriangle,
  Award,
  Building,
  Edit2,
  Plus,
  CheckCircle2,
  Users
} from 'lucide-react';
import { StaffProfile, LicenseStatus } from '../types';

interface StaffListViewProps {
  staffList: StaffProfile[];
  onAddStaff: () => void;
  onEditStaff: (staff: StaffProfile) => void;
  loading?: boolean;
}

const DEPARTMENTS = [
  'ALL',
  'Clinical Services',
  'Obstetrics & Gynaecology',
  'Internal Medicine',
  'General Surgery',
  'Accident & Emergency',
  'Nursing Services',
  'Pharmacy',
  'Laboratory (Haematology)',
  'Finance & Accounts',
  'Mortuary & Pathology Services'
];

export const StaffListView: React.FC<StaffListViewProps> = ({
  staffList,
  onAddStaff,
  onEditStaff,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [cadreFilter, setCadreFilter] = useState('ALL');
  const [licenseFilter, setLicenseFilter] = useState('ALL');

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.licenseNumber && s.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    const matchesCadre = cadreFilter === 'ALL' || s.cadre === cadreFilter;
    const matchesLicense = licenseFilter === 'ALL' || s.licenseStatus === licenseFilter;

    return matchesSearch && matchesDept && matchesCadre && matchesLicense;
  });

  const getLicenseBadge = (licenseType: string, licenseNumber?: string, status?: LicenseStatus) => {
    if (licenseType === 'NOT_APPLICABLE' || !licenseNumber) {
      return <span className="text-[11px] text-slate-400">N/A</span>;
    }

    switch (status) {
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
            {licenseType}: {licenseNumber} (Expiring)
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
            {licenseType}: {licenseNumber} (Expired)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            {licenseType}: {licenseNumber}
          </span>
        );
    }
  };

  const getStatusBadge = (status: StaffProfile['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>;
      case 'ON_LEAVE':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">On Leave</span>;
      case 'SUSPENDED':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Suspended</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by Name, Staff ID (HOSP/...), Title, MDCN/NMCN License..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            onClick={onAddStaff}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Onboard New Staff</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-400" /> Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Professional Cadre
            </label>
            <select
              value={cadreFilter}
              onChange={(e) => setCadreFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Cadres</option>
              <option value="MEDICAL">Medical (Doctors)</option>
              <option value="NURSING">Nursing Services</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="LABORATORY">Medical Laboratory</option>
              <option value="ADMINISTRATIVE">Administrative &amp; Finance</option>
              <option value="ALLIED_HEALTH">Allied Health</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3 text-slate-400" /> License Health
            </label>
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Licensing Statuses</option>
              <option value="ACTIVE">Active &amp; In-Date</option>
              <option value="EXPIRING_SOON">Expiring Soon (Within 30 Days)</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900">
              Staff Directory ({filteredStaff.length} Records)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Staff Name &amp; ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Cadre &amp; Designation</th>
                <th className="py-3 px-4">Statutory License</th>
                <th className="py-3 px-4">Employment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No staff records match the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & ID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {staff.firstName} {staff.lastName} {staff.otherNames || ''}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-blue-600">{staff.staffNumber}</span>
                        <span>• {staff.gender}</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {staff.department}
                    </td>

                    {/* Cadre & Designation */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{staff.designation}</div>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                        {staff.cadre}
                      </span>
                    </td>

                    {/* License */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getLicenseBadge(staff.licenseType, staff.licenseNumber, staff.licenseStatus)}
                      {staff.licenseExpiryDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Exp: {staff.licenseExpiryDate}
                        </div>
                      )}
                    </td>

                    {/* Employment */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] text-slate-600 font-medium capitalize">
                        {staff.employmentType.toLowerCase().replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        Since {new Date(staff.dateJoined).getFullYear()}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(staff.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onEditStaff(staff)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Edit staff profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
