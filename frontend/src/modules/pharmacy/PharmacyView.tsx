import React, { useState, useEffect } from 'react';
import { Prescription, Drug, PrescriptionStatus, PatientType, PharmacyStockSummary } from './types';
import { pharmacyApi } from './api';
import { DispenseModal } from './components/DispenseModal';
import { FormularyStockView } from './components/FormularyStockView';

export const PharmacyView: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [summary, setSummary] = useState<PharmacyStockSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'queue' | 'formulary'>('queue');
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | 'all'>('all');
  const [patientTypeFilter, setPatientTypeFilter] = useState<PatientType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxList, drugList, summaryData] = await Promise.all([
        pharmacyApi.getPrescriptions(),
        pharmacyApi.getDrugFormulary(),
        pharmacyApi.getSummary()
      ]);
      setPrescriptions(rxList);
      setDrugs(drugList);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispense = (rx: Prescription) => {
    setSelectedPrescription(rx);
    setIsDispenseModalOpen(true);
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (statusFilter !== 'all' && rx.status !== statusFilter) return false;
    if (patientTypeFilter !== 'all' && rx.patientType !== patientTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        rx.prescriptionNumber.toLowerCase().includes(q) ||
        rx.patientName.toLowerCase().includes(q) ||
        rx.hospitalNumber.toLowerCase().includes(q) ||
        (rx.wardName && rx.wardName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30">
                Build Group 1 • Clinical Dispensing
              </span>
              <span className="text-xs text-teal-300">FR-PH-01 to FR-PH-04</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Pharmacy & Medication Dispensary</h1>
            <p className="text-xs text-teal-200 mt-1">
              Duty Pharmacist: <strong className="text-white">Pharm. U. Chukwu, B.Pharm</strong> • Outpatient & Inpatient Wards
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pending Dispense</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {summary?.pendingDispenseCount || 0}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
            <span>Prescriptions Awaiting Review</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span className="font-semibold">Dispensed Today</span>
            <span className="text-emerald-600 font-bold text-xs">Cleared</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {summary?.dispensedCount || 0}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span>✓ Medications Delivered</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-yellow-200 shadow-xs bg-yellow-50/20">
          <div className="flex items-center justify-between text-xs text-yellow-700 mb-1">
            <span className="font-semibold">Low Stock Alert</span>
            <span className="text-yellow-600 font-bold text-xs">Reorder</span>
          </div>
          <p className="text-2xl font-black text-yellow-600">
            {summary?.lowStockCount || 0}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-yellow-700 font-medium">
            <span>At or below min threshold</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold">Out of Stock</span>
            <span className="text-rose-600 font-bold text-xs">Depleted</span>
          </div>
          <p className="text-2xl font-black text-rose-600">
            {summary?.outOfStockCount || 0}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
            <span>Requires Central Store PO</span>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📋</span> Prescription Queue ({prescriptions.length})
          </button>

          <button
            onClick={() => setActiveTab('formulary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'formulary'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>💊</span> Drug Formulary & Stock Levels (FR-PH-04)
          </button>
        </div>
      </div>

      {/* Tab 1: Prescriptions Queue (FR-PH-01) */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 mr-1">Status:</span>
              {(['all', 'pending', 'partially_dispensed', 'dispensed'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}

              <span className="font-semibold text-slate-500 ml-2 mr-1">Patient Type:</span>
              <select
                value={patientTypeFilter}
                onChange={(e) => setPatientTypeFilter(e.target.value as PatientType | 'all')}
                className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option value="all">All Care Settings</option>
                <option value="Inpatient">Inpatient Wards</option>
                <option value="Outpatient">Outpatient Clinics</option>
              </select>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search prescription, patient, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Prescriptions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Prescription No.</th>
                    <th className="px-5 py-3">Patient & Location</th>
                    <th className="px-5 py-3">Prescribing Doctor</th>
                    <th className="px-5 py-3">Prescribed Medications</th>
                    <th className="px-5 py-3">Known Allergies</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">Loading prescription queue...</td>
                    </tr>
                  ) : filteredPrescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">No prescriptions matching criteria.</td>
                    </tr>
                  ) : (
                    filteredPrescriptions.map(rx => {
                      const hasAllergyWarning = rx.knownAllergies.length > 0 && !rx.knownAllergies.includes('None Reported');

                      return (
                        <tr key={rx.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Prescription Meta */}
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              {rx.prescriptionNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(rx.prescribedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </td>

                          {/* Patient & Location */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 text-xs">
                              {rx.patientName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              <span className="font-mono">{rx.hospitalNumber}</span> • {rx.age}y/{rx.gender}
                            </div>
                            <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              rx.patientType === 'Inpatient'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {rx.patientType} {rx.wardName ? `• ${rx.wardName}` : ''}
                            </span>
                          </td>

                          {/* Doctor */}
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-800 text-xs">{rx.prescriberName}</div>
                            <div className="text-[11px] text-slate-400">{rx.prescriberDepartment}</div>
                          </td>

                          {/* Items */}
                          <td className="px-5 py-3.5 max-w-xs">
                            <div className="space-y-1">
                              {rx.items.map(item => (
                                <div key={item.id} className="text-xs text-slate-700 flex items-center justify-between">
                                  <span className="font-semibold">{item.drugName}</span>
                                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {item.dosage} ({item.frequency})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Allergies */}
                          <td className="px-5 py-3.5">
                            {hasAllergyWarning ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <span>⚠️</span> {rx.knownAllergies.join(', ')}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">None</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rx.status === 'dispensed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rx.status === 'partially_dispensed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {rx.status.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenDispense(rx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                                rx.status === 'dispensed'
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {rx.status === 'dispensed' ? 'View Details' : 'Dispense →'}
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

      {/* Tab 2: Drug Formulary & Inventory (FR-PH-04) */}
      {activeTab === 'formulary' && (
        <FormularyStockView
          drugs={drugs}
          onStockUpdated={loadData}
        />
      )}

      {/* Dispense Modal */}
      <DispenseModal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        prescription={selectedPrescription}
        onDispenseSuccess={loadData}
      />
    </div>
  );
};
