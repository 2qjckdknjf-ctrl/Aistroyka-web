# Tenant Model Specification

**Project:** AISTROYKA.AI  
**Version:** 1.0  
**Status:** Spec (Phase 0.1). No code changes in this document.

---

## 1. Tenant concept

- **Tenant** = one organization (company, site operator). Single tenant per org in the current model.
- Stored in table `tenants` (id, name, and any future billing/plan fields).
- All projects, media, analysis jobs, and AI usage are scoped by `tenant_id`.
- A user can belong to multiple tenants via `tenant_members`; at request time the app resolves one **active tenant** (e.g. first membership, or explicit selection stored in session/cookie).

---

## 2. Roles

| Role         | Code        | Description |
|-------------|-------------|-------------|
| Owner       | `OWNER`     | Full control; billing; can delete tenant; can assign all roles. |
| Manager     | `MANAGER`   | Manage projects, members, reports; no billing or tenant deletion. |
| Worker      | `WORKER`    | Execute assigned tasks; create reports/media for assigned scope. |
| Contractor  | `CONTRACTOR`| Time- and project-scoped access; same as worker but with optional expiry and project restriction. |

**Current DB alignment:** Existing code uses `tenant_members.role` with values such as `owner`, `admin`, `member`, `viewer`. This spec standardizes on `OWNER`, `MANAGER`, `WORKER`, `CONTRACTOR`. Migration or mapping layer may map legacy `admin` → `MANAGER`, `member`/`viewer` → `WORKER` until DB is normalized.

---

## 3. Membership model (tenant_members)

- **Table:** `tenant_members` with at least: `tenant_id`, `user_id`, `role`, `created_at`. Optional: `invited_by`, `expires_at` (for CONTRACTOR).
- **RLS:** Rows visible to the user only for tenants they belong to (e.g. `auth.uid() = user_id`).
- **Resolving active tenant:** Given a Supabase user (from session), query `tenant_members` where `user_id = auth.uid()`; order by preference (e.g. primary flag or first row). The chosen row gives `tenantId` and `role` for the request.

---

## 4. How tenantId is derived from auth session

1. **Request** hits API route (or middleware if we add tenant resolution there).
2. **Session:** Create Supabase server client (cookies); call `getUser()`.
3. **If no user:** Tenant context is absent; route may allow unauthenticated access (e.g. health, public endpoints) or return 401.
4. **If user:** Query `tenant_members` where `user_id = user.id`, optionally filter by `expires_at > now()` for contractors. Select one membership as “active” (e.g. first, or by header/session).
5. **TenantContext:** Set `tenantId = membership.tenant_id`, `userId = user.id`, `role = membership.role`, plus `traceId`, `clientProfile` (from headers), `subscriptionTier` (placeholder).

---

## 5. Authorization rules matrix (per role)

| Resource / Action        | OWNER | MANAGER | WORKER | CONTRACTOR |
|--------------------------|-------|---------|--------|------------|
| Tenant settings / billing| Yes   | No      | No     | No         |
| List/invite/revoke members | Yes | Yes     | No     | No         |
| Create/edit/delete projects | Yes | Yes     | No*    | No*        |
| View all projects        | Yes   | Yes     | No**   | No**       |
| Assigned tasks only      | Yes   | Yes     | Yes    | Yes (scoped) |
| Upload media (own scope) | Yes   | Yes     | Yes    | Yes (scoped) |
| Trigger AI analysis      | Yes   | Yes     | Yes*** | Yes***     |
| View reports / analytics | Yes   | Yes     | Scoped | Scoped     |
| Admin / observability    | Yes   | Yes     | No     | No         |

\* Worker/Contractor do not create projects; they work within assigned projects.  
\** Worker sees only projects (or tasks) they are assigned to; Contractor only within contract scope.  
\*** AI usage subject to quota and assignment scope (e.g. only for assigned project/media).

---

## 6. Worker Lite workflow access rules

- **Worker Lite** client (e.g. `x-client: ios_lite`) represents field workers with minimal UI.
- **Access:** Only assigned tasks and own reports/media. No project creation, no tenant settings, no admin.
- **Derivation:** Same `tenant_members`; role `WORKER` or `CONTRACTOR`. Optional: `project_assignments` or task table to restrict visible projects/tasks.
- **Reports/media:** Worker can create and edit only within assigned scope; RLS and app-layer checks must enforce.

---

## 7. Contractor rules

- **Time-limited:** Optional `expires_at` on `tenant_members` or a separate `contracts` table.
- **Scoped to project(s):** Optional link to specific `project_id`(s) so contractor sees only those projects.
- **Same as Worker** for in-scope actions; no tenant-level or admin access.

---

## 8. Admin / service-role policy

- **Service role (SUPABASE_SERVICE_ROLE_KEY):** Used only server-side, never sent to client. Single use today: `/api/analysis/process` for job RPCs (dequeue, claim, complete) that must bypass RLS for background processing.
- **Where:** Only in `getAdminClient()` and callers (e.g. `processOneJob`). No other route should use admin client.
- **Policy:** Document every use; no broad “admin” in routes for tenant data—prefer user-scoped client + RLS. Admin client is for system jobs and internal RPCs only.

---

## 9. RLS assumptions (what DB must guarantee)

- **tenants:** Only members can read tenant row (via join with tenant_members).
- **tenant_members:** User can read only their own rows (`user_id = auth.uid()`).
- **projects:** User can read/write only if they are in the project’s tenant and have the right role (e.g. via tenant_members and optionally project_members).
- **media, analysis_jobs:** Scoped by project and thus tenant; RLS follows project visibility.
- **AI/usage tables:** If present, scoped by tenant_id with RLS so user sees only their tenant(s).

---

## 10. What the app must guarantee

- **TenantContext** is resolved for every protected route that performs tenant-scoped operations.
- **No cross-tenant data:** Routes must not pass one tenant’s IDs to operations for another tenant; guard and policy enforce by role.
- **Explicit tenant in AI/metrics:** When user is authenticated, pass `tenantId` into AIService/metrics; when unauthenticated (e.g. public analyze-image if ever allowed), `tenantId` is null but `traceId` is required.
- **Audit:** Log access to sensitive actions (e.g. tenant settings, member revoke) with tenantId and userId for compliance.

---

*End of SPEC-TENANT-MODEL. Implementation follows in Phase 0.3.*
