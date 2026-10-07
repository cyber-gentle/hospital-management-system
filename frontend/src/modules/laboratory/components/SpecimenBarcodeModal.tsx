import React from "react";
import { X, Printer, Barcode } from "lucide-react";
import { LabOrder } from "../types";

interface SpecimenBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LabOrder | null;
}

export const SpecimenBarcodeModal: React.FC<SpecimenBarcodeModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order || !order.specimen) return null;

  const handlePrint = () => {
    window.print();
  };

  const barcodeValue = order.specimen.specimenBarcode;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header (hidden in print) */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800 text-sm">Specimen Tube Barcode Label</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Label Preview Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100 print:bg-white print:p-0">
          <div className="w-[320px] bg-white border-2 border-dashed border-slate-300 print:border-none p-4 rounded-xl shadow-xs print:shadow-none space-y-2 text-slate-900">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              <span>HIMS LAB PATHOLOGY</span>
              <span>{order.discipline.replace("_", " ")}</span>
            </div>

            {/* Patient Details */}
            <div className="space-y-0.5">
              <div className="font-bold text-sm truncate">{order.patientName}</div>
              <div className="text-xs font-mono text-slate-700 flex justify-between">
                <span>{order.hospitalNumber}</span>
                <span>{order.age}y / {order.gender}</span>
              </div>
            </div>

            {/* Barcode Graphic Simulation */}
            <div className="py-2 flex flex-col items-center justify-center bg-white">
              <div className="flex items-center justify-center gap-0.5 h-10 w-full px-2">
                {/* SVG Pseudo-barcode bars */}
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2].map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-black h-full"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-bold tracking-widest mt-1 text-slate-900">
                *{barcodeValue}*
              </span>
            </div>

            {/* Test Details */}
            <div className="border-t border-slate-200 pt-1 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">{order.testCode}</span>
                <span className="text-slate-600 truncate max-w-[190px]">{order.testName}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Tube: <strong>{order.specimen.containerType}</strong></span>
                <span>Draw: {new Date(order.specimen.collectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Coll by: {order.specimen.collectedBy}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 print:hidden text-center">
            Standard 50mm x 25mm barcode label format. Ready for direct thermal or lab tube printer.
          </p>
        </div>

        {/* Footer actions (hidden in print) */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Barcode Label
          </button>
        </div>
      </div>
    </div>
  );
};
