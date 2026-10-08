export type InventoryCategory =
  | 'PHARMACEUTICALS'
  | 'CONSUMABLES'
  | 'SURGICAL_INSTRUMENTS'
  | 'LAB_REAGENTS'
  | 'GENERAL_STORES';

export type UnitOfMeasure =
  | 'BOX'
  | 'VIAL'
  | 'PACK'
  | 'PIECE'
  | 'BOTTLE'
  | 'ROLL'
  | 'SET';

export type ItemStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g. MED-PAR-500
  name: string;
  category: InventoryCategory;
  unitOfMeasure: UnitOfMeasure;
  currentStock: number;
  minimumReorderLevel: number;
  bufferStockLevel: number;
  unitCost: string; // formatted e.g. ₦1,250.00
  unitCostValue: number;
  locationBin: string; // e.g. Bay A-12
  preferredVendor: string;
  status: ItemStockStatus;
  lastRestocked: string; // ISO 8601 UTC
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxIdNumber: string;
  rating: number; // 1 to 5
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface PurchaseOrderItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityOrdered: number;
  unitPrice: number;
  totalPrice: number;
}

export type POStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'FULFILLED'
  | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-0081
  vendorId: string;
  vendorName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: string;
  totalAmountValue: number;
  status: POStatus;
  approvalNotes?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: string;
}

export interface ReceivedItemDetail {
  itemId: string;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  batchNumber: string;
  expiryDate: string;
  inspectionPass: boolean;
  discrepancyReason?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-0042
  poId: string;
  poNumber: string;
  vendorName: string;
  deliveryNoteNumber: string;
  receivedDate: string;
  receivedBy: string;
  receivedItems: ReceivedItemDetail[];
  inspectionOfficer: string;
  status: 'INSPECTED_ACCEPTED' | 'REJECTED_DAMAGED';
  totalValue: string;
}

export interface SubstoreIssuanceItem {
  itemId: string;
  itemName: string;
  quantityRequested: number;
  quantityIssued: number;
  batchNumber: string;
}

export interface SubstoreIssuance {
  id: string;
  requisitionId: string;
  targetDepartment: string;
  issuedDate: string;
  issuedBy: string;
  receivedBy?: string;
  items: SubstoreIssuanceItem[];
  status: 'DISPATCHED' | 'ACKNOWLEDGED';
}

export interface InventoryMetrics {
  totalCatalogItems: number;
  totalInventoryValue: string;
  lowStockCount: number;
  outOfStockCount: number;
  pendingPurchaseOrders: number;
  pendingSubstoreRequests: number;
}
