import React, { useState } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { GoodsReceiptNote, PurchaseOrder, ReceivedItemDetail } from '../types';
import { inventoryApi } from '../api';

interface GoodsReceiptModalProps {
  isOpen: boolean;
  approvedPOs: PurchaseOrder[];
  onClose: () => void;
  onGRNCreated: (grn: GoodsReceiptNote) => void;
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  approvedPOs,
  onClose,
  onGRNCreated,
}) => {
  const [selectedPoId, setSelectedPoId] = useState<string>(approvedPOs[0]?.id || '');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('B. Okafor (Head Storekeeper)');
  const [inspectionOfficer, setInspectionOfficer] = useState<string>('Pharm. D. Bello (Quality Assurance)');
  const [status, setStatus] = useState<'INSPECTED_ACCEPTED' | 'REJECTED_DAMAGED'>('INSPECTED_ACCEPTED');

  // Items inspection state
  const selectedPO = approvedPOs.find((p) => p.id === selectedPoId) || approvedPOs[0];
  const [itemsInspection, setItemsInspection] = useState<ReceivedItemDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedPO) {
      setItemsInspection(
        selectedPO.items.map((i, idx) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          quantityOrdered: i.quantityOrdered,
          quantityReceived: i.quantityOrdered,
          batchNumber: `BN-${new Date().getFullYear()}-${Math.floor(1000 + idx * 77 + Math.random() * 800)}`,
          expiryDate: (() => {
            const exp = new Date();
            exp.setFullYear(exp.getFullYear() + 2);
            return exp.toISOString().split('T')[0]!;
          })(),
          inspectionPass: true,
          discrepancyReason: '',
        }))
      );
    }
  }, [selectedPO]);

  if (!isOpen) return null;

  const handleItemFieldChange = <K extends keyof ReceivedItemDetail>(
    index: number,
    field: K,
    value: ReceivedItemDetail[K]
  ) => {
    const updated = [...itemsInspection];
    if (updated[index]) {
      updated[index][field] = value;
      // If inspection failed, auto flag
      if (field === 'inspectionPass' && value === false) {
        if (!updated[index].discrepancyReason) {
          updated[index].discrepancyReason = 'Packaging seal damaged / temperature deviation';
        }
      }
    }
    setItemsInspection(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) {
      setError('Please select an active Purchase Order to receive.');
      return;
    }
    if (!deliveryNoteNumber.trim()) {
      setError('Vendor delivery note number is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await inventoryApi.createGoodsReceiptNote({
        grnNumber: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        poId: selectedPO.id,
        poNumber: selectedPO.poNumber,
        vendorName: selectedPO.vendorName,
        deliveryNoteNumber,
        receivedDate: new Date().toISOString(),
        receivedBy,
        receivedItems: itemsInspection,
        inspectionOfficer,
        status,
        totalValue: selectedPO.totalAmount,
      });

      onGRNCreated(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record Goods Receipt Note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Record Goods Receipt Note (GRN)</h2>
              <p className="text-xs text-slate-400">
                Warehouse Intake & Clinical Batch Quality Inspection
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
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Delivery & PO selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Authorized Purchase Order <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              >
                {approvedPOs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.poNumber} — {p.vendorName} ({p.totalAmount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Vendor Delivery Note / Waybill # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                placeholder="e.g. DN-FID-9921"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Inspection Outcome Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'INSPECTED_ACCEPTED' | 'REJECTED_DAMAGED')}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none ${
                  status === 'INSPECTED_ACCEPTED'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                }`}
              >
                <option value="INSPECTED_ACCEPTED">Passed Inspection (Accept & Stock)</option>
                <option value="REJECTED_DAMAGED">Failed Inspection (Reject Entire Delivery)</option>
              </select>
            </div>
          </div>

          {/* Officers in charge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-400 mb-1">Receiving Storekeeper</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-400 mb-1">
                Pharmacist / QA Inspection Officer
              </label>
              <input
                type="text"
                value={inspectionOfficer}
                onChange={(e) => setInspectionOfficer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Items inspection table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-200">
                Item Inspection, Batch Allocation & Expiry Verification
              </h3>
              <span className="text-xs text-slate-500">
                Inspecting against {selectedPO?.poNumber || 'Selected PO'}
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Item Description</th>
                    <th className="px-3 py-2.5 font-medium text-right">Ordered</th>
                    <th className="px-3 py-2.5 font-medium text-right">Received</th>
                    <th className="px-3 py-2.5 font-medium">Batch Number</th>
                    <th className="px-3 py-2.5 font-medium">Expiry Date</th>
                    <th className="px-3 py-2.5 font-medium text-center">QA Pass?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {itemsInspection.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-white">{item.itemName}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-400">
                        {item.quantityOrdered}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.quantityReceived}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              'quantityReceived',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-right text-white font-medium focus:border-purple-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleItemFieldChange(idx, 'batchNumber', e.target.value)}
                          placeholder="e.g. BN-2026-001"
                          className="w-28 px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-purple-300 focus:border-purple-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleItemFieldChange(idx, 'expiryDate', e.target.value)}
                          className="w-32 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[11px] focus:border-purple-500"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={item.inspectionPass}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'inspectionPass', e.target.checked)
                          }
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {status === 'INSPECTED_ACCEPTED' ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Saving this GRN will automatically increment on-hand stock balances in Central Medical Store and mark PO {selectedPO?.poNumber} as fulfilled.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Delivery is flagged as rejected. Central stock balances will NOT be incremented.
              </span>
            </div>
          )}

          {/* Form buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-900/30 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording GRN...' : 'Authorize & Sign GRN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
