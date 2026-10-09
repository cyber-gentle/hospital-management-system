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
                    mod.id === "audit";
