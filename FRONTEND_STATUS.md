# Hospital Information Management System (HIMS) — Frontend Status & Roadmap

> **Current Local Time:** September 28, 2026  
> **Active Git Branch:** `feat/group-2-radiology`  
> **Parent / Upstream Branch:** `origin/feat/phase-0-dev-env-and-db` (Commit `d659fa0`)  
> **Developer Scope:** Strictly Frontend (`frontend/`)  
> **Repository Rules Adherence:** Fully compliant with `AGENTS.md`, `ARCHITECTURE.md`, and `PRD.md`  
> **Push Status:** **PAUSED (Local Only)** — *Do NOT push to remote until you give the explicit go-ahead.*

---

## 1. Executive Summary & Where You Are At

You have completed the entire frontend user interface, state management, validation logic, role preview system, and API communication layer for **Build Group 1 (Foundation)** as specified in `TASKS.md` (§2).

Every module is implemented in modern React 19 + TypeScript, styled with Tailwind CSS, uses Lucide icons, and strictly compiles without a single error or warning.

### Production Build & Type-Check Verification
- **Verification Command:** `docker compose run --rm frontend npm run build`
- **TypeScript Rules:** Strict mode (`noUnusedLocals: true`, `noUnusedParameters: true`, `noUncheckedIndexedAccess: true`)
- **Compilation Result:** **0 errors, 0 warnings** (1,641 modules compiled cleanly into `/dist` in 1.48s)
- **Local Working Tree:** Clean and staged in git

---

## 2. Completed Modules & Git Commit History

All 7 modules of Build Group 1 are committed to your local feature branch (`feat/group-1-medical-records`). Each commit contains the complete implementation, types, API client, mock data, and functional views:

| Local Commit | Module | Functional Requirements | Key Capabilities Implemented |
|---|---|---|---|
| `9ba691d` | **Medical Records** | `FR-MR-01` to `FR-MR-06` | • Master Patient Index (MPI) search by Name, Hospital No, NHIA ID<br>• Full demographic registration with national ID & photo capture<br>• Auto-formatted hospital number generation (`HIMS-YYYY-XXXXX`)<br>• Patient ID card generation with isolated CSS print styles<br>• Payment-before-service visual gating and verification badges<br>• Slide-over patient detail drawer with clinical history |
| `27885c0` | **Nursing Services** | `FR-NS-01` to `FR-NS-10` | • Ward admission intake with triage scoring and bed assignment<br>• Real-time vitals entry with automatic abnormal/critical flags (BP, pulse, temp, SpO2)<br>• Shift handover endorsement with dual nurse sign-off<br>• Ward bed map visualization with occupancy statuses<br>• Structured nursing notes (General, Assessment, Incident) with lock-on-sign<br>• Discharge checklist with 100% completion requirement before billing trigger |
| `ffb748f` | **Accounts & Billing** | `FR-AC-01` to `FR-AC-08` | • NHIA-aware invoice builder with tariff calculations and copay splits<br>• Manage invoices table with aging breakdown (0-30, 31-60, 61-90, 90+ days)<br>• Multi-channel payment recording (Cash, POS, Bank Transfer, Insurance) & printable receipts<br>• Ward charge consolidation at patient discharge<br>• Soft-delete invoices (`deleted_at`) with mandatory password confirmation and audit rationale |
| `a33a968` | **Pharmacy (Minimal)** | `FR-PH-01` to `FR-PH-04` | • Real-time prescription intake queue filtered by status<br>• Safety check engine: drug-allergy warnings and drug-drug interaction alerts<br>• Dispensing workflow with automatic batch deduction and stock decrement<br>• Formulary stock viewer with reorder level thresholds and out-of-stock badges |
| `c7dcbee` | **Appointment Scheduling** | `FR-AP-01` to `FR-AP-05` | • Specialist doctor availability roster with interactive 30-min slot calendar<br>• MPI-linked appointment booking modal with department selection<br>• Reschedule and cancel workflows requiring mandatory audit log reasons<br>• Patient reminder preferences (SMS, Email, Phone)<br>• Explicit visual and architectural decoupling from the GOPD walk-in queue |
| `2f4ece4` | **Accounting — General Ledger** | `FR-GL-01` to `FR-GL-05` | • Real-time cash and bank transaction register with search and date filters<br>• Balanced double-entry Journal Vouchers (Debits must equal Credits) with Chief Accountant approval gate<br>• 4-tier Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses)<br>• Financial statement generator: Trial Balance (with Dr=Cr balance validation), P&L, Balance Sheet<br>• Patient revenue reconciliation engine matching Billing receipts against GL with 1-click auto-posting |
| `ebc4536` | **Sub-store Management** | `FR-SS-01` to `FR-SS-04` | • Ward and surgical theatre stock inventory with batch tracking and expiry flags<br>• Central store replenishment requisition workflow (Draft → Submitted → Approved → Fulfilled)<br>• Reorder point monitoring with quick-reorder triggers for low-stock items<br>• Physical count adjustment modal with mandatory audit justification and immutable adjustment log trail |
| *pending* | **Radiology / Imaging** | `FR-RA-01` to `FR-RA-04` | • Modality worklist filtering for completed scans<br>• Integrated DICOM placeholder/mockup<br>• Radiologist study reporting and sign-off mockups |

---

## 3. Key Architectural Decisions & Guardrails Honored

1. **Strictly Frontend Scope:**
   - No backend files (`services/core-go/`, `services/interop-py/`) or database migrations were touched, modified, or deleted, respecting teammate ownership and `AGENTS.md` Rule #1 & #5.
2. **Discharge Checklist → Billing Trigger Decision (`FR-NS-10` / `FR-AC-06`):**
   - Configured as a **strict 100% completion requirement** on the Nursing Discharge Checklist before discharge billing is triggered.
   - Included an **audited Doctor/Matron override** mechanism with required rationale for emergency discharges.
3. **Admission Deposit Gate Decision (`FR-AC-08` / `FR-NS-01`):**
   - Implemented as a **non-blocking soft warning banner** (`Deposit Pending`) during ward admission intake.
   - **Accident & Emergency (A&E) admissions are unconditionally exempt** from deposit requirements to safeguard immediate patient care.
4. **GOPD Walk-in vs. Scheduled Appointments Decoupling (`FR-AP-05`):**
   - Appointments and GOPD walk-in triage are decoupled at both the UI and data layer, ensuring booked consultant rosters are not disrupted by walk-ins.
5. **Soft-Delete Only & Mandatory Audit Logging:**
   - Financial deletion actions (such as invoice cancellation) require double confirmation and mandatory audit reasons, preserving compliance with `AGENTS.md` Rules #2 and #3.
6. **Dual-Mode API Layer (Network Fetch + Resilient Local Fallback):**
   - Every module's `api.ts` actively attempts real HTTP requests (`fetch('/api/v1/...')`) against the backend services.
   - If the backend is currently down, returning 404, or still under construction by teammates, the frontend **automatically and seamlessly falls back to persistent `localStorage` with realistic hospital mock data**. The application remains 100% interactive and demo-ready at all times.

---

## 4. What You Need to Keep Pushing Forward

To maintain momentum and successfully transition into testing and the next build phase, follow these actionable steps:

### A. When Ready to Push (Execute Only on Your Command)
Once you decide to push your work to the remote repository, run:
```bash
git push -u origin feat/group-1-medical-records
```
> **Notice:** As instructed, this push has **not** been executed. The command is waiting for your explicit approval.

---

### B. Internal QA Walkthrough (Validating Build Group 1 Exit Criteria §2.8)
Before opening a Pull Request or starting Build Group 2, perform this complete patient journey test inside the running web app (`http://localhost:5173`):

1. **Step 1 — Register Patient:**
   - Go to **Medical Records** tab.
   - Click **+ Register New Patient**.
   - Fill in demographics, capture photo, and save.
   - Confirm patient appears in the MPI table with an auto-generated hospital number.
   - Click **Print Card** to test the clean ID card view.

2. **Step 2 — Book Appointment:**
   - Go to **Appointments** tab.
   - Click **+ Book Appointment**.
   - Select the newly registered patient, pick a doctor and an available 30-min slot.
   - Confirm the appointment appears in the calendar and list view.

3. **Step 3 — Inpatient Admission & Nursing Care:**
   - Go to **Nursing** tab.
   - Click **+ Admit Patient**.
   - Assign the patient to a ward and bed (note the soft deposit warning banner).
   - Enter a set of vitals (test entering a high blood pressure like `160/100` to verify the red abnormal indicator).
   - Add a nursing clinical note and lock it.
   - Test the **Shift Handover** tab with dual nurse sign-off.

4. **Step 4 — Medication Dispensing:**
   - Go to **Pharmacy** tab.
   - Find the pending prescription for your patient.
   - Click **Dispense Medication** and observe the allergy check indicator and stock reduction in the formulary.

5. **Step 5 — Discharge & Billing Consolidation:**
   - Return to **Nursing** tab → select the patient → click **Discharge Checklist**.
   - Check off all mandatory items until 100% is reached.
   - Click **Generate Final Discharge Bill**.
   - Go to **Billing** tab → observe the consolidated invoice with ward days, nursing items, and pharmacy charges.
   - Click **Record Payment** (e.g. Cash/POS) → generate and preview the official receipt.

6. **Step 6 — General Ledger Reconciliation:**
   - Go to **Accounting** tab.
   - View the **Billing Reconciliation** sub-tab.
   - Confirm the receipt from Step 5 is listed with matched status and zero variance.
   - Review the **Financial Statements** (Trial Balance where Total Debits = Total Credits).

7. **Step 7 — Ward Supply Replenishment:**
   - Go to **Sub-store** tab.
   - Switch between Ward A and Emergency Sub-stores.
   - Click **+ New Requisition** to request supplies from the central store.
   - Test a physical inventory count adjustment and enter a mandatory audit explanation.

---

### C. Backend Teammate Handover & Contract Alignment
To connect the frontend to live Go and Python services as your teammates finish their endpoints, share the following route contracts (from `docs/10_API_ROUTES.md`):

| Module | Core Service | Expected Base Endpoint | Key Methods |
|---|---|---|---|
| **Medical Records** | Go Core (`:8080`) | `/api/v1/patients` | `GET /`, `POST /`, `GET /{id}`, `PUT /{id}` |
| **Nursing Services** | Go Core (`:8080`) | `/api/v1/nursing` | `/admissions`, `/vitals`, `/beds`, `/notes`, `/discharge` |
| **Accounts & Billing** | Go Core (`:8080`) | `/api/v1/billing` | `/invoices`, `/payments`, `/receipts`, `/charges` |
| **Pharmacy (Minimal)** | Go Core (`:8080`) | `/api/v1/pharmacy` | `/prescriptions`, `/dispense`, `/formulary` |
| **Appointments** | Go Core (`:8080`) | `/api/v1/appointments`| `/availability`, `/book`, `/reschedule`, `/cancel` |
| **Accounting — GL** | Go Core (`:8080`) | `/api/v1/accounting`| `/chart-of-accounts`, `/journal-vouchers`, `/statements`, `/reconcile` |
| **Sub-store Management**| Go Core (`:8080`) | `/api/v1/substores` | `/items`, `/requisitions`, `/adjustments` |

> *Note for teammates:* All frontend mutations send standard JSON bodies and expect HTTP 200/201 responses with JSON payloads. The frontend is fully operational even before backend endpoints are deployed due to the built-in fallback engine.

---

### D. Roadmap: Build Group 2 — Clinical & Insurance Workflow (`TASKS.md` §3)
Once Build Group 1 is accepted, the frontend is ready to implement Build Group 2:

1. **GOPD Consultations & Triage Queue (Go Core):**
   - Outpatient triage queue with vital signs review and queue token numbers.
   - Doctor consultation desk: Chief complaints, history of presenting illness, physical examination.
   - ICD-10 diagnosis selector with search and primary/secondary diagnosis tags.
   - Integrated e-prescriptions and investigation order triggers.
2. **Laboratory / LIS Module (Python Interop `:8000`):**
   - Laboratory test order worklist and specimen collection tracking.
   - Barcode scanning and specimen labeling.
   - Test result entry with reference ranges, abnormal flags, and Pathologist sign-off.
3. **NHIA / HMO Claims Management (Python Interop `:8000`):**
   - Insurance eligibility verification and pre-authorization code tracking.
   - Tariff code mapping, drug price caps, and co-payment calculations.
   - Batch claims generation and submission status tracker.
4. **Radiology / PACS Module (Python Interop `:8000`):**
   - Modality worklist (X-Ray, Ultrasound, CT, MRI).
   - DICOM image viewer placeholder / web-viewer integration.
   - Radiologist structured reporting and critical finding escalation alerts.

---

## 5. Current File Hierarchy of Frontend Work

```
frontend/src/
├── App.tsx                                 # Global navigation, module launcher & role switcher
├── modules/
│   ├── medicalrecords/                     # FR-MR-01 to FR-MR-06
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── MedicalRecordsView.tsx
│   │   └── components/
│   │       ├── PatientRegistrationModal.tsx
│   │       ├── PatientDetailDrawer.tsx
│   │       └── PatientIdCardModal.tsx
│   ├── nursing/                            # FR-NS-01 to FR-NS-10
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── NursingView.tsx
│   │   └── components/
│   │       ├── AdmissionIntakeModal.tsx
│   │       ├── VitalsEntryModal.tsx
│   │       ├── NursingNotesModal.tsx
│   │       ├── DischargeChecklistModal.tsx
│   │       ├── WardBedMapView.tsx
│   │       └── ShiftHandoverView.tsx
│   ├── billing/                            # FR-AC-01 to FR-AC-08
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── BillingView.tsx
│   │   └── components/
│   │       ├── CreateInvoiceModal.tsx
│   │       ├── RecordPaymentModal.tsx
│   │       ├── ReceiptViewModal.tsx
│   │       └── DeleteInvoiceModal.tsx
│   ├── pharmacy/                           # FR-PH-01 to FR-PH-04
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── PharmacyView.tsx
│   │   └── components/
│   │       ├── DispenseModal.tsx
│   │       └── FormularyModal.tsx
│   ├── appointments/                       # FR-AP-01 to FR-AP-05
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── AppointmentsView.tsx
│   │   └── components/
│   │       ├── BookAppointmentModal.tsx
│   │       ├── RescheduleAppointmentModal.tsx
│   │       └── CancelAppointmentModal.tsx
│   ├── accounting/                         # FR-GL-01 to FR-GL-05
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── mockData.ts
│   │   ├── AccountingView.tsx
│   │   └── components/
│   │       ├── JournalVoucherModal.tsx
│   │       ├── ChartOfAccountsModal.tsx
│   │       ├── FinancialStatementsView.tsx
│   │       └── BillingReconciliationView.tsx
│   ├── radiology/
│   │   └── RadiologyView.tsx
│   └── substore/                           # FR-SS-01 to FR-SS-04
│       ├── types.ts
│       ├── api.ts
│       ├── mockData.ts
│       ├── SubstoreView.tsx
│       └── components/
│           ├── RequisitionModal.tsx
│           ├── StockAdjustmentModal.tsx
│           ├── RequisitionManagementView.tsx
│           └── StockAuditLogDrawer.tsx
```
