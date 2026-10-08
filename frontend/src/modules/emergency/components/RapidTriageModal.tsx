import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Siren, Activity, UserPlus, HeartPulse } from 'lucide-react';
import { EmergencyPatient, TriageCategory, PatientArrivalMode, EmergencyBay } from '../types';

interface RapidTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bays: EmergencyBay[];
  onSubmit: (patient: Omit<EmergencyPatient, 'id' | 'updatedAt' | 'zeroDepositWaived' | 'medicationsAdministered'>) => Promise<void>;
}

export const RapidTriageModal: React.FC<RapidTriageModalProps> = ({
  isOpen,
  onClose,
  bays,
  onSubmit
}) => {
  const [isUnknownDoe, setIsUnknownDoe] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [arrivalMode, setArrivalMode] = useState<PatientArrivalMode>('WALK_IN');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [triageNurse, setTriageNurse] = useState('Staff Nurse On-Duty (RN)');

  // Vitals
  const [heartRate, setHeartRate] = useState<number>(85);
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [spo2, setSpo2] = useState<number>(98);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [gcs, setGcs] = useState<number>(15);
  const [bloodGlucose, setBloodGlucose] = useState<number>(5.5);
  const [painScore, setPainScore] = useState<number>(4);

  // Triage category & Bay
  const [triageCategory, setTriageCategory] = useState<TriageCategory>('YELLOW');
  const [selectedBayId, setSelectedBayId] = useState<string>(bays[0]?.id || '');
  const [selectedBedNumber, setSelectedBedNumber] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-suggest critical Category RED if life-threatening vitals
  const isCriticalVitals = gcs < 9 || systolicBp < 90 || spo2 < 90 || heartRate > 140;

  const handleTriageCategorySelect = (cat: TriageCategory) => {
    setTriageCategory(cat);
    // Suggest bay type based on category
    if (cat === 'RED') {
      const resusBay = bays.find(b => b.bayType === 'RESUSCITATION');
      if (resusBay) {
        setSelectedBayId(resusBay.id);
        const avail = resusBay.beds.find(b => b.status === 'AVAILABLE');
        if (avail) setSelectedBedNumber(avail.bedNumber);
      }
    } else if (cat === 'ORANGE') {
      const traumaBay = bays.find(b => b.bayType === 'TRAUMA');
      if (traumaBay) {
        setSelectedBayId(traumaBay.id);
        const avail = traumaBay.beds.find(b => b.status === 'AVAILABLE');
        if (avail) setSelectedBedNumber(avail.bedNumber);
      }
    } else if (cat === 'YELLOW') {
      const obsBay = bays.find(b => b.bayType === 'ACUTE_OBSERVATION');
      if (obsBay) {
        setSelectedBayId(obsBay.id);
        const avail = obsBay.beds.find(b => b.status === 'AVAILABLE');
        if (avail) setSelectedBedNumber(avail.bedNumber);
      }
    } else if (cat === 'GREEN') {
      const minorsBay = bays.find(b => b.bayType === 'FAST_TRACK_MINORS');
      if (minorsBay) {
        setSelectedBayId(minorsBay.id);
        const avail = minorsBay.beds.find(b => b.status === 'AVAILABLE');
        if (avail) setSelectedBedNumber(avail.bedNumber);
      }
    }
  };

  const currentBay = bays.find(b => b.id === selectedBayId);
  const availableBeds = currentBay ? currentBay.beds.filter(b => b.status === 'AVAILABLE') : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalName = isUnknownDoe
        ? (patientName.trim() || `Unidentified Trauma (${gender === 'MALE' ? 'John' : 'Jane'} Doe #${Math.floor(10 + Math.random() * 90)})`)
        : patientName.trim();

      const finalHospitalNo = isUnknownDoe
        ? `HIMS-EMERG-UNKNOWN-${Math.floor(100 + Math.random() * 900)}`
        : (hospitalNumber.trim() || `HIMS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);

      await onSubmit({
        patientName: finalName,
        hospitalNumber: finalHospitalNo,
        isUnidentifiedJohnDoe: isUnknownDoe,
        age,
        gender,
        arrivalTime: new Date().toISOString(),
        arrivalMode,
        triageCategory,
        triageNurse,
        chiefComplaint: chiefComplaint.trim(),
        vitals: {
          heartRate,
          systolicBp,
          diastolicBp,
          respiratoryRate,
          spo2,
          temperature,
          gcs,
          bloodGlucose,
          painScore
        },
        assignedBayId: selectedBayId,
        assignedBayName: currentBay?.name,
        assignedBedNumber: selectedBedNumber || (availableBeds[0]?.bedNumber ?? undefined),
        status: (currentBay?.bayType === 'RESUSCITATION' ? 'IN_RESUS' : 'OBSERVATION'),
        attendingDoctor: 'ED Consultant on Triage Deck'
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Rapid Emergency Triage Intake</h2>
              <p className="text-xs text-rose-100">FR-AE-01 • Acute clinical scoring & immediate bay placement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Life-Saving Waiver Banner (PRD / AGENTS.md Hard Rule) */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Life-Saving Emergency Policy:</strong> Admission deposit gates are <u>unconditionally waived</u> for all A&E intake. Patient care begins immediately.
            </span>
          </div>
          <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
            Deposit Exempt
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Patient Identification Mode */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-500" /> Patient Demographics
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsUnknownDoe(!isUnknownDoe);
                  if (!isUnknownDoe) {
                    setPatientName('Unidentified Trauma Victim');
                    setHospitalNumber('HIMS-EMERG-UNKNOWN');
                  } else {
                    setPatientName('');
                    setHospitalNumber('');
                  }
                }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                  isUnknownDoe
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {isUnknownDoe ? '✓ Unidentified / John Doe Mode Active' : 'Mark as Unidentified / Trauma Doe'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name {isUnknownDoe && <span className="text-rose-600 font-bold">(Emergency Alias)</span>} *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={isUnknownDoe ? 'e.g. Unidentified Male (Doe #45)' : 'e.g. Amina Mohammed'}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hospital Number (MRN)</label>
                <input
                  type="text"
                  disabled={isUnknownDoe}
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  placeholder={isUnknownDoe ? 'Auto-generated Doe ID' : 'e.g. HIMS-2026-00998'}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100 text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Age / Gender *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-20 text-sm rounded-lg border border-slate-300 px-2 py-2 text-center focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    className="flex-1 text-sm rounded-lg border border-slate-300 px-2 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Arrival Mode *</label>
                <select
                  value={arrivalMode}
                  onChange={(e) => setArrivalMode(e.target.value as PatientArrivalMode)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="WALK_IN">🚶 Walk-in</option>
                  <option value="AMBULANCE">🚑 Ambulance / EMS</option>
                  <option value="TRANSFER_IN">🏥 Transfer from Secondary Clinic</option>
                  <option value="POLICE_BYSTANDER">🚓 Police / Bystander Drop-off</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Triage Nurse On-Duty *</label>
                <input
                  type="text"
                  required
                  value={triageNurse}
                  onChange={(e) => setTriageNurse(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chief Presenting Complaint & Mechanism of Injury *</label>
              <textarea
                required
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Severe blunt abdominal trauma following high-speed motorcycle crash; acute severe respiratory distress; unconsciousness..."
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vitals & Triage Scoring Engine */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-600" /> Rapid Physiological Vitals
              </span>
              {isCriticalVitals && (
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> High-Risk Vitals Alert (Recommend Red Triage)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Pulse (HR)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className={`w-full text-sm font-bold rounded px-2 py-1 border ${heartRate > 120 || heartRate < 50 ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300'}`}
                  />
                  <span className="text-[10px] text-slate-500">bpm</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Blood Pressure</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={(e) => setSystolicBp(Number(e.target.value))}
                    className={`w-14 text-sm font-bold rounded px-1.5 py-1 text-center border ${systolicBp < 90 ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300'}`}
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={(e) => setDiastolicBp(Number(e.target.value))}
                    className="w-14 text-sm font-bold rounded px-1.5 py-1 text-center border border-slate-300"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Resp. Rate (RR)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className={`w-full text-sm font-bold rounded px-2 py-1 border ${respiratoryRate > 30 ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300'}`}
                  />
                  <span className="text-[10px] text-slate-500">cpm</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">SpO2 Oxygen</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className={`w-full text-sm font-bold rounded px-2 py-1 border ${spo2 < 92 ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300'}`}
                  />
                  <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Temp (°C)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full text-sm font-bold rounded px-2 py-1 border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500">°C</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Glasgow Coma (GCS)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={gcs}
                    onChange={(e) => setGcs(Number(e.target.value))}
                    className={`w-full text-sm font-bold rounded px-2 py-1 border ${gcs < 9 ? 'border-red-500 bg-red-50 text-red-800' : 'border-slate-300'}`}
                  />
                  <span className="text-[10px] text-slate-500">/ 15</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Glucose (RBS)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={bloodGlucose}
                    onChange={(e) => setBloodGlucose(Number(e.target.value))}
                    className={`w-full text-sm font-bold rounded px-2 py-1 border ${bloodGlucose < 3.0 ? 'border-red-500 bg-red-50 text-red-800' : 'border-slate-300'}`}
                  />
                  <span className="text-[10px] text-slate-500">mmol/L</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Pain Score (0-10)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={painScore}
                    onChange={(e) => setPainScore(Number(e.target.value))}
                    className="w-full text-sm font-bold rounded px-2 py-1 border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500">/ 10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Triage Acuity Matrix (ESI / Manchester) */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Emergency Triage Acuity Classification *
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleTriageCategorySelect('RED')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  triageCategory === 'RED'
                    ? 'border-red-600 bg-red-50 ring-2 ring-red-500 shadow-sm'
                    : 'border-slate-200 hover:border-red-300 hover:bg-red-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    Category 1: RED
                  </span>
                  <span className="text-[10px] font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded">0 min</span>
                </div>
                <div className="text-xs font-bold text-slate-900">Resuscitation (Immediate)</div>
                <div className="text-[11px] text-slate-500 mt-1">Cardiac arrest, severe shock, GCS &lt; 9, airway obstruction</div>
              </button>

              <button
                type="button"
                onClick={() => handleTriageCategorySelect('ORANGE')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  triageCategory === 'ORANGE'
                    ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500 shadow-sm'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Category 2: ORANGE
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">&lt;15 min</span>
                </div>
                <div className="text-xs font-bold text-slate-900">Very Urgent / Emergent</div>
                <div className="text-[11px] text-slate-500 mt-1">Acute chest pain, severe asthma, altered mental state, severe hemorrhage</div>
              </button>

              <button
                type="button"
                onClick={() => handleTriageCategorySelect('YELLOW')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  triageCategory === 'YELLOW'
                    ? 'border-yellow-600 bg-yellow-50 ring-2 ring-yellow-500 shadow-sm'
                    : 'border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-yellow-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    Category 3: YELLOW
                  </span>
                  <span className="text-[10px] font-bold bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">&lt;60 min</span>
                </div>
                <div className="text-xs font-bold text-slate-900">Urgent</div>
                <div className="text-[11px] text-slate-500 mt-1">Severe abdominal pain, closed fractures, high pyrexia, stable vitals</div>
              </button>

              <button
                type="button"
                onClick={() => handleTriageCategorySelect('GREEN')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  triageCategory === 'GREEN'
                    ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500 shadow-sm'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Category 4: GREEN
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">&lt;120 min</span>
                </div>
                <div className="text-xs font-bold text-slate-900">Standard / Minors</div>
                <div className="text-[11px] text-slate-500 mt-1">Simple lacerations, sprains, minor burns, ambulatory patients</div>
              </button>
            </div>
          </div>

          {/* Initial Bay & Bed Assignment */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" /> Immediate Emergency Bed Allocation (FR-AE-02)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Department Bay</label>
                <select
                  value={selectedBayId}
                  onChange={(e) => {
                    setSelectedBayId(e.target.value);
                    const b = bays.find(bay => bay.id === e.target.value);
                    const avail = b ? b.beds.find(bed => bed.status === 'AVAILABLE') : undefined;
                    setSelectedBedNumber(avail?.bedNumber || '');
                  }}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {bays.map(bay => (
                    <option key={bay.id} value={bay.id}>
                      {bay.name} ({bay.floorZone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Specific Bed / Bay Number</label>
                <select
                  value={selectedBedNumber}
                  onChange={(e) => setSelectedBedNumber(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {availableBeds.length > 0 ? (
                    availableBeds.map(bed => (
                      <option key={bed.bedId} value={bed.bedNumber}>
                        {bed.bedNumber} (Available)
                      </option>
                    ))
                  ) : (
                    <option value="">No beds currently available in this bay</option>
                  )}
                </select>
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
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Siren className="w-4 h-4" />
              {submitting ? 'Admitting to ED...' : 'Confirm Triage & Admit to Bay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
