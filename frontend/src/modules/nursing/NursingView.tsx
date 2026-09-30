import React, { useState, useEffect } from 'react';
import {
  InpatientAdmission,
  Ward,
  VitalSign,
  NursingTask,
  ShiftHandover,
  TriageAcuity,
  TaskStatus,
  Bed
} from './types';
import { nursingApi } from './api';
import { AdmissionIntakeModal } from './components/AdmissionIntakeModal';
import { VitalsEntryModal } from './components/VitalsEntryModal';
import { DischargeChecklistModal } from './components/DischargeChecklistModal';
import { NursingNotesDrawer } from './components/NursingNotesDrawer';
import { ShiftHandoverModal } from './components/ShiftHandoverModal';
import { WardBedMapView } from './components/WardBedMapView';

export const NursingView: React.FC = () => {
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [vitalsList, setVitalsList] = useState<VitalSign[]>([]);
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'patients' | 'bedmap' | 'vitals' | 'tasks'>('patients');
  const [acuityFilter, setAcuityFilter] = useState<TriageAcuity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | 'all'>('all');

  // Modals state
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  // Selected Patient for modals
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [admissionsData, wardsData, vitalsData, tasksData, handoversData] = await Promise.all([
        nursingApi.getAdmissions(),
        nursingApi.getWards(),
        nursingApi.getAllVitals(),
        nursingApi.getTasks(),
        nursingApi.getShiftHandovers()
      ]);
      setAdmissions(admissionsData);
      setWards(wardsData);
      setVitalsList(vitalsData);
      setTasks(tasksData);
      setHandovers(handoversData);
    } catch (err) {
      console.error('Failed to load nursing data', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for modal triggers
  const handleOpenVitals = (admission: InpatientAdmission) => {
    setSelectedAdmission(admission);
    setIsVitalsModalOpen(true);
  };

  const handleOpenDischarge = (admission: InpatientAdmission) => {
    setSelectedAdmission(admission);
    setIsDischargeModalOpen(true);
  };

  const handleOpenNotes = (admission: InpatientAdmission) => {
    setSelectedAdmission(admission);
    setIsNotesDrawerOpen(true);
  };

  const handleAdmitFromBed = (_wardId: string, _bedNumber: string) => {
    setIsAdmitModalOpen(true);
  };

  const handleSelectBed = (bed: Bed) => {
    if (bed.currentAdmissionId) {
      const adm = admissions.find(a => a.id === bed.currentAdmissionId);
      if (adm) {
        handleOpenNotes(adm);
      }
    }
  };

  // Task Actions
  const handleUpdateTask = async (taskId: string, status: TaskStatus) => {
    try {
      await nursingApi.updateTaskStatus(taskId, status, 'Nurse B. Taiwo, RN');
      const updatedTasks = await nursingApi.getTasks();
      setTasks(updatedTasks);
    } catch (err) {
      console.error(err);
      alert('Failed to update task');
    }
  };

  // Filtered Patients (FR-NS-02)
  const filteredPatients = admissions.filter((p) => {
    if (p.status === 'discharged') return false;

    const matchesAcuity = acuityFilter === 'all' || p.triageAcuity === acuityFilter;
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryDiagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bedNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesAcuity && matchesSearch;
  });

  // KPI Metrics
  const activeInpatients = admissions.filter(a => a.status !== 'discharged');
  const criticalCount = activeInpatients.filter(a => a.triageAcuity === 'critical').length;
  const highRiskCount = activeInpatients.filter(a => a.triageAcuity === 'high_risk').length;
  const stableCount = activeInpatients.filter(a => a.triageAcuity === 'stable').length;
  const totalAvailableBeds = wards.reduce((acc, w) => acc + w.availableBeds, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Nurse Station Profile */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                Build Group 1 • Clinical Operations
              </span>
              <span className="text-xs text-blue-300">FR-NS-01 to FR-NS-10</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Nursing Services & Inpatient Care</h1>
            <p className="text-xs text-blue-200 mt-1">
              Active Nurse Station: <strong className="text-white">Ward Sister B. Taiwo, RN</strong> • Male Medical & Surgical Units
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 backdrop-blur-sm"
            >
              <span>🔄</span> Shift Handover ({handovers.length})
            </button>

            <button
              onClick={() => setIsAdmitModalOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>+</span> Inpatient Intake (FR-NS-01)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Inpatients</span>
            <span className="text-blue-600 font-bold">Admitted</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{activeInpatients.length}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Across {wards.length} Wards</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold">Critical Acuity (NEWS2)</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <p className="text-2xl font-black text-rose-600">{criticalCount}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
            <span>🔴 Strict Q1H Vitals Required</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
            <span className="font-semibold">High Risk</span>
            <span className="text-amber-600 font-bold text-xs">Priority</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{highRiskCount}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
            <span>🟡 Close Monitoring</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span className="font-semibold">Available Beds</span>
            <span className="text-emerald-600 font-bold text-xs">Ready</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">{totalAvailableBeds}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span>🟢 Sanitized & Ready for Intake</span>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'patients'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>👥</span> My Inpatients ({activeInpatients.length})
          </button>

          <button
            onClick={() => setActiveTab('bedmap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'bedmap'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🛏️</span> Ward Bed Map (FR-NS-08)
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'vitals'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🩺</span> Vitals & Telemetry (FR-NS-04)
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>💊</span> MAR & Tasks (FR-NS-03)
          </button>
        </div>
      </div>

      {/* Tab 1: My Patients Table (FR-NS-02) */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            {/* Acuity Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Triage Acuity:</span>
              <button
                onClick={() => setAcuityFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  acuityFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({activeInpatients.length})
              </button>
              <button
                onClick={() => setAcuityFilter('critical')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  acuityFilter === 'critical'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span>🔴</span> Critical ({criticalCount})
              </button>
              <button
                onClick={() => setAcuityFilter('high_risk')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  acuityFilter === 'high_risk'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span>🟡</span> High Risk ({highRiskCount})
              </button>
              <button
                onClick={() => setAcuityFilter('stable')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  acuityFilter === 'stable'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span>🟢</span> Stable ({stableCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search patient, bed, hospital no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Patient & Demographics</th>
                    <th className="px-5 py-3">Ward & Bed</th>
                    <th className="px-5 py-3">Triage Acuity</th>
                    <th className="px-5 py-3">Admission Deposit Gate</th>
                    <th className="px-5 py-3">Primary Diagnosis</th>
                    <th className="px-5 py-3 text-right">Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">Loading inpatients...</td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">No patients matching filter.</td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Patient */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 text-sm">
                              {patient.patientName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono">{patient.hospitalNumber}</span>
                              <span>•</span>
                              <span>{patient.age}y / {patient.gender}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{patient.bloodGroup}</span>
                            </div>
                          </td>

                          {/* Ward & Bed */}
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              Bed {patient.bedNumber}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {patient.wardName}
                            </div>
                          </td>

                          {/* Acuity */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase tracking-wider ${
                                patient.triageAcuity === 'critical'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                  : patient.triageAcuity === 'high_risk'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <span>
                                {patient.triageAcuity === 'critical' ? '🔴' : patient.triageAcuity === 'high_risk' ? '🟡' : '🟢'}
                              </span>
                              {patient.triageAcuity.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Admission Deposit Gate (Resolved decision: soft warning flag, A&E exempt) */}
                          <td className="px-5 py-3.5">
                            {patient.depositStatus === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span>✓</span> Deposit Settled
                              </span>
                            ) : patient.depositStatus === 'exempt_ae' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>🚑</span> A&E Exempt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <span>⚠️</span> Deposit Pending (Soft Flag)
                              </span>
                            )}
                          </td>

                          {/* Diagnosis */}
                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="truncate text-slate-800 font-medium">{patient.primaryDiagnosis}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{patient.admittingDoctor}</p>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenVitals(patient)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-colors"
                              title="Record Vitals"
                            >
                              🩺 Vitals
                            </button>

                            <button
                              onClick={() => handleOpenNotes(patient)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                              title="Nursing Notes & Care Plan"
                            >
                              📝 Notes
                            </button>

                            <button
                              onClick={() => handleOpenDischarge(patient)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors"
                              title="Discharge Checklist & Billing Gate"
                            >
                              📋 Discharge
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ward Bed Map (FR-NS-08) */}
      {activeTab === 'bedmap' && (
        <WardBedMapView
          wards={wards}
          onSelectBed={handleSelectBed}
          onAdmitToBed={handleAdmitFromBed}
        />
      )}

      {/* Tab 3: Vitals & Telemetry Station (FR-NS-04) */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Bedside Vitals & NEWS2 Telemetry Stream</h2>
              <p className="text-xs text-slate-500">Real-time clinical observations with automated Early Warning Scores</p>
            </div>
            <button
              onClick={() => {
                const firstPatient = admissions[0];
                if (firstPatient) {
                  handleOpenVitals(firstPatient);
                }
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm"
            >
              + Record New Vitals
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vitalsList.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{v.patientName}</h3>
                    <p className="text-[11px] font-mono text-slate-500">{v.hospitalNumber}</p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      v.earlyWarningScore >= 7
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : v.earlyWarningScore >= 5
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    NEWS2 Score: {v.earlyWarningScore}
                  </span>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">BP (mmHg)</span>
                    <strong className="text-slate-800 font-mono text-sm">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pulse</span>
                    <strong className="text-slate-800 font-mono text-sm">{v.pulseRate} bpm</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <strong className={`font-mono text-sm ${v.oxygenSaturation < 94 ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                      {v.oxygenSaturation}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Resp Rate</span>
                    <strong className="text-slate-800 font-mono text-sm">{v.respiratoryRate}/min</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Temp</span>
                    <strong className="text-slate-800 font-mono text-sm">{v.temperature}°C</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">AVPU</span>
                    <strong className="text-slate-800 text-xs">{v.consciousnessLevel}</strong>
                  </div>
                </div>

                {v.clinicalNotes && (
                  <p className="text-xs text-slate-600 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                    "{v.clinicalNotes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>Method: <strong className="capitalize text-slate-600">{v.source === 'device_stub' ? 'Mindray Telemetry (BLE)' : 'Manual Nurse Entry'}</strong></span>
                  <span>{new Date(v.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: MAR & Nursing Tasks (FR-NS-03) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Filter Tasks:</span>
              {(['all', 'pending', 'in_progress', 'completed'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setTaskStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                    taskStatusFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              Linked to Electronic Medication Administration Record (e-MAR)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks
              .filter(t => taskStatusFilter === 'all' || t.status === taskStatusFilter)
              .map(task => (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-all ${
                    task.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : task.status === 'in_progress'
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      task.category === 'medication'
                        ? 'bg-purple-100 text-purple-800'
                        : task.category === 'vitals'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.category}
                    </span>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  </div>

                  {/* Patient & Bed Info */}
                  <div className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800">{task.patientName}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">Bed {task.bedNumber}</span>
                    <span>•</span>
                    <span className="text-slate-500">{task.wardName}</span>
                  </div>

                  {/* e-MAR Linked Details */}
                  {task.marLinked && task.medicationDetails && (
                    <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200 text-xs text-purple-950 space-y-0.5">
                      <div className="flex items-center justify-between font-bold">
                        <span>💊 {task.medicationDetails.drugName} {task.medicationDetails.dosage}</span>
                        <span className="font-mono">{task.medicationDetails.route}</span>
                      </div>
                      <p className="text-[11px] text-purple-800">
                        Frequency: {task.medicationDetails.frequency} • Prescribed by: {task.medicationDetails.prescribedBy}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Scheduled: {new Date(task.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {task.status !== 'completed' ? (
                        <>
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateTask(task.id, 'in_progress')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateTask(task.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            ✓ Complete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          ✓ Verified by {task.completedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AdmissionIntakeModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        wards={wards}
        onAdmitPatient={async (data) => {
          await nursingApi.createAdmission(data);
          loadAllData();
        }}
      />

      <VitalsEntryModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        admission={selectedAdmission}
        onSaveVitals={async (v) => {
          await nursingApi.recordVitals(v);
          loadAllData();
        }}
      />

      <DischargeChecklistModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        admissionId={selectedAdmission?.id || ''}
        onDischargeCompleted={() => {
          loadAllData();
        }}
      />

      <NursingNotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
        admission={selectedAdmission}
      />

      <ShiftHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        handovers={handovers}
        onHandoverUpdated={() => {
          loadAllData();
        }}
      />
    </div>
  );
};
