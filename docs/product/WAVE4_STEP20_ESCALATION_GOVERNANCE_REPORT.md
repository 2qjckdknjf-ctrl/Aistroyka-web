# Wave 4 Step 20 — Lifecycle & governance rules (Stage C)

## C1 — Lifecycle

Explicit **finite** state machine in `governance.service.ts` (`TRANSITIONS` + `canTransition`):

| From | Allowed to |
|------|------------|
| `open` | `under_review`, `decision_required`, `archived` |
| `under_review` | `decision_required`, `decided`, `resolved`, `archived` |
| `decision_required` | `decided`, `under_review`, `archived` |
| `decided` | `resolved`, `archived` |
| `resolved` | `archived` |
| `archived` | _(terminal)_ |

Invalid transitions return a clear API error.

## C2 — Severity

Three levels only (DB check + API validation): **`medium`**, **`high`**, **`critical`**.

Semantics are **product-defined labels** for leadership triage; they do not invoke sub-workflows per severity.

**Open / critical counts** for portfolio signals: `countOpenGovernanceCases` treats “open” as statuses in `ACTIVE_STATUSES`: `open`, `under_review`, `decision_required`, `decided` (excludes `resolved` and `archived`). Critical open count = subset with `severity === 'critical'`.

## C3 — Required narrative fields

Every case answers:

1. **Why it exists** — `rationale` (optional but encouraged), `decision_required` (required).
2. **Which projects** — at least one link in `governance_case_projects`; optional per-project `note`.
3. **Who acts** — `owned_by` optional; actor always recorded on events.
4. **Outcome** — `decision_outcome` required before **`decided`** or **`resolved`** (service-enforced).

## C4 — Traceability

- **Status changes** → `governance_case_events` row (`event_kind: status_change`).
- **Decision text changes** → `event_kind: decision_recorded` when `decision_outcome` changes.
- **Project set changes** → `event_kind: updated` with note “Affected projects updated”.
- **Create** → `event_kind: created`.

This is **append-style auditing** for material changes; the case row holds current truth, events hold history.

## Limitations (intentional)

- No per-role approval chains; internal workspace users with policy access can progress cases.
- No SLA timers or automated escalations in this step.
