# Preview screen integration — updated 2026-10-16

This is an integration status report, not hospital workflow sign-off. Earlier module completion checkmarks do not establish clinical or financial readiness.

| Screen | Supported live scope | Still unavailable |
| --- | --- | --- |
| NHIA/HMO | Authenticated provider directory and paginated persisted claim history; exact claim amounts | Eligibility, approved tariff mappings and live claim submission are undecided |
| Radiology | Catalog, paginated requests, registered-patient request creation and report recording with server-derived author | Formal report sign-off and PACS upload |
| Theatre | Patient-scoped booking/observation/operative/recovery notes, all marked RECORDED_UNVERIFIED | Clinical sign-off and automatic transfers |
| Emergency | Patient-scoped triage/stabilization/medication notes, all marked RECORDED_UNVERIFIED | Automatic admissions, beds/transfers and clinical sign-off |
| Maternity | Patient-scoped antenatal/delivery/postnatal notes, all marked RECORDED_UNVERIFIED | Delivery finalization, automatic transfers and clinical sign-off |
| Reporting | Explicit inclusive UTC dates for invoice totals and completed receipts; current admissions and active/occupied beds | Historical census, morbidity and performance metrics without approved definitions |
| Administration | Persisted accounts and grants; ADMIN account creation, individual grant/revocation, password reset and inactive-account reactivation; AUDITOR review only | Automatic lockout state and facility/security toggles without enforcement |

## Recorded decisions and boundaries

- Owner approved audited recordkeeping for Theatre, Emergency and Maternity only. These notes do not perform clinical state transitions or substitute for structured assessments.
- All three Go recordkeeping modules enforce existing permissions and the positive admission-deposit gate, with explicit A&E ward exemption. Record and audit insert commit together using the existing audit writer. Module permissions are registered without assigning guessed clinical staff grants.
- Owner selected ADMIN for account mutations, AUDITOR for review. Administration checks current database role after token authentication and rechecks the actor inside each mutation transaction. An AUDITOR cannot obtain mutation access through a stale ADMIN JWT or an individual write grant.
- Account passwords are bcrypt-hashed, are never returned, and are excluded from audit details. Individual grant revocation does not revoke inherited role grants. The existing ADMIN universal-access behavior is preserved.
- Owner explicitly approved the cross-service session-version change on 2026-10-16. Reset/reactivation atomically increments the account generation with the account change and existing audit insert. Go rejects stale sessions, including on /auth/me; Python forwards the signed generation to Go for the authoritative decision. Password reset preserves inactive status. Reactivation requires an inactive, non-deleted account. In-flight requests already authorized are not cancelled.
- Original detailed synthetic screens remain available only in explicit demo mode. Live views do not fall back to synthetic browser records.
- Reporting is stored activity, not recognized revenue or a reconciled ledger. Invoice issue dates and payment receipt dates are separate measures; census is current regardless of the selected financial period.
- Python calls Go for authorization and audit. Its existing acknowledgement-before-data-commit behavior remains; distributed atomicity is an existing open task.

## Verification

Focused PostgreSQL tests passed for all three clinical POST/read routes, audit failure rollback, unauthenticated/unauthorized rejection, deposit/A&E behavior, soft deletes and unchanged admission/bed/invoice state.
Reporting tests passed for exact decimal totals, date boundaries, status/deleted-row exclusions and current-role authorization.
Administration tests passed for create/grant/revoke persistence and atomic audit, AUDITOR rejection, stale role claims, duplicate/invalid inputs, password hashing and non-disclosure.
Final verification:
- Full Go race suite passed against disposable PostgreSQL, including the existing audit writer and permission enforcement tests. The initial build was interrupted for memory pressure; the successful run used GOMEMLIMIT=256MiB, GOMAXPROCS=2 and -p 1.
- go vet, gofmt and git diff whitespace checks passed.
- Python: 63 tests passed, including real Go authorization/audit calls for all mutating interop actions. Three existing dependency deprecation warnings remain.
- Frontend: 32 tests passed and the production build passed. The existing large-bundle warning remains.
- No browser end-to-end or hospital acceptance sign-off is claimed.
- Verification used synthetic records in disposable PostgreSQL. Existing contributor history is preserved; no remote state was changed.

## Account recovery deployment

Apply migration 000024 before starting the updated services (the Go startup migrator applies it). Deploy Go and Python together before using recovery actions. Do not run an old Go authorization service after enabling session revocation.

Existing JWTs without token_version are treated as generation zero. New logins carry the stored account generation. Successful reset/reactivation invalidates all earlier generations, including the caller if an ADMIN resets their own password. New credentials must be used to log in again. This extends the existing JWT mechanism and keeps Go as the only authorization authority.

The ADMIN view requires a reason for recovery and clears its password input after submission. Responses and audit payloads exclude credentials. Every Python mutation is tested against real Go authorization after revocation; a separate real HTTP scenario exercises create, login, reset, reactivation and fresh login across both services.

## Review against incoming team specifications

The feature branch incorporates origin/main through ec3e4df, preserving the four documentation commits. These documents now exist; earlier commit descriptions that said the detailed SRS was absent describe the checkout at implementation time.

The new documents require reconciliation with recorded owner decisions and implemented behavior before readiness claims can be accepted:
- docs/HOSPITAL_VALIDATION_GUIDE.md CL-01 describes a soft deposit warning. The recorded decision enforces any positive deposit at the API, with an explicit A&E ward exemption.
- CL-03 and docs/03_SRS.md FR-NS-10 describe a doctor/Matron override. The recorded decision has no override; automatic billing remains disabled pending approved tariffs.
- docs/06_SECURITY_RBAC.md lists different JWT issuer/audience/TTL values, plus mandatory MFA and automatic lockout. This change preserves the existing issuer hims-core-go, audience hims-clients and 24-hour TTL, adds session versions, and does not claim MFA, idle timeout or automatic lockout.
- The System Admin matrix omits AUDITOR read access; the owner explicitly approved ADMIN mutations and AUDITOR review.
- Recent TASKS.md completion marks do not establish end-to-end readiness of disabled workflows. The verified supported scope remains the table above.

Current SRS mapping: NHIA history partially supports FR-NH-04; Radiology request/report recording partially supports FR-RA-01/FR-RA-03 (no sign-off); reporting partially supports FR-REP-01/02; administration supports portions of FR-SEC-02/03 (no automatic lockout or temporary-password lifecycle). Clinical notes are the separately approved recordkeeping foundation, not complete FR-THE/FR-AE/FR-MAT workflow implementation. Earlier FR-HMO/FR-RAD IDs are legacy TASKS.md references.
