import React, { useState } from "react";
import {
  Search,
  Filter,
  Sliders,
  PackagePlus,
  Building,
} from "lucide-react";
import { ItemCategory, Substore, SubstoreItem } from "../types";

interface SubstoreInventoryViewProps {
  substores: Substore[];
  selectedSubstoreId: string;
  onSelectSubstoreId: (id: string) => void;
  items: SubstoreItem[];
  onAdjustStock: (item: SubstoreItem) => void;
  onNewRequisition: () => void;
}

export const SubstoreInventoryView: React.FC<SubstoreInventoryViewProps> = ({
  substores,
  selectedSubstoreId,
  onSelectSubstoreId,
  items,
  onAdjustStock,
  onNewRequisition,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "ALL">("ALL");

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        item.itemCode.toLowerCase().includes(q) ||
        item.itemName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentSubstore = substores.find((s) => s.id === selectedSubstoreId);

  return (
    <div className="space-y-4">
      {/* Substore Selector & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Ward Sub-store:</span>
            <select
              value={selectedSubstoreId}
              onChange={(e) => onSelectSubstoreId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Hospital Sub-stores</option>
              {substores.map((ss) => (
                <option key={ss.id} value={ss.id}>
                  {ss.name} ({ss.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ItemCategory | "ALL")}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="CONSUMABLE">Consumables</option>
              <option value="PHARMACEUTICAL">Pharmaceuticals</option>
              <option value="SURGICAL_SUPPLY">Surgical Supplies</option>
              <option value="LINEN_AND_STATIONERY">Linen & Stationery</option>
              <option value="DIAGNOSTIC_REAGENT">Reagents</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search item code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onNewRequisition}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PackagePlus className="w-4 h-4" />
            Requisition (FR-SS-02)
          </button>
        </div>
      </div>

      {/* Ward Info Summary */}
      {currentSubstore && (
        <div className="px-4 py-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs flex flex-wrap items-center justify-between text-blue-950">
          <div className="flex items-center gap-2">
            <span className="font-bold">{currentSubstore.name}</span>
            <span className="text-blue-700 font-mono">[{currentSubstore.code}]</span>
            <span className="text-slate-500">• {currentSubstore.wardLocation}</span>
          </div>
          <div className="text-slate-600">
            In-Charge: <strong className="text-slate-800">{currentSubstore.managerName}</strong>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Reorder Threshold (FR-SS-03)</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.map((item) => {
                const isLow = item.status === "LOW_STOCK";
                const isOut = item.status === "OUT_OF_STOCK";
                const pct = Math.min(100, Math.round((item.currentStock / item.maxCapacity) * 100));

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.itemCode}</div>
                      <div className="font-semibold text-slate-800">{item.itemName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.category.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-slate-500 font-medium">
                      {item.unitOfMeasure}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {item.currentStock}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                      {item.reorderLevel} units
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="w-28 mx-auto space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span
                            className={`font-bold ${
                              isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "Sufficient"}
                          </span>
                          <span className="text-slate-400 font-mono">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOut
                                ? "bg-rose-500"
                                : isLow
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onAdjustStock(item)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="Audit-Logged Adjustment"
                      >
                        <Sliders className="w-3 h-3 text-amber-600" />
                        Adjust (FR-SS-04)
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
