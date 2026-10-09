import { DEMO_MODE } from "../../../lib/demo";
import React, { useState } from 'react';
import { X, ShieldAlert, UserPlus, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { DeceasedRecord, DeceasedOrigin, ColdStorageUnit } from '../types';

interface DeceasedIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: ColdStorageUnit[];
  onSubmit: (record: Omit<DeceasedRecord, 'id' | 'deceasedTagNumber' | 'daysInStorage' | 'totalAccruedStorageFee' | 'financialClearancePaid' | 'status' | 'updatedAt'>) => Promise<void>;
}

export const DeceasedIntakeModal: React.FC<DeceasedIntakeModalProps> = ({
  isOpen,
  onClose,
  units,
  onSubmit
}) => {
  const [isUnidentified, setIsUnidentified] = useState(false);
  const [fullName, setFullName] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [age, setAge] = useState<number>(60);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [originDepartment, setOriginDepartment] = useState<DeceasedOrigin>('INPATIENT_WARD');
  const [dateOfDeath, setDateOfDeath] = useState(new Date().toISOString().slice(0, 16));
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [certifyingDoctor, setCertifyingDoctor] = useState(DEMO_MODE ? 'Dr. A. Danbaba' : '');
  const [certifyingDoctorLicense, setCertifyingDoctorLicense] = useState(DEMO_MODE ? 'MDCN/64821' : '');

  // Coroner & Police tracking
  const [isCoronerCase, setIsCoronerCase] = useState(false);
  const [policeRefNumber, setPoliceRefNumber] = useState('');

  // Next of Kin
  const [nokName, setNokName] = useState('');
  const [nokPhone, setNokPhone] = useState('+234 ');
  const [nokRelationship, setNokRelationship] = useState('Next of Kin / Family');
  const [nokAddress, setNokAddress] = useState('');
  const [nokNIN, setNokNIN] = useState('');

  // Belongings & Chamber
  const [belongingsInput, setBelongingsInput] = useState('Clothing, Personal belongings');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [selectedChamberNumber, setSelectedChamberNumber] = useState<string>('');
  const [storageFeeDaily, setStorageFeeDaily] = useState<number>(DEMO_MODE ? 5000 : 0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentUnit = units.find(u => u.id === selectedUnitId);
  const availableChambers = currentUnit ? currentUnit.chambers.filter(c => c.status === 'AVAILABLE') : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalName = isUnidentified
        ? (fullName.trim() || `Unidentified Deceased (${gender === 'MALE' ? 'John' : 'Jane'} Doe #${Math.floor(10 + Math.random() * 90)})`)
        : fullName.trim();

      const finalHospitalNo = !DEMO_MODE ? hospitalNumber.trim() : isUnidentified
        ? `HIMS-MOR-UNKNOWN-${Math.floor(100 + Math.random() * 900)}`
        : (hospitalNumber.trim() || `HIMS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);

      const belongings = belongingsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await onSubmit({
        fullName: finalName,
        isUnidentified,
        hospitalNumber: finalHospitalNo,
        age,
        gender,
        dateOfAdmission: new Date().toISOString(),
        originDepartment,
        dateOfDeath: new Date(dateOfDeath).toISOString(),
        causeOfDeath: causeOfDeath.trim(),
        certifyingDoctor: certifyingDoctor.trim(),
        certifyingDoctorLicense: certifyingDoctorLicense.trim(),
        isCoronerCase,
        policeRefNumber: isCoronerCase ? policeRefNumber.trim() : undefined,
        nextOfKin: {
          name: nokName.trim() || (isCoronerCase ? 'Police Investigating Officer' : 'Family Representative'),
          phone: nokPhone.trim(),
          relationship: nokRelationship.trim(),
          address: nokAddress.trim(),
          nationalIdNumber: nokNIN.trim()
        },
        assignedChamberId: DEMO_MODE ? selectedUnitId : undefined,
        assignedChamberUnit: DEMO_MODE ? selectedChamberNumber || (availableChambers[0]?.chamberNumber ?? undefined) : undefined,
        belongingsDeposited: belongings,
        storageFeeDaily
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
              <UserPlus className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Deceased Body Intake &amp; Registration</h2>
              <p className="text-xs text-slate-400">FR-MOR-01 • Clinical death verification, coroner tagging &amp; storage assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Identity & Origin */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-slate-500" /> Deceased Identification
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsUnidentified(!isUnidentified);
                  if (!isUnidentified) {
                    setFullName('Unidentified Deceased (Doe)');
                    setHospitalNumber('HIMS-MOR-UNKNOWN');
                    setIsCoronerCase(true);
                  } else {
                    setFullName('');
                    setHospitalNumber('');
                    setIsCoronerCase(false);
                  }
                }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                  isUnidentified
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {isUnidentified ? '✓ Unidentified / Coroner Doe Mode' : 'Mark as Unidentified / Coroner Doe'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name {isUnidentified && <span className="text-amber-600 font-bold">(Unknown Alias)</span>} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alhaji Haruna Yakubu"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hospital Number (MRN)</label>
                <input
                  type="text"
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  placeholder="e.g. HIMS-2026-00192"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Age / Gender *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-16 text-xs rounded-lg border border-slate-300 bg-white px-2 py-2 text-center"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    className="flex-1 text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Origin Department *</label>
                <select
                  value={originDepartment}
                  onChange={(e) => setOriginDepartment(e.target.value as DeceasedOrigin)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                >
                  <option value="INPATIENT_WARD">Inpatient Ward (Medical/Surgical)</option>
                  <option value="ACCIDENT_EMERGENCY">Accident &amp; Emergency (A&amp;E)</option>
                  <option value="OPERATING_THEATRE">Operating Theatre (Intra/Post-Op Death)</option>
                  <option value="BROUGHT_IN_DEAD_BID">Brought-in-Dead (BID) Ambulance</option>
                  <option value="POLICE_CASE">Police Handoff / External Homicide Scene</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date &amp; Time of Certified Death *</label>
                <input
                  type="datetime-local"
                  required
                  value={dateOfDeath}
                  onChange={(e) => setDateOfDeath(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Clinical Death Certification & Coroner Status */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Clinical Death Certification
            </span>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Certified Cause of Death *</label>
              <textarea
                required
                rows={2}
                value={causeOfDeath}
                onChange={(e) => setCauseOfDeath(e.target.value)}
                placeholder="e.g. Septic shock secondary to perforated diverticulitis with multi-organ failure..."
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Certifying Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={certifyingDoctor}
                  onChange={(e) => setCertifyingDoctor(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Doctor MDCN License Number *</label>
                <input
                  type="text"
                  required
                  value={certifyingDoctorLicense}
                  onChange={(e) => setCertifyingDoctorLicense(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>

            {/* Coroner / Police case toggle */}
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCoronerCase}
                  onChange={(e) => setIsCoronerCase(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                Coroner / Medico-Legal Police Case (Requires mandatory autopsy and coroner permit before body release)
              </label>

              {isCoronerCase && (
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Police FIR / Crime Diary Ref Number *</label>
                  <input
                    type="text"
                    required={isCoronerCase}
                    value={policeRefNumber}
                    onChange={(e) => setPoliceRefNumber(e.target.value)}
                    placeholder="e.g. NPF/CR/DIV-B/2026/894"
                    className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Next of Kin & Belongings */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-purple-600" /> Next of Kin &amp; Property Deposit
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Next of Kin Full Name</label>
                <input
                  type="text"
                  value={nokName}
                  onChange={(e) => setNokName(e.target.value)}
                  placeholder="e.g. Bashir Haruna"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={nokPhone}
                  onChange={(e) => setNokPhone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Relationship to Deceased</label>
                <input
                  type="text"
                  value={nokRelationship}
                  onChange={(e) => setNokRelationship(e.target.value)}
                  placeholder="e.g. Son, Daughter, Spouse"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={nokAddress}
                  onChange={(e) => setNokAddress(e.target.value)}
                  placeholder="e.g. 14 Crescent Way, GRA"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">National ID (NIN) Number</label>
                <input
                  type="text"
                  value={nokNIN}
                  onChange={(e) => setNokNIN(e.target.value)}
                  placeholder="e.g. NIN-99238471928"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">Belongings / Personal Property Deposited</label>
              <input
                type="text"
                value={belongingsInput}
                onChange={(e) => setBelongingsInput(e.target.value)}
                placeholder="Comma-separated: e.g. Gold wrist watch, Leather wallet, Clothing bundle"
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>
          </div>

          {/* Chamber Vault Allocation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Cold Storage Chamber Allocation (FR-MOR-02)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Chamber Block Unit</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => {
                    setSelectedUnitId(e.target.value);
                    const u = units.find(unit => unit.id === e.target.value);
                    const avail = u ? u.chambers.find(c => c.status === 'AVAILABLE') : undefined;
                    setSelectedChamberNumber(avail?.chamberNumber || '');
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.unitName} ({u.currentTemperatureCelsius}°C)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Available Chamber Vault</label>
                <select
                  value={selectedChamberNumber}
                  onChange={(e) => setSelectedChamberNumber(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
                >
                  {availableChambers.length > 0 ? (
                    availableChambers.map(c => (
                      <option key={c.chamberId} value={c.chamberNumber}>
                        {c.chamberNumber} ({c.tier})
                      </option>
                    ))
                  ) : (
                    <option value="">No free vaults in this block</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Daily Storage Tariff (₦)</label>
                <input
                  type="number"
                  value={storageFeeDaily}
                  onChange={(e) => setStorageFeeDaily(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2 text-right"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {submitting ? 'Admitting...' : 'Register Deceased Intake & Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
