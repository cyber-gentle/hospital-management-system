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
import { NhiaClaimsView } from "./modules/nhiaclaims/NhiaClaimsView";
import { GopdView } from "./modules/gopd/GopdView";
import { LaboratoryView } from "./modules/laboratory/LaboratoryView";
                    mod.id === "laboratory" ||
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
