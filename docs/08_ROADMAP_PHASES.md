# 08_ROADMAP_PHASES.md — Implementation Phases & Go-Live Roadmap
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Roadmap Strategy:** Linear Phase Completion, Zero-Drift Integration, Hospital-Gated Rollout  
> **Reference:** `TASKS.md` (§0 through §6)

---

## 1. Linear Build Groups Architecture

To avoid building downstream clinical features on unstable foundations, the engineering implementation followed a strict linear progression:

```
+------------------------------------------------------------------------+
|                      PHASE 0: SETUP & SCAFFOLDING                      |
|      Database Schemas, Auth JWT Engine, Append-Only Audit Logging     |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                     BUILD GROUP 1: CLINICAL FOUNDATION                 |
|  Medical Records (MPI), Nursing Services, Accounts & Billing, Pharmacy |
|   Appointment Scheduling, Accounting (General Ledger), Sub-stores      |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|               BUILD GROUP 2: OUTPATIENT & DIAGNOSTIC INTEROP           |
|      GOPD Queue & Consultation, Laboratory (LIS), Radiology (PACS)     |
|                           NHIA / HMO Claims                            |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|          BUILD GROUP 3: SPECIALIZED CLINICAL & INPATIENT CARE          |
|      Accident & Emergency (A&E), Operating Theatre, Maternity, Mortuary|
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|           BUILD GROUP 4: HOSPITAL GOVERNANCE & ADMINISTRATION          |
|       Audit Department, HR & Staff Rosters, Inventory & Procurement    |
|            Reporting & Analytics, Security & System Administration     |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|           PHASE 4: SYSTEM-WIDE INTEGRATION & MULTI-SERVICE QA          |
|          Consolidated Builds, Cross-Service Tests, Demo Packaging      |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|           PHASE 5: FIRST HOSPITAL ENGAGEMENT & PILOT VALIDATION        |
|    Interactive Stakeholder Pilot, Departmental Assumption Resolution   |
+------------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                     PHASE 6: DATA MIGRATION & CUTOVER                  |
|    Legacy Extraction, Staging Migration, Parallel Run, Go-Live Cutover |
+------------------------------------------------------------------------+
```

---

## 2. Status of Build Phases

### Phase 0: Project Setup & Scaffolding — [COMPLETED]
- Go Core and Python Interop service skeletons established.
- PostgreSQL 16 shared instance with Go-owned migrations.
- Append-only audit logging table with DB-level triggers preventing `UPDATE` and `DELETE`.
- Dual-service internal handshake (`/internal/audit-log`, `/internal/authz/check`).

### Build Group 1: Foundation Modules — [COMPLETED & VERIFIED]
- 7 core modules implemented, tested, and passing all financial regression suites.

### Build Group 2: Outpatient & Diagnostics — [COMPLETED & VERIFIED]
- 4 modules (GOPD, Laboratory, Radiology, NHIA) implemented with HL7/FHIR support.

### Build Group 3: Specialized Clinical Care — [COMPLETED & VERIFIED]
- 4 modules (Emergency, Operating Theatre, Maternity, Mortuary) implemented with WHO checklists, Aldrete recovery, and APGAR scoring.

### Build Group 4: Hospital Governance — [COMPLETED & VERIFIED]
- 5 modules (Audit, HR, Inventory, Reporting, Admin) implemented with master command center and RBAC matrix.

### Phase 4: System Integration & Internal QA — [COMPLETED & VERIFIED]
- All 12 feature branches merged into `main`.
- 1,746 frontend modules compiling cleanly with 0 errors and 0 warnings.
- 28 frontend journey tests and 54 Python test suites passing.

---

## 3. Phase 5: First Hospital Engagement & Pilot Validation

*Current Active Phase (per `TASKS.md` §5):*
1. **Interactive Demo Environment:** The system runs live in Docker Compose using synthetic data fixtures representing realistic hospital encounters.
2. **Department Head Interviews:** Conduct interviews using `docs/HOSPITAL_VALIDATION_GUIDE.md` across:
   - Medical Director (Admission deposit rules, emergency exemptions).
   - Chief Matron (Shift handovers, discharge checklist overrides).
   - Chief Accountant (Deposit minimums, tariff schedules, journal posting limits).
   - Mortuary Superintendent (Body release clearances, daily storage fees).
   - Procurement & Pharmacy (Purchase order thresholds, formulary substitutions).
   - HR Directorate (Leave approval chains, shift models).
   - ICT Directorate (Security policies, session timeouts, backup retention).
3. **Resolution of Assumptions:** Update `ASSUMPTIONS.md` to convert assumed baseline policies into confirmed hospital decisions.

---

## 4. Phase 6: Migration & Production Go-Live

1. **Legacy Data Extraction & Mapping:**
   - Export existing patient records from legacy database or Excel registers into standardized CSV templates.
   - Cleanse and map legacy patient identifiers into standard `HIMS-YYYY-XXXXX` format.
2. **Staging Dry-Run Migration:**
   - Execute ETL migration scripts against isolated staging PostgreSQL environment.
   - Validate <1% record discrepancy rate before proceeding.
3. **Parallel Run (2 to 4 Weeks):**
   - Run HIMS concurrently alongside the hospital's existing paper/legacy processes.
   - Weekly reconciliation of financial balances (cashier receipts vs. General Ledger revenue) and pharmacy stock balances.
4. **Final Cutover:**
   - Formal sign-off by Medical Director, Chief Accountant, and Head of ICT.
   - Freeze legacy systems into read-only archival state.
   - Switch primary clinic, pharmacy, and billing desks to live HIMS production endpoints.
5. **Rollback Contingency:**
   - Continuous automated database replication to secondary standby server.
   - Rehearsed rollback procedure with maximum 15-minute recovery point objective (RPO).
