# Frontend-to-Backend API Contract Specifications
## Hospital Information Management System (HIMS)

> **Document Status:** Authoritative API Handshake Specification  
> **Target Audience:** Go Core Backend Engineers, Python Interop Backend Engineers  
> **Author:** Front-End Architecture Team  
> **Scope:** Defines the exact request/response JSON schemas, routes, and error contracts expected by the 7 preview frontend modules (`Theatre`, `Emergency`, `Maternity`, `Admin`, `Reporting`, `NHIA`, `Radiology`) to transition them from demo preview mode to live database-backed operations (per `docs/project/TASKS.md` Line 446).

---

## 1. Architectural Foundations & Global Contract Standards

### 1.1 Backend Service Ownership Split (per `docs/architecture/ARCHITECTURE.md`)
- **Go Core Service (`http://localhost:8080`):** Owns `theatre`, `emergency`, `maternity`, `admin`, and `reporting`, in addition to Auth (`/api/v1/auth/login`) and Audit (`/internal/audit-log`).
- **Python Interop Service (`http://localhost:8000`):** Owns `nhia` and `radiology` (along with `laboratory`). All mutating operations must call Go Core's internal audit log and authorization check before committing.

### 1.2 Global Request & Response Conventions
1. **Authentication:** All requests carry the standard header:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```
2. **Monetary Values:** All monetary amounts MUST be transmitted as exact decimal strings or formatted numbers with 2 decimal places (e.g. `"15000.00"`). Never transmit binary floating-point numbers.
3. **Timestamps:** All dates and timestamps are stored and computed in UTC ISO 8601 format (e.g. `"2026-10-12T09:30:00Z"`).
4. **Soft Deletions:** Deletion endpoints MUST use `deleted_at` timestamps rather than hard database row deletion (`AGENTS.md` Rule #3).
5. **Standard Error Envelope:**
   ```json
   {
     "error": {
       "code": "VALIDATION_FAILED | UNAUTHORIZED | NOT_FOUND | POLICY_NOT_CONFIGURED",
       "message": "Human-readable description of the error",
       "details": {}
     }
   }
   ```

---

## 2. Go Core Service Modules (:8080)

---

### Module 1: Operating Theatre (`theatre`)

#### 1. `GET /api/v1/theatre/surgeries`
- **Query Params:** `date` (YYYY-MM-DD), `room` (string), `status` (SCHEDULED | IN_THEATRE | PACU | COMPLETED)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "SURG-2026-001",
      "patientId": "PAT-9821",
      "hospitalNumber": "HIMS-2026-00104",
      "patientName": "Fatima Bello",
      "patientAge": 38,
      "patientGender": "FEMALE",
      "scheduledDate": "2026-10-14",
      "startTime": "08:30",
      "estimatedDurationMinutes": 120,
      "theatreRoom": "OR 1 - General Surgery",
      "procedureName": "Open Cholecystectomy",
      "leadSurgeon": "Prof. T. Alabi",
      "anaesthetist": "Dr. O. Okafor",
      "scrubNurse": "Nurse H. Musa",
      "priority": "ELECTIVE",
      "status": "SCHEDULED"
    }
  ]
  ```

#### 2. `POST /api/v1/theatre/surgeries`
- **Request Payload:**
  ```json
  {
    "patientId": "PAT-9821",
    "hospitalNumber": "HIMS-2026-00104",
    "patientName": "Fatima Bello",
    "patientAge": 38,
    "patientGender": "FEMALE",
    "scheduledDate": "2026-10-14",
    "startTime": "08:30",
    "estimatedDurationMinutes": 120,
    "theatreRoom": "OR 1 - General Surgery",
    "procedureName": "Open Cholecystectomy",
    "leadSurgeon": "Prof. T. Alabi",
    "anaesthetist": "Dr. O. Okafor",
    "scrubNurse": "Nurse H. Musa",
    "priority": "ELECTIVE"
  }
  ```
- **Response (201 Created):** Created surgery record object.

#### 3. `PATCH /api/v1/theatre/surgeries/:id/pre-op-checklist`
- **Request Payload (WHO Surgical Safety Checklist):**
  ```json
  {
    "patientIdentified": true,
    "siteMarked": true,
    "consentConfirmed": true,
    "anaesthesiaSafetyCheckComplete": true,
    "pulseOximeterFunctioning": true,
    "allergiesReviewed": true,
    "airwayDifficultyAssessed": true,
    "aspirationRiskAssessed": true,
    "bloodLossRiskAssessed": true,
    "adequateIvAccessVerified": true,
    "completedBy": "Nurse H. Musa"
  }
  ```

#### 4. `POST /api/v1/theatre/surgeries/:id/intra-op-notes`
- **Request Payload:**
  ```json
  {
    "timeOutConfirmed": true,
    "incisionTime": "08:45",
    "closureTime": "10:15",
    "leadSurgeon": "Prof. T. Alabi",
    "assistantSurgeon": "Dr. K. Danladi",
    "anaesthetist": "Dr. O. Okafor",
    "scrubNurse": "Nurse H. Musa",
    "circulatingNurse": "Nurse C. Eze",
    "procedurePerformed": "Open Cholecystectomy with subhepatic drainage",
    "surgicalFindings": "Calculous cholecystitis with dense adhesions.",
    "estimatedBloodLossMl": 150,
    "specimensCollected": true,
    "specimenLabels": ["Gallbladder in formalin"],
    "spongeNeedleCountVerified": true,
    "recordedBy": "Nurse H. Musa"
  }
  ```

#### 5. `POST /api/v1/theatre/surgeries/:id/pacu`
- **Request Payload (Aldrete Recovery Scoring):**
  ```json
  {
    "activity": 2,
    "respiration": 2,
    "circulation": 2,
    "consciousness": 2,
    "oxygenSaturation": 2,
    "totalScore": 10,
    "analgesiaAdministered": "IV Paracetamol 1g + Tramadol 50mg",
    "vitalsBp": "122/78",
    "vitalsPulse": 74,
    "vitalsSpo2": 99,
    "dischargeDestination": "Female Surgical Ward (Bed 4)",
    "dischargedBy": "Dr. O. Okafor"
  }
  ```

---

### Module 2: Accident & Emergency (`emergency`)

#### 1. `GET /api/v1/emergency/patients`
- **Query Params:** `status` (TRIAGED | IN_RESUS | OBSERVATION), `triageCategory` (RED | ORANGE | YELLOW | GREEN)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "EMG-2026-081",
      "hospitalNumber": "HIMS-2026-00412",
      "patientName": "Ibrahim Garba",
      "age": 29,
      "gender": "MALE",
      "arrivalMode": "AMBULANCE",
      "arrivalTime": "2026-10-12T08:15:00Z",
      "triageCategory": "RED",
      "allocatedBay": "Resus Bay 1",
      "status": "IN_RESUS",
      "chiefComplaint": "Severe multi-trauma following road traffic collision"
    }
  ]
  ```

#### 2. `POST /api/v1/emergency/triage`
- **Request Payload:**
  ```json
  {
    "hospitalNumber": "HIMS-2026-00412",
    "patientName": "Ibrahim Garba",
    "age": 29,
    "gender": "MALE",
    "arrivalMode": "AMBULANCE",
    "chiefComplaint": "Severe multi-trauma",
    "triageCategory": "RED",
    "allocatedBay": "Resus Bay 1",
    "vitals": {
      "heartRate": 128,
      "systolicBp": 85,
      "diastolicBp": 50,
      "respiratoryRate": 28,
      "spo2": 91,
      "temperature": 35.8,
      "gcs": 11,
      "bloodGlucose": 6.2,
      "painScore": 9
    },
    "primarySurvey": {
      "airway": "PATENT",
      "cSpinePrecautions": true,
      "breathing": "TACHYPNEIC",
      "circulation": "WEAK_THREADY",
      "capillaryRefillSeconds": 4,
      "ivAccessSites": ["16G Left Antecubital", "16G Right Forearm"],
      "disabilityPupils": "EQUAL_REACTIVE",
      "disabilityMotorResponse": "Withdraws to pain",
      "exposureFindings": "Blunt abdominal trauma, deformed right femur",
      "activeHemorrhageControlled": true
    },
    "triagedBy": "Nurse D. John (Senior Triage Nurse)"
  }
  ```

#### 3. `POST /api/v1/emergency/patients/:id/medications`
- **Request Payload (Crash Cart Administration):**
  ```json
  {
    "drugName": "Normal Saline 0.9%",
    "dose": "1000 mL Rapid Infusion",
    "route": "IV_INFUSION",
    "indication": "Hypovolemic hemorrhagic shock resuscitation",
    "administeredBy": "Nurse D. John"
  }
  ```

#### 4. `POST /api/v1/emergency/patients/:id/disposition`
- **Request Payload:**
  ```json
  {
    "disposition": "TRANSFERRED_OR",
    "destinationWardOrRoom": "OR 3 - Emergency / Trauma",
    "handoverSummary": "Patient stabilized; persistent intra-abdominal bleeding confirmed on FAST ultrasound. Transferred directly to surgery.",
    "authorizedDoctor": "Dr. E. Nnamdi"
  }
  ```

---

### Module 3: Maternity & Obstetrics (`maternity`)

#### 1. `GET /api/v1/maternity/anc-profiles`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "ANC-2026-034",
      "patientId": "PAT-7721",
      "hospitalNumber": "HIMS-2026-00089",
      "patientName": "Zainab Abubakar",
      "age": 27,
      "phone": "+234 803 123 4567",
      "gravida": 2,
      "para": 1,
      "living": 1,
      "abortions": 0,
      "lmpDate": "2026-02-10",
      "eddDate": "2026-11-17",
      "currentGestationalAgeWeeks": 35,
      "bloodGroup": "O+",
      "genotype": "AA",
      "riskLevel": "LOW_RISK",
      "status": "ANC_ACTIVE"
    }
  ]
  ```

#### 2. `POST /api/v1/maternity/anc-profiles`
- **Request Payload:**
  ```json
  {
    "patientId": "PAT-7721",
    "hospitalNumber": "HIMS-2026-00089",
    "patientName": "Zainab Abubakar",
    "age": 27,
    "phone": "+234 803 123 4567",
    "gravida": 2,
    "para": 1,
    "living": 1,
    "abortions": 0,
    "lmpDate": "2026-02-10",
    "eddDate": "2026-11-17",
    "bloodGroup": "O+",
    "genotype": "AA",
    "hivStatus": "NEGATIVE",
    "hepatitisBStatus": "NEGATIVE",
    "vdrlRprStatus": "NON_REACTIVE",
    "tetanusToxoidDoses": 2,
    "iptpMalariaDoses": 2,
    "riskLevel": "LOW_RISK",
    "riskFactors": []
  }
  ```

#### 3. `POST /api/v1/maternity/anc-profiles/:id/visits`
- **Request Payload (Routine Antenatal Visit):**
  ```json
  {
    "gestationalAgeWeeks": 35,
    "fundalHeightCm": 34,
    "fetalHeartRateBpm": 142,
    "fetalPresentation": "CEPHALIC",
    "maternalBloodPressure": "116/74",
    "maternalWeightKg": 68.5,
    "urineProtein": "NIL",
    "urineGlucose": "NIL",
    "hemoglobinGdl": 11.8,
    "complaintsAndNotes": "Routine 35-week evaluation. Normal fetal movement.",
    "clinicianName": "Dr. R. Danjuma",
    "nextAppointmentDate": "2026-10-26"
  }
  ```

#### 4. `POST /api/v1/maternity/deliveries`
- **Request Payload (Labor & Delivery with APGAR):**
  ```json
  {
    "ancProfileId": "ANC-2026-034",
    "patientName": "Zainab Abubakar",
    "deliveryDateTime": "2026-10-12T06:45:00Z",
    "deliveryMode": "SPONTANEOUS_VAGINAL",
    "perineumStatus": "INTACT",
    "bloodLossMl": 200,
    "babyGender": "MALE",
    "birthWeightKg": 3.45,
    "apgar1Min": {
      "appearanceColor": 2,
      "pulseHeartRate": 2,
      "grimaceReflex": 2,
      "activityTone": 2,
      "respirationEffort": 2,
      "totalScore": 10
    },
    "apgar5Min": {
      "appearanceColor": 2,
      "pulseHeartRate": 2,
      "grimaceReflex": 2,
      "activityTone": 2,
      "respirationEffort": 2,
      "totalScore": 10
    },
    "vitKAdministered": true,
    "bcgAdministered": true,
    "opv0Administered": true,
    "attendingMidwife": "Nurse B. Okon"
  }
  ```

---

### Module 4: Security & System Administration (`admin`)

#### 1. `GET /api/v1/admin/config`
- **Response (200 OK):**
  ```json
  {
    "facility": {
      "hospitalName": "National Specialist Teaching Hospital, Abuja",
      "facilityLevel": "Tertiary Teaching Hospital",
      "accreditationCode": "MDCN-FCT-2026-981",
      "registrationNumber": "RC-884192 / MoH-FCT-041",
      "physicalAddress": "Plot 1044 Medical District Way, CBD, Abuja",
      "state": "Federal Capital Territory",
      "country": "Nigeria",
      "officialPhone": "+234 9 291 4000",
      "emergencyHotline": "+234 800 911 0000",
      "officialEmail": "info@nsthabuja.gov.ng",
      "defaultCurrency": "NGN (₦)",
      "fiscalYear": "2026"
    },
    "security": {
      "sessionTimeoutMinutes": 30,
      "maxFailedLoginAttempts": 5,
      "passwordExpiryDays": 90,
      "enforceTwoFactorForFinancialRoles": true,
      "allowEmergencyOverrideLogging": true,
      "maintenanceMode": false,
      "inpatientDepositGate": "SOFT_WARNING",
      "dischargeChecklistEnforcement": "STRICT_100_PERCENT"
    },
    "lastUpdatedBy": "Engr. A. Yusuf (System Administrator)",
    "lastUpdatedAt": "2026-10-12T08:00:00Z"
  }
  ```

#### 2. `PATCH /api/v1/admin/config`
- Accepts partial updates to `facility` or `security` objects.

#### 3. `GET /api/v1/admin/roles`
- **Response (200 OK):** Array of all 12 institutional roles with assigned permission strings:
  ```json
  [
    {
      "role": "DOCTOR",
      "roleLabel": "Consultant / Medical Doctor",
      "description": "Clinical consultation, prescription ordering, patient admission, and notes.",
      "permissions": ["medicalrecords:read", "nursing:read", "pharmacy:read", "laboratory:read"],
      "userCount": 14
    }
  ]
  ```

#### 4. `PATCH /api/v1/admin/roles/:role`
- **Request Payload:**
  ```json
  {
    "permissions": ["medicalrecords:read", "medicalrecords:write", "nursing:read"]
  }
  ```

#### 5. `GET /api/v1/admin/users`
- **Query Params:** `role`, `department`, `search`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "USR-2026-001",
      "username": "ayusuf",
      "email": "a.yusuf@nsthabuja.gov.ng",
      "firstName": "Ahmed",
      "lastName": "Yusuf",
      "phoneNumber": "+234 802 111 2233",
      "role": "ADMIN",
      "department": "ICT & Systems Directorate",
      "status": "ACTIVE",
      "failedLoginAttempts": 0,
      "twoFactorEnabled": true,
      "lastLoginAt": "2026-10-12T07:45:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
  ```

#### 6. `POST /api/v1/admin/users/:id/lock`
- **Request Payload:**
  ```json
  {
    "status": "LOCKED"
  }
  ```

#### 7. `POST /api/v1/admin/users/:id/reset-password`
- **Response (200 OK):**
  ```json
  {
    "temporaryPassword": "NSTH-718293#"
  }
  ```

---

### Module 5: Reporting & Analytics (`reporting`)

#### 1. `GET /api/v1/reporting/financial?period=THIS_MONTH`
- **Response (200 OK):**
  ```json
  {
    "period": "THIS_MONTH",
    "totalRevenue": 48250000.00,
    "formattedTotalRevenue": "₦48,250,000.00",
    "totalCollected": 42700000.00,
    "formattedTotalCollected": "₦42,700,000.00",
    "totalOutstanding": 5550000.00,
    "formattedTotalOutstanding": "₦5,550,000.00",
    "collectionRate": 88.5,
    "departmentRevenue": [
      {
        "department": "Pharmacy Services",
        "revenue": 14500000.00,
        "percentage": 30.1,
        "transactionCount": 1420
      }
    ],
    "paymentChannels": [
      { "channel": "POS", "label": "POS Terminal", "amount": 25620000.00, "percentage": 60.0 }
    ],
    "agingReceivables": [
      { "bucket": "0-30 Days", "amount": 3200000.00, "invoiceCount": 42, "riskLevel": "LOW" }
    ]
  }
  ```

#### 2. `GET /api/v1/reporting/clinical?period=THIS_MONTH`
- Returns morbidity top diagnoses (Malaria, Hypertension, Diabetes, Pneumonia, Gastroenteritis), maternal mortality ratio, neonatal mortality rate, and bed turnover interval.

---

## 3. Python Interop Service Modules (:8000)

---

### Module 6: NHIA / HMO Claims (`nhia`)

#### 1. `POST /api/v1/nhia/eligibility`
- **Request Payload:**
  ```json
  {
    "nhiaNumber": "NHIA/FCT/2026/88412",
    "hmoProviderId": "HMO-01-HYGEIA"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "nhiaNumber": "NHIA/FCT/2026/88412",
    "patientName": "Amina Mohammed",
    "hmoProviderId": "HMO-01-HYGEIA",
    "hmoProviderName": "Hygeia HMO",
    "planType": "Federal Civil Service Scheme (Formal Sector)",
    "status": "ACTIVE",
    "expiryDate": "2027-12-31"
  }
  ```

#### 2. `POST /api/v1/nhia/claims/submit`
- **Request Payload:**
  ```json
  {
    "patientId": "PAT-3301",
    "patientName": "Amina Mohammed",
    "nhiaNumber": "NHIA/FCT/2026/88412",
    "providerId": "HMO-01-HYGEIA",
    "diagnosisIcd10": "B50.9 (Plasmodium falciparum malaria, unspecified)",
    "totalAmount": 18500.00,
    "coPayAmount": 1850.00,
    "claimAmount": 16650.00,
    "invoiceId": "INV-2026-0044"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "CLM-2026-091",
    "status": "SUBMITTED",
    "submittedAt": "2026-10-12T10:00:00Z"
  }
  ```

---

### Module 7: Radiology / PACS (`radiology`)

#### 1. `GET /api/v1/radiology/orders`
- **Query Params:** `status` (Pending | In Progress | Completed), `modality` (X-Ray | CT | MRI | Ultrasound)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "RAD-2026-104",
      "patientName": "John Doe",
      "patientId": "HIMS-2026-00012",
      "modality": "X-Ray",
      "scanType": "Chest PA View",
      "urgency": "Routine",
      "status": "Pending",
      "requestedBy": "Dr. A. Smith",
      "requestTime": "2026-10-12T09:15:00Z"
    }
  ]
  ```

#### 2. `POST /api/v1/radiology/orders/:id/report`
- **Request Payload (Radiologist Clinical Sign-off):**
  ```json
  {
    "findings": "Bilateral lung fields appear clear with normal vascular markings. Cardiothoracic ratio is within normal limits (<0.5). Both costophrenic angles are sharp.",
    "impression": "Normal chest radiograph. No evidence of acute cardiopulmonary disease.",
    "radiologistName": "Dr. K. Balogun (Consultant Radiologist)",
    "verifiedAt": "2026-10-12T10:30:00Z"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "RAD-2026-104",
    "status": "Completed",
    "reportSigned": true
  }
  ```

---

## 4. Summary Checklist for Backend Engineers

| Module | Service | Database Tables Needed | Mutating Audit Log Action |
|---|---|---|---|
| **Theatre** | Go Core (`:8080`) | `surgeries`, `theatre_notes`, `theatre_pacu` | `theatre:schedule`, `theatre:intra_op_notes`, `theatre:pacu_signoff` |
| **Emergency** | Go Core (`:8080`) | `emergency_admissions`, `emergency_medications`, `emergency_vitals` | `emergency:triage`, `emergency:crash_meds`, `emergency:disposition` |
| **Maternity** | Go Core (`:8080`) | `anc_profiles`, `anc_visits`, `maternity_deliveries` | `maternity:anc_create`, `maternity:visit_record`, `maternity:delivery_signoff` |
| **Admin** | Go Core (`:8080`) | `facility_config`, `security_policies`, `users`, `role_permissions` | `admin:config_update`, `admin:role_matrix_update`, `admin:user_lock` |
| **Reporting** | Go Core (`:8080`) | Aggregation over existing tables | N/A (Read-only queries) |
| **NHIA** | Python (`:8000`) | `nhia_claims`, `nhia_tariffs`, `hmo_providers` | Calls Go Core `/internal/audit-log` for `nhia:claim_submit` |
| **Radiology** | Python (`:8000`) | `radiology_orders`, `radiology_reports` | Calls Go Core `/internal/audit-log` for `radiology:report_signoff` |
