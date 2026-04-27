# Wave 4 Step 10 — Backend report (Stage B)

## B1. Schema

**Migrations**

- `apps/web/supabase/migrations/20260401140000_stakeholder_discussions.sql`  
  - `project_stakeholder_discussions`: `id`, `tenant_id`, `project_id`, `kind`, `status`, `title`, `context`, optional `linked_entity_type` / `linked_entity_id`, `created_by`, `resolved_at`, `resolution_summary`, `resolved_by`, timestamps.
  - `project_stakeholder_discussion_entries`: `discussion_id`, `author_user_id`, `entry_kind`, `body`, `payload` (jsonb), `tenant_id`, `project_id`, `created_at`.

- `apps/web/supabase/migrations/20260401150000_stakeholder_discussion_portal_status_rpc.sql`  
  - `stakeholder_discussion_portal_set_status(discussion_id, tenant_id, next_status)` — `SECURITY DEFINER` RPC so **portal stakeholders** can transition discussion `status` after posting an entry. Direct `UPDATE` on discussions is restricted to internal users; entries insert via portal RLS was insufficient alone.

## B2. Domain layer

| Path | Role |
|------|------|
| `lib/domain/stakeholder-discussions/stakeholder-discussions.types.ts` | Kinds, statuses, entry kinds, manager vs public DTOs. |
| `stakeholder-discussions.repository.ts` | CRUD, `listForTimeline`, `updateDiscussionStatusAsPortal` (RPC). |
| `stakeholder-discussions.policy.ts` | Read: `canReadClientPortalView`; manage: `canManageClientRequests`; participate: `canRespondToClientRequests`. |
| `stakeholder-discussions.service.ts` | Create, list, detail (manager vs stakeholder-safe), add entry with transitions, resolve (summary + `resolution_note` entry), close. |

## B3. API routes

| Method | Path |
|--------|------|
| GET, POST | `/api/v1/projects/[id]/stakeholder-discussions` |
| GET | `/api/v1/projects/[id]/stakeholder-discussions/[discussionId]` |
| POST | `.../entries` |
| POST | `.../resolve` |
| POST | `.../close` |

All use `createClientFromRequest` + tenant context from `getTenantContextFromRequest`.

## B4. RLS summary

- **Select** discussions and entries: internal tenant readers **or** portal stakeholders for the project.
- **Write** discussions (insert/update/delete): internal **only** (managers create/resolve/close via app).
- **Insert** entries: internal **or** portal with `author_user_id = auth.uid()`.
- **Portal status** after participant entry: **RPC** (see above).

## B5. Non-breaking guarantee

- Existing client request, portal, and timeline routes are additive; no removal of prior flows.
