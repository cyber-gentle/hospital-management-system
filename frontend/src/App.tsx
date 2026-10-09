import React, { useState } from "react";
import {
  Activity,
  Shield,
  HeartPulse,
  Database,
  Building,
  CheckCircle2,
} from "lucide-react";
import { AuthProvider, useAuth, UserRole } from "./lib/auth";
import { MedicalRecordsView } from "./modules/medicalrecords/MedicalRecordsView";
import { NursingView } from "./modules/nursing/NursingView";
import { BillingView } from "./modules/billing/BillingView";
import { PharmacyView } from "./modules/pharmacy/PharmacyView";
import { AppointmentsView } from "./modules/appointments/AppointmentsView";
import { AccountingView } from "./modules/accounting/AccountingView";
import { SubstoreView } from "./modules/substore/SubstoreView";
import { GopdView } from "./modules/gopd/GopdView";
import { LaboratoryView } from "./modules/laboratory/LaboratoryView";
import { NhiaClaimsView } from "./modules/nhiaclaims/NhiaClaimsView";
import { RadiologyView } from "./modules/radiology/RadiologyView";
import { TheatreView } from "./modules/theatre/TheatreView";
import { EmergencyView } from "./modules/emergency/EmergencyView";
import { MaternityView } from "./modules/maternity/MaternityView";
import { MortuaryView } from "./modules/mortuary/MortuaryView";
import { AuditView } from "./modules/audit/AuditView";
import { HrView } from "./modules/hr/HrView";
import { InventoryView } from "./modules/inventory/InventoryView";
import { ReportingView } from "./modules/reporting/ReportingView";
import { AdminView } from "./modules/admin/AdminView";
import { ModuleAvailability } from "./components/ModuleAvailability";
import { PREVIEW_MODULES } from "./lib/moduleAvailability";
import BillingDesignPreview from "./BillingDesignPreview";
import { DEMO_MODE } from './lib/demo';
import { Login } from './lib/Login';

interface ModuleCard {
  id: string;
  name: string;
  service: "Go Core (:8080)" | "Python Interop (:8000)";
  category: "Clinical" | "Diagnostic" | "Financial" | "Operational";
  description: string;
}

const MODULES: ModuleCard[] = [
  { id: "medicalrecords", name: "Medical Records", service: "Go Core (:8080)", category: "Clinical", description: "Patient registration, demographics, master index" },
  { id: "nursing", name: "Nursing Services", service: "Go Core (:8080)", category: "Clinical", description: "Admissions, vitals tracking, shift handovers, care plans" },
  { id: "gopd", name: "GOPD", service: "Go Core (:8080)", category: "Clinical", description: "General Outpatient queue, triage, doctor consultations" },
  { id: "appointments", name: "Appointment Scheduling", service: "Go Core (:8080)", category: "Clinical", description: "Consultant booking, availability calendars" },
  { id: "emergency", name: "Accident & Emergency", service: "Go Core (:8080)", category: "Clinical", description: "Triage priority, rapid admissions, emergency care" },
  { id: "theatre", name: "Operating Theatre", service: "Go Core (:8080)", category: "Clinical", description: "Surgical schedules, pre-op checklists, operation notes" },
  { id: "maternity", name: "Maternity", service: "Go Core (:8080)", category: "Clinical", description: "Antenatal records, labor monitoring, deliveries" },
  { id: "pharmacy", name: "Pharmacy", service: "Go Core (:8080)", category: "Clinical", description: "Prescription dispensing, drug formularies, stock levels" },
  { id: "substore", name: "Sub-store Management", service: "Go Core (:8080)", category: "Operational", description: "Ward-level supplies, requisitions, inventory buffers" },
  { id: "billing", name: "Accounts & Billing", service: "Go Core (:8080)", category: "Financial", description: "Patient tariffs, invoice generation, cashier receipts" },
  { id: "accounting", name: "Accounting (General Ledger)", service: "Go Core (:8080)", category: "Financial", description: "Hospital bookkeeping, journal vouchers, audit trail" },
  { id: "laboratory", name: "Laboratory (LIS)", service: "Python Interop (:8000)", category: "Diagnostic", description: "HL7 analyzer integration, specimen tracking, test results" },
  { id: "nhia", name: "NHIA / HMO", service: "Python Interop (:8000)", category: "Financial", description: "Eligibility verification, capitation, claims bundling" },
  { id: "radiology", name: "Radiology / PACS", service: "Python Interop (:8000)", category: "Diagnostic", description: "DICOM modalities, imaging orders, radiologist reports" },
  { id: "mortuary", name: "Mortuary", service: "Go Core (:8080)", category: "Operational", description: "Deceased admissions, autopsy logging, body releases" },
  { id: "inventory", name: "Inventory & Procurement", service: "Go Core (:8080)", category: "Operational", description: "Hospital-wide central warehouse, POs, vendors" },
  { id: "hr", name: "HR & Staff Management", service: "Go Core (:8080)", category: "Operational", description: "Staff credentials, shift rosters, departmental allocations" },
  { id: "reporting", name: "Reporting & Analytics", service: "Go Core (:8080)", category: "Operational", description: "Morbidity statistics, bed occupancy, financial summaries" },
  { id: "audit", name: "Audit Department", service: "Go Core (:8080)", category: "Operational", description: "Append-only clinical & financial audit log inspector" },
  { id: "admin", name: "System Administration", service: "Go Core (:8080)", category: "Operational", description: "RBAC roles, system configuration, facility parameters" },
];

const ROLES: UserRole[] = [
  "DOCTOR",
  "NURSE",
  "PHARMACIST",
  "ACCOUNTANT",
  "CHIEF_ACCOUNTANT",
  "NHIA_OFFICER",
  "AUDITOR",
  "ADMIN",
];

const Dashboard: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [activeModule, setActiveModule] = useState<string | null>("medicalrecords");

  const filteredModules = selectedFilter === "All"
    ? MODULES
    : MODULES.filter((m) => m.category === selectedFilter || (selectedFilter === "Python" && m.service.includes("Python")) || (selectedFilter === "Go" && m.service.includes("Go")));

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
	if (!DEMO_MODE) return;
    const role = e.target.value as UserRole;
    login("mock-jwt-token", {
      id: "usr_01",
      name: `Dr. / Officer Demo`,
      email: "staff@hospital.gov.ng",
      role,
      department: "Clinical Services",
    });
  };

  if (!DEMO_MODE && !isAuthenticated) return <Login />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              className="flex items-center space-x-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  HIMS
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    Single-Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-500">Federal Teaching Hospital</p>
              </div>
            </button>

            {/* Quick Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveModule(null)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeModule === null
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                20-Module Directory
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("medicalrecords")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "medicalrecords"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Medical Records
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("nursing")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "nursing"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Nursing Services
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("billing")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "billing"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Accounts & Billing
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("pharmacy")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "pharmacy"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                Pharmacy (Active)
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("appointments")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "appointments"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                Appointments
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("accounting")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "accounting"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                General Ledger
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("substore")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeModule === "substore"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                Sub-stores
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {DEMO_MODE ? <>
            <span className="text-xs font-semibold text-amber-800">Demo — synthetic data only</span>
            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <label htmlFor="role-select" className="font-medium text-slate-700">Role Preview:</label>
              <select
                id="role-select"
                value={user?.role || "DOCTOR"}
                onChange={handleRoleChange}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 font-semibold text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            </> : <><span className="text-sm">{user?.name}</span><button type="button" onClick={logout} className="text-sm text-blue-700">Sign out</button></>}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!DEMO_MODE && activeModule && PREVIEW_MODULES[activeModule] ? (
          <ModuleAvailability name={MODULES.find(m => m.id === activeModule)?.name ?? activeModule} reason={PREVIEW_MODULES[activeModule]!} />
        ) : activeModule === "medicalrecords" ? (
          <MedicalRecordsView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "nursing" ? (
          <NursingView />
        ) : activeModule === "gopd" ? (
          <GopdView />
        ) : activeModule === "billing" ? (
          <BillingView />
        ) : activeModule === "pharmacy" ? (
          <PharmacyView />
        ) : activeModule === "appointments" ? (
          <AppointmentsView />
        ) : activeModule === "accounting" ? (
          <AccountingView />
        ) : activeModule === "substore" ? (
          <SubstoreView />
        ) : activeModule === "laboratory" ? (
          <LaboratoryView />
        ) : activeModule === "nhia" ? (
          <NhiaClaimsView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "radiology" ? (
          <RadiologyView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "theatre" ? (
          <TheatreView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "emergency" ? (
          <EmergencyView />
        ) : activeModule === "maternity" ? (
          <MaternityView />
        ) : activeModule === "mortuary" ? (
          <MortuaryView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "audit" ? (
          <AuditView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "hr" ? (
          <HrView onBackToDashboard={() => setActiveModule(null)} />
        ) : activeModule === "inventory" ? (
          <InventoryView />
        ) : activeModule === "reporting" ? (
          <ReportingView />
        ) : activeModule === "admin" ? (
          <AdminView />
        ) : (
          <>
            {/* Architecture Status Banner */}
            <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-2 md:col-span-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Phase 0 Scaffold Active
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Polyglot Two-Service Hospital Architecture
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Go Core service manages 17 operational modules and owns system-wide Auth + Audit Logging.
                    Python FastAPI service manages the 3 HL7/FHIR diagnostic modules (Lab, NHIA, Radiology).
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Service Topology</div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-white/10">
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-blue-300" /> Go Core</span>
                    <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">port 8080</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-white/10">
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-300" /> Python Interop</span>
                    <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">port 8000</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-indigo-300" /> PostgreSQL</span>
                    <span className="font-mono text-blue-200 bg-blue-950/60 px-2 py-0.5 rounded">port 5432</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Modules Filter & Grid */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Modules Directory</h2>
                  <p className="text-sm text-slate-500">20 verified hospital modules in scope</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-medium">
                  {["All", "Clinical", "Diagnostic", "Financial", "Operational", "Go", "Python"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        selectedFilter === filter
                          ? "bg-white text-slate-900 shadow-sm font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredModules.map((mod) => {
                  const isImplemented =
                    mod.id === "medicalrecords" ||
                    mod.id === "nursing" ||
                    mod.id === "gopd" ||
                    mod.id === "billing" ||
                    mod.id === "pharmacy" ||
                    mod.id === "appointments" ||
                    mod.id === "accounting" ||
                    mod.id === "substore" ||
                    mod.id === "laboratory" ||
                    mod.id === "nhia" ||
                    mod.id === "radiology" ||
                    mod.id === "theatre" ||
                    mod.id === "emergency" ||
                    mod.id === "maternity" ||
                    mod.id === "mortuary" ||
                    mod.id === "audit" ||
                    mod.id === "hr" ||
                    mod.id === "inventory" ||
                    mod.id === "reporting" ||
                    mod.id === "admin";
                  return (
                    <div
                      key={mod.id}
                      onClick={() => {
                        if (isImplemented) {
                          setActiveModule(mod.id);
                        }
                      }}
                      className={`bg-white border rounded-xl p-5 transition-all group flex flex-col justify-between ${
                        isImplemented
                          ? "cursor-pointer border-blue-400 hover:shadow-lg ring-2 ring-blue-500/20 bg-gradient-to-b from-blue-50/20 to-white"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              mod.service.includes("Python")
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {mod.service.includes("Python") ? "Python Interop" : "Go Core"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">{mod.category}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                          <span>{mod.name}</span>
                          {isImplemented && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-[11px]">/api/v1/{mod.id}</span>
                        <span className={`font-semibold ${isImplemented ? "text-blue-600 underline font-bold" : "text-slate-400"}`}>
                          {isImplemented ? "Open Module →" : "Scaffolded"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Hospital Information Management System (HIMS) — Single Tenant Production Blueprint
      </footer>
    </div>
  );
};

export default function App() {
  // Keep main's original design available without replacing the working modules.
  if (new URLSearchParams(window.location.search).get("view") === "billing-design") {
    return <>
      <a href="/" className="fixed bottom-4 right-4 z-[100] rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg">Return to hospital modules</a>
      <BillingDesignPreview />
    </>;
  }
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
