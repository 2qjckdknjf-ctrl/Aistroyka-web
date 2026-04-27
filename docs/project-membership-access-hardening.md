# Project Membership / Role & Access Hardening — MVP

MVP project-scoped access hardening — not a full IAM platform.

## Canonical membership model

- **project_members** is the canonical source for project access.
- Migration `20260323000000_project_members_owner_role.sql` adds `owner` role and backfills existing projects.
- Project access: user must have active `project_members` row for that project.
- Owner: `project_members.role = 'owner'` (project-scoped).

## Role model

| Role | Source | Capabilities |
|------|--------|--------------|
| **manager** | project_members.role = manager | Full project operational surfaces |
| **internal_member** | project_members.role ∈ (worker, contractor) | Worker/contractor scope |
| **owner** | project_members.role = owner | Owner view, document decisions |

## Access helpers / guards

| Helper | Purpose |
|--------|---------|
| `getProjectWithAccess(supabase, ctx, projectId)` | Membership-based; returns project or error |
| `requireProjectAccess(supabase, ctx, projectId)` | Throws if not member |
| `requireProjectOwner(supabase, ctx, projectId)` | Throws if not project owner |
| `requireOwnerProjectAccess` | Alias for requireProjectOwner |
| `isProjectOwner(supabase, tenantId, projectId, userId)` | True when project_members.role=owner |
| `getProjectMembership(...)` | Returns { role, source } from project_members |

## Surface hardening

| API / route | Access |
|-------------|--------|
| GET /api/v1/projects | listByUserMembership — only projects user is member of |
| GET /api/v1/projects/:id | getProject — requires membership |
| POST create project | Adds creator to project_members (owner if tenant owner, else manager) |
| GET .../summary | getProject (membership) |
| GET .../attention | requireProjectAccess (manager) or requireProjectOwner (viewer=owner) |
| GET .../timeline | getProject (membership) |
| POST .../documents/:id/decision | requireProjectOwner |

## Targeting hardening

- **notifyProjectOwners(tenantId, projectId, input)**: Notifies project_members.role=owner for that project. Used for document_under_review, document_resubmitted.
- Falls back to notifyOwnerSide when project has no owners.
- Timeline/attention: visibility via getProject (membership required).

## MVP limits

- No invitation product or external onboarding.
- No full permission matrix or RBAC engine.
