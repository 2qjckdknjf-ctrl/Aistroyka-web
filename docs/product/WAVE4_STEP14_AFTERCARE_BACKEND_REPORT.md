# Wave 4 Step 14 — Backend report

## Schema

**Migration:** `apps/web/supabase/migrations/20260405120000_project_aftercare_service_requests.sql`

- **`project_service_requests`** — primary post-handover service request row.  
- **`project_service_request_events`** — append-only status transition history (manager writes via internal policy).

**RLS**

- **Select:** internal tenant readers **or** portal stakeholders for the project (`is_portal_stakeholder_for_project`).  
- **Insert (portal):** stakeholders may insert only with `status = reported`, `coverage_type = warranty_review_needed`, `assigned_to IS NULL`, `created_by = auth.uid()`.  
- **Write (internal):** full CRUD for internal tenant readers on requests; events insert internal-only.

## Domain

- `apps/web/lib/domain/aftercare/aftercare.types.ts`  
- `apps/web/lib/domain/aftercare/aftercare.policy.ts`  
- `apps/web/lib/domain/aftercare/aftercare.repository.ts`  
- `apps/web/lib/domain/aftercare/aftercare.service.ts`  

**Eligibility:** `createServiceRequestManager` / `createServiceRequestStakeholder` call `getByProject` and require `project_handover.status ∈ { handed_over, completed }`.

## HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/v1/projects/:id/service-requests` | List; create (manager vs stakeholder branch) |
| GET/PATCH | `/api/v1/projects/:id/service-requests/:requestId` | Detail (`audience`: manager vs stakeholder); manager patch |
| POST | `/api/v1/projects/:id/service-requests/:requestId/transition` | Status transitions + resolution / closure notes |

## Auth / tenant

Same tenant context as other project APIs (`getTenantContextFromRequest`, `requireTenant`). Service layer enforces `canManageClientRequests` / `canReadClientPortalView` equivalents for aftercare.

## Risks / notes

- **Migration must be applied** in each environment before API use (otherwise timeline query tolerates missing table with empty results).  
- Assignee is stored as raw `auth.users` UUID — UI uses opaque ID entry (consistent with other internal fields).
