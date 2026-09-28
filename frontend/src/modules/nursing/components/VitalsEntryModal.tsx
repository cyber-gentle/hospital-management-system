import React, { useState, useMemo } from 'react';
import { InpatientAdmission, VitalSign } from '../types';
import { calculateNEWS2 } from '../api';

interface VitalsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: InpatientAdmission | null;
  onSaveVitals: (vital: Omit<VitalSign, 'id' | 'recordedAt' | 'earlyWarningScore' | 'isAbnormal'>) => Promise<void>;
}

export const VitalsEntryModal: React.FC<VitalsEntryModalProps> = ({
  isOpen,
  onClose,
  admission,
  onSaveVitals
}) => {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulseRate, setPulseRate] = useState<number>(75);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [oxygenSaturation, setOxygenSaturation] = useState<number>(98);
  const [painScore, setPainScore] = useState<number>(1);
  const [consciousnessLevel, setConsciousnessLevel] = useState<'Alert' | 'Voice' | 'Pain' | 'Unresponsive'>('Alert');
  const [bloodGlucose, setBloodGlucose] = useState<string>('105');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [source, setSource] = useState<'manual' | 'device_stub'>('manual');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deviceSyncing, setDeviceSyncing] = useState<boolean>(false);

  // Real-time calculated NEWS2 score
  const news2Score = useMemo(() => {
    return calculateNEWS2({
      bloodPressureSystolic: systolic,
      pulseRate,
      respiratoryRate,
      temperature,
      oxygenSaturation,
      consciousnessLevel
    });
  }, [systolic, pulseRate, respiratoryRate, temperature, oxygenSaturation, consciousnessLevel]);

  if (!isOpen || !admission) return null;

  // Telemetry device connect stub (FR-NS-04)
  const handleSimulateDeviceSync = () => {
    setDeviceSyncing(true);
    setTimeout(() => {
      // Generate realistic vitals from bedside telemetry
      const mockSys = Math.floor(115 + Math.random() * 30);
      const mockDia = Math.floor(75 + Math.random() * 20);
      const mockPulse = Math.floor(72 + Math.random() * 25);
      const mockSpO2 = Math.floor(95 + Math.random() * 5);
      const mockResp = Math.floor(16 + Math.random() * 6);
      const mockTemp = parseFloat((36.5 + Math.random() * 0.9).toFixed(1));

      setSystolic(mockSys);
      setDiastolic(mockDia);
      setPulseRate(mockPulse);
      setOxygenSaturation(mockSpO2);
      setRespiratoryRate(mockResp);
      setTemperature(mockTemp);
      setSource('device_stub');
      setClinicalNotes(`Auto-synced from Philips IntelliVue Monitor (Bed ${admission.bedNumber}) via HL7/BLE stub.`);
      setDeviceSyncing(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveVitals({
        admissionId: admission.id,
        patientName: admission.patientName,
        hospitalNumber: admission.hospitalNumber,
        recordedBy: 'Nurse B. Taiwo, RN',
        bloodPressureSystolic: Number(systolic),
        bloodPressureDiastolic: Number(diastolic),
        pulseRate: Number(pulseRate),
        respiratoryRate: Number(respiratoryRate),
        temperature: Number(temperature),
        oxygenSaturation: Number(oxygenSaturation),
        painScore: Number(painScore),
        consciousnessLevel,
        bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : undefined,
        source,
        clinicalNotes: clinicalNotes.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save vitals entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNewsBadge = () => {
    if (news2Score >= 7) {
      return { text: 'HIGH RISK (NEWS2 >= 7)', color: 'bg-rose-600 text-white animate-pulse' };
    }
    if (news2Score >= 5) {
      return { text: 'MEDIUM RISK (NEWS2 5-6)', color: 'bg-amber-500 text-white' };
    }
    if (news2Score >= 1) {
      return { text: 'LOW RISK (NEWS2 1-4)', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'NORMAL (NEWS2 = 0)', color: 'bg-emerald-100 text-emerald-800' };
  };

  const newsBadge = getNewsBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              🩺
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Vitals & Clinical Observation (FR-NS-04)</h2>
              <p className="text-xs text-teal-100">
                {admission.patientName} • {admission.hospitalNumber} • Bed {admission.bedNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Telemetry / Device Stub Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Early Warning Score:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${newsBadge.color}`}>
              {newsBadge.text} [Score: {news2Score}]
            </span>
          </div>

          <button
            type="button"
            onClick={handleSimulateDeviceSync}
            disabled={deviceSyncing}
            className="px-3 py-1.5 bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            {deviceSyncing ? (
              <>📡 Polling Bedside Telemetry...</>
            ) : (
              <>📡 Sync from Bedside Monitor (Stub)</>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* BP & Pulse Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Systolic BP (mmHg) *
              </label>
              <input
                type="number"
                required
                min="50"
                max="260"
                value={systolic}
                onChange={(e) => {
                  setSystolic(parseInt(e.target.value) || 0);
                  setSource('manual');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm ${
                  systolic >= 140 || systolic <= 90 ? 'border-amber-400 bg-amber-50/40 text-amber-900' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diastolic BP (mmHg) *
              </label>
              <input
                type="number"
                required
                min="30"
                max="160"
                value={diastolic}
                onChange={(e) => {
                  setDiastolic(parseInt(e.target.value) || 0);
                  setSource('manual');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm ${
                  diastolic >= 90 ? 'border-amber-400 bg-amber-50/40 text-amber-900' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pulse / Heart Rate (bpm) *
              </label>
              <input
                type="number"
                required
                min="30"
                max="220"
                value={pulseRate}
                onChange={(e) => {
                  setPulseRate(parseInt(e.target.value) || 0);
                  setSource('manual');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm ${
                  pulseRate >= 100 || pulseRate <= 55 ? 'border-rose-400 bg-rose-50/40 text-rose-900' : 'border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Respiration, Temp & SpO2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SpO2 Saturation (%) *
              </label>
              <input
                type="number"
                required
                min="50"
                max="100"
                value={oxygenSaturation}
                onChange={(e) => {
                  setOxygenSaturation(parseInt(e.target.value) || 0);
                  setSource('manual');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm ${
                  oxygenSaturation < 94 ? 'border-rose-400 bg-rose-50/40 text-rose-900 font-bold' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Respiratory Rate (bpm) *
              </label>
              <input
                type="number"
                required
                min="6"
                max="60"
                value={respiratoryRate}
                onChange={(e) => {
                  setRespiratoryRate(parseInt(e.target.value) || 0);
                  setSource('manual');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm ${
                  respiratoryRate >= 24 || respiratoryRate <= 10 ? 'border-amber-400 bg-amber-50/40 text-amber-900' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Body Temperature (°C) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                min="32"
                max="43"
                value={temperature}
                onChange={(e) => {
                  setTemperature(parseFloat(e.target.value) || 0);
                  setSource('manual');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold text-sm ${
                  temperature >= 38.0 || temperature <= 35.5 ? 'border-rose-400 bg-rose-50/40 text-rose-900' : 'border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Pain Score, Consciousness, Blood Glucose */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pain Score (0 - 10 Scale)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painScore}
                  onChange={(e) => setPainScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className={`w-8 text-center font-bold text-xs px-1.5 py-0.5 rounded ${
                  painScore >= 7 ? 'bg-rose-100 text-rose-800' : painScore >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {painScore}/10
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consciousness (AVPU)
              </label>
              <select
                value={consciousnessLevel}
                onChange={(e) => setConsciousnessLevel(e.target.value as 'Alert' | 'Voice' | 'Pain' | 'Unresponsive')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-xs font-semibold"
              >
                <option value="Alert">Alert (A)</option>
                <option value="Voice">Responsive to Voice (V)</option>
                <option value="Pain">Responsive to Pain (P)</option>
                <option value="Unresponsive">Unresponsive (U)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Random Blood Glucose (mg/dL)
              </label>
              <input
                type="number"
                placeholder="Optional"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Clinical Observation Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nursing Observation & Clinical Findings
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patient resting quietly. IV cannula site clean with no signs of phlebitis. Tolerating oral sips."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-xs"
            />
          </div>

          {/* Device Source Indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span>
              Entry Method: <strong className="text-slate-700 capitalize">{source === 'device_stub' ? 'Bedside Monitor (Simulated BLE)' : 'Manual Entry'}</strong>
            </span>
            <span className="text-emerald-700 font-semibold">
              ✓ Local Offline Cache Enabled
            </span>
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
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Recording Vitals...' : 'Save Vitals & Commit to Chart →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
