import React, { useState } from "react";
import {
  X,
  CreditCard,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  Account,
  CashBankTransactionType,
  CreateCashBankTransactionRequest,
  PaymentMethod,
} from "../types";

interface CashBankTransactionModalProps {
  isOpen: boolean;
  accounts: Account[];
  onClose: () => void;
  onSubmit: (req: CreateCashBankTransactionRequest) => Promise<void>;
}

export const CashBankTransactionModal: React.FC<CashBankTransactionModalProps> = ({
  isOpen,
  accounts,
  onClose,
  onSubmit,
}) => {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0] || "2026-09-28"
  );
  const [type, setType] = useState<CashBankTransactionType>("RECEIPT");

  // Bank accounts (Asset accounts like Cash, TSA, Commercial Bank)
  const bankAccounts = accounts.filter(
    (a) => a.type === "ASSET" && (a.code.startsWith("10") || a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bank"))
  );

  // Contra accounts (Revenue, Expense, or Liability accounts)
  const contraAccounts = accounts.filter((a) => a.type === "REVENUE" || a.type === "EXPENSE" || a.type === "LIABILITY");

  const [bankAccountId, setBankAccountId] = useState<string>(
    bankAccounts[0]?.id || ""
  );
  const [contraAccountId, setContraAccountId] = useState<string>(
    contraAccounts[0]?.id || ""
  );
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("POS");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than ₦0.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Please provide a description / narration.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        date,
        type,
        bankAccountId,
        contraAccountId,
        amount: parsedAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || `REF-${Date.now()}`,
        description: description.trim(),
        recordedBy: "Treasury Cashier Desk",
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Cash / Bank Transaction</h2>
              <p className="text-xs text-slate-400">
                FR-GL-01: Direct Lodgements, Disbursements, and POS Settlements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Transaction Type Radio Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("RECEIPT")}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                type === "RECEIPT"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Cash / Bank Receipt (Inflow)
            </button>

            <button
              type="button"
              onClick={() => setType("PAYMENT")}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                type === "PAYMENT"
                  ? "bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Disbursement / Payment (Outflow)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Payment Channel *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              >
                <option value="POS">POS Terminal Card Sweep</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer / TSA</option>
                <option value="CASH">Physical Cash Collection</option>
                <option value="CHEQUE">Bank Draft / Cheque</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Hospital Bank / Cash Account (Asset) *
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {acc.name} (₦{acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Contra Ledger Account (Revenue / Expense) *
            </label>
            <select
              value={contraAccountId}
              onChange={(e) => setContraAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {contraAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} — {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Amount (₦) *</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="50,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Transaction / Slip Ref #
              </label>
              <input
                type="text"
                placeholder="e.g. STANBIC-POS-89912"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Narration / Clinical Description *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Antenatal clinic POS collection batch lodgement into TSA..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Record Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
