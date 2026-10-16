# 06_SECURITY_RBAC.md — Security & Granular RBAC Specification
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Security Model:** Principle of Least Privilege (PoLP)  
> **Authority:** Go Core Service (`internal/auth`, `internal/authz`)  
> **Standard:** OWASP Healthcare Security Guidelines / NDPA 2023

---

## 1. Institutional Roles Catalog

The system defines 12 standard healthcare roles:

| Role Identifier | Role Label | Department Domain | Core Responsibilities |
|---|---|---|---|
| `ADMIN` | System Administrator | ICT Directorate | User provisioning, facility parameters, security policies, backup administration. |
| `DOCTOR` | Medical Doctor / Consultant | Clinical Services | Consultations, outpatient triage, surgical notes, diagnostic requisitions, prescriptions. |
| `NURSE` | Staff Nurse / Matron | Nursing Directorate | Inpatient admissions, bedside vitals, shift handovers, nursing notes, discharge checklists. |
| `PHARMACIST` | Pharmacist | Pharmacy Services | Prescription review, interaction checks, dispensing, formulary stock management. |
| `ACCOUNTANT` | Billing Officer / Cashier | Finance & Accounts | Invoice generation, cashier receipts, tariff management, copay calculation. |
| `CHIEF_ACCOUNTANT` | Chief Accountant | Finance & Accounts | Double-entry journal approvals, financial statement generation, revenue reconciliation. |
| `NHIA_OFFICER` | NHIA / HMO Desk Officer | Health Insurance | Enrollee eligibility verification, claim compiling, tariff code mapping. |
| `AUDITOR` | Internal Auditor | Internal Audit | Read-only inspection of immutable audit logs, exception reviews, anomaly investigation. |
| `LAB_SCIENTIST` | Medical Lab Scientist | Laboratory (LIS) | Specimen accessioning, bench testing, analyzer syncing, test report sign-offs. |
| `RADIOLOGIST` | Consultant Radiologist | Radiology / PACS | Modality worklist review, DICOM imaging evaluation, diagnostic report sign-offs. |
| `STOREKEEPER` | Storekeeper / Procurement | Materials Management | Central inventory catalog, PO generation, goods receipts, sub-store fulfillment. |
| `RECORDS_OFFICER` | Health Records Officer | Health Information | Master Patient Index search, patient demographic registration, ID card issuance. |

---

## 2. Permission Action Levels

Every permission consists of `<module>:<action>`. Actions are categorized into five tiers:

1. **`READ`:** View-only access to records, lists, schedules, and clinical notes.
2. **`WRITE`:** Create, draft, and modify records (e.g. register patient, write consultation note, enter vitals).
3. **`APPROVE`:** Authorize financial postings, approve purchase orders, endorse shift handovers, or sign off clinical reports.
4. **`DELETE_SOFT`:** Flag an entity as inactive or cancelled with `deleted_at`, requiring mandatory password verification and audit rationale.
5. **`ADMIN_OVERRIDE`:** Emergency administrative bypass requiring explicit justification; permanently flagged in high-priority audit alerts.

---

## 3. 20-Module Granular Permission Matrix

| Module | `READ` Roles | `WRITE` Roles | `APPROVE` Roles | `DELETE_SOFT` Roles |
|---|---|---|---|---|
| **Medical Records** | All authenticated | RECORDS_OFFICER, ADMIN | RECORDS_OFFICER | ADMIN |
| **Nursing Services** | DOCTOR, NURSE, ADMIN | NURSE, ADMIN | NURSE (Matron) | ADMIN |
| **Accounts & Billing** | ACCOUNTANT, CHIEF_ACC, ADMIN | ACCOUNTANT, ADMIN | CHIEF_ACCOUNTANT | CHIEF_ACCOUNTANT |
| **Pharmacy** | DOCTOR, PHARMACIST, ADMIN | PHARMACIST, ADMIN | PHARMACIST | ADMIN |
| **GOPD** | DOCTOR, NURSE, ADMIN | DOCTOR, ADMIN | DOCTOR | ADMIN |
| **Operating Theatre** | DOCTOR, NURSE, ADMIN | DOCTOR, NURSE, ADMIN | DOCTOR (Lead Surgeon) | ADMIN |
| **Maternity** | DOCTOR, NURSE, ADMIN | DOCTOR, NURSE, ADMIN | DOCTOR, NURSE | ADMIN |
| **Emergency** | DOCTOR, NURSE, ADMIN | DOCTOR, NURSE, ADMIN | DOCTOR | ADMIN |
| **Mortuary** | DOCTOR, RECORDS, ADMIN | RECORDS_OFFICER, ADMIN | DOCTOR (Pathologist) | ADMIN |
| **Audit Department** | AUDITOR, ADMIN | None (Append-Only) | AUDITOR | None (Immutable) |
| **HR & Staff** | All (Own Profile), ADMIN | HR_OFFICER, ADMIN | HR_OFFICER, ADMIN | ADMIN |
| **Inventory** | STOREKEEPER, PHARMACIST, ADMIN | STOREKEEPER, ADMIN | STOREKEEPER (Head) | ADMIN |
| **Reporting** | AUDITOR, CHIEF_ACC, ADMIN | None (Aggregated) | ADMIN | None |
| **System Admin** | ADMIN | ADMIN | ADMIN | ADMIN |
| **Appointments** | All clinical, RECORDS, ADMIN | RECORDS_OFFICER, ADMIN | DOCTOR | ADMIN |
| **General Ledger** | ACCOUNTANT, CHIEF_ACC, ADMIN | ACCOUNTANT, ADMIN | CHIEF_ACCOUNTANT | CHIEF_ACCOUNTANT |
| **Sub-store** | NURSE, PHARMACIST, ADMIN | NURSE, PHARMACIST | STOREKEEPER | ADMIN |
| **Laboratory** | DOCTOR, LAB_SCIENTIST, ADMIN | LAB_SCIENTIST, ADMIN | LAB_SCIENTIST (Path) | ADMIN |
| **NHIA / HMO** | ACCOUNTANT, NHIA_OFFICER, ADMIN | NHIA_OFFICER, ADMIN | NHIA_OFFICER | ADMIN |
| **Radiology** | DOCTOR, RADIOLOGIST, ADMIN | RADIOLOGIST, ADMIN | RADIOLOGIST (Consult) | ADMIN |

---

## 4. Authentication & JWT Token Standard

1. **Token Issuer:** Go Core service exclusively (`services/core-go/internal/auth`).
2. **Signature Algorithm:** HMAC-SHA256 (`HS256`) with minimum 256-bit random secret.
3. **Token Claims:**
   - `sub`: User ID (`UUID`)
   - `username`: User login handle
   - `role`: Role identifier from catalog
   - `department`: Allocated clinical/administrative department
   - `exp`: Expiration timestamp (Default: 8 hours)
   - `aud`: Audience identifier (`hospital-hims-internal`)
   - `iss`: Issuer identifier (`hospital-hims-core`)

---

## 5. Account Security Policies

- **Lockout on Brute-Force:** Account automatically enters `LOCKED` status after 5 consecutive failed login attempts. Can only be unlocked by an administrative reset.
- **Session Inactivity Timeout:** Configurable default of 30 minutes of idle browser time before session invalidation.
- **Two-Factor Authentication (2FA):** Mandatory TOTP authentication for `ADMIN` and `CHIEF_ACCOUNTANT` roles.
