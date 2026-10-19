# Pull request audit and integration — 2026-10-09

Scope: the 12 open proposals (#5–#16) against main 4f314c2, plus the pending authorized safety remediation patch. This is a source, contract, build and test review; it is not hospital acceptance or a production-readiness certification.

## Findings and disposition

| PR | Module | Reviewed result |
|---|---|---|
| #5, #7 | NHIA/HMO | Both original histories retained. #7 refines the same UI and removes untyped catches; combined duplicate routes resolved. UI lacks invoice-linked submission and matches neither current claim schema nor coverage-verification API. Explicit demo preview only in production routing. |
| #6 | Radiology | Standalone synthetic worklist and simulated completion. Replaced unjustified `any` with the study type; production cannot render or mutate the simulated worklist. Live request/report/PACS integration remains open. |
| #8 | Theatre | Frontend booking/checklist/PACU shapes and paths differ from current Go surgery records. Preview API entry points blocked outside explicit demo mode. |
| #9 | Emergency | Unrestricted browser triage, bed allocation and medication updates; backend uses different A&E contracts. Browser seeding and mutations blocked outside explicit demo mode. |
| #10 | Maternity | Browser-only ANC visits/status and backend delivery/PNC mismatch. Preview API entry points blocked outside explicit demo mode. |
| #11 | Mortuary | Failed/denied requests previously created synthetic records and could fabricate financial clearance. Credentialed production requests now reject without browser writes; intake/autopsy use persisted, audited backend contracts. Unknown release/billing/chamber decisions stay unavailable. |
| #12 | Audit | Missing records passed fake seal verification; every row was labelled verified. All claims corrected to unavailable/unverified. Actual log filters, exceptions, review and metrics use Go data and RBAC. No audit writer changes. |
| #13 | HR | Production errors previously hydrated browser staff/leave/shift records. Persisted staff, shifts, soft deletion, pending leave and metrics now use Go transactions and audit. Approval rules remain unknown and disabled. |
| #14 | Inventory | Negative issuance increased stock, over-issue silently clamped, and rejected/partial receipt fulfilled every order. Synthetic regressions fixed. Production uses backend catalog, draft orders, audited signed adjustments, vendors and metrics. Approvals, receiving and issuance remain policy gated. |
| #15 | Reporting | Browser data and arbitrary period multipliers appeared authoritative after API errors. Explicit synthetic preview only; authoritative aggregation remains open. |
| #16 | Administration | User lock, password reset and RBAC changes changed browser storage rather than authority. Production entry points blocked; no new backend auth pattern or permission bypass introduced. |

All proposed commits are preserved by merge ancestry; no squash, rebase, author rewriting or branch deletion is used. All 20 module cards/routes are retained. Original feature code remains available in explicit demo mode. A production build defaults to demo mode disabled. Seven screens display unavailable integration status, rather than simulated hospital actions.

## Shared main regressions corrected

- Existing accounting/substore Go formatting caused CI to fail before tests.
- Python test collection imported required configuration without synthetic test secrets. CI now supplies test-only JWT/internal keys and the test database URL.
- Existing frontend negative-balance and period/date tests mismatched the real posting model. Restored exact period-boundary/reconciliation coverage and rejection handling.
- Python-owned tables were missing Go-owned migrations. Migration 000019 creates them, and 000020 creates the four operations foundations without ORM schema creation.
- Python mutations require Go authorization and audit acknowledgement before data commits. Tests cover every mutating Lab/NHIA/Radiology route against the actual running Go endpoints.

## Backend boundaries

New operations use JWT plus active-user database permission resolution. Permissions are registered for module `read`, `write`, `approve`; no new staff role grants are guessed. Existing ADMIN behavior is preserved. Data and audit commit in one PostgreSQL transaction through the existing writer. Clinical/financial records are not hard-deleted. Costs use Go Decimal and NUMERIC, JSON money is emitted exactly, actors come from authentication, and stored timestamps use UTC.

The owner does not yet know payment/coroner body release, leave approval, or purchase approval requirements. Those actions return audited HTTP 501 with `HOSPITAL_POLICY_NOT_CONFIGURED`. Chamber assignments also require provisioned slots; goods receipts and issuance require approved posting rules/mappings. No payment clearance is inferred from autopsy completion. Mortuary fee accrual and days billed are null with `storageBillingStatus=NOT_CONFIGURED`, not invented zero totals. Audit integrity status is `UNAVAILABLE`; existing-log verify returns 501 with `valid:false`, nonexistent logs return 404. No SHA-256 writer/chain is claimed.

Python data and Go audit still use separate HTTP/database commits: acknowledgement-before-commit is fail-closed for audit outages but is not distributed atomicity. This limitation remains tracked.

## Verification

- Frontend: strict TypeScript + production build; 28 tests pass (18 journey, 2 existing production, 4 PR production, 4 synthetic stock/audit/CSV regressions).
- New production tests exercise 40 live API entry points against 400/401/403/404/409/422/429/500/501/503 and network failure, proving credentials are attached and no browser writes occur; preview operations cannot issue production requests.
- Go: complete race suite with real PostgreSQL, active-user/RBAC and audit writer checks; new operations test covers all 14 enabled mutations, every blocked action and 19 read paths. Audit INSERT denial must leave module data unchanged. Exact money validation and malformed-object tests included.
- Python: 54 tests pass, including actual HTTP Go authorization and audit requests for all 11 mutating interop actions.
- Go vet, formatting and diff whitespace checks; npm install audit reports zero known vulnerabilities.
- GitHub CI validation recorded with the final integration commit before main is advanced.

Limits: no full browser automation or hospital end-to-end acceptance was performed in this merge review. Dependency vulnerability reporting is not a complete container/OS scan. Existing deployment, authoritative specification, role provisioning and distributed audit atomicity tasks remain open.

## Original branch heads retained

| PR | Original head | Branch |
|---|---|---|
| #5 | `84004c76a9323c824846dfe07d220e2cb9095d1a` | `feat/group-2-nhia-claims` |
| #6 | `fffd889489d6c02edd8ea4c22de9a562793d86b4` | `feat/group-2-radiology` |
| #7 | `9129ebb6d460d0d124d0c15d849972ba389dc4a4` | `feat/group-2-nhia-clean` |
| #8 | `a6a7daa2d7b3d23b6628ffc59bc3529befb1d81f` | `feat/group-3-theatre` |
| #9 | `a1ead42620aacdd3c6d4c793575ded833d7ee771` | `feat/group-3-emergency` |
| #10 | `25e1ecca5999ae8820d83ad2525cfe0efc03ff87` | `feat/group-3-maternity` |
| #11 | `3e5c5578b7dd421badd3924b9abb818af6445e3a` | `feat/group-3-mortuary` |
| #12 | `e822356fd24fb5dde8bbdacb445a18bafb76c8e4` | `feat/group-4-audit` |
| #13 | `5bd7dd86b9530a1dc452fb2e3920798fc98d713e` | `feat/group-4-hr` |
| #14 | `f3c603f87940cfe95e98cfcdb0da6a472978e87a` | `feat/group-4-inventory` |
| #15 | `4e43e13c41c28af3100ea9e308bd9f24441ea101` | `feat/group-4-reporting` |
| #16 | `f238ee7152b62f13fb9b4f825a215d6b194c2fd4` | `feat/group-4-admin` |
