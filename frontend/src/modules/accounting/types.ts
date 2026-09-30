export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type JournalVoucherStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "POSTED"
  | "REJECTED";

export type CashBankTransactionType = "RECEIPT" | "PAYMENT" | "TRANSFER";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "POS" | "CHEQUE";

export interface Account {
  id: string;
  code: string; // e.g., "1010", "4010"
  name: string;
  type: AccountType;
  description: string;
  parentId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface JournalEntryItem {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalVoucher {
  id: string;
  voucherNumber: string; // e.g. "JV-2026-0045"
  date: string; // YYYY-MM-DD
  referenceNumber: string;
  description: string;
  items: JournalEntryItem[];
  totalDebit: number;
  totalCredit: number;
  status: JournalVoucherStatus;
  preparedBy: string;
  preparedByRole: string;
  approvedBy?: string;
  approvedByRole?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashBankTransaction {
  id: string;
  transactionNumber: string; // e.g. "CBT-2026-0089"
  date: string;
  type: CashBankTransactionType;
  bankAccountId: string;
  bankAccountName: string;
  contraAccountId: string;
  contraAccountName: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  status: "CLEARED" | "PENDING" | "RECONCILED";
  reconciledWithBillingId?: string;
  recordedBy: string;
  createdAt: string;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  type: AccountType;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  period: string;
  items: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export interface IncomeStatementReport {
  period: string;
  revenues: { accountCode: string; name: string; amount: number }[];
  totalRevenue: number;
  expenses: { accountCode: string; name: string; amount: number }[];
  totalExpense: number;
  netSurplusOrDeficit: number;
}

export interface BalanceSheetReport {
  period: string;
  assets: { accountCode: string; name: string; amount: number }[];
  totalAssets: number;
  liabilities: { accountCode: string; name: string; amount: number }[];
  totalLiabilities: number;
  equity: { accountCode: string; name: string; amount: number }[];
  totalEquity: number;
  isBalanced: boolean;
}

export interface ReconciliationItem {
  id: string;
  billingReceiptId: string;
  receiptNumber: string;
  invoiceNumber: string;
  patientMrn: string;
  patientName: string;
  paymentMethod: string;
  billingAmount: number;
  glPostedAmount: number;
  glTransactionRef?: string;
  status: "MATCHED" | "UNPOSTED_IN_GL" | "VARIANCE";
  varianceAmount: number;
  transactionDate: string;
}

export interface BillingReconciliationReport {
  period: string;
  totalBillingRevenue: number;
  totalGlRevenue: number;
  variance: number;
  matchedCount: number;
  unpostedCount: number;
  varianceCount: number;
  items: ReconciliationItem[];
}

export interface CreateAccountRequest {
  code: string;
  name: string;
  type: AccountType;
  description: string;
  parentId?: string;
}

export interface CreateJournalVoucherRequest {
  date: string;
  referenceNumber: string;
  description: string;
  items: Omit<JournalEntryItem, "id">[];
  preparedBy: string;
  preparedByRole: string;
}

export interface CreateCashBankTransactionRequest {
  date: string;
  type: CashBankTransactionType;
  bankAccountId: string;
  contraAccountId: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  recordedBy: string;
}
