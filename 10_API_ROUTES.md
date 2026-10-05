# API Route Design
## Hospital Information Management System (HIMS)

**Status:** Draft v0.1 — covers all 20 confirmed modules across both
services (17 Go core, 3 Python interop), including Appointment
Scheduling, Accounting, and Sub-store Management.

**Convention:** All public routes are versioned and namespaced by module:
`/api/v1/<module>/...`. The frontend calls both services through one
reverse proxy, so from the browser's perspective there is one API surface
— which service actually handles a route is a backend concern (see
`ARCHITECTURE.md` module-ownership table).

Internal-only routes (`/internal/...`) are never exposed through the
reverse proxy — reachable only from the Python service to the Go service,
over the internal network, authenticated with a service-to-service
credential, not a user JWT. They are deliberately *not* versioned: both
services are deployed together from one compose file, so there is no
independent consumer for a version prefix to protect.

---

## Cross-cutting: Auth (Go core, exclusively)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Issue JWT |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Invalidate session |
| GET | `/api/v1/auth/me` | Current user + role/permissions |

## Cross-cutting: Internal API (Go core, called only by Python interop service)

| Method | Route | Purpose |
|---|---|---|
| POST | `/internal/audit-log` | Write an audit entry — Python's only path to `audit_logs` |
| GET | `/internal/authz/check` | Resolve a permission-matrix decision for a given user/role/action |

---

## Go Core Service — 17 modules

### Medical Records
| Method | Route |
|---|---|
| GET | `/api/v1/medical-records/patients?search=` |
| POST | `/api/v1/medical-records/patients` |
| GET | `/api/v1/medical-records/patients/{id}` |
| PATCH | `/api/v1/medical-records/patients/{id}` |
| POST | `/api/v1/medical-records/patients/{id}/id-card` |
| GET | `/api/v1/medical-records/patients/{id}/payment-status` |

### Nursing
| Method | Route | FR ref |
|---|---|---|
| POST | `/api/v1/nursing/admissions` | FR-NS-01 |
| GET / PATCH | `/api/v1/nursing/admissions/{id}` | FR-NS-01 |
| GET | `/api/v1/nursing/patients?filter=critical\|high-risk\|stable` | FR-NS-02 |
| GET / POST | `/api/v1/nursing/tasks` | FR-NS-03 |
| PATCH | `/api/v1/nursing/tasks/{id}` (start/complete/postpone) | FR-NS-03 |
| POST | `/api/v1/nursing/vitals` | FR-NS-04 |
| GET | `/api/v1/nursing/vitals/{admissionId}/history` | FR-NS-04 |
| POST | `/api/v1/nursing/notes` | FR-NS-05 |
| GET | `/api/v1/nursing/notes/{admissionId}` | FR-NS-05 |
| POST | `/api/v1/nursing/notes/{id}/sign` | FR-NS-05 |
| POST | `/api/v1/nursing/care-plans` | FR-NS-06 |
| GET | `/api/v1/nursing/care-plans/{id}` | FR-NS-06 |
| POST | `/api/v1/nursing/care-plans/{id}/interventions` | FR-NS-06 |
| POST | `/api/v1/nursing/shift-handovers` | FR-NS-07 |
| GET | `/api/v1/nursing/shift-handovers/{wardId}` | FR-NS-07 |
| GET | `/api/v1/nursing/wards/{id}/beds` | FR-NS-08 |
| GET | `/api/v1/nursing/wards/{id}/inventory` | FR-NS-08 |
| GET | `/api/v1/nursing/discharge/{admissionId}/checklist` | FR-NS-09 |
| PATCH | `/api/v1/nursing/discharge/{admissionId}/checklist/{itemId}` | FR-NS-09/10 |

### Billing
| Method | Route | FR ref |
|---|---|---|
| POST | `/api/v1/billing/invoices` | FR-AC-01 |
| GET | `/api/v1/billing/invoices?filter=` | FR-AC-02 |
| GET / PATCH | `/api/v1/billing/invoices/{id}` | FR-AC-03 |
| DELETE | `/api/v1/billing/invoices/{id}` (soft delete, password confirm) | FR-AC-05 |
| GET / PATCH | `/api/v1/billing/invoices/{id}/permissions` | FR-AC-04 |
| POST | `/api/v1/billing/invoices/{id}/payments` | FR-AC-07 |
| GET | `/api/v1/billing/invoices/{id}/receipts` | FR-AC-07 |
| GET | `/api/v1/billing/deposits/{admissionId}` | FR-AC-08 |

### Pharmacy
| Method | Route | FR ref |
|---|---|---|
| POST | `/api/v1/pharmacy/prescriptions/{id}/dispense` | FR-PH-03 |
| GET | `/api/v1/pharmacy/drugs` | FR-PH-04 |
| GET | `/api/v1/pharmacy/drugs/{id}/stock` | FR-PH-04 |

### GOPD
| Method | Route |
|---|---|
| GET / POST | `/api/v1/gopd/queue` |
| POST | `/api/v1/gopd/consultations` |
| POST | `/api/v1/gopd/diagnoses` (ICD-10) |

### Theatre
| Method | Route |
|---|---|
| POST | `/api/v1/theatre/schedules` |
| GET | `/api/v1/theatre/schedules/{id}` |
| POST | `/api/v1/theatre/checklists` |

### Maternity
| Method | Route |
|---|---|
| POST | `/api/v1/maternity/anc-visits` |
| POST | `/api/v1/maternity/labour-charts` |
| POST | `/api/v1/maternity/deliveries` |

### Accident & Emergency
| Method | Route |
|---|---|
| POST | `/api/v1/ae/intake` (payment gate always bypassed here) |
| GET / PATCH | `/api/v1/ae/triage/{id}` |

### Mortuary
| Method | Route |
|---|---|
| POST | `/api/v1/mortuary/bodies` |
| POST | `/api/v1/mortuary/release-authorizations` |

### Audit (dashboard — reads `audit_logs`, never writes)
| Method | Route |
|---|---|
| GET | `/api/v1/audit/logs?filter=` |
| GET | `/api/v1/audit/exceptions` |
| PATCH | `/api/v1/audit/exceptions/{id}` (review status) |

### HR & Staff
| Method | Route |
|---|---|
| GET / POST | `/api/v1/hr/staff` |
| GET / POST | `/api/v1/hr/shifts` |

### Reporting & Analytics
| Method | Route |
|---|---|
| GET | `/api/v1/reporting/dashboards/{type}` |

### Inventory & Procurement
| Method | Route |
|---|---|
| GET / POST | `/api/v1/inventory/items` |
| POST | `/api/v1/inventory/stock-adjustments` |

### Security/System Administration
| Method | Route |
|---|---|
| GET / POST | `/api/v1/admin/users` |
| GET / PATCH | `/api/v1/admin/roles` |

### Appointment Scheduling
| Method | Route | FR ref |
|---|---|---|
| GET | `/api/v1/appointments/availability?doctorId=&date=` | FR-AP-01 |
| POST | `/api/v1/appointments` | FR-AP-02 |
| PATCH | `/api/v1/appointments/{id}` (reschedule/cancel) | FR-AP-03 |

### Accounting (General Ledger)
| Method | Route | FR ref |
|---|---|---|
| GET / POST | `/api/v1/accounting/journal-vouchers` | FR-GL-02 |
| PATCH | `/api/v1/accounting/journal-vouchers/{id}/approve` | FR-GL-02 |
| GET / POST | `/api/v1/accounting/chart-of-accounts` | FR-GL-03 |
| GET | `/api/v1/accounting/statements/{type}` | FR-GL-04 |
| GET | `/api/v1/accounting/reconciliation/{period}` | FR-GL-05 |

### Sub-store Management
| Method | Route | FR ref |
|---|---|---|
| GET | `/api/v1/substores/{id}/items` | FR-SS-01 |
| POST | `/api/v1/substores/{id}/requisitions` | FR-SS-02 |
| PATCH | `/api/v1/substores/requisitions/{id}` (fulfill) | FR-SS-02 |
| PATCH | `/api/v1/substores/{id}/items/{itemId}/adjust` (audit-logged) | FR-SS-04 |

---

## Python Interop Service — 3 modules

Every mutating route below calls `POST /internal/audit-log` on the Go
service before returning, and every permission-sensitive route calls
`GET /internal/authz/check` first — see `ARCHITECTURE.md`
"Audit log / RBAC ownership" table. None of these routes write directly
to `audit_logs`, `users`, or permission tables.

### Laboratory (LIS)
| Method | Route |
|---|---|
| POST | `/api/v1/laboratory/orders` |
| GET | `/api/v1/laboratory/orders/{id}` |
| POST | `/api/v1/laboratory/specimens` |
| POST | `/api/v1/laboratory/results` |
| PATCH | `/api/v1/laboratory/results/{id}/verify` |

### NHIA/HMO
| Method | Route |
|---|---|
| GET | `/api/v1/nhia/eligibility/{patientId}` |
| POST | `/api/v1/nhia/claims` |
| GET | `/api/v1/nhia/claims/{id}` |
| POST | `/api/v1/nhia/claims/batches` |
| GET | `/api/v1/nhia/claims/{id}/rejections` |

### Radiology/Imaging
| Method | Route |
|---|---|
| POST | `/api/v1/radiology/requests` |
| GET | `/api/v1/radiology/requests/{id}` |
| POST | `/api/v1/radiology/results` |

---

## Open items

- [ ] Pagination/filtering query-param convention not yet standardized
      across list endpoints — pick one pattern (`?page=&limit=` vs
      cursor-based) and apply consistently
- [ ] Error response shape not yet defined — needs one consistent format
      used by both services so the frontend has a single error-handling path
