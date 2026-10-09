import { requireDemoMode } from "../../lib/demo";
import { HmoProvider, NhiaClaim, Tariff, EligibilityResult } from "./types";
import { mockProviders, mockClaims, mockTariffs } from "./mockData";
import { DEMO_MODE } from "../../lib/demo";

const API_BASE = "/api/v1/nhia";

export const nhiaApi = {
  getProviders: async (): Promise<HmoProvider[]> => {
    requireDemoMode();
    if (DEMO_MODE) return [...mockProviders];
    const res = await fetch(`${API_BASE}/providers`);
    if (!res.ok) throw new Error("Failed to fetch providers");
    return res.json();
  },
  
  getClaims: async (): Promise<NhiaClaim[]> => {
    requireDemoMode();
    if (DEMO_MODE) return [...mockClaims];
    const res = await fetch(`${API_BASE}/claims`);
    if (!res.ok) throw new Error("Failed to fetch claims");
    return res.json();
  },

  getTariffs: async (): Promise<Tariff[]> => {
    requireDemoMode();
    if (DEMO_MODE) return [...mockTariffs];
    const res = await fetch(`${API_BASE}/tariffs`);
    if (!res.ok) throw new Error("Failed to fetch tariffs");
    return res.json();
  },

  checkEligibility: async (nhiaNumber: string): Promise<EligibilityResult> => {
    requireDemoMode();
    if (DEMO_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock logic: If it ends in "000", pretend it's expired/invalid. 
      // Otherwise, return a valid active profile.
      if (nhiaNumber.endsWith("000")) {
        return {
          nhiaNumber,
          patientName: "Unknown Patient",
          hmoProviderId: "HMO-1",
          hmoProviderName: "National Health Insurance Authority",
          planType: "Standard",
          status: "EXPIRED",
          expiryDate: new Date(Date.now() - 86400000 * 30).toISOString(),
        };
      }
      
      return {
        nhiaNumber,
        patientName: "John Doe",
        hmoProviderId: "HMO-1",
        hmoProviderName: "National Health Insurance Authority",
        planType: "Standard",
        status: "ACTIVE",
        expiryDate: new Date(Date.now() + 86400000 * 365).toISOString(),
      };
    }
    const res = await fetch(`${API_BASE}/eligibility/${nhiaNumber}`);
    if (!res.ok) throw new Error("Failed to check eligibility");
    return res.json();
  },

  submitClaim: async (data: Partial<NhiaClaim>): Promise<NhiaClaim> => {
    requireDemoMode();
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newClaim: NhiaClaim = {
        ...data,
        id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "SUBMITTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as NhiaClaim;
      mockClaims.unshift(newClaim);
      return newClaim;
    }
    const res = await fetch(`${API_BASE}/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit claim");
    return res.json();
  }
};
