# Wave 4 Step 14 — Governance & lifecycle

## Lifecycle (explicit)

| Status | Meaning |
|--------|---------|
| `reported` | Submitted (stakeholder path starts here). |
| `triaged` | Manager acknowledged / prioritized. |
| `in_progress` | Active work. |
| `resolved` | Outcome recorded (`resolution_note`, `resolved_at`, `resolved_by` required on transition). |
| `closed` | Final archive (typically after `resolved`). |

**Allowed transitions** (see `aftercare.service.ts`):  
`reported → triaged | in_progress | closed` · `triaged → in_progress | closed` · `in_progress → resolved | triaged | closed` · `resolved → closed` · `closed` terminal.

**Closure without prior resolution:** closing from `reported`, `triaged`, or `in_progress` requires a **closure note** on the transition (service validation).

## Coverage semantics

| `coverage_type` | Meaning |
|-----------------|--------|
| `warranty_covered` | Classified as covered under warranty (construction-relevant). |
| `warranty_review_needed` | Default for stakeholder submissions; manager must decide. |
| `not_warranty` | Commercial / out-of-warranty / chargeable work (not a billing engine — classification only). |

## Audit

- Every status change appends a row to `project_service_request_events` with `from_status`, `to_status`, `actor_user_id`, optional `note`.  
- Resolved state requires a **resolution note** on the request row.

## Limitations (by design)

- No SLA timers, no auto-escalation.  
- No separation of “internal” vs “customer-visible” notes on the request row — stakeholders do **not** receive event history (see client UI report).
