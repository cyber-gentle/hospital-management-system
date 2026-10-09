import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Thermometer,
  Layers,
  HeartHandshake,
  UserX,
  Archive,
  ArrowLeft
} from 'lucide-react';
import { DeceasedRecord, ColdStorageUnit, AutopsyLog, BodyReleaseRecord } from './types';
import { mortuaryApi } from './api';
import { DeceasedIntakeModal } from './components/DeceasedIntakeModal';
import { ColdStorageModal } from './components/ColdStorageModal';
import { AutopsyLogModal } from './components/AutopsyLogModal';
import { BodyReleaseModal } from './components/BodyReleaseModal';

interface MortuaryViewProps {
  onBackToDashboard?: () => void;
}

export const MortuaryView: React.FC<MortuaryViewProps> = ({ onBackToDashboard }) => {
  const [deceasedList, setDeceasedList] = useState<DeceasedRecord[]>([]);
  const [units, setUnits] = useState<ColdStorageUnit[]>([]);
  const [autopsies, setAutopsies] = useState<AutopsyLog[]>([]);
  const [releases, setReleases] = useState<BodyReleaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tabs: 'active' | 'chambers' | 'autopsies' | 'releases'
  const [activeTab, setActiveTab] = useState<'active' | 'chambers' | 'autopsies' | 'releases'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedForAutopsy, setSelectedForAutopsy] = useState<DeceasedRecord | null>(null);
  const [selectedForRelease, setSelectedForRelease] = useState<DeceasedRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [dData, uData, aData, rData] = await Promise.all([
        mortuaryApi.getDeceasedRecords(),
        mortuaryApi.getColdStorageUnits(),
        mortuaryApi.getAutopsyLogs(),
        mortuaryApi.getBodyReleases()
      ]);
      setDeceasedList(dData);
      setUnits(uData);
      setAutopsies(aData);
      setReleases(rData);
    } catch (error) {
      setDeceasedList([]); setUnits([]); setAutopsies([]); setReleases([]); setSelectedForAutopsy(null); setSelectedForRelease(null);
      setLoadError(error instanceof Error ? error.message : "Data could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered deceased in storage
  const inStorageDeceased = deceasedList.filter(d => d.status !== 'RELEASED_TO_FAMILY');
  const filteredDeceased = inStorageDeceased.filter(d => {
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deceasedTagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.causeOfDeath.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const activeInStorage = inStorageDeceased.length;
  const coronerCases = inStorageDeceased.filter(d => d.isCoronerCase).length;
  const totalChambers = units.reduce((acc, u) => acc + u.totalChambers, 0);
  const occupiedChambers = units.reduce((acc, u) => acc + u.chambers.filter(c => c.status === 'OCCUPIED').length, 0);
  const releasedTotal = releases.length;

  const getStatusBadge = (status: DeceasedRecord['status']) => {
    switch (status) {
      case 'ADMITTED_IN_STORAGE':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300">In Storage</span>;
      case 'AUTOPSY_PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">Autopsy Pending</span>;
      case 'AUTOPSY_COMPLETED':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-300">Autopsy Complete</span>;
      case 'CLEARED_FOR_RELEASE':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">Cleared for Release</span>;
      case 'RELEASED_TO_FAMILY':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">Released</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{loadError}</p>}
      {/* Top Banner & Department Overview */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Directory
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-slate-400" />
                Mortuary &amp; Pathology Services
              </span>
              <span className="text-xs text-slate-400">FR-MOR-01 to FR-MOR-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mortuary &amp; Cold Storage Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Deceased intake registration, coroner/police case tracking, cold storage chamber allocation,
              post-mortem autopsy logs, and statutory body release clearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStorageModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              Chambers &amp; Vaults
            </button>
            <button
              onClick={() => setShowIntakeModal(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-black/40 ring-1 ring-white/20"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              + Admit Deceased Body
            </button>
          </div>
        </div>

        {/* Clinical & Operational Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Currently in Storage</span>
              <UserX className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{activeInStorage}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Bodies admitted in vaults</div>
          </div>

          <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-500/30">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span>Coroner / Inquest Cases</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-100 mt-1">{coronerCases}</div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Police &amp; forensic holds</div>
          </div>

          <div className="bg-cyan-950/40 rounded-xl p-3 border border-cyan-500/30">
            <div className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
              <span>Vault Occupancy</span>
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-100 mt-1">
              {occupiedChambers} / {totalChambers}
            </div>
            <div className="text-[10px] text-cyan-300/80 mt-0.5">
              {totalChambers > 0 ? Math.round((occupiedChambers / totalChambers) * 100) : 0}% capacity
            </div>
          </div>

          <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-500/30">
            <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center justify-between">
              <span>Released to Families</span>
              <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-100 mt-1">{releasedTotal}</div>
            <div className="text-[10px] text-purple-300/80 mt-0.5">Burial permits verified</div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            Active Storage Registry ({inStorageDeceased.length})
          </button>
          <button
            onClick={() => setActiveTab('chambers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'chambers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Chamber Vaults Layout ({units.length} Blocks)
          </button>
          <button
            onClick={() => setActiveTab('autopsies')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'autopsies'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Autopsy &amp; Inquest Logs ({autopsies.length})
          </button>
          <button
            onClick={() => setActiveTab('releases')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'releases'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Body Release Archive ({releases.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors self-end sm:self-auto"
          title="Refresh Mortuary data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-900' : ''}`} />
        </button>
      </div>

      {/* Main Tab Content */}

      {/* --- Tab 1: Active Storage Registry --- */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deceased by name, tag number, MRN, or cause of death..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-500 focus:outline-none"
            >
              <option value="ALL">All Storage Statuses</option>
              <option value="ADMITTED_IN_STORAGE">In Storage</option>
              <option value="AUTOPSY_PENDING">Autopsy Pending</option>
              <option value="AUTOPSY_COMPLETED">Autopsy Completed</option>
              <option value="CLEARED_FOR_RELEASE">Cleared for Release</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeceased.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {d.deceasedTagNumber}
                    </span>
                    {getStatusBadge(d.status)}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{d.fullName}</span>
                      {d.isUnidentified && (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          DOE ALIAS
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {d.age} yrs • {d.gender} • {d.hospitalNumber}
                    </div>
                  </div>

                  {/* Chamber Location & Origin */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Vault Location:</span>
                      <span className="font-bold text-cyan-900">{d.assignedChamberUnit || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">Origin Dept:</span>
                      <span className="font-semibold text-slate-700">{d.originDepartment.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Cause of Death */}
                  <p className="text-xs text-slate-600 line-clamp-2">
                    <strong>Cause of Death:</strong> {d.causeOfDeath}
                  </p>

                  {/* Coroner Alert if applicable */}
                  {d.isCoronerCase && (
                    <div className="bg-amber-50 p-2 rounded text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Coroner Case • Police Ref: {d.policeRefNumber || 'Required'}</span>
                    </div>
                  )}

                  {/* Accrued Storage Tariff */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                    <span>Storage: {d.daysInStorage === null ? 'Not configured' : `${d.daysInStorage} days`}</span>
                    <span className="font-bold text-slate-800">Fee: ₦{d.totalAccruedStorageFee?.toLocaleString() ?? 'Not configured'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedForAutopsy(d)}
                    className="text-xs font-semibold text-slate-600 hover:text-cyan-600 transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Post-Mortem
                  </button>
                  <button
                    onClick={() => setSelectedForRelease(d)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" /> Release Body
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDeceased.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800">No bodies found matching criteria</h3>
              <p className="text-xs text-slate-400 mt-1">All mortuary cold vaults are updated.</p>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Chamber Vaults Layout --- */}
      {activeTab === 'chambers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Cold Storage Chamber Blocks</h2>
              <p className="text-xs text-slate-500">FR-MOR-02 • Multi-tier vault compartments with real-time temperature telemetry</p>
            </div>
            <button
              onClick={() => setShowStorageModal(true)}
              className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Open Interactive Vault Manager →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {units.map((unit) => (
              <div key={unit.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{unit.unitName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 mt-0.5">
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>{unit.currentTemperatureCelsius}°C (Target {unit.targetTemperatureCelsius}°C)</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {unit.chambers.filter(c => c.status === 'AVAILABLE').length} Free
                  </span>
                </div>

                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {unit.chambers.map((chamber) => {
                    const isOccupied = chamber.status === 'OCCUPIED';
                    const isDecontam = chamber.status === 'DECONTAMINATION';
                    return (
                      <div
                        key={chamber.chamberId}
                        className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                          isOccupied
                            ? 'bg-slate-50 border-slate-300'
                            : isDecontam
                            ? 'bg-amber-50 border-amber-200 border-dashed'
                            : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800">{chamber.chamberNumber}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isOccupied ? 'bg-slate-200 text-slate-800' : isDecontam ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {chamber.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">{chamber.tier}</span>

                          {isOccupied && (
                            <div className="text-[11px] font-semibold text-slate-900 mt-1 truncate">
                              {chamber.currentDeceasedName}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Tab 3: Autopsy & Inquest Logs --- */}
      {activeTab === 'autopsies' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Post-Mortem &amp; Autopsy Examination Protocols</h2>
            <p className="text-xs text-slate-500">FR-MOR-03 • Certified pathology findings, coroner verdicts &amp; toxicology records</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Deceased &amp; Tag</th>
                    <th className="px-4 py-3">Pathologist</th>
                    <th className="px-4 py-3">Definitive Cause of Death</th>
                    <th className="px-4 py-3">Coroner Verdict</th>
                    <th className="px-4 py-3">Toxicology Retained</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {autopsies.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {a.deceasedName}
                        <div className="text-[10px] font-mono text-slate-400">{a.deceasedTagNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{a.pathologistName}</span>
                        <div className="text-[10px] text-slate-400">{a.pathologistLicense}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs leading-relaxed">
                        {a.definitiveCauseOfDeath}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {a.coronerVerdict}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {a.toxicologySamplesRetained.join(', ') || 'None'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">
                        {new Date(a.autopsyDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 4: Body Release Archive --- */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Statutory Body Release &amp; Handover Archive</h2>
            <p className="text-xs text-slate-500">FR-MOR-03 • Completed releases with verified burial permits, undertaker details &amp; cashier receipts</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Deceased &amp; Tag</th>
                    <th className="px-4 py-3">Released To (Next of Kin)</th>
                    <th className="px-4 py-3">Funeral Undertaker</th>
                    <th className="px-4 py-3">Burial Permit No.</th>
                    <th className="px-4 py-3">Billing Receipt</th>
                    <th className="px-4 py-3">Releasing Officer</th>
                    <th className="px-4 py-3">Release Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {releases.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.deceasedName}
                        <div className="text-[10px] font-mono text-slate-400">{r.deceasedTagNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{r.releasedToName}</span>
                        <div className="text-[10px] text-slate-400">{r.releasedToRelationship} • {r.releasedToNIN}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {r.funeralHomeOrUndertaker}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {r.burialPermitNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                        {r.billingReceiptNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.mortuaryOfficer}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">
                        {new Date(r.releaseDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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
      <DeceasedIntakeModal
        isOpen={showIntakeModal}
        onClose={() => setShowIntakeModal(false)}
        units={units}
        onSubmit={async (record) => {
          await mortuaryApi.createDeceasedAdmission(record);
          await loadData();
        }}
      />

      <ColdStorageModal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        units={units}
        deceasedList={deceasedList}
        onAssignChamber={async (deceasedId, unitId, chamberNumber) => {
          await mortuaryApi.assignChamber(deceasedId, unitId, chamberNumber);
          await loadData();
        }}
        onReleaseChamber={async (deceasedId) => {
          await mortuaryApi.releaseChamber(deceasedId);
          await loadData();
        }}
      />

      {selectedForAutopsy && (
        <AutopsyLogModal
          isOpen={!!selectedForAutopsy}
          onClose={() => setSelectedForAutopsy(null)}
          deceased={selectedForAutopsy}
          onSubmit={async (log) => {
            await mortuaryApi.recordAutopsy(log);
            await loadData();
          }}
        />
      )}

      {selectedForRelease && (
        <BodyReleaseModal
          isOpen={!!selectedForRelease}
          onClose={() => setSelectedForRelease(null)}
          deceased={selectedForRelease}
          onSubmit={async (release) => {
            await mortuaryApi.releaseBodyToFamily(release);
            await loadData();
          }}
        />
      )}
    </div>
  );
};
