# 04_TECH_STACK.md — Technology Blueprint & Topology
## Hospital Information Management System (HIMS)

> **Document Version:** 1.0.0  
> **Architecture Style:** Polyglot Micro-Service (Go Core + Python Interop)  
> **Containerization:** Docker Compose Single-Tenant Deployment  
> **Database:** PostgreSQL 16 (Shared Instance, Go-Owned Migrations)

---

## 1. System Topology Overview

```
                      +---------------------------------------+
                      |         Hospital LAN Client           |
                      |  (Chrome / Edge / Firefox Web Client) |
                      +---------------------------------------+
                                          |
                                   HTTP / Port 5173
                                          v
                      +---------------------------------------+
                      |       Frontend Web Application        |
                      |     React 18 + TypeScript + Vite      |
                      +---------------------------------------+
                                 |                 |
                   REST / Port 8080               REST / Port 8000
                                 |                 |
                                 v                 v
          +-----------------------------+   +-----------------------------+
          |       Go Core Service       |   |    Python Interop Service   |
          |  (17 Operational Modules +  |   |    (FastAPI - Lab, NHIA,    |
          |   Auth & Audit Primacy)     |   |         Radiology)          |
          +-----------------------------+   +-----------------------------+
                         ^                                 |
                         |     Internal REST (Audit/RBAC)  |
                         +---------------------------------+
                         |   (via /internal/audit-log &    |
                         |    /internal/authz/check)       |
                         |
                         +-----------------+
                                           |
                                           v
                        +-------------------------------------+
                        |          Shared PostgreSQL 16       |
                        |      (Single-Tenant Hospital DB)    |
                        +-------------------------------------+
```

---

## 2. Technology Choices & Justification

| Layer | Chosen Technology | Architectural Justification |
|---|---|---|
| **Frontend Framework** | **React 18 + TypeScript** | Component-driven SPA, strict compile-time typing (`noUnusedLocals`, `noImplicitAny`), fast rendering, rich ecosystem. |
| **Frontend Styling** | **Tailwind CSS v4** | Rapid utility styling matching hospital UI blueprints, optimized build sizes, consistent color tokens. |
| **Core Backend** | **Go (Golang 1.26)** | High throughput, sub-millisecond memory footprint, static single-binary deployment, zero garbage collection pauses on high-volume clinical transactions. |
| **Diagnostic Interop** | **Python 3.12 (FastAPI)** | Native HL7 v2, FHIR JSON, and pydicom / DICOM medical imaging ecosystem support. |
| **Database** | **PostgreSQL 16** | Robust ACID transactional guarantees, JSONB document storage, native sequence generators, row-level locks, and immutable audit triggers. |
| **Migrations** | **Golang-migrate (Go Owned)** | Sequential SQL up/down migrations owned exclusively by Go Core to prevent schema drift between services. |

---

## 3. Inter-Service Security & Handshake

To prevent security or audit drift between the two services:
1. **Go Core owns Auth:** Go Core issues JWT tokens signed with `JWT_SECRET`. Python verifies these tokens but never issues them independently.
2. **Go Core owns the Audit Log:** Python Interop NEVER writes directly to the `audit_logs` table. Every mutating action in Laboratory, NHIA, or Radiology calls Go Core's internal endpoint:
   ```http
   POST http://core-go:8080/internal/audit-log
   X-Internal-Service-Key: <INTERNAL_SERVICE_KEY>
   ```
3. **Go Core owns Authorization Checks:** For sensitive permissions (approve, delete, void), Python verifies privileges via:
   ```http
   GET http://core-go:8080/internal/authz/check?role=...&action=...&module=...
   X-Internal-Service-Key: <INTERNAL_SERVICE_KEY>
   ```

---

## 4. Port Configuration & Environment Variables

| Service | Container Name | Port Mapping | Healthcheck Endpoint |
|---|---|---|---|
| **PostgreSQL** | `hims-postgres` | `5432:5432` | `pg_isready -U hims_app -d hims` |
| **Go Core** | `hims-core-go` | `8080:8080` | `GET /health` (`{"status":"ok"}`) |
| **Python Interop** | `hims-interop-py` | `8000:8000` | `GET /health` (`{"status":"ok"}`) |
| **Frontend** | `hims-frontend` | `5173:5173` | `GET /` (`HTTP 200 OK`) |
