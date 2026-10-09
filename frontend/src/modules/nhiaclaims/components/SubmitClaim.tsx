import React, { useState, useEffect, useMemo } from "react";
import { FilePlus, Calculator, Send, AlertCircle } from "lucide-react";
import { nhiaApi } from "../api";
import { Tariff } from "../types";

export const SubmitClaim: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [patientName, setPatientName] = useState("");
  const [nhiaNumber, setNhiaNumber] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedTariffId, setSelectedTariffId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    nhiaApi.getTariffs().then(setTariffs).catch(console.error);
  }, []);

  const selectedTariff = useMemo(() => tariffs.find(t => t.id === selectedTariffId), [tariffs, selectedTariffId]);

  const totalAmount = selectedTariff ? selectedTariff.nhiaPrice : 0;
  const coPayAmount = selectedTariff ? (selectedTariff.nhiaPrice * selectedTariff.coPayPercentage) / 100 : 0;
  const claimAmount = totalAmount - coPayAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !nhiaNumber || !diagnosis || !selectedTariffId) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await nhiaApi.submitClaim({
        patientName,
        nhiaNumber,
        diagnosis,
        totalAmount,
        coPayAmount,
        claimAmount,
        providerId: "HMO-1",
      });
      onSuccess(); // Switch back to claims tab to see the new claim
    } catch (err: any) {
      setError(err.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <FilePlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Generate New Claim</h2>
          <p className="text-slate-500 text-sm">Fill in the patient and service details to submit a new HMO claim.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Patient Name</span>
            <input 
              required
              type="text" 
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. Jane Doe"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">NHIA Number</span>
            <input 
              required
              type="text" 
              value={nhiaNumber}
              onChange={e => setNhiaNumber(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. NHIA-9876543"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Diagnosis</span>
          <input 
            required
            type="text" 
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            placeholder="e.g. Severe Malaria"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Service Rendered (Tariff)</span>
          <select 
            required
            value={selectedTariffId}
            onChange={e => setSelectedTariffId(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="" disabled>Select a service...</option>
            {tariffs.map(t => (
              <option key={t.id} value={t.id}>
                {t.serviceCode} - {t.description} (₦{t.nhiaPrice.toLocaleString()})
              </option>
            ))}
          </select>
        </label>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4" /> Billing Summary
          </h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Service Cost</span>
            <span className="font-medium">₦{totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Patient Co-Pay ({selectedTariff?.coPayPercentage || 0}%)</span>
            <span className="font-medium text-red-600">-₦{coPayAmount.toLocaleString()}</span>
          </div>
          <div className="h-px bg-slate-200 my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span className="text-slate-800">HMO Claim Amount</span>
            <span className="text-indigo-600">₦{claimAmount.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={submitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            {submitting ? "Submitting..." : "Submit Claim"}
          </button>
        </div>
      </form>
    </div>
  );
};
