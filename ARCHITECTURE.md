# ARCHITECTURE.md — Tech Blueprint
## Hospital Information Management System (HIMS)

> **Purpose of this file:** Locks in how this app is built, so an AI
> coding assistant doesn't switch frameworks, invent an alternate folder
> structure, or introduce a second database/ORM/auth pattern halfway
> through the project. If a task seems to require deviating from this
> file, stop and ask rather than deciding unilaterally.

---

## Confirmed Tech Stack — Polyglot: Go core + Python interoperability service

**Decision (supersedes the earlier Go-only decision):** the backend is
split by module into two services, not one:

- **Go service ("core")** — Medical Records, Nursing, Billing, Pharmacy,
  GOPD, Theatre, Maternity, Accident & Emergency, Mortuary, Audit
  (dashboard), HR, Reporting, Inventory, Security/Admin, **Appointment
  Scheduling, Accounting (General Ledger), Sub-store Management** — 17 modules
- **Python service ("interop")** — Laboratory (LIS), NHIA/HMO,
  Radiology/Imaging — the 3 modules where HL7/FHIR interoperability
  tooling is the deciding factor

**Why the 3 newest modules (Appointment, Accounting, Sub-store) are Go,
not Python:** none of them involve HL7/FHIR interoperability — the one
factor that justifies the Python split at all. Appointment scheduling is
calendar/availability logic, Accounting is general-ledger bookkeeping
(distinct from Billing's patient invoicing), and Sub-store is
department/ward-level stock (distinct from Inventory & Procurement's
hospital-wide store — this one was already implied, unnamed, in the
Nursing Ward Management mockup's ward-level supply table). All three are
standard business logic that belongs with the rest of core.

**The Go core service is the single source of truth for auth and audit —
the Python service never duplicates either:**

| Concern | Owner | How the Python service uses it |
|---|---|---|
| Audit log writes | Go core, exclusively | Python calls `POST /internal/audit-log` on the Go service for every mutating action — never writes to `audit_logs` directly, even though it shares the same Postgres instance |
| RBAC / permission checks | Go core, exclusively | Python validates the JWT locally (role claims embedded, signed by Go's auth service) for cheap checks, but calls `GET /internal/authz/check` on Go for anything permission-matrix-sensitive (approve/void/delete-level actions) rather than reimplementing the matrix |
| User/session management | Go core, exclusively | Python never issues or manages sessions/JWTs — it only verifies tokens Go issued |

This is the mitigation for the risk flagged earlier: two services, but
**one implementation** of the two things (audit trail, permissions) that
must never drift.

| Layer | Choice | Do not substitute with |
|---|---|---|
| Frontend | React (web, responsive) | Vue, Angular, Svelte, native mobile frameworks |
| Backend — core | **Go** (17 modules listed above) | — |
| Backend — interop | **Python (FastAPI)** (Laboratory, NHIA/HMO, Radiology only) | Do not migrate additional modules into the Python service without updating this file and getting confirmation — the split is deliberately narrow |
| Web framework (Go) | Gin, Echo, or Fiber (pick one, stay consistent) | Mixing frameworks within the Go service |
| Database | PostgreSQL — **one instance, shared by both services** | Separate databases per service (would break the shared audit-log/RBAC design above) |
| ORM / DB access (Go) | GORM or sqlc | Mixing data-access patterns within the Go service |
| ORM / DB access (Python) | SQLAlchemy + Pydantic | — |
| Auth | JWT issued and managed by Go only; Python verifies, never issues | Python-side session/auth management |
| Inter-service calls | Internal REST, service-to-service auth token (not the user's JWT) | Direct DB writes from Python to Go-owned tables (`audit_logs`, `users`, `permissions`) |
| File storage | MinIO (on-prem) or S3-compatible | Local disk storage in production |
| API style | REST, HL7/FHIR-compatible resource shapes for clinical data (this is exactly why Python owns Lab/NHIA/Radiology) | GraphQL |
| Styling | Tailwind CSS (matches mockup direction) | CSS-in-JS libraries, unless specified |

**Local dev exception:** SQLite may be used for rapid local prototyping of
a single Go module, but any code merged to the main branch must run
against PostgreSQL. The Python service should target Postgres from the
start (SQLAlchemy makes swapping cheap, but don't bother).

**Operational cost of this split — accepted, not ignored:** two
deployables to run on the hospital's on-prem server (a Go binary + a
Python/FastAPI process, likely both behind one reverse proxy), two sets
of dependencies to install, two things that can go down independently.
Mitigated by keeping the split narrow (3 modules, not spread throughout)
and by centralizing audit/RBAC in Go as described above.

## Deployment Model

Hybrid: on-premise application + database server at the hospital, with
encrypted nightly backup to cloud. Do not design features that assume
pure-cloud, always-online connectivity — nursing/vitals entry in
particular must degrade gracefully offline (see `docs/04_TECH_STACK.md`
and `PRD.md` non-functional requirements).

**Multi-hospital note:** this system is designed to be sold and deployed
to more than one hospital over time — but as **separate, single-tenant
deployments** of the same codebase, one per hospital, each with its own
database and infrastructure. This is NOT a shared multi-tenant platform:
no hospital's data or infrastructure is ever shared with another. Do not
add a `hospital_id`/tenant column to shared tables, tenant-switching UI,
or any cross-hospital query — that would be a different (much larger)
architecture and hasn't been decided. If a task seems to require
tenant-awareness, stop and ask rather than building it in.

## Repository / Folder Structure

Two backend services, one frontend, sharing one database and one repo.

```
hospital-hims/
├── PRD.md                      # this feature map
├── ARCHITECTURE.md             # this file
├── AGENTS.md                   # AI behavior guardrails
├── TASKS.md                    # active task checklist
├── docs/                       # full business/technical documentation set
│   ├── 00_README.md
│   ├── 01_PRD.md ... 09_PROPOSAL_SUMMARY.md
│
├── services/
│   ├── core-go/                 # Go — 17 modules, owns auth + audit
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── modules/
│   │   │   │   ├── medicalrecords/
│   │   │   │   ├── nursing/
│   │   │   │   │   ├── admissions/
│   │   │   │   │   ├── vitals/
│   │   │   │   │   ├── nursingnotes/
│   │   │   │   │   ├── careplans/
│   │   │   │   │   ├── shifthandover/
│   │   │   │   │   └── discharge/
│   │   │   │   ├── billing/
│   │   │   │   ├── pharmacy/
│   │   │   │   ├── gopd/
│   │   │   │   ├── theatre/
│   │   │   │   ├── maternity/
│   │   │   │   ├── ae/
│   │   │   │   ├── mortuary/
│   │   │   │   ├── audit/          (dashboard — reads audit_logs)
│   │   │   │   ├── hr/
│   │   │   │   ├── reporting/
│   │   │   │   ├── inventory/
│   │   │   │   ├── admin/
│   │   │   │   ├── appointment/    (new — scheduling/calendar)
│   │   │   │   ├── accounting/     (new — general ledger, cash/bank, journal vouchers)
│   │   │   │   └── substore/       (new — department/ward-level stock)
│   │   │   ├── common/          # shared middleware, helpers
│   │   │   ├── auth/             # RBAC, JWT issuance (built on AuthForge logic)
│   │   │   ├── auditlog/          # THE append-only audit writer — also exposed via /internal/audit-log for Python
│   │   │   ├── internalapi/       # /internal/audit-log, /internal/authz/check — for the Python service to call
│   │   │   └── db/               # DB connection, migrations
│   │   ├── migrations/           # SQL migrations (goose/golang-migrate) — shared schema, Go owns them
│   │   └── go.mod
│   │
│   └── interop-py/              # Python/FastAPI — 3 HL7/FHIR-heavy modules
│       ├── app/
│       │   ├── modules/
│       │   │   ├── laboratory/
│       │   │   ├── nhia/
│       │   │   └── radiology/
│       │   ├── clients/
│       │   │   └── core_client.py   # calls Go's /internal/audit-log + /internal/authz/check
│       │   ├── auth/                # JWT verification only (issued by Go) — no issuance, no session logic here
│       │   └── main.py
│       └── requirements.txt / pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── modules/              # mirrors both services' module names
│   │   ├── components/           # shared UI components
│   │   ├── hooks/
│   │   ├── lib/                  # API client(s), auth context
│   │   └── App.tsx
│   └── public/
│
└── infra/
    ├── docker-compose.yml        # local dev — both services + Postgres + reverse proxy
    └── deploy/                   # on-prem deployment scripts (Go binary + Python process + Postgres, one server)
```

**Rules:**
- Every new module goes in the correct service's `modules/` folder per
  the ownership list above — do not add a new module to `interop-py`
  without updating `ARCHITECTURE.md`'s module-ownership table first.
- Migrations live in `core-go/migrations/` — Go owns schema changes even
  for tables the Python service reads/writes (Lab/NHIA/Radiology tables),
  to keep one migration history instead of two.
- The Python service's `clients/core_client.py` is the *only* place it
  talks to the Go service — no ad-hoc HTTP calls scattered through
  Python module code.

## Database Schema

Full entity reference: `docs/05_DATABASE_SCHEMA.md`. Key non-negotiable
rules when writing migrations:

- Every table with financial/clinical significance: `created_by`,
  `updated_by` (FK to users), `created_at`, `updated_at`, `deleted_at` (soft-delete)
- `audit_logs` table: **append-only** — no UPDATE/DELETE grant at the DB
  role level, not just app-level convention
- Monetary fields: `DECIMAL`/`NUMERIC` type, never `FLOAT`/`DOUBLE`
- Timestamps stored UTC

## API Conventions

- REST endpoints namespaced by module: `/api/v1/nursing/...` (Go),
  `/api/v1/laboratory/...` (Python) — the frontend treats both as one API
  surface behind a reverse proxy; module ownership is a backend concern,
  not something the frontend needs to know about
- Every mutating endpoint (POST/PUT/PATCH/DELETE) on clinical/financial
  data must result in an audit-log entry:
  - Go modules call the internal `auditlog` package directly
  - Python modules call `POST /internal/audit-log` on the Go service via
    `core_client.py` — never write to `audit_logs` directly
- RBAC: Go modules use the local middleware; Python modules call
  `GET /internal/authz/check` on the Go service for permission-matrix
  decisions — never reimplement the matrix in Python
- Explicit error handling per Go convention (`if err != nil`) in the Go
  service; explicit exception handling with typed responses in the
  Python service — no silent failures in either
- Inter-service calls (Python → Go) use a service-to-service credential,
  not the end user's JWT — the Go service should distinguish
  "user request" from "service request" in its logs

## When this file needs to change

If a task requires a technology not listed here (a new library class,
e.g. a queueing system, a caching layer), that's fine to propose — but
add it to this file as part of that change, don't introduce it silently
in one module's code.
