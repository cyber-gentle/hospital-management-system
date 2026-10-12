# 01_PRD.md — Product Requirements Document
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Classification:** Engineering & Clinical Operations Specification  
> **Target Deployment:** Single-Tenant Federal / State Tertiary Teaching Hospital  
> **Architecture Reference:** `ARCHITECTURE.md` (Polyglot Go Core + Python Interop)

---

## 1. Executive Summary & Vision

The **Hospital Information Management System (HIMS)** is an enterprise clinical and financial management platform purpose-built for tertiary teaching hospitals, federal medical centres, and state specialist institutions in Nigeria.

Historically, public and teaching hospitals have suffered from fragmented paper records, duplicate patient folders, uncontrolled revenue leakage at cash collection points, medication stockouts due to disconnected ward stores, and prolonged patient waiting times. HIMS provides a unified, single-tenant digital platform integrating **all 20 hospital clinical, operational, diagnostic, and financial modules** under strict audit logging and role-based access control.

---

## 2. Institutional Model: Single-Tenant Deployment

- **Single-Tenant per Facility:** Each hospital operates its own isolated database instance, application services, and configuration.
- **No Multi-Tenancy:** Data is strictly isolated. There are no shared tenant IDs, cross-hospital queries, or hospital-switching mechanisms (`AGENTS.md` Rule #6a).
- **On-Premise Hybrid Architecture:** Designed for hospital local area network (LAN) speed, with resilience against internet downtime, accompanied by scheduled encrypted off-site backups.

---

## 3. Scope of 20 System Modules

The platform encompasses 20 verified hospital modules, divided between two interoperating backend services:

### Go Core Service (17 Modules — Owns Auth, Audit & Central DB)
1. **Medical Records:** Master Patient Index (MPI), demographic capture, hospital number generation (`HIMS-YYYY-XXXXX`), patient ID card printing, and payment-before-service gating.
2. **Nursing Services:** Inpatient ward bed map, admission intake, vitals tracking with critical flags, shift handovers with dual nurse sign-off, and discharge checklist gating.
3. **Accounts & Billing:** Itemized tariff invoices, copay splits, multi-channel payment recording (Cash, POS, Bank Transfer, NHIA), discharge consolidation, and audited soft deletion.
4. **Pharmacy:** Prescription intake queue, drug-allergy and drug-drug safety alerts, batch-deducted dispensing, and formulary reorder thresholds.
5. **GOPD (General Outpatient Department):** Outpatient triage scoring, walk-in queue management, doctor consultation notes, ICD-10 diagnosis coding, and e-prescriptions.
6. **Operating Theatre:** Surgical scheduling, WHO surgical safety pre-op checklists, intra-op documentation, and PACU Aldrete recovery scoring.
7. **Maternity & Obstetrics:** Antenatal care (ANC) bookings, routine visit logs, labor and delivery documentation with APGAR scoring, and postnatal care.
8. **Accident & Emergency (A&E):** Rapid triage acuity (Red/Orange/Yellow/Green), trauma bay allocation, crash cart medication logs, and emergency ward/OR transfer.
9. **Mortuary:** Deceased intake with tag generation, cold chamber vault allocation, autopsy documentation, and multi-sign-off body release clearance.
10. **Audit Department:** Immutable append-only audit log inspector, forensic exception review, anomaly detection, and statutory CSV exports.
11. **HR & Staff Management:** Staff credentials directory, departmental shift duty rosters, leave requests with relief officer coverage, and attendance metrics.
12. **Reporting & Analytics:** Hospital-wide census, morbidity patterns, financial revenue/collection KPIs, bed occupancy rates, and average length of stay.
13. **Inventory & Procurement:** Central warehouse master catalog, purchase orders (POs), goods receipt inspection (GRN), and ward buffer stock issuance.
14. **Security & System Administration:** Global institutional profile, session timeouts, password expiry policies, granular RBAC matrices, and user provisioning.
15. **Appointment Scheduling:** Specialist consultant availability rosters, 30-minute booking calendar slots, and reminder preferences. Decoupled from GOPD walk-ins.
16: **Accounting (General Ledger):** Double-entry bookkeeping, cash/bank journals, Chief Accountant approval gates, 4-tier Chart of Accounts, Trial Balance, P&L, and Balance Sheet.
17: **Sub-store Management:** Ward and department inventory buffers, central store replenishment requisitions, and audited stock adjustments.

### Python Interop Service (3 Modules — HL7/FHIR Diagnostic Interop)
18. **Laboratory (LIS):** Test catalog, specimen accessioning, bench worklists, HL7 analyzer result syncing, and pathologist clinical verification.
19. **NHIA / HMO:** Enrollee eligibility verification, standardized tariffs, and batch claims bundling.
20. **Radiology / PACS:** Imaging modality worklist (DICOM), study tracking, radiologist diagnostic sign-off, and DICOM metadata viewer.

---

## 4. Key Architectural Integration Decisions

1. **Discharge Checklist → Billing Trigger (`ASSUMPTIONS.md`):**
   - Configured as **100% completion of the Nursing Discharge Checklist** before the discharge billing invoice generates.
   - Decoupled from nurse sign-off to prevent discharge bottlenecking while retaining audited doctor/matron emergency override capability.
2. **Inpatient Admission Deposit Gate (`ASSUMPTIONS.md`):**
   - Implemented as an **API-enforced backend flag** gating clinician folder access for active admissions.
   - **Accident & Emergency (A&E) admissions are unconditionally exempt** to protect immediate patient life.
3. **Audit Log Primacy (`AGENTS.md`):**
   - Append-only PostgreSQL logging with database triggers preventing `UPDATE` and `DELETE`.
   - Every mutating endpoint must record actor, action category, timestamp, IP address, and payload.

---

## 5. Non-Functional Requirements

- **Availability & Offline Resilience:** Clinic and ward vitals entry degrade gracefully into resilient local storage during local network disruptions, syncing upon reconnection.
- **Performance:** Sub-second search across the Master Patient Index (>100,000 patient records).
- **Security & Privacy:** Enforce Nigeria Data Protection Act (NDPA) compliance; password hashing with bcrypt, JWT authorization with audience and expiration verification.
- **Auditability:** Complete forensic reconstruction capability for any financial invoice, bill adjustment, or prescription dispensing event.
