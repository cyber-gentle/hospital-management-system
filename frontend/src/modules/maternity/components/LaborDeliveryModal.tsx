import React, { useState } from 'react';
import { X, Sparkles, Baby, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AncProfile, DeliveryMode, PerineumStatus, DeliveryRecord, NewbornDetails, ApgarScore } from '../types';

interface LaborDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AncProfile;
  onSubmit: (record: Omit<DeliveryRecord, 'id' | 'deliveryTime' | 'newborns'> & { newborns: Omit<NewbornDetails, 'id' | 'birthTimestamp'>[] }) => Promise<void>;
}

export const LaborDeliveryModal: React.FC<LaborDeliveryModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSubmit
}) => {
  // Labor Details
  const [laborStartTime, setLaborStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [cervicalDilationAtAdmissionCm, setCervicalDilationAtAdmissionCm] = useState<number>(5);
  const [fetalStation, setFetalStation] = useState<string>('0');
  const [membranesStatus, setMembranesStatus] = useState<DeliveryRecord['membranesStatus']>('RUPTURED_CLEAR');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('SPONTANEOUS_VAGINAL');
  const [perineumStatus, setPerineumStatus] = useState<PerineumStatus>('INTACT');
  const [bloodLossMl, setBloodLossMl] = useState<number>(200);
  const [amtslOxytocinGiven, setAmtslOxytocinGiven] = useState(true);
  const [placentaDelivery, setPlacentaDelivery] = useState<DeliveryRecord['placentaDelivery']>('COMPLETE');
  const [leadMidwifeOrDoctor, setLeadMidwifeOrDoctor] = useState('Senior Midwife M. Ibrahim (RN/RM)');
  const [deliveryNotes, setDeliveryNotes] = useState('Normal spontaneous delivery of a vigorous infant. Active management of third stage completed.');

  // Newborn Details
  const [babySex, setBabySex] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [birthWeightKg, setBirthWeightKg] = useState<number>(3.3);
  const [lengthCm, setLengthCm] = useState<number>(50.0);
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<number>(34.0);
  const [vitaminKAdministered, setVitaminKAdministered] = useState(true);
  const [eyeProphylaxisAdministered, setEyeProphylaxisAdministered] = useState(true);
  const [bcgGiven, setBcgGiven] = useState(true);
  const [opv0Given, setOpv0Given] = useState(true);
  const [hepBGiven, setHepBGiven] = useState(true);
  const [resuscitationNeeded, setResuscitationNeeded] = useState<NewbornDetails['resuscitationNeeded']>('ROUTINE_CARE');

  // APGAR Scores (1-min and 5-min)
  const [apgar1Color, setApgar1Color] = useState<number>(2);
  const [apgar1Heart, setApgar1Heart] = useState<number>(2);
  const [apgar1Grimace, setApgar1Grimace] = useState<number>(2);
  const [apgar1Tone, setApgar1Tone] = useState<number>(1);
  const [apgar1Resp, setApgar1Resp] = useState<number>(2);

  const [apgar5Color, setApgar5Color] = useState<number>(2);
  const [apgar5Heart, setApgar5Heart] = useState<number>(2);
  const [apgar5Grimace, setApgar5Grimace] = useState<number>(2);
  const [apgar5Tone, setApgar5Tone] = useState<number>(2);
  const [apgar5Resp, setApgar5Resp] = useState<number>(2);

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalApgar1 = apgar1Color + apgar1Heart + apgar1Grimace + apgar1Tone + apgar1Resp;
  const totalApgar5 = apgar5Color + apgar5Heart + apgar5Grimace + apgar5Tone + apgar5Resp;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const apgarOneMinute: ApgarScore = {
        appearanceColor: apgar1Color,
        pulseHeartRate: apgar1Heart,
        grimaceReflex: apgar1Grimace,
        activityTone: apgar1Tone,
        respirationEffort: apgar1Resp,
        totalScore: totalApgar1
      };

      const apgarFiveMinute: ApgarScore = {
        appearanceColor: apgar5Color,
        pulseHeartRate: apgar5Heart,
        grimaceReflex: apgar5Grimace,
        activityTone: apgar5Tone,
        respirationEffort: apgar5Resp,
        totalScore: totalApgar5
      };

      const newbornObj: Omit<NewbornDetails, 'id' | 'birthTimestamp'> = {
        babySex,
        birthWeightKg,
        lengthCm,
        headCircumferenceCm,
        apgarOneMinute,
        apgarFiveMinute,
        vitaminKAdministered,
        eyeProphylaxisAdministered,
        birthImmunization: {
          bcgGiven,
          opv0Given,
          hepBGiven
        },
        resuscitationNeeded
      };

      await onSubmit({
        ancProfileId: profile.id,
        patientName: profile.patientName,
        hospitalNumber: profile.hospitalNumber,
        laborStartTime,
        cervicalDilationAtAdmissionCm,
        fetalStation,
        membranesStatus,
        deliveryMode,
        perineumStatus,
        bloodLossMl,
        amtslOxytocinGiven,
        placentaDelivery,
        leadMidwifeOrDoctor: leadMidwifeOrDoctor.trim(),
        deliveryNotes: deliveryNotes.trim(),
        newborns: [newbornObj]
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
        <div className="bg-gradient-to-r from-purple-800 via-rose-700 to-pink-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Labor & Delivery Suite Documentation</h2>
              <p className="text-xs text-pink-100">
                FR-MAT-02 • Mother: <span className="font-semibold text-white">{profile.patientName}</span> ({profile.hospitalNumber}) • Partograph & APGAR Scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-pink-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Partograph & Labor Progression */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" /> Labor Progression & Delivery Mode
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Labor Onset Time</label>
                <input
                  type="datetime-local"
                  value={laborStartTime}
                  onChange={(e) => setLaborStartTime(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cervical Dilation</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={cervicalDilationAtAdmissionCm}
                    onChange={(e) => setCervicalDilationAtAdmissionCm(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                  />
                  <span className="text-[11px] text-slate-500">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fetal Station</label>
                <select
                  value={fetalStation}
                  onChange={(e) => setFetalStation(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="-3">-3 (High / Floating)</option>
                  <option value="-2">-2</option>
                  <option value="-1">-1</option>
                  <option value="0">0 (Ischial Spines / Engaged)</option>
                  <option value="+1">+1</option>
                  <option value="+2">+2 (Crowing)</option>
                  <option value="+3">+3 (On Perineum)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Membranes Status</label>
                <select
                  value={membranesStatus}
                  onChange={(e) => setMembranesStatus(e.target.value as DeliveryRecord['membranesStatus'])}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="INTACT">Intact Membranes</option>
                  <option value="RUPTURED_CLEAR">Ruptured Clear Liquor</option>
                  <option value="RUPTURED_MECONIUM">Ruptured Meconium-Stained</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Mode *</label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2 text-purple-900"
                >
                  <option value="SPONTANEOUS_VAGINAL">Spontaneous Vaginal (SVD)</option>
                  <option value="ASSISTED_VACUUM">Assisted Vacuum Delivery</option>
                  <option value="ASSISTED_FORCEPS">Assisted Forceps Delivery</option>
                  <option value="EMERGENCY_CESAREAN">Emergency C-Section</option>
                  <option value="ELECTIVE_CESAREAN">Elective C-Section</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Perineum Status</label>
                <select
                  value={perineumStatus}
                  onChange={(e) => setPerineumStatus(e.target.value as PerineumStatus)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="INTACT">Perineum Intact</option>
                  <option value="EPISIOTOMY">Episiotomy Performed</option>
                  <option value="FIRST_DEGREE_TEAR">1st Degree Perineal Tear</option>
                  <option value="SECOND_DEGREE_TEAR">2nd Degree Perineal Tear</option>
                  <option value="THIRD_DEGREE_TEAR">3rd Degree Tear (Anal Sphincter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Blood Loss</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={bloodLossMl}
                    onChange={(e) => setBloodLossMl(Number(e.target.value))}
                    className={`w-full text-xs font-bold rounded-lg border bg-white px-2 py-2 ${
                      bloodLossMl >= 500 ? 'border-red-400 text-red-700 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-500">mL</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Placenta & Membranes</label>
                <select
                  value={placentaDelivery}
                  onChange={(e) => setPlacentaDelivery(e.target.value as DeliveryRecord['placentaDelivery'])}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="COMPLETE">Complete & Intact</option>
                  <option value="INCOMPLETE_MANUAL_REMOVAL">Incomplete / Manual Removal</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={amtslOxytocinGiven}
                  onChange={(e) => setAmtslOxytocinGiven(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500"
                />
                Active Management of Third Stage of Labor (AMTSL): 10 IU Oxytocin IM given within 1 min of birth
              </label>
            </div>
          </div>

          {/* Newborn Evaluation & APGAR Scoring */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-pink-600" /> Newborn Anthropometry & Immediate Care
              </span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`px-2 py-0.5 rounded-full ${totalApgar1 >= 7 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  1-min APGAR: {totalApgar1}/10
                </span>
                <span className={`px-2 py-0.5 rounded-full ${totalApgar5 >= 7 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  5-min APGAR: {totalApgar5}/10
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sex of Infant *</label>
                <select
                  value={babySex}
                  onChange={(e) => setBabySex(e.target.value as 'MALE' | 'FEMALE')}
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                >
                  <option value="FEMALE">Female 👧</option>
                  <option value="MALE">Male 👦</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Birth Weight *</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={birthWeightKg}
                    onChange={(e) => setBirthWeightKg(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white px-2 py-2"
                  />
                  <span className="text-[11px] text-slate-500">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Birth Length</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                  />
                  <span className="text-[11px] text-slate-500">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Head Circumference</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={headCircumferenceCm}
                    onChange={(e) => setHeadCircumferenceCm(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-2"
                  />
                  <span className="text-[11px] text-slate-500">cm</span>
                </div>
              </div>
            </div>

            {/* Interactive APGAR Grid */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Standard APGAR Score Calculator (1 Minute &amp; 5 Minutes)
              </span>

              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold text-slate-600">
                <div>Appearance (Color)</div>
                <div>Pulse (Heart Rate)</div>
                <div>Grimace (Reflex)</div>
                <div>Activity (Tone)</div>
                <div>Respiration</div>
              </div>

              {/* 1 min row */}
              <div className="grid grid-cols-5 gap-2 items-center">
                <select
                  value={apgar1Color}
                  onChange={(e) => setApgar1Color(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Blue/Pale)</option>
                  <option value={1}>1 (Acrocyanosis)</option>
                  <option value={2}>2 (Pink)</option>
                </select>

                <select
                  value={apgar1Heart}
                  onChange={(e) => setApgar1Heart(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Absent)</option>
                  <option value={1}>1 (&lt;100 bpm)</option>
                  <option value={2}>2 (&gt;100 bpm)</option>
                </select>

                <select
                  value={apgar1Grimace}
                  onChange={(e) => setApgar1Grimace(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (No response)</option>
                  <option value={1}>1 (Grimace)</option>
                  <option value={2}>2 (Vigorous cry)</option>
                </select>

                <select
                  value={apgar1Tone}
                  onChange={(e) => setApgar1Tone(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Flaccid)</option>
                  <option value={1}>1 (Some flexion)</option>
                  <option value={2}>2 (Active motion)</option>
                </select>

                <select
                  value={apgar1Resp}
                  onChange={(e) => setApgar1Resp(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Absent)</option>
                  <option value={1}>1 (Slow/irregular)</option>
                  <option value={2}>2 (Good cry)</option>
                </select>
              </div>

              {/* 5 min row */}
              <div className="grid grid-cols-5 gap-2 items-center pt-1 border-t border-slate-200">
                <select
                  value={apgar5Color}
                  onChange={(e) => setApgar5Color(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Blue/Pale)</option>
                  <option value={1}>1 (Acrocyanosis)</option>
                  <option value={2}>2 (Pink)</option>
                </select>

                <select
                  value={apgar5Heart}
                  onChange={(e) => setApgar5Heart(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Absent)</option>
                  <option value={1}>1 (&lt;100 bpm)</option>
                  <option value={2}>2 (&gt;100 bpm)</option>
                </select>

                <select
                  value={apgar5Grimace}
                  onChange={(e) => setApgar5Grimace(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (No response)</option>
                  <option value={1}>1 (Grimace)</option>
                  <option value={2}>2 (Vigorous cry)</option>
                </select>

                <select
                  value={apgar5Tone}
                  onChange={(e) => setApgar5Tone(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Flaccid)</option>
                  <option value={1}>1 (Some flexion)</option>
                  <option value={2}>2 (Active motion)</option>
                </select>

                <select
                  value={apgar5Resp}
                  onChange={(e) => setApgar5Resp(Number(e.target.value))}
                  className="text-xs rounded border border-slate-300 bg-white py-1 px-1 text-center font-bold"
                >
                  <option value={0}>0 (Absent)</option>
                  <option value={1}>1 (Slow/irregular)</option>
                  <option value={2}>2 (Good cry)</option>
                </select>
              </div>
            </div>

            {/* Neonatal Prophylaxis & Immunization */}
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Immediate Neonatal Prophylaxis &amp; Birth Doses
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-1.5 text-slate-700">
                  <input
                    type="checkbox"
                    checked={vitaminKAdministered}
                    onChange={(e) => setVitaminKAdministered(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  Vitamin K1 (1mg IM)
                </label>
                <label className="flex items-center gap-1.5 text-slate-700">
                  <input
                    type="checkbox"
                    checked={eyeProphylaxisAdministered}
                    onChange={(e) => setEyeProphylaxisAdministered(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  Eye Ointment (Tetracycline)
                </label>
                <label className="flex items-center gap-1.5 text-slate-700">
                  <input
                    type="checkbox"
                    checked={bcgGiven && opv0Given && hepBGiven}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setBcgGiven(v);
                      setOpv0Given(v);
                      setHepBGiven(v);
                    }}
                    className="rounded text-emerald-600"
                  />
                  BCG, OPV0, HepB Birth Doses
                </label>
                <div>
                  <select
                    value={resuscitationNeeded}
                    onChange={(e) => setResuscitationNeeded(e.target.value as NewbornDetails['resuscitationNeeded'])}
                    className="w-full text-[11px] rounded border border-slate-300 bg-white py-1"
                  >
                    <option value="ROUTINE_CARE">Routine drying &amp; warmth</option>
                    <option value="TACTILE_STIMULATION">Tactile stimulation</option>
                    <option value="SUCTION_AIRWAY">Airway suction</option>
                    <option value="BAG_VALVE_MASK">Bag-valve-mask (BVM)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Personnel & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Delivering Midwife or Doctor *</label>
              <input
                type="text"
                required
                value={leadMidwifeOrDoctor}
                onChange={(e) => setLeadMidwifeOrDoctor(e.target.value)}
                className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Summary &amp; Perineal Suturing Notes *</label>
              <textarea
                required
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-pink-500 focus:outline-none"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Registering Delivery...' : 'Confirm Delivery & Register Newborn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
