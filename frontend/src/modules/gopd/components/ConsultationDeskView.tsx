import React, { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Pill,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Clock
} from "lucide-react";
import { gopdApi } from "../api";
import { GopdPatient, Diagnosis, PrescriptionItem, InvestigationOrder, ConsultationRecord } from "../types";
import { ICD10Selector } from "./ICD10Selector";
import { PrescriptionModal } from "./PrescriptionModal";
import { InvestigationOrderModal } from "./InvestigationOrderModal";

const COMMON_SYMPTOMS = [
  "High grade fever",
  "Severe frontal headache",
  "Generalized body weakness",
  "Productive cough",
  "Watery diarrhea & vomiting",
  "Epigastric pain",
  "Dysuria & urinary frequency",
  "Joint and body pain"
];

export const ConsultationDeskView: React.FC = () => {
  const [queue, setQueue] = useState<GopdPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<GopdPatient | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Consultation state for selected patient
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [historyOfIllness, setHistoryOfIllness] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationOrder[]>([]);
  const [disposition, setDisposition] = useState<"DISCHARGED" | "ADMIT_WARD" | "REFER_SPECIALIST" | "FOLLOW_UP">("DISCHARGED");
  const [notes, setNotes] = useState("");

  // Modals
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await gopdApi.getQueue();
      setQueue(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // When selected patient changes, load existing or reset form
  useEffect(() => {
    if (selectedPatient) {
      if (selectedPatient.consultation) {
        setChiefComplaint(selectedPatient.consultation.chiefComplaint || "");
        setHistoryOfIllness(selectedPatient.consultation.historyOfPresentingIllness || "");
        setPhysicalExam(selectedPatient.consultation.physicalExamination || "");
        setDiagnoses(selectedPatient.consultation.diagnoses || []);
        setPrescriptions(selectedPatient.consultation.prescriptions || []);
        setInvestigations(selectedPatient.consultation.investigations || []);
        setDisposition(selectedPatient.consultation.disposition || "DISCHARGED");
        setNotes(selectedPatient.consultation.notes || "");
      } else {
        // Pre-fill chief complaint from nurse triage note if available
        setChiefComplaint(selectedPatient.vitals?.triageNotes || "");
        setHistoryOfIllness("");
        setPhysicalExam("");
        setDiagnoses([]);
        setPrescriptions([]);
        setInvestigations([]);
        setDisposition("DISCHARGED");
        setNotes("");
      }
    }
  }, [selectedPatient]);

  const handleSelectPatient = async (patient: GopdPatient) => {
    setSelectedPatient(patient);
    if (patient.status === "WAITING_DOCTOR") {
      await gopdApi.startConsultation(patient.id);
      await loadQueue();
    }
  };

  const handleAddSymptom = (sym: string) => {
    if (!chiefComplaint) {
      setChiefComplaint(sym);
    } else if (!chiefComplaint.toLowerCase().includes(sym.toLowerCase())) {
      setChiefComplaint(prev => `${prev}, ${sym}`);
    }
  };

  const handleApplyNormalExam = () => {
    setPhysicalExam(
      "General: Conscious, alert, not pale, anicteric, afebrile, well hydrated.\n" +
      "CVS: S1, S2 heard, no murmurs. Pulse regular.\n" +
      "Resp: Vesicular breath sounds bilaterally, clear lung fields.\n" +
      "Abdomen: Soft, non-tender, no organomegaly.\n" +
      "CNS: Grossly intact, no focal neurological deficits."
    );
  };

  const handleCompleteConsultation = async () => {
    if (!selectedPatient) return;

    if (!chiefComplaint.trim()) {
      alert("Please enter patient's Chief Complaint before completing consultation.");
      return;
    }

    if (diagnoses.length === 0) {
      alert("Please select at least one ICD-10 Diagnosis.");
      return;
    }

    const hasPrimary = diagnoses.some(d => d.type === "PRIMARY");
    if (!hasPrimary) {
      alert("Please designate one diagnosis as Primary.");
      return;
    }

    setIsSubmitting(true);
    try {
      const record: Partial<ConsultationRecord> = {
        chiefComplaint: chiefComplaint.trim(),
        historyOfPresentingIllness: historyOfIllness.trim(),
        physicalExamination: physicalExam.trim(),
        diagnoses,
        prescriptions,
        investigations,
        disposition,
        notes: notes.trim(),
      };

      await gopdApi.saveConsultation(selectedPatient.id, record);
      setFeedbackMessage(`Consultation completed for ${selectedPatient.patientName}. Patient marked as ${disposition.replace("_", " ")}.`);
      
      const refreshedQueue = await gopdApi.getQueue();
      setQueue(refreshedQueue);

      // Auto-select next waiting patient if available
      const nextPatient = refreshedQueue.find(p => p.status === "WAITING_DOCTOR" && p.id !== selectedPatient.id);
      setSelectedPatient(nextPatient || null);

      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to save consultation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort queue: Emergency first, then Urgent, then Standard, then Non-Urgent
  const priorityRank: Record<string, number> = {
    EMERGENCY: 1,
    URGENT: 2,
    STANDARD: 3,
    NON_URGENT: 4
  };

  const doctorQueue = queue
    .filter(p => p.status === "WAITING_DOCTOR" || p.status === "IN_CONSULTATION")
    .filter(p => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        p.patientName.toLowerCase().includes(q) ||
        p.hospitalNumber.toLowerCase().includes(q) ||
        p.queueNumber.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (priorityRank[a.triagePriority] || 99) - (priorityRank[b.triagePriority] || 99));

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedbackMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Waiting Queue (4 cols) */}
        <div className="lg:col-span-4 border border-slate-200 rounded-2xl bg-white flex flex-col h-[850px] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              Doctor&apos;s Consultation Queue
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {loading ? "Refreshing..." : `${doctorQueue.length} Waiting`}
            </span>
          </div>

          {/* Search inside queue */}
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filter waiting patients..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2.5 space-y-2">
            {doctorQueue.map(patient => {
              const isSelected = selectedPatient?.id === patient.id;
              const isEmergency = patient.triagePriority === "EMERGENCY";
              const isUrgent = patient.triagePriority === "URGENT";

              return (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`w-full text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500"
                      : isEmergency
                      ? "border-red-200 bg-red-50/40 hover:bg-red-50"
                      : isUrgent
                      ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{patient.patientName}</span>
                      {patient.status === "IN_CONSULTATION" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      {patient.queueNumber}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mb-2">
                    {patient.hospitalNumber} • {patient.age}y {patient.gender}
                  </div>

                  {/* Vitals pill preview */}
                  {patient.vitals && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 bg-white/80 p-1.5 rounded-lg border border-slate-100 mb-2">
                      <span>BP: <strong>{patient.vitals.bloodPressure}</strong></span>
                      <span>Temp: <strong>{patient.vitals.temperature}°C</strong></span>
                      <span>SpO2: <strong>{patient.vitals.spO2}%</strong></span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isEmergency
                          ? "bg-red-100 text-red-700"
                          : isUrgent
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {patient.triagePriority}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Triaged
                    </span>
                  </div>
                </button>
              );
            })}

            {doctorQueue.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">No patients waiting</p>
                <p className="text-[11px]">Patients triaged in the Triage Station will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Consultation Form (8 cols) */}
        <div className="lg:col-span-8 border border-slate-200 rounded-2xl bg-white flex flex-col h-[850px] shadow-xs overflow-hidden">
          {selectedPatient ? (
            <div className="flex flex-col h-full">
              {/* Header / Vitals Strip */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/80">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {selectedPatient.patientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-base text-slate-900">{selectedPatient.patientName}</h2>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {selectedPatient.queueNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {selectedPatient.hospitalNumber} • {selectedPatient.age} years • {selectedPatient.gender}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        selectedPatient.triagePriority === "EMERGENCY"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : selectedPatient.triagePriority === "URGENT"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {selectedPatient.triagePriority}
                    </span>
                  </div>
                </div>

                {/* Vitals Summary Strip */}
                {selectedPatient.vitals ? (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">BP</span>
                        <span className="font-bold text-slate-800">{selectedPatient.vitals.bloodPressure}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pulse</span>
                        <span className="font-bold text-slate-800">{selectedPatient.vitals.pulseRate} bpm</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Temp</span>
                        <span className="font-bold text-slate-800">{selectedPatient.vitals.temperature}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">SpO2</span>
                        <span className="font-bold text-slate-800">{selectedPatient.vitals.spO2}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">BMI</span>
                      <span className="font-bold text-slate-800">{selectedPatient.vitals.bmi || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pain</span>
                      <span className="font-bold text-slate-800">{selectedPatient.vitals.painScore || 0}/10</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    No vitals recorded yet. Patient was transferred directly without triage screening.
                  </div>
                )}
              </div>

              {/* Consultation Body Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Chief Complaints */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      Chief Complaints *
                    </label>
                    <span className="text-xs text-slate-400">Primary reasons for seeking consultation</span>
                  </div>
                  <textarea
                    rows={2}
                    value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    placeholder="Enter patient's presenting complaints..."
                    className="w-full text-sm border-slate-300 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Quick Symptom Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-slate-400">Quick insert:</span>
                    {COMMON_SYMPTOMS.map((sym, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddSymptom(sym)}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-md text-slate-600 transition-colors"
                      >
                        + {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* History of Presenting Illness (HPI) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 block">
                    History of Presenting Illness (HPI)
                  </label>
                  <textarea
                    rows={3}
                    value={historyOfIllness}
                    onChange={e => setHistoryOfIllness(e.target.value)}
                    placeholder="Duration, character, onset, exacerbating/relieving factors, previous episodes, associated symptoms..."
                    className="w-full text-sm border-slate-300 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Physical Examination */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      Physical Examination Findings
                    </label>
                    <button
                      type="button"
                      onClick={handleApplyNormalExam}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Insert Normal Template
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={physicalExam}
                    onChange={e => setPhysicalExam(e.target.value)}
                    placeholder="Systemic examination (General, Chest, CVS, Abdomen, Neurological)..."
                    className="w-full text-sm border-slate-300 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 font-sans"
                  />
                </div>

                {/* ICD-10 Diagnosis Selector Component */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <ICD10Selector
                    diagnoses={diagnoses}
                    onChange={setDiagnoses}
                  />
                </div>

                {/* Integrated Orders Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* e-Prescription card */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-sm text-slate-800">e-Prescriptions</span>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          {prescriptions.length} items
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {prescriptions.length === 0
                          ? "No medications prescribed yet."
                          : prescriptions.map(p => p.drugName).join(", ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRxModalOpen(true)}
                      className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 flex items-center justify-center gap-1.5"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      Manage Prescriptions
                    </button>
                  </div>

                  {/* Investigation orders card */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-sm text-slate-800">Diagnostic Orders</span>
                        </div>
                        <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          {investigations.length} items
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {investigations.length === 0
                          ? "No lab or radiology orders yet."
                          : investigations.map(inv => inv.testName).join(", ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInvModalOpen(true)}
                      className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Manage Investigation Orders
                    </button>
                  </div>
                </div>

                {/* Disposition & Plan */}
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Patient Clinical Disposition
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "DISCHARGED", label: "Discharge Home", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
                      { id: "ADMIT_WARD", label: "Admit to Ward", color: "bg-red-50 text-red-800 border-red-300" },
                      { id: "REFER_SPECIALIST", label: "Refer Specialist", color: "bg-purple-50 text-purple-800 border-purple-300" },
                      { id: "FOLLOW_UP", label: "Follow-up Clinic", color: "bg-blue-50 text-blue-800 border-blue-300" }
                    ].map(d => {
                      const isSelected = disposition === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDisposition(d.id as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? `${d.color} ring-2 ring-blue-500 shadow-xs font-extrabold`
                              : "border-slate-200 text-slate-600 bg-white hover:bg-slate-100"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-semibold text-slate-600 block">
                      Discharge Instructions / Clinical Follow-up Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Return in 7 days with repeat malaria parasite microscopy, avoid strenuous activity..."
                      className="w-full text-xs border-slate-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Doctor: <strong>Dr. K. Bello, FWACS</strong> • Consulting Room 3
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCompleteConsultation}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? "Finalizing..." : "Complete Consultation"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-700 mb-1">Select a Patient to Consult</h3>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Choose a waiting patient from the queue on the left to review their triage vitals and open their electronic consultation file.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        prescriptions={prescriptions}
        onSave={setPrescriptions}
      />

      {/* Investigation Order Modal */}
      <InvestigationOrderModal
        isOpen={isInvModalOpen}
        onClose={() => setIsInvModalOpen(false)}
        investigations={investigations}
        onSave={setInvestigations}
      />
    </div>
  );
};
