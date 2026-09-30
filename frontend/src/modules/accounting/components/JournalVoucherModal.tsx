import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { Account, CreateJournalVoucherRequest } from "../types";

interface JournalVoucherModalProps {
  isOpen: boolean;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (req: CreateJournalVoucherRequest) => Promise<void>;
}

interface FormRow {
  accountId: string;
  debit: number;
  credit: number;
  memo: string;
}

export const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({
  isOpen,
  accounts,
  onClose,
  onSubmit,
}) => {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0] || "2026-09-28"
  );
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<FormRow[]>([
    { accountId: accounts[0]?.id || "", debit: 0, credit: 0, memo: "" },
    { accountId: accounts[1]?.id || "", debit: 0, credit: 0, memo: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalDebit = rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const handleAddRow = () => {
    setRows([
      ...rows,
      { accountId: accounts[0]?.id || "", debit: 0, credit: 0, memo: "" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 2) {
      setErrorMsg("A double-entry journal voucher requires at least two accounts.");
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof FormRow, value: string | number) => {
    const updated = [...rows];
    const currentRow = updated[index];
    if (!currentRow) return;

    if (field === "debit") {
      const numVal = Number(value) || 0;
      currentRow.debit = numVal;
      if (numVal > 0) currentRow.credit = 0; // standard double-entry exclusivity
    } else if (field === "credit") {
      const numVal = Number(value) || 0;
      currentRow.credit = numVal;
      if (numVal > 0) currentRow.debit = 0;
    } else if (field === "accountId") {
      currentRow.accountId = String(value);
    } else if (field === "memo") {
      currentRow.memo = String(value);
    }

    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg("Please specify the clinical or operational description for this voucher.");
      return;
    }

    if (!isBalanced) {
      setErrorMsg(
        `Voucher is out of balance by ₦${difference.toLocaleString()}. Total Debit must equal Total Credit.`
      );
      return;
    }

    const items = rows.map((r) => {
      const acc = accounts.find((a) => a.id === r.accountId);
      return {
        accountId: r.accountId,
        accountCode: acc?.code || "0000",
        accountName: acc?.name || "Unknown Account",
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0,
        memo: r.memo || description,
      };
    });

    try {
      setIsSubmitting(true);
      await onSubmit({
        date,
        referenceNumber: referenceNumber.trim() || `JV-REF-${Date.now()}`,
        description: description.trim(),
        items,
        preparedBy: "Senior Financial Officer",
        preparedByRole: "ACCOUNTANT",
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record voucher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Double-Entry Journal Voucher</h2>
              <p className="text-xs text-blue-200">
                FR-GL-02: Balanced Journal Entry & Chief Accountant Approval Workflow
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Posting Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Source Reference # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. PO-8891, BATCH-DISCHARGE-01"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Approval Routing
              </label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Requires Chief Accountant Approval</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Transaction Narration / Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly allocation of pharmacy consumables to clinical wards"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Double Entry Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Double-Entry Line Items
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Add Account Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">General Ledger Account</th>
                    <th className="py-2.5 px-3 w-40 text-right">Debit (₦)</th>
                    <th className="py-2.5 px-3 w-40 text-right">Credit (₦)</th>
                    <th className="py-2.5 px-3">Memo / Item Note</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          value={row.accountId}
                          onChange={(e) => handleRowChange(idx, "accountId", e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.debit === 0 ? "" : row.debit}
                          onChange={(e) => handleRowChange(idx, "debit", e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-right font-mono text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.credit === 0 ? "" : row.credit}
                          onChange={(e) => handleRowChange(idx, "credit", e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-right font-mono text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.memo}
                          onChange={(e) => handleRowChange(idx, "memo", e.target.value)}
                          placeholder="Line description..."
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                  <tr>
                    <td className="py-2.5 px-3 text-slate-700">Total Entries:</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ₦{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      ₦{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3">
                      {isBalanced ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Balanced (Dr = Cr)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          Out of balance: ₦{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isBalanced}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit for Chief Accountant Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
