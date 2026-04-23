# Wave 4 Step 6 — Manager UI (Stage D)

## Location

- `ClientRequestsManagerPanel` on project detail, shown when `can_manage_client_portal` (same cohort as client portal controls).

## Controls

- **New request** — opens inline form: title, instructions, kind, action mode, choice options (for `choice`), optional document/milestone link (type + UUID).
- **List** — all requests for the project with status badges.
- **Mark complete** — for `info_only` while `open`.
- **Cancel** — while `open` or `responded`.
- **Complete** — after stakeholder `responded` (`action_required`).

## Workflow

- Creating a request invalidates `client-requests` and `client-project-view` queries so the stakeholder page updates.

## Limitations

- No picker UI for documents/milestones — managers paste UUID (validated server-side).
- No bulk actions.
