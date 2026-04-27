# Wave 4 Step 11 — Integration report (Stage G)

## G1. Connections

| Link | Implementation |
|------|----------------|
| Discussions / documents / requests / milestones | Optional nullable FK columns on `project_change_orders`. |
| Stakeholder activity timeline | `change_order_opened` (on create for non-draft rows in timeline query) and `change_order_implemented` (when `implemented_at` set). URLs: `/dashboard/projects/{id}/client/change-orders/{changeOrderId}`. |

## G2. Intentionally not integrated in this step

| Area | Reason |
|------|--------|
| Project `/summary` API | Minimal scope; timeline + portal suffice for visibility. |
| Push/email notifications | Not trivially wired; deferred. |
| Auto-updating milestone dates or budget aggregates | Avoid fake ERP behavior; impact stays on the change record. |

## G3. Workflow engine

- Status transitions are **explicit** in application code (`TRANSITIONS` map), not a generic rules engine.
