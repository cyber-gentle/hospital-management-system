import React, { useState, useEffect } from 'react';
import { InpatientAdmission, NursingNote, CarePlan, NoteType } from '../types';
import { nursingApi } from '../api';

interface NursingNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  admission: InpatientAdmission | null;
}

export const NursingNotesDrawer: React.FC<NursingNotesDrawerProps> = ({
  isOpen,
  onClose,
  admission
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'careplan'>('notes');
  const [notes, setNotes] = useState<NursingNote[]>([]);
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);

  // New Note Form
  const [noteType, setNoteType] = useState<NoteType>('progress');
  const [noteContent, setNoteContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [nurseName, setNurseName] = useState('Nurse B. Taiwo, RN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && admission) {
      loadData();
    }
  }, [isOpen, admission]);

  const loadData = async () => {
    if (!admission) return;
    setLoading(true);
    try {
      const [notesData, plansData] = await Promise.all([
        nursingApi.getNotes(admission.id),
        nursingApi.getCarePlans(admission.id)
      ]);
      setNotes(notesData);
      setCarePlans(plansData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !admission) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const newNote = await nursingApi.addNote({
        admissionId: admission.id,
        patientName: admission.patientName,
        noteType,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        content: noteContent,
        authorName: nurseName,
        authorRole: 'Registered Nurse'
      });
      setNotes([newNote, ...notes]);
      setNoteContent('');
      setTagsInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignNote = async (noteId: string) => {
    try {
      const signed = await nursingApi.signAndLockNote(noteId, nurseName);
      setNotes(notes.map(n => n.id === noteId ? signed : n));
    } catch (err) {
      console.error(err);
      alert('Failed to sign and lock note.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-base">{admission.patientName}</h2>
              <span className="font-mono text-xs text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                {admission.hospitalNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bed {admission.bedNumber} • {admission.wardName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 px-4 font-bold text-xs transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Clinical Nursing Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('careplan')}
            className={`pb-3 px-4 font-bold text-xs transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'careplan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Nursing Care Plan ({carePlans.length})
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading records...</div>
          ) : activeTab === 'notes' ? (
            <>
              {/* New Note Creator */}
              <form onSubmit={handleAddNote} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  New Nursing Clinical Entry (FR-NS-05)
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Note Category</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as NoteType)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="progress">Routine Progress Note</option>
                      <option value="shift_report">Shift Summary</option>
                      <option value="doctor_visit">Consultant Ward Round</option>
                      <option value="procedure">Nursing Procedure</option>
                      <option value="incident">Critical Incident</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Author RN</label>
                    <input
                      type="text"
                      value={nurseName}
                      onChange={(e) => setNurseName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Observation / Note *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter detailed clinical observation, interventions, or patient response..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Wound Care, Sepsis Protocol, IV Fluids"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    {isSubmitting ? 'Saving...' : 'Add Note to Timeline'}
                  </button>
                </div>
              </form>

              {/* Notes Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Timeline History
                </h3>

                {notes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No notes recorded yet for this admission.</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-xl border transition-all ${
                        note.isSigned
                          ? 'bg-white border-slate-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {note.noteType.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {note.authorName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.writtenAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">
                        {note.content}
                      </p>

                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map((t, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Sign and Lock Status */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {note.isSigned ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                            <span>🔒</span>
                            <span>Signed & Locked by {note.signedBy}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[11px] text-amber-700 font-medium">
                              ⚠️ Unsigned draft
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSignNote(note.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>🔒</span> Sign & Lock
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Care Plans (FR-NS-06) */
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Nursing Care Plans (FR-NS-06)
              </h3>

              {carePlans.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  No active care plan documented. Care plans can be generated from standard NANDA templates.
                </div>
              ) : (
                carePlans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {plan.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Nurse: {plan.nurseInCharge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-0.5">Nursing Diagnosis</h4>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {plan.nursingDiagnosis}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-0.5">Clinical Goal</h4>
                      <p className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-blue-900 font-medium">
                        🎯 {plan.clinicalGoal}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Prescribed Nursing Interventions</h4>
                      <div className="space-y-2">
                        {plan.interventions.map((int) => (
                          <div key={int.id} className="p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-800">{int.description}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                {int.frequency}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Evaluation: <em className="text-slate-700">{int.evaluation}</em>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
