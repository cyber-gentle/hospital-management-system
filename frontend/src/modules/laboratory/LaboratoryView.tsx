import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Pipette,
  FileCheck,
  CheckCircle2,
  Clock,
  RotateCcw
} from "lucide-react";
import { laboratoryApi } from "./api";
import { LabOrder, ResultParameter } from "./types";
import { SpecimenCollectionQueueView } from "./components/SpecimenCollectionQueueView";
import { LabWorklistView } from "./components/LabWorklistView";

export const LaboratoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"collection" | "worklist">("collection");
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await laboratoryApi.getOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCollectSpecimen = async (
    orderId: string,
    details: { sampleType: string; containerType: string; collectedBy: string }
  ) => {
    await laboratoryApi.collectSpecimen(orderId, details);
    showToast("Specimen collected and barcode generated successfully.");
    await loadOrders();
  };

  const handleRejectSpecimen = async (orderId: string, reason: string) => {
    await laboratoryApi.rejectSpecimen(orderId, reason);
    showToast("Specimen rejected and flagged in order log.");
    await loadOrders();
  };

  const handleStartAnalysis = async (orderId: string) => {
    await laboratoryApi.startAnalysis(orderId);
    showToast("Specimen moved to bench analysis.");
    await loadOrders();
  };

  const handleSaveResults = async (
    orderId: string,
    parameters: ResultParameter[],
    comment?: string
  ) => {
    await laboratoryApi.saveTestResults(orderId, parameters, comment);
    showToast("Test parameters saved. Order submitted for Pathologist Verification.");
    await loadOrders();
  };

  const handleVerifyResults = async (orderId: string, comment?: string) => {
    await laboratoryApi.verifyResults(orderId, comment);
    showToast("Laboratory report verified, authorized, and signed off.");
    await loadOrders();
  };

  const handleEscalateCritical = async (orderId: string, doctorName: string) => {
    await laboratoryApi.escalateCritical(orderId, doctorName);
    showToast(`Critical finding telephone notification logged to Dr. ${doctorName}.`);
    await loadOrders();
  };

  const handleResetData = async () => {
    if (confirm("Reset laboratory orders to default demo data?")) {
      const fresh = await laboratoryApi.resetOrders();
      setOrders(fresh);
      showToast("Laboratory data reset to default demo records.");
    }
  };

  // Metrics
  const pendingCollectionCount = orders.filter(o => o.status === "PENDING_COLLECTION").length;
  const inAnalysisCount = orders.filter(o => o.status === "IN_ANALYSIS" || o.status === "SPECIMEN_COLLECTED").length;
  const awaitingVerifyCount = orders.filter(o => o.status === "AWAITING_VERIFICATION").length;
  const completedCount = orders.filter(o => o.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Laboratory Information System (LIS)
              </h1>
              <p className="text-xs text-slate-500">
                Specimen accessioning, diagnostic bench analysis, and pathologist authorization
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetData}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          title="Reset to initial mock orders"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
            <Pipette className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{pendingCollectionCount}</div>
            <div className="text-xs font-semibold text-slate-500">Awaiting Specimen</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{inAnalysisCount}</div>
            <div className="text-xs font-semibold text-slate-500">In Bench Analysis</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{awaitingVerifyCount}</div>
            <div className="text-xs font-semibold text-slate-500">Awaiting Sign-Off</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{completedCount}</div>
            <div className="text-xs font-semibold text-slate-500">Authorized Reports</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("collection")}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "collection"
                ? "border-purple-600 text-purple-700 bg-purple-50/40"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <Pipette className="w-4 h-4" />
            Specimen Collection & Accessioning
            {pendingCollectionCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 ml-1">
                {pendingCollectionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("worklist")}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "worklist"
                ? "border-purple-600 text-purple-700 bg-purple-50/40"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Bench Testing & Verification
            {awaitingVerifyCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 ml-1">
                {awaitingVerifyCount}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === "collection" ? (
            <SpecimenCollectionQueueView
              orders={orders}
              onCollect={handleCollectSpecimen}
              onReject={handleRejectSpecimen}
              onRefresh={loadOrders}
              loading={loading}
            />
          ) : (
            <LabWorklistView
              orders={orders}
              onStartAnalysis={handleStartAnalysis}
              onSaveResults={handleSaveResults}
              onVerifyResults={handleVerifyResults}
              onEscalateCritical={handleEscalateCritical}
              onRefresh={loadOrders}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};
