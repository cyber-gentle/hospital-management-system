import { DEMO_MODE } from "../../../lib/demo";
import React, { useState } from 'react';
import { X, FileText, Plus, Trash2, Calendar, Building, DollarSign, AlertCircle } from 'lucide-react';
import { InventoryItem, PurchaseOrder, PurchaseOrderItem, Vendor } from '../types';
import { inventoryApi } from '../api';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  catalogItems: InventoryItem[];
  vendors: Vendor[];
  onClose: () => void;
  onCreated: (newPO: PurchaseOrder) => void;
}

interface OrderLineState {
  itemId: string;
  quantityOrdered: number;
  unitPrice: number;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  catalogItems,
  vendors,
  onClose,
  onCreated,
}) => {
  const [vendorId, setVendorId] = useState<string>(vendors[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0]!;
  });
  const [lines, setLines] = useState<OrderLineState[]>([
    {
      itemId: catalogItems[0]?.id || '',
      quantityOrdered: 50,
      unitPrice: catalogItems[0]?.unitCostValue || 1000,
    },
  ]);
  const [submitImmediately, setSubmitImmediately] = useState<boolean>(DEMO_MODE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedVendor = vendors.find((v) => v.id === vendorId) || vendors[0];

  const handleAddLine = () => {
    const defaultItem = catalogItems[0];
    setLines([
      ...lines,
      {
        itemId: defaultItem?.id || '',
        quantityOrdered: 20,
        unitPrice: defaultItem?.unitCostValue || 1000,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const itm = catalogItems.find((i) => i.id === itemId);
    const updated = [...lines];
    updated[index] = {
      itemId,
      quantityOrdered: updated[index]?.quantityOrdered || 10,
      unitPrice: itm?.unitCostValue || 0,
    };
    setLines(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...lines];
    if (updated[index]) {
      updated[index].quantityOrdered = Math.max(1, qty);
    }
    setLines(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...lines];
    if (updated[index]) {
      updated[index].unitPrice = Math.max(0, price);
    }
    setLines(updated);
  };

  // Grand total calculation
  const grandTotalValue = lines.reduce((acc, l) => acc + l.quantityOrdered * l.unitPrice, 0);
  const grandTotalFormatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(grandTotalValue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) {
      setError('Please select a valid supplier/vendor.');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    // Build PO items
    const poItems: PurchaseOrderItem[] = lines.map((l) => {
      const itm = catalogItems.find((i) => i.id === l.itemId);
      return {
        itemId: l.itemId,
        itemCode: itm?.itemCode || 'GEN-ITEM',
        itemName: itm?.name || 'Item Name',
        quantityOrdered: l.quantityOrdered,
        unitPrice: l.unitPrice,
        totalPrice: l.quantityOrdered * l.unitPrice,
      };
    });

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await inventoryApi.createPurchaseOrder({
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDeliveryDate: expectedDate,
        items: poItems,
        totalAmount: grandTotalFormatted,
        totalAmountValue: grandTotalValue,
        status: DEMO_MODE && submitImmediately ? 'SUBMITTED_FOR_APPROVAL' : 'DRAFT',
        createdBy: 'Procurement Officer (HIMS)',
      });
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Generate Purchase Order (PO)</h2>
              <p className="text-xs text-slate-400">Formal Vendor Procurement Requisition</p>
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

          {/* Header configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Select Registered Vendor <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-4 h-4" />
                </div>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.category})
                    </option>
                  ))}
                </select>
              </div>
              {selectedVendor && (
                <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                  <div>Contact: {selectedVendor.contactPerson} ({selectedVendor.phone})</div>
                  <div>TIN: {selectedVendor.taxIdNumber} | Rating: {'★'.repeat(selectedVendor.rating)}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Expected Delivery Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Standard delivery SLA window per vendor procurement agreement.
              </p>
            </div>
          </div>

          {/* Line items builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Requisition Line Items</h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const currentItem = catalogItems.find((i) => i.id === line.itemId);
                const lineTotal = line.quantityOrdered * line.unitPrice;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="md:col-span-5">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Catalog Item #{idx + 1}
                      </label>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      >
                        {catalogItems.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            [{itm.itemCode}] {itm.name} ({itm.currentStock} in stock)
                          </option>
                        ))}
                      </select>
                      {currentItem && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          UOM: {currentItem.unitOfMeasure} | Location: {currentItem.locationBin}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Order Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantityOrdered}
                        onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Agreed Unit (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2 text-right">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                        Subtotal
                      </label>
                      <div className="font-semibold text-slate-200 py-1.5 text-xs">
                        ₦{lineTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
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

          {/* Grand total & submission preferences */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="submitImmediately"
                checked={submitImmediately}
                onChange={(e) => setSubmitImmediately(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label htmlFor="submitImmediately" className="text-xs text-slate-300">
                Submit directly to Medical Director / Finance for procurement approval
              </label>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Total Purchase Order Commitment:</div>
              <div className="text-xl font-bold text-white tracking-tight flex items-center justify-end gap-1">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span>{grandTotalFormatted}</span>
              </div>
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-900/30 flex items-center gap-2"
            >
              {isSubmitting ? 'Generating PO...' : submitImmediately ? 'Submit for Approval' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
