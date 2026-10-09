import React, { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, Activity, User, CreditCard, Calendar } from "lucide-react";
import { nhiaApi } from "../api";
import { EligibilityResult } from "../types";

export const EligibilityCheck: React.FC = () => {
  const [nhiaNumber, setNhiaNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [error, setError] = useState("");

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nhiaNumber.trim()) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await nhiaApi.checkEligibility(nhiaNumber);
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify eligibility";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Verify Enrollee Eligibility</h2>
          <p className="text-slate-500 text-sm mb-6">Enter the patient's NHIA Number to check their HMO status and plan details instantly.</p>
          
          <form onSubmit={handleCheck} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={nhiaNumber}
                onChange={e => setNhiaNumber(e.target.value)}
                placeholder="e.g. NHIA-1234567"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !nhiaNumber.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Verify
                </>
              )}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-3 animate-pulse">{error}</p>}
        </div>
      </div>

      {result && (
        <div className={`rounded-2xl p-6 border shadow-sm transition-all duration-500 animate-in zoom-in-95 ${
          result.status === 'ACTIVE' 
            ? 'bg-emerald-50/50 border-emerald-100/60' 
            : 'bg-red-50/50 border-red-100/60'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                result.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {result.status === 'ACTIVE' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{result.patientName}</h3>
                <p className="text-slate-500 font-medium">{result.nhiaNumber}</p>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full font-semibold text-sm tracking-wide ${
              result.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {result.status}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Provider</p>
                <p className="font-medium text-slate-800">{result.hmoProviderName}</p>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><CreditCard className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Plan Type</p>
                <p className="font-medium text-slate-800">{result.planType}</p>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Calendar className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Expiry Date</p>
                <p className="font-medium text-slate-800">{new Date(result.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
