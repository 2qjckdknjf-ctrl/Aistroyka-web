# Phase 3 — Enterprise SaaS: Permissions, Org, SDK, Compliance, Releases

**Report date:** 2026-03-04  
**Stack:** Next.js 14, OpenNext, Cloudflare Workers, Supabase, OpenAI

---

## 1. RBAC + scopes model

- **Roles (tenant-level):** OWNER, MANAGER, WORKER, CONTRACTOR (DB: owner, admin, member, viewer).
- **Permissions:** read, write, create, delete, approve, assign, invite, export, billing_admin, ai_admin.
- **Resource scopes:** tenant:*, project:{id}:*, task:{id}:*, report:{id}:*, media:{id}:* (user_scopes table).
- **Implementation:** `apps/web/lib/authz/` (authz.types, authz.policy, authz.service, authz.repository). TenantContext includes optional permissionSet and scopes; `authorize(ctx, permission, scope)` enforced in domain services; backward compatible via tenant.policy role-order.
- **ADR:** 013-rbac-scopes.

---

## 2. Project-level membership model

- **Tables:** project_members (tenant_id, project_id, user_id, role, status), task_assignments (tenant_id, task_id, user_id, assigned_by, assigned_at).
- **Worker Lite:** Only assigned tasks (worker_tasks.assigned_to or task_assignments) and own reports/media. listTasksForUser considers both assignment sources.
- **ADR:** 014-project-membership-task-assignments.

---

## 3. Organization (B2B) mode

- **Tables:** organizations, organization_tenants, organization_members (org_owner, org_admin, org_viewer).
- **Endpoints:** GET /api/v1/org/tenants (x-organization-id), GET /api/v1/org/metrics/overview?range=30d. Require org_admin/org_owner.
- **ADR:** 015-organization-mode.

---

## 4. Audit logs, retention, export design

- **audit_logs:** tenant_id, user_id, trace_id, action, resource_type, resource_id, details jsonb. Emitted on invite, report_submit, export.
- **data_retention_policies:** per-tenant media/report/ai_usage retention days; enforcement scaffolded (docs/DATA-RETENTION-STRATEGY.md).
- **Export:** POST /api/v1/admin/exports (enqueue job), GET /api/v1/admin/exports/:id/status. Export job type in job processor (placeholder handler). Rate-limited and audited.
- **ADRs:** 016-audit-logs, 017-retention-export.

---

## 5. SDK / OpenAPI generation pipeline

- **contracts-openapi:** Zod → JSON Schema via zod-to-json-schema; paths hand-written. Output: dist/openapi.json. CI: npm run build && validate-openapi.mjs.
- **api-client:** Typed TS client (createClient, fetcher, types from contracts). Mobile: OpenAPI Generator for Swift/Kotlin; documented in packages/api-client/README and docs.
- **ADR:** 018-openapi-sdk-pipeline.

---

## 6. API release governance

- **Policy:** docs/API-RELEASE-POLICY.md. v1 stable; breaking → v2. Legacy routes return Deprecation: true, Sunset, Link (successor).
- **ADR:** 019-deprecation-policy.

---

## 7. Threat model summary

- **Doc:** docs/THREAT-MODEL.md. Covers auth/session, privilege escalation, cross-tenant, AI abuse, upload abuse, job abuse; mitigation mapping.
- **Hardening:** Stricter rate limit on /api/auth/login (5/min per IP); export endpoint rate-limited; admin and jobs:process require elevated permission.

---

## 8. Risks and Phase 4 roadmap

**Risks:**
- RBAC and project_members require DB migration and backfill for existing tenants.
- Export job handler is placeholder; file generation and delivery not implemented.
- Legacy route deprecation headers applied to a subset of routes; remaining legacy routes should be updated for consistency.

**Phase 4 (suggested):**
- Implement export file generation (storage bucket, signed URL or webhook).
- Retention job: scheduled cleanup per data_retention_policies.
- Optional: v2 API if breaking changes needed; mobile SDK codegen in CI.
- Broader audit emission (login, role_change, task_assignment, media_finalize, ai_analysis_complete).

---

## 9. Deliverables checklist

| Item | Location |
|------|----------|
| REPORT-PHASE3-ENTERPRISE.md | docs/REPORT-PHASE3-ENTERPRISE.md |
| API-RELEASE-POLICY.md | docs/API-RELEASE-POLICY.md |
| THREAT-MODEL.md | docs/THREAT-MODEL.md |
| OpenAPI artifact | packages/contracts-openapi/dist/openapi.json |
| ADRs (8+) | docs/ADR/013–019 |
| Migrations | apps/web/supabase/migrations/20260306*.sql |
| Packages | packages/contracts-openapi, packages/api-client |
