import React, { useState } from "react";
import { X, Pill, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { PrescriptionItem } from "../types";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptions: PrescriptionItem[];
  onSave: (items: PrescriptionItem[]) => void;
}

const COMMON_DRUGS = [
  { name: "Artemether-Lumefantrine (Coartem) 20/120mg", route: "Oral", defaultDosage: "4 tabs", defaultFreq: "BD", defaultDuration: "3 days" },
  { name: "Paracetamol 500mg", route: "Oral", defaultDosage: "1g (2 tabs)", defaultFreq: "TDS", defaultDuration: "3 days" },
  { name: "Amoxicillin-Clavulanate (Augmentin) 625mg", route: "Oral", defaultDosage: "1 tab", defaultFreq: "BD", defaultDuration: "7 days" },
  { name: "Ciprofloxacin 500mg", route: "Oral", defaultDosage: "1 tab", defaultFreq: "BD", defaultDuration: "5 days" },
  { name: "Omeprazole 20mg", route: "Oral", defaultDosage: "1 cap", defaultFreq: "Once daily", defaultDuration: "14 days" },
  { name: "Metronidazole 400mg", route: "Oral", defaultDosage: "1 tab", defaultFreq: "TDS", defaultDuration: "5 days" },
  { name: "Amlodipine 5mg", route: "Oral", defaultDosage: "1 tab", defaultFreq: "Once daily (Morning)", defaultDuration: "30 days" },
  { name: "Metformin 500mg", route: "Oral", defaultDosage: "1 tab", defaultFreq: "BD (with meals)", defaultDuration: "30 days" },
  { name: "Ibuprofen 400mg", route: "Oral", defaultDosage: "1 tab", defaultFreq: "TDS (after meals)", defaultDuration: "3 days" },
  { name: "Oral Rehydration Salts (ORS)", route: "Oral", defaultDosage: "1 sachet in 1L water", defaultFreq: "PRN after loose stool", defaultDuration: "3 days" }
];

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescriptions,
  onSave
}) => {
  const [items, setItems] = useState<PrescriptionItem[]>(prescriptions);
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("BD (Twice daily)");
  const [duration, setDuration] = useState("5 days");
  const [route, setRoute] = useState("Oral");
  const [instructions, setInstructions] = useState("");

  React.useEffect(() => {
    setItems(prescriptions);
  }, [prescriptions, isOpen]);

  if (!isOpen) return null;

  const handleSelectQuickDrug = (d: typeof COMMON_DRUGS[0]) => {
    setDrugName(d.name);
    setRoute(d.route);
    setDosage(d.defaultDosage);
    setFrequency(d.defaultFreq);
    setDuration(d.defaultDuration);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;

    const newItem: PrescriptionItem = {
      id: "rx_" + Date.now() + Math.random().toString(36).substr(2, 4),
      drugName: drugName.trim(),
      dosage: dosage.trim() || "1 unit",
      frequency,
      duration,
      route,
      instructions: instructions.trim() || undefined
    };

    setItems([...items, newItem]);
    setDrugName("");
    setDosage("");
    setInstructions("");
  };

  const handleRemove = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  const handleFinalSave = () => {
    onSave(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Outpatient e-Prescription</h2>
              <p className="text-xs text-slate-500">Send electronic medication order to Hospital Pharmacy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Drug Picks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Common Dispensary Formulary
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DRUGS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQuickDrug(d)}
                  className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Add Prescription Form */}
          <form onSubmit={handleAddItem} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Add Medication
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Drug Name & Strength *</label>
                <input
                  type="text"
                  required
                  value={drugName}
                  onChange={e => setDrugName(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg, Amoxicillin 500mg..."
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Dosage</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={e => setDosage(e.target.value)}
                  placeholder="e.g. 2 tablets, 5ml, 1 capsule"
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Route</label>
                <select
                  value={route}
                  onChange={e => setRoute(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Oral">Oral (PO)</option>
                  <option value="IV">Intravenous (IV)</option>
                  <option value="IM">Intramuscular (IM)</option>
                  <option value="SC">Subcutaneous (SC)</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Rectal">Rectal</option>
                  <option value="Ophthalmic">Ophthalmic (Eye)</option>
                  <option value="Otic">Otic (Ear)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Once daily">Once daily (OD)</option>
                  <option value="BD (Twice daily)">BD (Twice daily)</option>
                  <option value="TDS (Thrice daily)">TDS (Thrice daily)</option>
                  <option value="QDS (4 times daily)">QDS (4 times daily)</option>
                  <option value="PRN (As needed)">PRN (As needed)</option>
                  <option value="Nocte (At night)">Nocte (At night)</option>
                  <option value="Stat (Immediately)">Stat (Immediately)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 3 days, 5 days, 2 weeks, 1 month"
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Instructions / Advisory</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Take with food, finish entire course, avoid dairy"
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add to Prescription
              </button>
            </div>
          </form>

          {/* Current Prescriptions List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Prescription Order List ({items.length})
            </label>
            {items.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{item.drugName}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          <span className="font-medium text-emerald-700">{item.dosage}</span> • {item.route} • {item.frequency} • {item.duration}
                        </div>
                        {item.instructions && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Note: {item.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove drug"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No medications added yet. Select from the formulary or type above.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {items.length} item{items.length !== 1 ? "s" : ""} in prescription
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalSave}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
