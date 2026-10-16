import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
type Overview = { invoiceTotalsIssued: string; completedReceipts: string; currentAdmissions: number; currentActiveBeds: number; currentOccupiedBeds: number; generatedAt: string };
export function LiveReportingView() {
 const today = new Date().toISOString().slice(0,10);
 const [start, setStart] = useState(today.slice(0,8)+'01');
 const [end, setEnd] = useState(today);
 const [period, setPeriod] = useState({start, end});
 const [data, setData] = useState<Overview | null>(null);
 const [error, setError] = useState('');
 useEffect(() => {
  const controller = new AbortController(); setData(null); setError('');
  apiRequest<Overview>('/reporting/overview?startDate='+period.start+'&endDate='+period.end, {signal:controller.signal})
   .then(setData).catch((e: unknown) => {if (!controller.signal.aborted) setError(typeof e === 'object' && e !== null && 'message' in e ? String(e.message) : 'Report unavailable');});
  return () => controller.abort();
 },[period]);
 return <section className="space-y-6 p-6"><h1 className="text-2xl font-bold">Hospital reports</h1>
  <form className="flex gap-4" onSubmit={e => {e.preventDefault();setPeriod({start,end});}}>
   <label>Start date (UTC) <input type="date" required value={start} onChange={e => setStart(e.target.value)} /></label>
   <label>End date (UTC, inclusive) <input type="date" required min={start} value={end} onChange={e => setEnd(e.target.value)} /></label>
   <button>Load report</button>
  </form>
  {error && <p role="alert">{error}</p>}
  {!error && !data && <p role="status">Loading…</p>}
  {data && <><h2 className="font-bold">Financial activity: {period.start} to {period.end} (UTC)</h2>
   <dl className="grid grid-cols-2 gap-3"><dt>Invoice totals issued (₦)</dt><dd>{data.invoiceTotalsIssued}</dd><dt>Completed receipts (₦)</dt><dd>{data.completedReceipts}</dd></dl>
   <p>Invoice totals use issue dates and exclude draft/cancelled invoices. Receipts use payment dates and include completed payments. These are recorded activity totals, not a reconciled ledger or recognized revenue.</p>
   <h2 className="font-bold">Current census</h2><p>As of {new Date(data.generatedAt).toLocaleString()}; independent of the financial period above.</p>
   <dl className="grid grid-cols-2 gap-3"><dt>Active admissions</dt><dd>{data.currentAdmissions}</dd><dt>Active beds in active wards</dt><dd>{data.currentActiveBeds}</dd><dt>Marked occupied</dt><dd>{data.currentOccupiedBeds}</dd></dl>
  </>}
  <p>Historical census, morbidity and performance indicators await approved definitions and source data.</p>
 </section>;
}
