import React, { useState, useEffect } from 'react';
import {
  Baby,
  Heart,
  Calendar,
  Sparkles,
  Search,
  RefreshCw,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Activity,
  UserCheck
} from 'lucide-react';
import { AncProfile, DeliveryRecord, PncCheckup } from './types';
import { maternityApi } from './api';
import { AncBookingModal } from './components/AncBookingModal';
import { AncVisitModal } from './components/AncVisitModal';
import { LaborDeliveryModal } from './components/LaborDeliveryModal';
import { PostnatalCareModal } from './components/PostnatalCareModal';

export const MaternityView: React.FC = () => {
  const [ancProfiles, setAncProfiles] = useState<AncProfile[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [pncCheckups, setPncCheckups] = useState<PncCheckup[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'anc' | 'labor' | 'pnc' | 'registry'
  const [activeTab, setActiveTab] = useState<'anc' | 'labor' | 'pnc' | 'registry'>('anc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProfileForVisit, setSelectedProfileForVisit] = useState<AncProfile | null>(null);
  const [selectedProfileForDelivery, setSelectedProfileForDelivery] = useState<AncProfile | null>(null);
  const [showPncModal, setShowPncModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ancData, delData, pncData] = await Promise.all([
        maternityApi.getAncProfiles(),
        maternityApi.getDeliveryRecords(),
        maternityApi.getPncCheckups()
      ]);
      setAncProfiles(ancData);
      setDeliveries(delData);
      setPncCheckups(pncData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered ANC profiles
  const filteredProfiles = ancProfiles.filter(p => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);
    const matchesRisk = selectedRiskFilter === 'ALL' || p.riskLevel === selectedRiskFilter;
    return matchesSearch && matchesRisk;
  });

  // Metrics
  const activeAncCount = ancProfiles.filter(p => p.status === 'ANC_ACTIVE').length;
  const inLaborCount = ancProfiles.filter(p => p.status === 'IN_LABOR').length;
  const highRiskCount = ancProfiles.filter(p => p.riskLevel === 'HIGH_RISK').length;
  const deliveredCount = deliveries.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Department Overview */}
      <div className="bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 rounded-2xl p-6 text-white shadow-xl border border-pink-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-semibold border border-pink-500/30 flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-pink-400" />
                Maternity &amp; Obstetrics Department
              </span>
              <span className="text-xs text-slate-300">FR-MAT-01 to FR-MAT-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Maternal &amp; Child Health Center
            </h1>
            <p className="text-sm text-pink-100 max-w-2xl leading-relaxed">
              Comprehensive Antenatal Care (ANC), Labor &amp; Delivery Suite with interactive APGAR scoring,
              and Postnatal Care (PNC) surveillance for mother and newborn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-pink-950/40 ring-2 ring-pink-500/50"
            >
              <Plus className="w-4 h-4" />
              + Book New ANC Mother
            </button>
          </div>
        </div>

        {/* Clinical Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-semibold text-pink-200 uppercase tracking-wider flex items-center justify-between">
              <span>Active ANC Mothers</span>
              <Heart className="w-3.5 h-3.5 text-pink-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{activeAncCount}</div>
            <div className="text-[10px] text-pink-200/80 mt-0.5">Under routine antenatal care</div>
          </div>

          <div className="bg-purple-900/40 rounded-xl p-3 border border-purple-500/30">
            <div className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider flex items-center justify-between">
              <span>Labor Ward Suite</span>
              <Activity className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-purple-100 mt-1">{inLaborCount}</div>
            <div className="text-[10px] text-purple-200/80 mt-0.5">Active labor &amp; delivery monitoring</div>
          </div>

          <div className="bg-rose-950/60 rounded-xl p-3 border border-rose-500/30">
            <div className="text-[11px] font-semibold text-rose-200 uppercase tracking-wider flex items-center justify-between">
              <span>High-Risk Pregnancies</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-100 mt-1">{highRiskCount}</div>
            <div className="text-[10px] text-rose-200/80 mt-0.5">Consultant Obstetrician protocol</div>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/30">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider flex items-center justify-between">
              <span>Deliveries Logged</span>
              <Baby className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-emerald-100 mt-1">{deliveredCount}</div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">Live births in registry</div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('anc')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'anc'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Antenatal Clinic ({ancProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('labor')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'labor'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Labor &amp; Delivery Suite ({inLaborCount})
          </button>
          <button
            onClick={() => setActiveTab('pnc')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'pnc'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Postnatal Care ({pncCheckups.length})
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'registry'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            Birth &amp; Delivery Registry ({deliveries.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors self-end sm:self-auto"
          title="Refresh Maternity data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-600' : ''}`} />
        </button>
      </div>

      {/* Main Tab Content */}

      {/* --- Tab 1: Antenatal Clinic --- */}
      {activeTab === 'anc' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mother by name, MRN, or phone number..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW_RISK">Low Risk</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>
          </div>

          {/* ANC Mother Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((p) => {
              const isHighRisk = p.riskLevel === 'HIGH_RISK';
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isHighRisk
                      ? 'border-rose-300 ring-2 ring-rose-500/20 bg-gradient-to-b from-rose-50/20 to-white'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">{p.hospitalNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isHighRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isHighRisk ? 'High Risk' : 'Low Risk'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{p.patientName}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.age} yrs • {p.phone}
                      </div>
                    </div>

                    {/* Obstetric Score */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">GPLA Score</span>
                        <span className="font-bold text-slate-800">
                          G{p.gravida} P{p.para} L{p.living} A{p.abortions}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Gestational Age</span>
                        <span className="font-bold text-pink-700">{p.currentGestationalAgeWeeks} Weeks</span>
                      </div>
                    </div>

                    {/* EDD & Serology */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Expected Delivery</span>
                        <span className="font-semibold text-slate-700">{p.eddDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Blood &amp; Genotype</span>
                        <span className="font-semibold text-slate-700">{p.bloodGroup} • {p.genotype}</span>
                      </div>
                    </div>

                    {/* Risk Factors if any */}
                    {p.riskFactors.length > 0 && (
                      <div className="bg-rose-50 p-2 rounded text-[10px] text-rose-800 font-medium">
                        Alert: {p.riskFactors.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedProfileForVisit(p)}
                      className="text-xs font-semibold text-slate-600 hover:text-pink-600 transition-colors flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" /> + Record Visit
                    </button>
                    {p.status !== 'DELIVERED_PNC' && (
                      <button
                        onClick={() => setSelectedProfileForDelivery(p)}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Baby className="w-3.5 h-3.5" /> Transfer to Delivery
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Tab 2: Labor & Delivery Suite --- */}
      {activeTab === 'labor' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Labor &amp; Delivery Suite</h2>
              <p className="text-xs text-slate-500">FR-MAT-02 • Partograph monitoring, cervical dilation &amp; delivery documentation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ancProfiles.filter(p => p.status === 'IN_LABOR').map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-purple-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
                    <h3 className="font-bold text-base text-slate-900">{p.patientName}</h3>
                    <span className="text-xs text-slate-500">({p.hospitalNumber})</span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    Active Labor
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gestational Age</span>
                    <span className="font-bold text-slate-800">{p.currentGestationalAgeWeeks} wks</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Parity</span>
                    <span className="font-bold text-slate-800">Para {p.para}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Blood Group</span>
                    <span className="font-bold text-slate-800">{p.bloodGroup}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedProfileForDelivery(p)}
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Baby className="w-4 h-4" /> Document Delivery &amp; APGAR
                  </button>
                </div>
              </div>
            ))}
          </div>

          {ancProfiles.filter(p => p.status === 'IN_LABOR').length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800">No mothers currently in active labor</h3>
              <p className="text-xs text-slate-400 mt-1">To admit a mother to labor, select &quot;Transfer to Delivery&quot; from the Antenatal Clinic tab.</p>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 3: Postnatal Care Ward --- */}
      {activeTab === 'pnc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Postnatal Care (PNC) Ward</h2>
              <p className="text-xs text-slate-500">FR-MAT-03 • Maternal recovery, uterine involution &amp; neonatal monitoring</p>
            </div>
            <button
              onClick={() => setShowPncModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              + Record PNC Checkup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pncCheckups.map((check) => (
              <div key={check.id} className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    PNC Surveillance
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(check.checkupDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Maternal BP</span>
                    <span className="font-bold text-slate-800">{check.maternalVitals.bloodPressure}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Involution</span>
                    <span className="font-semibold text-slate-800 truncate block">Contracted</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lochia</span>
                    <span className="font-semibold text-slate-800 truncate block">{check.lochiaDescription}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Baby Status:</strong> Temp {check.neonatalStatus.temperature}°C • Cord: {check.neonatalStatus.umbilicalCordStatus}</div>
                  <div><strong>Clinician:</strong> {check.clinicianName}</div>
                </div>

                {check.clearanceForDischarge && (
                  <div className="bg-emerald-50 p-2 rounded text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mother and Baby Cleared for Discharge
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Tab 4: Delivery Registry --- */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Live Birth &amp; Delivery Logbook</h2>
            <p className="text-xs text-slate-500">FR-MAT-02 • Official maternity register with delivery mode &amp; APGAR scores</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Mother &amp; MRN</th>
                    <th className="px-4 py-3">Delivery Mode</th>
                    <th className="px-4 py-3">Newborn (Sex &amp; Wt)</th>
                    <th className="px-4 py-3">1-min APGAR</th>
                    <th className="px-4 py-3">5-min APGAR</th>
                    <th className="px-4 py-3">Blood Loss</th>
                    <th className="px-4 py-3">Delivered By</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((del) => {
                    const nb = del.newborns[0];
                    return (
                      <tr key={del.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {del.patientName}
                          <div className="text-[10px] font-normal text-slate-400">{del.hospitalNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                            {del.deliveryMode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {nb ? (
                            <span className="font-medium text-slate-800">
                              {nb.babySex === 'FEMALE' ? '👧 Female' : '👦 Male'} ({nb.birthWeightKg} kg)
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">
                          {nb?.apgarOneMinute.totalScore}/10
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">
                          {nb?.apgarFiveMinute.totalScore}/10
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {del.bloodLossMl} mL
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {del.leadMidwifeOrDoctor}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">
                          {new Date(del.deliveryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AncBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSubmit={async (profile) => {
          await maternityApi.createAncBooking(profile);
          await loadData();
        }}
      />

      {selectedProfileForVisit && (
        <AncVisitModal
          isOpen={!!selectedProfileForVisit}
          onClose={() => setSelectedProfileForVisit(null)}
          profile={selectedProfileForVisit}
          onSubmit={async (ancProfileId, visit) => {
            await maternityApi.recordAncVisit(ancProfileId, visit);
            await loadData();
          }}
        />
      )}

      {selectedProfileForDelivery && (
        <LaborDeliveryModal
          isOpen={!!selectedProfileForDelivery}
          onClose={() => setSelectedProfileForDelivery(null)}
          profile={selectedProfileForDelivery}
          onSubmit={async (record) => {
            await maternityApi.recordDelivery(record);
            await loadData();
          }}
        />
      )}

      <PostnatalCareModal
        isOpen={showPncModal}
        onClose={() => setShowPncModal(false)}
        onSubmit={async (checkup) => {
          await maternityApi.recordPncCheckup(checkup);
          await loadData();
        }}
      />
    </div>
  );
};
