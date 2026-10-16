# Hospital Department Head Interview & Validation Guide
## Hospital Information Management System (HIMS) — First Institution Pilot

> **Document Status:** Official Stakeholder Engagement Questionnaire  
> **Target Audience:** Medical Director, Chief Matron, Chief Accountant, Department Heads, ICT Directorate  
> **Purpose:** Systematically resolves and confirms the open policy assumptions and `[VALIDATE WITH HOSPITAL]` items logged in `PRD.md`, `ASSUMPTIONS.md`, and `TASKS.md` (§1 & Line 447).

---

## 1. Executive Clinical Leadership (Medical Director & Head of Clinical Services)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **CL-01** | **Inpatient Admission Deposit Gate** (`FR-AC-08` / `FR-MR-06`) | Clinical folder access is gated by default, but warns non-blockingly. | **Option A:** Strict Block (clinicians cannot open folder without deposit).<br>**Option B (Current):** Soft Warning banner (`Deposit Pending`). | |
| **CL-02** | **Accident & Emergency (A&E) Exemption** | A&E ward admissions are unconditionally exempt from deposit gates. | **Option A (Current):** 100% Exempt (Care delivered immediately).<br>**Option B:** Exempt for initial 24 hours only. | |
| **CL-03** | **Doctor Emergency Override for Discharge** (`FR-NS-10`) | Discharge checklist requires 100% completion before billing trigger. | **Option A:** Strict 100% (No invoice without full checklist).<br>**Option B (Current):** Audited Doctor/Matron override with mandatory reason. | |
| **CL-04** | **Re-opened Checklist after Invoicing** | If a nurse unchecks an item on a discharged patient after billing. | **Option A (Current):** Invoice stands; adjustments handled by Billing.<br>**Option B:** Automatically void/hold invoice until re-completed. | |

---

## 2. Directorate of Nursing Services (Chief Matron & Ward Leads)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **NS-01** | **Dual-Nurse Shift Handover** (`FR-NS-04`) | Outgoing nurse writes summary; incoming nurse must co-sign to complete handover. | **Option A (Current):** Mandatory dual sign-off.<br>**Option B:** Single nurse entry with timestamp. | |
| **NS-02** | **Abnormal Vitals Clinical Escalation** (`FR-NS-02`) | Automatic red flags for systolic BP >140, SpO2 <92%, pulse >100, temp >38°C. | Confirm institutional critical thresholds for: Adult, Pediatric, Neonatal. | |
| **NS-03** | **Bed Reservation Hold Time** (`FR-NS-01`) | Bed allocation held for 2 hours during transit from GOPD/A&E. | Specify bed hold duration before auto-release to pool. | |

---

## 3. Directorate of Finance & Patient Accounts (Chief Accountant & Cashiers)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **FN-01** | **Admission Deposit Minimum Amount** (`FR-AC-08`) | Any positive amount (> ₦0.00). | **Option A:** Fixed flat deposit (e.g. ₦20,000 General / ₦50,000 Private).<br>**Option B:** Flexible amount decided by billing clerk. | |
| **FN-02** | **Invoice Soft-Deletion & Cancellation** (`FR-AC-07`) | Deletions are soft (`deleted_at`), requiring password + audit rationale. | Confirm who is authorized: Cashier, Supervisor, or Chief Accountant only. | |
| **FN-03** | **Double-Entry Journal Postings** (`FR-GL-02`) | Balanced debits and credits; requires Chief Accountant approval before posting. | Confirm approval threshold limit (e.g. all vouchers or vouchers > ₦500,000). | |
| **FN-04** | **Discharge Charge Consolidation** (`FR-AC-06`) | Ward accommodation, nursing care, and consumables consolidated at discharge. | Confirm daily bed tariff rates across: General Male/Female, Pediatric, ICU, Private Suite. | |

---

## 4. Pathology & Mortuary Directorate (Superintendent & Lead Pathologist)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **MO-01** | **Body Release Clearance Policy** (`FR-MOR-03` / Line 447) | Currently returns audited 501 until institutional release rules are confirmed. | **Required Clearances:**<br>[ ] 100% Settlement of Mortuary & Ward Invoices<br>[ ] Coroner / Police Clearance Form (for medico-legal deaths)<br>[ ] Next-of-Kin National Identity Verification<br>[ ] Pathologist Death Certificate Issued | |
| **MO-02** | **Daily Cold Storage Fee Accrual** (`FR-MOR-01`) | Accrues daily rate per 24h block. | Specify daily storage tariff (e.g. ₦3,000/day) and grace period (e.g. first 24h free). | |
| **MO-03** | **Cold Chamber Slot Provisioning** | 40 cold storage vaults/trays. | Confirm physical chamber vault numbering scheme (e.g. Vault A1 to D10). | |

---

## 5. Directorate of Pharmacy & Central Procurement (Head Pharmacist & Storekeeper)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **PH-01** | **Drug Substitution Policy** (`FR-PH-03`) | Requires pharmacist note to dispense equivalent generic when brand out-of-stock. | Confirm if doctor re-authorization is mandatory for critical antibiotics/cardiac drugs. | |
| **INV-01** | **Purchase Order Approval Limits** (`FR-INV-02` / Line 447) | Currently returns audited 501 until approval thresholds are confirmed. | **Threshold Limits:**<br>• Storekeeper Draft: up to ₦200,000<br>• Head of Procurement: up to ₦1,000,000<br>• Medical Director: above ₦1,000,000 | |
| **INV-02** | **Damaged / Expired Goods Receipt Rejection** (`FR-INV-03`) | Partial receipt accepted; damaged items recorded on GRN with return voucher. | Confirm inspection window (e.g. within 48h of delivery). | |

---

## 6. Directorate of Administration & Human Resources (Director of Admin & HR)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **HR-01** | **Leave Request Approval Hierarchy** (`FR-HR-03` / Line 447) | Currently returns audited 501 until approval hierarchy is confirmed. | **Approval Chain:**<br>1. Relief Officer Co-sign (confirms handover coverage)<br>2. Unit Supervisor / Head of Department Recommendation<br>3. Director of Admin final approval | |
| **HR-02** | **Shift Roster Rotation Patterns** (`FR-HR-02`) | Standard 3-shift model: Morning (08:00–16:00), Afternoon (14:00–20:00), Night (20:00–08:00). | Confirm shift crossover allowances and max consecutive night duties allowed. | |

---

## 7. Health Insurance & NHIA Desk (NHIA Desk Officer)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **NH-01** | **NHIA Co-Payment Split** (`FR-AC-02`) | 90% NHIA share / 10% Patient out-of-pocket for primary care drugs. | Confirm primary care, secondary care, and excluded tertiary services copay percentages. | |
| **NH-02** | **Claims Submission Batching Cycle** (`FR-NH-03`) | Bundled monthly by HMO provider with diagnosis ICD-10 coding. | Confirm cutoff date for monthly claims submission (e.g. 5th of every calendar month). | |

---

## 8. ICT & Systems Directorate (Head of ICT & Security Officer)

| # | Question / Requirement Item | Current System Baseline | Options for Decision | Hospital Sign-off & Notes |
|---|---|---|---|---|
| **IT-01** | **Session Inactivity Timeout** (`FR-SEC-01`) | Configured default: 30 minutes. | Select: 15 mins (high security) vs 30 mins (clinical convenience). | |
| **IT-02** | **Two-Factor Authentication (2FA)** (`FR-SEC-01`) | Mandatory for `ADMIN`, `CHIEF_ACCOUNTANT`, and `ACCOUNTANT`. | Confirm if Medical Doctors and Pharmacists should also be enrolled in mandatory 2FA. | |
| **IT-03** | **Immutable Audit Log Storage** (`AGENTS.md`) | PostgreSQL append-only triggers prevent UPDATE/DELETE. | Confirm long-term cold archive schedule (e.g. annual backup to write-once WORM storage). | |
