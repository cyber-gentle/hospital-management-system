// Strict TypeScript definitions for Accounts & Billing Module
// Traceable to FR-AC-01 through FR-AC-08

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';

export type PayerScheme = 'Cash' | 'NHIA' | 'Retainership';

export type PaymentMethod = 'Cash' | 'POS' | 'Bank Transfer' | 'NHIA Capitation';

export type LineItemCategory =
  | 'Consultation'
  | 'Pharmacy'
  | 'Laboratory'
  | 'Nursing / Bed'
  | 'Procedure'
  | 'Consumables';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: LineItemCategory;
  unitPrice: number; // In Nigerian Naira (₦)
  quantity: number;
  grossAmount: number;
  nhiaCoveredAmount: number; // NHIA primary payer portion
  patientPayableAmount: number; // Patient Co-payment (e.g. 10% under NHIA or 100% under Cash)
  source?: 'manual' | 'nursing_discharge' | 'lab_order' | 'pharmacy_dispense';
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  receiptNumber: string; // e.g. RCP-2026-00912
  paymentDate: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  cashierName: string;
  cashierShift: 'Morning' | 'Afternoon' | 'Night';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-00412
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  admissionId?: string;
  payerScheme: PayerScheme;
  nhiaNumber?: string;
  retainershipCompany?: string;
  createdAt: string;
  dueDate: string;
  items: InvoiceLineItem[];
  totalGrossAmount: number;
  totalNhiaCovered: number;
  totalPatientPayable: number;
  depositApplied: number; // Deducted admission deposit (FR-AC-08)
  netAmountDue: number; // Total patient payable minus deposit
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  payments: InvoicePayment[];
  isDeleted: boolean; // Soft delete only per architecture (FR-AC-05)
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
  notes?: string;
}

export interface CreateInvoiceInput {
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  admissionId?: string;
  payerScheme: PayerScheme;
  nhiaNumber?: string;
  retainershipCompany?: string;
  items: Omit<InvoiceLineItem, 'id' | 'grossAmount' | 'nhiaCoveredAmount' | 'patientPayableAmount'>[];
  depositApplied?: number;
  notes?: string;
}

export interface AgedDebtorSummary {
  current0to30: number;
  days31to60: number;
  days61to90: number;
  over90days: number;
  totalOutstanding: number;
  totalRevenueBilled: number;
  totalCashCollected: number;
  totalNhiaPending: number;
}
