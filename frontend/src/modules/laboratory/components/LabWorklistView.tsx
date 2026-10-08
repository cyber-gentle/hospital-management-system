import React, { useState } from "react";
import {
  FlaskConical,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  Printer
} from "lucide-react";
import { LabOrder, ResultParameter } from "../types";
import { TestResultEntryModal } from "./TestResultEntryModal";
import { PathologistSignOffModal } from "./PathologistSignOffModal";

interface LabWorklistViewProps {
  orders: LabOrder[];
  onStartAnalysis: (orderId: string) => Promise<void>;
  onSaveResults: (orderId: string, parameters: ResultParameter[], comment?: string) => Promise<void>;
  onVerifyResults: (orderId: string, comment?: string) => Promise<void>;
  onEscalateCritical: (orderId: string, doctorName: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export const LabWorklistView: React.FC<LabWorklistViewProps> = ({
  orders,
  onStartAnalysis,
  onSaveResults,
  onVerifyResults,
  onEscalateCritical,
  onRefresh,
  loading
}) => {
  const [disciplineFilter, setDisciplineFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeResultOrder, setActiveResultOrder] = useState<LabOrder | null>(null);
  const [activeVerifyOrder, setActiveVerifyOrder] = useState<LabOrder | null>(null);
  const [activeViewReportOrder, setActiveViewReportOrder] = useState<LabOrder | null>(null);

  // Filter
  const filteredOrders = orders
    .filter(order => {
      // Exclude orders that haven't had their specimen collected yet or rejected
      if (order.status === "PENDING_COLLECTION" || order.status === "REJECTED") return false;

      if (statusFilter === "ACTIVE") {
        if (order.status !== "SPECIMEN_COLLECTED" && order.status !== "IN_ANALYSIS" && order.status !== "AWAITING_VERIFICATION") return false;
      } else if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      if (disciplineFilter !== "ALL" && order.discipline !== disciplineFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = order.patientName.toLowerCase().includes(q);
        const matchHosp = order.hospitalNumber.toLowerCase().includes(q);
        const matchOrder = order.orderNumber.toLowerCase().includes(q);
        const matchTest = order.testName.toLowerCase().includes(q);
        const matchBarcode = order.specimen?.specimenBarcode.toLowerCase().includes(q);
        if (!matchName && !matchHosp && !matchOrder && !matchTest && !matchBarcode) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const urgencyRank: Record<string, number> = { STAT: 1, URGENT: 2, ROUTINE: 3 };
      return (urgencyRank[a.urgency] || 9) - (urgencyRank[b.urgency] || 9);
    });

  const inAnalysisCount = orders.filter(o => o.status === "IN_ANALYSIS" || o.status === "SPECIMEN_COLLECTED").length;
  const awaitingVerifyCount = orders.filter(o => o.status === "AWAITING_VERIFICATION").length;
  const completedCount = orders.filter(o => o.status === "COMPLETED").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Laboratory Bench Worklist</h2>
          <p className="text-xs text-slate-500">
            Specimen analysis, parameter quantification, and pathologist sign-off
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "ACTIVE"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            In Bench Analysis
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === "ACTIVE" ? "bg-purple-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {inAnalysisCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("AWAITING_VERIFICATION")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "AWAITING_VERIFICATION"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Awaiting Verification
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === "AWAITING_VERIFICATION" ? "bg-purple-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {awaitingVerifyCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "COMPLETED"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Completed Reports
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === "COMPLETED" ? "bg-purple-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {completedCount}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Discipline */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={disciplineFilter}
              onChange={e => setDisciplineFilter(e.target.value)}
              className="text-xs border-slate-200 rounded-lg py-1.5 pl-2 pr-6 text-slate-700 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">All Disciplines</option>
              <option value="HEMATOLOGY">Hematology</option>
              <option value="CHEMICAL_PATHOLOGY">Chemical Pathology</option>
              <option value="MICROBIOLOGY">Microbiology</option>
              <option value="PARASITOLOGY">Parasitology</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search barcode, patient, or test..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode & Order</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Test & Discipline</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Bench Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const isStat = order.urgency === "STAT";
                const isUrgent = order.urgency === "URGENT";

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isStat ? "bg-red-50/30" : isUrgent ? "bg-amber-50/20" : ""
                    }`}
                  >
                    {/* Barcode & Order */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded inline-block">
                        {order.specimen?.specimenBarcode || "NO-BARCODE"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {order.orderNumber}
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-slate-900">{order.patientName}</div>
                      <div className="text-xs text-slate-500">
                        {order.hospitalNumber} • {order.age}y {order.gender}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Dept: {order.originDepartment} • Dr: {order.orderingDoctor}
                      </div>
                    </td>

                    {/* Test & Discipline */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-slate-900">{order.testName}</div>
                      <span className="text-[10px] font-bold text-purple-700">
                        {order.discipline.replace("_", " ")}
                      </span>
                    </td>

                    {/* Urgency */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isStat
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : isUrgent
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {isStat && <AlertCircle className="w-3 h-3 text-red-600" />}
                        {order.urgency}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          order.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : order.status === "AWAITING_VERIFICATION"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : order.status === "IN_ANALYSIS"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-purple-100 text-purple-800 border border-purple-200"
                        }`}
                      >
                        {order.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {order.status === "AWAITING_VERIFICATION" && <FileCheck className="w-3 h-3 text-amber-600" />}
                        {order.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Bench Action */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {order.status === "SPECIMEN_COLLECTED" && (
                        <button
                          onClick={() => onStartAnalysis(order.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                        >
                          Begin Testing
                        </button>
                      )}

                      {order.status === "IN_ANALYSIS" && (
                        <button
                          onClick={() => setActiveResultOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          Enter Results
                        </button>
                      )}

                      {order.status === "AWAITING_VERIFICATION" && (
                        <button
                          onClick={() => setActiveVerifyOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verify & Sign Off
                        </button>
                      )}

                      {order.status === "COMPLETED" && (
                        <button
                          onClick={() => setActiveViewReportOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          View Report
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FlaskConical className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No laboratory tests found</p>
                    <p className="text-xs text-slate-400">No active tests matching current filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Entry Modal */}
      <TestResultEntryModal
        isOpen={!!activeResultOrder}
        onClose={() => setActiveResultOrder(null)}
        order={activeResultOrder}
        onSaveResults={onSaveResults}
      />

      {/* Pathologist Sign-Off Modal */}
      <PathologistSignOffModal
        isOpen={!!activeVerifyOrder}
        onClose={() => setActiveVerifyOrder(null)}
        order={activeVerifyOrder}
        onVerify={onVerifyResults}
        onEscalate={onEscalateCritical}
      />

      {/* Completed Report Preview Modal */}
      {activeViewReportOrder && activeViewReportOrder.results && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Authorized Laboratory Diagnostic Report</h3>
              </div>
              <button
                onClick={() => setActiveViewReportOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between text-xs">
                <div>
                  <div className="font-bold text-sm text-slate-900">{activeViewReportOrder.patientName}</div>
                  <div className="text-slate-500 mt-0.5">{activeViewReportOrder.hospitalNumber} • {activeViewReportOrder.age}y {activeViewReportOrder.gender}</div>
                  <div className="text-slate-500 mt-0.5">Doctor: {activeViewReportOrder.orderingDoctor} ({activeViewReportOrder.originDepartment})</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-700">{activeViewReportOrder.orderNumber}</div>
                  <div className="font-mono text-purple-700 font-bold mt-0.5">Barcode: {activeViewReportOrder.specimen?.specimenBarcode}</div>
                  <div className="text-slate-500 mt-0.5">Completed: {new Date(activeViewReportOrder.completedAt || activeViewReportOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Parameters List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Test Parameter</th>
                      <th className="px-4 py-2.5">Result</th>
                      <th className="px-4 py-2.5">Units</th>
                      <th className="px-4 py-2.5">Biological Reference Interval</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeViewReportOrder.results.parameters.map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{p.name}</td>
                        <td className="px-4 py-2.5 font-bold font-mono text-slate-900">{p.value}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.unit}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono">{p.referenceRange}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.flag === "CRITICAL"
                                ? "bg-red-600 text-white"
                                : p.flag === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : p.flag === "LOW"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {p.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist comment */}
              {activeViewReportOrder.results.pathologistComment && (
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-purple-900">Pathologist Interpretive Remarks:</span>
                  <p className="text-slate-700 italic">{activeViewReportOrder.results.pathologistComment}</p>
                </div>
              )}

              {/* Signature stamp */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center text-emerald-900">
                <div>
                  <div>Verified by: <strong>{activeViewReportOrder.results.verifiedBy || "Dr. F. Alabi, FMCPath"}</strong></div>
                  <div className="text-[11px] text-emerald-700">Timestamp: {new Date(activeViewReportOrder.results.verifiedAt || "").toLocaleString()}</div>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300">
                  DIGITALLY SIGNED & AUTHORIZED
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveViewReportOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Clinical Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
