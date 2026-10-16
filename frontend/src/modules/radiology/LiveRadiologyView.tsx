import { useEffect, useState } from 'react';
import { radiologyApi, ImagingExam, ImagingRequest, StudyStatus } from './api';

const message = (error:unknown):string => error instanceof Error ? error.message : typeof error==='object' && error!==null && 'message' in error ? String(error.message) : 'Imaging service unavailable';
const statuses:StudyStatus[]=['PENDING','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'];
export function LiveRadiologyView({onBackToDashboard}:{onBackToDashboard:()=>void}) {
  const [exams,setExams]=useState<ImagingExam[]>([]);
  const [studies,setStudies]=useState<ImagingRequest[]>([]);
  const [offset,setOffset]=useState(0);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [patient,setPatient]=useState('');
  const [exam,setExam]=useState('');
  const [selected,setSelected]=useState<ImagingRequest|null>(null);
  const [report,setReport]=useState('');
  const [status,setStatus]=useState<StudyStatus>('PENDING');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let cancelled=false;
    setLoading(true);setError(null);setSelected(null);
    Promise.all([radiologyApi.catalog(),radiologyApi.requests(offset)]).then(([catalog,requests])=>{
      if(cancelled)return;setExams(catalog);setStudies(requests);
    }).catch((failure:unknown)=>{if(cancelled)return;setExams([]);setStudies([]);setError(message(failure));}).finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
  },[offset,refresh]);
  const create=async(event:React.FormEvent)=>{
    event.preventDefault();setSaving(true);setError(null);
    try {await radiologyApi.create(patient.trim(),exam);setPatient('');setExam('');setOffset(0);setRefresh(value=>value+1);}
    catch(failure){setError(message(failure));}finally{setSaving(false);}
  };
  const save=async(event:React.FormEvent)=>{
    event.preventDefault();if(!selected)return;setSaving(true);setError(null);
    try{await radiologyApi.saveReport(selected.id,status,report);setSelected(null);setRefresh(value=>value+1);}
    catch(failure){setError(message(failure));}finally{setSaving(false);}
  };
  return <section className="space-y-6">
    <button type="button" onClick={onBackToDashboard} className="text-blue-700">Back to directory</button>
    <header><h1 className="text-2xl font-bold">Radiology requests and reports</h1><p className="mt-2 text-slate-600">Recorded studies and reports. Formal report sign-off and PACS upload are not configured.</p></header>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    <form onSubmit={create} className="rounded-xl border bg-white p-5 flex flex-wrap items-end gap-4">
      <label className="grid gap-2 text-sm">Registered patient reference<input required value={patient} onChange={e=>setPatient(e.target.value)} placeholder="Patient UUID" className="rounded border p-2" /></label>
      <label className="grid gap-2 text-sm">Examination<select required value={exam} onChange={e=>setExam(e.target.value)} className="rounded border p-2"><option value="">Select examination</option>{exams.map(item=><option key={item.id} value={item.id}>{item.modality} — {item.exam_name}</option>)}</select></label>
      <button disabled={saving||loading||!exams.length} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Record request</button>
    </form>
    {loading?<p role="status">Loading imaging requests...</p>:<div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Study reference','Patient reference','Examination','Status','Recorded at','Report'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{studies.map(study=><tr key={study.id} className="border-t"><td className="p-3">{study.id}</td><td className="p-3">{study.patient_id}</td><td className="p-3">{exams.find(item=>item.id===study.catalog_id)?.exam_name??study.catalog_id}</td><td className="p-3">{study.status}</td><td className="p-3">{new Date(study.created_at).toLocaleString()}</td><td className="p-3"><button type="button" onClick={()=>{setSelected(study);setReport(study.report_text??'');setStatus(study.status);}} className="text-blue-700">Open report</button></td></tr>)}</tbody></table>{!studies.length&&<p className="p-4">No imaging requests recorded.</p>}</div>}
    <div className="flex justify-between"><button type="button" disabled={offset===0||loading||saving} onClick={()=>setOffset(Math.max(0,offset-100))}>Previous</button><span>Page {offset/100+1}</span><button type="button" disabled={studies.length<100||loading||saving} onClick={()=>setOffset(offset+100)}>Next</button><button type="button" disabled={loading||saving} onClick={()=>setRefresh(value=>value+1)}>Refresh</button></div>
    {selected&&<form onSubmit={save} className="rounded-xl border bg-white p-5 space-y-4"><h2 className="font-semibold">Report: {selected.id}</h2><p className="text-sm text-slate-500">This records a report; it does not sign or verify it.</p><label className="grid gap-2">Study status<select value={status} onChange={e=>setStatus(e.target.value as StudyStatus)} className="rounded border p-2">{statuses.map(value=><option key={value}>{value}</option>)}</select></label><label className="grid gap-2">Report<textarea value={report} onChange={e=>setReport(e.target.value)} required={status==='COMPLETED'} rows={6} className="rounded border p-3" /></label>{selected.dicom_study_uid&&<p>Recorded study UID: {selected.dicom_study_uid}</p>}<div className="flex gap-4"><button disabled={saving} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Save report</button><button type="button" disabled={saving} onClick={()=>setSelected(null)}>Close</button></div></form>}
  </section>;
}
