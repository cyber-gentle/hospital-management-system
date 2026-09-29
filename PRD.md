# PRD.md — Feature Map
## Hospital Information Management System (HIMS)

> **Purpose of this file:** This is the working reference for any AI coding
> assistant (Claude Code, Cursor, etc.) operating on this codebase. It
> defines what the app does, who it's for, and where feature boundaries
> are — so the AI doesn't invent scope or drift into building something
> other than what's specified. Full business context lives in
> `docs/01_PRD.md` and `docs/02_BRD.md`; this file is the condensed,
> dev-facing version.

---

## What this app is

A single-tenant Hospital Information Management System (HIMS), built
first for one specific Federal Teaching Hospital client, with the intent
to sell and deploy the same codebase to other hospitals later as they
show interest — **each as its own separate, single-tenant deployment**
(own database, own server, own configuration). This is not a shared
multi-tenant SaaS product: no hospital's data or infrastructure is ever
shared with another. Within any given deployment, there is exactly one
hospital, one set of wards, one set of departments — do not build
multi-tenancy, hospital-switching, tenant IDs on shared tables, or
white-label features into the running system itself.

## Who uses it (roles — see `docs/06_SECURITY_RBAC.md` for full permission matrix)

- **Doctor** — consultation, prescriptions, diagnosis, referrals
- **Nurse** — admission, vitals, medication administration, notes, care plans, discharge checklist
- **Pharmacist** — dispensing, stock
- **Accountant / Chief Accountant** — billing, payments, invoice approval/void/delete
- **NHIA Officer** — eligibility checks, claims
- **Auditor** — read-only across all modules, audit log review
- **Admin/ICT** — user management, system configuration

## Full Module List — 20 modules (all in scope — see `docs/01_PRD.md` §4 for detail)

**Go core service (17 modules — owns auth + audit, see `ARCHITECTURE.md`):**
1. Medical Records
2. Nursing Services
3. Accounts & Billing
4. Pharmacy
5. GOPD
6. Theatre
7. Maternity
8. Accident & Emergency
9. Mortuary
10. Audit Department
11. HR & Staff Management
12. Reporting & Analytics
13. Inventory & Procurement
14. Security/System Administration
15. **Appointment Scheduling** — doctor/consultant appointment booking, calendar, availability; distinct from GOPD's walk-in queue
16. **Accounting (General Ledger)** — hospital institutional bookkeeping (cash/bank, journal vouchers, financial statements); distinct from Billing's patient invoicing
17. **Sub-store Management** — department/ward-level stock (already implied in the Nursing Ward Management mockup's ward-level supply table); distinct from Inventory & Procurement's hospital-wide central store

**Python interop service (3 modules — HL7/FHIR-heavy, see `ARCHITECTURE.md`):**
18. Laboratory (LIS)
19. NHIA/HMO
20. Radiology/Imaging

**Build order** (technical dependency, not reduced scope — see `docs/08_ROADMAP_PHASES.md`):
Group 1 (Medical Records, Nursing, Billing, Pharmacy, Appointment Scheduling,
Accounting, Sub-store) → Group 2 (Lab, NHIA, GOPD, Radiology) → Group 3
(everything else). Do not start Group 2/3 features before Group 1's
patient record and billing engine are stable — they depend on it.

## Feature Boundaries — what NOT to build

- No multi-hospital support, no tenant switching
- No native mobile apps (web-responsive only, unless explicitly instructed)
- No telemedicine/video consultation
- No research/clinical trial data management
- Do not invent new modules or features beyond the 20 listed above without
  explicit instruction — if a request seems to need a new module, flag it
  rather than silently building it

## Two integration decisions that MUST be resolved before implementing (do not guess)

1. **Discharge → Billing trigger**: threshold for discharge checklist
   completion before invoice generation. **[RESOLVED 2026-09-28 —
   decided: 100% checklist completion, no nurse sign-off gate. See
   `ASSUMPTIONS.md` — note this deliberately differs from the billing
   client material, which is not authoritative.]**
2. **Admission deposit gate**: hard UI lock in Nursing module vs. backend
   flag. A&E is always exempt. **[RESOLVED 2026-09-28 — decided:
   backend flag, enforced at the API layer, no hard UI lock. See
   `ASSUMPTIONS.md`.]**

Both decisions are recorded in full in `ASSUMPTIONS.md`, including the
open sub-questions that remain unanswered. Any further change to either
behaviour should be recorded there as a new decision rather than made
silently.

## Detailed functional requirements

See `docs/03_SRS.md` for the full functional requirement list (FR-MR-xx,
FR-NS-xx, FR-AC-xx, FR-PH-xx for Group 1; high-level lists for Groups 2–3).
Each FR ID should be traceable to the code that implements it — reference
the FR ID in commit messages / PR descriptions where practical.

## Non-functional requirements (do not skip these when implementing)

- Every create/update/delete on clinical or financial data must write an
  audit log entry (see `docs/06_SECURITY_RBAC.md` §2) — this is not optional
- RBAC enforced at the API layer, not just hidden in the UI
- Nursing/Vitals entry must tolerate intermittent connectivity
- All monetary fields: fixed-point/decimal types, never floats
- Soft-delete only for clinical/financial records — never hard-delete
