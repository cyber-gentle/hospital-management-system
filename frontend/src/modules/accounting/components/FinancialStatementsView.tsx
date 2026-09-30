import React, { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Scale,
  Calendar,
} from "lucide-react";
import {
  BalanceSheetReport,
  IncomeStatementReport,
  TrialBalanceReport,
} from "../types";
import { accountingApi } from "../api";

export const FinancialStatementsView: React.FC = () => {
  const [statementType, setStatementType] = useState<
    "TRIAL_BALANCE" | "INCOME_STATEMENT" | "BALANCE_SHEET"
  >("TRIAL_BALANCE");
  const [period, setPeriod] = useState<string>("September 2026");

  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStatements = async () => {
      setIsLoading(true);
      try {
        const [tb, is, bs] = await Promise.all([
          accountingApi.getTrialBalance(period),
          accountingApi.getIncomeStatement(period),
          accountingApi.getBalanceSheet(period),
        ]);
        setTrialBalance(tb);
        setIncomeStatement(is);
        setBalanceSheet(bs);
      } catch (err) {
        console.error("Failed to load statements", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStatements();
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Statement Type & Period Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatementType("TRIAL_BALANCE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              statementType === "TRIAL_BALANCE"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Scale className="w-4 h-4" />
            Trial Balance (Dr = Cr)
          </button>

          <button
            type="button"
            onClick={() => setStatementType("INCOME_STATEMENT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              statementType === "INCOME_STATEMENT"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Statement of Financial Performance (P&L)
          </button>

          <button
            type="button"
            onClick={() => setStatementType("BALANCE_SHEET")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              statementType === "BALANCE_SHEET"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Statement of Financial Position (Balance Sheet)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Reporting Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="September 2026">September 2026 (Current)</option>
              <option value="August 2026">August 2026</option>
              <option value="Q3 2026">Q3 2026</option>
              <option value="FY 2026">Full Year 2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Statement
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Generating financial statements...
        </div>
      ) : statementType === "TRIAL_BALANCE" && trialBalance ? (
        /* --- TRIAL BALANCE --- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              Federal Teaching Hospital
            </h2>
            <p className="text-sm font-bold text-blue-700 mt-0.5">
              Trial Balance Report (FR-GL-04)
            </p>
            <p className="text-xs text-slate-500 mt-1">Period: {trialBalance.period} • Currency: NGN (₦)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Account Title</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4 text-right">Debit (₦)</th>
                  <th className="py-2.5 px-4 text-right">Credit (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {trialBalance.items.map((item) => (
                  <tr key={item.accountCode} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {item.accountCode}
                    </td>
                    <td className="py-2.5 px-4">{item.accountName}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {item.debit > 0
                        ? `₦${item.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {item.credit > 0
                        ? `₦${item.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-black text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-slate-900 uppercase">
                    Total Ledger Debits and Credits
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm">
                    ₦{trialBalance.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm">
                    ₦{trialBalance.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              trialBalance.isBalanced
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {trialBalance.isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>
                {trialBalance.isBalanced
                  ? "General Ledger is Perfectly Balanced (Total Debits = Total Credits)"
                  : "Ledger Imbalance Detected!"}
              </span>
            </div>
            <span className="font-mono text-xs">
              Difference: ₦
              {Math.abs(trialBalance.totalDebit - trialBalance.totalCredit).toLocaleString()}
            </span>
          </div>
        </div>
      ) : statementType === "INCOME_STATEMENT" && incomeStatement ? (
        /* --- INCOME STATEMENT (PROFIT & LOSS) --- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              Federal Teaching Hospital
            </h2>
            <p className="text-sm font-bold text-blue-700 mt-0.5">
              Statement of Financial Performance (Income Statement)
            </p>
            <p className="text-xs text-slate-500 mt-1">Period: {incomeStatement.period} • Currency: NGN (₦)</p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Operating Revenues */}
            <div>
              <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-xs border-b border-emerald-200 pb-1.5">
                Hospital Operating Revenues (Internal Generated Revenue)
              </h3>
              <div className="divide-y divide-slate-100 mt-2">
                {incomeStatement.revenues.map((rev) => (
                  <div key={rev.accountCode} className="py-2 flex items-center justify-between font-medium">
                    <span className="text-slate-800">
                      <span className="font-mono font-bold text-slate-500 mr-2">{rev.accountCode}</span>
                      {rev.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₦{rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 pt-2 flex items-center justify-between font-bold text-slate-900 text-sm">
                <span>Total Operating Revenue:</span>
                <span className="font-mono text-emerald-700">
                  ₦{incomeStatement.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <h3 className="font-bold text-rose-800 uppercase tracking-wider text-xs border-b border-rose-200 pb-1.5">
                Clinical & Hospital Operating Expenses
              </h3>
              <div className="divide-y divide-slate-100 mt-2">
                {incomeStatement.expenses.map((exp) => (
                  <div key={exp.accountCode} className="py-2 flex items-center justify-between font-medium">
                    <span className="text-slate-800">
                      <span className="font-mono font-bold text-slate-500 mr-2">{exp.accountCode}</span>
                      {exp.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₦{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 pt-2 flex items-center justify-between font-bold text-slate-900 text-sm">
                <span>Total Operating Expenses:</span>
                <span className="font-mono text-rose-700">
                  ₦{incomeStatement.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Net Operating Surplus */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-300 flex items-center justify-between font-extrabold text-sm">
              <span className="uppercase text-slate-900">
                Net Hospital Operating Surplus / (Deficit):
              </span>
              <span
                className={`font-mono text-base ${
                  incomeStatement.netSurplusOrDeficit >= 0
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                ₦{incomeStatement.netSurplusOrDeficit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      ) : statementType === "BALANCE_SHEET" && balanceSheet ? (
        /* --- BALANCE SHEET --- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              Federal Teaching Hospital
            </h2>
            <p className="text-sm font-bold text-blue-700 mt-0.5">
              Statement of Financial Position (Balance Sheet)
            </p>
            <p className="text-xs text-slate-500 mt-1">Period: {balanceSheet.period} • Currency: NGN (₦)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* ASSETS */}
            <div className="space-y-4">
              <h3 className="font-bold text-blue-800 uppercase tracking-wider text-xs border-b border-blue-200 pb-1.5">
                Hospital Assets
              </h3>
              <div className="divide-y divide-slate-100">
                {balanceSheet.assets.map((asset) => (
                  <div key={asset.accountCode} className="py-2 flex items-center justify-between font-medium">
                    <span className="text-slate-800">
                      <span className="font-mono text-slate-500 mr-2">{asset.accountCode}</span>
                      {asset.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₦{asset.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex items-center justify-between font-extrabold text-sm text-slate-900">
                <span>TOTAL ASSETS:</span>
                <span className="font-mono text-blue-700">
                  ₦{balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-bold text-rose-800 uppercase tracking-wider text-xs border-b border-rose-200 pb-1.5">
                  Current Liabilities
                </h3>
                <div className="divide-y divide-slate-100">
                  {balanceSheet.liabilities.map((liab) => (
                    <div key={liab.accountCode} className="py-2 flex items-center justify-between font-medium">
                      <span className="text-slate-800">
                        <span className="font-mono text-slate-500 mr-2">{liab.accountCode}</span>
                        {liab.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₦{liab.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between font-bold text-slate-900">
                  <span>Total Liabilities:</span>
                  <span className="font-mono text-rose-700">
                    ₦{balanceSheet.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-purple-800 uppercase tracking-wider text-xs border-b border-purple-200 pb-1.5">
                  Capital & Accumulated Reserves
                </h3>
                <div className="divide-y divide-slate-100">
                  {balanceSheet.equity.map((eq) => (
                    <div key={eq.accountCode} className="py-2 flex items-center justify-between font-medium">
                      <span className="text-slate-800">
                        <span className="font-mono text-slate-500 mr-2">{eq.accountCode}</span>
                        {eq.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₦{eq.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex items-center justify-between font-bold text-slate-900">
                  <span>Total Capital & Reserves:</span>
                  <span className="font-mono text-purple-700">
                    ₦{balanceSheet.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-slate-900 pt-2 flex items-center justify-between font-extrabold text-sm text-slate-900">
                <span>TOTAL LIABILITIES & RESERVES:</span>
                <span className="font-mono text-purple-700">
                  ₦{(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
