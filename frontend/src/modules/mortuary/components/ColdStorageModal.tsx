import React, { useState } from 'react';
import { X, Layers, ArrowRightLeft, Sparkles, AlertCircle, Thermometer } from 'lucide-react';
import { ColdStorageUnit, DeceasedRecord } from '../types';

interface ColdStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: ColdStorageUnit[];
  deceasedList: DeceasedRecord[];
  onAssignChamber: (deceasedId: string, unitId: string, chamberNumber: string) => Promise<void>;
  onReleaseChamber: (deceasedId: string) => Promise<void>;
}

export const ColdStorageModal: React.FC<ColdStorageModalProps> = ({
  isOpen,
  onClose,
  units,
  deceasedList,
  onAssignChamber,
  onReleaseChamber
}) => {
  const [selectedDeceasedId, setSelectedDeceasedId] = useState<string>('');
  const [targetUnitId, setTargetUnitId] = useState<string>(units[0]?.id || '');
  const [targetChamberNumber, setTargetChamberNumber] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  if (!isOpen) return null;

  const targetUnit = units.find(u => u.id === targetUnitId);
  const availableChambers = targetUnit ? targetUnit.chambers.filter(c => c.status === 'AVAILABLE') : [];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeceasedId || !targetUnitId || !targetChamberNumber) return;
    setTransferring(true);
    try {
      await onAssignChamber(selectedDeceasedId, targetUnitId, targetChamberNumber);
      setSelectedDeceasedId('');
      setTargetChamberNumber('');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Cold Storage Chamber &amp; Vault Allocation</h2>
              <p className="text-xs text-slate-400">FR-MOR-02 • Temperature monitoring, vault tiering &amp; body reallocation</p>
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
          
          {/* Quick Transfer Form */}
          <form onSubmit={handleTransfer} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <ArrowRightLeft className="w-4 h-4 text-cyan-600" />
              Transfer / Allocate Body to Chamber Vault
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Deceased *</label>
                <select
                  required
                  value={selectedDeceasedId}
                  onChange={(e) => setSelectedDeceasedId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="">-- Choose Deceased --</option>
                  {deceasedList.filter(d => d.status !== 'RELEASED_TO_FAMILY').map(d => (
                    <option key={d.id} value={d.id}>
                      [{d.deceasedTagNumber}] {d.fullName} ({d.assignedChamberUnit || 'Unassigned'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destination Block *</label>
                <select
                  value={targetUnitId}
                  onChange={(e) => {
                    setTargetUnitId(e.target.value);
                    const u = units.find(unit => unit.id === e.target.value);
                    const avail = u ? u.chambers.find(c => c.status === 'AVAILABLE') : undefined;
                    setTargetChamberNumber(avail?.chamberNumber || '');
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.unitName} ({u.chambers.filter(c => c.status === 'AVAILABLE').length} free)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Vault *</label>
                <select
                  required
                  value={targetChamberNumber}
                  onChange={(e) => setTargetChamberNumber(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold"
                >
                  <option value="">-- Select Free Vault --</option>
                  {availableChambers.map(c => (
                    <option key={c.chamberId} value={c.chamberNumber}>
                      {c.chamberNumber} ({c.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={transferring || !selectedDeceasedId || !targetChamberNumber}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {transferring ? 'Allocating...' : 'Assign Chamber Vault'}
                </button>
              </div>
            </div>
          </form>

          {/* Units and Chambers Visual Grid */}
          <div className="space-y-6">
            {units.map(unit => {
              const occupiedCount = unit.chambers.filter(c => c.status === 'OCCUPIED').length;
              const availableCount = unit.chambers.filter(c => c.status === 'AVAILABLE').length;
              const decontamCount = unit.chambers.filter(c => c.status === 'DECONTAMINATION').length;

              return (
                <div key={unit.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Block Header */}
                  <div className="bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <span>{unit.unitName}</span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Telemetry: <strong className="text-cyan-300">{unit.currentTemperatureCelsius}°C</strong> (Setpoint: {unit.targetTemperatureCelsius}°C)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-400 font-semibold">{availableCount} Free</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-400 font-semibold">{occupiedCount} Occupied</span>
                      {decontamCount > 0 && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400 font-semibold">{decontamCount} Sanitizing</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chamber Vaults Grid */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50/50">
                    {unit.chambers.map(chamber => {
                      const isOccupied = chamber.status === 'OCCUPIED';
                      const isDecontam = chamber.status === 'DECONTAMINATION';

                      return (
                        <div
                          key={chamber.chamberId}
                          className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
                            isOccupied
                              ? 'bg-white border-slate-300 shadow-sm'
                              : isDecontam
                              ? 'bg-amber-50/70 border-amber-200 border-dashed'
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-slate-800">
                                {chamber.chamberNumber}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isOccupied
                                    ? 'bg-slate-200 text-slate-800'
                                    : isDecontam
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {chamber.status}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-400 block mb-2 font-mono">
                              {chamber.tier.replace('_', ' ')}
                            </span>

                            {isOccupied && chamber.currentDeceasedName ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {chamber.currentDeceasedName}
                                </div>
                                <div className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded inline-block">
                                  {chamber.currentDeceasedTag}
                                </div>
                              </div>
                            ) : isDecontam ? (
                              <div className="text-[11px] text-amber-700 py-2 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>Sanitizing vault</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-emerald-700 py-2 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Ready for intake</span>
                              </div>
                            )}
                          </div>

                          {isOccupied && chamber.currentDeceasedId && (
                            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (chamber.currentDeceasedId && window.confirm(`Release ${chamber.chamberNumber} and send for decontamination?`)) {
                                    await onReleaseChamber(chamber.currentDeceasedId);
                                  }
                                }}
                                className="text-[10px] font-semibold text-rose-600 hover:underline"
                              >
                                Release Vault
                              </button>
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
              Close Vault Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
