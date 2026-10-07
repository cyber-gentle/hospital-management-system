import React, { useState } from "react";
import { Users, Activity } from "lucide-react";
import { TriageQueueView } from "./components/TriageQueueView";
import { ConsultationDeskView } from "./components/ConsultationDeskView";

export const GopdView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"triage" | "consultation">("triage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">General Outpatient Department (GOPD)</h1>
          <p className="text-sm text-slate-500">Triage and Doctor Consultations</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("triage")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "triage"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            Triage Queue
          </button>
          <button
            onClick={() => setActiveTab("consultation")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "consultation"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Doctor Consultations
          </button>
        </div>

        <div className="p-6">
          {activeTab === "triage" ? (
            <TriageQueueView />
          ) : (
            <ConsultationDeskView />
          )}
        </div>
      </div>
    </div>
  );
};
