import React, { useState } from 'react';
import { Drug, DrugCategory } from '../types';
import { pharmacyApi } from '../api';

interface FormularyStockViewProps {
  drugs: Drug[];
  onStockUpdated: () => void;
}

export const FormularyStockView: React.FC<FormularyStockViewProps> = ({
  drugs,
  onStockUpdated
}) => {
  const [categoryFilter, setCategoryFilter] = useState<DrugCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restockDrug, setRestockDrug] = useState<Drug | null>(null);
  const [restockQty, setRestockQty] = useState(50);
  const [isRestocking, setIsRestocking] = useState(false);

  const categories: (DrugCategory | 'all')[] = [
    'all',
    'Antibiotics',
    'Antihypertensives',
    'Analgesics / NSAIDs',
    'Antidiabetics',
    'Antimalarials',
    'Fluids & Electrolytes'
  ];

  const filteredDrugs = drugs.filter(drug => {
    if (categoryFilter !== 'all' && drug.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        drug.genericName.toLowerCase().includes(q) ||
        drug.brandName.toLowerCase().includes(q) ||
        drug.strength.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockDrug || restockQty <= 0) return;

    setIsRestocking(true);
    try {
      await pharmacyApi.restockDrug(restockDrug.id, restockQty);
      setRestockDrug(null);
      onStockUpdated();
    } catch (err) {
      console.error(err);
      alert('Failed to restock drug.');
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter Chips & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 mr-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Classes' : cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search drug, generic, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Formulary Table (FR-PH-04) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Medication Name & Formulation</th>
                <th className="px-5 py-3">Therapeutic Class</th>
                <th className="px-5 py-3 text-right">Unit Price</th>
                <th className="px-5 py-3 text-center">Batch / Expiry</th>
                <th className="px-5 py-3 text-center">Stock On Hand</th>
                <th className="px-5 py-3 text-center">Stock Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No medications matching filter.
                  </td>
                </tr>
              ) : (
                filteredDrugs.map(drug => {
                  const isOutOfStock = drug.stockOnHand <= 0;
                  const isLowStock = drug.stockOnHand > 0 && drug.stockOnHand <= drug.reorderLevel;

                  return (
                    <tr key={drug.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {drug.brandName}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {drug.genericName} • <span className="font-semibold">{drug.strength}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {drug.dosageForm}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {drug.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                        ₦{drug.unitPrice.toLocaleString()}
                      </td>

                      {/* Batch & Expiry */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-mono text-[11px] text-slate-600 block">
                          {drug.batchNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Exp: {drug.expiryDate}
                        </span>
                      </td>

                      {/* Stock On Hand */}
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-sm">
                        <span className={isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'}>
                          {drug.stockOnHand}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Min: {drug.reorderLevel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Adequate'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setRestockDrug(drug)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          + Restock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span>📦</span> Restock Dispensary Inventory
            </h3>
            <p className="text-xs text-slate-600">
              Adding inventory to <strong className="text-slate-900">{restockDrug.brandName}</strong> ({restockDrug.strength}).
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockDrug(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRestocking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {isRestocking ? 'Updating...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
