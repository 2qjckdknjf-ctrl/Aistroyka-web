# Security Review

**Scope:** Tenant isolation, auth, admin exposure, API exposure, secrets, RLS.

---

## 1. Tenant Isolation

| Control | Status |
|---------|--------|
| Context from auth | **Good.** getTenantContextFromRequest uses Supabase auth + tenant_members; no client-supplied tenant_id trusted for scope. |
| Queries filtered by tenant_id | **Good.** Repositories and services use tenantId from context. |
| RLS | **Good.** Migrations enable RLS and tenant-based policies on key tables. |
| Admin client | **Caution.** Service-role bypasses RLS; callers (e.g. jobs/process, rate-limit, usage) pass tenantId from context—must remain disciplined. |

**Risk:** Any new route or service using admin client without passing tenant from authenticated context could break isolation. Recommendation: centralize admin access and always require tenant context for tenant-scoped operations.

---

## 2. Auth Flow

| Aspect | Status |
|--------|--------|
| Supabase Auth | **Good.** Server client with cookies; middleware refresh. |
| Protected routes | **Good.** Middleware redirects unauthenticated users to login for dashboard/projects/admin/billing/portfolio. |
| API auth | **Good.** v1 routes use requireTenant; 401/403 on missing or insufficient context. |
| Auth diagnostic endpoints | **Risk.** /api/_debug/auth, /api/health/auth—ensure not exposed in production or gated. |

---

## 3. Admin Endpoints

| Aspect | Status |
|--------|--------|
| Path | Under /api/v1/admin/*. |
| Authorization | **Partial.** Some admin routes may rely on requireTenant + role; requireAdmin or equivalent should be used for all admin paths. |
| Lite block | **Missing.** Lite clients (ios_lite, android_lite) are not blocked from calling admin by path; they would need to be authenticated as a user who has tenant membership—still, explicit block is safer. |

---

## 4. API Exposure

| Aspect | Status |
|--------|--------|
| Health | Public by design. |
| Config | Returns flags/limits; no secrets. |
| Errors | JSON with `error` (and optional `code`); no stack traces in response (assumed; verify in error middleware). |
| Security headers | **Good.** middleware applies X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, HSTS in production. |

---

## 5. Secret Handling

| Aspect | Status |
|--------|--------|
| Env | NEXT_PUBLIC_* for client; server-only keys (SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY) in server config. |
| Wrangler | Secrets not in repo; dashboard or .dev.vars. |
| No hardcoded secrets | **Assumed** from pattern (getServerConfig(), getPublicConfig()). |

---

## 6. RLS Policies

- Migrations add RLS and tenant-based policies for upload_sessions, jobs, job_events, sync_cursors, change_log, and others. Service-role bypasses RLS; application must enforce tenant for admin client usage.

---

## 7. Recommendations

1. **Lite allow-list:** Reject lite clients from admin, billing, ai, jobs/process, etc. (403).
2. **Admin routes:** Consistently use requireAdmin (or equivalent) and document expected role.
3. **Diag routes:** Ensure /api/_debug/* and /api/diag/* are disabled or strictly gated in production.
4. **Error responses:** Confirm stack traces and internal details are never returned to client.
5. **Audit:** Use audit_logs and existing observability for sensitive actions.
