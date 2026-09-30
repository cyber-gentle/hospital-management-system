import React, { useState } from "react";
import {
  X,
  Sliders,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  StockAdjustmentReason,
  StockAdjustmentRequest,
  SubstoreItem,
} from "../types";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  item: SubstoreItem | null;
  substoreName: string;
  onClose: () => void;
  onSubmit: (req: StockAdjustmentRequest) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  item,
  substoreName,
  onClose,
  onSubmit,
}) => {
  const [newQuantity, setNewQuantity] = useState<string>(
    item ? String(item.currentStock) : "0"
  );
  const [reason, setReason] = useState<StockAdjustmentReason>("PHYSICAL_COUNT_CORRECTION");
  const [auditExplanation, setAuditExplanation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const previousQty = item.currentStock;
  const parsedNewQty = parseInt(newQuantity, 10);
  const diffQty = isNaN(parsedNewQty) ? 0 : parsedNewQty - previousQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isNaN(parsedNewQty) || parsedNewQty < 0) {
      setErrorMsg("Please enter a valid non-negative quantity.");
      return;
    }

    if (!auditExplanation.trim()) {
      setErrorMsg(
        "FR-SS-04 Mandatory Audit Requirement: You must enter a clear explanation for this inventory adjustment."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        substoreId: item.substoreId,
        itemId: item.id,
        newQuantity: parsedNewQty,
        reason,
        auditExplanation: auditExplanation.trim(),
        adjustedBy: "Ward In-Charge Nurse",
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Adjustment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sliders className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ward Stock Adjustment</h2>
              <p className="text-xs text-amber-200">
                FR-SS-04: Mandatory Audit-Logged Physical Count Correction
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Item Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-500 font-bold">{item.itemCode}</span>
              <span className="text-slate-500">{substoreName}</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">{item.itemName}</div>
            <div className="text-slate-500 text-[11px]">
              Unit: {item.unitOfMeasure} • Reorder Threshold: {item.reorderLevel} units
            </div>
          </div>

          {/* Audit Alert */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">FR-SS-04 Mandatory Audit Log Entry:</span>
              <span>
                All physical count changes are permanently logged to the hospital audit ledger.
                Adjustments cannot be reversed without an opposing audit record.
              </span>
            </div>
          </div>

          {/* Quantity Differential Box */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Previous Ledger Qty</span>
              <span className="text-lg font-bold font-mono text-slate-800 mt-1 block">
                {previousQty}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">New Physical Qty</span>
              <input
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-20 mx-auto text-center border-2 border-amber-500 rounded-lg py-1 font-bold font-mono text-slate-900 text-base focus:outline-none"
                required
              />
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Variance / Diff</span>
              <span
                className={`text-lg font-bold font-mono mt-1 block ${
                  diffQty > 0
                    ? "text-emerald-600"
                    : diffQty < 0
                    ? "text-rose-600"
                    : "text-slate-500"
                }`}
              >
                {diffQty > 0 ? `+${diffQty}` : diffQty}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Reason Category *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="PHYSICAL_COUNT_CORRECTION">Physical Count Discrepancy Reconciliation</option>
              <option value="DAMAGED">Damaged / Broken / Seal Breached</option>
              <option value="EXPIRED">Expired Clinical Consumable</option>
              <option value="EMERGENCY_DISPENSE">Unrecorded Emergency Resuscitation Usage</option>
              <option value="INTER_WARD_TRANSFER">Inter-Ward Emergency Transfer</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Mandatory Clinical / Audit Explanation *
            </label>
            <textarea
              rows={3}
              placeholder="Detailed justification for clinical auditors (e.g. Broken packaging discovered during weekly stock check, disposed per Biohazard Protocol #12)..."
              value={auditExplanation}
              onChange={(e) => setAuditExplanation(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                "Logging Audit..."
              ) : (
                <>
                  Confirm Audit Adjustment
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
