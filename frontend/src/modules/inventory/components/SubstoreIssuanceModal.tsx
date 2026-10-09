import React, { useState } from 'react';
import { X, Send, Plus, Trash2, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InventoryItem, SubstoreIssuance, SubstoreIssuanceItem } from '../types';
import { inventoryApi } from '../api';

interface SubstoreIssuanceModalProps {
  isOpen: boolean;
  catalogItems: InventoryItem[];
  onClose: () => void;
  onIssuanceCreated: (issuance: SubstoreIssuance) => void;
}

const DEPARTMENTS = [
  'Accident & Emergency Sub-store',
  'Main Operating Theatre Buffer',
  'Male Surgical Ward Sub-store',
  'Female Medical Ward Sub-store',
  'Maternity & Labour Ward Buffer',
  'Pediatric ICU Sub-store',
  'General Outpatient (GOPD) Clinic',
  'Central Laboratory Buffer',
];

interface IssuanceLineState {
  itemId: string;
  quantityRequested: number;
  quantityIssued: number;
  batchNumber: string;
}

export const SubstoreIssuanceModal: React.FC<SubstoreIssuanceModalProps> = ({
  isOpen,
  catalogItems,
  onClose,
  onIssuanceCreated,
}) => {
  const [targetDepartment, setTargetDepartment] = useState<string>(DEPARTMENTS[0]!);
  const [issuedBy, setIssuedBy] = useState<string>('B. Okafor (Head Storekeeper)');
  const [lines, setLines] = useState<IssuanceLineState[]>([
    {
      itemId: catalogItems[0]?.id || '',
      quantityRequested: 20,
      quantityIssued: 20,
      batchNumber: 'BN-2026-004',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddLine = () => {
    const defaultItem = catalogItems[0];
    setLines([
      ...lines,
      {
        itemId: defaultItem?.id || '',
        quantityRequested: 10,
        quantityIssued: 10,
        batchNumber: 'BN-2026-004',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, index) => index !== idx));
  };

  const handleItemSelect = (idx: number, itemId: string) => {
    const updated = [...lines];
    const itm = catalogItems.find((i) => i.id === itemId);
    const maxQty = itm ? Math.min(20, itm.currentStock) : 10;
    updated[idx] = {
      itemId,
      quantityRequested: maxQty,
      quantityIssued: maxQty,
      batchNumber: 'BN-2026-004',
    };
    setLines(updated);
  };

  const handleFieldChange = <K extends keyof IssuanceLineState>(
    idx: number,
    field: K,
    val: IssuanceLineState[K]
  ) => {
    const updated = [...lines];
    if (updated[idx]) {
      updated[idx][field] = val;
    }
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError('At least one item must be added for dispatch.');
      return;
    }

    // Validate that issued stock does not exceed available central stock
    for (const line of lines) {
      const itm = catalogItems.find((i) => i.id === line.itemId);
      if (itm && line.quantityIssued > itm.currentStock) {
        setError(`Cannot issue ${line.quantityIssued} of ${itm.name}. Only ${itm.currentStock} units currently available in Central Store.`);
        return;
      }
      if (line.quantityIssued <= 0) {
        setError('Issued quantity must be greater than 0.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const issuanceItems: SubstoreIssuanceItem[] = lines.map((l) => {
      const itm = catalogItems.find((i) => i.id === l.itemId);
      return {
        itemId: l.itemId,
        itemName: itm?.name || 'Supply Item',
        quantityRequested: l.quantityRequested,
        quantityIssued: l.quantityIssued,
        batchNumber: l.batchNumber || 'BN-GEN',
      };
    });

    try {
      const created = await inventoryApi.createSubstoreIssuance({
        requisitionId: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        targetDepartment,
        issuedDate: new Date().toISOString(),
        issuedBy,
        items: issuanceItems,
        status: 'DISPATCHED',
      });
      onIssuanceCreated(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue sub-store stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Dispatch Ward Buffer Supplies (Issuance)
              </h2>
              <p className="text-xs text-slate-400">
                Central Store Outbound Dispatch to Ward Sub-Stores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Target Ward / Department Sub-store <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-teal-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Dispatching Storekeeper
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Line items builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Supplies Allocation</h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const currentItem = catalogItems.find((i) => i.id === line.itemId);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="md:col-span-5">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Central Item #{idx + 1}
                      </label>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
                      >
                        {catalogItems.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            [{itm.itemCode}] {itm.name} (Avail: {itm.currentStock} {itm.unitOfMeasure})
                          </option>
                        ))}
                      </select>
                      {currentItem && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Bin: {currentItem.locationBin} | On-Hand: {currentItem.currentStock}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Requested
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantityRequested}
                        onChange={(e) =>
                          handleFieldChange(idx, 'quantityRequested', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Issued Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={currentItem ? currentItem.currentStock : 9999}
                        value={line.quantityIssued}
                        onChange={(e) =>
                          handleFieldChange(idx, 'quantityIssued', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Batch Tag
                      </label>
                      <input
                        type="text"
                        value={line.batchNumber}
                        onChange={(e) => handleFieldChange(idx, 'batchNumber', e.target.value)}
                        placeholder="e.g. BN-2026-004"
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 1}
                        className={`p-1.5 rounded-lg transition ${
                          lines.length <= 1
                            ? 'text-slate-700 cursor-not-allowed'
                            : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
            <span>
              Confirming this issuance will decrement the respective items from Central Medical Store inventory immediately and generate an outbound dispatch docket.
            </span>
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition shadow-lg shadow-teal-900/30 flex items-center gap-2"
            >
              {isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Buffer Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
