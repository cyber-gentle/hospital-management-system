import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  FileText,
  Truck,
  Send,
  AlertTriangle,
  XCircle,
  Coins,
  CheckCircle2,
  RefreshCw,
  Building,
} from 'lucide-react';
import {
  GoodsReceiptNote,
  InventoryItem,
  InventoryMetrics,
  PurchaseOrder,
  SubstoreIssuance,
  Vendor,
} from './types';
import { inventoryApi } from './api';
import { CatalogListView } from './components/CatalogListView';
import { PurchaseOrderListView } from './components/PurchaseOrderListView';
import { GoodsReceiptListView } from './components/GoodsReceiptListView';
import { SubstoreIssuanceListView } from './components/SubstoreIssuanceListView';

export const InventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'ORDERS' | 'GRN' | 'ISSUANCES'>('CATALOG');

  // Data states
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);
  const [issuances, setIssuances] = useState<SubstoreIssuance[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemList, vendorList, poList, grnList, issuanceList, metricData] = await Promise.all([
        inventoryApi.getItems(),
        inventoryApi.getVendors(),
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getGoodsReceiptNotes(),
        inventoryApi.getSubstoreIssuances(),
        inventoryApi.getInventoryMetrics(),
      ]);
      setItems(itemList);
      setVendors(vendorList);
      setPos(poList);
      setGrns(grnList);
      setIssuances(issuanceList);
      setMetrics(metricData);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers
  const handleItemUpdated = (updatedItem: InventoryItem) => {
    showToast(`Inventory item "${updatedItem.name}" updated successfully.`);
    loadAllData();
  };

  const handlePOCreated = (newPO: PurchaseOrder) => {
    showToast(`Purchase Order ${newPO.poNumber} created (${newPO.totalAmount}).`);
    loadAllData();
  };

  const handlePOUpdated = (updatedPO: PurchaseOrder) => {
    showToast(`Purchase Order ${updatedPO.poNumber} updated to status "${updatedPO.status}".`);
    loadAllData();
  };

  const handleGRNCreated = (newGRN: GoodsReceiptNote) => {
    showToast(`Goods Receipt ${newGRN.grnNumber} signed. Stock ledger balances updated!`);
    loadAllData();
  };

  const handleIssuanceCreated = (newIssuance: SubstoreIssuance) => {
    showToast(`Buffer supplies dispatched to ${newIssuance.targetDepartment}. Warehouse balance decremented.`);
    loadAllData();
  };

  // Approved POs eligible for GRN receipt
  const approvedPOs = pos.filter(
    (p) => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED'
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast alert notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 rounded-xl shadow-2xl animate-fade-in text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Inventory & Procurement
              </h1>
              <p className="text-xs text-slate-400">
                Central Medical Store, Supplier Purchase Orders, Batch Quality Intake & Sub-store Distribution
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Catalog Items */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Catalog Items</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1.5">
            {metrics ? metrics.totalCatalogItems : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">5 active categories</div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Valuation</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-2 truncate">
            {metrics ? metrics.totalInventoryValue : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total assets on hand</div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5">
            {metrics ? metrics.lowStockCount : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Below minimum level</div>
        </div>

        {/* Out of Stock */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1.5">
            {metrics ? metrics.outOfStockCount : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zero stock alert</div>
        </div>

        {/* Pending POs */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending POs</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1.5">
            {metrics ? metrics.pendingPurchaseOrders : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">In approval / active</div>
        </div>

        {/* Dispatched Buffer Transfers */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Sub-store Dispatches</span>
            <Send className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400 mt-1.5">
            {metrics ? metrics.pendingSubstoreRequests : '...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ward buffer stock</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'CATALOG'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Master Catalog & Stock (FR-INV-01)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px]">
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'ORDERS'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Purchase Orders & Vendors (FR-INV-02)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px]">
            {pos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('GRN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'GRN'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Goods Receipt (GRN) & QA (FR-INV-03)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px]">
            {grns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ISSUANCES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'ISSUANCES'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Ward Sub-store Issuance (FR-INV-04)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px]">
            {issuances.length}
          </span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="space-y-4">
        {activeTab === 'CATALOG' && (
          <CatalogListView
            items={items}
            vendors={vendors}
            onRefresh={loadAllData}
            onItemUpdated={handleItemUpdated}
          />
        )}

        {activeTab === 'ORDERS' && (
          <PurchaseOrderListView
            pos={pos}
            catalogItems={items}
            vendors={vendors}
            onRefresh={loadAllData}
            onPOUpdated={handlePOUpdated}
            onPOCreated={handlePOCreated}
          />
        )}

        {activeTab === 'GRN' && (
          <GoodsReceiptListView
            grns={grns}
            approvedPOs={approvedPOs}
            onRefresh={loadAllData}
            onGRNCreated={handleGRNCreated}
          />
        )}

        {activeTab === 'ISSUANCES' && (
          <SubstoreIssuanceListView
            issuances={issuances}
            catalogItems={items}
            onRefresh={loadAllData}
            onIssuanceCreated={handleIssuanceCreated}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center pt-4 border-t border-slate-800/60 text-xs text-slate-500 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5" />
          Hospital Central Medical Stores & Material Management
        </span>
        <span>•</span>
        <span>Build Group 4 — Support & Governance</span>
        <span>•</span>
        <span>FR-INV-01 to FR-INV-04</span>
      </div>
    </div>
  );
};
