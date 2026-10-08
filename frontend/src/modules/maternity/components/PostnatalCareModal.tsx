import React, { useState } from 'react';
import { X, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PncCheckup } from '../types';

interface PostnatalCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (checkup: Omit<PncCheckup, 'id' | 'checkupDate'>) => Promise<void>;
}

export const PostnatalCareModal: React.FC<PostnatalCareModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  // Maternal vitals
  const [bloodPressure, setBloodPressure] = useState('118/76');
  const [pulseRate, setPulseRate] = useState<number>(76);
  const [temperature, setTemperature] = useState<number>(36.6);

  // Maternal Postpartum
  const [uterineInvolution, setUterineInvolution] = useState<PncCheckup['uterineInvolution']>('WELL_CONTRACTED_BELOW_UMBILICUS');
  const [lochiaDescription, setLochiaDescription] = useState<PncCheckup['lochiaDescription']>('RUBRA_NORMAL');
  const [perinealWoundStatus, setPerinealWoundStatus] = useState<PncCheckup['perinealWoundStatus']>('HEALING_CLEAN');
  const [breastfeedingStatus, setBreastfeedingStatus] = useState<PncCheckup['breastfeedingStatus']>('LATCHING_WELL');

  // Neonatal surveillance
  const [babyTemperature, setBabyTemperature] = useState<number>(36.8);
  const [umbilicalCordStatus, setUmbilicalCordStatus] = useState<PncCheckup['neonatalStatus']['umbilicalCordStatus']>('CLEAN_DRY');
  const [neonatalJaundice, setNeonatalJaundice] = useState(false);

  // Counseling & Discharge
  const [contraceptiveCounselingGiven, setContraceptiveCounselingGiven] = useState(true);
  const [clearanceForDischarge, setClearanceForDischarge] = useState(true);
  const [clinicianName, setClinicianName] = useState('Midwife H. Danjuma (RM)');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        maternalVitals: {
          bloodPressure: bloodPressure.trim(),
          pulseRate,
          temperature
        },
        uterineInvolution,
        lochiaDescription,
        perinealWoundStatus,
        breastfeedingStatus,
        neonatalStatus: {
          temperature: babyTemperature,
          umbilicalCordStatus,
          neonatalJaundice
        },
        contraceptiveCounselingGiven,
        clearanceForDischarge,
        clinicianName: clinicianName.trim()
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
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Postnatal Care (PNC) Checkup</h2>
              <p className="text-xs text-teal-100">FR-MAT-03 • Maternal involution, neonatal check &amp; discharge clearance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Maternal Vitals & Involution */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-600" /> Maternal Postpartum Assessment
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  required
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pulse Rate (bpm)</label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Uterine Involution</label>
                <select
                  value={uterineInvolution}
                  onChange={(e) => setUterineInvolution(e.target.value as PncCheckup['uterineInvolution'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                >
                  <option value="WELL_CONTRACTED_BELOW_UMBILICUS">Well-contracted below umbilicus (Normal)</option>
                  <option value="SUBINVOLUTED_BOGGY">Subinvoluted / Boggy (Risk of secondary PPH)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Lochia Character</label>
                <select
                  value={lochiaDescription}
                  onChange={(e) => setLochiaDescription(e.target.value as PncCheckup['lochiaDescription'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="RUBRA_NORMAL">Lochia Rubra (Normal red, moderate)</option>
                  <option value="SEROSA_NORMAL">Lochia Serosa (Pink/brown)</option>
                  <option value="ALBA_NORMAL">Lochia Alba (Yellowish/white)</option>
                  <option value="OFFENSIVE_EXCESSIVE">Offensive / Foul-smelling / Excessive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Perineum / C-Section Wound</label>
                <select
                  value={perinealWoundStatus}
                  onChange={(e) => setPerinealWoundStatus(e.target.value as PncCheckup['perinealWoundStatus'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="HEALING_CLEAN">Clean &amp; Healing Well</option>
                  <option value="ERYTHEMA_SWELLING">Erythema / Purulent Discharge</option>
                  <option value="NA_INTACT">N/A (Intact Perineum)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Breastfeeding &amp; Lactation</label>
                <select
                  value={breastfeedingStatus}
                  onChange={(e) => setBreastfeedingStatus(e.target.value as PncCheckup['breastfeedingStatus'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="LATCHING_WELL">Latching well &amp; feeding eagerly</option>
                  <option value="ENGORGEMENT_DIFFICULTY">Engorgement / Nipple soreness</option>
                  <option value="FORMULA_FEEDING">Infant formula chosen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Neonatal Health */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Neonatal Daily Surveillance
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Baby Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={babyTemperature}
                  onChange={(e) => setBabyTemperature(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Umbilical Cord Status</label>
                <select
                  value={umbilicalCordStatus}
                  onChange={(e) => setUmbilicalCordStatus(e.target.value as PncCheckup['neonatalStatus']['umbilicalCordStatus'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="CLEAN_DRY">Clean, dry &amp; uninfected</option>
                  <option value="MOIST_DISCHARGE">Moist with discharge (Chlorhexidine care needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Neonatal Jaundice Check</label>
                <select
                  value={neonatalJaundice ? 'YES' : 'NO'}
                  onChange={(e) => setNeonatalJaundice(e.target.value === 'YES')}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="NO">No clinical jaundice</option>
                  <option value="YES">Scleral/cutaneous jaundice present</option>
                </select>
              </div>
            </div>
          </div>

          {/* Counseling & Discharge Sign-off */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Family Planning Counseling &amp; Discharge Clearance
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={contraceptiveCounselingGiven}
                  onChange={(e) => setContraceptiveCounselingGiven(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Postpartum Family Planning &amp; Contraceptive counseling provided
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={clearanceForDischarge}
                  onChange={(e) => setClearanceForDischarge(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                Mother and infant certified clinically stable for discharge home
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Examining Midwife / Obstetrician *</label>
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
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Save PNC Checkup & Clearance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
