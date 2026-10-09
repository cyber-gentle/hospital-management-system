import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, FileText, Building, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { inventoryApi } from '../api';

interface PurchaseOrderApprovalModalProps {
  isOpen: boolean;
  po: PurchaseOrder | null;
  onClose: () => void;
  onStatusUpdated: (updatedPO: PurchaseOrder) => void;
}

export const PurchaseOrderApprovalModal: React.FC<PurchaseOrderApprovalModalProps> = ({
  isOpen,
  po,
  onClose,
  onStatusUpdated,
}) => {
  const [approverName, setApproverName] = useState<string>('Dr. O. Adebayo (Medical Director)');
  const [notes, setNotes] = useState<string>('Approved for procurement according to FY2026 departmental budget quota.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !po) return null;

  const handleAction = async (status: 'APPROVED' | 'CANCELLED') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await inventoryApi.updatePOStatus(
        po.id,
        status,
        approverName,
        notes
      );
      onStatusUpdated(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Review Purchase Order {po.poNumber}</h2>
              <p className="text-xs text-slate-400">Management & Financial Expenditure Sign-Off</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Key metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>Vendor / Supplier:</span>
              </div>
              <div className="font-semibold text-white mt-0.5">{po.vendorName}</div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Expected Delivery:</span>
              </div>
              <div className="font-semibold text-white mt-0.5">
                {new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Requisitioned By:</span>
              </div>
              <div className="font-semibold text-white mt-0.5">{po.createdBy}</div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                <span>Total Commitment:</span>
              </div>
              <div className="font-bold text-blue-400 text-sm mt-0.5">{po.totalAmount}</div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Requested Inventory Items ({po.items.length})
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium text-right">Qty</th>
                    <th className="px-3 py-2 font-medium text-right">Unit Price</th>
                    <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {po.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-white">{item.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{item.itemCode}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium">{item.quantityOrdered}</td>
                      <td className="px-3 py-2.5 text-right">₦{item.unitPrice.toLocaleString('en-NG')}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-white">
                        ₦{item.totalPrice.toLocaleString('en-NG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approver Details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Authorizing Official
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Approval Remarks / Budget Code
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleAction('CANCELLED')}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject / Cancel PO</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleAction('APPROVED')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing...' : 'Authorize Purchase Order'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
