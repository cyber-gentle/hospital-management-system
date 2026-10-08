import React, { useState } from "react";
import { X, FileText, Plus, Trash2, CheckCircle2, FlaskConical, Scan } from "lucide-react";
import { InvestigationOrder } from "../types";

interface InvestigationOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigations: InvestigationOrder[];
  onSave: (items: InvestigationOrder[]) => void;
}

const COMMON_LAB_TESTS = [
  "Malaria Parasite (MP) Microscopy",
  "Full Blood Count (FBC / CBC)",
  "Urinalysis (Dipstick & Microscopy)",
  "Widal Agglutination Reaction",
  "Random Blood Sugar (RBS)",
  "Fasting Blood Sugar (FBS)",
  "Electrolytes, Urea & Creatinine (E/U/Cr)",
  "Liver Function Tests (LFT)",
  "Lipid Profile (Cholesterol / Triglycerides)",
  "Stool Microscopy & Occult Blood"
];

const COMMON_RAD_TESTS = [
  "Chest X-Ray (PA View)",
  "Abdominal Ultrasound Scan",
  "Pelvic Ultrasound Scan",
  "Lumbosacral Spine X-Ray (AP/Lat)",
  "Knee Joint X-Ray (AP/Lat)",
  "Cranial CT Scan (Plain)"
];

export const InvestigationOrderModal: React.FC<InvestigationOrderModalProps> = ({
  isOpen,
  onClose,
  investigations,
  onSave
}) => {
  const [items, setItems] = useState<InvestigationOrder[]>(investigations);
  const [testType, setTestType] = useState<"LABORATORY" | "RADIOLOGY">("LABORATORY");
  const [testName, setTestName] = useState("");
  const [urgency, setUrgency] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
  const [clinicalNotes, setClinicalNotes] = useState("");

  React.useEffect(() => {
    setItems(investigations);
  }, [investigations, isOpen]);

  if (!isOpen) return null;

  const handleAddQuickTest = (name: string, type: "LABORATORY" | "RADIOLOGY") => {
    const newItem: InvestigationOrder = {
      id: "inv_" + Date.now() + Math.random().toString(36).substr(2, 4),
      type,
      testName: name,
      urgency,
      clinicalNotes: clinicalNotes.trim() || undefined
    };
    setItems([...items, newItem]);
    setClinicalNotes("");
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const newItem: InvestigationOrder = {
      id: "inv_" + Date.now() + Math.random().toString(36).substr(2, 4),
      type: testType,
      testName: testName.trim(),
      urgency,
      clinicalNotes: clinicalNotes.trim() || undefined
    };

    setItems([...items, newItem]);
    setTestName("");
    setClinicalNotes("");
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
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Order Diagnostic Investigations</h2>
              <p className="text-xs text-slate-500">Route diagnostic orders to Laboratory (LIS) or Radiology (PACS)</p>
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
          {/* Quick Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Laboratory Quick Picks */}
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                Common Laboratory Tests
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LAB_TESTS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddQuickTest(t, "LABORATORY")}
                    className="text-xs px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg text-slate-700 transition-colors text-left"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Radiology Quick Picks */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                <Scan className="w-4 h-4 text-blue-600" />
                Common Imaging & Radiology
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_RAD_TESTS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddQuickTest(t, "RADIOLOGY")}
                    className="text-xs px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-slate-700 transition-colors text-left"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Test Form */}
          <form onSubmit={handleManualAdd} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Custom Investigation Order
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Investigation Modality</label>
                <select
                  value={testType}
                  onChange={e => setTestType(e.target.value as any)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="LABORATORY">Laboratory (LIS)</option>
                  <option value="RADIOLOGY">Radiology / Imaging (PACS)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Investigation Name *</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g. Serum Ferritin, Thyroid Profile..."
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as any)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="STAT">STAT / Immediate</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Clinical Indication / Reason for Request</label>
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Rule out hyperthyroidism, evaluate persistent abdominal mass..."
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Investigation
              </button>
            </div>
          </form>

          {/* Current Orders List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Ordered Investigations ({items.length})
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.type === "LABORATORY"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{item.testName}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              item.urgency === "STAT"
                                ? "bg-red-100 text-red-700"
                                : item.urgency === "URGENT"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.urgency}
                          </span>
                        </div>
                        {item.clinicalNotes && (
                          <div className="text-xs text-slate-500 mt-1">
                            Indication: {item.clinicalNotes}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No investigation orders added yet. Select from laboratory/radiology lists above.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {items.length} investigation{items.length !== 1 ? "s" : ""} ordered
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
