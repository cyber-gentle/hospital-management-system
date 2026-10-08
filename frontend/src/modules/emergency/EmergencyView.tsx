import React, { useState, useEffect } from 'react';
import {
  Siren,
  Bed,
  ClipboardList,
  Search,
  Activity,
  HeartPulse,
  AlertTriangle,
  Ambulance,
  RefreshCw,
  CheckCircle2,
  Syringe,
  Filter
} from 'lucide-react';
import { EmergencyPatient, EmergencyBay, TriageCategory, StabilizationNote } from './types';
import { emergencyApi } from './api';
import { RapidTriageModal } from './components/RapidTriageModal';
import { EmergencyBedBoardModal } from './components/EmergencyBedBoardModal';
import { StabilizationNotesModal } from './components/StabilizationNotesModal';

export const EmergencyView: React.FC = () => {
  const [patients, setPatients] = useState<EmergencyPatient[]>([]);
  const [bays, setBays] = useState<EmergencyBay[]>([]);
  const [notes, setNotes] = useState<StabilizationNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'queue' | 'bays' | 'resus' | 'dispositions'
  const [activeTab, setActiveTab] = useState<'queue' | 'bays' | 'resus' | 'dispositions'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showBedBoardModal, setShowBedBoardModal] = useState(false);
  const [selectedPatientForNotes, setSelectedPatientForNotes] = useState<EmergencyPatient | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pts, bData, nData] = await Promise.all([
        emergencyApi.getEmergencyPatients(),
        emergencyApi.getEmergencyBays(),
        emergencyApi.getStabilizationNotes()
      ]);
      setPatients(pts);
      setBays(bData);
      setNotes(nData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered patients
  const activePatients = patients.filter(p => !['DISCHARGED', 'DECEASED'].includes(p.status));
  const filteredPatients = activePatients.filter(p => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.triageCategory === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Triage count metrics
  const redCount = activePatients.filter(p => p.triageCategory === 'RED').length;
  const orangeCount = activePatients.filter(p => p.triageCategory === 'ORANGE').length;
  const yellowCount = activePatients.filter(p => p.triageCategory === 'YELLOW').length;
  const greenCount = activePatients.filter(p => p.triageCategory === 'GREEN').length;

  const totalBeds = bays.reduce((sum, b) => sum + b.totalBeds, 0);
  const occupiedBeds = bays.reduce((sum, b) => sum + b.beds.filter(bed => bed.status === 'OCCUPIED').length, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const getTriagePill = (cat: TriageCategory) => {
    switch (cat) {
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            Cat 1: RED (Resus)
          </span>
        );
      case 'ORANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Cat 2: ORANGE (Emergent)
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Cat 3: YELLOW (Urgent)
          </span>
        );
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Cat 4: GREEN (Standard)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {cat}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-red-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 animate-pulse text-red-400" />
                Accident & Emergency Dept
              </span>
              <span className="text-xs text-slate-400">FR-AE-01 to FR-AE-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              A&E Triage & Emergency Resuscitation Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Acute trauma intake, rapid Manchester/ESI triage, bay management, and ABCDE stabilization protocol.
              Zero-deposit life-saving policy actively enforced.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBedBoardModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <Bed className="w-4 h-4 text-blue-400" />
              Bay & Bed Allocation
            </button>
            <button
              onClick={() => setShowTriageModal(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-900/40 ring-2 ring-red-500/50"
            >
              <Siren className="w-4 h-4" />
              + Rapid Triage Intake
            </button>
          </div>
        </div>

        {/* Triage Acuity Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-red-900/30 border border-red-800/40 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-red-300 uppercase tracking-wider flex items-center justify-between">
              <span>Category 1 (Red)</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-2xl font-black text-red-100 mt-1">{redCount}</div>
            <div className="text-[10px] text-red-300/80 mt-0.5">Immediate Resuscitation</div>
          </div>

          <div className="bg-amber-900/30 border border-amber-800/40 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span>Category 2 (Orange)</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-100 mt-1">{orangeCount}</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Very Urgent (&lt;15 min)</div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-yellow-300 uppercase tracking-wider flex items-center justify-between">
              <span>Category 3 (Yellow)</span>
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
            </div>
            <div className="text-2xl font-black text-yellow-100 mt-1">{yellowCount}</div>
            <div className="text-[10px] text-yellow-300/80 mt-0.5">Urgent (&lt;60 min)</div>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
              <span>Category 4 (Green)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-100 mt-1">{greenCount}</div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Standard Minors</div>
          </div>

          <div className="bg-blue-950/40 border border-blue-900/40 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider flex items-center justify-between">
              <span>ED Bed Occupancy</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-100 mt-1">{occupancyRate}%</div>
            <div className="text-[10px] text-blue-300/80 mt-0.5">{occupiedBeds} / {totalBeds} Beds Occupied</div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'queue'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            Active ED Queue ({activePatients.length})
          </button>
          <button
            onClick={() => setActiveTab('bays')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'bays'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            Live Bay & Bed Board ({bays.length} Bays)
          </button>
          <button
            onClick={() => setActiveTab('resus')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'resus'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Resuscitation & ABCDE Deck
          </button>
          <button
            onClick={() => setActiveTab('dispositions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'dispositions'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Ambulance className="w-3.5 h-3.5" />
            Transfers & Dispositions ({notes.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors self-end sm:self-auto"
          title="Refresh A&E data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient by name, hospital MRN, or injury complaint..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="ALL">All Acuity Levels</option>
                <option value="RED">🔴 Category 1: RED</option>
                <option value="ORANGE">🟠 Category 2: ORANGE</option>
                <option value="YELLOW">🟡 Category 3: YELLOW</option>
                <option value="GREEN">🟢 Category 4: GREEN</option>
              </select>
            </div>
          </div>

          {/* Patient Cards / Queue Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => {
              const isRed = patient.triageCategory === 'RED';
              return (
                <div
                  key={patient.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isRed ? 'border-red-400 ring-2 ring-red-500/20 bg-gradient-to-b from-red-50/20 to-white' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2">
                      {getTriagePill(patient.triageCategory)}
                      <span className="text-[10px] font-mono text-slate-400">
                        {patient.hospitalNumber}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">
                          {patient.patientName}
                        </h3>
                        {patient.isUnidentifiedJohnDoe && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            DOE ALIAS
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {patient.age} yrs • {patient.gender} • Arrived via {patient.arrivalMode}
                      </div>
                    </div>

                    {/* Bed & Bay badge */}
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Bed className="w-3.5 h-3.5 text-blue-600" />
                        <span>{patient.assignedBedNumber || 'Unassigned Bay'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Deposit Exempt
                      </span>
                    </div>

                    {/* Complaint */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white/50 p-1 rounded">
                      <strong>Complaint:</strong> {patient.chiefComplaint}
                    </p>

                    {/* Vitals Summary Pillbox */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] pt-1 border-t border-slate-100">
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">HR</span>
                        <span className={`font-bold ${patient.vitals.heartRate > 120 ? 'text-red-600' : 'text-slate-800'}`}>
                          {patient.vitals.heartRate}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">BP</span>
                        <span className={`font-bold ${patient.vitals.systolicBp < 90 ? 'text-red-600' : 'text-slate-800'}`}>
                          {patient.vitals.systolicBp}/{patient.vitals.diastolicBp}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">SpO2</span>
                        <span className={`font-bold ${patient.vitals.spo2 < 92 ? 'text-red-600' : 'text-slate-800'}`}>
                          {patient.vitals.spo2}%
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">GCS</span>
                        <span className={`font-bold ${patient.vitals.gcs < 9 ? 'text-red-600' : 'text-slate-800'}`}>
                          {patient.vitals.gcs}/15
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowBedBoardModal(true)}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
                    >
                      <Bed className="w-3.5 h-3.5" /> Reallocate
                    </button>
                    <button
                      onClick={() => setSelectedPatientForNotes(patient)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" /> ABCDE Survey & Disposition
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPatients.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800">No active patients matching criteria</h3>
              <p className="text-xs text-slate-400 mt-1">All acute emergency queue items are triaged and managed.</p>
            </div>
          )}
        </div>
      )}

      {/* Live Bay & Bed Board View */}
      {activeTab === 'bays' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Real-Time Bay & Bed Allocation</h2>
              <p className="text-xs text-slate-500">FR-AE-02 • 5 specialized emergency bays with live occupancy statuses</p>
            </div>
            <button
              onClick={() => setShowBedBoardModal(true)}
              className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Open Interactive Bed Manager →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bays.map((bay) => (
              <div key={bay.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="bg-slate-900 text-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm tracking-tight">{bay.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {bay.bayType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{bay.floorZone}</p>
                </div>

                <div className="p-4 space-y-2.5 flex-1">
                  {bay.beds.map((bed) => {
                    const isOccupied = bed.status === 'OCCUPIED';
                    const isCleaning = bed.status === 'CLEANING';
                    return (
                      <div
                        key={bed.bedId}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          isOccupied
                            ? 'bg-blue-50/60 border-blue-200'
                            : isCleaning
                            ? 'bg-amber-50/60 border-amber-200 border-dashed'
                            : 'bg-emerald-50/40 border-emerald-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Bed className={`w-3.5 h-3.5 ${isOccupied ? 'text-blue-600' : isCleaning ? 'text-amber-500' : 'text-emerald-600'}`} />
                            {bed.bedNumber}
                          </div>
                          {isOccupied && (
                            <div className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate max-w-[180px]">
                              {bed.currentPatientName}
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOccupied
                              ? 'bg-blue-100 text-blue-800'
                              : isCleaning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {bed.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resuscitation & ABCDE Deck View */}
      {activeTab === 'resus' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Resuscitation Bay Monitoring</h2>
            <p className="text-xs text-slate-500">FR-AE-03 • Critical patients undergoing ABCDE stabilization and crash medication protocols</p>
          </div>

          <div className="space-y-4">
            {activePatients.filter(p => p.status === 'IN_RESUS' || p.triageCategory === 'RED' || p.primarySurvey).map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-red-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <h3 className="font-bold text-base text-slate-900">{p.patientName}</h3>
                      <span className="text-xs font-mono text-slate-500">({p.hospitalNumber})</span>
                      {getTriagePill(p.triageCategory)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Located in <span className="font-bold text-slate-800">{p.assignedBedNumber}</span> • Attending: {p.attendingDoctor || 'Consultant'}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedPatientForNotes(p)}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <ClipboardList className="w-4 h-4" /> Update ABCDE & Meds
                  </button>
                </div>

                {/* Primary Survey Details if available */}
                {p.primarySurvey ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="border-r border-slate-200 pr-2">
                      <span className="font-bold text-red-700 block uppercase text-[10px]">A - Airway</span>
                      <span className="font-semibold text-slate-800">{p.primarySurvey.airway}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.primarySurvey.airwayIntervention || 'C-Spine cleared'}</p>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                      <span className="font-bold text-blue-700 block uppercase text-[10px]">B - Breathing</span>
                      <span className="font-semibold text-slate-800">{p.primarySurvey.breathing}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.primarySurvey.oxygenDelivery}</p>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                      <span className="font-bold text-rose-700 block uppercase text-[10px]">C - Circulation</span>
                      <span className="font-semibold text-slate-800">{p.primarySurvey.circulation}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Cap refill: {p.primarySurvey.capillaryRefillSeconds}s</p>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                      <span className="font-bold text-purple-700 block uppercase text-[10px]">D - Disability</span>
                      <span className="font-semibold text-slate-800">Pupils: {p.primarySurvey.disabilityPupils}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">GCS {p.vitals.gcs}/15</p>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700 block uppercase text-[10px]">E - Exposure</span>
                      <p className="text-[11px] text-slate-700 line-clamp-2">{p.primarySurvey.exposureFindings}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Primary survey pending. Click &quot;Update ABCDE &amp; Meds&quot; to log primary resuscitation assessment.</span>
                  </div>
                )}

                {/* Crash Cart Meds Administered */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-amber-600" /> Resuscitation Medications Logged ({p.medicationsAdministered.length})
                  </h4>
                  {p.medicationsAdministered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {p.medicationsAdministered.map((m) => (
                        <div key={m.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                          <span className="font-bold text-slate-900">{m.drugName}</span>
                          <span className="text-slate-500 ml-1.5">({m.dose})</span>
                          <div className="text-[10px] text-slate-400 mt-0.5">via {m.route} • {m.indication}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No crash meds administered yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispositions & Transfer Log View */}
      {activeTab === 'dispositions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">A&E Disposition & Transfer Handover Log</h2>
            <p className="text-xs text-slate-500">FR-AE-03 • Completed stabilization records and patient disposition routing</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Patient & MRN</th>
                    <th className="px-4 py-3">Clinician</th>
                    <th className="px-4 py-3">Disposition Type</th>
                    <th className="px-4 py-3">Destination Unit</th>
                    <th className="px-4 py-3">Clinical Handover Summary</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notes.map((note) => (
                    <tr key={note.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {note.patientName}
                        <div className="text-[11px] font-normal text-slate-500">{note.hospitalNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{note.clinicianName}</span>
                        <div className="text-[10px] text-slate-400">{note.clinicianRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                          {note.disposition}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {note.dispositionDestination}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {note.clinicalHandoverSummary}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(note.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RapidTriageModal
        isOpen={showTriageModal}
        onClose={() => setShowTriageModal(false)}
        bays={bays}
        onSubmit={async (payload) => {
          await emergencyApi.createEmergencyTriage(payload);
          await loadData();
        }}
      />

      <EmergencyBedBoardModal
        isOpen={showBedBoardModal}
        onClose={() => setShowBedBoardModal(false)}
        bays={bays}
        patients={patients}
        onAssignBed={async (patientId, bayId, bedNumber) => {
          await emergencyApi.assignPatientBed(patientId, bayId, bedNumber);
          await loadData();
        }}
        onReleaseBed={async (patientId) => {
          await emergencyApi.releasePatientBed(patientId);
          await loadData();
        }}
      />

      {selectedPatientForNotes && (
        <StabilizationNotesModal
          isOpen={!!selectedPatientForNotes}
          onClose={() => setSelectedPatientForNotes(null)}
          patient={selectedPatientForNotes}
          onSubmit={async (payload) => {
            await emergencyApi.addStabilizationNote(payload);
            await loadData();
          }}
          onAddCrashMed={async (patientId, med) => {
            const updated = await emergencyApi.recordCrashMedication(patientId, med);
            setSelectedPatientForNotes(updated);
            await loadData();
          }}
        />
      )}
    </div>
  );
};
