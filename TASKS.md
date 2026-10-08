# TASKS.md — Step-by-Step Checklist
## Hospital Information Management System (HIMS)

> **IMPORTANT:** The current active focus is **strictly on the frontend**. 
> Please refer to `frontend_status.md` for current progress and active tasks. 
> Do not transition to backend work without explicit confirmation.

> Linear roadmap broken down from `PRD.md` / `docs/08_ROADMAP_PHASES.md`.
> Work top to bottom within each section. Check off `[x]` as completed.
> Add newly discovered tasks under the relevant section rather than doing
> them silently. Do not skip ahead to a later Build Group section before
> the current one is functionally complete.
>
> **Sequencing decision:** all 20 modules are built to completion before
> any hospital pitch, demo, or marketing activity — no phased client
> engagement gates this build. Known risk: several requirements below are
> still marked `[VALIDATE WITH HOSPITAL]`/`[UNRESOLVED]` and won't get
> real answers until after the full build, since no hospital contact
> happens until then. Where a task depends on one of those, build to the
> most reasonable documented assumption and flag it clearly rather than
> blocking — but don't quietly resolve it as if it were confirmed.

---

## 0. Project Setup

- [x] Initialize repo structure per `ARCHITECTURE.md` (`services/core-go/`, `services/interop-py/`, `frontend/`)
- [x] Set up Go core service skeleton (Gin/Echo/Fiber — pick one)
- [x] Set up Python interop service skeleton (FastAPI)
- [x] Set up frontend (React + Tailwind) project skeleton
- [x] Set up PostgreSQL — single shared instance, Go owns migrations
- [x] Set up `audit_logs` table + append-only DB role permissions (Go-owned)
- [x] Build the Go auth module (JWT issuance) + base RBAC middleware
- [x] Build Go's `/internal/audit-log` and `/internal/authz/check` endpoints
      — these must exist before any Python module work starts
- [x] Build Python's `core_client.py` — verify it can successfully call
      both internal Go endpoints before writing any Lab/NHIA/Radiology logic
- [x] Set up CI pipeline (lint + type-check + test for both services on PR)
- [x] Set up local dev environment (`docker-compose.yml` — both services + Postgres + reverse proxy)

### 0.1 Repo audit follow-ups (2026-09-28)

Findings from a full repo audit, ordered by severity. Steps 1 is complete;
the rest are outstanding. See the audit notes for file/line references.

**Step 1 — authentication and secret handling (DONE)**
- [x] Fix `/api/v1/auth/login`: it issued a valid JWT for *any* password and
      embedded a client-supplied `role`, so `{"role":"ADMIN"}` minted an admin
      token. Now looks the user up, verifies bcrypt, and takes role/department
      from the stored record only.
- [x] Stop failing open on secrets: `JWT_SECRET` and `INTERNAL_SERVICE_KEY` had
      hard-coded development fallbacks published in this repo. Both services now
      refuse to start without real secrets (`internal/config`, `config.py`).
- [x] **Verified:** `PostgresUserStore.FindByUsername`'s SQL is now covered by
      `internal/auth/store_integration_test.go` against a real PostgreSQL —
      field mapping, `ErrUserNotFound` for unknown and for soft-deleted users,
      plus the full login path (including a `{"role":"ADMIN"}` injection attempt)
      through real SQL. `TEST_DATABASE_URL` gates these; CI now sets it.

**Step 2 — test mandates from AGENTS.md (DONE)**
- [x] Unit + integration tests for the audit-log writer.
      `internal/auditlog/writer_integration_test.go` covers the entry
      round-trip, service/status defaults, nil-details normalisation, the
      marshal-failure path, error propagation, and — the point of the exercise —
      that the append-only UPDATE/DELETE triggers actually fire.
- [x] Cross-service integration test: `tests/test_cross_service.py` builds and
      runs the real `core-go` binary, points a real `CoreServiceClient` at it
      over real HTTP, confirms a bad internal key gets **401** (not 404, which
      would mean the path is wrong), and then verifies the audit row landed in
      PostgreSQL by querying it directly. Also proves `/internal/authz/check`
      answers from `role_permissions` rather than the Go fallback matrix.
      Mutation-checked: repointing the client at `/internal/v1/audit-log` fails
      the suite, so it genuinely covers the boundary.
- [x] Added a `postgres:16` service to both backend CI jobs, with
      `TEST_DATABASE_URL` wired to the test step. The Python job also installs
      Go, since the cross-service test compiles the core service.
      Both tests skip cleanly when `TEST_DATABASE_URL` is unset (verified:
      13 Go tests skip, 8 Python tests skip).

**Step 3 — spec/implementation drift (DONE)**
- [x] Internal routes were `/internal/v1/...` in `10_API_ROUTES.md` but
      `/internal/audit-log` and `/internal/authz/check` in code. Aligned the
      **doc to the code**: both services already agreed with each other, the
      paths are pinned by the new cross-service test, and the internal API is
      deployed as one unit from a single compose file — so a version prefix
      protects no independent consumer. The doc's convention note now says so
      explicitly rather than leaving the omission looking like an oversight.
- [x] `10_API_ROUTES.md` §"Go Core Service" heading said 14 modules while
      listing 17 (and the same file's own header already said 17). Corrected to
      17 and re-counted against the list.
- [ ] `files/` is an untracked stale duplicate of the root docs (`AGENTS.md`,
      `ARCHITECTURE.md`, `PRD.md`, `10_API_ROUTES.md` byte-identical;
      `TASKS.md` already behind). Editing the root copy widens the gap. Needs a
      decision: delete, gitignore, or leave — rule 1 means asking first.
- [ ] Not yet checked: whether the *public* routes in `10_API_ROUTES.md` match
      what is implemented. Step 3 only covered the internal routes. Spot-check
      is cheap now that the internal ones are pinned by tests; a full pass
      belongs with the module build-out.

**Step 4 — needs a human decision (see PRD.md "Two integration decisions")**
- [x] **DECIDED 2026-09-28:** discharge-checklist → billing trigger is **100%
      completion only**, with no nurse sign-off gate. Recorded in `ASSUMPTIONS.md`
      together with the fact that this **deliberately differs** from the billing
      client material (which says 100% *plus* sign-off) — so nobody later
      "corrects" it back. `PRD.md` updated from `[UNRESOLVED]` to resolved.
- [x] **DECIDED 2026-09-28:** admission deposit gate is a **backend flag,
      enforced at the API layer**, no hard UI lock, A&E exempt. Recorded in
      `ASSUMPTIONS.md`. *Corrected 2026-09-29:* an earlier note here said no
      client material covered this. Wrong — the design `.docx` does, and it
      names the enforcement point: the deposit must be paid "before the nurse
      or Doctor can access their folder". The decision stands (an API-enforced
      flag is what produces that behaviour), but the gate must cover clinician
      folder access, not just admission intake. See `ASSUMPTIONS.md`.
- [x] Created `ASSUMPTIONS.md`, which `TASKS.md` §1 called for. It separates
      **DECIDED** entries from **ASSUMED** ones, since only the former are safe
      to build against without further validation.
- [ ] Create the `docs/` directory. `PRD.md`, `ARCHITECTURE.md`, `TASKS.md` and
      `AGENTS.md` all reference `docs/01_PRD.md`, `02_BRD.md`, `03_SRS.md`,
      `04_TECH_STACK.md`, `05_DATABASE_SCHEMA.md`, `06_SECURITY_RBAC.md` and
      `08_ROADMAP_PHASES.md`; none exist. The content appears to be in the
      untracked `PROJECT University Teaching Hospital Software Design.docx`.
- [ ] Decide whether the untracked client material (≈36MB of mockup PNGs, the
      `.docx`, and the stale `files/` doc copy) is committed, moved, or
      gitignored — and check it for real patient data before `git add -A`.
      *Owner chose 2026-09-28 to commit it as design reference; blocked on the
      patient-data sweep below.*
- [ ] **Patient-data sweep before committing the client material (rule 7).**
      The mockup screens show a real institution's name (`FUHSI TEACHING
      HOSPITAL`) in the UI chrome, and patient rows with names, hospital
      numbers, and vitals. These read as synthetic demo data, but "reads as
      synthetic" is not a check. Confirm the names/IDs are fabricated (or
      replace them) before any of these images enter git history, where they
      cannot be removed cleanly.

**Lower severity, still open**
- [x] CI pinned Go 1.22 while `go.mod` requires 1.25.0 — the Go job could not
      build at all. Now reads the version from `go.mod` via `go-version-file`,
      so it cannot drift behind again.
- [ ] No linter in CI: `golangci-lint` and `ruff`/`mypy` are still absent
      despite AGENTS.md requiring lint-clean code. CI runs `go vet` and
      `py_compile` (syntax only). *Partly addressed:* a `gofmt -l` check was
      added to the Go job; the Python side and the fuller linters remain.
- [ ] No reverse proxy in either compose file, though ARCHITECTURE.md and §0
      above both call for one; `vite.config.ts` proxies `/api` to `:8080` only,
      so Lab/NHIA/Radiology routes 404 through the dev proxy.
- [ ] Two near-identical compose files (root and `infra/`) that have already
      drifted once. Consolidate — AGENTS.md rule 1 means asking before deleting.
- [x] `auditlog.Writer.Record` silently wrote `{}` if `json.Marshal` failed,
      still recording SUCCESS. Now normalises nil details to `{}` and returns a
      wrapped error for details that cannot be encoded, rather than storing a
      record that looks complete but has lost its payload.
- [ ] **Needs a decision (rule 1 — do not edit migrations unasked):** the first
      migration opens with `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` and
      `"pgcrypto"`, but neither is used anywhere — there are zero calls to
      `uuid_generate_v4()`, no `pgcrypto` functions, and the two `DEFAULT
      gen_random_uuid()` columns rely on the built-in (PG13+), not pgcrypto.
      Removing those two lines would make the schema portable to any PG13+
      without contrib. Verified: with those two lines stripped, the rest of the
      migration applies cleanly to an empty database with `ON_ERROR_STOP=1`.
      CI is unaffected either way — the official `postgres:16` image ships both
      extension control files (checked against the actual `postgresql-16`
      package). Proposal: delete the two lines. Awaiting confirmation.
- [x] `HandleAuthzCheck` fell back to a hard-coded matrix on any DB error, giving
      two permission implementations that could drift from `role_permissions`.
      The fallback is **gone**: the table is now the only authority, and a failed
      lookup returns 503 with no `allowed` field rather than a guess. Note an
      *unseeded* table was never the fallback's trigger — that returns a real
      `false`; only genuine query errors were. The `ADMIN` universal-access
      override is kept (a fresh deployment would otherwise lock out its admins)
      and is now pinned by its own test. Covered by the new
      `internalapi/handler_integration_test.go`.
- [x] CORS in `interop-py/main.py` used `allow_origins=["*"]` with
      `allow_credentials=True` — Starlette echoes the caller's origin back with
      `Allow-Credentials: true`, so any site could make authenticated requests
      as a logged-in user. Now read from `CORS_ALLOWED_ORIGINS`, defaulting to
      the Vite dev origin, with `*` rejected as a startup error.
- [ ] `audit_logs` has both `timestamp` and `created_at` (redundant).
- [ ] Append-only audit enforcement uses triggers, not the DB-role grant
      ARCHITECTURE.md specifies — an undocumented deviation (functionally
      equivalent, arguably stronger, but the doc should say so).
- [ ] No frontend test runner.


## 1. Requirements Assumptions (no hospital contact until full build is done)

Since hospital validation won't happen until after the complete system is
built, resolve these by picking the most defensible default from
`docs/` and documenting the assumption in code comments / a running
`ASSUMPTIONS.md` — don't leave them silently unresolved:

- [ ] Document assumed discharge-checklist → billing trigger rule
      (`PRD.md` "Two integration decisions" #1) — pick one, note it's assumed
- [ ] Document assumed admission-deposit enforcement rule
      (`PRD.md` "Two integration decisions" #2) — pick one, note it's assumed
- [ ] Document assumed RBAC role list (`docs/06_SECURITY_RBAC.md`)
- [ ] Document assumed NHIA plan types
- [ ] Document assumed ward/bed count and department list (for demo data)

## 2. Build Group 1 — Foundation

### 2.1 Medical Records
- [ ] Patient entity + migration
- [ ] FR-MR-01: Patient search (name/hospital no./NHIA ID)
- [ ] FR-MR-02: New patient registration
- [ ] FR-MR-03: Hospital number generation
- [ ] FR-MR-05: Patient ID card printing
- [ ] FR-MR-06: Payment-before-service enforcement (depends on Task 1 decision)

### 2.2 Nursing Services
- [ ] Admission/ward/bed entities + migrations
- [ ] FR-NS-01: Admission intake flow (triage, ward/bed assignment, checklist)
- [ ] FR-NS-02: My Patients list (filter by Critical/High Risk/Stable)
- [ ] FR-NS-03: Nursing Tasks (MAR-linked)
- [ ] FR-NS-04: Vital signs entry (manual + device-connect stub)
- [ ] FR-NS-05: Nursing Notes (structured types, tagging, sign-and-lock)
- [ ] FR-NS-06: Care Plans (templates, interventions, progress tracking)
- [ ] FR-NS-07: Shift Handover (endorsement list, dual sign-off)
- [ ] FR-NS-08: Ward Management (bed map, staff allocation, ward inventory)
- [ ] FR-NS-09: Discharge checklist
- [ ] FR-NS-10: Wire discharge checklist completion to billing trigger
      (per Task 1 decision)

### 2.3 Accounts & Billing
- [ ] Invoice/payment entities + migrations
- [ ] FR-AC-01: Create new invoice (NHIA-aware line items)
- [ ] FR-AC-02: Manage Invoices list (filters, aged invoice summary)
- [ ] FR-AC-03: Invoice actions (view/edit/status)
- [ ] FR-AC-04: Invoice permissions (role defaults + per-user overrides)
- [ ] FR-AC-05: Delete invoice (password confirm + audit log — soft delete only)
- [ ] FR-AC-06: Pull consolidated charges from Nursing Tasks/Notes at discharge
- [ ] FR-AC-07: Payment methods + receipt history
- [ ] FR-AC-08: Admission deposit enforcement (per Task 1 decision)

### 2.4 Pharmacy (minimal)
- [x] Drug/dispensing entities + migrations
- [x] FR-PH-01: Receive prescription
- [x] FR-PH-02: Basic allergy/interaction check
- [x] FR-PH-03: Dispense + stock deduction
- [x] FR-PH-04: Basic stock level view

### 2.5 Appointment Scheduling (new)
- [x] Appointment/doctor-availability entities + migrations
- [x] FR-AP-01: Doctor availability view
- [x] FR-AP-02: Book appointment (linked to Medical Records)
- [x] FR-AP-03: Reschedule/cancel
- [x] FR-AP-04: Reminders (confirm scope per Task 1 decision before building)
- [x] FR-AP-05: Distinguish from GOPD walk-in queue in the UI/data model

### 2.6 Accounting — General Ledger (new)
- [x] Chart of accounts / journal voucher entities + migrations
- [x] FR-GL-01: Cash/bank transaction recording
- [x] FR-GL-02: Journal voucher entry + approval workflow
- [x] FR-GL-03: Chart of accounts configuration
- [x] FR-GL-04: Financial statement generation
- [x] FR-GL-05: Reconciliation against Billing's patient revenue — build
      this integration deliberately, not as an afterthought; two
      disconnected ledgers defeats the point of this module

### 2.7 Sub-store Management (new)
- [x] Sub-store/requisition entities + migrations
- [x] FR-SS-01: Ward/department-level stock view
- [x] FR-SS-02: Requisition from central store
- [x] FR-SS-03: Ward-level reorder point tracking
- [x] FR-SS-04: Stock adjustment with mandatory audit log entry

### 2.8 Build Group 1 exit criteria
- [ ] Full patient journey (Registration → Admission → Vitals/Meds →
      Discharge → Billing → Payment) works end-to-end without manual workaround
- [ ] Every invoice traceable to the clinical activity that generated it
- [ ] Every financial edit/delete produces a complete audit record
- [ ] RBAC matrix tested for all Group 1 roles/actions
- [ ] Accounting's ledger reconciles against Billing's revenue with zero
      unexplained variance
- [ ] Internal QA pass against documented assumptions (no hospital sign-off yet — that happens after full build, see §6)

## 3. Build Group 2 — Clinical & Insurance Workflow

*(Detail each module's tasks here once Group 1 is stable — see
`docs/03_SRS.md` §2 for the current high-level requirement list to expand
from: Laboratory, NHIA/HMO, GOPD, Radiology)*

- [x] Expand `docs/03_SRS.md` §2 into detailed FR list for these 4 modules

### 3.1 Laboratory (LIS)
- [x] Lab catalog/requests/results entities + migrations (Go owns migrations)
- [x] FR-LAB-01: Lab test catalog management (Python service)
- [x] FR-LAB-02: Lab request creation and queue (Python service)
- [x] FR-LAB-03: Sample collection tracking (Python service)
- [x] FR-LAB-04: Results entry, verification, and audit-log check (Python service)

### 3.2 NHIA / HMO Claims
- [x] Providers/claims entities + migrations (Go owns migrations)
- [x] FR-HMO-01: HMO provider management (Python service)
- [x] FR-HMO-02: Verify patient coverage (Python service)
- [x] FR-HMO-03: Generate claim from invoice (Python service)
- [x] FR-HMO-04: Claim status tracking and response batching (Python service)

### 3.3 GOPD Queue / Consultation
- [x] Queue/consultation entities + migrations
- [x] FR-GOPD-01: Add patient to queue + triage priority (Go service)
- [x] FR-GOPD-02: Active queue visibility by department (Go service)
- [x] FR-GOPD-03: Doctor consultation (chief complaint, diagnosis, notes) (Go service)
- [x] FR-GOPD-04: Wire consultation to Pharmacy/Lab/Radiology requests (Go service)

### 3.4 Radiology / Imaging
- [x] Requests/reports entities + migrations (Go owns migrations)
- [x] FR-RAD-01: Radiology request creation and queue (Python service)
- [x] FR-RAD-02: Perform imaging / DICOM stub (Python service)
- [x] FR-RAD-03: Radiologist reporting and verification (Python service)

### 3.5 Build Group 2 exit criteria
- [x] Internal QA pass on Build Group 2 (no hospital sign-off yet)

## 4. Build Group 3 — Specialized Departments & Operations

*(Detail each module's tasks here once Group 2 is stable — see
`docs/03_SRS.md` §3 for the module list to expand from)*

- [x] Expand `docs/03_SRS.md` §3 into detailed FR list for these 9 modules
- [ ] **Theatre implementation**
  - [x] Schema / Migrations for theatre scheduling & logs
  - [x] FR-THE-01: Surgery Scheduling API
  - [x] FR-THE-02: Pre-op Checklist API
  - [x] FR-THE-03: Intra-operative Notes API
  - [x] FR-THE-04: Post-op Recovery API
- [ ] **Maternity implementation**
  - [x] Schema / Migrations for antenatal, delivery, and postnatal tracking
  - [x] FR-MAT-01: Antenatal Care (ANC) API
  - [x] FR-MAT-02: Delivery Record API
  - [x] FR-MAT-03: Postnatal Care API
- [x] **Accident & Emergency (A&E) implementation**
  - [x] Schema / Migrations for triage, emergency beds, and stabilization logs
  - [x] FR-AE-01: Rapid Triage API
  - [x] FR-AE-02: Emergency Bed Allocation API
  - [x] FR-AE-03: Stabilization Notes API
- [x] Mortuary implementation
  - [x] Schema / Migrations for body logging and storage tracking
  - [x] FR-MOR-01: Body Logging API
  - [x] FR-MOR-02: Storage Tracking API
  - [x] FR-MOR-03: Body Release API
- [x] Audit Department dashboard implementation
  - [x] FR-AUD-01: Log Viewer
  - [x] FR-AUD-02: Advanced Filtering
  - [x] FR-AUD-03: Anomaly Reports
- [x] HR & Staff Management implementation
  - [x] Schema / Migrations for duty roster and leave requests
  - [x] FR-HR-01: Staff Profiles API
  - [x] FR-HR-02: Duty Roster API
  - [x] FR-HR-03: Leave Tracking API
- [x] Reporting & Analytics implementation
  - [x] FR-REP-01: Financial Reports
  - [x] FR-REP-02: Clinical Census
  - [x] FR-REP-03: Performance Metrics
- [x] Inventory & Procurement implementation
  - [x] Schema / Migrations for central store catalog and purchase orders
  - [x] FR-INV-01: Central Store Catalog API
  - [x] FR-INV-02: Procurement & POs API
  - [x] FR-INV-03: Stock Receiving API
  - [x] FR-INV-04: Sub-store Issuance API
- [x] Security/System Administration implementation
  - [x] Schema / Migrations for global configurations
  - [x] FR-SEC-01: Global Configuration API
  - [x] FR-SEC-02: RBAC Management API
  - [x] FR-SEC-03: User Provisioning API
- [ ] Internal QA pass on full 20-module system (no hospital sign-off yet)

## 5. First Hospital Engagement (only after all 20 modules pass internal QA)

- [ ] Demo-ready build of the complete system with synthetic data
- [ ] Approach target hospital with the full working system (not a partial one)
- [ ] Interviews with department heads to validate the assumptions logged in §1
- [ ] Resolve every open `[VALIDATE WITH HOSPITAL]`/`[UNRESOLVED]` item against real answers
- [ ] Adjust build to match confirmed requirements (expect rework here —
      this is the tradeoff of validating after building instead of before)

## 6. Migration & Go-Live (this specific hospital, once engaged)

- [ ] Legacy data export + field mapping (`docs/08_ROADMAP_PHASES.md` §3)
- [ ] Migration script built + tested against staging
- [ ] Dry-run migration, validate <1% discrepancy
- [ ] Parallel run with legacy system, 2–4 weeks
- [ ] Department head sign-off on parallel run accuracy
- [ ] Cutover — legacy system set read-only/archival
- [ ] Rollback plan documented and rehearsed
- [ ] Full system go-live

---

**Housekeeping:** when a task reveals a new requirement, sub-task, or a
question that needs hospital input, add it under the relevant section
here (or as a new `[UNRESOLVED]` note in `PRD.md` if it's a business
decision) rather than resolving it silently.

## Local team integration verification (2026-10-01)

- [x] Verify Group 1 mock patient journey and fix frontend failures; see frontend/QA_GROUP1.md.
- [x] Merge all four fetched feature branches into local main, resolve frontend conflicts, preserve original commit objects and contributor metadata. No push performed.
- [x] Verify merged frontend: 13 tests, production build, and browser navigation; Python: 32 tests pass.
- [x] Run Go and database-backed cross-service tests in disposable PostgreSQL (2026-10-06); complete Go race suite and real Python-to-Go cases passed. See AUDIT_FIXES.md.


## Full project audit follow-ups (2026-10-06)

- [x] Complete full project source audit, branch integration review, builds/tests, dependency scans, and isolated synthetic reproductions. See `PROJECT_AUDIT.md` for scope, evidence, 31 findings, and verification limits.
- [x] A01–A04: Contain wallet webhooks by disabling them until provider selection; add positive-money constraints, module RBAC, atomic data/audit transactions, and real PostgreSQL failure/denial tests. Owner approved transaction support in the existing writer; original behavior/tests retained.
- [x] A05–A07, A17–A18: Integrate reviewed Group 1 backend branches, align successful frontend/API contracts and container routing, and separate demo/local fallback behavior from authoritative clinical and financial actions.
- [x] A08–A11, A26: Correct repeated journal posting, silent persistence failures, NHIA payable/rounding calculations, period-aware statements, and ledger validation; verify business logic and reconciliation.
  - [x] A08–A11: Prevent repeated journal posting; propagate storage write errors; calculate backend payments against NHIA-adjusted payable; calculate demo coverage in kobo; add regressions.
  - [x] A26: Validate journal account/amount entries, fix cash contra posting direction, and compare balance at kobo precision. Historical/period-aware reporting remains open.
- [ ] A12–A13: Enforce the recorded clinician-folder deposit gate and 100% discharge trigger. Resolve any proposed override as an explicit decision; retain A&E exemption and do not silently choose new policy.
  - [x] Enforce positive-deposit/explicit-A&E rule in supported clinical folder paths; replace payment-status stub. Owner disabled automatic consolidation pending approved tariffs; remove Matron override from invoice eligibility.
- [x] A14–A15, A21, A31: Add atomic bed allocation, patient/admission/invoice ownership checks, valid financial transitions, missing Group 1 clinical flows, input validation, durable numbering, and per-mutation tests.
  - [x] Add admission row locking and database uniqueness, financial ownership/overpayment checks, guarded invoice transitions, database document sequences, and tests for all exposed Go module mutations. Clinical completion/sign-lock APIs remain open. [FIXED]
- [ ] A19, A24–A25: Establish least-privilege service database roles, complete schema attribution/soft-delete constraints, unify per-user RBAC resolution, and provide secure initial user/permission provisioning.
- [x] A20, A23: Check current active user/role at protected Go module and Python authorization boundaries; reject missing expiry, wrong audience, and invalid identity claims. Add Go and real cross-service revocation regressions. Individual token/session revocation remains a separate admin capability.
- [ ] A22, A27: Review and patch Go toolchain/dependency advisories and the Tailwind build-chain advisory; lock reviewed Python and container dependency versions. Do not treat scanner call-graph matches as demonstrated exploits.
  - [x] Patch Go toolchain/pgx/x/text and Tailwind dependency chain; add Python 3.12 dependency lock; pin Go build image. Reachable Go scan and npm audit pass. Full container digest/OS scanning remains open.
- [ ] A28: Run frontend tests in CI, add required lint/type gates, and make the backend branch gofmt-clean.
  - [x] Run frontend regressions with npm ci in CI; format imported backend; verify Go vet and strict frontend TypeScript. Python lint/type gates remain open.
- [ ] Run the 17 skipped Go database cases and eight skipped Python real cross-service cases in an authorized test database; verify a real multi-user Group 1 journey before checking off exit criteria.
- [ ] A29: Supply production routing/TLS, readiness, deployment/storage configuration, and encrypted backup/restore verification before deployment.
- [ ] A30: Restore authoritative referenced docs and reconcile stale task/QA claims; complete patient-data validation of client material before committing it. No deletion is authorized by this audit.
