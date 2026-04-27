# Wave 4 Step 19 — Audit scope inventory (Stage A)

## A1 — Existing event / history sources

| Source | Table(s) | Semantics |
|--------|-----------|-----------|
| Change order transitions | `project_change_order_events` | Append-only `from_status` → `to_status`, `actor_user_id`, `note` |
| Handover transitions | `project_handover_events` | Same pattern for handover lifecycle |
| Defect / punch list | `project_defect_events` | Same pattern |
| Aftercare / warranty requests | `project_service_request_events` | Same pattern |
| Document lifecycle | `project_document_events` | `event_type` + optional actor/note (join via `project_documents` for `project_id`) |
| Worker report approvals | `report_approval_events` | `event_type` (submitted/approved/rejected/changes_requested); scope to project via `worker_reports.task_id` → `worker_tasks.project_id` and `project_documents.report_id` |
| Stakeholder discussions | `project_stakeholder_discussion_entries` | Auditable entries with `entry_kind`, `body`, `author_user_id` |
| (Related, not primary for this step) | `project_client_request_events`, `recurring_automation_fire_events`, manager notification tables | Intentionally out of minimal trace read model for Step 19 |

## A2 — Minimal entity scope chosen

**In scope for the unified trace read model:**

1. **Change orders** — status transitions + FK links to discussion / document / client request.
2. **Handover** — status transitions.
3. **Defects** — status transitions + FK links (discussion, document, request, milestone).
4. **Aftercare** — status transitions + FK links (handover, defect, discussion).
5. **Discussions** — append-only entries (resolution thread context).
6. **Documents** — append-only `project_document_events`.
7. **Report approvals** — append-only approval events for reports provably tied to the project.

**Rationale:** These domains share **explicit append-only event rows** or **auditable entries**, support **cross-workflow pointers** already modeled as foreign keys on parent rows, and answer leadership questions (who moved state, when, optional note) without exposing raw SQL or generic infra logs.

## A3 — What this layer is NOT

- Not a SIEM or security telemetry product.
- Not a raw database log viewer or arbitrary table browser.
- Not a legal hold / immutable evidence vault.
- Not a redesign of the dashboard shell or unrelated product areas.

## Deferred (explicit)

- Org-wide audit explorer across every table.
- Resolving actor UUIDs to display names (requires a safe tenant-scoped profile contract; not in this step).
- Day-scoped `worker_reports` without `task_id` or `project_documents.report_id` (no stable project join in DB for those rows in the minimal query).
