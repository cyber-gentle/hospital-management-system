import {
  Invoice,
  CreateInvoiceInput,
  InvoicePayment,
  InvoiceLineItem,
  AgedDebtorSummary,
  InvoiceStatus,
  PayerScheme
} from './types';
import { INITIAL_INVOICES } from './mockData';

const STORAGE_KEY = 'hims_billing_invoices_v1';

function getStoredInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw) as Invoice[];
  } catch {
    return INITIAL_INVOICES;
  }
}

function setStoredInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices to storage', e);
  }
}

export const billingApi = {
  // FR-AC-02: Manage Invoices List & Filters
  getInvoices: async (filters?: {
    status?: InvoiceStatus | 'all';
    payerScheme?: PayerScheme | 'all';
    search?: string;
    includeDeleted?: boolean;
  }): Promise<Invoice[]> => {
    let list = getStoredInvoices();

    if (!filters?.includeDeleted) {
      list = list.filter(inv => !inv.isDeleted);
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(inv => inv.status === filters.status);
    }

    if (filters?.payerScheme && filters.payerScheme !== 'all') {
      list = list.filter(inv => inv.payerScheme === filters.payerScheme);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q) ||
          inv.hospitalNumber.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getInvoiceById: async (id: string): Promise<Invoice | null> => {
    const list = getStoredInvoices();
    return list.find(inv => inv.id === id) || null;
  },

  // FR-AC-01: Create New Invoice (NHIA-aware co-pay calculation)
  createInvoice: async (input: CreateInvoiceInput): Promise<Invoice> => {
    const list = getStoredInvoices();
    const isNhia = input.payerScheme === 'NHIA';

    // Calculate line items with NHIA 10% co-payment rule
    const computedItems: InvoiceLineItem[] = input.items.map((item, idx) => {
      const gross = item.unitPrice * item.quantity;
      const nhiaPortion = isNhia ? Math.round(gross * 0.9) : 0;
      const patientPortion = isNhia ? gross - nhiaPortion : gross;

      return {
        ...item,
        id: `li-${Date.now()}-${idx}`,
        grossAmount: gross,
        nhiaCoveredAmount: nhiaPortion,
        patientPayableAmount: patientPortion
      };
    });

    const totalGross = computedItems.reduce((acc, i) => acc + i.grossAmount, 0);
    const totalNhia = computedItems.reduce((acc, i) => acc + i.nhiaCoveredAmount, 0);
    const totalPatient = computedItems.reduce((acc, i) => acc + i.patientPayableAmount, 0);

    const depositDeduction = input.depositApplied || 0;
    const netDue = Math.max(0, totalPatient - depositDeduction);

    const invoiceNumber = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      patientId: input.patientId,
      patientName: input.patientName,
      hospitalNumber: input.hospitalNumber,
      admissionId: input.admissionId,
      payerScheme: input.payerScheme,
      nhiaNumber: input.nhiaNumber,
      retainershipCompany: input.retainershipCompany,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Net 14
      items: computedItems,
      totalGrossAmount: totalGross,
      totalNhiaCovered: totalNhia,
      totalPatientPayable: totalPatient,
      depositApplied: depositDeduction,
      netAmountDue: netDue,
      amountPaid: 0,
      balanceDue: netDue,
      status: netDue === 0 ? 'paid' : 'issued',
      payments: [],
      isDeleted: false,
      notes: input.notes
    };

    const updated = [newInvoice, ...list];
    setStoredInvoices(updated);
    return newInvoice;
  },

  // FR-AC-07: Payment Methods & Receipt Generation
  recordPayment: async (
    invoiceId: string,
    paymentInput: Omit<InvoicePayment, 'id' | 'receiptNumber' | 'paymentDate'>
  ): Promise<{ invoice: Invoice; receipt: InvoicePayment }> => {
    const list = getStoredInvoices();
    const invoiceIndex = list.findIndex(i => i.id === invoiceId);
    if (invoiceIndex === -1) throw new Error('Invoice not found');

    const invoice = list[invoiceIndex];
    if (!invoice) throw new Error('Invoice not found');

    const receiptNumber = `RCP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPayment: InvoicePayment = {
      ...paymentInput,
      id: `pay-${Date.now()}`,
      receiptNumber,
      paymentDate: new Date().toISOString()
    };

    const newAmountPaid = invoice.amountPaid + paymentInput.amountPaid;
    const newBalance = Math.max(0, invoice.netAmountDue - newAmountPaid);
    const newStatus: InvoiceStatus = newBalance === 0 ? 'paid' : 'partially_paid';

    const updatedInvoice: Invoice = {
      ...invoice,
      amountPaid: newAmountPaid,
      balanceDue: newBalance,
      status: newStatus,
      payments: [newPayment, ...invoice.payments]
    };

    list[invoiceIndex] = updatedInvoice;
    setStoredInvoices(list);

    return { invoice: updatedInvoice, receipt: newPayment };
  },

  // FR-AC-05: Soft Delete with Password & Audit Reason (Never Hard Delete)
  softDeleteInvoice: async (
    invoiceId: string,
    passwordConfirm: string,
    reason: string,
    deletedBy: string
  ): Promise<Invoice> => {
    // Audit verification
    if (passwordConfirm !== 'admin123' && passwordConfirm !== 'hims2026') {
      throw new Error('Invalid supervisor authorization password. Cancellation denied.');
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed cancellation justification is mandatory for financial audit compliance.');
    }

    const list = getStoredInvoices();
    const index = list.findIndex(i => i.id === invoiceId);
    if (index === -1) throw new Error('Invoice not found');

    const targetInvoice = list[index];
    if (!targetInvoice) throw new Error('Invoice not found');

    const updatedInvoice: Invoice = {
      ...targetInvoice,
      isDeleted: true,
      status: 'cancelled',
      deletedAt: new Date().toISOString(),
      deletedBy,
      deleteReason: reason
    };

    list[index] = updatedInvoice;
    setStoredInvoices(list);
    return updatedInvoice;
  },

  // FR-AC-06: Pull Consolidated Charges from Nursing Tasks & Notes at Discharge
  pullConsolidatedNursingCharges: async (admissionId: string): Promise<Omit<InvoiceLineItem, 'id' | 'grossAmount' | 'nhiaCoveredAmount' | 'patientPayableAmount'>[]> => {
    // Read nursing storage to extract charges
    try {
      const admissionsRaw = localStorage.getItem('hims_nursing_admissions_v1');
      const tasksRaw = localStorage.getItem('hims_nursing_tasks_v1');

      const admissions = admissionsRaw ? JSON.parse(admissionsRaw) : [];
      const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];

      const targetAdm = admissions.find((a: { id: string }) => a.id === admissionId);
      const targetTasks = tasks.filter((t: { admissionId: string; status: string }) => t.admissionId === admissionId && t.status === 'completed');

      const items: Omit<InvoiceLineItem, 'id' | 'grossAmount' | 'nhiaCoveredAmount' | 'patientPayableAmount'>[] = [];

      // 1. Bed days charge
      items.push({
        description: `Inpatient Bed & Nursing Care: ${targetAdm?.wardName || 'Ward'} (${targetAdm?.bedNumber || 'Bed'})`,
        category: 'Nursing / Bed',
        unitPrice: 12500,
        quantity: 2,
        source: 'nursing_discharge'
      });

      // 2. Extracted MAR tasks
      for (const t of targetTasks) {
        if (t.category === 'medication' && t.medicationDetails) {
          items.push({
            description: `e-MAR Administered: ${t.medicationDetails.drugName} ${t.medicationDetails.dosage}`,
            category: 'Pharmacy',
            unitPrice: 3500,
            quantity: 1,
            source: 'nursing_discharge'
          });
        } else if (t.category === 'dressing') {
          items.push({
            description: `Sterile Surgical Wound Dressing & Consumables`,
            category: 'Consumables',
            unitPrice: 7500,
            quantity: 1,
            source: 'nursing_discharge'
          });
        }
      }

      // 3. Discharge clinical summary fee
      items.push({
        description: 'Consultant Discharge Assessment & TTO Prescription',
        category: 'Consultation',
        unitPrice: 15000,
        quantity: 1,
        source: 'manual'
      });

      return items;
    } catch {
      // Fallback default charges
      return [
        {
          description: 'Inpatient Bed & Routine Nursing Care (2 Days)',
          category: 'Nursing / Bed',
          unitPrice: 15000,
          quantity: 2,
          source: 'nursing_discharge'
        },
        {
          description: 'Consultant Ward Round & Discharge Clearance',
          category: 'Consultation',
          unitPrice: 20000,
          quantity: 1,
          source: 'manual'
        }
      ];
    }
  },

  // FR-AC-02: Aged Debtor Summary Analysis
  getAgedSummary: async (): Promise<AgedDebtorSummary> => {
    const list = getStoredInvoices().filter(i => !i.isDeleted);
    const now = Date.now();

    let c0to30 = 0;
    let d31to60 = 0;
    let d61to90 = 0;
    let o90 = 0;
    let totalOutstanding = 0;
    let totalRevenue = 0;
    let totalCash = 0;
    let totalNhia = 0;

    for (const inv of list) {
      totalRevenue += inv.totalGrossAmount;
      totalCash += inv.amountPaid;
      totalNhia += inv.totalNhiaCovered;

      if (inv.balanceDue > 0) {
        totalOutstanding += inv.balanceDue;
        const ageDays = Math.floor((now - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24));

        if (ageDays <= 30) c0to30 += inv.balanceDue;
        else if (ageDays <= 60) d31to60 += inv.balanceDue;
        else if (ageDays <= 90) d61to90 += inv.balanceDue;
        else o90 += inv.balanceDue;
      }
    }

    return {
      current0to30: c0to30,
      days31to60: d31to60,
      days61to90: d61to90,
      over90days: o90,
      totalOutstanding,
      totalRevenueBilled: totalRevenue,
      totalCashCollected: totalCash,
      totalNhiaPending: totalNhia
    };
  }
};
