import { HmoProvider, NhiaClaim, Tariff } from "./types";

export const mockProviders: HmoProvider[] = [
  { id: "hmo-1", name: "National Health Insurance Authority", code: "NHIA", active: true },
  { id: "hmo-2", name: "Reliance HMO", code: "REL", active: true },
];

export const mockTariffs: Tariff[] = [
  { id: "tar-1", serviceCode: "CON-001", description: "General Consultation", nhiaPrice: 2000, coPayPercentage: 10 },
  { id: "tar-2", serviceCode: "LAB-012", description: "Malaria Parasite Test", nhiaPrice: 1500, coPayPercentage: 0 },
  { id: "tar-3", serviceCode: "DRG-104", description: "Artemether Lumefantrine", nhiaPrice: 3500, coPayPercentage: 10 },
];

export const mockClaims: NhiaClaim[] = [
  {
    id: "clm-001",
    patientId: "pat-123",
    patientName: "John Doe",
    nhiaNumber: "NHIA-99281",
    providerId: "hmo-1",
    diagnosis: "Severe Malaria",
    totalAmount: 7000,
    coPayAmount: 550,
    claimAmount: 6450,
    status: "SUBMITTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
