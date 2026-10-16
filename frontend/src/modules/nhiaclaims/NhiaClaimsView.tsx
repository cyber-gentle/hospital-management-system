import { DEMO_MODE } from "../../lib/demo";
import { ModuleAvailability } from "../../components/ModuleAvailability";
import React, { useState, useEffect } from "react";
import { ShieldCheck, FileText, CheckCircle, Tag, PlusCircle, ArrowLeft } from "lucide-react";
import { nhiaApi } from "./api";
import { NhiaClaim, HmoProvider } from "./types";
import { EligibilityCheck } from "./components/EligibilityCheck";
import { TariffMapping } from "./components/TariffMapping";
import { SubmitClaim } from "./components/SubmitClaim";

interface NhiaClaimsViewProps {
  onBackToDashboard?: () => void;
}

export const NhiaClaimsView: React.FC<NhiaClaimsViewProps> = ({ onBackToDashboard }) => {
  const [offset, setOffset] = useState(0);
  const [providers, setProviders] = useState<HmoProvider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<NhiaClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"eligibility" | "claims" | "tariffs" | "submit" | "providers">(DEMO_MODE ? "eligibility" : "claims");

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'providers') {
          const data = await nhiaApi.getProviders();
          if (!cancelled) setProviders(data);
        } else {
          const data = await nhiaApi.getClaims(offset);
          if (!cancelled) setClaims(data);
        }
      } catch (err) {
        if (cancelled) return;
        setClaims([]); setProviders([]);
        setError(err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String(err.message) : 'NHIA data could not be loaded');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (activeTab === "claims" || activeTab === "providers") {
      loadData();
    }
    return () => { cancelled = true; };
  }, [activeTab, offset]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            NHIA / HMO Claims Management
          </h1>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        <button type="button" onClick={() => setActiveTab('providers')} className="px-4 py-2 rounded-lg font-medium text-sm">Providers</button>
        <button
          onClick={() => setActiveTab("eligibility")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "eligibility" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Eligibility Check
        </button>
        <button
          onClick={() => setActiveTab("tariffs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "tariffs" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Tag className="w-4 h-4" />
          Tariff Mapping
        </button>
        <button
          onClick={() => setActiveTab("submit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "submit" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Submit Claim
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "claims" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          Claims History
        </button>
      </div>

      {activeTab === "eligibility" && (
        DEMO_MODE ? <EligibilityCheck /> : <ModuleAvailability name="Eligibility verification" reason="An eligibility provider and verification contract must be configured before coverage can be checked." />
      )}

      {activeTab === "tariffs" && (
        DEMO_MODE ? <TariffMapping /> : <ModuleAvailability name="Tariffs" reason="Approved hospital tariffs and covered-service mappings have not been configured." />
      )}

      {activeTab === "submit" && (
        <div className="flex justify-center">
          {DEMO_MODE ? <SubmitClaim onSuccess={() => setActiveTab("claims")} /> : <ModuleAvailability name="Claim submission" reason="Invoice-linked claim validation and approved tariff mappings are required before new claims can be submitted from this screen." />}
        </div>
      )}

      {activeTab === 'providers' && !error && (
        loading ? <p role="status">Loading providers...</p> : <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold">HMO providers</h2>
          {providers.length === 0 ? <p className="mt-3">No providers configured.</p> : <ul className="mt-3 space-y-3">{providers.map(provider => <li key={provider.id}><strong>{provider.name}</strong> — {provider.code} ({provider.active ? 'Active' : 'Inactive'})</li>)}</ul>}
        </div>
      )}
      {activeTab === "claims" && !error && (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading claims...</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-medium">Claim ID</th>
                    <th className="p-4 font-medium">Patient</th>
                    <th className="p-4 font-medium">{DEMO_MODE ? 'Diagnosis' : 'Invoice reference'}</th>
                    <th className="p-4 font-medium">{DEMO_MODE ? 'Total' : 'Claim amount'}</th>
                    <th className="p-4 font-medium">{DEMO_MODE ? 'Co-Pay' : 'Provider reference'}</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {claims.map(claim => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="p-4 text-blue-600 font-medium">{claim.id}</td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{claim.patientName}</div>
                        <div className="text-gray-500 text-xs">{claim.nhiaNumber}</div>
                      </td>
                      <td className="p-4 text-gray-600">{DEMO_MODE ? claim.diagnosis : claim.invoiceId}</td>
                      <td className="p-4 text-gray-900 font-medium">₦{Number(DEMO_MODE ? claim.totalAmount : claim.claimAmount).toLocaleString('en-NG', {minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                      <td className="p-4 text-red-600">{DEMO_MODE ? `₦${claim.coPayAmount?.toLocaleString() ?? 'Unavailable'}` : claim.providerId}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <FileText className="w-3.5 h-3.5" />
                          {claim.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {claims.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No claims found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-4 border-t">
                <button type="button" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - 100))}>Previous</button>
                <span className="text-sm text-slate-500">Page {offset / 100 + 1} — up to 100 claims</span>
                <button type="button" disabled={claims.length < 100 || loading} onClick={() => setOffset(offset + 100)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
