# Group 1 mock patient journey verification

Verified 2026-09-29/30 against draft PR #3 (`feat/group-1-medical-records`, base commit `3f5af81`). All fixes remain local and confined to `frontend/`. No branch was pushed or merged.

## Results and fixes

| Flow | Failure found | Local fix / verification |
| --- | --- | --- |
| Medical records (FR-MR) | Photo absent; downstream selectors used unrelated static patients | Optional bounded image upload and ID card photo; shared MPI options retain patient ID and MRN. Registration/card persistence and photo payload covered by regression tests. |
| Appointments (FR-AP) | New patients unavailable; slots ignored date; stale roster; double booking possible | Live MPI options, rolling mock availability, date/doctor matching and capacity validation. Browser booked Journey Testpatient as APT-2026-0092. Reschedule/cancel validation covered by tests. |
| Nursing (FR-NS) | Admission invented patient identity; handover only showed existing signed fixture | MPI admission selection and bed checks; outgoing handover captures current inpatients, requires different incoming nurse. Browser verified admission, abnormal 160/100 vitals, locked signed note, and dual handover signatures. |
| Discharge (FR-NS / FR-AC) | Trigger returned a fabricated invoice reference and left bed occupied | Revalidate six checklist items or documented override, create one real invoice for the admission, release bed to cleaning. Browser observed disabled trigger at 0/6, enabled at 6/6 and actual invoice. Existing documented decisions retained: complete checklist or Matron/Doctor override; deposit nonblocking, A&E exempt. |
| Billing (FR-AC) | Hardcoded admission import; duplicate imports; invalid payments accepted; receipt hidden by print CSS | Patient-specific admission import, explicit admission-linked charges, idempotent invoice creation, amount checks, printable receipt visibility. Browser paid INV-2026-324718 for HOSP/2026/010006 in full (NGN 27,500), receipt RCP-2026-55016, zero remaining balance. |
| Pharmacy (FR-PH) | Negative/over dispensing and bypassed allergy guard; override leaked between patients | Validate positive integer quantities, remaining prescription, drug and stock; enforce existing allergy override rule in mock API; reset override per prescription. Browser dispensed seeded Amina Bello prescription RX-2026-004101. Regression tests cover stock and explicit admission billing association. |
| Accounting (FR-GL) | Billing receipts absent from reconciliation; posting did not update balances; duplicate posting; seed imbalance | Import actual local receipts, idempotent posting, cash/bank destination and revenue balance updates, negative balance handling, current surplus in balance sheet, corrected synthetic opening balance. Browser matched Journey receipt at NGN 27,500; trial balance debit/credit both NGN 408,977,500, difference zero. Other seeded unposted receipts correctly remain outstanding. |
| Sub-store (FR-SS) | Repeated fulfillment increased stock twice; SKU lookup crossed ward boundary | Idempotent fulfillment, ward-scoped lookup, valid quantities and retained audit writer. Browser fulfilled REQ-2026-0079, gauze 8 to 48, then adjusted to 47 with mandatory explanation visible in audit ledger. |
| Fallback | Backend validation/auth rejection silently became local success; mutable fixtures contaminated tests | Non-404 HTTP 4xx errors propagate, bounded request timeout, cloned seed data. Network/404/5xx fallback remains for this demo. |

## Reproduce

Use synthetic data only. From `frontend/`, run `npm ci`, `npm test`, `npm run build`, and `npm run dev -- --host 127.0.0.1 --strictPort`. Open localhost:5173 with the backend unavailable to exercise the existing fallback. Storage is browser-local; use a fresh browser profile for pristine fixtures. Do not reset someone else's records.

1. Register a patient, preview ID card, select that patient for an available dated appointment.
2. Admit the same MPI patient to an available bed. Record vitals, sign a nursing note, create outgoing handover and countersign as a different nurse.
3. Confirm discharge billing is blocked until checklist completion or a documented override; complete it and generate the invoice.
4. Collect payment in Billing and preview the receipt. In Accounting, post that receipt and inspect matched amount and financial statements.
5. Separately dispense a seeded prescription. Fulfill a ward requisition and make a justified physical stock correction; inspect its audit entry.

`npm test`: **13/13 passing**, including invalid amounts, allergy guard, capacity, duplicate actions, NHIA calculations, negative ledger balances and failed backend requests. `npm run build`: passed TypeScript and Vite production build; Vite still warns about the existing large JS chunk. `git diff --check`: passed. These are mock service regression tests plus manual browser checks, not a production backend integration suite.

## Remaining integration work

- The documented newly registered patient -> new prescription step has no prescribing workflow in Group 1. Group 2 clinician/backend work must create a prescription carrying the correct patient and admission IDs. No clinical order was invented to conceal this gap. Pharmacy billing includes only explicitly admission-linked dispensed items.
- Drug interaction checking, actual reminder delivery, real authentication/authorization, durable server audit and multi-user concurrency need backend integration. Role Preview and local data are demonstrations, not production controls.
- The fallback still activates on network/404/5xx failures by design; it must not be treated as authoritative clinical or financial storage. Backend behavior was not certified.
- Photo persistence was tested programmatically; physical card/receipt printing, camera capture, barcode scanning and full browser upload were not verified. The QR/barcode mock is not a validated scanner payload.
- Billing rates, NHIA coverage and aggregate revenue posting retain existing demo assumptions. Corrected accounting opening balances apply to fresh mock storage; existing persisted ledgers are not silently rewritten.

See the accompanying branch-conflict report before integrating team branches. A clean textual merge does not prove runtime/API compatibility.
