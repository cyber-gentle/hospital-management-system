import React from "react";
import {
  X,
  ShieldCheck,
  Calendar,
  User,
} from "lucide-react";
import { StockAdjustmentAuditEntry } from "../types";

interface StockAuditLogDrawerProps {
  isOpen: boolean;
  audits: StockAdjustmentAuditEntry[];
  onClose: () => void;
}

export const StockAuditLogDrawer: React.FC<StockAuditLogDrawerProps> = ({
  isOpen,
  audits,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl shadow-2xl h-full flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Stock Adjustment Audit Log</h2>
              <p className="text-xs text-slate-400">
                FR-SS-04: Immutable Hospital Inventory Audit Trail
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {audits.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No stock adjustment audit records found.
            </div>
          ) : (
            audits.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-mono font-bold text-slate-900">{entry.itemCode}</span>
                  <span className="text-slate-500 text-[11px]">{entry.substoreName}</span>
                </div>

                <div className="font-bold text-slate-900 text-sm">{entry.itemName}</div>

                {/* Diff Box */}
                <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Prev Qty</span>
                    <span className="font-bold text-slate-700">{entry.previousQty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Adjusted To</span>
                    <span className="font-bold text-slate-900">{entry.newQty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Difference</span>
                    <span
                      className={`font-bold ${
                        entry.differenceQty > 0
                          ? "text-emerald-600"
                          : entry.differenceQty < 0
                          ? "text-rose-600"
                          : "text-slate-500"
                      }`}
                    >
                      {entry.differenceQty > 0 ? `+${entry.differenceQty}` : entry.differenceQty}
                    </span>
                  </div>
                </div>

                {/* Reason & Audit Note */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {entry.reason.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded text-slate-700 text-xs italic">
                    "{entry.auditExplanation}"
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {entry.adjustedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(entry.adjustedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
