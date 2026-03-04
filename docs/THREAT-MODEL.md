# Threat model (Web API + multi-tenant)

**Scope:** Next.js API routes, Supabase auth, tenant/project data, AI, jobs, exports.

---

## 1. Auth and session risks

| Risk | Mitigation |
|------|------------|
| Credential stuffing / brute force on login | Rate limit on POST /api/auth/login (stricter per-IP than general API). |
| Session fixation / cookie theft | HttpOnly, Secure, SameSite cookies; Supabase session refresh. |
| JWT leakage in logs or responses | No secrets in logs; no stack traces in JSON responses. |
| Unauthenticated access to tenant data | requireTenant + authorize on all v1 routes; RLS on DB. |

---

## 2. Privilege escalation

| Risk | Mitigation |
|------|------------|
| Member/viewer performing admin actions | RBAC: authorize(ctx, "admin:read") on admin endpoints; role_permissions + tenant_members.role. |
| Worker accessing other tenants’ tasks | listTasksForUser scoped by tenant_id + assigned_to / task_assignments. |
| Contractor seeing full project list | project_members; worker-lite only assigned tasks and own reports/media. |

---

## 3. Cross-tenant risks

| Risk | Mitigation |
|------|------------|
| tenant_id in body/query trusted | Never authorize by client-supplied tenant_id alone; resolve from JWT + tenant_members. |
| RLS bypass | All tenant tables have RLS; service role used only in server-side jobs, no cross-tenant SELECT. |
| Org admin seeing wrong tenants | org_tenants + org_members; GET org/tenants and org/metrics require hasOrgAdminRole(orgId). |

---

## 4. AI abuse

| Risk | Mitigation |
|------|------------|
| Quota exhaustion | Per-tenant limits (tenant_daily_metrics, subscription limits); 402 on exceed. |
| Prompt injection / exfiltration | Input validation; no PII in prompts by policy; low_confidence guard where applicable. |
| Rate abuse of analyze-image | checkRateLimit on /api/v1/ai/analyze-image; per-tenant and per-IP. |

---

## 5. Upload abuse

| Risk | Mitigation |
|------|------------|
| Unbounded storage | Subscription limits (storage_limit_gb); upload_sessions tied to tenant and user. |
| Malicious file types | Validate mime_type and size on finalize; storage policies. |
| Idempotency key replay | idempotency_keys table; one successful response per key. |

---

## 6. Job abuse

| Risk | Mitigation |
|------|------------|
| Unauthorized job processing | POST /api/v1/jobs/process requires authorize(ctx, "jobs:process") (admin). |
| Export data exfiltration | POST /api/v1/admin/exports requires admin:read; audit log entry; rate limit on export. |
| Dead letter / replay | Job status and max_attempts; no client-supplied job payload trusted for cross-tenant access. |

---

## 7. Mitigation summary

- **Auth:** Stricter rate limit on login; no secrets in responses.
- **Authz:** RBAC + scopes; project_members and task_assignments for worker/contractor.
- **Tenant isolation:** TenantContext from JWT + DB only; RLS on all tenant tables.
- **Admin/export:** Elevated permission; audit; export endpoint rate-limited.
- **Jobs:** Processor locked to role; job payload validated server-side.
