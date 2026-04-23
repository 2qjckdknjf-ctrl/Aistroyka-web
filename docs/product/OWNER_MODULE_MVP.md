# Owner View / Customer Module — MVP Scope

**Step:** OWNER VIEW / CUSTOMER MODULE — MVP  
**Date:** 2025-03-22

## Scope

Minimal owner/customer-facing view of a project. Read-only. Uses existing golden path data layers.

## Route

`/dashboard/projects/[id]/owner`

Access: Same as project detail — tenant membership and project access via existing `getProject` / tenant context. No dedicated owner role; MVP reuses current auth.

## Data surface

| Block | Source |
|-------|--------|
| Project title/info | GET `/api/v1/projects/:id` |
| Summary cards | GET `/api/v1/projects/:id/summary` |
| Milestones | GET `/api/v1/projects/:id/milestones` |
| Open issues | GET `/api/v1/projects/:id/issues` (filter client: status in open, in_review) |
| Pending decisions | GET `/api/v1/projects/:id/documents` (filter client: status = under_review) |
| Recent reports | GET `/api/v1/projects/:id/reports` |
| Recent photos | GET `/api/v1/projects/:id/media` (new endpoint) |

## Derived project status

Presentation-only helper (no DB field):

- **draft** — tasksTotal=0 and milestonesCount=0
- **completed** — tasksDone >= tasksTotal and total > 0
- **at_risk** — openIssuesCount >= 3
- **active** — otherwise

## Owner decision flow (MVP)

Owner can take decision actions on documents with status `under_review`:
- **approve** → status `approved`
- **reject** → status `rejected`
- **request_changes** → status `changes_requested`

API: `POST /api/v1/projects/:id/documents/:documentId/decision`  
Body: `{ action: "approve"|"reject"|"request_changes", comment?: string }`

Stored: `decision_comment`, `decided_by`, `updated_at`. Manager can resubmit `changes_requested` → `under_review`.

## Non-goals (confirmed)

- Chat, realtime notifications
- Billing, paywall, Stripe
- Heavy approval engine
- Issue photo upload
- Full role separation across the product
- Mobile app changes
- Major architecture rewrite
