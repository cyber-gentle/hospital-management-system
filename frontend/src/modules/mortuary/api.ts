import { rethrowBackendRejection } from "../../lib/fallback";
import { DEMO_MODE } from "../../lib/demo";
import { apiRequest } from "../../lib/api";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import { DeceasedRecord, ColdStorageUnit, AutopsyLog, BodyReleaseRecord } from './types';
import {
  INITIAL_DECEASED_RECORDS,
  INITIAL_COLD_STORAGE_UNITS,
  INITIAL_AUTOPSY_LOGS,
  INITIAL_BODY_RELEASES
} from './mockData';

const DECEASED_STORAGE_KEY = 'hims_mortuary_deceased_v1';
const CHAMBERS_STORAGE_KEY = 'hims_mortuary_chambers_v1';
const AUTOPSY_STORAGE_KEY = 'hims_mortuary_autopsy_v1';
const RELEASES_STORAGE_KEY = 'hims_mortuary_releases_v1';

// Seed initial mock data if not already present in localStorage
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  try { requireDemoMode(); } catch { return; }
  if (!localStorage.getItem(DECEASED_STORAGE_KEY)) {
    localStorage.setItem(DECEASED_STORAGE_KEY, JSON.stringify(INITIAL_DECEASED_RECORDS));
  }
  if (!localStorage.getItem(CHAMBERS_STORAGE_KEY)) {
    localStorage.setItem(CHAMBERS_STORAGE_KEY, JSON.stringify(INITIAL_COLD_STORAGE_UNITS));
  }
  if (!localStorage.getItem(AUTOPSY_STORAGE_KEY)) {
    localStorage.setItem(AUTOPSY_STORAGE_KEY, JSON.stringify(INITIAL_AUTOPSY_LOGS));
  }
  if (!localStorage.getItem(RELEASES_STORAGE_KEY)) {
    localStorage.setItem(RELEASES_STORAGE_KEY, JSON.stringify(INITIAL_BODY_RELEASES));
  }
};

initializeStorage();

export const mortuaryApi = {
  // --- FR-MOR-01: Deceased Body Intake & Logging ---
  async getDeceasedRecords(): Promise<DeceasedRecord[]> {
    try {
      const res = await strictModuleFetch('/api/v1/mortuary/deceased');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Backend unavailable or 404, fallback to localStorage
    }
    const data = localStorage.getItem(DECEASED_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_DECEASED_RECORDS;
  },

  async createDeceasedAdmission(payload: Omit<DeceasedRecord, 'id' | 'deceasedTagNumber' | 'daysInStorage' | 'totalAccruedStorageFee' | 'financialClearancePaid' | 'status' | 'updatedAt'>): Promise<DeceasedRecord> {
    const recordId = `MOR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const tagNumber = `TAG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: DeceasedRecord = {
      ...payload,
      id: recordId,
      deceasedTagNumber: tagNumber,
      daysInStorage: 1,
      totalAccruedStorageFee: payload.storageFeeDaily,
      financialClearancePaid: false,
      status: payload.isCoronerCase ? 'AUTOPSY_PENDING' : 'ADMITTED_IN_STORAGE',
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await strictModuleFetch('/api/v1/mortuary/admit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const currentRecords = await this.getDeceasedRecords();
    const updated = [newRecord, ...currentRecords];
    localStorage.setItem(DECEASED_STORAGE_KEY, JSON.stringify(updated));

    // Allocate chamber if specified
    if (newRecord.assignedChamberId && newRecord.assignedChamberUnit) {
      await this.assignChamber(newRecord.id, newRecord.assignedChamberId, newRecord.assignedChamberUnit);
    }

    return newRecord;
  },

  // --- FR-MOR-02: Cold Storage Chambers Tracking ---
  async getColdStorageUnits(): Promise<ColdStorageUnit[]> {
    try {
      const res = await strictModuleFetch('/api/v1/mortuary/chambers');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }
    const data = localStorage.getItem(CHAMBERS_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_COLD_STORAGE_UNITS;
  },

  async assignChamber(deceasedId: string, unitId: string, chamberNumber: string): Promise<ColdStorageUnit[]> {
    if (!DEMO_MODE) return apiRequest<ColdStorageUnit[]>(`/mortuary/chambers/${encodeURIComponent(unitId)}/assign`, {method:"POST",body:JSON.stringify({deceasedId,chamberNumber})});
    const units = await this.getColdStorageUnits();
    const records = await this.getDeceasedRecords();
    const deceased = records.find(r => r.id === deceasedId);

    // Free prior chamber
    const cleanedUnits = units.map(unit => {
      const updatedChambers = unit.chambers.map(ch => {
        if (ch.currentDeceasedId === deceasedId) {
          return {
            ...ch,
            status: 'AVAILABLE' as const,
            currentDeceasedId: undefined,
            currentDeceasedName: undefined,
            currentDeceasedTag: undefined
          };
        }
        return ch;
      });
      return { ...unit, chambers: updatedChambers };
    });

    // Allocate target chamber
    const targetUnit = cleanedUnits.find(u => u.id === unitId);
    if (targetUnit) {
      targetUnit.chambers = targetUnit.chambers.map(ch => {
        if (ch.chamberNumber === chamberNumber) {
          return {
            ...ch,
            status: 'OCCUPIED' as const,
            currentDeceasedId: deceasedId,
            currentDeceasedName: deceased?.fullName || 'Deceased',
            currentDeceasedTag: deceased?.deceasedTagNumber || 'TAG-UNKNOWN'
          };
        }
        return ch;
      });
    }

    localStorage.setItem(CHAMBERS_STORAGE_KEY, JSON.stringify(cleanedUnits));

    // Update deceased record
    if (deceased && targetUnit) {
      const updatedRecords = records.map(r => {
        if (r.id === deceasedId) {
          return {
            ...r,
            assignedChamberId: unitId,
            assignedChamberUnit: chamberNumber,
            updatedAt: new Date().toISOString()
          };
        }
        return r;
      });
      localStorage.setItem(DECEASED_STORAGE_KEY, JSON.stringify(updatedRecords));
    }

    return cleanedUnits;
  },

  async releaseChamber(deceasedId: string): Promise<ColdStorageUnit[]> {
    if (!DEMO_MODE) return apiRequest<ColdStorageUnit[]>(`/mortuary/chambers/${encodeURIComponent(deceasedId)}/release`, {method:"POST",body:JSON.stringify({deceasedId})});
    const units = await this.getColdStorageUnits();
    const updated = units.map(unit => {
      const updatedChambers = unit.chambers.map(ch => {
        if (ch.currentDeceasedId === deceasedId) {
          return {
            ...ch,
            status: 'DECONTAMINATION' as const, // Tag for sanitization before next use
            currentDeceasedId: undefined,
            currentDeceasedName: undefined,
            currentDeceasedTag: undefined
          };
        }
        return ch;
      });
      return { ...unit, chambers: updatedChambers };
    });

    localStorage.setItem(CHAMBERS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // --- FR-MOR-03: Autopsy Logging & Body Release ---
  async getAutopsyLogs(): Promise<AutopsyLog[]> {
    try {
      const res = await strictModuleFetch('/api/v1/mortuary/autopsies');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }
    const data = localStorage.getItem(AUTOPSY_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_AUTOPSY_LOGS;
  },

  async recordAutopsy(payload: Omit<AutopsyLog, 'id' | 'autopsyDate'>): Promise<AutopsyLog> {
    const newLog: AutopsyLog = {
      ...payload,
      id: `AUT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      autopsyDate: new Date().toISOString()
    };

    try {
      const res = await strictModuleFetch('/api/v1/mortuary/autopsies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...payload, autopsyDate: newLog.autopsyDate})
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const logs = await this.getAutopsyLogs();
    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(AUTOPSY_STORAGE_KEY, JSON.stringify(updatedLogs));

    // Update deceased record status
    const records = await this.getDeceasedRecords();
    const updatedRecords = records.map(r => {
      if (r.id === newLog.deceasedId) {
        return {
          ...r,
          status: 'AUTOPSY_COMPLETED' as const,
          causeOfDeath: newLog.definitiveCauseOfDeath,
          autopsyId: newLog.id,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    localStorage.setItem(DECEASED_STORAGE_KEY, JSON.stringify(updatedRecords));

    return newLog;
  },

  async getBodyReleases(): Promise<BodyReleaseRecord[]> {
    try {
      const res = await strictModuleFetch('/api/v1/mortuary/releases');
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }
    const data = localStorage.getItem(RELEASES_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_BODY_RELEASES;
  },

  async releaseBodyToFamily(payload: Omit<BodyReleaseRecord, 'id' | 'releaseDate'>): Promise<BodyReleaseRecord> {
    const newRelease: BodyReleaseRecord = {
      ...payload,
      id: `REL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      releaseDate: new Date().toISOString()
    };

    try {
      const res = await strictModuleFetch('/api/v1/mortuary/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const currentReleases = await this.getBodyReleases();
    const updatedReleases = [newRelease, ...currentReleases];
    localStorage.setItem(RELEASES_STORAGE_KEY, JSON.stringify(updatedReleases));

    // Update deceased record status & release chamber
    const records = await this.getDeceasedRecords();
    const updatedRecords = records.map(r => {
      if (r.id === newRelease.deceasedId) {
        return {
          ...r,
          status: 'RELEASED_TO_FAMILY' as const,
          financialClearancePaid: r.financialClearancePaid,
          releaseId: newRelease.id,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    localStorage.setItem(DECEASED_STORAGE_KEY, JSON.stringify(updatedRecords));

    // Free the chamber vault
    await this.releaseChamber(newRelease.deceasedId);

    return newRelease;
  }
};
