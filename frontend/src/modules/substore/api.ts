import {
  CreateRequisitionRequest,
  Requisition,
  StockAdjustmentAuditEntry,
  StockAdjustmentRequest,
  Substore,
  SubstoreItem,
} from "./types";
import {
  INITIAL_REQUISITIONS,
  INITIAL_STOCK_AUDIT_LOGS,
  INITIAL_SUBSTORES,
  INITIAL_SUBSTORE_ITEMS,
} from "./mockData";

const STORAGE_KEY_SUBSTORES = "hims_substores_list_v1";
const STORAGE_KEY_ITEMS = "hims_substore_items_v1";
const STORAGE_KEY_REQS = "hims_substore_requisitions_v1";
const STORAGE_KEY_AUDITS = "hims_substore_audits_v1";

function getStoredSubstores(): Substore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSTORES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SUBSTORES, JSON.stringify(INITIAL_SUBSTORES));
      return INITIAL_SUBSTORES;
    }
    return JSON.parse(raw) as Substore[];
  } catch {
    return INITIAL_SUBSTORES;
  }
}

function getStoredItems(): SubstoreItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_SUBSTORE_ITEMS));
      return INITIAL_SUBSTORE_ITEMS;
    }
    return JSON.parse(raw) as SubstoreItem[];
  } catch {
    return INITIAL_SUBSTORE_ITEMS;
  }
}

function setStoredItems(items: SubstoreItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save substore items", e);
  }
}

function getStoredRequisitions(): Requisition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REQS, JSON.stringify(INITIAL_REQUISITIONS));
      return INITIAL_REQUISITIONS;
    }
    return JSON.parse(raw) as Requisition[];
  } catch {
    return INITIAL_REQUISITIONS;
  }
}

function setStoredRequisitions(reqs: Requisition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQS, JSON.stringify(reqs));
  } catch (e) {
    console.error("Failed to save requisitions", e);
  }
}

function getStoredAudits(): StockAdjustmentAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(INITIAL_STOCK_AUDIT_LOGS));
      return INITIAL_STOCK_AUDIT_LOGS;
    }
    return JSON.parse(raw) as StockAdjustmentAuditEntry[];
  } catch {
    return INITIAL_STOCK_AUDIT_LOGS;
  }
}

function setStoredAudits(audits: StockAdjustmentAuditEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(audits));
  } catch (e) {
    console.error("Failed to save stock audits", e);
  }
}

export const substoreApi = {
  // Substore discovery
  getSubstores: async (): Promise<Substore[]> => {
    return getStoredSubstores();
  },

  // FR-SS-01 & FR-SS-03: Ward/department stock items + reorder level check
  getSubstoreItems: async (substoreId?: string): Promise<SubstoreItem[]> => {
    try {
      if (substoreId) {
        const res = await fetch(`/api/v1/substores/${substoreId}/items`);
        if (res.ok) {
          return (await res.json()) as SubstoreItem[];
        }
      }
    } catch {
      // fallback
    }

    let items = getStoredItems();
    if (substoreId && substoreId !== "ALL") {
      items = items.filter((i) => i.substoreId === substoreId);
    }

    // Dynamic stock status calculation based on reorderLevel (FR-SS-03)
    return items.map((i) => {
      let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
      if (i.currentStock <= 0) {
        status = "OUT_OF_STOCK";
      } else if (i.currentStock <= i.reorderLevel) {
        status = "LOW_STOCK";
      }
      return { ...i, status };
    });
  },

  // FR-SS-02: Requisition workflow
  getRequisitions: async (substoreId?: string): Promise<Requisition[]> => {
    let reqs = getStoredRequisitions();
    if (substoreId && substoreId !== "ALL") {
      reqs = reqs.filter((r) => r.substoreId === substoreId);
    }
    return reqs.sort((a, b) => b.requisitionNumber.localeCompare(a.requisitionNumber));
  },

  createRequisition: async (req: CreateRequisitionRequest): Promise<Requisition> => {
    try {
      const res = await fetch(`/api/v1/substores/${req.substoreId}/requisitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return (await res.json()) as Requisition;
      }
    } catch {
      // fallback
    }

    const reqs = getStoredRequisitions();
    const substores = getStoredSubstores();
    const substore = substores.find((s) => s.id === req.substoreId);

    const now = new Date().toISOString();
    const serial = String(reqs.length + 80).padStart(4, "0");

    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: `REQ-2026-${serial}`,
      substoreId: req.substoreId,
      substoreName: substore?.name || "Ward Sub-store",
      wardLocation: substore?.wardLocation || "Ward Block",
      requestedBy: req.requestedBy,
      requestedByRole: req.requestedByRole,
      requestedAt: now,
      urgency: req.urgency,
      items: req.items.map((it, idx) => ({
        id: `reqi-${Date.now()}-${idx}`,
        ...it,
        approvedQty: it.requestedQty,
      })),
      status: "SUBMITTED",
      remarks: req.remarks,
    };

    reqs.unshift(newReq);
    setStoredRequisitions(reqs);
    return newReq;
  },

  fulfillRequisition: async (
    requisitionId: string,
    fulfilledBy: string
  ): Promise<Requisition> => {
    try {
      const res = await fetch(`/api/v1/substores/requisitions/${requisitionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FULFILL", fulfilledBy }),
      });
      if (res.ok) {
        return (await res.json()) as Requisition;
      }
    } catch {
      // fallback
    }

    const reqs = getStoredRequisitions();
    const idx = reqs.findIndex((r) => r.id === requisitionId);
    if (idx === -1) throw new Error("Requisition not found");

    const currentReq = reqs[idx];
    if (!currentReq) throw new Error("Requisition not found");

    const now = new Date().toISOString();
    const updatedReq: Requisition = {
      ...currentReq,
      status: "FULFILLED",
      fulfilledBy,
      fulfilledAt: now,
      approvedBy: "Central Store Officer",
      approvedAt: now,
    };

    reqs[idx] = updatedReq;
    setStoredRequisitions(reqs);

    // Increase stock in the ward substore!
    const items = getStoredItems();
    for (const reqItem of updatedReq.items) {
      const itemIdx = items.findIndex((i) => i.id === reqItem.itemId || i.itemCode === reqItem.itemCode);
      if (itemIdx >= 0) {
        const item = items[itemIdx];
        if (item) {
          const newQty = item.currentStock + (reqItem.approvedQty || reqItem.requestedQty);
          items[itemIdx] = {
            ...item,
            currentStock: newQty,
            lastRestockedAt: now,
            status: newQty <= item.reorderLevel ? "LOW_STOCK" : "IN_STOCK",
          };
        }
      }
    }
    setStoredItems(items);

    return updatedReq;
  },

  // FR-SS-04: Stock Adjustment with Mandatory Audit Log
  adjustStock: async (req: StockAdjustmentRequest): Promise<SubstoreItem> => {
    try {
      const res = await fetch(
        `/api/v1/substores/${req.substoreId}/items/${req.itemId}/adjust`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        }
      );
      if (res.ok) {
        return (await res.json()) as SubstoreItem;
      }
    } catch {
      // fallback
    }

    if (!req.auditExplanation.trim()) {
      throw new Error("Mandatory audit log justification is required for all stock adjustments.");
    }

    const items = getStoredItems();
    const itemIdx = items.findIndex((i) => i.id === req.itemId);
    if (itemIdx === -1) throw new Error("Sub-store item not found");

    const currentItem = items[itemIdx];
    if (!currentItem) throw new Error("Sub-store item not found");

    const previousQty = currentItem.currentStock;
    const newQty = Math.max(0, req.newQuantity);
    const differenceQty = newQty - previousQty;

    const now = new Date().toISOString();
    const updatedItem: SubstoreItem = {
      ...currentItem,
      currentStock: newQty,
      status: newQty <= 0 ? "OUT_OF_STOCK" : newQty <= currentItem.reorderLevel ? "LOW_STOCK" : "IN_STOCK",
    };

    items[itemIdx] = updatedItem;
    setStoredItems(items);

    // Record immutable audit entry
    const audits = getStoredAudits();
    const substores = getStoredSubstores();
    const substore = substores.find((s) => s.id === req.substoreId);

    audits.unshift({
      id: `aud-${Date.now()}`,
      substoreId: req.substoreId,
      substoreName: substore?.name || "Ward Sub-store",
      itemId: req.itemId,
      itemCode: currentItem.itemCode,
      itemName: currentItem.itemName,
      previousQty,
      newQty,
      differenceQty,
      reason: req.reason,
      auditExplanation: req.auditExplanation.trim(),
      adjustedBy: req.adjustedBy,
      adjustedAt: now,
    });
    setStoredAudits(audits);

    return updatedItem;
  },

  getAuditHistory: async (substoreId?: string): Promise<StockAdjustmentAuditEntry[]> => {
    let audits = getStoredAudits();
    if (substoreId && substoreId !== "ALL") {
      audits = audits.filter((a) => a.substoreId === substoreId);
    }
    return audits;
  },

  resetToMockData: (): void => {
    localStorage.removeItem(STORAGE_KEY_SUBSTORES);
    localStorage.removeItem(STORAGE_KEY_ITEMS);
    localStorage.removeItem(STORAGE_KEY_REQS);
    localStorage.removeItem(STORAGE_KEY_AUDITS);
  },
};
