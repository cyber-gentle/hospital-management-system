import { rethrowBackendRejection } from "../../lib/fallback";
import { DEMO_MODE } from "../../lib/demo";
import { apiRequest } from "../../lib/api";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import {
  InventoryItem,
  Vendor,
  PurchaseOrder,
  GoodsReceiptNote,
  SubstoreIssuance,
  InventoryMetrics,
  POStatus
} from './types';
import {
  INITIAL_INVENTORY_ITEMS,
  INITIAL_VENDORS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_GRNS,
  INITIAL_ISSUANCES
} from './mockData';

const STORAGE_KEY_ITEMS = 'hims_inv_items_v1';
const STORAGE_KEY_VENDORS = 'hims_inv_vendors_v1';
const STORAGE_KEY_POS = 'hims_inv_pos_v1';
const STORAGE_KEY_GRNS = 'hims_inv_grns_v1';
const STORAGE_KEY_ISSUANCES = 'hims_inv_issuances_v1';

class InventoryApi {
  private initStorage(): void {
    requireDemoMode();
    if (!localStorage.getItem(STORAGE_KEY_ITEMS)) {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_INVENTORY_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEY_VENDORS)) {
      localStorage.setItem(STORAGE_KEY_VENDORS, JSON.stringify(INITIAL_VENDORS));
    }
    if (!localStorage.getItem(STORAGE_KEY_POS)) {
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(INITIAL_PURCHASE_ORDERS));
    }
    if (!localStorage.getItem(STORAGE_KEY_GRNS)) {
      localStorage.setItem(STORAGE_KEY_GRNS, JSON.stringify(INITIAL_GRNS));
    }
    if (!localStorage.getItem(STORAGE_KEY_ISSUANCES)) {
      localStorage.setItem(STORAGE_KEY_ISSUANCES, JSON.stringify(INITIAL_ISSUANCES));
    }
  }

  // Items
  private getStoredItems(): InventoryItem[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_ITEMS);
      return data ? JSON.parse(data) : INITIAL_INVENTORY_ITEMS;
    } catch (error) {
      rethrowBackendRejection(error);
      return INITIAL_INVENTORY_ITEMS;
    }
  }

  private saveItems(items: InventoryItem[]): void {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }

  // Vendors
  private getStoredVendors(): Vendor[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_VENDORS);
      return data ? JSON.parse(data) : INITIAL_VENDORS;
    } catch (error) {
      rethrowBackendRejection(error);
      return INITIAL_VENDORS;
    }
  }

  // POs
  private getStoredPOs(): PurchaseOrder[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_POS);
      return data ? JSON.parse(data) : INITIAL_PURCHASE_ORDERS;
    } catch (error) {
      rethrowBackendRejection(error);
      return INITIAL_PURCHASE_ORDERS;
    }
  }

  private savePOs(pos: PurchaseOrder[]): void {
    localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
  }

  // GRNs
  private getStoredGRNs(): GoodsReceiptNote[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_GRNS);
      return data ? JSON.parse(data) : INITIAL_GRNS;
    } catch (error) {
      rethrowBackendRejection(error);
      return INITIAL_GRNS;
    }
  }

  private saveGRNs(grns: GoodsReceiptNote[]): void {
    localStorage.setItem(STORAGE_KEY_GRNS, JSON.stringify(grns));
  }

  // Issuances
  private getStoredIssuances(): SubstoreIssuance[] {
    this.initStorage();
    try {
      const data = localStorage.getItem(STORAGE_KEY_ISSUANCES);
      return data ? JSON.parse(data) : INITIAL_ISSUANCES;
    } catch (error) {
      rethrowBackendRejection(error);
      return INITIAL_ISSUANCES;
    }
  }

  private saveIssuances(issuances: SubstoreIssuance[]): void {
    localStorage.setItem(STORAGE_KEY_ISSUANCES, JSON.stringify(issuances));
  }

  // --- Item Operations ---

  async getItems(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<InventoryItem[]> {
    try {
      const q = new URLSearchParams();
      if (params?.category && params.category !== 'ALL') q.append('category', params.category);
      if (params?.status && params.status !== 'ALL') q.append('status', params.status);
      if (params?.search) q.append('search', params.search);

      const res = await strictModuleFetch(`/api/v1/inventory/items?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    let items = this.getStoredItems();
    if (params) {
      if (params.category && params.category !== 'ALL') {
        items = items.filter((i) => i.category === params.category);
      }
      if (params.status && params.status !== 'ALL') {
        items = items.filter((i) => i.status === params.status);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(query) ||
            i.itemCode.toLowerCase().includes(query) ||
            i.locationBin.toLowerCase().includes(query) ||
            i.preferredVendor.toLowerCase().includes(query)
        );
      }
    }
    return items;
  }

  async createItem(
    item: Omit<InventoryItem, 'id' | 'status' | 'lastRestocked'>
  ): Promise<InventoryItem> {
    try {
      const res = await strictModuleFetch('/api/v1/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const items = this.getStoredItems();
    const status =
      item.currentStock === 0
        ? 'OUT_OF_STOCK'
        : item.currentStock <= item.minimumReorderLevel
        ? 'LOW_STOCK'
        : 'IN_STOCK';

    const newItem: InventoryItem = {
      ...item,
      id: `INV-ITEM-${String(items.length + 1).padStart(3, '0')}`,
      status,
      lastRestocked: new Date().toISOString()
    };
    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  }

  async adjustStock(id: string, quantity: number, reason: string): Promise<InventoryItem> {
    if (!Number.isSafeInteger(quantity) || quantity === 0 || !reason.trim()) throw new Error('Adjustment needs a nonzero integer quantity and reason');
    if (!DEMO_MODE) return apiRequest<InventoryItem>(`/inventory/items/${encodeURIComponent(id)}/adjust`, {method:'POST',body:JSON.stringify({quantity,reason})});
    const current = this.getStoredItems().find(item => item.id === id);
    if (!current) throw new Error('Item not found');
    return this.updateItemStock(id, current.currentStock + quantity);
  }

  async updateItemStock(id: string, newStock: number): Promise<InventoryItem> {
    requireDemoMode();
    if (!Number.isSafeInteger(newStock) || newStock < 0) throw new Error("Stock must be a nonnegative integer");
    const items = this.getStoredItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);

    const current = items[index]!;
    const status =
      newStock === 0
        ? 'OUT_OF_STOCK'
        : newStock <= current.minimumReorderLevel
        ? 'LOW_STOCK'
        : 'IN_STOCK';

    const updated: InventoryItem = {
      ...current,
      currentStock: newStock,
      status,
      lastRestocked: new Date().toISOString()
    };
    items[index] = updated;
    this.saveItems(items);
    return updated;
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    if (!DEMO_MODE) return apiRequest<InventoryItem>(`/inventory/items/${encodeURIComponent(id)}`, {method:"PATCH",body:JSON.stringify(updates)});
    const items = this.getStoredItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);

    const current = items[index]!;
    const updated: InventoryItem = {
      ...current,
      ...updates
    };
    if (updates.currentStock !== undefined || updates.minimumReorderLevel !== undefined) {
      const stock = updated.currentStock;
      const min = updated.minimumReorderLevel;
      updated.status = stock === 0 ? 'OUT_OF_STOCK' : stock <= min ? 'LOW_STOCK' : 'IN_STOCK';
    }
    items[index] = updated;
    this.saveItems(items);
    return updated;
  }

  // --- Vendors ---

  async getVendors(): Promise<Vendor[]> {
    if (!DEMO_MODE) return apiRequest<Vendor[]>("/inventory/vendors");
    return this.getStoredVendors();
  }

  // --- Purchase Orders ---

  async getPurchaseOrders(params?: { status?: string }): Promise<PurchaseOrder[]> {
    try {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') q.append('status', params.status);

      const res = await strictModuleFetch(`/api/v1/inventory/pos?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    let pos = this.getStoredPOs();
    if (params?.status && params.status !== 'ALL') {
      pos = pos.filter((p) => p.status === params.status);
    }
    return pos;
  }

  async createPurchaseOrder(
    po: Omit<PurchaseOrder, 'id' | 'createdAt'>
  ): Promise<PurchaseOrder> {
    if (!DEMO_MODE) return apiRequest<PurchaseOrder>("/inventory/pos", {method:"POST",body:JSON.stringify(po)});
    const pos = this.getStoredPOs();
    const newPO: PurchaseOrder = {
      ...po,
      id: `PO-2026-${String(pos.length + 83).padStart(4, '0')}`,
      createdAt: new Date().toISOString()
    };
    pos.unshift(newPO);
    this.savePOs(pos);
    return newPO;
  }

  async updatePOStatus(
    id: string,
    status: POStatus,
    approvedBy?: string,
    approvalNotes?: string
  ): Promise<PurchaseOrder> {
    if (!DEMO_MODE) return apiRequest<PurchaseOrder>(`/inventory/pos/${encodeURIComponent(id)}/status`, {method:"PATCH",body:JSON.stringify({status,approvedBy,approvalNotes})});
    const pos = this.getStoredPOs();
    const index = pos.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Purchase Order ${id} not found`);

    const updated: PurchaseOrder = {
      ...pos[index]!,
      status,
      approvedBy: approvedBy || pos[index]!.approvedBy,
      approvalNotes: approvalNotes || pos[index]!.approvalNotes
    };
    pos[index] = updated;
    this.savePOs(pos);
    return updated;
  }

  // --- Goods Receipt Notes ---

  async getGoodsReceiptNotes(): Promise<GoodsReceiptNote[]> {
    if (!DEMO_MODE) return apiRequest<GoodsReceiptNote[]>("/inventory/grns");
    return this.getStoredGRNs();
  }

  async createGoodsReceiptNote(
    grn: Omit<GoodsReceiptNote, 'id'>
  ): Promise<GoodsReceiptNote> {
    if (!DEMO_MODE) return apiRequest<GoodsReceiptNote>("/inventory/grns", {method:"POST",body:JSON.stringify(grn)});
    const grns = this.getStoredGRNs();
    if (grns.some(existing => existing.grnNumber === grn.grnNumber)) throw new Error('Receipt already recorded');
    if (!grn.receivedItems.length || grn.receivedItems.some(line => !Number.isSafeInteger(line.quantityReceived) || line.quantityReceived < 0)) throw new Error('Invalid receipt quantity');
    const order = this.getStoredPOs().find(po => po.id === grn.poId);
    if (!order) throw new Error('Purchase order not found');
    const catalog = this.getStoredItems();
    const received = new Set<string>();
    for (const line of grn.receivedItems) {
      const ordered = order.items.find(item => item.itemId === line.itemId);
      const previous = grns.filter(existing => existing.poId === grn.poId && existing.status === 'INSPECTED_ACCEPTED').flatMap(existing => existing.receivedItems).filter(item => item.itemId === line.itemId && item.inspectionPass).reduce((sum,item) => sum + item.quantityReceived,0);
      if (received.has(line.itemId) || !ordered || !catalog.some(item => item.id === line.itemId) || line.quantityReceived + previous > ordered.quantityOrdered) throw new Error('Invalid or excessive receipt quantity');
      received.add(line.itemId);
    }
    const newGRN: GoodsReceiptNote = {
      ...grn,
      id: `GRN-2026-${String(grns.length + 43).padStart(4, '0')}`
    };
    grns.unshift(newGRN);
    this.saveGRNs(grns);

    // Auto increment stock for inspected accepted items
    if (grn.status === 'INSPECTED_ACCEPTED') {
      for (const item of grn.receivedItems) {
        if (item.inspectionPass && item.quantityReceived > 0) {
          const storedItem = this.getStoredItems().find((i) => i.id === item.itemId);
          if (storedItem) {
            await this.updateItemStock(item.itemId, storedItem.currentStock + item.quantityReceived);
          }
        }
      }
    }

    // Mark PO as fulfilled or partially received
    if (grn.status === 'INSPECTED_ACCEPTED') {
      const accepted = [newGRN, ...grns.filter(existing => existing.id !== newGRN.id)].filter(receipt => receipt.poId === grn.poId && receipt.status === 'INSPECTED_ACCEPTED');
      const complete = order.items.every(line => accepted.flatMap(receipt => receipt.receivedItems).filter(item => item.itemId === line.itemId && item.inspectionPass).reduce((sum,item) => sum + item.quantityReceived,0) >= line.quantityOrdered);
      await this.updatePOStatus(grn.poId, complete ? 'FULFILLED' : 'PARTIALLY_RECEIVED', undefined, 'Receipt ' + newGRN.grnNumber);
    }

    return newGRN;
  }

  // --- Substore Issuance ---

  async getSubstoreIssuances(): Promise<SubstoreIssuance[]> {
    if (!DEMO_MODE) return apiRequest<SubstoreIssuance[]>("/inventory/issuances");
    return this.getStoredIssuances();
  }

  async createSubstoreIssuance(
    issuance: Omit<SubstoreIssuance, 'id'>
  ): Promise<SubstoreIssuance> {
    if (!DEMO_MODE) return apiRequest<SubstoreIssuance>("/inventory/issuances", {method:"POST",body:JSON.stringify(issuance)});
    const catalog = this.getStoredItems();
    const seen = new Set<string>();
    if (!issuance.items.length) throw new Error('At least one item is required');
    for (const line of issuance.items) {
      const item = catalog.find(i => i.id === line.itemId);
      if (seen.has(line.itemId) || !item || !Number.isSafeInteger(line.quantityIssued) || line.quantityIssued <= 0 || line.quantityIssued > item.currentStock) throw new Error('Invalid issuance quantity or insufficient stock');
      seen.add(line.itemId);
    }
    const issuances = this.getStoredIssuances();
    const newIssuance: SubstoreIssuance = {
      ...issuance,
      id: `ISS-2026-${String(issuances.length + 21).padStart(3, '0')}`
    };
    issuances.unshift(newIssuance);
    this.saveIssuances(issuances);

    // Decrement central stock for issued items
    for (const item of issuance.items) {
      const stored = this.getStoredItems().find((i) => i.id === item.itemId);
      if (stored) {
        const remaining = stored.currentStock - item.quantityIssued;
        await this.updateItemStock(item.itemId, remaining);
      }
    }

    return newIssuance;
  }

  // --- Metrics ---

  async getInventoryMetrics(): Promise<InventoryMetrics> {
    if (!DEMO_MODE) return apiRequest<InventoryMetrics>("/inventory/metrics");
    const items = this.getStoredItems();
    const pos = this.getStoredPOs();
    const issuances = this.getStoredIssuances();

    const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK').length;
    const outOfStockCount = items.filter((i) => i.status === 'OUT_OF_STOCK').length;
    const pendingPurchaseOrders = pos.filter((p) => p.status === 'SUBMITTED_FOR_APPROVAL' || p.status === 'APPROVED').length;
    const pendingSubstoreRequests = issuances.filter((i) => i.status === 'DISPATCHED').length;

    const totalVal = items.reduce((acc, i) => acc + i.currentStock * i.unitCostValue, 0);
    const totalInventoryValue = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(totalVal);

    return {
      totalCatalogItems: items.length,
      totalInventoryValue,
      lowStockCount,
      outOfStockCount,
      pendingPurchaseOrders,
      pendingSubstoreRequests
    };
  }
}

export const inventoryApi = new InventoryApi();
