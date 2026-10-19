# Authentication security — FR-SEC-01 / FR-SEC-03

Owner decisions (2026-10-17): authenticator-app MFA for all staff, a fifteen-minute
lockout after five consecutive failed sign-ins, and a thirty-minute server idle
timeout. Administration displays the persisted policy read-only; it cannot disable
MFA or weaken these values.

## Sign-in and recovery

`POST /api/v1/auth/login` accepts username, password and an optional `code`.
A valid password alone returns `mfa_required`, never an access token. First
enrollment supplies a base32 setup key. Confirming its six-digit TOTP creates the
session and returns ten backup codes once. Setup responses use `Cache-Control:
no-store`; the browser holds setup material only in component memory. Secrets
are encrypted with AES-256-GCM and bound to their account; backup codes are hashed.

TOTP uses RFC 6238's SHA-1/six-digit/thirty-second profile with one adjacent step
of clock tolerance. The accepted step is persisted to reject replay. Enrollment,
code consumption, failure counters, session creation and their audit events are
transactional. Account row locks serialize attempts. Password and second-factor
failures share the counter; only complete authentication resets it. Locked
attempts do not extend the lockout. Timed lockouts expire automatically.

ADMIN may clear a lockout with an audited reason using
`POST /api/v1/admin/security/users/:id/unlock`; MFA and active/inactive state remain
in force. Lost-authenticator recovery uses a password and single-use backup code,
or another ADMIN verifies staff identity and calls
`POST /api/v1/admin/security/users/:id/reset-mfa` with a reason and
`identity_verified: true`. Self-reset is forbidden. Reset revokes all earlier
sessions and backup codes and requires enrollment again. It does not activate an
inactive account or clear a lockout. AUDITOR can review policy but cannot mutate.
There is no emergency MFA bypass.

## Session authority

JWT `jti` identifies a Go-owned `auth_sessions` record. Go checks active account
state, session generation, completed MFA, absolute expiry and idle expiry before
authorization. Valid server requests update last activity; an expired session
cannot be revived. The existing twenty-four-hour absolute JWT lifetime remains.
Idle means no authorized server activity; background requests count as activity.
This is not a keyboard/mouse inactivity detector.

Every Python module forwards the verified session ID and generation to Go's
`/internal/authz/check`. Python neither writes security state nor independently
decides session lifetime. Login and administrative changes use the unchanged
Go audit writer. The legacy password-only handler remains in source for existing
regression tests but is not registered by the server; its tokens cannot pass the
new session authority.

## Deployment

1. Generate a separate `MFA_ENCRYPTION_KEY` using `openssl rand -base64 32`. Store
   it securely in the Go deployment environment, retain it across restarts, and
   back it up separately from the database. Never commit it. Changing it without
   migrating encrypted secrets prevents existing authenticators from being
   decrypted. Routine JWT-key rotation must leave this key unchanged.
2. Apply migration `000025_authentication_security.up.sql` and deploy Go, Python
   and the frontend together. Go refuses startup if the key is missing/malformed.
   Authentication fails closed when its database or audit write is unavailable.
3. Existing tokens lack registered MFA sessions and will be rejected. All staff,
   including administrators, must sign in and enroll. Named administrators should
   retain their backup codes so they can assist other staff.
