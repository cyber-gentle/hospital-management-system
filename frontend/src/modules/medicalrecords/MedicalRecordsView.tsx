import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  Patient,
  CreatePatientFormInput,
  PatientIDCardData,
  PaymentStatusData,
} from "./types";
import {
  fetchPatients,
  createPatient,
  fetchPatientIDCard,
  fetchPaymentStatus,
  togglePaymentStatus,
} from "./api";
import { PatientTable } from "./components/PatientTable";
import { RegistrationModal } from "./components/RegistrationModal";
import { PatientIDCardModal } from "./components/PatientIDCardModal";
import { PaymentStatusModal } from "./components/PaymentStatusModal";
import { PatientDetailDrawer } from "./components/PatientDetailDrawer";

interface MedicalRecordsViewProps {
  onBackToDashboard: () => void;
}

export const MedicalRecordsView: React.FC<MedicalRecordsViewProps> = ({
  onBackToDashboard,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPatientForDrawer, setSelectedPatientForDrawer] = useState<Patient | null>(null);
  const [idCardData, setIdCardData] = useState<PatientIDCardData | null>(null);
  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusData | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Success alert for freshly registered patient
  const [freshRegistration, setFreshRegistration] = useState<Patient | null>(null);

  // Load patients
  const loadPatients = async (query?: string) => {
    try {
      setLoading(true);
      const res = await fetchPatients(query);
      setPatients(res.patients);
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(searchQuery);
  }, [searchQuery]);

  // Handle new patient registration
  const handleRegisterPatient = async (data: CreatePatientFormInput) => {
    const created = await createPatient(data);
    setFreshRegistration(created);
    await loadPatients();
  };

  // Handle ID card generation & print preview
  const handlePrintIDCard = async (patient: Patient) => {
    try {
      const card = await fetchPatientIDCard(patient.id);
      setIdCardData(card);
      setIsIDCardOpen(true);
    } catch (err) {
      console.error("Failed to load ID card data:", err);
    }
  };

  // Handle payment eligibility check (FR-MR-06)
  const handleCheckPayment = async (patient: Patient) => {
    try {
      const status = await fetchPaymentStatus(patient.id);
      setPaymentStatusData(status);
      setIsPaymentModalOpen(true);
    } catch (err) {
      console.error("Failed to check payment status:", err);
    }
  };

  // Handle confirming cash settlement
  const handleConfirmPayment = async (patientId: string, receiptNo: string) => {
    await togglePaymentStatus(patientId, true, receiptNo);
    await loadPatients();
    const updatedStatus = await fetchPaymentStatus(patientId);
    setPaymentStatusData(updatedStatus);
  };

  // Statistics calculation
  const totalPatients = patients.length;
  const nhiaCount = patients.filter((p) => p.payment_category === "NHIA").length;
  const cashCount = patients.filter((p) => p.payment_category === "CASH").length;
  const pendingFeeCount = patients.filter((p) => p.payment_category === "CASH" && !p.registration_fee_paid).length;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-xs"
            title="Return to System Modules Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Modules</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Clinical</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              Medical Records & Health Informatics
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            New Patient Registration (FR-MR-02)
          </button>
        </div>
      </div>

      {/* Fresh Registration Success Banner */}
      {freshRegistration && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Patient Registered Successfully!
                </span>
                <span className="font-mono text-xs font-extrabold bg-white px-2 py-0.5 rounded text-blue-700 border border-emerald-200">
                  {freshRegistration.hospital_number}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Record issued for{" "}
                <span className="font-bold text-slate-900">
                  {freshRegistration.first_name} {freshRegistration.last_name}
                </span>
                . Atomic folder index generated and synchronized.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintIDCard(freshRegistration)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print ID Card
            </button>
            <button
              type="button"
              onClick={() => setFreshRegistration(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Enrolled (MPI)
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {loading ? "..." : totalPatients}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" /> Master Index Active
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* NHIA Enrollees */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              NHIA / HMO Enrollees
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {loading ? "..." : nhiaCount}
            </span>
            <span className="text-[11px] text-purple-600 font-medium block mt-0.5">
              {totalPatients > 0 ? `${Math.round((nhiaCount / totalPatients) * 100)}% of total census` : "0%"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Cash Patients */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Cash (Out-of-Pocket)
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {loading ? "..." : cashCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Private paying clients
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Fee Gate */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Fee Gate (FR-MR-06)
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {loading ? "..." : pendingFeeCount}
            </span>
            <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
              Requires Cash Office clearance
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <PatientTable
        patients={patients}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSelectPatient={(p) => setSelectedPatientForDrawer(p)}
        onPrintCard={(p) => handlePrintIDCard(p)}
        onCheckPayment={(p) => handleCheckPayment(p)}
      />

      {/* Modals & Slide-overs */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={handleRegisterPatient}
      />

      <PatientIDCardModal
        isOpen={isIDCardOpen}
        cardData={idCardData}
        onClose={() => setIsIDCardOpen(false)}
      />

      <PaymentStatusModal
        isOpen={isPaymentModalOpen}
        statusData={paymentStatusData}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <PatientDetailDrawer
        isOpen={Boolean(selectedPatientForDrawer)}
        patient={selectedPatientForDrawer}
        onClose={() => setSelectedPatientForDrawer(null)}
        onPrintCard={(p) => handlePrintIDCard(p)}
        onCheckPayment={(p) => handleCheckPayment(p)}
      />
    </div>
  );
};
