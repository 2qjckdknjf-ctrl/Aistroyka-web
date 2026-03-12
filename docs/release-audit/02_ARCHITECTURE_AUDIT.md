# Release Audit — Phase 2: Architecture & System Boundary Audit

**Generated:** Release Readiness Audit  
**Scope:** AISTROYKA platform boundaries, layering, violations.

---

## 1. Intended Architecture (Target)

- **Client/UI** (web app, iOS manager, iOS lite) → **Transport/API** (Next.js route handlers)
- **Auth/tenant context** (middleware + getTenantContextFromRequest, requireTenant, requireAdmin)
- **Application/domain services** (lib/domain/*, lib/platform/*)
- **Repositories / data access** (lib/domain/*.repository, lib/supabase/rpc)
- **External providers** (Supabase, OpenAI/Anthropic/Gemini via provider router, Stripe)

---

## 2. Current Architecture State

### Strong areas

- **Tenant context:** Centralized in `lib/tenant`; `getTenantContextFromRequest` + `requireTenant` used consistently on v1 and tenant routes. RBAC (permissionSet, scopes) loaded in context.
- **Admin isolation:** Admin routes use `requireAdmin(ctx, "read"|"write")` after tenant; admin operations use getAdminClient() where needed.
- **Lite client allow-list:** Middleware enforces `checkLiteAllowList` for `/api/v1` when `x-client` is ios_lite/android_lite; prevents lite clients from hitting manager/admin endpoints.
- **Domain layer:** Tasks, reports, projects, upload-session, worker-day, notifications have repository + service split; tenant_id scoping in repositories.
- **AI path:** Vision analysis goes through `runVisionAnalysis` → AIService.analyzeImage → provider router; policy engine and usage recording present.
- **Jobs:** Job processing in `lib/platform/jobs` (job.service, handlers); cron-tick uses requireCronSecretIfEnabled; jobs/process is tenant + authorize("jobs:process").
- **Config:** Centralized in lib/config (public, server, debug); no raw process.env for app config outside.

### Weak areas / violations

- **Legacy API routes** (`/api/projects/[id]`, `/api/projects`, `/api/analysis/process`, etc.): Use `createClient()` and RPC/engine layer directly without explicit `requireTenant` in the route. Tenant isolation is enforced inside RPC (e.g. getProjectById uses getOrCreateTenantForCurrentUser + tenant_id filter). **Risk:** Inconsistent pattern; new contributors may add legacy-style routes without tenant check.
- **Business logic in routes:** Some route handlers contain non-trivial logic (e.g. polling, multi-step responses) that could be in services. Not a critical boundary violation but reduces testability.
- **Direct DB in routes:** Several routes call `createClient()` or `getAdminClient()` and then use supabase directly (e.g. admin flags, admin ai/usage) rather than going through a dedicated repository. Acceptable for admin-only routes but duplicates patterns.
- **Duplicate lib:** Root `lib/` (supabase, env) vs apps/web/lib; root lib is thin; apps/web is self-contained. Risk of confusion or drift if root lib is used elsewhere.
- **AI caller responsibility:** runVisionAnalysis requires caller to pass tenantId/userId/traceId for usage; some call paths may omit (e.g. job handlers). Audit of all call sites recommended.
- **Webhook auth only:** Billing webhook is unauthenticated except Stripe signature. No double-submit or idempotency key in handler (Stripe events are idempotent by event id; handler does not explicitly dedupe).

---

## 3. Critical Boundary Violations

| Violation | Severity | Location | Notes |
|-----------|----------|----------|--------|
| Legacy routes skip explicit requireTenant | P1 | app/api/projects/*, app/api/analysis/process | RPC enforces tenant; route layer does not. |
| Middleware skips auth for /api/* (non-v1) | P2 | middleware.ts | Only /api/v1 gets lite allow-list; legacy /api/* passes through; session still required for cookie-based createClient in those routes. |
| Service role in cron-tick | By design | cron-tick/route.ts | Uses getAdminClient(); no tenant. Correct for system job. |
| _debug and diag routes | P2 | _debug/auth, diag/supabase | Gated by isDebugAuthAllowed / isDebugDiagAllowed; must be disabled in production. |

---

## 4. Tenant Leakage Risk

- **RLS:** Migrations enable RLS on tenants, tenant_members, projects, and other core tables; policies use `auth.uid()` and tenant_members/tenants.
- **Service role:** getAdminClient() bypasses RLS. Used only in cron-tick, job processing, billing webhook, AI usage recording, and admin operations. No evidence of tenant_id being dropped in admin queries that span tenants.
- **Recommendation:** Ensure all admin/list operations that return tenant-specific data filter by tenant_id when called in tenant context; when called in system context (cron), iteration is per-tenant.

---

## 5. Auth Bypass Patterns

- **Public endpoints:** /api/health, /api/health/auth, /api/auth/login, /api/v1/config, /api/v1/billing/webhook (Stripe-signed), /api/_debug/auth (gated), /api/diag/supabase (gated). All documented and intentional.
- **Cron:** /api/v1/admin/jobs/cron-tick protected by requireCronSecretIfEnabled. /api/v1/jobs/process requires tenant + cron secret OR tenant auth + authorize.
- No obvious auth bypass in reviewed routes.

---

## 6. Duplicated Service Logic

- **Projects:** Legacy RPC (listProjectsForUser, getProjectById) vs v1 project routes that use domain/repositories. Two code paths for “list/get project.”
- **AI analyze:** /api/ai/analyze-image (legacy) and /api/v1/ai/analyze-image; legacy delegates to same implementation with deprecation headers.

---

## 7. Missing Abstraction Layers

- **Upload/session:** Domain exists (upload-session.service, repository); route handlers use them. No gap.
- **Sync:** Sync service and repository; routes use tenant context and services. Adequate.
- **AI:** Single entry (AIService.analyzeImage) used by both legacy and v1 routes. Policy and usage in place; no separate “AI gateway” layer (acceptable).

---

## 8. Refactor Priority Ranking

| Priority | Item | Action |
|----------|------|--------|
| P0 | None | No P0 boundary violation that blocks release. |
| P1 | Legacy route auth pattern | Add requireTenant (or document that RPC enforces) and prefer v1 for new features. |
| P1 | Debug/diag in production | Verify isDebugAuthAllowed/isDebugDiagAllowed return false in production. |
| P2 | Consolidate project read path | Prefer v1 project API and domain layer; deprecate legacy project RPC for reads. |
| P2 | Webhook idempotency | Consider storing processed Stripe event ids to avoid double-processing on retries. |

---

## 9. Summary

- **Architecture score:** 7/10. Clear tenant and admin separation; domain and platform layers present; legacy and v1 coexistence and some route-level inconsistency.
- **Release:** No architecture P0 blocker. P1 items are hardening and config verification.
