import { MOCK_LAB_ORDERS } from "./mockData";
import { LabOrder, SpecimenDetails, TestResult, ResultParameter } from "./types";

const STORAGE_KEY = "hims_laboratory_orders";
const API_BASE = "/api/v1/lab";

const getLocalOrders = (): LabOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_LAB_ORDERS));
      return MOCK_LAB_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_LAB_ORDERS;
  }
};

const setLocalOrders = (orders: LabOrder[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error("Failed to persist laboratory orders to localStorage", err);
  }
};

export const laboratoryApi = {
  getOrders: async (): Promise<LabOrder[]> => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      return getLocalOrders();
    }
  },

  collectSpecimen: async (
    orderId: string,
    specimen: Omit<SpecimenDetails, "specimenBarcode" | "collectedAt">
  ): Promise<LabOrder> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/collect-specimen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specimen)
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const orders = getLocalOrders();
      const barcode = `SMP-${Math.floor(10000 + Math.random() * 90000)}`;
      const updated = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "SPECIMEN_COLLECTED" as const,
            specimen: {
              ...specimen,
              specimenBarcode: barcode,
              collectedAt: new Date().toISOString()
            }
          };
        }
        return o;
      });
      setLocalOrders(updated);
      const target = updated.find(o => o.id === orderId);
      if (!target) throw new Error("Order not found");
      return target;
    }
  },

  rejectSpecimen: async (orderId: string, rejectionReason: string): Promise<LabOrder> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/reject-specimen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const orders = getLocalOrders();
      const updated = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "REJECTED" as const,
            specimen: o.specimen
              ? { ...o.specimen, rejectionReason }
              : {
                  specimenBarcode: "REJECTED",
                  sampleType: "N/A",
                  containerType: "N/A",
                  collectedAt: new Date().toISOString(),
                  collectedBy: "Staff",
                  rejectionReason
                }
          };
        }
        return o;
      });
      setLocalOrders(updated);
      const target = updated.find(o => o.id === orderId);
      if (!target) throw new Error("Order not found");
      return target;
    }
  },

  startAnalysis: async (orderId: string): Promise<LabOrder> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/start-analysis`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const orders = getLocalOrders();
      const updated = orders.map(o => {
        if (o.id === orderId && o.status === "SPECIMEN_COLLECTED") {
          return { ...o, status: "IN_ANALYSIS" as const };
        }
        return o;
      });
      setLocalOrders(updated);
      const target = updated.find(o => o.id === orderId);
      if (!target) throw new Error("Order not found");
      return target;
    }
  },

  saveTestResults: async (
    orderId: string,
    parameters: ResultParameter[],
    pathologistComment?: string
  ): Promise<LabOrder> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameters, pathologistComment })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const orders = getLocalOrders();
      const updated = orders.map(o => {
        if (o.id === orderId) {
          const results: TestResult = {
            parameters,
            pathologistComment: pathologistComment?.trim() || undefined,
            enteredBy: "MLS O. Balogun, BMLS",
            enteredAt: new Date().toISOString()
          };
          return {
            ...o,
            status: "AWAITING_VERIFICATION" as const,
            results
          };
        }
        return o;
      });
      setLocalOrders(updated);
      const target = updated.find(o => o.id === orderId);
      if (!target) throw new Error("Order not found");
      return target;
    }
  },

  verifyResults: async (
    orderId: string,
    pathologistComment?: string
  ): Promise<LabOrder> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathologistComment })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const orders = getLocalOrders();
      const updated = orders.map(o => {
        if (o.id === orderId && o.results) {
          return {
            ...o,
            status: "COMPLETED" as const,
            completedAt: new Date().toISOString(),
            results: {
              ...o.results,
              pathologistComment: pathologistComment?.trim() || o.results.pathologistComment,
              verifiedBy: "Dr. F. Alabi, FMCPath (Consultant Pathologist)",
              verifiedAt: new Date().toISOString()
            }
          };
        }
        return o;
      });
      setLocalOrders(updated);
      const target = updated.find(o => o.id === orderId);
      if (!target) throw new Error("Order not found");
      return target;
    }
  },

  escalateCritical: async (
    orderId: string,
    doctorName: string
  ): Promise<LabOrder> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/escalate-critical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorName })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      return await res.json();
    } catch {
      const orders = getLocalOrders();
      const updated = orders.map(o => {
        if (o.id === orderId && o.results) {
          return {
            ...o,
            results: {
              ...o.results,
              criticalEscalated: true,
              escalatedTo: doctorName,
              escalatedAt: new Date().toISOString()
            }
          };
        }
        return o;
      });
      setLocalOrders(updated);
      const target = updated.find(o => o.id === orderId);
      if (!target) throw new Error("Order not found");
      return target;
    }
  },

  resetOrders: async (): Promise<LabOrder[]> => {
    localStorage.removeItem(STORAGE_KEY);
    return getLocalOrders();
  }
};
