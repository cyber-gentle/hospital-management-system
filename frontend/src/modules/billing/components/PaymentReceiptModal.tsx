import React, { useState } from 'react';
import { Invoice, InvoicePayment, PaymentMethod } from '../types';
import { billingApi } from '../api';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentRecorded: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded
}) => {
  const [amountPaid, setAmountPaid] = useState<number>(invoice?.balanceDue || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('POS');
  const [reference, setReference] = useState('');
  const [cashierName, setCashierName] = useState('Cashier G. Alabi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<InvoicePayment | null>(null);

  if (!isOpen || !invoice) return null;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountPaid <= 0 || amountPaid > invoice.balanceDue) {
      alert(`Payment amount must be between ₦1 and remaining balance of ₦${invoice.balanceDue.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await billingApi.recordPayment(invoice.id, {
        invoiceId: invoice.id,
        amountPaid: Number(amountPaid),
        paymentMethod,
        transactionReference: reference.trim() || undefined,
        cashierName,
        cashierShift: 'Morning'
      });

      setActiveReceipt(res.receipt);
      onPaymentRecorded();
    } catch (err) {
      console.error(err);
      alert('Failed to process payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              💵
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {activeReceipt ? 'Payment Receipt Voucher' : 'Cashier Payment Collection (FR-AC-07)'}
              </h2>
              <p className="text-xs text-emerald-100">
                Invoice {invoice.invoiceNumber} • {invoice.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {!activeReceipt ? (
            /* Payment Entry Form */
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Outstanding Balance Banner */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-900 block">Total Balance Outstanding:</span>
                  <span className="text-[11px] text-emerald-700">Patient Tariff: {invoice.payerScheme}</span>
                </div>
                <span className="text-2xl font-black font-mono text-emerald-800">
                  ₦{invoice.balanceDue.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Paying Now (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max={invoice.balanceDue}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(invoice.balanceDue)}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                  >
                    Pay Full Balance (₦{invoice.balanceDue.toLocaleString()})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="POS">POS Terminal (Card)</option>
                    <option value="Cash">Cash at Teller</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="NHIA Capitation">NHIA Capitation Fund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction / POS Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STANBIC-POS-98124"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cashier Name & Stamp
                </label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Recording Payment...' : 'Confirm Payment & Issue Receipt →'}
                </button>
              </div>
            </form>
          ) : (
            /* Printable Official Receipt Voucher */
            <div className="space-y-4">
              <div id="printable-receipt" className="border-2 border-slate-300 rounded-xl p-5 bg-white space-y-4 text-xs font-sans shadow-sm">
                {/* Hospital Header */}
                <div className="text-center border-b border-slate-200 pb-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm mb-1">
                    🏥
                  </div>
                  <h3 className="font-bold text-sm tracking-wider uppercase text-slate-900">
                    State Specialist & Teaching Hospital
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Central Accounts & Patient Revenue Unit • Lagos, Nigeria
                  </p>
                  <p className="text-[11px] font-bold text-emerald-800 mt-1 uppercase">
                    Official Payment Receipt
                  </p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 block">Receipt Number:</span>
                    <strong className="font-mono text-slate-900 text-xs">{activeReceipt.receiptNumber}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Invoice Reference:</span>
                    <strong className="font-mono text-slate-900">{invoice.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Patient Name:</span>
                    <strong className="text-slate-900">{invoice.patientName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Hospital Number:</span>
                    <strong className="font-mono text-slate-900">{invoice.hospitalNumber}</strong>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment Channel:</span>
                    <strong className="text-slate-800">{activeReceipt.paymentMethod}</strong>
                  </div>
                  {activeReceipt.transactionReference && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transaction Ref:</span>
                      <span className="font-mono">{activeReceipt.transactionReference}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                    <span className="text-emerald-900">Amount Paid:</span>
                    <span className="font-mono text-emerald-700">₦{activeReceipt.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Remaining Balance:</span>
                    <span className="font-mono">
                      ₦{Math.max(0, invoice.balanceDue - activeReceipt.amountPaid).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Signature & Seal */}
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                  <div>
                    <p className="font-medium text-slate-600">Issued by: {activeReceipt.cashierName}</p>
                    <p>{new Date(activeReceipt.paymentDate).toLocaleString()}</p>
                  </div>
                  <div className="text-right font-mono text-[9px] bg-slate-100 px-2 py-1 rounded">
                    [SECURE-VERIFIED-SEAL]
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Done & Close
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>🖨️</span> Print Official Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
