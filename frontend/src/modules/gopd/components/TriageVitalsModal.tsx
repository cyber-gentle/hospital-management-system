import React, { useState, useMemo } from "react";
import { X, Activity, AlertTriangle, CheckCircle2, User, Heart, Thermometer, Wind, Scale } from "lucide-react";
import { GopdPatient, Vitals } from "../types";

interface TriageVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: GopdPatient | null;
  onSave: (
    patientId: string,
    vitals: Vitals,
    priority: "EMERGENCY" | "URGENT" | "STANDARD" | "NON_URGENT"
  ) => Promise<void>;
}

export const TriageVitalsModal: React.FC<TriageVitalsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave,
}) => {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulseRate, setPulseRate] = useState<number>(76);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [spO2, setSpO2] = useState<number>(98);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(170);
  const [painScore, setPainScore] = useState<number>(2);
  const [bloodGlucose, setBloodGlucose] = useState<string>("");
  const [consciousnessLevel, setConsciousnessLevel] = useState<"Alert" | "Voice" | "Pain" | "Unresponsive">("Alert");
  const [triagePriority, setTriagePriority] = useState<"EMERGENCY" | "URGENT" | "STANDARD" | "NON_URGENT">("STANDARD");
  const [triageNotes, setTriageNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or update fields when a patient is opened
  React.useEffect(() => {
    if (patient) {
      setTriagePriority(patient.triagePriority || "STANDARD");
      if (patient.vitals) {
        setSystolic(patient.vitals.systolic || 120);
        setDiastolic(patient.vitals.diastolic || 80);
        setPulseRate(patient.vitals.pulseRate || 76);
        setTemperature(patient.vitals.temperature || 36.8);
        setSpO2(patient.vitals.spO2 || 98);
        setRespiratoryRate(patient.vitals.respiratoryRate || 18);
        setWeight(patient.vitals.weight || 70);
        setHeight(patient.vitals.height || 170);
        setPainScore(patient.vitals.painScore || 0);
        setConsciousnessLevel(patient.vitals.consciousnessLevel || "Alert");
        setTriageNotes(patient.vitals.triageNotes || "");
      }
    }
  }, [patient]);

  // BMI Calculation
  const bmiInfo = useMemo(() => {
    if (!weight || !height || height <= 0) return null;
    const heightInMeters = height / 100;
    const val = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    let label = "Normal";
    let color = "text-emerald-700 bg-emerald-50 border-emerald-200";

    if (val < 18.5) {
      label = "Underweight";
      color = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (val >= 25 && val < 30) {
      label = "Overweight";
      color = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (val >= 30) {
      label = "Obese";
      color = "text-red-700 bg-red-50 border-red-200";
    }

    return { value: val, label, color };
  }, [weight, height]);

  // Red Flag Abnormal Detection
  const alerts = useMemo(() => {
    const list: string[] = [];
    if (systolic >= 160 || diastolic >= 100) list.push("Severe Hypertension Warning (BP ≥ 160/100)");
    if (systolic < 90) list.push("Hypotension Warning (Systolic < 90)");
    if (temperature >= 38.3) list.push("High Grade Fever (Temp ≥ 38.3°C)");
    if (spO2 < 94) list.push("Hypoxemia Alert (SpO2 < 94%)");
    if (pulseRate > 110) list.push("Tachycardia (Pulse > 110 bpm)");
    if (pulseRate < 50) list.push("Bradycardia (Pulse < 50 bpm)");
    if (respiratoryRate > 24) list.push("Tachypnea (Resp > 24 /min)");
    return list;
  }, [systolic, diastolic, temperature, spO2, pulseRate, respiratoryRate]);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const vitals: Vitals = {
        bloodPressure: `${systolic}/${diastolic}`,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulseRate: Number(pulseRate),
        temperature: Number(temperature),
        spO2: Number(spO2),
        respiratoryRate: Number(respiratoryRate),
        weight: Number(weight),
        height: Number(height),
        bmi: bmiInfo?.value,
        painScore: Number(painScore),
        bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : undefined,
        consciousnessLevel,
        triageNotes: triageNotes.trim() || undefined,
        recordedBy: "Nurse B. Taiwo, RN",
        recordedAt: new Date().toISOString()
      };

      await onSave(patient.id, vitals, triagePriority);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save triage vitals.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Record Outpatient Triage Vitals</h2>
              <p className="text-xs text-slate-500">GOPD Triage Station • Nursing Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Summary Strip */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">{patient.patientName}</span>
            <span className="text-slate-500">({patient.gender}, {patient.age}y)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Hospital No:</span>
            <span className="font-mono font-bold text-slate-700">{patient.hospitalNumber}</span>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded ml-2">
              Token {patient.queueNumber}
            </span>
          </div>
        </div>

        {/* Abnormal Warnings Banner */}
        {alerts.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              Critical Vital Sign Warning:
            </div>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 ml-1">
              {alerts.map((alt, i) => (
                <li key={i}>{alt}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Triage Priority Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Assign Triage Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "EMERGENCY", label: "Emergency", color: "border-red-500 bg-red-50 text-red-700", ring: "ring-red-500" },
                { id: "URGENT", label: "Urgent", color: "border-amber-500 bg-amber-50 text-amber-700", ring: "ring-amber-500" },
                { id: "STANDARD", label: "Standard", color: "border-blue-500 bg-blue-50 text-blue-700", ring: "ring-blue-500" },
                { id: "NON_URGENT", label: "Non-Urgent", color: "border-slate-400 bg-slate-50 text-slate-700", ring: "ring-slate-400" },
              ].map(opt => {
                const isSelected = triagePriority === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTriagePriority(opt.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? `${opt.color} ring-2 ${opt.ring} shadow-xs font-extrabold`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Blood Pressure */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                Blood Pressure (mmHg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min={50}
                  max={260}
                  value={systolic}
                  onChange={e => setSystolic(Number(e.target.value))}
                  placeholder="Sys"
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-slate-400 font-bold">/</span>
                <input
                  type="number"
                  required
                  min={30}
                  max={160}
                  value={diastolic}
                  onChange={e => setDiastolic(Number(e.target.value))}
                  placeholder="Dia"
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Pulse Rate */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Pulse Rate (bpm)
              </label>
              <input
                type="number"
                required
                min={30}
                max={220}
                value={pulseRate}
                onChange={e => setPulseRate(Number(e.target.value))}
                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                min={30}
                max={44}
                value={temperature}
                onChange={e => setTemperature(Number(e.target.value))}
                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Oxygen Saturation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-500" />
                SpO2 Saturation (%)
              </label>
              <input
                type="number"
                required
                min={50}
                max={100}
                value={spO2}
                onChange={e => setSpO2(Number(e.target.value))}
                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Respiratory Rate */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Respiratory Rate (/min)
              </label>
              <input
                type="number"
                required
                min={8}
                max={60}
                value={respiratoryRate}
                onChange={e => setRespiratoryRate(Number(e.target.value))}
                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Pain Score */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>Pain Score (0-10)</span>
                <span className="font-bold text-blue-700">{painScore}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={painScore}
                onChange={e => setPainScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-blue-600 mt-2"
              />
            </div>

            {/* Consciousness (AVPU) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Consciousness (AVPU)
              </label>
              <select
                value={consciousnessLevel}
                onChange={e => setConsciousnessLevel(e.target.value as any)}
                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="Alert">Alert</option>
                <option value="Voice">Responsive to Voice</option>
                <option value="Pain">Responsive to Pain</option>
                <option value="Unresponsive">Unresponsive</option>
              </select>
            </div>

            {/* Blood Glucose */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Blood Glucose (mg/dL)
              </label>
              <input
                type="number"
                min={20}
                max={600}
                value={bloodGlucose}
                onChange={e => setBloodGlucose(e.target.value)}
                placeholder="e.g. 105 (Optional)"
                className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Antropometry (Weight, Height & BMI) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-600" />
              Anthropometry & Calculated BMI
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min={1}
                  max={300}
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="1"
                  min={30}
                  max={250}
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Calculated BMI</label>
                {bmiInfo ? (
                  <div className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-between ${bmiInfo.color}`}>
                    <span>{bmiInfo.value} kg/m²</span>
                    <span>{bmiInfo.label}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Enter weight & height</span>
                )}
              </div>
            </div>
          </div>

          {/* Triage Nurse Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Triage Nurse Clinical Remarks / Presenting Complaint
            </label>
            <textarea
              rows={2}
              value={triageNotes}
              onChange={e => setTriageNotes(e.target.value)}
              placeholder="e.g. Patient presents with high fever, sweating, and severe headaches for 3 days..."
              className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Vitals & Send to Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
