import React, { useState } from 'react';
import { X, Sliders, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../types';
import { inventoryApi } from '../api';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onAdjusted: (updatedItem: InventoryItem) => void;
}

const ADJUSTMENT_REASONS = [
  'Routine Physical Inventory Count Variance',
  'Damaged / Expired Stock Write-off',
  'Emergency Unrecorded Intake / Donation',
  'Internal Transfer Discrepancy Correction',
  'Clinical Audit Reconciliation',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  item,
  onClose,
  onAdjusted,
}) => {
  const [newStock, setNewStock] = useState<number>(item?.currentStock ?? 0);
  const [reason, setReason] = useState<string>(ADJUSTMENT_REASONS[0]!);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (item) {
      setNewStock(item.currentStock);
      setReason(ADJUSTMENT_REASONS[0]!);
      setNotes('');
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const variance = newStock - item.currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isSafeInteger(newStock) || newStock < 0) {
      setError('Physical stock count cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await inventoryApi.adjustStock(item.id, variance, `${reason}: ${notes.trim()}`);
      onAdjusted(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Adjust Physical Stock Count</h2>
              <p className="text-xs text-slate-400">Inventory Variance & Cycle Count Log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-semibold">{item.itemCode}</span>
              <span className="text-slate-400">{item.locationBin}</span>
            </div>
            <div className="text-sm font-medium text-white">{item.name}</div>
            <div className="text-xs text-slate-400 flex items-center gap-4 pt-1">
              <span>System Stock: <strong className="text-slate-200">{item.currentStock} {item.unitOfMeasure}</strong></span>
              <span>Reorder Level: <strong className="text-slate-200">{item.minimumReorderLevel}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                New Physical Count ({item.unitOfMeasure})
              </label>
              <input
                type="number"
                min="0"
                required
                value={newStock}
                onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Net Variance
              </label>
              <div
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                  variance === 0
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : variance > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <span>{variance > 0 ? `+${variance}` : `${variance}`}</span>
                <span className="text-xs font-normal text-slate-400">{item.unitOfMeasure}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Adjustment Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Audit Notes / Inspector Remark
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional reconciliation notes for hospital audit records..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {variance !== 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Saving will immediately adjust central ledger balances and notify the hospital audit trail.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition shadow-lg shadow-amber-900/30"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Count'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
