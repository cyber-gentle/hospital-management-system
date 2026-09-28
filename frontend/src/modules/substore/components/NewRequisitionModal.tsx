import React, { useState } from "react";
import {
  X,
  PackagePlus,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { CreateRequisitionRequest, Substore, SubstoreItem } from "../types";

interface NewRequisitionModalProps {
  isOpen: boolean;
  substores: Substore[];
  selectedSubstoreId: string;
  itemsCatalog: SubstoreItem[];
  onClose: () => void;
  onSubmit: (req: CreateRequisitionRequest) => Promise<void>;
}

interface ReqRow {
  itemId: string;
  requestedQty: number;
}

export const NewRequisitionModal: React.FC<NewRequisitionModalProps> = ({
  isOpen,
  substores,
  selectedSubstoreId,
  itemsCatalog,
  onClose,
  onSubmit,
}) => {
  const [substoreId, setSubstoreId] = useState<string>(
    selectedSubstoreId !== "ALL" ? selectedSubstoreId : substores[0]?.id || ""
  );
  const [urgency, setUrgency] = useState<"ROUTINE" | "URGENT" | "EMERGENCY">("ROUTINE");
  const [remarks, setRemarks] = useState<string>("");
  const [rows, setRows] = useState<ReqRow[]>([
    { itemId: itemsCatalog[0]?.id || "", requestedQty: 20 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubstore = substores.find((s) => s.id === substoreId);

  const handleAddRow = () => {
    setRows([...rows, { itemId: itemsCatalog[0]?.id || "", requestedQty: 10 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      setErrorMsg("Requisition must have at least one line item.");
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ReqRow, value: string | number) => {
    const updated = [...rows];
    const currentRow = updated[index];
    if (!currentRow) return;

    if (field === "requestedQty") {
      currentRow.requestedQty = Math.max(1, parseInt(String(value), 10) || 1);
    } else if (field === "itemId") {
      currentRow.itemId = String(value);
    }
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rows.length === 0) {
      setErrorMsg("Please add at least one item to requisition.");
      return;
    }

    const requisitionItems = rows.map((r) => {
      const item = itemsCatalog.find((it) => it.id === r.itemId);
      return {
        itemId: r.itemId,
        itemCode: item?.itemCode || "ITEM-000",
        itemName: item?.itemName || "Consumable Item",
        requestedQty: r.requestedQty,
        unitOfMeasure: item?.unitOfMeasure || "Units",
        unitCost: item?.unitCost || 0,
      };
    });

    try {
      setIsSubmitting(true);
      await onSubmit({
        substoreId,
        urgency,
        remarks: remarks.trim(),
        items: requisitionItems,
        requestedBy: currentSubstore?.managerName || "Ward In-Charge Nurse",
        requestedByRole: currentSubstore?.managerRole || "WARD_INCHARGE_NURSE",
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit requisition.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <PackagePlus className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Central Store Requisition</h2>
              <p className="text-xs text-blue-200">
                FR-SS-02: Ward Requisition from Central Warehouse
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Requesting Ward / Sub-store *
              </label>
              <select
                value={substoreId}
                onChange={(e) => setSubstoreId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {substores.map((ss) => (
                  <option key={ss.id} value={ss.id}>
                    {ss.name} ({ss.wardLocation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Urgency Level *</label>
              <select
                value={urgency}
                onChange={(e) =>
                  setUrgency(e.target.value as "ROUTINE" | "URGENT" | "EMERGENCY")
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              >
                <option value="ROUTINE">Routine Weekly Restock</option>
                <option value="URGENT">Urgent (Stock below reorder level)</option>
                <option value="EMERGENCY">Emergency (Critical ward depletion)</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Requested Inventory Items
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Add Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Item / Description</th>
                    <th className="py-2.5 px-3 w-32 text-center">Requested Qty</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          value={row.itemId}
                          onChange={(e) => handleRowChange(idx, "itemId", e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          {itemsCatalog.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.itemCode} - {item.itemName} ({item.unitOfMeasure})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={row.requestedQty}
                          onChange={(e) => handleRowChange(idx, "requestedQty", e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-center font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Ward Clinical Remarks / Justification
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Scheduled elective surgical cases require supplemental suture and drape supplies..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Dispatching..." : "Submit Requisition (FR-SS-02)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
