import React from "react";
import {
  Printer,
  CreditCard,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Search,
  User,
  Shield,
} from "lucide-react";
import { Patient } from "../types";

interface PatientTableProps {
  patients: Patient[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectPatient: (p: Patient) => void;
  onPrintCard: (p: Patient) => void;
  onCheckPayment: (p: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onSelectPatient,
  onPrintCard,
  onCheckPayment,
}) => {
  const filteredPatients = patients.filter((p) => {
    if (selectedCategory === "All") return true;
    if (selectedCategory === "CASH") return p.payment_category === "CASH";
    if (selectedCategory === "NHIA") return p.payment_category === "NHIA";
    if (selectedCategory === "RETAINERSHIP") return p.payment_category === "RETAINERSHIP";
    if (selectedCategory === "Unpaid") return !p.registration_fee_paid && p.payment_category === "CASH";
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        {/* Search Input (FR-MR-01) */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, hospital no., NHIA ID, or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-xs placeholder:text-slate-400"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {["All", "CASH", "NHIA", "RETAINERSHIP", "Unpaid"].map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat === "Unpaid" ? "Pending Fee (Cash)" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Hospital No.</th>
              <th className="py-3 px-4">Patient Name</th>
              <th className="py-3 px-4">Gender / DOB</th>
              <th className="py-3 px-4">Tariff & Scheme</th>
              <th className="py-3 px-4">Service Eligibility (FR-MR-06)</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No patient records found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Try adjusting your search criteria or register a new patient.
                  </p>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => {
                const fullName = `${patient.first_name} ${patient.other_names ? patient.other_names + " " : ""}${patient.last_name}`;
                const isCleared = patient.payment_category !== "CASH" || patient.registration_fee_paid;

                return (
                  <tr
                    key={patient.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectPatient(patient)}
                  >
                    {/* Hospital Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <span className="bg-blue-50 px-2 py-1 rounded-md border border-blue-200/80 group-hover:border-blue-300">
                        {patient.hospital_number}
                      </span>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {fullName}
                    </td>

                    {/* Gender / DOB */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <span className="font-medium">{patient.gender}</span> • {patient.date_of_birth}
                    </td>

                    {/* Payment Category & NHIA */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            patient.payment_category === "NHIA"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : patient.payment_category === "RETAINERSHIP"
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {patient.payment_category}
                        </span>
                        {patient.nhia_number && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {patient.nhia_number}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Service Eligibility (FR-MR-06) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckPayment(patient);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:ring-2 hover:ring-blue-400/30 ${
                          isCleared
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isCleared ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Eligible
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Fee Required
                          </>
                        )}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {patient.phone_number || "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onPrintCard(patient)}
                          title="Print Patient ID Card (FR-MR-05)"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCheckPayment(patient)}
                          title="Verify Service Clearance & Payment (FR-MR-06)"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPatient(patient)}
                          title="View Full Profile"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <span>
          Showing <span className="font-bold text-slate-700">{filteredPatients.length}</span> of{" "}
          <span className="font-bold text-slate-700">{patients.length}</span> registered patients
        </span>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          Master Patient Index • Append-only records
        </div>
      </div>
    </div>
  );
};
