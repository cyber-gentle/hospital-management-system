import React from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Printer,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Patient } from "../types";

interface PatientDetailDrawerProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintCard: (patient: Patient) => void;
  onCheckPayment: (patient: Patient) => void;
}

export const PatientDetailDrawer: React.FC<PatientDetailDrawerProps> = ({
  patient,
  isOpen,
  onClose,
  onPrintCard,
  onCheckPayment,
}) => {
  if (!isOpen || !patient) return null;

  const fullName = `${patient.first_name} ${patient.other_names ? patient.other_names + " " : ""}${patient.last_name}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/30">
                {patient.first_name[0]}
                {patient.last_name[0]}
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                  {patient.hospital_number}
                </span>
                <h2 className="text-lg font-bold text-white mt-1 leading-tight">{fullName}</h2>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment Plan:</span>
              <span className="font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                {patient.payment_category}
              </span>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Payment & Service Eligibility Alert */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                patient.registration_fee_paid || patient.payment_category !== "CASH"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {patient.registration_fee_paid || patient.payment_category !== "CASH" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span className="font-semibold">
                  {patient.registration_fee_paid || patient.payment_category !== "CASH"
                    ? "Service Cleared (Eligible)"
                    : "Registration Fee Required"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onCheckPayment(patient)}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Inspect
              </button>
            </div>

            {/* Demographics Group */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Personal Details
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/60">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-semibold text-slate-800">{patient.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{patient.date_of_birth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Blood Group / Genotype</span>
                  <span className="font-bold text-slate-800">
                    {patient.blood_group || "N/A"} ({patient.genotype || "N/A"})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Marital Status</span>
                  <span className="font-semibold text-slate-800">{patient.marital_status || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Contact Details
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{patient.phone_number || "No telephone provided"}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-slate-700 pt-1 border-t border-slate-200/60">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{patient.address}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Emergency Contact (Next of Kin)
              </h3>
              <div className="bg-amber-50/50 p-4 rounded-xl space-y-1.5 border border-amber-200/60">
                <div className="font-bold text-slate-800">{patient.emergency_contact_name}</div>
                <div className="text-slate-600 flex items-center gap-1 text-[11px]">
                  <span>Relationship:</span>
                  <span className="font-medium text-slate-800">{patient.emergency_contact_relationship}</span>
                </div>
                <div className="text-blue-700 font-mono font-semibold pt-1">
                  {patient.emergency_contact_phone}
                </div>
              </div>
            </div>

            {/* Registration Metadata */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Registered:
              </span>
              <span>{new Date(patient.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={() => onPrintCard(patient)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print ID Card
            </button>
            <button
              type="button"
              onClick={() => onCheckPayment(patient)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              <CreditCard className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
