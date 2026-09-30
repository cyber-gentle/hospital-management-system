import React, { useState } from "react";
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  User,
  Truck,
} from "lucide-react";
import { Requisition } from "../types";

interface RequisitionManagementViewProps {
  requisitions: Requisition[];
  onFulfill: (requisitionId: string) => Promise<void>;
  onNewRequisition: () => void;
}

export const RequisitionManagementView: React.FC<RequisitionManagementViewProps> = ({
  requisitions,
  onFulfill,
  onNewRequisition,
}) => {
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const handleFulfillClick = async (reqId: string) => {
    try {
      setFulfillingId(reqId);
      await onFulfill(reqId);
    } finally {
      setFulfillingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-blue-600" />
            Central Warehouse Requisitions Workflow (FR-SS-02)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal replenishment orders from ward sub-stores to the central hospital depot.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewRequisition}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
        >
          + Create Requisition
        </button>
      </div>

      <div className="space-y-3">
        {requisitions.map((req) => {
          const isFulfilled = req.status === "FULFILLED";

          return (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {req.requisitionNumber}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {req.substoreName}
                      <span className="text-xs font-normal text-slate-400">({req.wardLocation})</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      req.urgency === "EMERGENCY"
                        ? "bg-rose-100 text-rose-800"
                        : req.urgency === "URGENT"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {req.urgency}
                  </span>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                      isFulfilled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {isFulfilled ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Fulfilled & Dispatched
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Awaiting Warehouse Issue
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {req.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-500 block text-[10px]">
                        {it.itemCode}
                      </span>
                      <span className="font-semibold text-slate-800">{it.itemName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {it.approvedQty || it.requestedQty}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{it.unitOfMeasure}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info & Action */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Requested by: <strong>{req.requestedBy}</strong>
                  </span>
                  <span>Date: {new Date(req.requestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>

                <div>
                  {!isFulfilled ? (
                    <button
                      type="button"
                      disabled={fulfillingId === req.id}
                      onClick={() => handleFulfillClick(req.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {fulfillingId === req.id ? (
                        "Issuing Stock..."
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          Fulfill & Issue to Ward
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Dispatched by {req.fulfilledBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
