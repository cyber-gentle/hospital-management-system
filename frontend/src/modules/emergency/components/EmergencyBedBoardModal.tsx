import React, { useState } from 'react';
import { X, Bed, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import { EmergencyBay, EmergencyPatient, TriageCategory } from '../types';

interface EmergencyBedBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bays: EmergencyBay[];
  patients: EmergencyPatient[];
  onAssignBed: (patientId: string, bayId: string, bedNumber: string) => Promise<void>;
  onReleaseBed: (patientId: string) => Promise<void>;
}

export const EmergencyBedBoardModal: React.FC<EmergencyBedBoardModalProps> = ({
  isOpen,
  onClose,
  bays,
  patients,
  onAssignBed,
  onReleaseBed
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [targetBayId, setTargetBayId] = useState<string>(bays[0]?.id || '');
  const [targetBedNumber, setTargetBedNumber] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const targetBay = bays.find(b => b.id === targetBayId);
  const availableBeds = targetBay ? targetBay.beds.filter(b => b.status === 'AVAILABLE') : [];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !targetBayId || !targetBedNumber) return;
    setProcessing(true);
    try {
      await onAssignBed(selectedPatientId, targetBayId, targetBedNumber);
      setSelectedPatientId('');
      setTargetBedNumber('');
    } finally {
      setProcessing(false);
    }
  };

  const getTriageColorBadge = (cat?: TriageCategory) => {
    switch (cat) {
      case 'RED': return 'bg-red-100 text-red-800 border-red-300';
      case 'ORANGE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'YELLOW': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'GREEN': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Bed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Emergency Department Bay & Bed Allocation</h2>
              <p className="text-xs text-slate-400">FR-AE-02 • Real-time bed management, triage allocation & patient transfers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Bed Transfer Bar */}
          <form onSubmit={handleTransfer} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Transfer / Assign Patient to Another Bay
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose active patient --</option>
                  {patients.filter(p => !['DISCHARGED', 'DECEASED'].includes(p.status)).map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.triageCategory}] {p.patientName} ({p.assignedBedNumber || 'Unassigned'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destination Bay *</label>
                <select
                  value={targetBayId}
                  onChange={(e) => {
                    setTargetBayId(e.target.value);
                    const b = bays.find(bay => bay.id === e.target.value);
                    const avail = b ? b.beds.find(bed => bed.status === 'AVAILABLE') : undefined;
                    setTargetBedNumber(avail?.bedNumber || '');
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {bays.map(bay => (
                    <option key={bay.id} value={bay.id}>
                      {bay.name} ({bay.beds.filter(b => b.status === 'AVAILABLE').length} free)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Available Bed Slot *</label>
                <select
                  required
                  value={targetBedNumber}
                  onChange={(e) => setTargetBedNumber(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose bed --</option>
                  {availableBeds.map(b => (
                    <option key={b.bedId} value={b.bedNumber}>
                      {b.bedNumber} (Clean & Ready)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={processing || !selectedPatientId || !targetBedNumber}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {processing ? 'Transferring...' : 'Execute Bed Transfer'}
                </button>
              </div>
            </div>
          </form>

          {/* Bay Boards Display */}
          <div className="space-y-6">
            {bays.map(bay => {
              const occupiedCount = bay.beds.filter(b => b.status === 'OCCUPIED').length;
              const availableCount = bay.beds.filter(b => b.status === 'AVAILABLE').length;
              const cleaningCount = bay.beds.filter(b => b.status === 'CLEANING').length;

              return (
                <div key={bay.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Bay Header */}
                  <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{bay.name}</span>
                        <span className="text-[11px] font-normal text-slate-500">({bay.floorZone})</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-700 font-semibold">{availableCount} Available</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-blue-700 font-semibold">{occupiedCount} Occupied</span>
                      {cleaningCount > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-700 font-semibold">{cleaningCount} Cleaning</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bed Slots Grid */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50/50">
                    {bay.beds.map(bed => {
                      const isOccupied = bed.status === 'OCCUPIED';
                      const isCleaning = bed.status === 'CLEANING';

                      return (
                        <div
                          key={bed.bedId}
                          className={`rounded-xl p-3 border transition-all ${
                            isOccupied
                              ? 'bg-white border-blue-200 shadow-sm'
                              : isCleaning
                              ? 'bg-amber-50/60 border-amber-200 border-dashed'
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <Bed className={`w-3.5 h-3.5 ${isOccupied ? 'text-blue-600' : isCleaning ? 'text-amber-500' : 'text-emerald-600'}`} />
                              {bed.bedNumber}
                            </span>
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

                          {isOccupied && bed.currentPatientName ? (
                            <div className="space-y-2 mt-2">
                              <div>
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {bed.currentPatientName}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTriageColorBadge(bed.triageCategory)}`}>
                                    Cat: {bed.triageCategory}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (bed.currentPatientId && window.confirm(`Release ${bed.bedNumber} and send for cleaning?`)) {
                                      await onReleaseBed(bed.currentPatientId);
                                    }
                                  }}
                                  className="text-[10px] font-semibold text-rose-600 hover:underline flex items-center gap-1"
                                >
                                  Release Bed
                                </button>
                              </div>
                            </div>
                          ) : isCleaning ? (
                            <div className="text-xs text-amber-700 py-2 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>Decontamination in progress</span>
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-700 py-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Clean & ready for intake</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close Bed Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
