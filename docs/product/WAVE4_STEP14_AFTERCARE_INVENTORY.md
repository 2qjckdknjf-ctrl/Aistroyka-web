# Wave 4 Step 14 — Aftercare scope inventory

**Date:** 2026-03-28  
**Status:** Closed for Step 14 minimal scope

## A1 — Systems reviewed for connection

| Area | Role for aftercare |
|------|---------------------|
| **Handover / completion** (`project_handover`) | **Gate:** aftercare requests are only creatable when handover status is `handed_over` or `completed`. Rows store `linked_handover_id` to the project’s handover record. |
| **Punch list / defects** (`project_defects`) | Optional **link** for context (`linked_defect_id`) — pre-handover punch list is not the same object as post-handover service, but teams may relate them. |
| **Stakeholder discussions** | Optional `linked_discussion_id` for traceability. |
| **Client portal / policy** | Reuses `canManageClientRequests` / `canReadClientPortalView` patterns (same family as defects). |
| **Project timeline** (`/api/v1/projects/:id/timeline`) | Aftercare creates and resolutions appear as internal manager timeline items (not a separate notification product). |

## A2 — Minimal scope chosen

1. **Stakeholder** reports a post-handover issue (title + description) → fixed `reported` + `warranty_review_needed` (RLS enforced for portal inserts).  
2. **Manager** classifies coverage (`warranty_covered` / `warranty_review_needed` / `not_warranty`), assigns, sets due date, transitions status, resolves with note, closes.  
3. **Lifecycle** is explicit and auditable via `project_service_request_events`.  
4. **No** company-wide ticket desk, SLA engine, or technician dispatch.

## A3 — Minimum fields on a service request

Implemented in `project_service_requests`: title, description, status, `coverage_type`, `assigned_to`, `due_date`, `resolution_note`, `resolved_at`, `resolved_by`, `linked_handover_id`, `linked_defect_id`, `linked_discussion_id`, `created_by`, timestamps.

## A4 — Explicitly deferred

- Recurring maintenance plans and asset registers  
- Field routing / dispatch optimization  
- Vendor marketplace  
- Cross-tenant SLA / escalation engine  
- Android-specific expansion (not required for this step)
