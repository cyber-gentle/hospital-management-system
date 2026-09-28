import React, { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  FolderTree,
  CreditCard,
  TrendingUp,
  GitCompare,
  PlusCircle,
  CheckCircle2,
  Search,
  Check,
  Building,
  RefreshCw,
} from "lucide-react";
import {
  Account,
  BillingReconciliationReport,
  CashBankTransaction,
  CreateAccountRequest,
  CreateCashBankTransactionRequest,
  CreateJournalVoucherRequest,
  JournalVoucher,
} from "./types";
import { accountingApi } from "./api";
import { ChartOfAccountsView } from "./components/ChartOfAccountsView";
import { JournalVoucherModal } from "./components/JournalVoucherModal";
import { CashBankTransactionModal } from "./components/CashBankTransactionModal";
import { FinancialStatementsView } from "./components/FinancialStatementsView";
import { BillingReconciliationView } from "./components/BillingReconciliationView";

export const AccountingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "JOURNAL_VOUCHERS" | "CASH_BANK" | "CHART_OF_ACCOUNTS" | "STATEMENTS" | "RECONCILIATION"
  >("JOURNAL_VOUCHERS");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jvs, setJvs] = useState<JournalVoucher[]>([]);
  const [cbtList, setCbtList] = useState<CashBankTransaction[]>([]);
  const [reconReport, setReconReport] = useState<BillingReconciliationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isJvModalOpen, setIsJvModalOpen] = useState<boolean>(false);
  const [isCbtModalOpen, setIsCbtModalOpen] = useState<boolean>(false);
  const [selectedJvForView, setSelectedJvForView] = useState<JournalVoucher | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for JVs
  const [jvSearch, setJvSearch] = useState<string>("");
  const [jvStatusFilter, setJvStatusFilter] = useState<string>("ALL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accs, vouchers, transactions, recon] = await Promise.all([
        accountingApi.getAccounts(),
        accountingApi.getJournalVouchers(),
        accountingApi.getCashBankTransactions(),
        accountingApi.getBillingReconciliation(),
      ]);
      setAccounts(accs);
      setJvs(vouchers);
      setCbtList(transactions);
      setReconReport(recon);
    } catch (err) {
      console.error("Failed to load accounting data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Create JV
  const handleCreateJv = async (req: CreateJournalVoucherRequest) => {
    const created = await accountingApi.createJournalVoucher(req);
    showToast(`Journal voucher ${created.voucherNumber} created and submitted for approval.`);
    await loadAllData();
  };

  // Approve JV (FR-GL-02)
  const handleApproveJv = async (voucherId: string) => {
    const approved = await accountingApi.approveJournalVoucher(
      voucherId,
      "Mrs. Nkechi Okafor",
      "CHIEF_ACCOUNTANT"
    );
    showToast(`Journal voucher ${approved.voucherNumber} approved and posted to General Ledger.`);
    await loadAllData();
  };

  // Create Cash/Bank transaction (FR-GL-01)
  const handleCreateCbt = async (req: CreateCashBankTransactionRequest) => {
    const created = await accountingApi.createCashBankTransaction(req);
    showToast(`Cash/Bank transaction ${created.transactionNumber} recorded.`);
    await loadAllData();
  };

  // Create Account (FR-GL-03)
  const handleCreateAccount = async (req: CreateAccountRequest) => {
    const created = await accountingApi.createAccount(req);
    showToast(`Account ${created.code} (${created.name}) created.`);
    await loadAllData();
  };

  // Post receipt to GL (FR-GL-05)
  const handlePostReceiptToGl = async (reconId: string) => {
    await accountingApi.postReceiptToGl(reconId);
    showToast("Receipt posted to GL and verified.");
    await loadAllData();
  };

  // Filtered JVs
  const filteredJvs = jvs.filter((jv) => {
    if (jvStatusFilter !== "ALL" && jv.status !== jvStatusFilter) return false;
    if (jvSearch.trim() !== "") {
      const q = jvSearch.toLowerCase();
      return (
        jv.voucherNumber.toLowerCase().includes(q) ||
        jv.description.toLowerCase().includes(q) ||
        jv.referenceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const tsaAccount = accounts.find((a) => a.code === "1020");
  const cashAccount = accounts.find((a) => a.code === "1010");
  const pendingJvCount = jvs.filter((j) => j.status === "PENDING_APPROVAL").length;
  const isReconClean = reconReport ? reconReport.variance === 0 : false;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Title Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase">
              Build Group 1 • §2.6
            </span>
            <span className="text-xs text-slate-500 font-medium">FR-GL-01 to FR-GL-05</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            Accounting & General Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Double-entry bookkeeping, chart of accounts, journal approval workflow, financial statements,
            and revenue reconciliation against Billing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              accountingApi.resetToMockData();
              loadAllData();
              showToast("Accounting data reset to default demo baseline.");
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data
          </button>

          <button
            type="button"
            onClick={() => setIsCbtModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            Cash/Bank Entry (FR-GL-01)
          </button>

          <button
            type="button"
            onClick={() => setIsJvModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            New Journal Voucher (FR-GL-02)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Treasury Single Account (CBN)</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2 font-mono">
            ₦{(tsaAccount?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Account Code: 1020</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Central Cashier Vault</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700 mt-2 font-mono">
            ₦{(cashAccount?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cash in hand collections</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Pending Vouchers</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingJvCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting Chief Accountant sign-off</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Billing Reconciliation</span>
            <GitCompare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isReconClean
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isReconClean ? "100% Reconciled" : "Posting Pending"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">FR-GL-05 Patient Revenue</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("JOURNAL_VOUCHERS")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "JOURNAL_VOUCHERS"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Journal Vouchers & Approvals (FR-GL-02)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CASH_BANK")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "CASH_BANK"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cash & Bank Register (FR-GL-01)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CHART_OF_ACCOUNTS")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "CHART_OF_ACCOUNTS"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Chart of Accounts (FR-GL-03)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STATEMENTS")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "STATEMENTS"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Financial Statements (FR-GL-04)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RECONCILIATION")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === "RECONCILIATION"
                ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GitCompare className="w-4 h-4 text-blue-600" />
            Billing Revenue Reconciliation (FR-GL-05)
          </button>
        </div>
      </div>

      {/* Tab 1: JOURNAL VOUCHERS */}
      {activeTab === "JOURNAL_VOUCHERS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, description, ref..."
                value={jvSearch}
                onChange={(e) => setJvSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Approval Status:</span>
              <select
                value={jvStatusFilter}
                onChange={(e) => setJvStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Vouchers</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="POSTED">Posted to Ledger</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading journal vouchers...
              </div>
            ) : filteredJvs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No journal vouchers found matching filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Voucher # & Date</th>
                      <th className="py-3 px-4">Narration & Reference</th>
                      <th className="py-3 px-4">Prepared By</th>
                      <th className="py-3 px-4 text-right">Debit (₦)</th>
                      <th className="py-3 px-4 text-right">Credit (₦)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Approval Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredJvs.map((jv) => (
                      <tr
                        key={jv.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedJvForView(jv)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{jv.voucherNumber}</div>
                          <div className="text-[11px] text-slate-400">{jv.date}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 max-w-sm truncate">
                            {jv.description}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Ref: {jv.referenceNumber}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{jv.preparedBy}</div>
                          <div className="text-[10px] text-slate-400">{jv.preparedByRole}</div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₦{jv.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₦{jv.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              jv.status === "POSTED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : jv.status === "APPROVED"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {jv.status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {jv.status === "PENDING_APPROVAL" ? (
                            <button
                              type="button"
                              onClick={() => handleApproveJv(jv.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Chief Accountant Approve
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Approved by {jv.approvedBy || "Audit Desk"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: CASH & BANK REGISTER (FR-GL-01) */}
      {activeTab === "CASH_BANK" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Hospital Cash & Bank Transaction Register (FR-GL-01)
              </h3>
              <button
                type="button"
                onClick={() => setIsCbtModalOpen(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
              >
                + Record Transaction
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tx # & Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Bank / Cash Account</th>
                    <th className="py-3 px-4">Contra Ledger Account</th>
                    <th className="py-3 px-4 text-right">Amount (₦)</th>
                    <th className="py-3 px-4">Channel & Ref</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {cbtList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{tx.transactionNumber}</div>
                        <div className="text-[11px] text-slate-400">{tx.date}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === "RECEIPT"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{tx.bankAccountName}</td>

                      <td className="py-3 px-4 text-slate-700">{tx.contraAccountName}</td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{tx.paymentMethod}</span>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.referenceNumber}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CHART OF ACCOUNTS (FR-GL-03) */}
      {activeTab === "CHART_OF_ACCOUNTS" && (
        <ChartOfAccountsView accounts={accounts} onCreateAccount={handleCreateAccount} />
      )}

      {/* Tab 4: FINANCIAL STATEMENTS (FR-GL-04) */}
      {activeTab === "STATEMENTS" && <FinancialStatementsView />}

      {/* Tab 5: BILLING REVENUE RECONCILIATION (FR-GL-05) */}
      {activeTab === "RECONCILIATION" && (
        <BillingReconciliationView
          report={reconReport}
          onPostReceiptToGl={handlePostReceiptToGl}
          onRefresh={loadAllData}
        />
      )}

      {/* Modals */}
      <JournalVoucherModal
        isOpen={isJvModalOpen}
        accounts={accounts}
        onClose={() => setIsJvModalOpen(false)}
        onSubmit={handleCreateJv}
      />

      <CashBankTransactionModal
        isOpen={isCbtModalOpen}
        accounts={accounts}
        onClose={() => setIsCbtModalOpen(false)}
        onSubmit={handleCreateCbt}
      />

      {/* JV Line Item Detail Modal */}
      {selectedJvForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedJvForView.voucherNumber}</h3>
                <p className="text-xs text-slate-400">
                  {selectedJvForView.date} • Ref: {selectedJvForView.referenceNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJvForView(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block">Narration:</span>
                <span className="text-slate-900">{selectedJvForView.description}</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="py-2 px-3">Account</th>
                      <th className="py-2 px-3 text-right">Debit (₦)</th>
                      <th className="py-2 px-3 text-right">Credit (₦)</th>
                      <th className="py-2 px-3">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedJvForView.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold mr-1.5">{it.accountCode}</span>
                          {it.accountName}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {it.debit > 0 ? `₦${it.debit.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {it.credit > 0 ? `₦${it.credit.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{it.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td className="py-2 px-3">Total:</td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₦{selectedJvForView.totalDebit.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₦{selectedJvForView.totalCredit.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Prepared by: {selectedJvForView.preparedBy}</span>
                <span>
                  {selectedJvForView.approvedBy
                    ? `Approved by: ${selectedJvForView.approvedBy}`
                    : "Status: Pending Approval"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
