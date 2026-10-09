import {
  InventoryItem,
  Vendor,
  PurchaseOrder,
  GoodsReceiptNote,
  SubstoreIssuance
} from './types';

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'INV-ITEM-001',
    itemCode: 'MED-CEF-1G',
    name: 'Ceftriaxone Sodium 1g Powder for Injection',
    category: 'PHARMACEUTICALS',
    unitOfMeasure: 'VIAL',
    currentStock: 450,
    minimumReorderLevel: 150,
    bufferStockLevel: 500,
    unitCost: '₦1,850.00',
    unitCostValue: 1850,
    locationBin: 'Pharmacy Bay A-04',
    preferredVendor: 'Fidson Healthcare Plc',
    status: 'IN_STOCK',
    lastRestocked: '2026-10-02T10:00:00Z'
  },
  {
    id: 'INV-ITEM-002',
    itemCode: 'IV-SAL-500',
    name: 'Normal Saline 0.9% IV Infusion 500ml',
    category: 'PHARMACEUTICALS',
    unitOfMeasure: 'BOTTLE',
    currentStock: 80,
    minimumReorderLevel: 120,
    bufferStockLevel: 300,
    unitCost: '₦650.00',
    unitCostValue: 650,
    locationBin: 'Main Fluid Bay F-01',
    preferredVendor: 'Emzor Pharmaceuticals Ltd',
    status: 'LOW_STOCK',
    lastRestocked: '2026-09-20T14:30:00Z'
  },
  {
    id: 'INV-ITEM-003',
    itemCode: 'CON-GLV-75',
    name: 'Surgical Sterile Gloves Size 7.5 (Box of 50 pairs)',
    category: 'CONSUMABLES',
    unitOfMeasure: 'BOX',
    currentStock: 25,
    minimumReorderLevel: 40,
    bufferStockLevel: 100,
    unitCost: '₦8,500.00',
    unitCostValue: 8500,
    locationBin: 'Consumables Bay C-12',
    preferredVendor: 'Medline Surgical Supplies Nigeria',
    status: 'LOW_STOCK',
    lastRestocked: '2026-09-15T09:15:00Z'
  },
  {
    id: 'INV-ITEM-004',
    itemCode: 'SUR-SUT-CAT',
    name: 'Chromic Catgut 2-0 Suture with 30mm Needle (Box of 12)',
    category: 'SURGICAL_INSTRUMENTS',
    unitOfMeasure: 'BOX',
    currentStock: 65,
    minimumReorderLevel: 30,
    bufferStockLevel: 80,
    unitCost: '₦14,200.00',
    unitCostValue: 14200,
    locationBin: 'Theatre Stores Bay S-02',
    preferredVendor: 'Medline Surgical Supplies Nigeria',
    status: 'IN_STOCK',
    lastRestocked: '2026-09-28T11:45:00Z'
  },
  {
    id: 'INV-ITEM-005',
    itemCode: 'LAB-EDTA-TUB',
    name: 'Vacutainer K2 EDTA Blood Collection Tubes 4ml (Pack of 100)',
    category: 'LAB_REAGENTS',
    unitOfMeasure: 'PACK',
    currentStock: 110,
    minimumReorderLevel: 50,
    bufferStockLevel: 120,
    unitCost: '₦7,800.00',
    unitCostValue: 7800,
    locationBin: 'Lab Cold Stores Bay L-01',
    preferredVendor: 'Chi Pharmaceuticals Nigeria',
    status: 'IN_STOCK',
    lastRestocked: '2026-10-04T08:00:00Z'
  },
  {
    id: 'INV-ITEM-006',
    itemCode: 'CON-SYR-05',
    name: 'Disposable Syringes with Needle 5ml (Box of 100)',
    category: 'CONSUMABLES',
    unitOfMeasure: 'BOX',
    currentStock: 0,
    minimumReorderLevel: 60,
    bufferStockLevel: 150,
    unitCost: '₦4,200.00',
    unitCostValue: 4200,
    locationBin: 'Consumables Bay C-03',
    preferredVendor: 'Emzor Pharmaceuticals Ltd',
    status: 'OUT_OF_STOCK',
    lastRestocked: '2026-09-01T16:20:00Z'
  },
  {
    id: 'INV-ITEM-007',
    itemCode: 'LAB-MAL-RDT',
    name: 'Malaria Pf/Pan Antigen Rapid Diagnostic Test Kits (Box of 25)',
    category: 'LAB_REAGENTS',
    unitOfMeasure: 'BOX',
    currentStock: 140,
    minimumReorderLevel: 50,
    bufferStockLevel: 150,
    unitCost: '₦9,500.00',
    unitCostValue: 9500,
    locationBin: 'Diagnostic Bay D-08',
    preferredVendor: 'Chi Pharmaceuticals Nigeria',
    status: 'IN_STOCK',
    lastRestocked: '2026-10-05T13:10:00Z'
  },
  {
    id: 'INV-ITEM-008',
    itemCode: 'GEN-DIS-MET',
    name: 'Methylated Hospital Spirit 70% Disinfectant (4L Gallon)',
    category: 'GENERAL_STORES',
    unitOfMeasure: 'BOTTLE',
    currentStock: 35,
    minimumReorderLevel: 20,
    bufferStockLevel: 50,
    unitCost: '₦5,800.00',
    unitCostValue: 5800,
    locationBin: 'General Bulk Storage Bay G-09',
    preferredVendor: 'Emzor Pharmaceuticals Ltd',
    status: 'IN_STOCK',
    lastRestocked: '2026-09-22T10:40:00Z'
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'VND-001',
    name: 'Fidson Healthcare Plc',
    category: 'Pharmaceuticals & Antibiotics',
    contactPerson: 'Mr. Babatunde Alabi',
    email: 'orders@fidson.com.ng',
    phone: '08023456789',
    address: 'KM 38 Lagos-Abeokuta Expressway, Sango Ota, Ogun State',
    taxIdNumber: 'TIN-09283711-001',
    rating: 5,
    status: 'ACTIVE'
  },
  {
    id: 'VND-002',
    name: 'Emzor Pharmaceuticals Ltd',
    category: 'Infusions, Analgesics & Consumables',
    contactPerson: 'Mrs. Chika Nnadi',
    email: 'institutional.sales@emzorpharma.com',
    phone: '08039876543',
    address: 'Plot 3C Block A, Ajao Estate, Isolo, Lagos',
    taxIdNumber: 'TIN-48201944-002',
    rating: 4,
    status: 'ACTIVE'
  },
  {
    id: 'VND-003',
    name: 'Medline Surgical Supplies Nigeria',
    category: 'Surgical Instruments & Sutures',
    contactPerson: 'Dr. Danladi Bello',
    email: 'bello@medlinesurgical.ng',
    phone: '08091122334',
    address: 'Plot 14 Central Business District, Abuja FCT',
    taxIdNumber: 'TIN-59102831-003',
    rating: 5,
    status: 'ACTIVE'
  },
  {
    id: 'VND-004',
    name: 'Chi Pharmaceuticals Nigeria',
    category: 'Diagnostic Reagents & Test Kits',
    contactPerson: 'Mr. Kingsley Uche',
    email: 'diagnostics@chipharm.com',
    phone: '08077889900',
    address: '14 Chivita Avenue, Ajao Estate, Lagos',
    taxIdNumber: 'TIN-66291038-004',
    rating: 4,
    status: 'ACTIVE'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-2026-0081',
    poNumber: 'PO-2026-0081',
    vendorId: 'VND-002',
    vendorName: 'Emzor Pharmaceuticals Ltd',
    orderDate: '2026-10-06',
    expectedDeliveryDate: '2026-10-12',
    items: [
      {
        itemId: 'INV-ITEM-002',
        itemCode: 'IV-SAL-500',
        itemName: 'Normal Saline 0.9% IV Infusion 500ml',
        quantityOrdered: 500,
        unitPrice: 650,
        totalPrice: 325000
      },
      {
        itemId: 'INV-ITEM-006',
        itemCode: 'CON-SYR-05',
        itemName: 'Disposable Syringes with Needle 5ml (Box of 100)',
        quantityOrdered: 200,
        unitPrice: 4200,
        totalPrice: 840000
      }
    ],
    totalAmount: '₦1,165,000.00',
    totalAmountValue: 1165000,
    status: 'APPROVED',
    approvalNotes: 'Approved by Medical Director for Q4 emergency stock replenishment',
    approvedBy: 'Prof. A. A. Danjuma (Medical Director)',
    createdBy: 'Mallam Sani (Procurement Officer)',
    createdAt: '2026-10-06T11:20:00Z'
  },
  {
    id: 'PO-2026-0080',
    poNumber: 'PO-2026-0080',
    vendorId: 'VND-003',
    vendorName: 'Medline Surgical Supplies Nigeria',
    orderDate: '2026-09-25',
    expectedDeliveryDate: '2026-10-02',
    items: [
      {
        itemId: 'INV-ITEM-003',
        itemCode: 'CON-GLV-75',
        itemName: 'Surgical Sterile Gloves Size 7.5 (Box of 50 pairs)',
        quantityOrdered: 100,
        unitPrice: 8500,
        totalPrice: 850000
      },
      {
        itemId: 'INV-ITEM-004',
        itemCode: 'SUR-SUT-CAT',
        itemName: 'Chromic Catgut 2-0 Suture with 30mm Needle (Box of 12)',
        quantityOrdered: 50,
        unitPrice: 14200,
        totalPrice: 710000
      }
    ],
    totalAmount: '₦1,560,000.00',
    totalAmountValue: 1560000,
    status: 'FULFILLED',
    approvalNotes: 'Emergency Theatre inventory procurement clearance granted',
    approvedBy: 'Dr. Fatima Abdullahi (HOD Theatre)',
    createdBy: 'Mallam Sani (Procurement Officer)',
    createdAt: '2026-09-25T09:40:00Z'
  },
  {
    id: 'PO-2026-0082',
    poNumber: 'PO-2026-0082',
    vendorId: 'VND-001',
    vendorName: 'Fidson Healthcare Plc',
    orderDate: '2026-10-08',
    expectedDeliveryDate: '2026-10-15',
    items: [
      {
        itemId: 'INV-ITEM-001',
        itemCode: 'MED-CEF-1G',
        itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
        quantityOrdered: 600,
        unitPrice: 1850,
        totalPrice: 1110000
      }
    ],
    totalAmount: '₦1,110,000.00',
    totalAmountValue: 1110000,
    status: 'SUBMITTED_FOR_APPROVAL',
    createdBy: 'Mallam Sani (Procurement Officer)',
    createdAt: '2026-10-08T14:10:00Z'
  }
];

export const INITIAL_GRNS: GoodsReceiptNote[] = [
  {
    id: 'GRN-2026-0042',
    grnNumber: 'GRN-2026-0042',
    poId: 'PO-2026-0080',
    poNumber: 'PO-2026-0080',
    vendorName: 'Medline Surgical Supplies Nigeria',
    deliveryNoteNumber: 'WAYBILL-MED-88912',
    receivedDate: '2026-10-02T13:45:00Z',
    receivedBy: 'Oluwaseun Adeleke (Storekeeper)',
    receivedItems: [
      {
        itemId: 'INV-ITEM-003',
        itemName: 'Surgical Sterile Gloves Size 7.5 (Box of 50 pairs)',
        quantityOrdered: 100,
        quantityReceived: 100,
        batchNumber: 'BATCH-GLV-26-09',
        expiryDate: '2029-08-31',
        inspectionPass: true
      },
      {
        itemId: 'INV-ITEM-004',
        itemName: 'Chromic Catgut 2-0 Suture with 30mm Needle (Box of 12)',
        quantityOrdered: 50,
        quantityReceived: 50,
        batchNumber: 'BATCH-SUT-2026-B',
        expiryDate: '2028-11-30',
        inspectionPass: true
      }
    ],
    inspectionOfficer: 'Pharm. Ibrahim Sani (Chief Quality Officer)',
    status: 'INSPECTED_ACCEPTED',
    totalValue: '₦1,560,000.00'
  }
];

export const INITIAL_ISSUANCES: SubstoreIssuance[] = [
  {
    id: 'ISS-2026-019',
    requisitionId: 'REQ-2026-081',
    targetDepartment: 'Operating Theatre Sub-Store',
    issuedDate: '2026-10-07T11:30:00Z',
    issuedBy: 'Oluwaseun Adeleke (Central Storekeeper)',
    receivedBy: 'Staff Nurse B. Chukwuma',
    items: [
      {
        itemId: 'INV-ITEM-003',
        itemName: 'Surgical Sterile Gloves Size 7.5 (Box of 50 pairs)',
        quantityRequested: 15,
        quantityIssued: 15,
        batchNumber: 'BATCH-GLV-26-09'
      },
      {
        itemId: 'INV-ITEM-004',
        itemName: 'Chromic Catgut 2-0 Suture with 30mm Needle (Box of 12)',
        quantityRequested: 10,
        quantityIssued: 10,
        batchNumber: 'BATCH-SUT-2026-B'
      }
    ],
    status: 'ACKNOWLEDGED'
  },
  {
    id: 'ISS-2026-020',
    requisitionId: 'REQ-2026-084',
    targetDepartment: 'Accident & Emergency Sub-Store',
    issuedDate: '2026-10-08T09:15:00Z',
    issuedBy: 'Oluwaseun Adeleke (Central Storekeeper)',
    items: [
      {
        itemId: 'INV-ITEM-001',
        itemName: 'Ceftriaxone Sodium 1g Powder for Injection',
        quantityRequested: 50,
        quantityIssued: 50,
        batchNumber: 'BATCH-CEF-26-44'
      }
    ],
    status: 'DISPATCHED'
  }
];
