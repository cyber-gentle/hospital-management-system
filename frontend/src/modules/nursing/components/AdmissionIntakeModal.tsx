import React, { useState } from 'react';
import { InpatientAdmission, Ward, TriageAcuity, DepositStatus } from '../types';

interface AdmissionIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wards: Ward[];
  onAdmitPatient: (admission: Omit<InpatientAdmission, 'id' | 'admissionDate' | 'status'>) => Promise<void>;
}

export const AdmissionIntakeModal: React.FC<AdmissionIntakeModalProps> = ({
  isOpen,
  onClose,
  wards,
  onAdmitPatient
}) => {
  const [patientName, setPatientName] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [selectedWardId, setSelectedWardId] = useState(wards[0]?.id || '');
  const [selectedBedNumber, setSelectedBedNumber] = useState('');
  const [admittingDoctor, setAdmittingDoctor] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [triageAcuity, setTriageAcuity] = useState<TriageAcuity>('stable');
  const [tariffType, setTariffType] = useState<'Cash' | 'NHIA' | 'Retainership'>('Cash');
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('pending');
  const [allergiesText, setAllergiesText] = useState('None Reported');
  const [resuscitationStatus, setResuscitationStatus] = useState<'Full Code' | 'DNR' | 'Modified'>('Full Code');

  // 7-Point Admission Checklist (FR-NS-01)
  const [checklist, setChecklist] = useState({
    consentSigned: true,
    idWristbandApplied: true,
    allergyBandApplied: false,
    orientationCompleted: true,
    belongingsDocumented: true,
    initialVitalsDone: false,
    valuablesStorageSigned: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentWard = wards.find(w => w.id === selectedWardId) || wards[0];
  const availableBeds = currentWard ? currentWard.beds.filter(b => b.status === 'available') : [];

  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    const ward = wards.find(w => w.id === wardId);
    if (ward) {
      const firstAvail = ward.beds.find(b => b.status === 'available');
      setSelectedBedNumber(firstAvail ? firstAvail.bedNumber : '');
      // If A&E, deposit is always exempt per PRD
      if (wardId.includes('ae')) {
        setDepositStatus('exempt_ae');
      } else if (depositStatus === 'exempt_ae') {
        setDepositStatus('pending');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !hospitalNumber.trim() || !selectedBedNumber) {
      alert('Please fill out patient details, hospital number, and select an available bed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdmitPatient({
        patientId: `p-${Date.now().toString().slice(-4)}`,
        patientName,
        hospitalNumber,
        age,
        gender,
        wardId: selectedWardId,
        wardName: currentWard?.name || 'Inpatient Ward',
        bedNumber: selectedBedNumber,
        admittingDoctor: admittingDoctor || 'Dr. Consultant On-Call',
        primaryDiagnosis,
        triageAcuity,
        depositStatus,
        allergies: allergiesText.split(',').map(s => s.trim()).filter(Boolean),
        resuscitationStatus,
        bloodGroup,
        tariffType,
        admissionChecklist: checklist
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to complete admission intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              🛏️
            </div>
            <div>
              <h2 className="text-lg font-bold">Inpatient Admission Intake (FR-NS-01)</h2>
              <p className="text-xs text-blue-100">Ward & Bed Allocation, Triage Acuity & Admission Checklist</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Patient Demographics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
              Patient Demographics & Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Babatunde Fashola"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HIMS/2026/000115"
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="125"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Triage & Deposit Status */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</span>
              Clinical Triage & Admission Deposit Gate
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Acuity Level *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTriageAcuity('critical')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all ${
                      triageAcuity === 'critical'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🔴 Critical
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageAcuity('high_risk')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all ${
                      triageAcuity === 'high_risk'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🟡 High Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageAcuity('stable')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all ${
                      triageAcuity === 'stable'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🟢 Stable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission Deposit Status (Non-blocking Gate)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={depositStatus}
                    onChange={(e) => setDepositStatus(e.target.value as DepositStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  >
                    <option value="paid">Deposit Paid (₦50,000 Verified)</option>
                    <option value="pending">Deposit Pending (Soft Warning Flag)</option>
                    <option value="exempt_ae">A&E Emergency Exempt (PRD Rule)</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {depositStatus === 'exempt_ae' ? 'Emergency admissions bypass deposit check.' : 'Unpaid deposits display warning flag without delaying clinical care.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Admission Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Severe Asthma exacerbation"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admitting Physician / Consultant</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Ibrahim (Chief Surgeon)"
                  value={admittingDoctor}
                  onChange={(e) => setAdmittingDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ward & Bed Allocation */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">3</span>
              Ward & Bed Assignment (FR-NS-08)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Inpatient Ward *</label>
                <select
                  value={selectedWardId}
                  onChange={(e) => handleWardChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                >
                  {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name} ({ward.availableBeds} beds available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Bed *</label>
                <select
                  value={selectedBedNumber}
                  onChange={(e) => setSelectedBedNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono font-semibold"
                >
                  <option value="">-- Choose Bed --</option>
                  {availableBeds.map(bed => (
                    <option key={bed.id} value={bed.bedNumber}>
                      Bed {bed.bedNumber} (Clean & Ready)
                    </option>
                  ))}
                </select>
                {availableBeds.length === 0 && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    ⚠️ No available beds in this ward. Select another ward or discharge ready patients.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: 7-Point Admission Intake Checklist */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
              Mandatory Admission Intake Checklist (FR-NS-01)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {[
                { key: 'consentSigned', label: 'Admission & Medical Treatment Consent Signed' },
                { key: 'idWristbandApplied', label: 'Patient Identification Wristband Attached' },
                { key: 'allergyBandApplied', label: 'Red Allergy Alert Wristband Applied' },
                { key: 'orientationCompleted', label: 'Ward & Call Bell Orientation Completed' },
                { key: 'belongingsDocumented', label: 'Patient Belongings & Inventory Documented' },
                { key: 'initialVitalsDone', label: 'Baseline Vitals Recorded & Stored' },
                { key: 'valuablesStorageSigned', label: 'Hospital Safe Valuables Custody Signed' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checklist[item.key as keyof typeof checklist]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: Clinical Notes / Allergies / Blood Group / Tariff */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies (comma-separated)</label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, NSAIDs, Peanuts"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-800"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tariff Scheme</label>
              <select
                value={tariffType}
                onChange={(e) => setTariffType(e.target.value as 'Cash' | 'NHIA' | 'Retainership')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-800"
              >
                <option value="Cash">Cash Paying</option>
                <option value="NHIA">NHIA Enrollee</option>
                <option value="Retainership">Corporate Retainership</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resuscitation Status</label>
              <select
                value={resuscitationStatus}
                onChange={(e) => setResuscitationStatus(e.target.value as 'Full Code' | 'DNR' | 'Modified')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-800"
              >
                <option value="Full Code">Full Code (Resuscitate)</option>
                <option value="DNR">DNR (Do Not Resuscitate)</option>
                <option value="Modified">Modified Code</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedBedNumber}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Admitting Inpatient...' : 'Complete Admission & Assign Bed →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
