import React, { useState } from "react";
import { X, ShieldCheck, AlertTriangle, PhoneCall, CheckCircle2, Award } from "lucide-react";
import { LabOrder } from "../types";

interface PathologistSignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LabOrder | null;
  onVerify: (orderId: string, pathologistComment?: string) => Promise<void>;
  onEscalate: (orderId: string, doctorName: string) => Promise<void>;
}

export const PathologistSignOffModal: React.FC<PathologistSignOffModalProps> = ({
  isOpen,
  onClose,
  order,
  onVerify,
  onEscalate
}) => {
  const [comment, setComment] = useState("");
  const [escalateDoctor, setEscalateDoctor] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escalatedSuccess, setEscalatedSuccess] = useState(false);

  React.useEffect(() => {
    if (order?.results) {
      setComment(order.results.pathologistComment || "");
      setEscalateDoctor(order.orderingDoctor || "");
      setEscalatedSuccess(!!order.results.criticalEscalated);
    }
  }, [order, isOpen]);

  if (!isOpen || !order || !order.results) return null;

  const criticals = order.results.parameters.filter(p => p.flag === "CRITICAL" && p.value.trim() !== "");
  const abnormals = order.results.parameters.filter(p => (p.flag === "HIGH" || p.flag === "LOW") && p.value.trim() !== "");

  const handleEscalateCall = async () => {
    if (!escalateDoctor.trim()) return;
    setIsEscalating(true);
    try {
      await onEscalate(order.id, escalateDoctor.trim());
      setEscalatedSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to log critical escalation.");
    } finally {
      setIsEscalating(false);
    }
  };

  const handleAuthorize = async () => {
    setIsSubmitting(true);
    try {
      await onVerify(order.id, comment);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to authorize lab report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Pathologist Report Verification & Sign-Off</h2>
              <p className="text-xs text-slate-500">
                Medical validation & diagnostic authorization • {order.discipline.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 text-sm">{order.patientName}</span>
            <span className="text-slate-500 ml-2">({order.hospitalNumber} • {order.age}y {order.gender})</span>
          </div>
          <div className="text-slate-500">
            Ordering Physician: <strong>{order.orderingDoctor}</strong> ({order.originDepartment})
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Critical Value Alert & Escalation Box */}
          {criticals.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Critical Finding Escalation Protocol</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Critical values require mandatory immediate notification of the managing physician or clinic nurse.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-red-100 text-xs text-red-900 space-y-1">
                {criticals.map((c, i) => (
                  <div key={i} className="flex justify-between font-mono">
                    <span className="font-bold">{c.name}</span>
                    <span className="font-extrabold text-red-700">{c.value} {c.unit} (Ref: {c.referenceRange})</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-red-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-800 font-semibold">Notified Doctor:</span>
                  <input
                    type="text"
                    value={escalateDoctor}
                    onChange={e => setEscalateDoctor(e.target.value)}
                    className="text-xs p-1.5 border border-red-300 rounded-lg bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleEscalateCall}
                  disabled={isEscalating || escalatedSuccess}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                    escalatedSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  {escalatedSuccess ? "Escalation Logged" : isEscalating ? "Logging..." : "Log Doctor Notification"}
                </button>
              </div>
            </div>
          )}

          {/* Results Summary Review */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Parameter Review ({order.results.parameters.length} parameters)
              </label>
              <span className="text-xs text-slate-500">
                {abnormals.length} abnormal{abnormals.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {order.results.parameters.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3 flex items-center justify-between transition-colors ${
                    p.flag === "CRITICAL"
                      ? "bg-red-50/60"
                      : p.flag === "HIGH"
                      ? "bg-amber-50/40"
                      : p.flag === "LOW"
                      ? "bg-blue-50/30"
                      : "bg-white"
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-slate-400 text-[11px] ml-2">Ref: {p.referenceRange} {p.unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {p.value || "—"} {p.unit}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.flag === "CRITICAL"
                          ? "bg-red-600 text-white"
                          : p.flag === "HIGH"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : p.flag === "LOW"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {p.flag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pathologist Interpretive Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Pathologist Interpretive Clinical Report & Impression
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Enter clinical interpretation, diagnostic correlation, or recommendations..."
              className="w-full text-xs border-slate-300 rounded-xl p-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Digital Signature Box */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verifying Consultant: <strong>Dr. F. Alabi, FMCPath (Consultant Chemical Pathologist)</strong></span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700">Medical Registration #MED-19948</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Authorizing..." : "Authorize & Sign Off Lab Report"}
          </button>
        </div>
      </div>
    </div>
  );
};
