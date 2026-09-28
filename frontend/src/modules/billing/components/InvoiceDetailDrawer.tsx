import React, { useState } from 'react';
import { Invoice } from '../types';
import { billingApi } from '../api';

interface InvoiceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onInvoiceUpdated: () => void;
  onOpenPaymentModal: (invoice: Invoice) => void;
}

export const InvoiceDetailDrawer: React.FC<InvoiceDetailDrawerProps> = ({
  isOpen,
  onClose,
  invoice,
  onInvoiceUpdated,
  onOpenPaymentModal
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleSoftDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await billingApi.softDeleteInvoice(
        invoice.id,
        passwordConfirm,
        deleteReason,
        'Senior Financial Auditor (Audit ID: AUD-009)'
      );
      setShowDeleteModal(false);
      onInvoiceUpdated();
      onClose();
    } catch (err) {
      alert((err as Error).message || 'Failed to cancel invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">{invoice.invoiceNumber}</h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.status === 'partially_paid'
                    ? 'bg-amber-100 text-amber-800'
                    : invoice.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {invoice.patientName} • {invoice.hospitalNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cancelled / Soft-Deleted Banner */}
        {invoice.isDeleted && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <span>⚠️</span> Soft-Deleted / Voided Invoice (Audit Preserved)
            </div>
            <p className="text-slate-600">
              Cancelled by: <strong>{invoice.deletedBy}</strong> on {invoice.deletedAt ? new Date(invoice.deletedAt).toLocaleString() : ''}
            </p>
            <p className="text-slate-600 italic">
              Audit Reason: "{invoice.deleteReason}"
            </p>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Patient & Scheme Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Payer Scheme:</span>
              <strong className="text-slate-800">{invoice.payerScheme}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Date Issued:</span>
              <span className="text-slate-700">{new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Due Date:</span>
              <span className="text-slate-700">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Net Balance Due:</span>
              <strong className={`font-mono text-sm ${invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₦{invoice.balanceDue.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Itemized Charges & Tariffs ({invoice.items.length})
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Category & Description</th>
                    <th className="px-3.5 py-2.5 text-center">Qty</th>
                    <th className="px-3.5 py-2.5 text-right">Unit (₦)</th>
                    <th className="px-3.5 py-2.5 text-right">Gross (₦)</th>
                    {invoice.payerScheme === 'NHIA' && (
                      <th className="px-3.5 py-2.5 text-right text-blue-700">NHIA 90%</th>
                    )}
                    <th className="px-3.5 py-2.5 text-right font-bold">Patient Co-Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mr-1.5">
                          {item.category}
                        </span>
                        <span className="font-medium text-slate-800">{item.description}</span>
                        {item.source === 'nursing_discharge' && (
                          <span className="text-[10px] text-blue-600 font-semibold ml-1.5">
                            [Nursing Ward Synced]
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                        {item.grossAmount.toLocaleString()}
                      </td>
                      {invoice.payerScheme === 'NHIA' && (
                        <td className="px-3.5 py-2.5 text-right font-mono text-blue-700">
                          {item.nhiaCoveredAmount.toLocaleString()}
                        </td>
                      )}
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₦{item.patientPayableAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Gross Charges:</span>
              <span className="font-mono">₦{invoice.totalGrossAmount.toLocaleString()}</span>
            </div>
            {invoice.totalNhiaCovered > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>NHIA Primary Scheme Coverage (90%):</span>
                <span className="font-mono">- ₦{invoice.totalNhiaCovered.toLocaleString()}</span>
              </div>
            )}
            {invoice.depositApplied > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Admission Deposit Reconciled (FR-AC-08):</span>
                <span className="font-mono">- ₦{invoice.depositApplied.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-bold pt-1 border-t border-slate-200">
              <span>Net Patient Amount Due:</span>
              <span className="font-mono">₦{invoice.netAmountDue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Total Cash / POS Collected:</span>
              <span className="font-mono">- ₦{invoice.amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Remaining Balance Outstanding:</span>
              <span className={`font-mono text-base ${invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                ₦{invoice.balanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Receipts History (FR-AC-07) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payment Transactions & Issued Receipts ({invoice.payments.length})
            </h3>
            {invoice.payments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No payments recorded against this invoice yet.</p>
            ) : (
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-slate-800">{p.receiptNumber}</strong>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Received by {p.cashierName} • {new Date(p.paymentDate).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-700">
                      + ₦{p.amountPaid.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {!invoice.isDeleted && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
              >
                🗑️ Cancel / Soft-Delete (FR-AC-05)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Close
            </button>

            {invoice.balanceDue > 0 && !invoice.isDeleted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(invoice);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>💵</span> Collect Payment (₦{invoice.balanceDue.toLocaleString()})
              </button>
            )}
          </div>
        </div>

        {/* Soft-Delete Modal (FR-AC-05: Password & Mandatory Audit Justification) */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-base text-rose-800 flex items-center gap-2">
                <span>🛡️</span> Cancel / Void Patient Invoice (FR-AC-05)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Per hospital governance, financial records are <strong>never hard-deleted</strong>. Voiding this invoice flags it as cancelled, zeroes pending billing debt, and writes an audit log.
              </p>

              <form onSubmit={handleSoftDelete} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supervisor / Auditor Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter supervisor PIN/password (e.g. admin123)"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default demo auditor key: <code className="font-mono">admin123</code></p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Audit Justification Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Billed in duplicate due to manual clinical entry; corrected on replacement invoice INV-2026-004122."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    {isDeleting ? 'Verifying...' : 'Authorize Soft Delete'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
