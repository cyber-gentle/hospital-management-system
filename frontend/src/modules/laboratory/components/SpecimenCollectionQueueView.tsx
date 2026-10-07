import React, { useState } from "react";
import {
  Pipette,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Printer
} from "lucide-react";
import { LabOrder } from "../types";
import { LAB_TEMPLATES } from "../labTemplates";
import { SpecimenBarcodeModal } from "./SpecimenBarcodeModal";

interface SpecimenCollectionQueueViewProps {
  orders: LabOrder[];
  onCollect: (orderId: string, details: { sampleType: string; containerType: string; collectedBy: string }) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export const SpecimenCollectionQueueView: React.FC<SpecimenCollectionQueueViewProps> = ({
  orders,
  onCollect,
  onReject,
  onRefresh,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<"PENDING" | "COLLECTED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("ALL");
  const [selectedBarcodeOrder, setSelectedBarcodeOrder] = useState<LabOrder | null>(null);

  // Collect Modal state
  const [collectingOrder, setCollectingOrder] = useState<LabOrder | null>(null);
  const [collectorName, setCollectorName] = useState("Phleb. T. Ajayi");
  const [sampleType, setSampleType] = useState("Whole Blood");
  const [containerType, setContainerType] = useState("EDTA Purple Top");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reject Modal state
  const [rejectingOrder, setRejectingOrder] = useState<LabOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("Hemolyzed sample");
  const [customRejectReason, setCustomRejectReason] = useState("");

  const handleOpenCollect = (order: LabOrder) => {
    setCollectingOrder(order);
    const tmpl = LAB_TEMPLATES[order.testCode];
    if (tmpl) {
      setSampleType(tmpl.sampleType);
      setContainerType(tmpl.containerType);
    } else {
      setSampleType("Whole Blood");
      setContainerType("EDTA Purple Top");
    }
  };

  const handleConfirmCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingOrder) return;

    setIsSubmitting(true);
    try {
      await onCollect(collectingOrder.id, {
        sampleType,
        containerType,
        collectedBy: collectorName
      });
      const orderCopy = { ...collectingOrder };
      setCollectingOrder(null);
      // Auto open barcode modal for convenience
      setSelectedBarcodeOrder({
        ...orderCopy,
        specimen: {
          specimenBarcode: "SMP-" + Math.floor(10000 + Math.random() * 90000),
          sampleType,
          containerType,
          collectedAt: new Date().toISOString(),
          collectedBy: collectorName
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    const finalReason = rejectReason === "Other" ? customRejectReason.trim() : rejectReason;
    if (!finalReason) return;

    setIsSubmitting(true);
    try {
      await onReject(rejectingOrder.id, finalReason);
      setRejectingOrder(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const filteredOrders = orders
    .filter(order => {
      if (activeTab === "PENDING" && order.status !== "PENDING_COLLECTION") return false;
      if (activeTab === "COLLECTED" && order.status !== "SPECIMEN_COLLECTED") return false;
      if (filterDiscipline !== "ALL" && order.discipline !== filterDiscipline) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = order.patientName.toLowerCase().includes(q);
        const matchHosp = order.hospitalNumber.toLowerCase().includes(q);
        const matchOrder = order.orderNumber.toLowerCase().includes(q);
        const matchTest = order.testName.toLowerCase().includes(q);
        if (!matchName && !matchHosp && !matchOrder && !matchTest) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const urgencyRank: Record<string, number> = { STAT: 1, URGENT: 2, ROUTINE: 3 };
      return (urgencyRank[a.urgency] || 9) - (urgencyRank[b.urgency] || 9);
    });

  const pendingCount = orders.filter(o => o.status === "PENDING_COLLECTION").length;
  const collectedCount = orders.filter(o => o.status === "SPECIMEN_COLLECTED").length;

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Specimen Collection & Intake</h2>
          <p className="text-xs text-slate-500">Phlebotomy intake, specimen accessioning, and barcode tube labelling</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
          Refresh Worklist
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "PENDING"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Awaiting Collection
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "PENDING" ? "bg-purple-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("COLLECTED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "COLLECTED"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Collected Specimens
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "COLLECTED" ? "bg-purple-800 text-white" : "bg-slate-200 text-slate-700"}`}>
              {collectedCount}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Discipline selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDiscipline}
              onChange={e => setFilterDiscipline(e.target.value)}
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
              placeholder="Search patient, order #, or test..."
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
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Info</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Test & Discipline</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Required Tube</th>
                <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const tmpl = LAB_TEMPLATES[order.testCode];
                const tube = order.specimen?.containerType || tmpl?.containerType || "Standard Container";
                const isStat = order.urgency === "STAT";
                const isUrgent = order.urgency === "URGENT";

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isStat ? "bg-red-50/30" : isUrgent ? "bg-amber-50/20" : ""
                    }`}
                  >
                    {/* Order Info */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-xs text-slate-800">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="text-slate-300">•</span>
                        <span>{order.originDepartment}</span>
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-slate-900">{order.patientName}</div>
                      <div className="text-xs text-slate-500">
                        {order.hospitalNumber} • {order.age}y {order.gender}
                      </div>
                    </td>

                    {/* Test & Discipline */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-slate-900">{order.testName}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
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

                    {/* Required Container Tube */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs">
                      <div className="font-semibold text-slate-800">{tube}</div>
                      {order.specimen && (
                        <div className="text-[11px] font-mono text-purple-700 font-bold mt-0.5">
                          Barcode: {order.specimen.specimenBarcode}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      {order.status === "PENDING_COLLECTION" ? (
                        <>
                          <button
                            onClick={() => setRejectingOrder(order)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleOpenCollect(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                          >
                            <Pipette className="w-3.5 h-3.5" />
                            Collect Specimen
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedBarcodeOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Reprint Label
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Pipette className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No specimen orders in this worklist</p>
                    <p className="text-xs text-slate-400">All current orders have been processed or none match the filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Specimen Modal */}
      {collectingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pipette className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Collect Specimen</h3>
              </div>
              <button
                onClick={() => setCollectingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCollect} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900">{collectingOrder.patientName} ({collectingOrder.hospitalNumber})</div>
                <div className="text-slate-600">Order: <strong>{collectingOrder.testName}</strong> ({collectingOrder.testCode})</div>
                <div className="text-slate-500">Origin: {collectingOrder.originDepartment} • Doctor: {collectingOrder.orderingDoctor}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sample Type</label>
                <input
                  type="text"
                  required
                  value={sampleType}
                  onChange={e => setSampleType(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Container Tube Type</label>
                <input
                  type="text"
                  required
                  value={containerType}
                  onChange={e => setContainerType(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Collected By (Phlebotomist / Nurse)</label>
                <input
                  type="text"
                  required
                  value={collectorName}
                  onChange={e => setCollectorName(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCollectingOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? "Generating Barcode..." : "Confirm & Print Barcode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Specimen Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Reject Specimen Order</h3>
              </div>
              <button
                onClick={() => setRejectingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Specify the clinical reason for rejecting specimen collection for <strong>{rejectingOrder.patientName}</strong> ({rejectingOrder.testName}):
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Hemolyzed sample">Hemolyzed sample</option>
                  <option value="Clotted EDTA specimen">Clotted EDTA specimen</option>
                  <option value="Insufficient volume (QNS)">Insufficient volume (QNS)</option>
                  <option value="Wrong container type">Wrong container type used</option>
                  <option value="Mislabeled or unlabelled container">Mislabeled or unlabelled container</option>
                  <option value="Leaking or broken container">Leaking or broken container</option>
                  <option value="Patient uncooperative / refused draw">Patient uncooperative / refused draw</option>
                  <option value="Other">Other (Specify below)</option>
                </select>
              </div>

              {rejectReason === "Other" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Details</label>
                  <textarea
                    rows={2}
                    required
                    value={customRejectReason}
                    onChange={e => setCustomRejectReason(e.target.value)}
                    placeholder="Enter reason details..."
                    className="w-full text-sm border-slate-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      <SpecimenBarcodeModal
        isOpen={!!selectedBarcodeOrder}
        onClose={() => setSelectedBarcodeOrder(null)}
        order={selectedBarcodeOrder}
      />
    </div>
  );
};
