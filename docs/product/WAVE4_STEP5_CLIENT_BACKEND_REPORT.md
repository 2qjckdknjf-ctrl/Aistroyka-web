# Wave 4 Step 5 — Backend read model (Stage C)

## C1 — Services and routes

| Piece | Path |
|-------|------|
| Types | `apps/web/lib/domain/client-portal/client-portal.types.ts` |
| Policy | `apps/web/lib/domain/client-portal/client-portal.policy.ts` |
| Service | `apps/web/lib/domain/client-portal/client-portal.service.ts` |
| GET read model | `GET /api/v1/projects/[id]/client-view` → `apps/web/app/api/v1/projects/[id]/client-view/route.ts` |
| PATCH portal settings | `PATCH /api/v1/projects/[id]/client-portal` → `apps/web/app/api/v1/projects/[id]/client-portal/route.ts` |
| Project fields | `project.repository.ts` — `getById` / `updateClientPortalSettings` include portal columns |
| GET project (for UI) | `GET /api/v1/projects/[id]` adds `can_manage_client_portal` |

## C2 — Auth & tenant enforcement

- All routes use `getTenantContextFromRequest` + `requireTenant`.
- `getClientProjectView`:
  - Requires `ctx.tenantId` / `ctx.userId`.
  - Requires `isProjectOwner(supabase, tenantId, projectId, userId)` — **project owner membership**, not merely “can read project”.
  - Requires `client_portal_enabled` on the project row.

## C3 — Response shaping

- Milestones: `id`, `title`, `target_date`, `status` (no internal description).
- Documents: `id`, `title`, `type`, `status`, `updated_at`.
- Decisions: `id`, `title`, `type`, `kind` ∈ `document_review_needed` | `changes_requested`.
- Budget: nullable; when present, `planned_total`, `actual_total`, `currency`, `over_budget` only.

## Risks / notes

- **403 vs 404**: Portal disabled returns 404 from the route with message `Client portal is not enabled` — avoids signaling “portal exists but off” to non-owners in some cases; owners still get consistent message when calling with portal off.
