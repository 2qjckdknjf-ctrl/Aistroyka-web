# Security Hardening — Enterprise

**Phase 7 — Enterprise Hardening**  
**Tenant safety and least-privilege first; production-safe defaults.**

---

## 1. RBAC matrix (owner / admin / member / viewer)

| Role   | DB value | Capabilities (summary) |
|--------|----------|-------------------------|
| **Owner**  | `owner`  | Full tenant control; tenant settings; invite; project CRUD; admin panel (AI, jobs, SLO, push, audit, governance, trust); billing. |
| **Admin**  | `admin`  | Same as owner for tenant operations and admin panel (read/write). Cannot transfer ownership. |
| **Member** | `member` | Manager/foreman: projects, tasks, reports, workers, ops overview; worker-day management; report review; no admin panel, no tenant invite/settings. |
| **Viewer** | `viewer` | Read-only: projects, reports, media; no write, no admin, no worker-day management. |

**Mapping (authz):** `lib/authz/authz.types.ts` maps DB role to enterprise role (OWNER, MANAGER, WORKER, CONTRACTOR).  
**Role order:** `lib/authz/authz.policy.ts` defines `ROLE_ORDER` (owner=4, admin=3, member=2, viewer=1) and `minRoleForAction(action)` for sync and policy checks.  
**Admin guard:** `lib/api/require-admin.ts` — `requireAdmin(ctx, "read"|"write")` returns 403 if context role is not owner or admin. Used by all `/api/v1/admin/*` routes after `requireTenant(ctx)`.

---

## 2. Route-level permission checks

- **Tenant context:** All v1 API routes that need tenant scope call `getTenantContextFromRequest(request)` then `requireTenant(ctx)`. Absent or invalid membership → 401/403.
- **Admin routes:** `/api/v1/admin/*` (analytics, AI usage, SLO, jobs, audit-logs, privacy findings, exports, push, etc.) call `requireAdmin(ctx, "read")` or `requireAdmin(ctx, "write")` after `requireTenant(ctx)`. Member/viewer → 403.
- **Lite client allow-list:** `lib/api/lite-allow-list.ts` — `checkLiteAllowList(pathname, x-client)` returns 403 for `ios_lite`/`android_lite` on disallowed paths. Allowed: `/api/v1/config`, `/api/v1/worker/*`, `/api/v1/sync/*`, `/api/v1/media/upload-sessions*`, `/api/v1/devices*`, `/api/v1/auth*`, report analysis-status. Admin and other manager paths are forbidden for lite clients. Enforced in middleware for `/api/v1`.
- **Service-role rejection:** `lib/supabase/server.ts` — `createClientFromRequest(request)` rejects requests that send a JWT with `role === "service_role"` (throws `ServiceRoleForbiddenError` → API returns 403). Prevents client-side use of service role.

**Gaps / recommendations:**  
- Document each admin route’s required scope (read vs write) in a single matrix.  
- Consider explicit scope checks for sensitive write actions (e.g. tenant invite, role change) using `authorize(ctx, "tenant:invite")` where applicable.

---

## 3. Security headers (CSP, HSTS, X-Frame-Options, etc.)

**Implemented (middleware):** `apps/web/middleware.ts` applies to all non-static responses:

| Header | Value |
|--------|--------|
| **X-Frame-Options** | `DENY` |
| **X-Content-Type-Options** | `nosniff` |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | `camera=(), microphone=()` |
| **Content-Security-Policy** | `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co; connect-src 'self' https://*.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline';` |
| **Strict-Transport-Security** | `max-age=31536000; includeSubdomains; preload` (production only) |

**Recommendations:**  
- Tighten CSP when possible: reduce `'unsafe-inline'` for script/style (e.g. nonces or hashes).  
- Document any new external domains (e.g. Sentry, analytics) before adding to CSP.  
- Keep HSTS production-only to avoid pinning in dev.

---

## 4. Secrets rotation playbook

- **Supabase:** Anon key and service role key — rotate in Supabase Dashboard; update env (Vercel/Cloudflare, etc.); redeploy; re-test auth and admin/job flows.  
- **OpenAI / AI providers:** Rotate API keys in provider console; update `OPENAI_API_KEY` (and others) in env; redeploy; verify AI analysis and copilot.  
- **Cron / webhook secrets:** Rotate `CRON_SECRET`, Stripe webhook secret, etc.; update env and provider config; redeploy.  
- **No client-side secrets:** Service role and server-only keys are never sent to the client; rotation does not require app releases except for config that is baked in (e.g. Supabase URL is public).  
- **Document:** Maintain a short runbook (e.g. in `docs/runbooks/`) listing each secret, where it is used, and rotation steps. Rotate after any suspected exposure.

---

## 5. Dependency vulnerability scanning

- **Current:** No automated dependency scan in repo (no Dependabot, Snyk, or npm audit in CI shown).  
- **Recommendations:**  
  - Run `npm audit` (and `npm audit fix` where safe) before each release; document in release checklist.  
  - Enable Dependabot or Snyk for alerts and PRs; gate on no high/critical unresolved vulnerabilities.  
  - Pin major versions and review lockfile changes in PRs.  
- **Scope:** Backend (Next.js, Supabase, etc.), web dashboard; when present, iOS/Android dependencies.

---

## 6. Supabase RLS and service-role usage

- **RLS:** Tenant-scoped tables (projects, reports, tenant_members, etc.) should have RLS policies that restrict `SELECT`/`INSERT`/`UPDATE`/`DELETE` by `tenant_id` (and optionally `auth.uid()`). Audit logs: RLS restricts select to tenant owner/admin (per ADR-016).  
- **Verification:** Review each table used by the app: ensure RLS is enabled and policies enforce tenant (and role where applicable). No row-level access to other tenants’ data.  
- **Service-role usage:** `getAdminClient()` (lib/supabase/admin.ts) uses `SUPABASE_SERVICE_ROLE_KEY`; used only server-side for: job queue (claim, mark success/fail), push enqueue, idempotency storage, rate_limit_slots, exports, and other operations that bypass RLS by design.  
- **Rule:** Service-role client is never exposed to the browser; API routes that need cross-tenant or system operations use admin client only after authz (e.g. tenant context and requireAdmin).  
- **Recommendation:** Document each use of `getAdminClient()` and the justification (e.g. “job processor must update any tenant’s jobs”).

---

## Control summary

| Control | Status | Notes |
|---------|--------|--------|
| RBAC matrix | Documented | owner/admin/member/viewer; requireAdmin on admin routes |
| Route-level checks | Implemented | requireTenant + requireAdmin; lite allow-list; service-role rejection |
| Security headers | Implemented | CSP, HSTS, X-Frame-Options, etc. in middleware |
| Secrets rotation | Documented | Playbook steps; no automation |
| Dependency scanning | Recommended | Add npm audit / Dependabot / Snyk |
| RLS / service-role | Documented | Verify RLS per table; document admin client usage |
