# Wave 4 Step 16 — Stakeholder (client portal) UI

## E1 — Surface

- **Component**: `ClientPortalWorkloadSection` on the project client portal
- **Data**: `GET /api/v1/workload?audience=stakeholder`, then **filter** `project_id === current project**

## UX

- Card **“Waiting on you”** with short copy clarifying this is not a generic task list.
- Lists items with priority badge, title, reason, **Take action →** link to `action_url` (client portal or `/client/discussions/...`).

## E3 — Internal exposure

Stakeholder view does not call manager or leadership builders; API auth is tenant-scoped. Manager-only items never appear for stakeholder audience.

## Limitations

- Section hidden when empty or on error (no error banner).
- Copy is English-only in component strings.
