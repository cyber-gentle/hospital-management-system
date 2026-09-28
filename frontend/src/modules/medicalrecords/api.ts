import { apiRequest } from "../../lib/api";
import {
  Patient,
  CreatePatientFormInput,
  PatientIDCardData,
  PaymentStatusData,
} from "./types";
import { INITIAL_PATIENTS } from "./mockData";

const STORAGE_KEY = "hims_patients_local_db";

function getLocalPatients(): Patient[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
    return INITIAL_PATIENTS;
  }
  try {
    return JSON.parse(stored) as Patient[];
  } catch {
    return INITIAL_PATIENTS;
  }
}

function saveLocalPatients(patients: Patient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

export async function fetchPatients(searchQuery?: string): Promise<{ patients: Patient[]; total: number }> {
  try {
    const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
    const res = await apiRequest<{ patients: Patient[]; total: number }>(`/medical-records/patients${queryParam}`);
    return res;
  } catch (err) {
    // Graceful offline/local fallback
    console.info("[Medical Records API] Falling back to local state:", err);
    let list = getLocalPatients().filter((p) => p.is_active);
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.hospital_number.toLowerCase().includes(q) ||
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          (p.other_names && p.other_names.toLowerCase().includes(q)) ||
          (p.nhia_number && p.nhia_number.toLowerCase().includes(q)) ||
          (p.phone_number && p.phone_number.toLowerCase().includes(q))
      );
    }
    return { patients: list, total: list.length };
  }
}

export async function createPatient(data: CreatePatientFormInput): Promise<Patient> {
  try {
    const res = await apiRequest<Patient>("/medical-records/patients", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  } catch (err) {
    console.info("[Medical Records API] Local patient registration fallback:", err);
    const local = getLocalPatients();
    const nextSeq = 10000 + local.length + 1;
    const currentYear = new Date().getFullYear();
    const generatedHospNo = `HOSP/${currentYear}/${String(nextSeq).padStart(6, "0")}`;

    const newPatient: Patient = {
      id: `pat_local_${Date.now()}`,
      hospital_number: generatedHospNo,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      other_names: data.other_names?.trim(),
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      phone_number: data.phone_number?.trim(),
      email: data.email?.trim(),
      address: data.address.trim(),
      blood_group: data.blood_group,
      genotype: data.genotype,
      marital_status: data.marital_status,
      emergency_contact_name: data.emergency_contact_name.trim(),
      emergency_contact_phone: data.emergency_contact_phone.trim(),
      emergency_contact_relationship: data.emergency_contact_relationship.trim(),
      payment_category: data.payment_category,
      nhia_number: data.nhia_number?.trim(),
      nhia_scheme: data.nhia_scheme,
      registration_fee_paid: data.registration_fee_paid,
      registration_fee_receipt_no: data.registration_fee_receipt_no?.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalPatients([newPatient, ...local]);
    return newPatient;
  }
}

export async function fetchPatientIDCard(patientId: string): Promise<PatientIDCardData> {
  try {
    const res = await apiRequest<PatientIDCardData>(`/medical-records/patients/${patientId}/id-card`, {
      method: "POST",
    });
    return res;
  } catch (err) {
    console.info("[Medical Records API] Local ID Card generation fallback:", err);
    const local = getLocalPatients();
    const patient = local.find((p) => p.id === patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const fullName = `${patient.first_name} ${patient.other_names ? patient.other_names + " " : ""}${patient.last_name}`;
    const qrData = JSON.stringify({
      id: patient.id,
      hosp_no: patient.hospital_number,
      name: fullName,
      dob: patient.date_of_birth,
      blood: patient.blood_group || "N/A",
      emergency: patient.emergency_contact_phone,
    });

    return {
      patient_id: patient.id,
      hospital_number: patient.hospital_number,
      full_name: fullName,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group || "N/A",
      genotype: patient.genotype || "N/A",
      emergency_phone: patient.emergency_contact_phone,
      payment_category: patient.payment_category,
      nhia_number: patient.nhia_number,
      barcode_payload: patient.hospital_number,
      qrcode_payload: qrData,
      issued_at: new Date().toISOString(),
      issued_by: "Health Records Unit",
    };
  }
}

export async function fetchPaymentStatus(patientId: string): Promise<PaymentStatusData> {
  try {
    const res = await apiRequest<PaymentStatusData>(`/medical-records/patients/${patientId}/payment-status`);
    return res;
  } catch (err) {
    console.info("[Medical Records API] Local payment status fallback:", err);
    const local = getLocalPatients();
    const patient = local.find((p) => p.id === patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const fullName = `${patient.first_name} ${patient.last_name}`;
    let eligible = false;
    let reason = "";

    if (patient.payment_category === "NHIA") {
      eligible = Boolean(patient.nhia_number && patient.nhia_number.trim() !== "");
      reason = eligible
        ? "Patient covered under active NHIA/HMO insurance scheme"
        : "NHIA insurance identifier missing; verification required";
    } else if (patient.payment_category === "RETAINERSHIP") {
      eligible = true;
      reason = "Covered under corporate retainership account";
    } else {
      eligible = patient.registration_fee_paid;
      reason = eligible
        ? "Registration fee verified paid at Accounts & Billing"
        : "Payment-before-service required: Settle registration fee at Cash Office before consultation";
    }

    return {
      patient_id: patient.id,
      hospital_number: patient.hospital_number,
      full_name: fullName,
      payment_category: patient.payment_category,
      nhia_number: patient.nhia_number,
      nhia_scheme: patient.nhia_scheme,
      registration_fee_paid: patient.registration_fee_paid,
      receipt_no: patient.registration_fee_receipt_no,
      eligible_for_service: eligible,
      status_reason: reason,
    };
  }
}

export async function togglePaymentStatus(patientId: string, paid: boolean, receiptNo?: string): Promise<Patient> {
  const local = getLocalPatients();
  const existing = local.find((p) => p.id === patientId);
  if (!existing) {
    throw new Error("Patient not found");
  }

  const updatedPatient: Patient = {
    ...existing,
    registration_fee_paid: paid,
    registration_fee_receipt_no: paid ? receiptNo || `REC-${Date.now().toString().slice(-5)}` : undefined,
    updated_at: new Date().toISOString(),
  };

  const updatedList = local.map((p) => (p.id === patientId ? updatedPatient : p));
  saveLocalPatients(updatedList);
  return updatedPatient;
}
