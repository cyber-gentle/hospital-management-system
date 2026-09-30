import React, { useState, useEffect } from 'react';
import { ShiftHandover, Ward } from '../types';
import { nursingApi } from '../api';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  handovers: ShiftHandover[];
  onHandoverUpdated: () => void;
}

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  handovers,
  onHandoverUpdated
}) => {
  const [selectedShiftId, setSelectedShiftId] = useState<string>(handovers[0]?.id || '');
  const [incomingNurseName, setIncomingNurseName] = useState('Nurse K. Oshodi, RN');
  const [isSigning, setIsSigning] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [newWardId, setNewWardId] = useState('');
  const [outgoingNurse, setOutgoingNurse] = useState('');
  const [shift, setShift] = useState<ShiftHandover['shift']>('morning');
  const [wardNotes, setWardNotes] = useState('');
  useEffect(() => { if (isOpen) nursingApi.getWards().then(setWards); }, [isOpen]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSigning(true);
    try {
      const handover = await nursingApi.createShiftHandover(newWardId, shift, outgoingNurse, wardNotes);
      setSelectedShiftId(handover.id);
      setWardNotes('');
      onHandoverUpdated();
    } catch (error) { alert(error instanceof Error ? error.message : 'Unable to create handover'); }
    finally { setIsSigning(false); }
  };

  if (!isOpen) return null;

  const currentShift = handovers.find(h => h.id === selectedShiftId) || handovers[0];

  const handleDualSign = async () => {
    if (!currentShift || !incomingNurseName.trim()) return;
    setIsSigning(true);
    try {
      await nursingApi.signShiftHandover(currentShift.id, incomingNurseName);
      onHandoverUpdated();
    } catch (err) {
      console.error(err);
      alert('Failed to sign shift handover.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-cyan-800 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              🔄
            </div>
            <div>
              <h2 className="text-lg font-bold">Nursing Shift Handover & Endorsement (FR-NS-07)</h2>
              <p className="text-xs text-cyan-100">Dual-Nurse Sign-off & Inpatient Acuity Transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <form onSubmit={handleCreate} className="p-3 border rounded-xl space-y-2">
            <h3 className="font-bold">New outgoing handover</h3>
            <label className="block">Ward
              <select aria-label="Handover ward" required value={newWardId} onChange={e => setNewWardId(e.target.value)} className="w-full border rounded p-2">
                <option value="">Choose ward</option>{wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label className="block">Shift
              <select aria-label="Outgoing shift" value={shift} onChange={e => setShift(e.target.value as ShiftHandover['shift'])} className="w-full border rounded p-2">
                <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="night">Night</option>
              </select>
            </label>
            <label className="block">Outgoing nurse<input aria-label="Outgoing nurse" required value={outgoingNurse} onChange={e=>setOutgoingNurse(e.target.value)} className="w-full border rounded p-2" /></label>
            <label className="block">Ward summary<textarea aria-label="Ward summary" required value={wardNotes} onChange={e=>setWardNotes(e.target.value)} className="w-full border rounded p-2" /></label>
            <p className="text-xs">Includes current inpatients and their recorded pending tasks. Review the summary before signing.</p>
            <button type="submit" disabled={isSigning} className="px-3 py-2 bg-blue-700 text-white rounded">Sign outgoing handover</button>
          </form>
          {/* Shift Picker Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Select Handover:</span>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white outline-none"
              >
                {handovers.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.wardName} — {h.shift.toUpperCase()} Shift ({h.handoverDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              {currentShift?.isDualSigned ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1.5">
                  <span>✓</span> Dual Handover Verified & Counter-Signed
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs flex items-center gap-1.5">
                  <span>⚠️</span> Pending Incoming Nurse Signature
                </span>
              )}
            </div>
          </div>

          {currentShift ? (
            <>
              {/* General Ward Status Notes */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  General Ward Status & Environmental Check
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {currentShift.generalWardNotes}
                </div>
              </div>

              {/* Patient-by-Patient Endorsement List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Inpatient Clinical Endorsements ({currentShift.patientEndorsements.length})
                </h3>

                <div className="space-y-3">
                  {currentShift.patientEndorsements.map((pe, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{pe.patientName}</span>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Bed {pe.bedNumber}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          pe.acuity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : pe.acuity === 'high_risk'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {pe.acuity.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-700">Clinical Summary:</strong> {pe.clinicalSummary}
                      </p>

                      <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">
                        <strong className="text-amber-950">Pending Actions for Incoming Shift:</strong> {pe.pendingTasks}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dual Sign-off Section */}
              <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Dual Sign-Off Certification (Outgoing & Incoming Nurse)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Outgoing Sign */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Outgoing Nurse Endorsement</span>
                    <p className="font-bold text-xs text-slate-800">{currentShift.outgoingNurse}</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Endorsed at {new Date(currentShift.outgoingSignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Incoming Sign */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Incoming Nurse Acceptance</span>
                    {currentShift.isDualSigned ? (
                      <div>
                        <p className="font-bold text-xs text-slate-800">{currentShift.incomingNurse}</p>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          ✓ Counter-signed at {currentShift.incomingSignedAt ? new Date(currentShift.incomingSignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={incomingNurseName}
                          onChange={(e) => setIncomingNurseName(e.target.value)}
                          placeholder="Incoming RN Name"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleDualSign}
                          disabled={isSigning || !incomingNurseName.trim()}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          {isSigning ? 'Verifying...' : 'Counter-Sign & Accept Shift →'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">No handover record found.</div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
