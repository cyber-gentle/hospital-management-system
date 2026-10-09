# Audit remediation — 2026-10-06

This records the fixes following `PROJECT_AUDIT.md`. The original audit is
historical evidence; this file describes the resulting working tree. Changes
are committed after a history-preserving merge of the original backend branches. No production deployment or patient database was
accessed. Existing user files and earlier migrations were preserved.

## Implemented and contained

| Findings | Result |
|---|---|
| A01 | Wallet webhook returns 503 before parsing or crediting events. A provider-verifier interface and durable reference table exist for future integration; no provider is configured. |
| A02 | Payments, deposits, and funding require positive decimal amounts at kobo precision. Invoices reject negative charges, invalid quantities, excessive coverage/discounts, and numeric overflow. New database constraints protect subsequent writes. |
| A03–A04 | Medical Records, Nursing, and Billing routes enforce permissions. All 14 enabled clinical/financial mutations write their audit entry inside their data transaction. Audit failure rolls back data, balances, and bed changes. ID-card audit failure also rejects the request. The owner explicitly authorized transaction support in the existing writer. |
| A05 | Merged the original Medical Records/Nursing/Billing backend history through the reviewed Group 3 branch, preserving original commit hashes and authors. Audit fixes follow that merge as a separate commit. |
| A06–A07 | Normal builds require backend login and cannot turn HTTP/network failures into local success. Browser-only workflows require explicit `VITE_DEMO_MODE=true`; role preview and synthetic records are confined to that mode. Missing production workflows refuse execution. Full frontend/backend integration remains open. |
| A08–A11 | Journal approval posts once; storage setters report failure; backend payments use total less NHIA coverage; demo NHIA arithmetic uses kobo rather than whole-naira rounding. |
| A12–A13 | Supported clinician folder paths require a positive deposit or explicit A&E ward marker. Admission ownership is checked. Payment status queries real deposits/invoices. Automatic consolidation is disabled pending approved tariffs, per the owner. Matron override no longer substitutes for 100% completion in invoice eligibility. |
| A14–A15, A31 | Patient/bed locks and unique active-admission indexes prevent duplicate occupancy. Payments reject patient mismatch, deleted/cancelled invoices, and overpayment. Invoice payment state cannot be arbitrarily changed. Patient, invoice, receipt, and deposit receipt numbers use database sequences. |
| A16, A21 | The Laboratory scaffold returns 501 and records an unsuccessful attempt instead of falsely returning “created.” Unassessed backend patients are labelled “Not assessed,” rather than “Stable.” Actual laboratory persistence and missing clinical flows remain open. |
| A18 | Development proxy uses configured service URLs; Docker uses service hostnames. Laboratory/NHIA/Radiology paths route to Python. Production routing remains open. |
| A19, A20, A23–A24 | Added a database TRUNCATE guard for audit logs. Protected Go module requests and Python authorization calls resolve the live user's active state and role; individual permission grants work across the boundary. JWTs require expiry/audience and valid identity. Least-privilege DB roles and secure provisioning remain open. |
| A22, A27 | Go 1.26.8, pgx 5.9.2, x/text 0.39.0, Tailwind 4.3.3, and a resolved Python 3.12/Linux lock. Go builder image is pinned. Runtime services run without root; Python auto-reload is disabled. |
| A26, A28 | Journal/account validation and cash contra direction corrected; balance checks use kobo. CI runs frontend tests with `npm ci`; Go formatting and vet pass. Period-aware accounting and Python lint/type gates remain open. |

Owner decisions are recorded in `ASSUMPTIONS.md`.

## Verification

- Entire Go suite passes with `-race` against real PostgreSQL, including
  fresh-schema migrations, audit commit/rollback, genuine audit permission
  failures, every module mutation's RBAC denial, deposit/exemption rules,
  NHIA payments, ownership, and simultaneous bed allocation.
- All 46 Python tests pass against the real Go process and PostgreSQL, including
  actual interop-route audit/authz calls, individual grants, and revocation.
- All 20 frontend tests pass, covering synthetic journeys, financial regressions, and a
  separate production bundle that rejects fallback/local writes.
- Strict TypeScript/Vite production build passes. A large-bundle warning
  remains; no end-to-end hospital browser journey is claimed.
- `govulncheck` reports zero reachable symbol vulnerabilities. It still
  reports advisories in unused imported packages/modules; this is not a
  claim that every transitive advisory disappeared. `npm audit` reports zero.

The Tailwind migration follows its [official upgrade guide](https://tailwindcss.com/docs/upgrade-guide).
Its browser baseline is Safari 16.4+, Chrome 111+, and Firefox 128+; confirm
hospital workstation compatibility before deployment. Go versions were
checked against the [official release catalog](https://go.dev/dl/).

## Remaining work

Production readiness is **not** complete. Keep these audit tasks open:

- A06/A17/A21: Finish authoritative frontend contracts and backend clinical,
  pharmacy, appointments, accounting, and inventory workflows. Demo journeys
  cannot substitute for those integrations.
- A12/A13/A16: Supply approved tariffs/billable mappings, implement eventual
  100%-checklist consolidation with source linkage/idempotency, and implement
  real laboratory persistence. Wallet provider selection remains outstanding.
- A19/A24/A25: Separate migration/Go/Python database privileges, supply secure
  initial user/permission provisioning and the approved hospital RBAC matrix,
  and complete attribution/soft-delete integrity. The development Compose
  bootstrap database user still has excessive privileges.
- A26/A28: Implement period-aware ledger reporting and remaining lint/type
  gates. Demo multi-key storage is not an atomic ledger.
- A29/A30: Configure production TLS/routing/readiness, approved infrastructure
  and backup/restore procedures; restore authoritative missing specifications
  and complete hospital/privacy validation.

Migration 000012 refuses existing conflicting active admissions rather than
rewriting clinical records. New monetary checks are NOT VALID for historical
rows; investigate legacy exceptions before validating them. Apply all forward
migrations before starting the updated services. Rollbacks that remove
clinical or financial schema/data need explicit approval.

For development only, run the synthetic UI with `VITE_DEMO_MODE=true npm run dev`.
Normal builds default to demo mode off. The new login needs a legitimately
provisioned hospital user; no default credentials were introduced.

## Branch-update regression fixes — 2026-10-08

After updating main to 4f314c2, restored rejection of validation, conflict and
throttling responses in the explicit demo fallback. Corrected accounting period
boundaries to UTC, retained posted-ledger calculations, and covered negative
balances through actual dated postings rather than editing the balance cache.
Reports default to the current UTC month. Reconciliation uses payment dates,
includes payments against older invoices, and filters both totals and displayed
items to the selected period without discarding other months from storage.

Forward migration 000019 creates all seven Python module tables and the
Radiology status enum through the existing Go migration runner. It includes
foreign keys, decimal monetary columns, UTC timestamps and soft-delete fields.
No ORM schema creation or destructive rollback was added.

All 11 Python mutations now require a successful Go audit acknowledgement before
committing data. A lab request and its results are saved together. Audit failures
roll back pending changes. Radiology now enforces a false Go authorization
decision, including live account revocation. Soft-deleted records are excluded
from updates; Lab and Radiology timestamp defaults use timezone-aware UTC.
The legacy laboratory order scaffold retains its explicit audited 501 response;
the implemented requests API is the persistence path.

**Remaining transaction limit:** the Go audit HTTP write and Python SQL commit
are separate transactions. A pre-commit SUCCESS audit entry includes
`commit_phase: before_database_commit`; it is not proof of a completed database
commit. A caught SQL commit failure appends a FAILURE entry when Go remains
reachable. Process termination or an ambiguous database acknowledgement still
needs transaction coordination/reconciliation before distributed atomicity can
be claimed. Python never writes audit rows directly and the Go writer is unchanged.

Verification: 20 frontend tests and the production build pass; Go tests pass
with the race detector against an isolated PostgreSQL database; all 54 Python
tests pass. The cross-service regression exercises every Python mutation with
real Go authorization denial, real audit-key rejection and a successful audit
write, then inspects PostgreSQL to prove denied/failed attempts changed no module
data. The fresh database uses repository migrations exclusively. Existing bundle
size and Python deprecation warnings remain non-fatal. Test data is synthetic.

## PR integration remediation (2026-10-09)

Reviewed all 12 proposals #5–#16, retained original commit ancestry, and corrected common CI regressions. Added atomic audited Go foundations for Mortuary, Audit, HR and Inventory, credentialed frontend access, no production browser success after rejection, honest unavailable audit verification, nullable unconfigured mortuary accrual, and synthetic stock receipt/issuance regressions. Policy-dependent writes remain audited 501 responses. Seven incomplete screens remain explicit demo previews; merging their source does not complete hospital workflows.

Verification: full PostgreSQL-backed Go race suite, Go vet, exact-money/operations denial tests, 54 Python tests including real Go calls, 28 frontend regressions and strict production build. See PR_MERGE_AUDIT.md and BACKEND_OPERATIONS_ROUTES.md for scope, original heads, API states and outstanding work. User design-reference files and personal .gitignore edits are excluded.
