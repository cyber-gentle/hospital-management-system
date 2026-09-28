# AGENTS.md — Guardrails for AI Coding Assistants
## Hospital Information Management System (HIMS)

> This file applies to any AI coding assistant working on this repository
> (Claude Code, Cursor, etc.). If a tool reads `.cursorrules` instead,
> that file should mirror this one — keep them in sync, or symlink.

---

## Hard rules — never violate these

1. **Never delete code, files, or database migrations without asking
   first**, even if a task seems to imply cleanup is needed. Propose the
   deletion and wait for confirmation.
2. **Never modify or bypass the audit-log writer.** Every mutating
   endpoint on clinical or financial data must call it. Do not "optimize"
   it away, make it conditional, or skip it for "internal" actions.
3. **Never hard-delete a clinical or financial record.** Use the
   soft-delete pattern (`deleted_at`) defined in `ARCHITECTURE.md`.
4. **Never implement the discharge→billing trigger or the admission
   deposit gate** without an explicit decision on record (see `PRD.md`
   "Two integration decisions"). If asked to build either, ask which
   behavior is wanted rather than picking one.
5. **Never introduce a third backend service, database, ORM, or auth
   pattern** beyond the two-service split (Go core + Python interop)
   already defined in `ARCHITECTURE.md`, without updating that file first
   and getting confirmation.
6. **Never invent a new module** outside the 20 listed in `PRD.md`
   without explicit instruction.
6a. **Never add multi-tenancy** (tenant IDs on shared tables,
   hospital-switching, cross-hospital queries). This system is reused
   across hospitals as separate single-tenant deployments, not a shared
   platform — see `ARCHITECTURE.md` "Multi-hospital note."
6b. **Never move a module between the Go and Python services** (e.g.
   adding a 4th module to `interop-py`, or moving Laboratory back to Go)
   without updating `ARCHITECTURE.md`'s module-ownership table first — the
   split is deliberately narrow (3 Python modules only).
6c. **Never let the Python service write directly to `audit_logs`,
   `users`, or permission tables, or reimplement RBAC/audit logic
   independently.** It must call the Go service's internal API
   (`/internal/audit-log`, `/internal/authz/check`) for both. This is the
   one rule that exists specifically to prevent the two services from
   drifting apart on the two things that must never disagree.
7. **Never commit secrets, API keys, or real patient data** (including in
   test fixtures — use synthetic data only).
8. **Never weaken RBAC checks** to make a feature "work" faster. If a
   permission check is blocking a task, that's a signal to ask, not to
   remove the check.

## Code standards

- **Backend is two services, not one — know which one you're in.** Go
  core (`services/core-go/`) owns 17 modules plus auth + audit. Python
  interop (`services/interop-py/`) owns exactly 3: Laboratory, NHIA/HMO,
  Radiology. Check `ARCHITECTURE.md`'s ownership table before assuming
  where a module's code belongs.
- **Go service:** standard Go conventions — explicit error handling
  (`if err != nil`, never silently discarded), `gofmt`/`golangci-lint`
  clean, no naked panics for expected error conditions.
- **Python service:** type hints everywhere, Pydantic models for
  request/response validation, no bare `except:` — catch specific
  exceptions.
- **Frontend: TypeScript strict mode** in React — no `any` without a
  comment explaining why it's unavoidable.
- Follow the folder structure in `ARCHITECTURE.md` exactly — new modules
  go in the correct service's `modules/<module-name>/` per the ownership
  table, and new frontend modules in `modules/<module-name>/`.
- Every new mutating API endpoint needs: RBAC check (local middleware in
  Go, or a call to Go's `/internal/authz/check` in Python), input
  validation, audit-log call (direct in Go, via `core_client.py` in
  Python), and at least one test.
- Prefer explicit, readable code over clever abstractions — this codebase
  will be handed over to a hospital ICT unit for long-term maintenance;
  optimize for a future maintainer who isn't the original author.
- Monetary values: `shopspring/decimal` in Go, Python's `Decimal` type in
  Python — never native floats in either.
- All timestamps: store and compute in UTC, format for display only at
  the UI layer.

## Working style

- **Work on one task at a time**, from `TASKS.md`. Don't jump ahead to
  unrelated tasks even if they seem quick.
- **Check off tasks in `TASKS.md`** as they're completed, and note any
  new tasks discovered along the way rather than silently doing extra work.
- **When a requirement is ambiguous or marked `[VALIDATE WITH HOSPITAL]`
  or `[UNRESOLVED]`** in `PRD.md`/`docs/`, stop and ask rather than
  assuming an answer — these are real open business decisions, not
  placeholders to be filled with a best guess.
- **Reference FR IDs** (e.g. `FR-NS-03`) from `docs/03_SRS.md` in commit
  messages/PR descriptions when implementing a specific requirement, so
  changes stay traceable back to spec.
- If a task requires touching a module outside the current Build Group
  (see `PRD.md`), flag that it's out of sequence before proceeding.

## Testing expectations

- Unit tests for business logic (billing calculations, RBAC permission
  resolution, audit log construction) are required, not optional.
- Any change touching the audit-log writer or RBAC guard requires a test
  proving the old behavior (logging/permission enforcement) still holds.
- **Cross-service tests are mandatory for the Go/Python boundary**: at
  least one integration test proving the Python service's
  `core_client.py` actually calls the Go service's `/internal/audit-log`
  and `/internal/authz/check` endpoints (not a local stub standing in
  permanently) for every mutating Lab/NHIA/Radiology action.

## What to do when unsure

Ask. This system handles patient care and hospital finances for a real
institution — a wrong guess here has real consequences. Prefer asking a
clarifying question over shipping a plausible-looking assumption.
