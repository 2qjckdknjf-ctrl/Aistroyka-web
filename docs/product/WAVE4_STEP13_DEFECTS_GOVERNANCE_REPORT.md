# Wave 4 Step 13 — Governance / lifecycle

## Lifecycle (explicit)

| Status | Meaning |
|--------|---------|
| `open` | Logged; not yet in active remediation. |
| `in_progress` | Team is working it. |
| `ready_for_verification` | Fix done; needs verification / sign-off. |
| `resolved` | Recorded fix with **resolution note** and resolver. |
| `closed` | Final; no further work. |

Allowed transitions are enforced in `defects.service.ts` (`TRANSITIONS`). Example: `resolved` → `closed` only; resolving from `ready_for_verification` requires a non-empty resolution note.

## Blocking semantics

- **`is_blocking`**: User-visible intent that the item should block completion until cleared.  
- **Handover readiness**: Counts toward `computeHandoverReadiness` only when `is_blocking = true` **and** status is one of `open`, `in_progress`, `ready_for_verification`.  
- Resolved/closed blocking items do not block.

## Stakeholder visibility

- Detail for non-managers: **no** assignee user id; **`has_assignee`** boolean only.  
- Resolution note and dates are visible when present (trust / closure narrative).

## Audit

- Internal `project_defect_events` on status transitions initiated by managers (service-layer inserts).

## Limitations

- No per-field edit history beyond status events.  
- No automated SLA or escalation.
