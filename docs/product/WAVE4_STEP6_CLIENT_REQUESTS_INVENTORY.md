# Wave 4 Step 6 — Client requests scope inventory (Stage A)

## A1 — Minimal request kinds (implemented)

| Kind | Customer response | Use |
|------|-------------------|-----|
| `approve_or_reject` | `approve` / `reject` (+ optional note) | Binary decision |
| `feedback` | Non-empty text | Written feedback |
| `acknowledge` | `acknowledged: true` | Explicit confirmation |
| `choice` | `choice_index` (0-based) | Pick from manager-defined options |
| `document_review` | `document_review_confirmed: true` | Confirm document reviewed |

## A2 — Action mode

| Mode | Behavior |
|------|----------|
| `action_required` | Customer can respond while `status = open` |
| `info_only` | No customer response; manager **Mark complete** from open |

## A3 — Source / linkage

- Optional `linked_entity_type` + `linked_entity_id` for `document` or `milestone` (validated to belong to the project).
- Does **not** auto-create requests from document workflow; managers create explicitly.

## A4 — Deferred (explicit)

- Chat, threads, @mentions
- Client file attachments
- Generic issue/ticket backlog
- Email ingestion
- SLA / escalation rules
