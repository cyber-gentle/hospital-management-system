import { rethrowBackendRejection } from "../../lib/fallback";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import { AncProfile, AncVisit, DeliveryRecord, PncCheckup, NewbornDetails } from './types';
import { INITIAL_ANC_PROFILES, INITIAL_DELIVERY_RECORDS, INITIAL_PNC_CHECKUPS } from './mockData';

const ANC_STORAGE_KEY = 'hims_maternity_anc_v1';
const DELIVERIES_STORAGE_KEY = 'hims_maternity_deliveries_v1';
const PNC_STORAGE_KEY = 'hims_maternity_pnc_v1';

// Seed initial mock data if not already present in localStorage
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  try { requireDemoMode(); } catch { return; }
  if (!localStorage.getItem(ANC_STORAGE_KEY)) {
    localStorage.setItem(ANC_STORAGE_KEY, JSON.stringify(INITIAL_ANC_PROFILES));
  }
  if (!localStorage.getItem(DELIVERIES_STORAGE_KEY)) {
    localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(INITIAL_DELIVERY_RECORDS));
  }
  if (!localStorage.getItem(PNC_STORAGE_KEY)) {
    localStorage.setItem(PNC_STORAGE_KEY, JSON.stringify(INITIAL_PNC_CHECKUPS));
  }
};

initializeStorage();

export const maternityApi = {
  // --- FR-MAT-01: Antenatal Care (ANC) ---
  async getAncProfiles(): Promise<AncProfile[]> {
    requireDemoMode();
    try {
      const res = await strictModuleFetch('/api/v1/maternity/anc');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Backend unavailable or 404, fallback to localStorage
    }
    const data = localStorage.getItem(ANC_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_ANC_PROFILES;
  },

  async createAncBooking(payload: Omit<AncProfile, 'id' | 'currentGestationalAgeWeeks' | 'status' | 'visits'>): Promise<AncProfile> {
    requireDemoMode();
    // Calculate gestational age in weeks from LMP
    const lmp = new Date(payload.lmpDate);
    const now = new Date();
    const diffWeeks = Math.max(1, Math.min(42, Math.floor((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7))));

    const newProfile: AncProfile = {
      ...payload,
      id: `ANC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      currentGestationalAgeWeeks: diffWeeks,
      status: 'ANC_ACTIVE',
      visits: []
    };

    try {
      const res = await strictModuleFetch('/api/v1/maternity/anc/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const profiles = await this.getAncProfiles();
    const updated = [newProfile, ...profiles];
    localStorage.setItem(ANC_STORAGE_KEY, JSON.stringify(updated));
    return newProfile;
  },

  async recordAncVisit(ancProfileId: string, visit: Omit<AncVisit, 'id' | 'visitDate'>): Promise<AncProfile> {
    requireDemoMode();
    const profiles = await this.getAncProfiles();
    const newVisit: AncVisit = {
      ...visit,
      id: `VIS-${Date.now()}`,
      visitDate: new Date().toISOString().split('T')[0] ?? ''
    };

    let updatedProfile: AncProfile | undefined;

    const updatedProfiles = profiles.map(p => {
      if (p.id === ancProfileId) {
        updatedProfile = {
          ...p,
          currentGestationalAgeWeeks: visit.gestationalAgeWeeks,
          visits: [newVisit, ...p.visits]
        };
        return updatedProfile;
      }
      return p;
    });

    localStorage.setItem(ANC_STORAGE_KEY, JSON.stringify(updatedProfiles));
    return updatedProfile!;
  },

  async updateAncStatus(ancProfileId: string, status: AncProfile['status']): Promise<void> {
    requireDemoMode();
    const profiles = await this.getAncProfiles();
    const updated = profiles.map(p => p.id === ancProfileId ? { ...p, status } : p);
    localStorage.setItem(ANC_STORAGE_KEY, JSON.stringify(updated));
  },

  // --- FR-MAT-02: Labor & Delivery Suite ---
  async getDeliveryRecords(): Promise<DeliveryRecord[]> {
    requireDemoMode();
    try {
      const res = await strictModuleFetch('/api/v1/maternity/deliveries');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }
    const data = localStorage.getItem(DELIVERIES_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_DELIVERY_RECORDS;
  },

  async recordDelivery(payload: Omit<DeliveryRecord, 'id' | 'deliveryTime' | 'newborns'> & { newborns: Omit<NewbornDetails, 'id' | 'birthTimestamp'>[] }): Promise<DeliveryRecord> {
    requireDemoMode();
    const deliveryTimestamp = new Date().toISOString();
    const recordId = `DEL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const processedNewborns: NewbornDetails[] = payload.newborns.map((nb, idx) => ({
      ...nb,
      id: `NB-${recordId}-${idx + 1}`,
      birthTimestamp: deliveryTimestamp
    }));

    const newRecord: DeliveryRecord = {
      ...payload,
      id: recordId,
      deliveryTime: deliveryTimestamp,
      newborns: processedNewborns
    };

    try {
      const res = await strictModuleFetch('/api/v1/maternity/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const currentRecords = await this.getDeliveryRecords();
    const updated = [newRecord, ...currentRecords];
    localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(updated));

    // Also update mother's ANC status to DELIVERED_PNC
    await this.updateAncStatus(payload.ancProfileId, 'DELIVERED_PNC');

    return newRecord;
  },

  // --- FR-MAT-03: Postnatal Care (PNC) ---
  async getPncCheckups(): Promise<PncCheckup[]> {
    requireDemoMode();
    try {
      const res = await strictModuleFetch('/api/v1/maternity/pnc');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }
    const data = localStorage.getItem(PNC_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_PNC_CHECKUPS;
  },

  async recordPncCheckup(checkup: Omit<PncCheckup, 'id' | 'checkupDate'>): Promise<PncCheckup> {
    requireDemoMode();
    const newCheckup: PncCheckup = {
      ...checkup,
      id: `PNC-${Date.now()}`,
      checkupDate: new Date().toISOString()
    };

    try {
      const res = await strictModuleFetch('/api/v1/maternity/pnc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCheckup)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const current = await this.getPncCheckups();
    const updated = [newCheckup, ...current];
    localStorage.setItem(PNC_STORAGE_KEY, JSON.stringify(updated));
    return newCheckup;
  }
};
