import React, { useState, useEffect, useMemo } from "react";
import { X, FlaskConical, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { LabOrder, ResultParameter } from "../types";
import { LAB_TEMPLATES, calculateFlag } from "../labTemplates";

interface TestResultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LabOrder | null;
  onSaveResults: (orderId: string, parameters: ResultParameter[], comment?: string) => Promise<void>;
}

export const TestResultEntryModal: React.FC<TestResultEntryModalProps> = ({
  isOpen,
  onClose,
  order,
  onSaveResults
}) => {
  const [parameters, setParameters] = useState<ResultParameter[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!order) return;

    if (order.results && order.results.parameters.length > 0) {
      setParameters(order.results.parameters);
      setComment(order.results.pathologistComment || "");
    } else {
      const tmpl = LAB_TEMPLATES[order.testCode];
      if (tmpl) {
        const initialParams: ResultParameter[] = tmpl.parameters.map(p => ({
          ...p,
          value: "",
          flag: "NORMAL"
        }));
        setParameters(initialParams);
      } else {
        // Generic fallback parameter
        setParameters([
          {
            name: "Result Finding",
            value: "",
            unit: "text",
            referenceRange: "Normal",
            flag: "NORMAL"
          }
        ]);
      }
      setComment("");
    }
  }, [order, isOpen]);

  const handleValueChange = (index: number, val: string) => {
    const updated = [...parameters];
    const target = updated[index];
    if (!target) return;

    const flag = calculateFlag(target, val);
    updated[index] = {
      ...target,
      value: val,
      flag
    };
    setParameters(updated);
  };

  const criticalFindings = useMemo(() => {
    return parameters.filter(p => p.flag === "CRITICAL" && p.value.trim() !== "");
  }, [parameters]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasValues = parameters.some(p => p.value.trim() !== "");
    if (!hasValues) {
      alert("Please enter at least one test parameter value.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveResults(order.id, parameters, comment);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save test results.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Enter Laboratory Test Results</h2>
              <p className="text-xs text-slate-500">
                {order.testName} ({order.testCode}) • {order.discipline.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient / Specimen Summary Bar */}
        <div className="px-6 py-3 bg-purple-50/60 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 text-sm">{order.patientName}</span>
            <span className="text-slate-600 ml-2">({order.hospitalNumber} • {order.age}y {order.gender})</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>Order: <strong>{order.orderNumber}</strong></span>
            {order.specimen && (
              <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                Barcode: {order.specimen.specimenBarcode}
              </span>
            )}
          </div>
        </div>

        {/* Critical alert banner */}
        {criticalFindings.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 space-y-0.5">
              <span className="font-bold block">CRITICAL VALUE ALERT DETECTED:</span>
              {criticalFindings.map((cf, idx) => (
                <div key={idx}>
                  • <strong>{cf.name}</strong>: {cf.value} {cf.unit} (Reference: {cf.referenceRange})
                </div>
              ))}
              <p className="text-[11px] text-red-700 mt-1 italic">
                This result will trigger mandatory immediate telephone escalation to the ordering physician upon verification.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Parameters Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider w-1/3">Parameter Name</th>
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider w-1/4">Observed Value</th>
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider">Reference Range</th>
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-center">Evaluation Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parameters.map((param, index) => {
                  const isCrit = param.flag === "CRITICAL";
                  const isHigh = param.flag === "HIGH";
                  const isLow = param.flag === "LOW";

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCrit ? "bg-red-50/50" : isHigh ? "bg-amber-50/30" : isLow ? "bg-blue-50/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {param.name}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={param.value}
                          onChange={e => handleValueChange(index, e.target.value)}
                          placeholder="Enter value..."
                          className={`w-full text-xs p-2 rounded-lg border focus:outline-none focus:ring-2 font-mono ${
                            isCrit
                              ? "border-red-500 bg-red-50 focus:ring-red-500 font-bold text-red-900"
                              : isHigh
                              ? "border-amber-500 bg-amber-50 focus:ring-amber-500 font-bold text-amber-900"
                              : isLow
                              ? "border-blue-500 bg-blue-50 focus:ring-blue-500 font-bold text-blue-900"
                              : "border-slate-300 focus:ring-purple-500"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {param.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {param.referenceRange}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isCrit
                              ? "bg-red-600 text-white animate-pulse"
                              : isHigh
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : isLow
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {param.flag}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Scientist Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              Bench Scientist Clinical Remarks / Microscopy Observations
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="e.g. Thick film positive for ring forms of P. falciparum. Moderate poikilocytosis noted on peripheral smear..."
              className="w-full text-xs border-slate-300 rounded-xl p-3 focus:ring-purple-500 focus:border-purple-500 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Analyst: <strong>MLS O. Balogun, BMLS</strong>
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
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save & Send for Pathologist Verification"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
