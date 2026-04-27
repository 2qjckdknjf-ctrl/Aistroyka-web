# Wave 4 Step 9 — Manager & client UI

## Manager UI (D)

- **Surfaces:** `StakeholderActivityBlock` — Activity tab on `DashboardProjectDetailClient` (“Client & portal activity”) + `OwnerViewClient` (same block above “Project operations”).
- **Workflow:** Fetches `GET /api/v1/projects/:id/stakeholder-activity`; existing `GET .../timeline` remains “Project operations” (issues, docs, tasks, reports).
- **Limitations:** Does not replace the full operations feed; two blocks side-by-side in time order within each block only (not interleaved across APIs).

## Client UI (E)

- **Surfaces:** `ClientPortalActivitySection` on `ClientPortalViewClient` (Activity list, max 25).
- **Action-needed:** Rows with `actionNeeded` (open + `action_required` on create event) get accent styling in `StakeholderActivityBlock`.
- **Limitations:** Historical “created” events use **current** request status for `actionNeeded` (best-effort highlight).

## Integration (F)

- **Sources:** `project_client_request_events`, `project_client_requests`, `project_stakeholders`; API route `stakeholder-activity`.
- **Not touched:** Notifications routes, delivery, chat, approvals/budget/documents feature work beyond read-only use of existing rows.
