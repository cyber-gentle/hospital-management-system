import React, { useState } from 'react';
import { X, Baby, Heart, ShieldAlert, Calendar, CheckCircle2 } from 'lucide-react';
import { AncProfile, BloodGroup, Genotype, PregnancyRiskLevel } from '../types';

interface AncBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: Omit<AncProfile, 'id' | 'currentGestationalAgeWeeks' | 'status' | 'visits'>) => Promise<void>;
}

export const AncBookingModal: React.FC<AncBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [patientName, setPatientName] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [age, setAge] = useState<number>(27);
  const [phone, setPhone] = useState('+234 ');

  // Obstetric history (GPLA)
  const [gravida, setGravida] = useState<number>(1);
  const [para, setPara] = useState<number>(0);
  const [living, setLiving] = useState<number>(0);
  const [abortions, setAbortions] = useState<number>(0);

  // LMP & EDD
  const [lmpDate, setLmpDate] = useState<string>('2026-03-01');
  const [eddDate, setEddDate] = useState<string>('');

  // Lab Baselines & Serology
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [genotype, setGenotype] = useState<Genotype>('AA');
  const [hivStatus, setHivStatus] = useState<'NEGATIVE' | 'POSITIVE' | 'PENDING'>('NEGATIVE');
  const [hepatitisBStatus, setHepatitisBStatus] = useState<'NEGATIVE' | 'POSITIVE' | 'PENDING'>('NEGATIVE');
  const [vdrlRprStatus, setVdrlRprStatus] = useState<'NON_REACTIVE' | 'REACTIVE'>('NON_REACTIVE');
  const [tetanusToxoidDoses, setTetanusToxoidDoses] = useState<number>(1);
  const [iptpMalariaDoses, setIptpMalariaDoses] = useState<number>(0);

  // Risk Classification
  const [riskLevel, setRiskLevel] = useState<PregnancyRiskLevel>('LOW_RISK');
  const [riskFactorsInput, setRiskFactorsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculate EDD via Naegele's Rule (+1 year, -3 months, +7 days) when LMP changes
  const handleLmpChange = (val: string) => {
    setLmpDate(val);
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const edd = new Date(d);
        edd.setDate(edd.getDate() + 280); // 40 weeks standard
        setEddDate(edd.toISOString().split('T')[0] ?? '');
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalEdd = eddDate || (() => {
        const d = new Date(lmpDate);
        d.setDate(d.getDate() + 280);
        return d.toISOString().split('T')[0] ?? '';
      })();

      const riskFactors = riskFactorsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await onSubmit({
        patientId: `P-${Date.now()}`,
        patientName: patientName.trim(),
        hospitalNumber: hospitalNumber.trim() || `HIMS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        age,
        phone: phone.trim(),
        gravida,
        para,
        living,
        abortions,
        lmpDate,
        eddDate: finalEdd,
        bloodGroup,
        genotype,
        hivStatus,
        hepatitisBStatus,
        vdrlRprStatus,
        tetanusToxoidDoses,
        iptpMalariaDoses,
        riskLevel,
        riskFactors
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
        <div className="bg-gradient-to-r from-pink-700 via-rose-700 to-purple-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Antenatal Care (ANC) Booking</h2>
              <p className="text-xs text-rose-100">FR-MAT-01 • First obstetric registration, GPLA & baseline screening</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Maternal Demographics */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-pink-600" /> Maternal Demographics
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Mother&apos;s Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Halima Abdullahi"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hospital Number (MRN)</label>
                <input
                  type="text"
                  value={hospitalNumber}
                  onChange={(e) => setHospitalNumber(e.target.value)}
                  placeholder="e.g. HIMS-2026-00452"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Maternal Age *</label>
                <input
                  type="number"
                  min={12}
                  max={60}
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number / Emergency Contact *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Obstetric History (GPLA) */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-600" /> Obstetric History (GPLA Scoring)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Gravida (Total Pregnancies)</label>
                <input
                  type="number"
                  min={1}
                  value={gravida}
                  onChange={(e) => setGravida(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded px-2 py-1 mt-1 border border-slate-300 bg-white"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Para (Deliveries &gt;28 wks)</label>
                <input
                  type="number"
                  min={0}
                  value={para}
                  onChange={(e) => setPara(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded px-2 py-1 mt-1 border border-slate-300 bg-white"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Living Children</label>
                <input
                  type="number"
                  min={0}
                  value={living}
                  onChange={(e) => setLiving(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded px-2 py-1 mt-1 border border-slate-300 bg-white"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600">Abortions / Miscarriages</label>
                <input
                  type="number"
                  min={0}
                  value={abortions}
                  onChange={(e) => setAbortions(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded px-2 py-1 mt-1 border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* LMP and EDD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Last Menstrual Period (LMP) *</label>
                <input
                  type="date"
                  required
                  value={lmpDate}
                  onChange={(e) => handleLmpChange(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estimated Date of Delivery (EDD) <span className="text-slate-400 font-normal">(Auto-calculated)</span>
                </label>
                <input
                  type="date"
                  value={eddDate}
                  onChange={(e) => setEddDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 font-bold focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Blood & Serology Baselines */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Blood Group & Routine ANC Serology
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2 font-bold"
                >
                  <option value="O+">O+ (Rh Pos)</option>
                  <option value="O-">O- (Rh Neg - Anti-D Risk)</option>
                  <option value="A+">A+ (Rh Pos)</option>
                  <option value="A-">A- (Rh Neg)</option>
                  <option value="B+">B+ (Rh Pos)</option>
                  <option value="B-">B- (Rh Neg)</option>
                  <option value="AB+">AB+ (Rh Pos)</option>
                  <option value="AB-">AB- (Rh Neg)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hb Genotype</label>
                <select
                  value={genotype}
                  onChange={(e) => setGenotype(e.target.value as Genotype)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2 font-bold"
                >
                  <option value="AA">AA (Normal)</option>
                  <option value="AS">AS (Carrier)</option>
                  <option value="SS">SS (Sickle Cell)</option>
                  <option value="AC">AC</option>
                  <option value="SC">SC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">HIV Serology</label>
                <select
                  value={hivStatus}
                  onChange={(e) => setHivStatus(e.target.value as AncProfile['hivStatus'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="NEGATIVE">Negative</option>
                  <option value="POSITIVE">Positive (PMTCT Protocol)</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hepatitis B (HBsAg)</label>
                <select
                  value={hepatitisBStatus}
                  onChange={(e) => setHepatitisBStatus(e.target.value as AncProfile['hepatitisBStatus'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="NEGATIVE">Negative</option>
                  <option value="POSITIVE">Positive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">VDRL / Syphilis</label>
                <select
                  value={vdrlRprStatus}
                  onChange={(e) => setVdrlRprStatus(e.target.value as AncProfile['vdrlRprStatus'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="NON_REACTIVE">Non-Reactive</option>
                  <option value="REACTIVE">Reactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tetanus Toxoid (TT) Doses Given</label>
                <select
                  value={tetanusToxoidDoses}
                  onChange={(e) => setTetanusToxoidDoses(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value={0}>0 Doses (None)</option>
                  <option value={1}>TT1 (Given at booking)</option>
                  <option value={2}>TT2 (4 weeks after TT1)</option>
                  <option value={3}>TT3 (6 months after TT2)</option>
                  <option value={4}>TT4 (1 year after TT3)</option>
                  <option value={5}>TT5 (Fully Protected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">IPTp Malaria Prophylaxis (SP Doses)</label>
                <select
                  value={iptpMalariaDoses}
                  onChange={(e) => setIptpMalariaDoses(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value={0}>0 Doses (Pre-quickening / &lt;16 wks)</option>
                  <option value={1}>IPTp-SP Dose 1</option>
                  <option value={2}>IPTp-SP Dose 2</option>
                  <option value={3}>IPTp-SP Dose 3 (Complete)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Risk Classification */}
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-3">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Pregnancy Risk Level & High-Risk Indicators
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Risk Stratification *</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as PregnancyRiskLevel)}
                  className={`w-full text-xs font-bold rounded-lg border px-3 py-2 bg-white ${
                    riskLevel === 'HIGH_RISK' ? 'text-red-700 border-red-300 ring-1 ring-red-400' : 'text-emerald-700 border-emerald-300'
                  }`}
                >
                  <option value="LOW_RISK">Low Risk (Standard Midwifery Care)</option>
                  <option value="HIGH_RISK">High Risk (Consultant Obstetrician Led)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  High-Risk Clinical Factors <span className="text-slate-400 font-normal">(Comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={riskFactorsInput}
                  onChange={(e) => setRiskFactorsInput(e.target.value)}
                  placeholder="e.g. Previous C-Section, Chronic Hypertension, Twin Pregnancy, Rh Negative..."
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Baby className="w-4 h-4" />
              {submitting ? 'Registering...' : 'Register ANC Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
