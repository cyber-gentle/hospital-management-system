# 03_SRS.md — Software Requirements Specification
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Traceability Index:** Comprehensive Functional Requirements (FR) Matrix across all 20 Modules  
> **Standards:** IEEE 830 / ISO/IEC/IEEE 29148 Standard for SRS

---

## 1. Build Group 1: Foundation Modules

### 1.1 Medical Records (Health Records & MPI)
- **FR-MR-01 (Patient Search):** Multi-criteria search across Master Patient Index (MPI) by full name, hospital number, phone number, and NHIA ID.
- **FR-MR-02 (Patient Registration):** Complete demographic registration capturing full name, date of birth, gender, marital status, religion, state/LGA of origin, residential address, emergency contact, next of kin, and payment scheme.
- **FR-MR-03 (Hospital Number Generation):** Auto-generation of unique, sequential hospital identification numbers formatted as `HIMS-YYYY-XXXXX`.
- **FR-MR-04 (Patient ID Card):** Clean, printable identification card with hospital insignia, patient MRN, barcode, photo, and emergency contact details.
- **FR-MR-05 (Patient Detail Drawer):** Slide-over electronic folder view showing demographic summary, historical visits, admissions, and financial status.
- **FR-MR-06 (Payment-Before-Service Gate):** Visual verification badge indicating registration fee settlement before clinic folder handoff.

### 1.2 Nursing Services
- **FR-NS-01 (Admission Intake & Triage):** Inpatient admission intake capturing admitting doctor, ward/bed assignment, triage acuity (stable, guarded, critical), and deposit status.
- **FR-NS-02 (Vitals Recording & Abnormal Flags):** Entry of pulse rate, systolic/diastolic blood pressure, body temperature, respiratory rate, and SpO2 with automated visual alert flags for out-of-range clinical parameters.
- **FR-NS-03 (Bed Map Visualization):** Interactive graphical bed map displaying real-time ward occupancy, reserved beds, and vacant capacity.
- **FR-NS-04 (Dual Nurse Shift Handover):** Outgoing nurse shift summary endorsement requiring incoming nurse co-signature to complete ward handover.
- **FR-NS-05 (Structured Nursing Notes):** Digital entry of nursing progress, assessment, and incident notes with immutable sign-and-lock capability.
- **FR-NS-06 (Care Plans & Schedules):** Ward nursing care plans with medication timing schedules and fluid balance charting.
- **FR-NS-07 (Medication Administration Log):** Bedside recording of administered prescriptions with dosage verification.
- **FR-NS-08 (Clinical Ward Transfer):** Inter-ward patient relocation updating bed status in source and destination wards.
- **FR-NS-09 (Discharge Planning):** Pre-discharge clinical assessment and medication reconciliation.
- **FR-NS-10 (Discharge Checklist Enforcement):** Multi-point discharge checklist requiring 100% completion before triggering discharge billing, with audited doctor override.

### 1.3 Accounts & Billing
- **FR-AC-01 (Tariff Invoicing):** Generation of itemized patient invoices linked to service tariffs, clinical procedures, and hospital fees.
- **FR-AC-02 (NHIA Co-Payment Split):** Automatic splitting of charges between institutional NHIA coverage and patient out-of-pocket shares (e.g. 10% copay).
- **FR-AC-03 (Multi-Channel Cashier Receipts):** Recording of payments via Cash, POS Terminal, Bank Transfer, or Insurance Voucher with auto-generated receipt numbers.
- **FR-AC-04 (Printable Payment Receipts):** Formal hospital payment receipt formatted for desktop and thermal POS slip printing.
- **FR-AC-05 (Aging Invoices Ledger):** Filterable invoice aging register categorising unpaid balances (0–30, 31–60, 61–90, 90+ days).
- **FR-AC-06 (Ward Charge Consolidation):** Automated consolidation of daily bed accommodation, nursing fees, and pending charges upon patient discharge.
- **FR-AC-07 (Soft Deletion & Adjustments):** Audited soft deletion of invoices (`deleted_at`) requiring mandatory authorization password and audit reason.
- **FR-AC-08 (Admission Deposit Tracking):** Real-time recording and reconciliation of inpatient admission deposits against total hospital invoices.

### 1.4 Pharmacy
- **FR-PH-01 (Prescription Intake Queue):** Real-time queue displaying e-prescriptions sent from doctor consultation desks, filtered by status (Pending, Dispensed, Flagged).
- **FR-PH-02 (Clinical Safety Engine):** Automated checks for patient drug allergies and known drug-drug contraindications before dispensing.
- **FR-PH-03 (Batch-Deducted Dispensing):** Medication dispensing decrementing stock from active batch numbers with dosage instructions.
- **FR-PH-04 (Formulary Stock Monitor):** Formulary stock viewer with reorder level thresholds, out-of-stock badges, and unit price indicators.

### 1.5 Appointment Scheduling
- **FR-AP-01 (Consultant Availability Roster):** Departmental specialist doctor schedule with interactive 30-minute time slots.
- **FR-AP-02 (Booking Calendar):** Booking interface linking patient MPI records to specialist departments and allocated dates/times.
- **FR-AP-03 (Rescheduling Workflow):** Appointment modification updating calendar capacity with mandatory audit rationale.
- **FR-AP-04 (Appointment Cancellation):** Soft cancellation preserving slot release audit trail.
- **FR-AP-05 (Walk-in Decoupling):** Explicit separation of scheduled appointment slots from walk-in GOPD clinic queues.

### 1.6 Accounting (General Ledger)
- **FR-GL-01 (Cash & Bank Transaction Register):** Real-time register recording all receipts, bank deposits, and payment vouchers.
- **FR-GL-02 (Balanced Journal Vouchers):** Double-entry journal voucher creation requiring balanced debits and credits and Chief Accountant approval.
- **FR-GL-03 (Chart of Accounts):** 4-tier account hierarchy covering Assets, Liabilities, Equity, Revenue, and Expenses.
- **FR-GL-04 (Financial Statements Generator):** Automated computation of balanced Trial Balance (Dr = Cr validation), Profit & Loss, and Balance Sheet.
- **FR-GL-05 (Billing Reconciliation Engine):** Automated cross-matching of cashier receipts against General Ledger revenue accounts with single-click posting.

### 1.7 Sub-store Management
- **FR-SS-01 (Ward Inventory Tracking):** Department and surgical ward stock register tracking medical consumables, sterile supplies, and emergency kits.
- **FR-SS-02 (Store Requisition Workflow):** Multi-step replenishment requisition from ward sub-store to Central Procurement (Draft → Submitted → Approved → Fulfilled).
- **FR-SS-03 (Buffer Reorder Alerts):** Low-stock threshold indicators triggering quick-requisition generation.
- **FR-SS-04 (Physical Stock Adjustments):** Stock count reconciliation with mandatory reason codes and immutable adjustment log trail.

---

## 2. Build Group 2: Outpatient & Diagnostic Modules

### 2.1 GOPD (General Outpatient Department)
- **FR-GO-01 (Outpatient Triage Queue):** Walk-in queue prioritizing patients by vital signs acuity (Emergency, Urgent, Routine).
- **FR-GO-02 (Doctor Consultation Desk):** Electronic doctor consultation documenting history of presenting complaint, review of systems, physical examination, and clinical impression.
- **FR-GO-03 (ICD-10 Diagnostic Coding):** Standardized diagnostic selector searching WHO ICD-10 disease codes.
- **FR-GO-04 (Investigation & E-Prescription Ordering):** Instant order dispatch to Pharmacy, Laboratory, and Radiology modules.

### 2.2 Laboratory (LIS — Python Interop)
- **FR-LA-01 (Test Catalog & Requisitions):** Master laboratory test catalog with specimen requirements and clinical turnaround times.
- **FR-LA-02 (Specimen Accessioning & Barcoding):** Sample collection logging with unique barcode identifier generation.
- **FR-LA-03 (Analyzer Result Syncing):** Bench result entry with HL7 automated analyzer interface support.
- **FR-LA-04 (Pathologist Clinical Sign-off):** Clinical verification and digital sign-off of laboratory investigation reports.

### 2.3 NHIA / HMO Claims (Python Interop)
- **FR-NH-01 (Enrollee Eligibility Check):** Live verification of NHIA insurance registration, coverage status, and primary healthcare provider.
- **FR-NH-02 (Tariff Mapping):** Automated translation of hospital tariffs into standardized NHIA fee schedules.
- **FR-NH-03 (Claims Batch Compilation):** Monthly compilation and bundling of encounter claims formatted for NHIA submission.
- **FR-NH-04 (Claims Adjudication Monitor):** Tracking submitted claims status (Submitted, Approved, Queried, Paid).

### 2.4 Radiology / PACS (Python Interop)
- **FR-RA-01 (Modality Worklist):** Scheduled order worklist for X-Ray, Ultrasound, CT, and MRI modalities.
- **FR-RA-02 (DICOM Study Ingestion):** Imaging series capture and metadata association.
- **FR-RA-03 (Radiologist Report Sign-off):** Structured radiological reporting (Findings, Impression) with consultant sign-off.
- **FR-RA-04 (Imaging Viewer):** Web-based DICOM inspection view with zoom, pan, windowing, and contrast adjustments.

---

## 3. Build Group 3: Specialized Clinical & Inpatient Modules

### 3.1 Accident & Emergency (A&E)
- **FR-AE-01 (Rapid Triage Scoring):** Immediate acuity categorization using Red (Resuscitation), Orange (Very Urgent), Yellow (Urgent), Green (Standard), and Blue (Non-urgent).
- **FR-AE-02 (Trauma Bay Allocation):** Bed board allocation across Resuscitation Bays, Acute Observation, and Fast-Track Minors.
- **FR-AE-03 (Crash Cart Medication Administration):** Rapid emergency drug logging with route, dose, and immediate administration timestamp.

### 3.2 Operating Theatre
- **FR-THE-01 (Surgical Scheduling):** Theater room booking with lead surgeon, anaesthetist, scrub nurse, and estimated duration.
- **FR-THE-02 (WHO Surgical Safety Checklist):** Three-stage safety verification (Sign In before anaesthesia, Time Out before incision, Sign Out before leaving OR).
- **FR-THE-03 (Intra-Operative Notes):** Surgical procedure documentation including findings, blood loss, and specimen tracking.
- **FR-THE-04 (PACU Recovery Scoring):** Post-Anaesthesia Care Unit monitoring using the modified Aldrete scoring system (Score ≥ 8 required for ward discharge).

### 3.3 Maternity & Obstetrics
- **FR-MAT-01 (Antenatal Booking & Profile):** Obstetric history recording gravida, para, living children, abortions, LMP, EDD, and blood group/genotype.
- **FR-MAT-02 (Routine ANC Visits):** Serial visit tracking measuring gestational age, fundal height, fetal heart rate, and maternal BP.
- **FR-MAT-03 (Labor, Delivery & APGAR Scoring):** Delivery event documentation with delivery mode, perineum status, birth weight, and 1-minute/5-minute APGAR scoring.

### 3.4 Mortuary
- **FR-MOR-01 (Deceased Intake & Tagging):** Body admission recording date of death, admitting ward/brought-in-dead status, and tag assignment.
- **FR-MOR-02 (Cold Storage Vault Allocation):** Body placement in numbered cold chamber slots with daily storage fee tracking.
- **FR-MOR-03 (Autopsy & Release Clearance):** Pathologist post-mortem documentation and multi-checkpoint body release authorization (billing settlement, coroner/police clearance, next-of-kin verification).

---

## 4. Build Group 4: Governance & Hospital Support Modules

### 4.1 Audit Department
- **FR-AUD-01 (Append-Only Log Inspector):** High-speed multi-criteria filter tool inspecting clinical, financial, and administrative audit events.
- **FR-AUD-02 (Statutory CSV Export):** RFC-4180 compliant export quoting text fields and sanitizing potential spreadsheet formula injections.
- **FR-AUD-03 (Forensic Anomaly Center):** Anomaly identification center for investigating out-of-sequence events, duplicate billing, and unusual access patterns.

### 4.2 HR & Staff Management
- **FR-HR-01 (Staff Registry):** Healthcare worker directory tracking cadre, department, licensing registration, and contact information.
- **FR-HR-02 (Duty Roster Scheduling):** Monthly departmental shift calendars across Morning, Afternoon, and Night duty shifts.
- **FR-HR-03 (Leave Request Workflow):** Leave application workflow requiring relief officer co-signature and departmental approval.

### 4.3 Inventory & Procurement
- **FR-INV-01 (Central Store Catalog):** Master hospital inventory catalog with SKU codes, unit categories, and minimum buffer levels.
- **FR-INV-02 (Purchase Orders):** Vendor PO generation with budget limit verification and approval tracking.
- **FR-INV-03 (Goods Receipt Note):** Inspection recording on delivery, logging accepted quantities and damaged returns.
- **FR-INV-04 (Sub-store Stock Dispatch):** Replenishment dispatch from central warehouse to ward sub-stores.

### 4.4 Reporting & Analytics
- **FR-REP-01 (Financial Performance KPIs):** Hospital revenue aggregation, collection percentages, payment channel distributions, and aging receivables.
- **FR-REP-02 (Clinical Census & Morbidity):** Inpatient admission census, top morbidity diagnoses, mortality statistics, and bed occupancy rates.
- **FR-REP-03 (Operational Metrics):** Average length of stay (ALOS), clinic throughput, and theater utilization metrics.

### 4.5 Security & System Administration
- **FR-SEC-01 (Facility Profile & Security Policies):** Hospital accreditation code, institutional registration, session inactivity timeout, and PRD policy gates (Admission Deposit Gate & Discharge Checklist Gate).
- **FR-SEC-02 (Granular RBAC Matrix):** 20-module x 5-action privilege matrix across all 12 institutional hospital roles.
- **FR-SEC-03 (User Provisioning & Credential Reset):** User account provisioning, instant lock/unlock toggles, and administrative temporary password reset generation.
