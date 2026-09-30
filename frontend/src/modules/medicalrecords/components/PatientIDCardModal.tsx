import React from "react";
import { X, Printer, Shield, HeartPulse, QrCode } from "lucide-react";
import { PatientIDCardData } from "../types";

interface PatientIDCardModalProps {
  cardData: PatientIDCardData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientIDCardModal: React.FC<PatientIDCardModalProps> = ({
  cardData,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !cardData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Printer className="w-5 h-5 text-blue-600" />
            <span>Patient ID Card Preview (FR-MR-05)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The Physical ID Card Container */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-100/50">
          {/* Printable Card Element */}
          <div
            id="printable-id-card"
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-blue-600/30 overflow-hidden relative"
            style={{ minHeight: "260px" }}
          >
            {/* Top Color Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold border border-white/30">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase">Federal Teaching Hospital</h3>
                  <p className="text-[10px] text-blue-200 font-medium tracking-wide">Patient Identity Card</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 uppercase">
                {cardData.payment_category}
              </span>
            </div>

            {/* Card Content Grid */}
            <div className="p-5 grid grid-cols-3 gap-4 items-center">
              {/* Photo / Avatar Placeholder */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                {cardData.photo_data_url ? <img src={cardData.photo_data_url} alt={`${cardData.full_name} patient photo`} className="w-24 h-28 rounded-xl object-cover" /> : (
                <div className="w-24 h-28 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-2 text-center shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-1">
                    {cardData.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">PHOTO</span>
                </div>
                )}
                <span className="text-[10px] text-slate-500 font-bold mt-1 text-center">
                  {cardData.gender}
                </span>
              </div>

              {/* Patient Details Column */}
              <div className="col-span-2 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
                  <span className="font-extrabold text-slate-900 text-sm leading-tight block">
                    {cardData.full_name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital No.</span>
                    <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-block">
                      {cardData.hospital_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Date of Birth</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {cardData.date_of_birth}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Blood / Genotype</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {cardData.blood_group} ({cardData.genotype})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Emergency Call</span>
                    <span className="font-medium text-slate-700 text-[11px] truncate block">
                      {cardData.emergency_phone}
                    </span>
                  </div>
                </div>

                {cardData.nhia_number && (
                  <div className="pt-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">NHIA ID</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {cardData.nhia_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Barcode / Security Strip */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                {/* SVG Simulated Barcode */}
                <div className="flex items-center gap-[2px] h-6">
                  {[4, 2, 6, 2, 4, 8, 2, 6, 4, 2, 8, 4, 6, 2, 4, 8, 2, 6, 4].map((width, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 h-full"
                      style={{ width: `${width * 0.75}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] text-slate-500 tracking-widest mt-0.5">
                  *{cardData.barcode_payload}*
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 bg-white p-1 rounded border border-slate-200 shadow-xs">
                <QrCode className="w-8 h-8 text-slate-700" />
              </div>
            </div>

            {/* Micro watermark */}
            <div className="text-[8px] text-slate-400 text-center py-1 bg-slate-100 border-t border-slate-200 flex items-center justify-center gap-1">
              <Shield className="w-2.5 h-2.5 text-slate-400" />
              Property of Federal Teaching Hospital • Emergency Hotline: 112 / +234 800 000 4467
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-center">
            Standard ISO/IEC 7810 ID-1 card format • Suitable for PVC card printer or thermal stock.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Issued: <span className="font-medium text-slate-700">{new Date(cardData.issued_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
