import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Building,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  CreateRequisitionRequest,
  Requisition,
  StockAdjustmentAuditEntry,
  StockAdjustmentRequest,
  Substore,
  SubstoreItem,
} from "./types";
import { substoreApi } from "./api";
import { SubstoreInventoryView } from "./components/SubstoreInventoryView";
import { NewRequisitionModal } from "./components/NewRequisitionModal";
import { RequisitionManagementView } from "./components/RequisitionManagementView";
import { StockAdjustmentModal } from "./components/StockAdjustmentModal";
import { StockAuditLogDrawer } from "./components/StockAuditLogDrawer";

export const SubstoreView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "INVENTORY" | "REQUISITIONS" | "AUDIT_LOGS"
  >("INVENTORY");

  const [substores, setSubstores] = useState<Substore[]>([]);
  const [selectedSubstoreId, setSelectedSubstoreId] = useState<string>("ALL");
  const [items, setItems] = useState<SubstoreItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [audits, setAudits] = useState<StockAdjustmentAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals & Drawers
  const [isReqModalOpen, setIsReqModalOpen] = useState<boolean>(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [adjustModalItem, setAdjustModalItem] = useState<SubstoreItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stores, itemList, reqs, auditHistory] = await Promise.all([
        substoreApi.getSubstores(),
        substoreApi.getSubstoreItems(selectedSubstoreId),
        substoreApi.getRequisitions(selectedSubstoreId),
        substoreApi.getAuditHistory(selectedSubstoreId),
      ]);
      setSubstores(stores);
      setItems(itemList);
      setRequisitions(reqs);
      setAudits(auditHistory);
    } catch (e) {
      console.error("Failed to load substore data", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubstoreId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Requisition submission (FR-SS-02)
  const handleCreateRequisition = async (req: CreateRequisitionRequest) => {
    const created = await substoreApi.createRequisition(req);
    showToast(`Requisition ${created.requisitionNumber} submitted to Central Store.`);
    await loadAllData();
  };

  // Handle Requisition fulfillment (FR-SS-02)
  const handleFulfillRequisition = async (reqId: string) => {
    const updated = await substoreApi.fulfillRequisition(reqId, "Central Store Dispatcher");
    showToast(`Requisition ${updated.requisitionNumber} fulfilled. Stock updated in ward!`);
    await loadAllData();
  };

  // Handle Stock Adjustment (FR-SS-04)
  const handleAdjustStock = async (req: StockAdjustmentRequest) => {
    const updated = await substoreApi.adjustStock(req);
    showToast(`Stock updated to ${updated.currentStock} units with permanent audit entry.`);
    await loadAllData();
  };

  // Metrics
  const lowStockCount = items.filter((i) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK").length;
  const pendingReqCount = requisitions.filter((r) => r.status === "SUBMITTED").length;
  const currentSubstore = substores.find((s) => s.id === selectedSubstoreId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold tracking-wide uppercase">
              Build Group 1 • §2.7
            </span>
            <span className="text-xs text-slate-500 font-medium">FR-SS-01 to FR-SS-04</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-cyan-600" />
            Sub-store & Ward Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Ward & theatre-level stock visibility, reorder threshold tracking, central store requisitions,
            and audit-logged physical inventory corrections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              substoreApi.resetToMockData();
              loadAllData();
              showToast("Sub-store inventory reset to demo baseline.");
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data
          </button>

          <button
            type="button"
            onClick={() => setIsAuditDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Audit Ledger (FR-SS-04)
          </button>

          <button
            type="button"
            onClick={() => setIsReqModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            New Requisition (FR-SS-02)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Ward Sub-stores</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{substores.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Wards & surgical theaters</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Tracked Item SKUs</span>
            <Boxes className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-700 mt-2">{items.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active consumables & pharmaceuticals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Reorder Point Alerts (FR-SS-03)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-2xl font-black mt-2 ${
              lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {lowStockCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Below ward reorder threshold</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Pending Requisitions</span>
            <PackageCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">{pendingReqCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">FR-SS-02 warehouse orders</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("INVENTORY")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "INVENTORY"
                ? "border-cyan-600 text-cyan-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Boxes className="w-4 h-4" />
            Ward Stock Inventory (FR-SS-01 & 03)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REQUISITIONS")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "REQUISITIONS"
                ? "border-cyan-600 text-cyan-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Central Store Requisitions (FR-SS-02)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("AUDIT_LOGS")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "AUDIT_LOGS"
                ? "border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Adjustment Audit Ledger (FR-SS-04)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading sub-store inventory & requisitions...
        </div>
      ) : (
        <>
          {/* Tab 1: WARD INVENTORY */}
          {activeTab === "INVENTORY" && (
            <SubstoreInventoryView
              substores={substores}
              selectedSubstoreId={selectedSubstoreId}
              onSelectSubstoreId={setSelectedSubstoreId}
              items={items}
              onAdjustStock={(item) => setAdjustModalItem(item)}
              onNewRequisition={() => setIsReqModalOpen(true)}
            />
          )}

      {/* Tab 2: CENTRAL STORE REQUISITIONS */}
      {activeTab === "REQUISITIONS" && (
        <RequisitionManagementView
          requisitions={requisitions}
          onFulfill={handleFulfillRequisition}
          onNewRequisition={() => setIsReqModalOpen(true)}
        />
      )}

      {/* Tab 3: AUDIT LEDGER */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              FR-SS-04: Mandatory Stock Adjustment Audit Trail
            </h3>
            <span className="text-[11px] text-slate-500">Immutable ledger entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp & Adjuster</th>
                  <th className="py-3 px-4">Sub-store Ward</th>
                  <th className="py-3 px-4">Item SKU & Name</th>
                  <th className="py-3 px-4 text-center">Previous Qty</th>
                  <th className="py-3 px-4 text-center">New Qty</th>
                  <th className="py-3 px-4 text-center">Variance</th>
                  <th className="py-3 px-4">Reason & Mandatory Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {audits.map((aud) => (
                  <tr key={aud.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{aud.adjustedBy}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(aud.adjustedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-semibold">{aud.substoreName}</td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{aud.itemCode}</div>
                      <div className="text-[11px] text-slate-600">{aud.itemName}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">{aud.previousQty}</td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      {aud.newQty}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span
                        className={
                          aud.differenceQty > 0
                            ? "text-emerald-600"
                            : aud.differenceQty < 0
                            ? "text-rose-600"
                            : "text-slate-500"
                        }
                      >
                        {aud.differenceQty > 0 ? `+${aud.differenceQty}` : aud.differenceQty}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 block w-fit mb-1">
                        {aud.reason.replace(/_/g, " ")}
                      </span>
                      <p className="text-slate-700 text-xs italic">"{aud.auditExplanation}"</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Modals & Drawers */}
      <NewRequisitionModal
        isOpen={isReqModalOpen}
        substores={substores}
        selectedSubstoreId={selectedSubstoreId}
        itemsCatalog={items}
        onClose={() => setIsReqModalOpen(false)}
        onSubmit={handleCreateRequisition}
      />

      <StockAdjustmentModal
        isOpen={adjustModalItem !== null}
        item={adjustModalItem}
        substoreName={currentSubstore?.name || "Ward Sub-store"}
        onClose={() => setAdjustModalItem(null)}
        onSubmit={handleAdjustStock}
      />

      <StockAuditLogDrawer
        isOpen={isAuditDrawerOpen}
        audits={audits}
        onClose={() => setIsAuditDrawerOpen(false)}
      />
    </div>
  );
};
