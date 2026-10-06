import { requireDemoMode } from '../../lib/demo';
import { fallbackFetch, rethrowBackendRejection } from '../../lib/fallback';
import {
  Account,
  BalanceSheetReport,
  BillingReconciliationReport,
  CashBankTransaction,
  CreateAccountRequest,
  CreateCashBankTransactionRequest,
  CreateJournalVoucherRequest,
  IncomeStatementReport,
  JournalVoucher,
  ReconciliationItem,
  TrialBalanceReport,
} from "./types";
import {
  INITIAL_CHART_OF_ACCOUNTS,
  INITIAL_CASH_BANK_TRANSACTIONS,
  INITIAL_JOURNAL_VOUCHERS,
  INITIAL_RECONCILIATION_ITEMS,
} from "./mockData";
import { billingApi } from '../billing/api';

const STORAGE_KEY_ACCOUNTS = "hims_accounting_accounts_v1";
const STORAGE_KEY_JV = "hims_accounting_jv_v1";
const STORAGE_KEY_CBT = "hims_accounting_cbt_v1";
const STORAGE_KEY_RECON = "hims_accounting_recon_v1";

function getStoredAccounts(): Account[] {
  requireDemoMode();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(INITIAL_CHART_OF_ACCOUNTS));
      return structuredClone(INITIAL_CHART_OF_ACCOUNTS);
    }
    return JSON.parse(raw) as Account[];
  } catch (error) {
    rethrowBackendRejection(error);
    return structuredClone(INITIAL_CHART_OF_ACCOUNTS);
  }
}

function setStoredAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save chart of accounts", e);
    throw new Error('Unable to save this action. Browser storage is unavailable.', { cause: e });
  }
}

function getStoredJVs(): JournalVoucher[] {
  requireDemoMode();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JV);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_JV, JSON.stringify(INITIAL_JOURNAL_VOUCHERS));
      return structuredClone(INITIAL_JOURNAL_VOUCHERS);
    }
    return JSON.parse(raw) as JournalVoucher[];
  } catch (error) {
    rethrowBackendRejection(error);
    return structuredClone(INITIAL_JOURNAL_VOUCHERS);
  }
}

function setStoredJVs(jvs: JournalVoucher[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_JV, JSON.stringify(jvs));
  } catch (e) {
    console.error("Failed to save journal vouchers", e);
    throw new Error('Unable to save this action. Browser storage is unavailable.', { cause: e });
  }
}

function getStoredCBT(): CashBankTransaction[] {
  requireDemoMode();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CBT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CBT, JSON.stringify(INITIAL_CASH_BANK_TRANSACTIONS));
      return structuredClone(INITIAL_CASH_BANK_TRANSACTIONS);
    }
    return JSON.parse(raw) as CashBankTransaction[];
  } catch (error) {
    rethrowBackendRejection(error);
    return structuredClone(INITIAL_CASH_BANK_TRANSACTIONS);
  }
}

function setStoredCBT(txs: CashBankTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CBT, JSON.stringify(txs));
  } catch (e) {
    console.error("Failed to save cash/bank transactions", e);
    throw new Error('Unable to save this action. Browser storage is unavailable.', { cause: e });
  }
}

function getStoredRecon(): ReconciliationItem[] {
  requireDemoMode();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECON);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RECON, JSON.stringify(INITIAL_RECONCILIATION_ITEMS));
      return structuredClone(INITIAL_RECONCILIATION_ITEMS);
    }
    return JSON.parse(raw) as ReconciliationItem[];
  } catch (error) {
    rethrowBackendRejection(error);
    return structuredClone(INITIAL_RECONCILIATION_ITEMS);
  }
}

function setStoredRecon(items: ReconciliationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECON, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save reconciliation items", e);
    throw new Error('Unable to save this action. Browser storage is unavailable.', { cause: e });
  }
}

export const accountingApi = {
  // FR-GL-03: Chart of Accounts
  getAccounts: async (): Promise<Account[]> => {
    try {
      const res = await fallbackFetch("/api/v1/accounting/chart-of-accounts");
      if (res.ok) {
        return (await res.json()) as Account[];
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }
    return getStoredAccounts();
  },

  createAccount: async (req: CreateAccountRequest): Promise<Account> => {
    try {
      const res = await fallbackFetch("/api/v1/accounting/chart-of-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return (await res.json()) as Account;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((a) => a.code === req.code);
    if (existing) {
      throw new Error(`Account code ${req.code} already exists.`);
    }

    const newAccount: Account = {
      id: `acc-${req.code}`,
      code: req.code,
      name: req.name,
      type: req.type,
      description: req.description,
      parentId: req.parentId,
      balance: 0,
      currency: "NGN",
      isActive: true,
    };

    accounts.push(newAccount);
    setStoredAccounts(accounts);
    return newAccount;
  },

  // FR-GL-02: Journal Vouchers + Approval Workflow
  getJournalVouchers: async (): Promise<JournalVoucher[]> => {
    try {
      const res = await fallbackFetch("/api/v1/accounting/journal-vouchers");
      if (res.ok) {
        return (await res.json()) as JournalVoucher[];
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }
    return getStoredJVs().sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  },

  createJournalVoucher: async (req: CreateJournalVoucherRequest): Promise<JournalVoucher> => {
    try {
      const res = await fallbackFetch("/api/v1/accounting/journal-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return (await res.json()) as JournalVoucher;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const accounts = getStoredAccounts();
    if (req.items.length < 2 || req.items.some(item => {
      const account = accounts.find(a => a.id === item.accountId && a.code === item.accountCode && a.isActive);
      return !account || !Number.isFinite(item.debit) || !Number.isFinite(item.credit) || item.debit < 0 || item.credit < 0 ||
        (item.debit > 0) === (item.credit > 0) ||
        Math.abs(item.debit * 100 - Math.round(item.debit * 100)) > 0.000001 || Math.abs(item.credit * 100 - Math.round(item.credit * 100)) > 0.000001;
    })) throw new Error('Journal lines require active matching accounts and a positive debit or credit at kobo precision.');
    const debitKobo = req.items.reduce((sum, item) => sum + Math.round(item.debit * 100), 0);
    const creditKobo = req.items.reduce((sum, item) => sum + Math.round(item.credit * 100), 0);
    const totalDebit = debitKobo / 100;
    const totalCredit = creditKobo / 100;

    if (!Number.isSafeInteger(debitKobo) || !Number.isSafeInteger(creditKobo) || debitKobo !== creditKobo) {
      throw new Error(
        `Journal entry is out of balance. Total Debit (₦${totalDebit.toLocaleString()}) must equal Total Credit (₦${totalCredit.toLocaleString()}).`
      );
    }

    const jvs = getStoredJVs();
    const now = new Date().toISOString();
    const serial = String(jvs.length + 44).padStart(4, "0");

    const newJV: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: `JV-2026-${serial}`,
      date: req.date,
      referenceNumber: req.referenceNumber || `REF-${Date.now()}`,
      description: req.description,
      items: req.items.map((item, idx) => ({
        ...item,
        id: `jvi-${Date.now()}-${idx}`,
      })),
      totalDebit,
      totalCredit,
      status: "PENDING_APPROVAL",
      preparedBy: req.preparedBy,
      preparedByRole: req.preparedByRole,
      createdAt: now,
      updatedAt: now,
    };

    jvs.unshift(newJV);
    setStoredJVs(jvs);
    return newJV;
  },

  approveJournalVoucher: async (
    voucherId: string,
    approverName: string,
    approverRole: string
  ): Promise<JournalVoucher> => {
    try {
      const res = await fallbackFetch(`/api/v1/accounting/journal-vouchers/${voucherId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverName, approverRole }),
      });
      if (res.ok) {
        return (await res.json()) as JournalVoucher;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const jvs = getStoredJVs();
    const jvIndex = jvs.findIndex((j) => j.id === voucherId);
    if (jvIndex === -1) throw new Error("Journal voucher not found");

    const currentJv = jvs[jvIndex];
    if (!currentJv) throw new Error("Journal voucher not found");
	if (currentJv.status === 'POSTED') return currentJv;
	if (currentJv.status !== 'PENDING_APPROVAL') throw new Error('Only pending vouchers can be approved.');

    const now = new Date().toISOString();
    const updatedJv: JournalVoucher = {
      ...currentJv,
      status: "POSTED",
      approvedBy: approverName,
      approvedByRole: approverRole,
      approvedAt: now,
      updatedAt: now,
    };

    // Update account balances
    const accounts = getStoredAccounts();
    for (const item of updatedJv.items) {
      const accIndex = accounts.findIndex((a) => a.id === item.accountId || a.code === item.accountCode);
      if (accIndex >= 0) {
        const acc = accounts[accIndex];
        if (acc) {
          // Assets & Expenses increase with Debit, decrease with Credit
          // Liabilities, Equity, Revenue increase with Credit, decrease with Debit
          if (acc.type === "ASSET" || acc.type === "EXPENSE") {
            accounts[accIndex] = {
              ...acc,
              balance: acc.balance + (item.debit - item.credit),
            };
          } else {
            accounts[accIndex] = {
              ...acc,
              balance: acc.balance + (item.credit - item.debit),
            };
          }
        }
      }
    }

    setStoredAccounts(accounts);
    jvs[jvIndex] = updatedJv;
    setStoredJVs(jvs);
    return updatedJv;
  },

  // FR-GL-01: Cash & Bank Transaction Recording
  getCashBankTransactions: async (): Promise<CashBankTransaction[]> => {
    return getStoredCBT().sort((a, b) => b.transactionNumber.localeCompare(a.transactionNumber));
  },

  createCashBankTransaction: async (
    req: CreateCashBankTransactionRequest
  ): Promise<CashBankTransaction> => {
    const txs = getStoredCBT();
    const accounts = getStoredAccounts();
    const bankAcc = accounts.find((a) => a.id === req.bankAccountId);
    const contraAcc = accounts.find((a) => a.id === req.contraAccountId);

    if (!bankAcc || !contraAcc) {
      throw new Error("Specified accounts not found in General Ledger.");
    }
    if (!bankAcc.isActive || !contraAcc.isActive || bankAcc.id === contraAcc.id || bankAcc.type !== 'ASSET' || !Number.isFinite(req.amount) || req.amount <= 0 || Math.abs(req.amount * 100 - Math.round(req.amount * 100)) > 0.000001) throw new Error('Cash/bank transactions require distinct active accounts and a positive amount at kobo precision.');

    const serial = String(txs.length + 124).padStart(4, "0");
    const now = new Date().toISOString();

    const newTx: CashBankTransaction = {
      id: `cbt-${Date.now()}`,
      transactionNumber: `CBT-2026-${serial}`,
      date: req.date,
      type: req.type,
      bankAccountId: bankAcc.id,
      bankAccountName: bankAcc.name,
      contraAccountId: contraAcc.id,
      contraAccountName: contraAcc.name,
      amount: req.amount,
      description: req.description,
      paymentMethod: req.paymentMethod,
      referenceNumber: req.referenceNumber,
      status: "CLEARED",
      recordedBy: req.recordedBy,
      createdAt: now,
    };

    txs.unshift(newTx);
    setStoredCBT(txs);

    // Update balances
    if (req.type === "RECEIPT") {
      bankAcc.balance += req.amount;
      contraAcc.balance += (contraAcc.type === 'ASSET' || contraAcc.type === 'EXPENSE') ? -req.amount : req.amount;
    } else {
      bankAcc.balance -= req.amount;
      contraAcc.balance += (contraAcc.type === 'ASSET' || contraAcc.type === 'EXPENSE') ? req.amount : -req.amount;
    }
    setStoredAccounts(accounts);

    return newTx;
  },

  // FR-GL-04: Financial Statement Generation
  getTrialBalance: async (period = "September 2026"): Promise<TrialBalanceReport> => {
    try {
      const res = await fallbackFetch(`/api/v1/accounting/statements/trial-balance?period=${period}`);
      if (res.ok) {
        return (await res.json()) as TrialBalanceReport;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const accounts = getStoredAccounts();
    let totalDebit = 0;
    let totalCredit = 0;

    const items = accounts.map((acc) => {
      let debit = 0;
      let credit = 0;
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        debit = Math.max(0, acc.balance);
        credit = Math.max(0, -acc.balance);
      } else {
        credit = Math.max(0, acc.balance);
        debit = Math.max(0, -acc.balance);
      }
      totalDebit += debit;
      totalCredit += credit;
      return {
        accountCode: acc.code,
        accountName: acc.name,
        type: acc.type,
        debit,
        credit,
      };
    });

    return {
      period,
      items,
      totalDebit,
      totalCredit,
      isBalanced: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
    };
  },

  getIncomeStatement: async (period = "September 2026"): Promise<IncomeStatementReport> => {
    try {
      const res = await fallbackFetch(`/api/v1/accounting/statements/income-statement?period=${period}`);
      if (res.ok) {
        return (await res.json()) as IncomeStatementReport;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const accounts = getStoredAccounts();
    const revenues = accounts
      .filter((a) => a.type === "REVENUE")
      .map((a) => ({ accountCode: a.code, name: a.name, amount: a.balance }));
    const expenses = accounts
      .filter((a) => a.type === "EXPENSE")
      .map((a) => ({ accountCode: a.code, name: a.name, amount: a.balance }));

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    return {
      period,
      revenues,
      totalRevenue,
      expenses,
      totalExpense,
      netSurplusOrDeficit: totalRevenue - totalExpense,
    };
  },

  getBalanceSheet: async (period = "September 2026"): Promise<BalanceSheetReport> => {
    try {
      const res = await fallbackFetch(`/api/v1/accounting/statements/balance-sheet?period=${period}`);
      if (res.ok) {
        return (await res.json()) as BalanceSheetReport;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const accounts = getStoredAccounts();
    const assets = accounts
      .filter((a) => a.type === "ASSET")
      .map((a) => ({ accountCode: a.code, name: a.name, amount: a.balance }));
    const liabilities = accounts
      .filter((a) => a.type === "LIABILITY")
      .map((a) => ({ accountCode: a.code, name: a.name, amount: a.balance }));
    const equity = accounts
      .filter((a) => a.type === "EQUITY")
      .map((a) => ({ accountCode: a.code, name: a.name, amount: a.balance }));
    const currentSurplus = accounts.reduce((sum, account) => sum + (account.type === 'REVENUE' ? account.balance : account.type === 'EXPENSE' ? -account.balance : 0), 0);
    equity.push({ accountCode: 'CURRENT-SURPLUS', name: 'Current operating surplus / deficit', amount: currentSurplus });

    const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
    const totalEquity = equity.reduce((s, e) => s + e.amount, 0);

    return {
      period,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      isBalanced: Math.round(totalAssets * 100) === Math.round((totalLiabilities + totalEquity) * 100),
    };
  },

  // FR-GL-05: Patient Revenue Reconciliation against Billing
  getBillingReconciliation: async (period = "September 2026"): Promise<BillingReconciliationReport> => {
    try {
      const res = await fallbackFetch(`/api/v1/accounting/reconciliation/${period}`);
      if (res.ok) {
        return (await res.json()) as BillingReconciliationReport;
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // fallback
    }

    const items = getStoredRecon();
    for (const invoice of await billingApi.getInvoices({ includeDeleted: true })) {
      for (const receipt of invoice.payments) {
        if (items.some(i => i.billingReceiptId === receipt.id)) continue;
        items.push({ id: `recon-${receipt.id}`, billingReceiptId: receipt.id, receiptNumber: receipt.receiptNumber,
          invoiceNumber: invoice.invoiceNumber, patientMrn: invoice.hospitalNumber, patientName: invoice.patientName,
          paymentMethod: receipt.paymentMethod, billingAmount: receipt.amountPaid, glPostedAmount: 0,
          varianceAmount: receipt.amountPaid, status: 'UNPOSTED_IN_GL', transactionDate: receipt.paymentDate });
      }
    }
    setStoredRecon(items);
    const totalBillingRevenue = items.reduce((s, i) => s + i.billingAmount, 0);
    const totalGlRevenue = items.reduce((s, i) => s + i.glPostedAmount, 0);
    const variance = totalBillingRevenue - totalGlRevenue;

    const matchedCount = items.filter((i) => i.status === "MATCHED").length;
    const unpostedCount = items.filter((i) => i.status === "UNPOSTED_IN_GL").length;
    const varianceCount = items.filter((i) => i.status === "VARIANCE").length;

    return {
      period,
      totalBillingRevenue,
      totalGlRevenue,
      variance,
      matchedCount,
      unpostedCount,
      varianceCount,
      items,
    };
  },

  // Auto-post unposted billing receipt to GL (reconciliation trigger)
  postReceiptToGl: async (reconId: string): Promise<ReconciliationItem> => {
    const items = getStoredRecon();
    const idx = items.findIndex((i) => i.id === reconId);
    if (idx === -1) throw new Error("Reconciliation item not found");

    const currentItem = items[idx];
    if (!currentItem) throw new Error("Reconciliation item not found");
    if (currentItem.status === 'MATCHED') return currentItem;
    if (currentItem.glPostedAmount !== 0) throw new Error('Partially posted receipts require manual reconciliation.');

    const accounts = getStoredAccounts();
    const cashCode = currentItem.paymentMethod === 'Cash' || currentItem.paymentMethod === 'CASH' ? '1010' : '1020';
    const cashAccount = accounts.find(a => a.code === cashCode);
    const revenueAccount = accounts.find(a => a.code === '4010');
    if (!cashAccount || !revenueAccount) throw new Error('Reconciliation accounts not found.');

    const now = new Date().toISOString();
    const glRef = `JV-AUTO-${currentItem.billingReceiptId}`;

    const updatedItem: ReconciliationItem = {
      ...currentItem,
      status: "MATCHED",
      glPostedAmount: currentItem.billingAmount,
      varianceAmount: 0,
      glTransactionRef: glRef,
    };

    items[idx] = updatedItem;
    setStoredRecon(items);

    // Also record a corresponding cash/bank or JV entry
    const jvs = getStoredJVs();
    jvs.unshift({
      id: `jv-auto-${Date.now()}`,
      voucherNumber: glRef,
      date: now.split("T")[0] || "2026-09-28",
      referenceNumber: currentItem.receiptNumber,
      description: `Auto-reconciled billing receipt ${currentItem.receiptNumber} (${currentItem.patientName} - ${currentItem.patientMrn})`,
      items: [
        {
          id: `jvi-auto-1`,
          accountId: cashAccount.id,
          accountCode: cashAccount.code,
          accountName: cashAccount.name,
          debit: currentItem.billingAmount,
          credit: 0,
          memo: `Billing settlement via ${currentItem.paymentMethod}`,
        },
        {
          id: `jvi-auto-2`,
          accountId: "acc-4010",
          accountCode: "4010",
          accountName: "Patient Consultation Fees Revenue",
          debit: 0,
          credit: currentItem.billingAmount,
          memo: "Automated billing reconciliation posting",
        },
      ],
      totalDebit: currentItem.billingAmount,
      totalCredit: currentItem.billingAmount,
      status: "POSTED",
      preparedBy: "Billing Reconciliation Engine",
      preparedByRole: "SYSTEM",
      approvedBy: "Mrs. Nkechi Okafor",
      approvedByRole: "CHIEF_ACCOUNTANT",
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    setStoredJVs(jvs);

    cashAccount.balance += currentItem.billingAmount;
    revenueAccount.balance += currentItem.billingAmount;
    setStoredAccounts(accounts);

    return updatedItem;
  },

  resetToMockData: (): void => {
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEY_JV);
    localStorage.removeItem(STORAGE_KEY_CBT);
    localStorage.removeItem(STORAGE_KEY_RECON);
  },
};
