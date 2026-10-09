import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Sliders,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Building,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem, ItemStockStatus, Vendor } from '../types';
import { CatalogItemModal } from './CatalogItemModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface CatalogListViewProps {
  items: InventoryItem[];
  vendors: Vendor[];
  onRefresh: () => void;
  onItemUpdated: (item: InventoryItem) => void;
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: 'All Catalog', value: 'ALL' },
  { label: 'Pharmaceuticals', value: 'PHARMACEUTICALS' },
  { label: 'Consumables', value: 'CONSUMABLES' },
  { label: 'Surgical Instruments', value: 'SURGICAL_INSTRUMENTS' },
  { label: 'Lab Reagents', value: 'LAB_REAGENTS' },
  { label: 'General Stores', value: 'GENERAL_STORES' },
];

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Stock Statuses', value: 'ALL' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Low Stock (< Min Level)', value: 'LOW_STOCK' },
  { label: 'Out of Stock (Zero)', value: 'OUT_OF_STOCK' },
];

export const CatalogListView: React.FC<CatalogListViewProps> = ({
  items,
  vendors,
  onRefresh,
  onItemUpdated,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          item.locationBin.toLowerCase().includes(q) ||
          item.preferredVendor.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, search]);

  const handleOpenCreate = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const getStatusBadge = (status: ItemStockStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Out of Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, item name, rack bin, or vendor..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-emerald-500"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh Catalog Data"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition border ${
              selectedCategory === cat.value
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Item & Category</th>
                <th className="px-4 py-3.5 font-semibold">Warehouse Location</th>
                <th className="px-4 py-3.5 font-semibold">Stock / Levels</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Unit Cost</th>
                <th className="px-4 py-3.5 font-semibold">Preferred Vendor</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No inventory items found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search criteria or add a new catalog item.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          {item.itemCode}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          {item.category.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{item.locationBin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-baseline gap-1 text-sm font-semibold text-white">
                        <span>{item.currentStock}</span>
                        <span className="text-xs font-normal text-slate-400">
                          {item.unitOfMeasure}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Min: {item.minimumReorderLevel} | Buffer: {item.bufferStockLevel}
                      </div>
                      {/* Visual progress relative to buffer */}
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.currentStock === 0
                              ? 'bg-rose-500'
                              : item.currentStock <= item.minimumReorderLevel
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((item.currentStock / item.bufferStockLevel) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-200">{item.unitCost}</div>
                      <div className="text-[11px] text-slate-500">per {item.unitOfMeasure.toLowerCase()}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-300 max-w-[160px] truncate">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{item.preferredVendor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustItem(item)}
                          title="Adjust Physical Count"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Item Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CatalogItemModal
        isOpen={isItemModalOpen}
        itemToEdit={itemToEdit}
        vendors={vendors}
        onClose={() => setIsItemModalOpen(false)}
        onSave={(saved) => {
          onItemUpdated(saved);
        }}
      />

      <StockAdjustmentModal
        isOpen={Boolean(adjustItem)}
        item={adjustItem}
        onClose={() => setAdjustItem(null)}
        onAdjusted={(updated) => {
          onItemUpdated(updated);
        }}
      />
    </div>
  );
};
