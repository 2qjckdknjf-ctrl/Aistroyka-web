# Wave 4 Step 6 — Governance & lifecycle (Stage C)

## Lifecycle

| Status | Meaning |
|--------|---------|
| `open` | Awaiting stakeholder action (if `action_required`) or manager completion (if `info_only`) |
| `responded` | Stakeholder submitted a response |
| `completed` | Manager closed the loop |
| `cancelled` | Manager voided the request |

## Transitions

- **Create** → `open` + event `created`.
- **Stakeholder respond** (allowed only when `open`, `action_required`) → `responded` + event `responded`.
- **Manager complete** → `completed` when:
  - `info_only` + `open`, or
  - `action_required` + `responded`.
- **Manager cancel** → `cancelled` from `open` or `responded` + event `cancelled`.

## Allowed responses (by kind)

| Kind | Required body fields |
|------|----------------------|
| `approve_or_reject` | `decision`: `approve` \| `reject` |
| `feedback` | `feedback_text` (non-empty) |
| `acknowledge` | `acknowledged`: `true` |
| `choice` | `choice_index` integer in range of `choice_options` |
| `document_review` | `document_review_confirmed`: `true` |

Optional `note` on respond for all kinds.

## Auditability

- Events table records `created`, `responded`, `completed`, `cancelled` with `actor_user_id` and optional `payload`.
- Manager GET single request includes `history[]` (event list).

## Limitations

- No edit of request text after create (by design; cancel and recreate if needed).
- No `expired` status in this step (reserved for future).
