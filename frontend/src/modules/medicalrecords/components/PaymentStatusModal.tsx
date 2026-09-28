import React, { useState } from "react";
import { X, CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, Receipt } from "lucide-react";
import { PaymentStatusData } from "../types";

interface PaymentStatusModalProps {
  statusData: PaymentStatusData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (patientId: string, receiptNo: string) => Promise<void>;
}

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  statusData,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  const [receiptInput, setReceiptInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !statusData) return null;

  const handleSettlePayment = async () => {
    if (!receiptInput.trim()) return;
    try {
      setLoading(true);
      await onConfirmPayment(statusData.patient_id, receiptInput.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Service Eligibility Check (FR-MR-06)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient</span>
              <h3 className="text-sm font-extrabold text-slate-900">{statusData.full_name}</h3>
              <p className="font-mono text-xs text-blue-700 font-semibold mt-0.5">{statusData.hospital_number}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tariff Plan</span>
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-200 text-slate-700 mt-0.5">
                {statusData.payment_category}
              </span>
            </div>
          </div>

          {/* Status Verdict Banner */}
          {statusData.eligible_for_service ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Cleared for Consultation & Triage
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">{statusData.status_reason}</p>
                {statusData.receipt_no && (
                  <p className="text-[11px] font-mono font-medium text-emerald-600 pt-1">
                    Receipt Ref: {statusData.receipt_no}
                  </p>
                )}
                {statusData.nhia_number && (
                  <p className="text-[11px] font-mono font-medium text-emerald-600 pt-1">
                    NHIA Enrollee ID: {statusData.nhia_number}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Payment Settlement Required
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">{statusData.status_reason}</p>
                <div className="text-[11px] text-amber-700 bg-amber-100/70 p-2 rounded-lg border border-amber-200/60 mt-2">
                  <span className="font-semibold">Hospital Policy:</span> Out-of-pocket patients must clear initial registration/consultation tariff before triage vital entry or medical examination.
                </div>
              </div>
            </div>
          )}

          {/* Settle Payment Section if Not Eligible */}
          {!statusData.eligible_for_service && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Verify Cash Office Receipt</span>
              </div>
              <p className="text-xs text-slate-600">
                Enter the receipt number issued by the Cashier to grant immediate clinical clearance:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  placeholder="e.g. REC-2026-00456"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={handleSettlePayment}
                  disabled={loading || !receiptInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? "Validating..." : "Verify & Clear"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Rule FR-MR-06 enforced at triage entry</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
