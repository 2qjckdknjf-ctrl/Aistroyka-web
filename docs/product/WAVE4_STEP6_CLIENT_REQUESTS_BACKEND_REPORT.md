# Wave 4 Step 6 — Backend report (Stage B)

## Schema

- **`project_client_requests`** — canonical request row (`kind`, `action_mode`, `status`, title, instructions, `choice_options` jsonb, linkage, response fields, actor timestamps).
- **`project_client_request_events`** — append-only audit (`created`, `responded`, `completed`, `cancelled`).

Migration: `apps/web/supabase/migrations/20260330120000_project_client_requests.sql`.

## Domain

| File | Role |
|------|------|
| `lib/domain/client-requests/client-requests.types.ts` | Types, DTOs |
| `client-requests.policy.ts` | `canManageClientRequests`, `canStakeholderAccessClientRequests` |
| `client-requests.repository.ts` | CRUD + events |
| `client-requests.service.ts` | Validation, `rowToPublic` / `rowToManager`, lifecycle |

## HTTP

| Route | Method | Actor |
|-------|--------|-------|
| `/api/v1/projects/:id/client-requests` | GET | Manager (full rows) **or** stakeholder (public rows) |
| `/api/v1/projects/:id/client-requests` | POST | Manager |
| `/api/v1/projects/:id/client-requests/:requestId` | GET | Manager (with `history`) or stakeholder |
| `/api/v1/projects/:id/client-requests/:requestId` | PATCH `{ status: completed \| cancelled }` | Manager |
| `/api/v1/projects/:id/client-requests/:requestId/respond` | POST | Stakeholder (project owner + portal on) |

## Client portal integration

- `getClientProjectView` loads non-cancelled requests and maps through `rowToPublic` into `client_requests[]` on `ClientProjectView`.

## Risks

- RLS follows tenant-member pattern (same as `project_issues`); **application layer** enforces project role (manager vs project owner).
