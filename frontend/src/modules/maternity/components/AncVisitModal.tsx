import React, { useState } from 'react';
import { X, Calendar, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AncProfile, AncVisit, FetalPresentation } from '../types';

interface AncVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AncProfile;
  onSubmit: (ancProfileId: string, visit: Omit<AncVisit, 'id' | 'visitDate'>) => Promise<void>;
}

export const AncVisitModal: React.FC<AncVisitModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSubmit
}) => {
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState<number>(profile.currentGestationalAgeWeeks || 30);
  const [fundalHeightCm, setFundalHeightCm] = useState<number>(profile.currentGestationalAgeWeeks || 30);
  const [fetalHeartRateBpm, setFetalHeartRateBpm] = useState<number>(140);
  const [fetalPresentation, setFetalPresentation] = useState<FetalPresentation>('CEPHALIC');
  const [maternalBloodPressure, setMaternalBloodPressure] = useState('118/76');
  const [maternalWeightKg, setMaternalWeightKg] = useState<number>(68.0);
  const [urineProtein, setUrineProtein] = useState<AncVisit['urineProtein']>('NIL');
  const [urineGlucose, setUrineGlucose] = useState<AncVisit['urineGlucose']>('NIL');
  const [hemoglobinGdl, setHemoglobinGdl] = useState<number>(11.5);
  const [complaintsAndNotes, setComplaintsAndNotes] = useState('Routine ANC checkup. Fetal movements active. Advised on danger signs.');
  const [clinicianName, setClinicianName] = useState('Midwife H. Danjuma (RM)');
  const [nextAppointmentDate, setNextAppointmentDate] = useState('2026-11-01');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Pre-eclampsia alert: BP >= 140/90 and Proteinuria >= 1+
  const bpParts = maternalBloodPressure.split('/');
  const systolic = parseInt(bpParts[0] || '0', 10);
  const diastolic = parseInt(bpParts[1] || '0', 10);
  const isPreEclampsiaWarning = (systolic >= 140 || diastolic >= 90) && ['1+', '2+', '3+'].includes(urineProtein);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(profile.id, {
        gestationalAgeWeeks,
        fundalHeightCm,
        fetalHeartRateBpm,
        fetalPresentation,
        maternalBloodPressure: maternalBloodPressure.trim(),
        maternalWeightKg,
        urineProtein,
        urineGlucose,
        hemoglobinGdl,
        complaintsAndNotes: complaintsAndNotes.trim(),
        clinicianName: clinicianName.trim(),
        nextAppointmentDate
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-700 via-rose-700 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Record Antenatal Care (ANC) Visit</h2>
              <p className="text-xs text-rose-100">
                Patient: <span className="font-semibold text-white">{profile.patientName}</span> ({profile.hospitalNumber}) • Gravida {profile.gravida} Para {profile.para}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPreEclampsiaWarning && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 text-xs text-red-900 font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Pre-Eclampsia Risk Alert:</strong> Maternal BP is ≥140/90 mmHg accompanied by positive proteinuria ({urineProtein}). Urgent obstetric consultation required.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Obstetric & Fetal Parameters */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-pink-600" /> Fetal & Obstetric Examination
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gestational Age</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={4}
                    max={44}
                    value={gestationalAgeWeeks}
                    onChange={(e) => setGestationalAgeWeeks(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                  />
                  <span className="text-[11px] text-slate-500">wks</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fundal Height</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={10}
                    max={50}
                    value={fundalHeightCm}
                    onChange={(e) => setFundalHeightCm(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                  />
                  <span className="text-[11px] text-slate-500">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fetal Heart Rate</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={fetalHeartRateBpm}
                    onChange={(e) => setFetalHeartRateBpm(Number(e.target.value))}
                    className={`w-full text-xs font-bold rounded-lg border bg-white px-2 py-2 ${
                      fetalHeartRateBpm < 110 || fetalHeartRateBpm > 160 ? 'border-red-400 text-red-700' : 'border-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-500">bpm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fetal Lie / Presentation</label>
                <select
                  value={fetalPresentation}
                  onChange={(e) => setFetalPresentation(e.target.value as FetalPresentation)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="CEPHALIC">Cephalic (Vertex)</option>
                  <option value="BREECH">Breech</option>
                  <option value="TRANSVERSE">Transverse Lie</option>
                  <option value="UNSTABLE">Unstable / Variable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Maternal Vitals & Lab Dipsticks */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Maternal Vitals & Urinalysis Dipstick
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Blood Pressure *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 120/80"
                  value={maternalBloodPressure}
                  onChange={(e) => setMaternalBloodPressure(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={maternalWeightKg}
                  onChange={(e) => setMaternalWeightKg(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Urine Protein</label>
                <select
                  value={urineProtein}
                  onChange={(e) => setUrineProtein(e.target.value as AncVisit['urineProtein'])}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="NIL">Nil (Normal)</option>
                  <option value="TRACE">Trace</option>
                  <option value="1+">1+ (30 mg/dL)</option>
                  <option value="2+">2+ (100 mg/dL)</option>
                  <option value="3+">3+ (300 mg/dL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Urine Glucose</label>
                <select
                  value={urineGlucose}
                  onChange={(e) => setUrineGlucose(e.target.value as AncVisit['urineGlucose'])}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="NIL">Nil</option>
                  <option value="TRACE">Trace</option>
                  <option value="1+">1+</option>
                  <option value="2+">2+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hemoglobin (Hb g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={hemoglobinGdl}
                  onChange={(e) => setHemoglobinGdl(Number(e.target.value))}
                  className={`w-full text-xs font-bold rounded-lg border bg-white px-3 py-2 ${
                    hemoglobinGdl < 11.0 ? 'border-amber-400 text-amber-700' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Next Follow-up Appointment *</label>
                <input
                  type="date"
                  required
                  value={nextAppointmentDate}
                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes & Examiner */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clinical Assessment & Prescription Notes *</label>
              <textarea
                required
                rows={3}
                value={complaintsAndNotes}
                onChange={(e) => setComplaintsAndNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Examining Clinician / Midwife *</label>
              <input
                type="text"
                required
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Recording...' : 'Save ANC Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
