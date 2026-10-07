export interface HmoProvider {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export type ClaimStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";

export interface NhiaClaim {
  id: string;
  patientId: string;
  patientName: string;
  nhiaNumber: string;
  providerId: string;
  diagnosis: string;
  totalAmount: number;
  coPayAmount: number;
  claimAmount: number;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Tariff {
  id: string;
  serviceCode: string;
  description: string;
  nhiaPrice: number;
  coPayPercentage: number;
}

export interface EligibilityResult {
  nhiaNumber: string;
  patientName: string;
  hmoProviderId: string;
  hmoProviderName: string;
  planType: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  expiryDate: string;
}
