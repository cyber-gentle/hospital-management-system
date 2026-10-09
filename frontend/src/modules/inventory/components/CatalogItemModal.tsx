import { DEMO_MODE } from "../../../lib/demo";
import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Building, AlertCircle } from 'lucide-react';
import { InventoryCategory, InventoryItem, UnitOfMeasure, Vendor } from '../types';
import { inventoryApi } from '../api';

interface CatalogItemModalProps {
  isOpen: boolean;
  itemToEdit?: InventoryItem | null;
  vendors: Vendor[];
  onClose: () => void;
  onSave: (savedItem: InventoryItem) => void;
}

const CATEGORIES: { label: string; value: InventoryCategory }[] = [
  { label: 'Pharmaceuticals', value: 'PHARMACEUTICALS' },
  { label: 'Consumables', value: 'CONSUMABLES' },
  { label: 'Surgical Instruments', value: 'SURGICAL_INSTRUMENTS' },
  { label: 'Lab Reagents', value: 'LAB_REAGENTS' },
  { label: 'General Stores', value: 'GENERAL_STORES' },
];

const UOMS: UnitOfMeasure[] = ['BOX', 'VIAL', 'PACK', 'PIECE', 'BOTTLE', 'ROLL', 'SET'];

export const CatalogItemModal: React.FC<CatalogItemModalProps> = ({
  isOpen,
  itemToEdit,
  vendors,
  onClose,
  onSave,
}) => {
  const [itemCode, setItemCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('PHARMACEUTICALS');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('VIAL');
  const [currentStock, setCurrentStock] = useState<number>(DEMO_MODE ? 100 : 0);
  const [minimumReorderLevel, setMinimumReorderLevel] = useState<number>(50);
  const [bufferStockLevel, setBufferStockLevel] = useState<number>(200);
  const [unitCostValue, setUnitCostValue] = useState<number>(DEMO_MODE ? 1500 : 0);
  const [locationBin, setLocationBin] = useState('');
  const [preferredVendor, setPreferredVendor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setItemCode(itemToEdit.itemCode);
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setUnitOfMeasure(itemToEdit.unitOfMeasure);
      setCurrentStock(itemToEdit.currentStock);
      setMinimumReorderLevel(itemToEdit.minimumReorderLevel);
      setBufferStockLevel(itemToEdit.bufferStockLevel);
      setUnitCostValue(itemToEdit.unitCostValue);
      setLocationBin(itemToEdit.locationBin);
      setPreferredVendor(itemToEdit.preferredVendor);
    } else {
      setItemCode('');
      setName('');
      setCategory('PHARMACEUTICALS');
      setUnitOfMeasure('VIAL');
      setCurrentStock(50);
      setMinimumReorderLevel(20);
      setBufferStockLevel(100);
      setUnitCostValue(1000);
      setLocationBin('');
      setPreferredVendor(vendors[0]?.name || '');
    }
    setError(null);
  }, [itemToEdit, vendors, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item Name is required');
      return;
    }
    if (!itemCode.trim()) {
      setError('Item Code is required');
      return;
    }
    if (!locationBin.trim()) {
      setError('Storage Bin / Location is required');
      return;
    }
    if (currentStock < 0 || minimumReorderLevel < 0 || bufferStockLevel < 0 || unitCostValue < 0) {
      setError('Quantities and unit cost must be non-negative values');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formattedCost = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(unitCostValue);

    try {
      if (itemToEdit) {
        const updated = await inventoryApi.updateItem(itemToEdit.id, {
          itemCode,
          name,
          category,
          unitOfMeasure,
          currentStock,
          minimumReorderLevel,
          bufferStockLevel,
          unitCost: formattedCost,
          unitCostValue,
          locationBin,
          preferredVendor: preferredVendor || 'Direct Purchase',
        });
        onSave(updated);
      } else {
        const created = await inventoryApi.createItem({
          itemCode,
          name,
          category,
          unitOfMeasure,
          currentStock,
          minimumReorderLevel,
          bufferStockLevel,
          unitCost: formattedCost,
          unitCostValue,
          locationBin,
          preferredVendor: preferredVendor || 'Direct Purchase',
        });
        onSave(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {itemToEdit ? 'Edit Catalog Item' : 'New Catalog Item'}
              </h2>
              <p className="text-xs text-slate-400">
                Central Medical Store & General Stores Master Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Item Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                placeholder="e.g. MED-CEF-1G"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Item Name & Specification <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ceftriaxone Sodium 1g Powder for Injection"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Unit of Measure (UOM)
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {UOMS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Current Stock Balance
              </label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Min Reorder Level
              </label>
              <input
                type="number"
                min="0"
                value={minimumReorderLevel}
                onChange={(e) => setMinimumReorderLevel(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Target Buffer Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={bufferStockLevel}
                onChange={(e) => setBufferStockLevel(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Unit Cost (₦)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCostValue}
                  onChange={(e) => setUnitCostValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Bin Location / Warehouse Rack <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={locationBin}
                onChange={(e) => setLocationBin(e.target.value)}
                placeholder="e.g. Pharmacy Bay A-04 or Rack C-12"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Preferred Registered Vendor
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  list="vendor-options"
                  value={preferredVendor}
                  onChange={(e) => setPreferredVendor(e.target.value)}
                  placeholder="Select or enter vendor name"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <datalist id="vendor-options">
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{itemToEdit ? 'Save Changes' : 'Create Item'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
