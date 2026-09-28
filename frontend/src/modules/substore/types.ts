export type ItemCategory =
  | "CONSUMABLE"
  | "PHARMACEUTICAL"
  | "SURGICAL_SUPPLY"
  | "LINEN_AND_STATIONERY"
  | "DIAGNOSTIC_REAGENT";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type RequisitionStatus = "SUBMITTED" | "APPROVED" | "FULFILLED" | "REJECTED";

export type StockAdjustmentReason =
  | "DAMAGED"
  | "EXPIRED"
  | "PHYSICAL_COUNT_CORRECTION"
  | "EMERGENCY_DISPENSE"
  | "INTER_WARD_TRANSFER";

export interface Substore {
  id: string;
  code: string; // e.g. "SS-MALE-MED"
  name: string;
  department: string;
  wardLocation: string;
  managerName: string;
  managerRole: string;
  contactPhone: string;
}

export interface SubstoreItem {
  id: string;
  substoreId: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number; // FR-SS-03: Ward-level reorder point tracking
  maxCapacity: number;
  unitCost: number;
  lastRestockedAt: string;
  status: StockStatus;
}

export interface RequisitionItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  requestedQty: number;
  approvedQty?: number;
  unitOfMeasure: string;
  unitCost: number;
}

export interface Requisition {
  id: string;
  requisitionNumber: string; // e.g. "REQ-2026-0081"
  substoreId: string;
  substoreName: string;
  wardLocation: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
  items: RequisitionItem[];
  status: RequisitionStatus;
  approvedBy?: string;
  approvedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  remarks?: string;
}

export interface StockAdjustmentRequest {
  substoreId: string;
  itemId: string;
  newQuantity: number;
  reason: StockAdjustmentReason;
  auditExplanation: string; // FR-SS-04: Mandatory audit explanation
  adjustedBy: string;
}

export interface StockAdjustmentAuditEntry {
  id: string;
  substoreId: string;
  substoreName: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  previousQty: number;
  newQty: number;
  differenceQty: number;
  reason: StockAdjustmentReason;
  auditExplanation: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface CreateRequisitionRequest {
  substoreId: string;
  urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
  remarks?: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    requestedQty: number;
    unitOfMeasure: string;
    unitCost: number;
  }[];
  requestedBy: string;
  requestedByRole: string;
}
