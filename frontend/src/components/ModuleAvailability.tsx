export function ModuleAvailability({ name, reason }: { name: string; reason: string }) {
  return <section className="rounded-xl border border-amber-200 bg-amber-50 p-6" role="status">
    <h1 className="text-xl font-semibold text-slate-900">{name}</h1>
    <p className="mt-3 text-slate-700">This workflow is not available for hospital use yet.</p>
    <p className="mt-2 text-sm text-slate-600">{reason}</p>
  </section>;
}
