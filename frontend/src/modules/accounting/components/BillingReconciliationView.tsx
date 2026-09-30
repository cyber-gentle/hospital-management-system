import React, { useState } from "react";
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { BillingReconciliationReport, ReconciliationItem } from "../types";

interface BillingReconciliationViewProps {
  report: BillingReconciliationReport | null;
  onPostReceiptToGl: (reconId: string) => Promise<void>;
  onRefresh: () => void;
}

export const BillingReconciliationView: React.FC<BillingReconciliationViewProps> = ({
  report,
  onPostReceiptToGl,
  onRefresh,
}) => {
  const [postingId, setPostingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading billing reconciliation report...
      </div>
    );
  }

  const handlePost = async (item: ReconciliationItem) => {
    try {
      setPostingId(item.id);
      await onPostReceiptToGl(item.id);
      setNotice(
        `Successfully posted receipt ${item.receiptNumber} (₦${item.billingAmount.toLocaleString()}) to the General Ledger.`
      );
      onRefresh();
    } catch {
      setNotice("Failed to post receipt to GL.");
    } finally {
      setPostingId(null);
    }
  };

  const isFullyReconciled = report.variance === 0 && report.unpostedCount === 0;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-emerald-700 font-bold hover:text-emerald-900"
          >
            ×
          </button>
        </div>
      )}

      {/* FR-GL-05 Header & Context */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-200 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl shadow-xs border border-emerald-200 text-emerald-600">
          <GitCompare className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm">
              FR-GL-05: Real-time Patient Revenue Reconciliation Engine
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Audit Mandated
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            This module reconciles every patient receipt and collection from <strong>Accounts & Billing</strong> against
            the <strong>General Ledger Revenue & Cash/TSA accounts</strong>. Zero unexplained variance is strictly enforced
            prior to monthly financial close.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Billing Cashier Receipts</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₦{report.totalBillingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recorded patient payments</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">General Ledger Posted Revenue</div>
          <div className="text-xl font-black text-blue-600 mt-1 font-mono">
            ₦{report.totalGlRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recognized in accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Reconciliation Variance</div>
          <div
            className={`text-xl font-black mt-1 font-mono ${
              report.variance === 0 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            ₦{report.variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {report.variance === 0 ? "Zero variance achieved" : "Unposted receipts pending"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Posting Status</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {report.matchedCount} Matched
            </span>
            {isFullyReconciled ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Reconciled
              </span>
            ) : report.unpostedCount > 0 ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {report.unpostedCount} Unposted
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">Period: {report.period}</div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Receipt-Level Audit & Posting Cross-Check
          </h4>
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh Reconciliation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt & Invoice Ref</th>
                <th className="py-3 px-4">Patient Demographics</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4 text-right">Billing Cashier (₦)</th>
                <th className="py-3 px-4 text-right">GL Posted (₦)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">GL Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {report.items.map((item) => {
                const isMatched = item.status === "MATCHED";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.receiptNumber}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.invoiceNumber}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.patientName}</div>
                      <div className="text-[11px] text-slate-500">{item.patientMrn}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{item.paymentMethod}</span>
                      <div className="text-[10px] text-slate-400">{item.transactionDate}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₦{item.billingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₦{item.glPostedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {item.glTransactionRef && (
                        <div className="text-[10px] text-blue-600 font-mono font-normal">
                          {item.glTransactionRef}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isMatched
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isMatched ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Matched
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            Unposted in GL
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isMatched ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Reconciled
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={postingId === item.id}
                          onClick={() => handlePost(item)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {postingId === item.id ? (
                            "Posting..."
                          ) : (
                            <>
                              Post to GL
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
