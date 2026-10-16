# 02_BRD.md — Business Requirements Document
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Classification:** Business Analysis & Operational Governance  
> **Target Institutions:** Tertiary Teaching Hospitals & Specialist Medical Centers  
> **Compliance Standards:** NHIA Operational Guidelines, MDCN Code of Ethics, Financial Regulations (FR 2009)

---

## 1. Business Context & Strategic Objectives

Public and teaching hospitals in Nigeria deliver tertiary clinical care while operating high-volume emergency and outpatient services. The implementation of HIMS addresses critical systemic operational bottlenecks:

1. **Elimination of Revenue Leakage:** Replace paper receipts and fragmented cash points with integrated payment-before-service checks, automated tariff lookups, and double-entry General Ledger reconciliation.
2. **Eradication of Duplicate Patient Records:** Replace physical paper folders with a centralised Master Patient Index (MPI) and unique hospital number formatting (`HIMS-YYYY-XXXXX`).
3. **Optimisation of Pharmacy & Inventory Supply Chain:** Ensure transparent stock movement from central procurement stores down to ward sub-stores, with automated reorder triggers to eliminate stockouts.
4. **Reduction of Patient Wait Times:** Decouple walk-in outpatient queues from booked consultant appointments, and streamline bedside vitals and nursing handovers.
5. **Regulatory & Audit Transparency:** Establish a tamper-proof forensic audit trail of all clinical prescriptions, tariff adjustments, and financial transactions.

---

## 2. Departmental Stakeholder Requirements

### 2.1 Medical Records (Health Information Management)
- **BR-MR-01:** Rapid search by Patient Name, National ID, Hospital Number, or NHIA ID.
- **BR-MR-02:** Standardised registration capturing bio-data, next-of-kin, and payment category (Cash, NHIA, Retainership).
- **BR-MR-03:** Physical ID card issuance with barcode/MRN for fast barcode scanning at clinic service desks.

### 2.2 Clinical Outpatient & Inpatient Services (Doctors & Nurses)
- **BR-CL-01:** Unified clinical electronic folder presenting consultation history, lab results, radiology imaging, and medication history in one view.
- **BR-CL-02:** Strict nursing vitals capture with immediate visual alerts for critical thresholds (BP, pulse, SpO2, temp).
- **BR-CL-03:** Dual nurse shift handover sign-offs ensuring continuity of care and accountability during ward handovers.
- **BR-CL-04:** Ward bed map reflecting real-time occupancy, pending admissions, and bed availability.

### 2.3 Pharmacy & Procurement
- **BR-PH-01:** Real-time prescription delivery from clinician consulting desks to dispensary benches.
- **BR-PH-02:** Automated drug-drug interaction alerts and allergy warnings before dispensing.
- **BR-PH-03:** FIFO (First-In, First-Out) stock decrement based on batch numbers and expiry tracking.

### 2.4 Patient Accounts, Billing & General Ledger
- **BR-FN-01:** Uniform tariff schedules for cash patients and NHIA capitation/fee-for-service enrollees.
- **BR-FN-02:** Mandatory payment receipt generation for all transactions (Cash, POS, Bank Transfer).
- **BR-FN-03:** Idempotent reconciliation matching cashier receipts against General Ledger bank and asset accounts.
- **BR-FN-04:** Strict prohibition of hard record deletion (`deleted_at` only with mandatory audit rationale).

### 2.5 Health Insurance & NHIA Desk
- **BR-NH-01:** Instant enrollee eligibility verification and copay calculation (e.g. 10% patient share).
- **BR-NH-02:** Batch claim compilation and validation using ICD-10 diagnosis coding to reduce claim rejection rates.

---

## 3. Statutory & Regulatory Compliance

- **Nigeria Data Protection Act (NDPA) 2023:** Lawful processing of patient sensitive health data, strict role-based access, and encrypted credential storage.
- **Medical and Dental Council of Nigeria (MDCN):** Mandatory recording of lead clinician registration numbers and verified digital sign-offs on death certificates, surgery notes, and diagnostic reports.
- **National Health Insurance Authority (NHIA) Act 2022:** Standardised tariff structures, 10% copay ceilings on primary medication, and auditable claim logs.
