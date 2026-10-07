import { fallbackFetch, rethrowBackendRejection } from '@/lib/fallback';
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
import type { InpatientAdmission, NursingTask, DischargeDossier } from '../nursing/types';
import type { Prescription } from '../pharmacy/types';
import { requireDemoMode } from '../../lib/demo';

const STORAGE_KEY = 'hims_billing_invoices_v1';

function getStoredInvoices(): Invoice[] {
	requireDemoMode();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
      return structuredClone(INITIAL_INVOICES);
    }
    return JSON.parse(raw) as Invoice[];
  } catch {
    return structuredClone(INITIAL_INVOICES);
  }
}

function setStoredInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices to storage', e);
	throw new Error('Unable to save this action. Browser storage is unavailable.', { cause: e });
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
    try {
      const res = await fallbackFetch('/api/v1/billing/invoices');
      if (res.ok) {
         let list = await res.json();
         if (!filters?.includeDeleted) list = list.filter((i:any) => !i.isDeleted);
         return list;
      }
    } catch (error) {
      rethrowBackendRejection(error);
    }

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
    try {
      const res = await fallbackFetch('/api/v1/billing/invoices', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch(error) {
      rethrowBackendRejection(error);
    }

    const list = getStoredInvoices();
    const existing = input.admissionId ? list.find(i => i.admissionId === input.admissionId && !i.isDeleted) : undefined;
    if (existing) return existing;
    if (input.admissionId) {
      const admissions: InpatientAdmission[] = JSON.parse(localStorage.getItem('hims_nursing_admissions_v1') || '[]');
      const admission = admissions.find(a => a.id === input.admissionId);
      const dossiers: DischargeDossier[] = JSON.parse(localStorage.getItem('hims_nursing_discharges_v1') || '[]');
      const dossier = dossiers.find(d => d.admissionId === input.admissionId);
      if (!admission || admission.patientId !== input.patientId || !dossier || !dossier.items.length || !dossier.items.every(i => i.completed)) {
        throw new Error('The patient admission must have a 100% complete discharge checklist.');
      }
    }
    if (!input.items.length || input.items.some(i => !Number.isFinite(i.unitPrice) || i.unitPrice < 0 || Math.abs(i.unitPrice * 100 - Math.round(i.unitPrice * 100)) > 0.000001 || !Number.isSafeInteger(i.quantity) || i.quantity <= 0)) {
      throw new Error('Invoice items require a valid price and positive quantity.');
    }
    if (input.depositApplied !== undefined && (!Number.isFinite(input.depositApplied) || input.depositApplied < 0)) throw new Error('Deposit must be a non-negative amount.');
    const isNhia = input.payerScheme === 'NHIA';

    // Calculate line items with NHIA 10% co-payment rule
    const computedItems: InvoiceLineItem[] = input.items.map((item, idx) => {
      const grossKobo = Math.round(item.unitPrice * 100) * item.quantity;
      if (!Number.isSafeInteger(grossKobo)) throw new Error('Invoice amount exceeds supported precision.');
      const nhiaKobo = isNhia ? Math.round(grossKobo * 90 / 100) : 0;
      const gross = grossKobo / 100;
      const nhiaPortion = nhiaKobo / 100;
      const patientPortion = (grossKobo - nhiaKobo) / 100;

      return {
        ...item,
        id: `li-${Date.now()}-${idx}`,
        grossAmount: gross,
        nhiaCoveredAmount: nhiaPortion,
        patientPayableAmount: patientPortion
      };
    });

    const totalGross = computedItems.reduce((acc, i) => acc + Math.round(i.grossAmount * 100), 0) / 100;
    const totalNhia = computedItems.reduce((acc, i) => acc + Math.round(i.nhiaCoveredAmount * 100), 0) / 100;
    const totalPatient = computedItems.reduce((acc, i) => acc + Math.round(i.patientPayableAmount * 100), 0) / 100;

    const depositDeduction = input.depositApplied || 0;
    const netDue = Math.max(0, Math.round(totalPatient * 100) - Math.round(depositDeduction * 100)) / 100;

    const invoiceNumber = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newInvoice: Invoice = {
      id: `inv-${crypto.randomUUID()}`,
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
    try {
      const res = await fallbackFetch('/api/v1/billing/payments', {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ invoiceId, amountPaid: paymentInput.amountPaid, paymentMethod: paymentInput.paymentMethod, reference: paymentInput.transactionReference, collectedBy: paymentInput.cashierName })
      });
      if (res.ok) {
         // Could return it here, but we will just let it fall through for now or return it
      }
    } catch(error) {
      rethrowBackendRejection(error);
    }

    const list = getStoredInvoices();
    const invoiceIndex = list.findIndex(i => i.id === invoiceId);
    if (invoiceIndex === -1) throw new Error('Invoice not found');

    const invoice = list[invoiceIndex];
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.isDeleted || invoice.status === 'cancelled' || paymentInput.invoiceId !== invoiceId || !Number.isFinite(paymentInput.amountPaid) || paymentInput.amountPaid <= 0 || paymentInput.amountPaid > invoice.balanceDue) {
      throw new Error('Payment must be positive, within the outstanding balance, and for an active invoice.');
    }

    const receiptNumber = `RCP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPayment: InvoicePayment = {
      ...paymentInput,
      id: `pay-${crypto.randomUUID()}`,
      receiptNumber,
      paymentDate: new Date().toISOString()
    };

    const newAmountPaid = (Math.round(invoice.amountPaid * 100) + Math.round(paymentInput.amountPaid * 100)) / 100;
    const newBalance = Math.max(0, Math.round(invoice.netAmountDue * 100) - Math.round(newAmountPaid * 100)) / 100;
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

      const admissions: InpatientAdmission[] = admissionsRaw ? JSON.parse(admissionsRaw) : [];
      const tasks: NursingTask[] = tasksRaw ? JSON.parse(tasksRaw) : [];

      const targetAdm = admissions.find((a: { id: string }) => a.id === admissionId);
      if (!targetAdm) throw new Error('Admission not found');
      const targetTasks = tasks.filter((t: { admissionId: string; status: string }) => t.admissionId === admissionId && t.status === 'completed');

      const items: Omit<InvoiceLineItem, 'id' | 'grossAmount' | 'nhiaCoveredAmount' | 'patientPayableAmount'>[] = [];

      // 1. Bed days charge
      items.push({
        description: `Inpatient Bed & Nursing Care: ${targetAdm?.wardName || 'Ward'} (${targetAdm?.bedNumber || 'Bed'})`,
        category: 'Nursing / Bed',
        unitPrice: 12500,
        quantity: Math.max(1, Math.ceil((Date.now() - Date.parse(targetAdm.admissionDate)) / 86400000)),
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

      // Use only explicitly admission-linked dispensing; never import another stay's medicines.
      const prescriptions: Prescription[] = JSON.parse(localStorage.getItem('hims_pharmacy_prescriptions_v1') || '[]');
      for (const rx of prescriptions.filter(r => r.admissionId === admissionId && r.status !== 'cancelled')) {
        for (const item of rx.items.filter(i => i.quantityDispensed > 0)) {
          items.push({ description: `Dispensed: ${item.drugName} (${rx.prescriptionNumber})`, category: 'Pharmacy', unitPrice: item.unitPrice, quantity: item.quantityDispensed, source: 'pharmacy_dispense' });
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
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unable to read the admission charges');
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
