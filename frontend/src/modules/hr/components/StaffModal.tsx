import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Building,
  Award,
  Save
} from 'lucide-react';
import { StaffProfile, StaffCadre, EmploymentType, LicenseType, LicenseStatus } from '../types';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Omit<StaffProfile, 'id'>) => Promise<void>;
  initialStaff?: StaffProfile | null;
}

const DEPARTMENTS = [
  'Clinical Services',
  'Obstetrics & Gynaecology',
  'Internal Medicine',
  'General Surgery',
  'Paediatrics',
  'Accident & Emergency',
  'Nursing Services',
  'Pharmacy',
  'Laboratory (Haematology)',
  'Laboratory (Chemical Pathology)',
  'Radiology & Imaging',
  'Finance & Accounts',
  'Mortuary & Pathology Services',
  'Administration & Human Resources'
];

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStaff
}) => {
  const [firstName, setFirstName] = useState(initialStaff?.firstName || '');
  const [lastName, setLastName] = useState(initialStaff?.lastName || '');
  const [otherNames, setOtherNames] = useState(initialStaff?.otherNames || '');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(initialStaff?.gender || 'FEMALE');
  const [dateOfBirth, setDateOfBirth] = useState(initialStaff?.dateOfBirth || '1990-01-01');
  const [email, setEmail] = useState(initialStaff?.email || '');
  const [phone, setPhone] = useState(initialStaff?.phone || '');

  const [staffNumber, setStaffNumber] = useState(initialStaff?.staffNumber || '');
  const [department, setDepartment] = useState(initialStaff?.department || DEPARTMENTS[0]!);
  const [cadre, setCadre] = useState<StaffCadre>(initialStaff?.cadre || 'MEDICAL');
  const [designation, setDesignation] = useState(initialStaff?.designation || '');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(initialStaff?.employmentType || 'FULL_TIME');
  const [dateJoined, setDateJoined] = useState(initialStaff?.dateJoined || new Date().toISOString().substring(0, 10));

  const [licenseType, setLicenseType] = useState<LicenseType>(initialStaff?.licenseType || 'MDCN');
  const [licenseNumber, setLicenseNumber] = useState(initialStaff?.licenseNumber || '');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(initialStaff?.licenseExpiryDate || '');

  const [bankName, setBankName] = useState(initialStaff?.bankDetails?.bankName || 'Zenith Bank');
  const [accountNumber, setAccountNumber] = useState(initialStaff?.bankDetails?.accountNumber || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffNumber.trim()) {
      setError('Staff identification number is mandatory.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Staff first name and surname are mandatory.');
      return;
    }

    setSaving(true);
    try {
      // Calculate license status
      let calculatedStatus: LicenseStatus = 'NOT_APPLICABLE';
      if (licenseType !== 'NOT_APPLICABLE' && licenseExpiryDate) {
        const expiry = new Date(licenseExpiryDate).getTime();
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (expiry < now) {
          calculatedStatus = 'EXPIRED';
        } else if (expiry - now < thirtyDaysMs) {
          calculatedStatus = 'EXPIRING_SOON';
        } else {
          calculatedStatus = 'ACTIVE';
        }
      }

      await onSave({
        staffNumber: staffNumber.trim().toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        otherNames: otherNames.trim() || undefined,
        gender,
        dateOfBirth,
        email: email.trim(),
        phone: phone.trim(),
        department,
        cadre,
        designation: designation.trim(),
        employmentType,
        dateJoined,
        licenseType,
        licenseNumber: licenseNumber.trim() || undefined,
        licenseExpiryDate: licenseExpiryDate || undefined,
        licenseStatus: calculatedStatus,
        status: initialStaff?.status || 'ACTIVE',
        bankDetails: accountNumber ? { bankName, accountNumber } : undefined
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save staff record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {initialStaff ? 'Edit Staff Profile' : 'Staff Onboarding & Profile Registry'}
              </h3>
              <p className="text-xs text-slate-400">
                Staff Credentials, Professional Licenses &amp; Department Allocation (FR-HR-01)
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Identification & Personal Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <span>1. Identification &amp; Demographics</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Staff Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={staffNumber}
                  onChange={(e) => setStaffNumber(e.target.value)}
                  placeholder="e.g. HOSP/DOC/084"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Fatima"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Surname <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Abdullahi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Other Names
                </label>
                <input
                  type="text"
                  value={otherNames}
                  onChange={(e) => setOtherNames(e.target.value)}
                  placeholder="Middle name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08031234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hospital.gov.ng"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Section 2: Department & Employment Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Departmental Allocation &amp; Cadre</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Cadre Classification
                </label>
                <select
                  value={cadre}
                  onChange={(e) => setCadre(e.target.value as StaffCadre)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MEDICAL">Medical (Doctors / Specialists)</option>
                  <option value="NURSING">Nursing Services</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="LABORATORY">Medical Laboratory</option>
                  <option value="ADMINISTRATIVE">Administrative &amp; Finance</option>
                  <option value="ALLIED_HEALTH">Allied Health Sciences</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Designation / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Chief Consultant Obstetrician"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Employment Terms
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="FULL_TIME">Permanent &amp; Pensionable (Full Time)</option>
                  <option value="CONTRACT">Contract Staff</option>
                  <option value="LOCUM">Locum Practitioner</option>
                  <option value="INTERN">Intern / House Officer</option>
                  <option value="PART_TIME">Part Time</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Date of Employment
                </label>
                <input
                  type="date"
                  value={dateJoined}
                  onChange={(e) => setDateJoined(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Professional Regulatory Credentials */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Statutory Regulatory Licensing</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Licensing Council
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MDCN">MDCN (Medical &amp; Dental Council)</option>
                  <option value="NMCN">NMCN (Nursing &amp; Midwifery)</option>
                  <option value="PCN">PCN (Pharmacy Council)</option>
                  <option value="MLSCN">MLSCN (Medical Lab Science)</option>
                  <option value="RRBN">RRBN (Radiographers Board)</option>
                  <option value="NOT_APPLICABLE">Not Applicable (Non-clinical)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Registration / Folio Number
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. MDCN-48192"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase focus:ring-1 focus:ring-blue-500"
                  disabled={licenseType === 'NOT_APPLICABLE'}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={licenseExpiryDate}
                  onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  disabled={licenseType === 'NOT_APPLICABLE'}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payroll & Bank Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <span>4. Bank Disbursal Account</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Zenith Bank">Zenith Bank Plc</option>
                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                  <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                  <option value="Access Bank">Access Bank Plc</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                  <option value="Stanbic IBTC">Stanbic IBTC Bank</option>
                  <option value="Fidelity Bank">Fidelity Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="10-digit NUBAN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
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
                <>Saving Staff...</>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Staff Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
