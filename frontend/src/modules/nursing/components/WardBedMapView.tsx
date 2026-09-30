import React from 'react';
import { Ward, Bed } from '../types';

interface WardBedMapViewProps {
  wards: Ward[];
  onSelectBed: (bed: Bed) => void;
  onAdmitToBed: (wardId: string, bedNumber: string) => void;
}

export const WardBedMapView: React.FC<WardBedMapViewProps> = ({
  wards,
  onSelectBed,
  onAdmitToBed
}) => {
  return (
    <div className="space-y-8">
      {wards.map((ward) => {
        const occupancyRate = Math.round((ward.occupiedBeds / ward.totalBeds) * 100);

        return (
          <div key={ward.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Ward Header */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{ward.name}</h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {ward.department}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Occupancy: <strong className="text-slate-800">{ward.occupiedBeds}</strong> of {ward.totalBeds} beds ({occupancyRate}%)
                </p>
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {ward.availableBeds} Available
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {ward.occupiedBeds} Occupied
                </span>
              </div>
            </div>

            {/* Bed Matrix Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ward.beds.map((bed) => {
                const isOccupied = bed.status === 'occupied';
                const isAvailable = bed.status === 'available';
                const isCleaning = bed.status === 'cleaning';

                return (
                  <div
                    key={bed.id}
                    className={`rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                      isOccupied
                        ? bed.acuity === 'critical'
                          ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400 hover:shadow-md'
                          : bed.acuity === 'high_risk'
                          ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:shadow-md'
                          : 'border-blue-200 bg-blue-50/20 hover:border-blue-300 hover:shadow-md'
                        : isAvailable
                        ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-md cursor-pointer'
                        : isCleaning
                        ? 'border-yellow-200 bg-yellow-50/30 opacity-80'
                        : 'border-slate-200 bg-slate-100 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Bed Number & Status Tag */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono font-bold text-sm text-slate-800">
                          {bed.bedNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isOccupied
                              ? bed.acuity === 'critical'
                                ? 'bg-rose-100 text-rose-800'
                                : bed.acuity === 'high_risk'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                              : isAvailable
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCleaning
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isOccupied ? bed.acuity?.replace('_', ' ') : bed.status}
                        </span>
                      </div>

                      {/* Content */}
                      {isOccupied ? (
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {bed.patientName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {bed.hospitalNumber}
                          </p>
                          {bed.occupiedSince && (
                            <p className="text-[10px] text-slate-400">
                              Admitted: {new Date(bed.occupiedSince).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      ) : isAvailable ? (
                        <div className="py-2 text-center text-xs text-emerald-700 font-medium">
                          <span>✓ Clean & Sanitized</span>
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">Ready for admission</p>
                        </div>
                      ) : isCleaning ? (
                        <div className="py-2 text-center text-xs text-yellow-700 font-medium">
                          <span>🧹 Terminal Disinfection</span>
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">Housekeeping in progress</p>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-slate-500 font-medium">
                          <span>🔧 Engineering Repair</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footers */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {isOccupied ? (
                        <button
                          type="button"
                          onClick={() => onSelectBed(bed)}
                          className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                        >
                          View Inpatient Dossier →
                        </button>
                      ) : isAvailable ? (
                        <button
                          type="button"
                          onClick={() => onAdmitToBed(ward.id, bed.bedNumber)}
                          className="w-full py-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs"
                        >
                          + Admit Patient
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unavailable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
