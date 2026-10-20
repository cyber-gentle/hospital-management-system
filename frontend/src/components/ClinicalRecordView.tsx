import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
type Module = 'theatre' | 'emergency' | 'maternity';
type Entry = { id: string; kind: string; summary: string; notes: string; occurredAt: string; createdBy: string; documentationStatus: string };
const kinds: Record<Module, string[]> = {
 theatre: ['SURGERY_BOOKING', 'PRE_OP_OBSERVATION', 'OPERATIVE_NOTE', 'RECOVERY_NOTE'],
 emergency: ['TRIAGE_NOTE', 'STABILIZATION_NOTE', 'MEDICATION_RECORD'],
 maternity: ['ANTENATAL_NOTE', 'DELIVERY_NOTE', 'POSTNATAL_NOTE'],
};
const message = (e: unknown) => typeof e === 'object' && e !== null && 'message' in e ? String(e.message) : 'Request failed';
export function ClinicalRecordView({ module, title, onBackToDashboard }: { module: Module; title: string; onBackToDashboard?: () => void }) {
 const [reference, setReference] = useState('');
 const [patient, setPatient] = useState('');
 const [records, setRecords] = useState<Entry[]>([]);
 const [kind, setKind] = useState(kinds[module][0]);
 const [summary, setSummary] = useState('');
 const [notes, setNotes] = useState('');
 const [when, setWhen] = useState(new Date().toISOString().slice(0,16));
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const [revision, setRevision] = useState(0);
 useEffect(() => {
  setRecords([]); if (!patient) return;
  const controller = new AbortController(); setBusy(true); setError('');
  apiRequest<Entry[]>('/'+module+'/records?patientId='+encodeURIComponent(patient), { signal: controller.signal })
   .then(setRecords).catch((e: unknown) => { if (!controller.signal.aborted) setError(message(e)); })
   .finally(() => { if (!controller.signal.aborted) setBusy(false); });
  return () => controller.abort();
 }, [module, patient, revision]);
 return <section className="space-y-6 p-6">
  {onBackToDashboard && <button onClick={onBackToDashboard}>Back to dashboard</button>}
  <h1 className="text-2xl font-bold">{title}</h1>
  <p>Audited recordkeeping. Entries remain unverified; they do not sign off care, finalize delivery, create admissions or transfer patients.</p>
  <form className="flex gap-3" onSubmit={e => { e.preventDefault(); setPatient(reference.trim()); setRevision(v => v+1); }}>
   <label>Registered patient UUID <input className="border p-2" required value={reference} onChange={e => setReference(e.target.value)} /></label>
   <button disabled={busy}>Open records</button>
  </form>
  {error && <p role="alert" className="text-red-700">{error}</p>}
  {patient && <form className="grid gap-3 rounded border p-4" onSubmit={async e => {
   e.preventDefault(); setBusy(true); setError('');
   try {
    await apiRequest('/'+module+'/records', { method: 'POST', body: JSON.stringify({ patientId: patient, kind, summary, notes, occurredAt: new Date(when+'Z').toISOString() }) });
    setSummary(''); setNotes(''); setRevision(v => v+1);
   } catch (err: unknown) { setError(message(err)); } finally { setBusy(false); }
  }}>
   <h2 className="font-bold">Add record for {patient}</h2>
   <label>Record type <select className="border p-2" value={kind} onChange={e => setKind(e.target.value)}>{kinds[module].map(k => <option key={k}>{k}</option>)}</select></label>
   <label>Occurrence time (UTC) <input className="border p-2" type="datetime-local" required value={when} onChange={e => setWhen(e.target.value)} /></label>
   <label>Summary <input className="w-full border p-2" required maxLength={200} value={summary} onChange={e => setSummary(e.target.value)} /></label>
   <label>Notes <textarea className="w-full border p-2" required maxLength={20000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
   <button disabled={busy} className="rounded bg-blue-700 p-2 text-white">Save unverified record</button>
  </form>}
  {busy && <p role="status">Loading…</p>}
  {patient && !busy && <p>Latest {records.length} records (maximum 1,000).</p>}
  {records.map(record => <article key={record.id} className="rounded border p-4">
   <h2 className="font-bold">{record.summary}</h2><p>{record.kind} · {record.documentationStatus}</p>
   <p className="whitespace-pre-wrap">{record.notes}</p>
   <p>{new Date(record.occurredAt).toLocaleString()} · Recorded by {record.createdBy}</p>
  </article>)}
 </section>;
}
