import React, { useState } from 'react';
import { X, ClipboardList, ShieldAlert, Pill, Syringe, Ambulance, CheckCircle2 } from 'lucide-react';
import { EmergencyPatient, StabilizationNote, PrimarySurvey, CrashMedicationEntry, DispositionType } from '../types';

interface StabilizationNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: EmergencyPatient;
  onSubmit: (note: Omit<StabilizationNote, 'id' | 'recordedAt'>) => Promise<void>;
  onAddCrashMed: (patientId: string, med: Omit<CrashMedicationEntry, 'id'>) => Promise<void>;
}

export const StabilizationNotesModal: React.FC<StabilizationNotesModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSubmit,
  onAddCrashMed
}) => {
  const [clinicianName, setClinicianName] = useState('Dr. K. Bello');
  const [clinicianRole, setClinicianRole] = useState('Emergency Medicine Consultant');

  // ABCDE Primary Survey
  const [airway, setAirway] = useState<PrimarySurvey['airway']>(patient.primarySurvey?.airway || 'PATENT');
  const [airwayIntervention, setAirwayIntervention] = useState(patient.primarySurvey?.airwayIntervention || '');
  const [cSpinePrecautions, setCSpinePrecautions] = useState(patient.primarySurvey?.cSpinePrecautions ?? true);
  const [breathing, setBreathing] = useState<PrimarySurvey['breathing']>(patient.primarySurvey?.breathing || 'NORMAL');
  const [oxygenDelivery, setOxygenDelivery] = useState(patient.primarySurvey?.oxygenDelivery || '15L Non-Rebreather Face Mask');
  const [circulation, setCirculation] = useState<PrimarySurvey['circulation']>(patient.primarySurvey?.circulation || 'STRONG_RADIAL');
  const [capillaryRefillSeconds, setCapillaryRefillSeconds] = useState(patient.primarySurvey?.capillaryRefillSeconds || 2);
  const [ivAccessSites, setIvAccessSites] = useState(patient.primarySurvey?.ivAccessSites?.join(', ') || '16G Left Antecubital, 18G Right Forearm');
  const [disabilityPupils, setDisabilityPupils] = useState<PrimarySurvey['disabilityPupils']>(patient.primarySurvey?.disabilityPupils || 'EQUAL_REACTIVE');
  const [disabilityMotorResponse, setDisabilityMotorResponse] = useState(patient.primarySurvey?.disabilityMotorResponse || 'Normal symmetrical withdrawal');
  const [exposureFindings, setExposureFindings] = useState(patient.primarySurvey?.exposureFindings || 'No further trauma noted; warm blankets provided');
  const [activeHemorrhageControlled, setActiveHemorrhageControlled] = useState(patient.primarySurvey?.activeHemorrhageControlled ?? true);

  // Intervention & Clinical Handover
  const [interventionSummary, setInterventionSummary] = useState(
    'Rapid primary survey performed. Large bore IV access established and crystalloid fluid challenge initiated. Monitored vitals continuous.'
  );

  // Quick Crash Med input
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState<CrashMedicationEntry['route']>('IV_PUSH');
  const [newMedIndication, setNewMedIndication] = useState('');
  const [addingMed, setAddingMed] = useState(false);

  // Disposition
  const [disposition, setDisposition] = useState<DispositionType>('EMERGENCY_OR');
  const [dispositionDestination, setDispositionDestination] = useState('Main Operating Theatre 1 (Emergency Laparotomy)');
  const [clinicalHandoverSummary, setClinicalHandoverSummary] = useState(
    'Patient stabilized following acute trauma protocol. Surgical team notified and ready for transfer.'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedDose) return;
    setAddingMed(true);
    try {
      await onAddCrashMed(patient.id, {
        drugName: newMedName.trim(),
        dose: newMedDose.trim(),
        route: newMedRoute,
        administeredAt: new Date().toISOString(),
        administeredBy: clinicianName,
        indication: newMedIndication.trim() || 'Emergency Resuscitation'
      });
      setNewMedName('');
      setNewMedDose('');
      setNewMedIndication('');
    } finally {
      setAddingMed(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const primarySurveyObj: PrimarySurvey = {
        airway,
        airwayIntervention: airwayIntervention.trim() || undefined,
        cSpinePrecautions,
        breathing,
        oxygenDelivery: oxygenDelivery.trim() || undefined,
        circulation,
        capillaryRefillSeconds,
        ivAccessSites: ivAccessSites.split(',').map(s => s.trim()).filter(Boolean),
        disabilityPupils,
        disabilityMotorResponse,
        exposureFindings,
        activeHemorrhageControlled
      };

      await onSubmit({
        emergencyPatientId: patient.id,
        patientName: patient.patientName,
        hospitalNumber: patient.hospitalNumber,
        clinicianName,
        clinicianRole,
        primarySurvey: primarySurveyObj,
        interventionSummary: interventionSummary.trim(),
        crashMeds: patient.medicationsAdministered,
        disposition,
        dispositionDestination: dispositionDestination.trim(),
        clinicalHandoverSummary: clinicalHandoverSummary.trim()
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
        <div className="bg-gradient-to-r from-red-700 via-slate-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-xl">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Emergency Stabilization & ABCDE Survey</h2>
              <p className="text-xs text-slate-300">
                FR-AE-03 • Patient: <span className="font-semibold text-white">{patient.patientName}</span> ({patient.hospitalNumber}) • Bay: {patient.assignedBedNumber || 'Unassigned'}
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

        <form onSubmit={handleSaveNote} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Clinician Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Attending Clinician *</label>
              <input
                type="text"
                required
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role / Speciality *</label>
              <input
                type="text"
                required
                value={clinicianRole}
                onChange={(e) => setClinicianRole(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ABCDE Primary Survey Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Primary Survey (ABCDE Trauma & Resuscitation Protocol)
            </h3>

            {/* Airway & C-Spine */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">A</span>
                  Airway & Cervical Spine
                </span>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={cSpinePrecautions}
                    onChange={(e) => setCSpinePrecautions(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  C-Spine Immobilization Active
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Airway Status</label>
                  <select
                    value={airway}
                    onChange={(e) => setAirway(e.target.value as PrimarySurvey['airway'])}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="PATENT">Patent & Clear</option>
                    <option value="AT_RISK">At Risk (Secretions / Depressed Sensorium)</option>
                    <option value="OBSTRUCTED">Obstructed (Requires immediate intervention)</option>
                    <option value="INTUBATED">Definitively Intubated (ETT / Tracheostomy)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Airway Intervention Details</label>
                  <input
                    type="text"
                    value={airwayIntervention}
                    onChange={(e) => setAirwayIntervention(e.target.value)}
                    placeholder="e.g. Suctioning, Guedel airway, RSI with 7.5mm ETT at 22cm"
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Breathing & Ventilation */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">B</span>
                Breathing & Oxygenation
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Breathing Pattern / Sounds</label>
                  <select
                    value={breathing}
                    onChange={(e) => setBreathing(e.target.value as PrimarySurvey['breathing'])}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="NORMAL">Bilateral Equal & Clear</option>
                    <option value="TACHYPNEIC">Tachypneic / Shallow</option>
                    <option value="WHEEZING">Expiratory Wheeze (Bronchospasm)</option>
                    <option value="STRIDOR">Inspiratory Stridor</option>
                    <option value="ABSENT_UNILATERAL">Absent Breath Sounds Unilateral (Pneumothorax)</option>
                    <option value="MECHANICAL_VENTILATION">Mechanical Ventilator Driven</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Oxygen Therapy Modality</label>
                  <input
                    type="text"
                    value={oxygenDelivery}
                    onChange={(e) => setOxygenDelivery(e.target.value)}
                    placeholder="e.g. 15L Non-Rebreather Mask, High Flow Nasal Cannula"
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Circulation & Hemorrhage Control */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">C</span>
                  Circulation & Hemorrhage Control
                </span>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={activeHemorrhageControlled}
                    onChange={(e) => setActiveHemorrhageControlled(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  External Hemorrhage Controlled
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Peripheral Pulse Quality</label>
                  <select
                    value={circulation}
                    onChange={(e) => setCirculation(e.target.value as PrimarySurvey['circulation'])}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="STRONG_RADIAL">Strong & Bounding Radial</option>
                    <option value="WEAK_THREADY">Weak / Thready</option>
                    <option value="CENTRAL_ONLY">Central Pulses Only (Femoral/Carotid)</option>
                    <option value="ABSENT">Absent Pulses (Cardiac Arrest Protocol)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Capillary Refill (sec)</label>
                  <input
                    type="number"
                    value={capillaryRefillSeconds}
                    onChange={(e) => setCapillaryRefillSeconds(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Vascular Access Sites</label>
                  <input
                    type="text"
                    value={ivAccessSites}
                    onChange={(e) => setIvAccessSites(e.target.value)}
                    placeholder="e.g. 16G Left Antecubital, 18G Forearm"
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Disability & Exposure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">D</span>
                  Disability (Neurological)
                </span>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pupillary Light Reflex</label>
                  <select
                    value={disabilityPupils}
                    onChange={(e) => setDisabilityPupils(e.target.value as PrimarySurvey['disabilityPupils'])}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="EQUAL_REACTIVE">PERRLA (Equal & Reactive)</option>
                    <option value="SLUGGISH">Sluggish</option>
                    <option value="FIXED_DILATED">Unilateral/Bilateral Fixed & Dilated</option>
                    <option value="PINPOINT">Pinpoint (Opioid Toxidrome)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Motor Assessment</label>
                  <input
                    type="text"
                    value={disabilityMotorResponse}
                    onChange={(e) => setDisabilityMotorResponse(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">E</span>
                  Exposure & Environmental Control
                </span>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Trauma Findings & Thermal Status</label>
                  <textarea
                    rows={3}
                    value={exposureFindings}
                    onChange={(e) => setExposureFindings(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Crash Cart Medications Administered */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-amber-600" />
                Resuscitation & Crash Cart Medications Log
              </h3>
            </div>

            {/* Existing Meds */}
            {patient.medicationsAdministered.length > 0 ? (
              <div className="space-y-2">
                {patient.medicationsAdministered.map((med) => (
                  <div key={med.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{med.drugName}</span>
                      <span className="text-slate-500 ml-2">({med.dose} via {med.route})</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Indication: {med.indication} • Given by: {med.administeredBy}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(med.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No emergency medications administered yet.</p>
            )}

            {/* Quick Add Crash Med Sub-form */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Syringe className="w-3.5 h-3.5" /> Quick Push Crash Medication
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Drug Name (e.g. Adrenaline, TXA)"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                />
                <input
                  type="text"
                  placeholder="Dose (e.g. 1mg, 1g in 100mL)"
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                />
                <select
                  value={newMedRoute}
                  onChange={(e) => setNewMedRoute(e.target.value as CrashMedicationEntry['route'])}
                  className="text-xs rounded-lg border border-slate-300 px-2 py-1.5 bg-white"
                >
                  <option value="IV_PUSH">IV Push</option>
                  <option value="IV_INFUSION">IV Infusion</option>
                  <option value="IM">IM</option>
                  <option value="NEBULIZED">Nebulized</option>
                  <option value="IO">Intraosseous (IO)</option>
                  <option value="ET_TUBE">ET Tube</option>
                </select>
                <button
                  type="button"
                  disabled={addingMed || !newMedName || !newMedDose}
                  onClick={handleAddMedication}
                  className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {addingMed ? 'Logging...' : '+ Record Med'}
                </button>
              </div>
            </div>
          </div>

          {/* Intervention Summary */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Emergency Resuscitation & Intervention Summary *
            </label>
            <textarea
              required
              rows={2}
              value={interventionSummary}
              onChange={(e) => setInterventionSummary(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Disposition Decision & Routing */}
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Ambulance className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Emergency Disposition & Patient Transfer Routing</h4>
                <p className="text-xs text-slate-600">Determine immediate clinical disposition following stabilization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Disposition Decision *</label>
                <select
                  value={disposition}
                  onChange={(e) => {
                    const disp = e.target.value as DispositionType;
                    setDisposition(disp);
                    if (disp === 'EMERGENCY_OR') {
                      setDispositionDestination('Main Operating Theatre 1 (Emergency Surgery)');
                    } else if (disp === 'ICU_ADMISSION') {
                      setDispositionDestination('Intensive Care Unit (Bed 2)');
                    } else if (disp === 'WARD_ADMISSION') {
                      setDispositionDestination('Male Surgical Ward (Bed 12)');
                    } else if (disp === 'DISCHARGE_HOME') {
                      setDispositionDestination('Outpatient Discharge with 48h Review');
                    } else if (disp === 'MORTUARY_TRANSFER') {
                      setDispositionDestination('Hospital Mortuary Cold Room');
                    }
                  }}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="EMERGENCY_OR">🚨 Emergency OR (Direct Surgical Transfer)</option>
                  <option value="ICU_ADMISSION">🏥 ICU Admission (Critical Care)</option>
                  <option value="WARD_ADMISSION">🛏️ Inpatient Ward Admission</option>
                  <option value="DISCHARGE_HOME">🏠 Discharged Home (Stabilized)</option>
                  <option value="MORTUARY_TRANSFER">✝️ Certified Deceased (Transfer to Mortuary)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Specific Unit / Destination *</label>
                <input
                  type="text"
                  required
                  value={dispositionDestination}
                  onChange={(e) => setDispositionDestination(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clinical Handover & Transfer Notes *</label>
              <textarea
                required
                rows={2}
                value={clinicalHandoverSummary}
                onChange={(e) => setClinicalHandoverSummary(e.target.value)}
                placeholder="Include receiving team notification details, pending bloods, fluids infusing, escort personnel..."
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
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
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Executing Transfer...' : 'Finalize Stabilization & Execute Disposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
