# ASSUMPTIONS.md — Decisions and Assumed Requirements
## Hospital Information Management System (HIMS)

> Running log of requirements that are ambiguous, marked
> `[VALIDATE WITH HOSPITAL]`, or `[UNRESOLVED]` in `PRD.md` / `docs/`.
>
> Two kinds of entry appear here, and they are not equivalent:
>
> - **DECIDED** — a deliberate decision, made on the date shown, by the
>   person named. Build to it exactly.
> - **ASSUMED** — no decision was made; the most defensible default was
>   picked so work is not blocked. **These still need hospital
>   validation** (see `TASKS.md` §5) and may change. Build to them, but
>   do not treat them as confirmed requirements.
>
> When a hospital answer arrives, append the outcome to the entry rather
> than deleting the original — the history of what was assumed and why is
> itself useful during migration and handover.

---

## DECIDED — Discharge → Billing trigger

**Decided:** 2026-09-28, by the project owner.
**Status:** DECIDED. Build to this.
**Affects:** FR-NS-09, FR-NS-10, FR-AC-06. Blocks nothing further.

The final itemized invoice is generated when the Discharge Checklist
reaches **100% completion**. That is the whole trigger.

There is **no nurse sign-off gate** on invoice generation.

> **This deliberately differs from the client material.**
> `Billing unit image-.../here is the step-by-step guide and.txt` states
> that the invoice generates "once the Discharge Checklist reaches 100%
> completion **and the nurse performs the final sign-off**". The owner
> chose 100%-only on 2026-09-28. Do not "fix" this back to match that
> document — the divergence is intentional.
>
> Two consequences worth remembering, since they are the reason this is
> flagged rather than silently implemented:
>
> 1. **The client document is not authoritative anyway.** It is a chat
>    transcript that accompanied the mockup PNGs — it ends by offering
>    "Would you like to know how the billing unit handles adjustments or
>    disputed charges within this specific nursing dashboard interface?"
>    It reads as generated commentary on a design, not a hospital-issued
>    specification. It is evidence of intent, not a requirement.
> 2. **The nurse sign-off at discharge still exists as a clinical action**
>    (see FR-NS-05 sign-and-lock, FR-NS-09). It is simply decoupled from
>    billing here. If the hospital later wants sign-off to gate the
>    invoice, that is a change to this decision, not a bug fix.

**Open sub-question, not blocking:** whether a *re-opened* checklist (an
item un-ticked after the invoice generated) should void or amend the
invoice. Nothing in the material covers it. Flagged for hospital
validation; build assumes the invoice stands and any correction is a
manual billing adjustment, which is auditable by construction.

---

## DECIDED — Admission deposit gate

**Decided:** 2026-09-28, by the project owner.
**Status:** DECIDED. Build to this.
**Affects:** FR-MR-06, FR-AC-08.

Enforcement is a **backend flag, checked at the API layer**. The
admission record carries the deposit state, and the relevant endpoints
refuse to proceed until it is satisfied.

There is **no hard UI lock** in the Nursing module. The UI may *show*
deposit status and warn, but it is not the enforcement point.

**A&E is always exempt** (per `PRD.md`).

This is consistent with `PRD.md`'s non-functional requirement that
"RBAC [is] enforced at the API layer, not just hidden in the UI" — the
same reasoning applies to a financial gate.

> **No client guidance exists for this one.** Unlike the billing trigger,
> nothing in the mockups or the transcript mentions deposits. The
> admission intake mockup (`Nursing Dashboard (Admission intake view).png`)
> shows a three-step form covering priority, ward/bed request, and a
> checklist — with no deposit or payment step anywhere. The PRD posed
> this as "hard UI lock vs. backend flag"; the owner chose backend flag.

> **Correction, 2026-09-29 — the design document DOES cover this, and it
> narrows the enforcement point.** An earlier revision of this entry
> claimed no material covered the deposit gate. That was wrong: it was
> based on the mockups and the billing transcript only. The project design
> document (`PROJECT University Teaching Hospital Software Design.docx`,
> Word-authored by the project team, not AI-generated like the mockups)
> states at §"Accounts Features":
>
> > "for every service that requires payment, it must be made before the
> > client proceed to the next services point; **patient on Admission will
> > be required to pay Admission deposit before the nurse or Doctor can
> > access their folder** except for Accident and Emergency Clinic"
>
> This does not contradict the backend-flag decision — an API-enforced
> flag *is* what stops the nurse or doctor reaching the folder — but it
> does change **which endpoint must enforce it**. My earlier build
> assumption ("enforcement on admission intake and ward assignment") was
> too narrow: the document gates **clinical access to the patient folder**.
> Enforcement must therefore cover the folder-access path used by Nursing
> and by Doctors, not just admission intake.

**Open sub-questions, not blocking:** how the A&E exemption is expressed
(ward type, or an explicit flag on the admission), and what "satisfied"
means for the deposit (any amount, or a configured minimum). The document
says only "pay Admission deposit" without a figure.

Build assumptions, revised 2026-09-29: enforcement on **clinician folder
access** (Nursing and Doctor paths) as the primary gate, plus admission
intake and ward assignment; "satisfied" = deposit recorded and non-zero;
A&E exemption via ward type.

**Related rule worth noting while building this:** the same paragraph
states a general payment-before-service rule — payment "must be made
before the client proceed to the next services point" — naming Record,
Pharmacy, Laboratory, Billing Unit, and NHIA as cash points. That is
FR-MR-06, and it is broader than the deposit gate. It is not decided
here; flagging it so it is not discovered late.

---

## ASSUMED — everything else in `TASKS.md` §1

Not yet written up. Tracked as open items in `TASKS.md` §1:

- RBAC role list (`docs/06_SECURITY_RBAC.md` — which does not exist yet)
- NHIA plan types
- Ward/bed count and department list for demo data

These remain **assumed**, not decided, and still need hospital
validation. Nothing here should be read as confirmed.

---

## DECIDED — Audit transaction support (2026-10-06)

The project owner explicitly approved adding transaction support to the
existing audit writer, as an exception to AGENTS.md rule 2. Preserve its
existing logging behavior and tests. Clinical and financial Go mutations
must insert their audit entry inside the same transaction before committing.
An audit failure must roll back the data mutation.

## DECIDED — Wallet webhooks disabled (2026-10-06)

Keep wallet payment webhooks disabled until a payment provider is chosen.
The public endpoint returns 503 before parsing or crediting any event. A
future provider integration must verify its signature and event contract,
use durable event idempotency, and retain transactional audit logging.

## DECIDED — Automatic discharge consolidation disabled (2026-10-06)

Disable automatic consolidation until approved tariffs and billable task
mappings are configured. Neither the backend's invented nursing-task price
nor the frontend's demo charges may generate an automatic discharge invoice.
The earlier 100%-checklist decision still defines the eventual trigger;
there is no new Matron override decision.

## DECIDED — Deposit amount and emergency exemption (2026-10-06)

The project owner selected any positive deposit and an explicit A&E ward
marker. Clinical folder access for an active admission requires a live
deposit with paid_amount > 0, unless its ward has is_accident_emergency=true.
A ward name or free-text ward type does not grant an exemption. This resolves
the earlier open sub-questions; admission intake must exist so that its
deposit can be recorded, and clinical folder access enforces the gate.
