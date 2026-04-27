# Wave 4 Step 9 — Stakeholder activity timeline (backend & governance)

## Scope (A)

**Event kinds in the read model**

- `client_request_*` — from `project_client_request_events` + current request title/status (created, responded, completed, cancelled, updated).
- `stakeholder_invite_sent` — from `project_stakeholders` (manager-only titles include email).
- `stakeholder_joined_portal` — manager: per-row with email; stakeholder: single “You joined…” when `accepted_at` matches the viewer.

**Why chosen**

- Uses existing auditable tables (no new event bus). Aligns with portal transparency without duplicating Step 8 delivery records.

**Deferred**

- Comments/messaging, granular document timeline for portal, worker/report/issue rows in the stakeholder feed, real-time streaming.

## Read model (B)

- **Implementation:** `stakeholder-activity-timeline.repository.ts` + `listEventsForProject` in `client-requests.repository.ts`.
- **Ordering:** `occurredAt` descending, capped by `limit` (default 50, max 100).
- **Audience shaping:** `visibility` on each row (`internal` | `stakeholder` | `both`); `shapeStakeholderAudience` removes `internal` and strips `actorId` from JSON for portal responses.

## Governance (C)

- **Rules:** `client_request_updated` is internal-only; stakeholders do not receive other stakeholders’ invite/join rows with email (RLS limits raw rows; shaping removes internal-only items).
- **Omitted from stakeholder feed:** worker tasks, reports, issues, operations timeline (`/timeline`), internal-only stakeholder rows.
- **Leakage controls:** API chooses manager vs stakeholder path from auth (`getProjectForInternalWorkspace` vs `canReadClientPortalView`); no `audience` query parameter.
