# Operations API foundation

All paths below are prefixed `/api/v1`. JWT authentication and an active user are required. Module capabilities are `read`, `write` and `approve`; these are configured in the existing permission tables. Registration does not grant new staff privileges. Successful writes include the existing audit writer in the same PostgreSQL transaction.

| Module | Method and path | State |
|---|---|---|
| HR | GET /hr/staff, /hr/staff/:id, /hr/shifts, /hr/leaves, /hr/metrics | Persisted reads |
| HR | POST /hr/staff; PATCH /hr/staff/:id | Validated staff profiles |
| HR | POST /hr/shifts; PATCH /hr/shifts/:id; DELETE /hr/shifts/:id | Validated shifts, soft deletion |
| HR | POST /hr/leaves | Pending request only; supplied totalDays is recorded, no balance/holiday rule invented |
| HR | PATCH /hr/leaves/:id/adjudicate | Audited 501 pending hospital approval policy |
| Audit | GET /audit/logs, /audit/logs/:id, /audit/exceptions, /audit/metrics | Authoritative reads |
| Audit | PATCH /audit/exceptions/:id | Audited review status/notes, authenticated reviewer identity |
| Audit | GET /audit/logs/:id/verify | Existing log: 501, valid=false; nonexistent: 404 |
| Inventory | GET /inventory/items, /inventory/vendors, /inventory/pos, /inventory/grns, /inventory/issuances, /inventory/metrics | Persisted reads |
| Inventory | POST /inventory/items; PATCH /inventory/items/:id | Catalog metadata; initial stock is zero; stock cannot change via metadata patch |
| Inventory | POST /inventory/items/:id/adjust | Nonzero signed integer delta + required reason, row lock, no negative resulting stock |
| Inventory | POST /inventory/vendors | Validated vendor |
| Inventory | POST /inventory/pos | Draft only; exact line/total costs calculated by server, vendor and item references checked |
| Inventory | PATCH /inventory/pos/:id/status | Audited 501 pending approval/transition policy |
| Inventory | POST /inventory/grns, /inventory/issuances | Audited 501 pending receiving/posting/mapping configuration |
| Mortuary | GET /mortuary/deceased, /mortuary/chambers, /mortuary/autopsies, /mortuary/releases | Persisted reads |
| Mortuary | POST /mortuary/admit | Server identity/tag, manual recorded daily rate, no invented storage accrual/clearance |
| Mortuary | POST /mortuary/autopsies | Autopsy + deceased status atomic; no automatic release clearance |
| Mortuary | POST /mortuary/releases | Audited 501 pending payment/coroner policy |
| Mortuary | POST /mortuary/chambers/:id/assign, /mortuary/chambers/:id/release | Audited 501 pending slots/release rules |

Requests are JSON objects, bounded to 1 MiB, with unknown fields rejected. Invalid input returns 400, unavailable references/stock conflicts 404/409, permission rejection 401/403, database/audit outages 503. No successful response is synthesized after a rejection.

Money uses NUMERIC(12,2) and decimal; supplied cost must be explicit, nonnegative, at most two decimal places and within database range. No binary floating-point backend money is introduced. Mortuary `daysInStorage` and `totalAccruedStorageFee` are nullable; `storageBillingStatus=NOT_CONFIGURED`. Audit `integrityStatus=UNAVAILABLE` is distinct from a verified seal.

Audit log filters include q, service, module, userRole, status, startDate, endDate, onlyAnomalies and actionCategory. Date filters use UTC. Log default page size is 200, max 1000, with limit/offset; the current UI export covers that returned page. Other foundation lists cap at 1000. No mock data is seeded into the database. Automated anomaly rules, roster collision rules, approved leave accounting, chamber provisioning, tariffs and receipt/transfer workflows remain follow-up work.
