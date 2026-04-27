# Wave 4 Step 7 — Backend report (Stage B)

## Persistence

- Migration: `apps/web/supabase/migrations/20260330140000_project_stakeholders.sql`
- RLS: tenant members + invitee email match (JWT), mirroring `tenant_invitations` patterns.

## Domain

| Module | Responsibility |
|--------|------------------|
| `lib/domain/stakeholders/stakeholders.types.ts` | Row + list DTOs |
| `stakeholders.repository.ts` | CRUD, `listActiveProjectIdsForUser`, `getActiveForUserOnProject` |
| `stakeholders.policy.ts` | `canManageProjectStakeholders`, `canReadClientPortalView`, `canRespondToClientRequests` |
| `stakeholders.service.ts` | Invite, list, revoke, accept |

## HTTP

| Route | Purpose |
|-------|---------|
| `POST /api/v1/projects/:id/stakeholders` | Create invite |
| `GET /api/v1/projects/:id/stakeholders` | List (managers) |
| `PATCH /api/v1/projects/:id/stakeholders/:stakeholderId` | `{ action: "revoke" }` |
| `POST /api/v1/stakeholder-invites/accept` | Authenticated accept (no prior tenant required in handler) |
| `GET /api/v1/projects/:id` | Adds `stakeholder_role` when user has an **active** stakeholder row |

## Project listing / detail

- `listProjects` merges projects from **`project_members`** and **`project_stakeholders`** (active).
- `getProject` allows access if **member** OR **active stakeholder** for that project id.

## Integration with Steps 5–6

- `canReadClientPortalView` / `canRespondToClientRequests` replace owner-only checks for portal and requests.
- `ClientProjectView` includes `capabilities.can_respond_to_requests`.
