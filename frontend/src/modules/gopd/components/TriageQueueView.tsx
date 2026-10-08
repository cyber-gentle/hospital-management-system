import React, { useState, useEffect } from "react";
import { Activity, AlertCircle, CheckCircle2, User, Search, RefreshCw, Filter } from "lucide-react";
import { gopdApi } from "../api";
import { GopdPatient, Vitals } from "../types";
import { TriageVitalsModal } from "./TriageVitalsModal";

export const TriageQueueView: React.FC = () => {
  const [queue, setQueue] = useState<GopdPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<GopdPatient | null>(null);
  const [activeTab, setActiveTab] = useState<"WAITING_TRIAGE" | "ALL">("WAITING_TRIAGE");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveVitals = async (
    patientId: string,
    vitals: Vitals,
    priority: "EMERGENCY" | "URGENT" | "STANDARD" | "NON_URGENT"
  ) => {
    await gopdApi.recordTriageVitals(patientId, vitals, priority);
    showToast("Vitals recorded successfully. Patient transferred to Doctor's Queue.");
    await loadQueue();
  };

  // Filtered list
  const filteredPatients = queue.filter(patient => {
    if (activeTab === "WAITING_TRIAGE" && patient.status !== "WAITING_TRIAGE") return false;
    if (filterPriority !== "ALL" && patient.triagePriority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = patient.patientName.toLowerCase().includes(q);
      const matchHosp = patient.hospitalNumber.toLowerCase().includes(q);
      const matchToken = patient.queueNumber.toLowerCase().includes(q);
      if (!matchName && !matchHosp && !matchToken) return false;
    }
    return true;
  });

  const triageCount = queue.filter(p => p.status === "WAITING_TRIAGE").length;
  const doctorWaitingCount = queue.filter(p => p.status === "WAITING_DOCTOR").length;

  return (
    <div className="space-y-4">
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">GOPD Triage Station</h2>
          <p className="text-xs text-slate-500">
            Walk-in outpatient screening • {doctorWaitingCount} patients waiting for doctor consultation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadQueue}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("WAITING_TRIAGE")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "WAITING_TRIAGE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Waiting for Triage
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "WAITING_TRIAGE" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {triageCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "ALL"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Queue Patients
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "ALL" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {queue.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="text-xs border-slate-200 rounded-lg py-1.5 pl-2 pr-6 text-slate-700 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="EMERGENCY">Emergency (Red)</option>
              <option value="URGENT">Urgent (Yellow)</option>
              <option value="STANDARD">Standard (Green)</option>
              <option value="NON_URGENT">Non-Urgent</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search token, name, or hospital no..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Token</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Vitals Status</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Queue State</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const isEmergency = patient.triagePriority === "EMERGENCY";
                const isUrgent = patient.triagePriority === "URGENT";

                return (
                  <tr
                    key={patient.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isEmergency ? "bg-red-50/30" : isUrgent ? "bg-amber-50/20" : ""
                    }`}
                  >
                    {/* Token */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                        {patient.queueNumber}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {patient.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{patient.patientName}</div>
                          <div className="text-xs text-slate-500">
                            {patient.hospitalNumber} • {patient.age}y {patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isEmergency
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : isUrgent
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isEmergency && <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                        {patient.triagePriority}
                      </span>
                    </td>

                    {/* Vitals Summary */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs">
                      {patient.vitals ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            BP: {patient.vitals.bloodPressure} • Temp: {patient.vitals.temperature}°C
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Pulse: {patient.vitals.pulseRate} bpm • SpO2: {patient.vitals.spO2}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not recorded yet</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          patient.status === "WAITING_TRIAGE"
                            ? "bg-orange-100 text-orange-800"
                            : patient.status === "WAITING_DOCTOR"
                            ? "bg-blue-100 text-blue-800"
                            : patient.status === "IN_CONSULTATION"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {patient.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {patient.status === "WAITING_TRIAGE" ? (
                        <button
                          onClick={() => setSelectedPatientForVitals(patient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Record Vitals
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedPatientForVitals(patient)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Edit Vitals
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No patients found</p>
                    <p className="text-xs text-slate-400">There are no patients matching your current filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage Vitals Modal */}
      <TriageVitalsModal
        isOpen={!!selectedPatientForVitals}
        patient={selectedPatientForVitals}
        onClose={() => setSelectedPatientForVitals(null)}
        onSave={handleSaveVitals}
      />
    </div>
  );
};
