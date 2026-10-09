import React, { useState, useEffect } from "react";
import { ShieldCheck, FileText, CheckCircle, Tag, PlusCircle, ArrowLeft } from "lucide-react";
import { nhiaApi } from "./api";
import { NhiaClaim } from "./types";
import { EligibilityCheck } from "./components/EligibilityCheck";
import { TariffMapping } from "./components/TariffMapping";
import { SubmitClaim } from "./components/SubmitClaim";

interface NhiaClaimsViewProps {
  onBackToDashboard?: () => void;
}

export const NhiaClaimsView: React.FC<NhiaClaimsViewProps> = ({ onBackToDashboard }) => {
  const [claims, setClaims] = useState<NhiaClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"eligibility" | "claims" | "tariffs" | "submit">("eligibility");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await nhiaApi.getClaims();
        setClaims(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === "claims") {
      loadData();
    }
  }, [activeTab]);

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

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
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
        <EligibilityCheck />
      )}

      {activeTab === "tariffs" && (
        <TariffMapping />
      )}

      {activeTab === "submit" && (
        <div className="flex justify-center">
          <SubmitClaim onSuccess={() => setActiveTab("claims")} />
        </div>
      )}

      {activeTab === "claims" && (
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
                    <th className="p-4 font-medium">Diagnosis</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Co-Pay</th>
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
                      <td className="p-4 text-gray-600">{claim.diagnosis}</td>
                      <td className="p-4 text-gray-900 font-medium">₦{claim.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-red-600">₦{claim.coPayAmount.toLocaleString()}</td>
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
            </div>
          )}
        </>
      )}
    </div>
  );
};
