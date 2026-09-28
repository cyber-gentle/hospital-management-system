import { Invoice } from './types';

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-004101',
    patientId: 'p-001',
    patientName: 'Chidi Okafor',
    hospitalNumber: 'HIMS/2026/000101',
    admissionId: 'adm-001',
    payerScheme: 'Cash',
    createdAt: '2026-09-28T09:00:00Z',
    dueDate: '2026-10-05T09:00:00Z',
    items: [
      {
        id: 'li-01',
        description: 'Inpatient Bed Charge: Male Medical Ward (2 Nights)',
        category: 'Nursing / Bed',
        unitPrice: 15000,
        quantity: 2,
        grossAmount: 30000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 30000,
        source: 'nursing_discharge'
      },
      {
        id: 'li-02',
        description: 'Consultant Specialist Review (Cardiology Initial & Daily)',
        category: 'Consultation',
        unitPrice: 20000,
        quantity: 2,
        grossAmount: 40000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 40000,
        source: 'manual'
      },
      {
        id: 'li-03',
        description: 'IV Furosemide 40mg Infusion & Giving Set (e-MAR Administered)',
        category: 'Pharmacy',
        unitPrice: 4500,
        quantity: 4,
        grossAmount: 18000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 18000,
        source: 'nursing_discharge'
      },
      {
        id: 'li-04',
        description: 'Bedside Continuous Telemetry & SpO2 Monitoring Protocol',
        category: 'Nursing / Bed',
        unitPrice: 8500,
        quantity: 2,
        grossAmount: 17000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 17000,
        source: 'nursing_discharge'
      }
    ],
    totalGrossAmount: 105000,
    totalNhiaCovered: 0,
    totalPatientPayable: 105000,
    depositApplied: 50000, // Reconciled from Admission Deposit (FR-AC-08)
    netAmountDue: 55000,
    amountPaid: 55000,
    balanceDue: 0,
    status: 'paid',
    payments: [
      {
        id: 'pay-001',
        invoiceId: 'inv-001',
        receiptNumber: 'RCP-2026-00812',
        paymentDate: '2026-09-28T14:40:00Z',
        amountPaid: 55000,
        paymentMethod: 'POS',
        transactionReference: 'STANBIC-POS-994201',
        cashierName: 'Cashier G. Alabi',
        cashierShift: 'Morning',
        notes: 'Final settlement post-deposit deduction.'
      }
    ],
    isDeleted: false,
    notes: 'Inpatient discharge billing generated upon 100% nursing checklist sign-off.'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-004102',
    patientId: 'p-002',
    patientName: 'Amina Bello',
    hospitalNumber: 'HIMS/2026/000102',
    admissionId: 'adm-003',
    payerScheme: 'NHIA',
    nhiaNumber: 'NHIA-88492019-A',
    createdAt: '2026-09-28T11:45:00Z',
    dueDate: '2026-10-12T11:45:00Z',
    items: [
      {
        id: 'li-05',
        description: 'Laparoscopic Cholecystectomy Surgical Theatre Fee',
        category: 'Procedure',
        unitPrice: 180000,
        quantity: 1,
        grossAmount: 180000,
        nhiaCoveredAmount: 162000, // 90% primary NHIA coverage
        patientPayableAmount: 18000, // 10% statutory NHIA co-payment
        source: 'manual'
      },
      {
        id: 'li-06',
        description: 'Female Surgical Ward Inpatient Bed (1 Night)',
        category: 'Nursing / Bed',
        unitPrice: 12000,
        quantity: 1,
        grossAmount: 12000,
        nhiaCoveredAmount: 10800,
        patientPayableAmount: 1200,
        source: 'nursing_discharge'
      },
      {
        id: 'li-07',
        description: 'Post-op Take Home Medications (TTO) Pack',
        category: 'Pharmacy',
        unitPrice: 15000,
        quantity: 1,
        grossAmount: 15000,
        nhiaCoveredAmount: 13500,
        patientPayableAmount: 1500,
        source: 'pharmacy_dispense'
      }
    ],
    totalGrossAmount: 207000,
    totalNhiaCovered: 186300,
    totalPatientPayable: 20700,
    depositApplied: 0,
    netAmountDue: 20700,
    amountPaid: 0,
    balanceDue: 20700,
    status: 'issued',
    payments: [],
    isDeleted: false,
    notes: 'NHIA co-payment due before discharge release clearance.'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-004103',
    patientId: 'p-003',
    patientName: 'David Adeyemi',
    hospitalNumber: 'HIMS/2026/000103',
    admissionId: 'adm-002',
    payerScheme: 'Cash',
    createdAt: '2026-09-27T11:00:00Z',
    dueDate: '2026-10-04T11:00:00Z',
    items: [
      {
        id: 'li-08',
        description: 'Diabetic Foot Ulcer Debridement & Sterile Dressing',
        category: 'Procedure',
        unitPrice: 35000,
        quantity: 1,
        grossAmount: 35000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 35000,
        source: 'manual'
      },
      {
        id: 'li-09',
        description: 'Wound Swab Microbiology Culture & Sensitivity',
        category: 'Laboratory',
        unitPrice: 12000,
        quantity: 1,
        grossAmount: 12000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 12000,
        source: 'lab_order'
      },
      {
        id: 'li-10',
        description: 'IV Ceftriaxone 1g + Normal Saline Infusions',
        category: 'Pharmacy',
        unitPrice: 8000,
        quantity: 2,
        grossAmount: 16000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 16000,
        source: 'pharmacy_dispense'
      }
    ],
    totalGrossAmount: 63000,
    totalNhiaCovered: 0,
    totalPatientPayable: 63000,
    depositApplied: 0, // Pending deposit flagged in Nursing
    netAmountDue: 63000,
    amountPaid: 30000,
    balanceDue: 33000,
    status: 'partially_paid',
    payments: [
      {
        id: 'pay-002',
        invoiceId: 'inv-003',
        receiptNumber: 'RCP-2026-00789',
        paymentDate: '2026-09-27T15:30:00Z',
        amountPaid: 30000,
        paymentMethod: 'Cash',
        cashierName: 'Cashier G. Alabi',
        cashierShift: 'Morning',
        notes: 'Part-payment on admission.'
      }
    ],
    isDeleted: false,
    notes: 'Outstanding balance pending pharmacy reconciliation.'
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-004098',
    patientId: 'p-007',
    patientName: 'Musa Abubakar',
    hospitalNumber: 'HIMS/2026/000107',
    admissionId: 'adm-004',
    payerScheme: 'Retainership',
    retainershipCompany: 'Nigerian National Petroleum Corporation (NNPC)',
    createdAt: '2026-09-20T10:00:00Z',
    dueDate: '2026-10-20T10:00:00Z',
    items: [
      {
        id: 'li-11',
        description: 'Comprehensive Inpatient Pneumonia Management Protocol',
        category: 'Nursing / Bed',
        unitPrice: 85000,
        quantity: 1,
        grossAmount: 85000,
        nhiaCoveredAmount: 0,
        patientPayableAmount: 85000,
        source: 'nursing_discharge'
      }
    ],
    totalGrossAmount: 85000,
    totalNhiaCovered: 0,
    totalPatientPayable: 85000,
    depositApplied: 0,
    netAmountDue: 85000,
    amountPaid: 0,
    balanceDue: 85000,
    status: 'issued',
    payments: [],
    isDeleted: false,
    notes: 'Direct corporate corporate billing. Net 30 terms.'
  }
];
