# TASKS.md — Step-by-Step Checklist
## Hospital Information Management System (HIMS)

> Linear roadmap broken down from `PRD.md` / `docs/08_ROADMAP_PHASES.md`.
> Work top to bottom within each section. Check off `[x]` as completed.
> Add newly discovered tasks under the relevant section rather than doing
> them silently. Do not skip ahead to a later Build Group section before
> the current one is functionally complete.
>
> **Sequencing decision:** all 20 modules are built to completion before
> any hospital pitch, demo, or marketing activity — no phased client
> engagement gates this build. Known risk: several requirements below are
> still marked `[VALIDATE WITH HOSPITAL]`/`[UNRESOLVED]` and won't get
> real answers until after the full build, since no hospital contact
> happens until then. Where a task depends on one of those, build to the
> most reasonable documented assumption and flag it clearly rather than
> blocking — but don't quietly resolve it as if it were confirmed.

---

## 0. Project Setup

- [x] Initialize repo structure per `ARCHITECTURE.md` (`services/core-go/`, `services/interop-py/`, `frontend/`)
- [x] Set up Go core service skeleton (Gin/Echo/Fiber — pick one)
- [x] Set up Python interop service skeleton (FastAPI)
- [x] Set up frontend (React + Tailwind) project skeleton
- [x] Set up PostgreSQL — single shared instance, Go owns migrations
- [x] Set up `audit_logs` table + append-only DB role permissions (Go-owned)
- [x] Build the Go auth module (JWT issuance) + base RBAC middleware
- [x] Build Go's `/internal/audit-log` and `/internal/authz/check` endpoints
      — these must exist before any Python module work starts
- [x] Build Python's `core_client.py` — verify it can successfully call
      both internal Go endpoints before writing any Lab/NHIA/Radiology logic
- [x] Set up CI pipeline (lint + type-check + test for both services on PR)
- [x] Set up local dev environment (`docker-compose.yml` — both services + Postgres + reverse proxy)

## 1. Requirements Assumptions (no hospital contact until full build is done)

Since hospital validation won't happen until after the complete system is
built, resolve these by picking the most defensible default from
`docs/` and documenting the assumption in code comments / a running
`ASSUMPTIONS.md` — don't leave them silently unresolved:

- [ ] Document assumed discharge-checklist → billing trigger rule
      (`PRD.md` "Two integration decisions" #1) — pick one, note it's assumed
- [ ] Document assumed admission-deposit enforcement rule
      (`PRD.md` "Two integration decisions" #2) — pick one, note it's assumed
- [ ] Document assumed RBAC role list (`docs/06_SECURITY_RBAC.md`)
- [ ] Document assumed NHIA plan types
- [ ] Document assumed ward/bed count and department list (for demo data)

## 2. Build Group 1 — Foundation

### 2.1 Medical Records
- [ ] Patient entity + migration
- [ ] FR-MR-01: Patient search (name/hospital no./NHIA ID)
- [ ] FR-MR-02: New patient registration
- [ ] FR-MR-03: Hospital number generation
- [ ] FR-MR-05: Patient ID card printing
- [ ] FR-MR-06: Payment-before-service enforcement (depends on Task 1 decision)

### 2.2 Nursing Services
- [ ] Admission/ward/bed entities + migrations
- [ ] FR-NS-01: Admission intake flow (triage, ward/bed assignment, checklist)
- [ ] FR-NS-02: My Patients list (filter by Critical/High Risk/Stable)
- [ ] FR-NS-03: Nursing Tasks (MAR-linked)
- [ ] FR-NS-04: Vital signs entry (manual + device-connect stub)
- [ ] FR-NS-05: Nursing Notes (structured types, tagging, sign-and-lock)
- [ ] FR-NS-06: Care Plans (templates, interventions, progress tracking)
- [ ] FR-NS-07: Shift Handover (endorsement list, dual sign-off)
- [ ] FR-NS-08: Ward Management (bed map, staff allocation, ward inventory)
- [ ] FR-NS-09: Discharge checklist
- [ ] FR-NS-10: Wire discharge checklist completion to billing trigger
      (per Task 1 decision)

### 2.3 Accounts & Billing
- [ ] Invoice/payment entities + migrations
- [ ] FR-AC-01: Create new invoice (NHIA-aware line items)
- [ ] FR-AC-02: Manage Invoices list (filters, aged invoice summary)
- [ ] FR-AC-03: Invoice actions (view/edit/status)
- [ ] FR-AC-04: Invoice permissions (role defaults + per-user overrides)
- [ ] FR-AC-05: Delete invoice (password confirm + audit log — soft delete only)
- [ ] FR-AC-06: Pull consolidated charges from Nursing Tasks/Notes at discharge
- [ ] FR-AC-07: Payment methods + receipt history
- [ ] FR-AC-08: Admission deposit enforcement (per Task 1 decision)

### 2.4 Pharmacy (minimal)
- [ ] Drug/dispensing entities + migrations
- [ ] FR-PH-01: Receive prescription
- [ ] FR-PH-02: Basic allergy/interaction check
- [ ] FR-PH-03: Dispense + stock deduction
- [ ] FR-PH-04: Basic stock level view

### 2.5 Appointment Scheduling (new)
- [ ] Appointment/doctor-availability entities + migrations
- [ ] FR-AP-01: Doctor availability view
- [ ] FR-AP-02: Book appointment (linked to Medical Records)
- [ ] FR-AP-03: Reschedule/cancel
- [ ] FR-AP-04: Reminders (confirm scope per Task 1 decision before building)
- [ ] FR-AP-05: Distinguish from GOPD walk-in queue in the UI/data model

### 2.6 Accounting — General Ledger (new)
- [ ] Chart of accounts / journal voucher entities + migrations
- [ ] FR-GL-01: Cash/bank transaction recording
- [ ] FR-GL-02: Journal voucher entry + approval workflow
- [ ] FR-GL-03: Chart of accounts configuration
- [ ] FR-GL-04: Financial statement generation
- [ ] FR-GL-05: Reconciliation against Billing's patient revenue — build
      this integration deliberately, not as an afterthought; two
      disconnected ledgers defeats the point of this module

### 2.7 Sub-store Management (new)
- [ ] Sub-store/requisition entities + migrations
- [ ] FR-SS-01: Ward/department-level stock view
- [ ] FR-SS-02: Requisition from central store
- [ ] FR-SS-03: Ward-level reorder point tracking
- [ ] FR-SS-04: Stock adjustment with mandatory audit log entry

### 2.8 Build Group 1 exit criteria
- [ ] Full patient journey (Registration → Admission → Vitals/Meds →
      Discharge → Billing → Payment) works end-to-end without manual workaround
- [ ] Every invoice traceable to the clinical activity that generated it
- [ ] Every financial edit/delete produces a complete audit record
- [ ] RBAC matrix tested for all Group 1 roles/actions
- [ ] Accounting's ledger reconciles against Billing's revenue with zero
      unexplained variance
- [ ] Internal QA pass against documented assumptions (no hospital sign-off yet — that happens after full build, see §6)

## 3. Build Group 2 — Clinical & Insurance Workflow

*(Detail each module's tasks here once Group 1 is stable — see
`docs/03_SRS.md` §2 for the current high-level requirement list to expand
from: Laboratory, NHIA/HMO, GOPD, Radiology)*

- [ ] Expand `docs/03_SRS.md` §2 into detailed FR list for these 4 modules
- [ ] Laboratory (LIS) implementation
- [ ] NHIA/HMO claims implementation
- [ ] GOPD queue/consultation implementation
- [ ] Radiology/Imaging implementation
- [ ] Internal QA pass on Build Group 2 (no hospital sign-off yet)

## 4. Build Group 3 — Specialized Departments & Operations

*(Detail each module's tasks here once Group 2 is stable — see
`docs/03_SRS.md` §3 for the module list to expand from)*

- [ ] Expand `docs/03_SRS.md` §3 into detailed FR list for these 9 modules
- [ ] Theatre implementation
- [ ] Maternity implementation
- [ ] Accident & Emergency implementation
- [ ] Mortuary implementation
- [ ] Audit Department dashboard implementation
- [ ] HR & Staff Management implementation
- [ ] Reporting & Analytics implementation
- [ ] Inventory & Procurement implementation
- [ ] Security/System Administration implementation
- [ ] Internal QA pass on full 20-module system (no hospital sign-off yet)

## 5. First Hospital Engagement (only after all 20 modules pass internal QA)

- [ ] Demo-ready build of the complete system with synthetic data
- [ ] Approach target hospital with the full working system (not a partial one)
- [ ] Interviews with department heads to validate the assumptions logged in §1
- [ ] Resolve every open `[VALIDATE WITH HOSPITAL]`/`[UNRESOLVED]` item against real answers
- [ ] Adjust build to match confirmed requirements (expect rework here —
      this is the tradeoff of validating after building instead of before)

## 6. Migration & Go-Live (this specific hospital, once engaged)

- [ ] Legacy data export + field mapping (`docs/08_ROADMAP_PHASES.md` §3)
- [ ] Migration script built + tested against staging
- [ ] Dry-run migration, validate <1% discrepancy
- [ ] Parallel run with legacy system, 2–4 weeks
- [ ] Department head sign-off on parallel run accuracy
- [ ] Cutover — legacy system set read-only/archival
- [ ] Rollback plan documented and rehearsed
- [ ] Full system go-live

---

**Housekeeping:** when a task reveals a new requirement, sub-task, or a
question that needs hospital input, add it under the relevant section
here (or as a new `[UNRESOLVED]` note in `PRD.md` if it's a business
decision) rather than resolving it silently.
