# Wave 4 Step 19 — Trace chain governance (Stage C)

## C1 — Linked chains surfaced (minimal, data-backed)

Chains are **not inferred** from text or heuristics. They appear only when **foreign keys** on domain rows exist.

| Workflow | Mechanism | UI / DTO |
|----------|-----------|----------|
| Discussion ↔ change order | `project_change_orders.linked_discussion_id` | `linkedPointers` on change-order trace rows |
| Document / client request ↔ change order | `linked_document_id`, `linked_request_id` | Same |
| Discussion / milestone ↔ defect | `project_defects.linked_*` | `linkedPointers` on defect trace rows |
| Handover / defect ↔ aftercare | `project_service_requests.linked_handover_id`, `linked_defect_id` | Pointer `role` distinguishes **context** (handover) vs **consequence** (defect) |
| Discussion ↔ aftercare | `linked_discussion_id` | `linkedPointers` |
| Discussion entry ↔ thread | Entry row’s `discussion_id` | Each entry includes a pointer to `discussion` entity |

## C2 — Explainability pattern

For each trace item:

- **Cause/context** — Optional `reasonNote` (transition note) or discussion body preview.
- **Transition** — `previousState` → `newState` where applicable.
- **Consequence** — Only where FK implies it (e.g. defect linked from aftercare as `consequence`).

## C3 — Explicit non-goals

- No synthetic edges (e.g. “this approval probably related to that discussion”) without stored ids.
- No cross-tenant joins.

## Limitations (honest)

- **Narrative** links that exist only in free text are not modeled.
- **Report approval** trace is limited to reports with a project-derivable link (task or document); orphan day reports are not included in this read model.
