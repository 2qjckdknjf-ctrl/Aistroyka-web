# Report: Dashboard auth hardening sweep

**Branch:** hardening/dashboard-auth-middleware-sweep  
**Date:** 2026-03-07

## 1. Executive summary

A full hardening pass was performed across the web app so that auth and dashboard flows are robust and do not regress. All unsafe destructuring of `supabase.auth.getUser()` and `getSession()` in auth-critical paths was removed. Server and API code now use `getSessionUser(supabase)` or safe `res?.data?.user ?? null` / `res?.data?.session ?? null` with try/catch. Client hooks and components use the same safe pattern. Middleware was already fixed on the incident branch; layout and dashboard page were already hardened. This sweep extended the pattern to all remaining server pages, API routes, shared libs, and client auth usage.

## 2. Patterns found and fixed

- **Unsafe:** `const { data: { user } } = await supabase.auth.getUser();` or `const { data: { session } } = await supabase.auth.getSession();`  
  **Risk:** When `data` is null/undefined or the call throws (e.g. in Edge), the process throws and can result in 500.  
  **Fix:** Use `getSessionUser(supabase)` (server) or `const res = await ...; const user = res?.data?.user ?? null` (and session analog) inside try/catch where a shared helper is not used.

- **Places updated:**  
  - **Server/layouts/pages:** app/[locale]/page.tsx, app/[locale]/(dashboard)/team/page.tsx, portfolio/page.tsx, projects/[id]/page.tsx, projects/[id]/ai/page.tsx — all use getSessionUser.  
  - **API routes:** tenant/accept-invite, tenant/revoke, tenant/invitations, projects/[id]/upload, projects/[id]/poll-status, analysis/process, v1/org/tenants, v1/org/metrics/overview, _debug/auth — all use getSessionUser or safe access.  
  - **Shared libs:** lib/supabase/rpc.ts, lib/api/engine.ts, lib/auth/admin.ts, lib/auth/tenant.ts, lib/domain/tenants/tenant.service.ts — getSessionUser or safe res?.data?.user.  
  - **Client:** components/ai/AiActionPanel.tsx, lib/features/ai/components/CopilotChatPanel.tsx, lib/features/ai/api/useCopilotThread.ts, app/[locale]/invite/accept/page.tsx, src/features/admin/ai/api/* (useAdminTenants, useAiSloDaily, useAiSecurityEvents, useAiUsageSummary, useRequestById, useRecentIssues, useAiBreakerState) — safe getSession/getUser with try/catch and res?.data.

## 3. Root regression risks removed

- Middleware: already safe (previous fix).  
- Layout and dashboard page: already safe.  
- All other server and API paths that touched getUser/getSession: now safe.  
- Client hooks and components that call getSession/getUser: now safe.  
- No remaining unsafe destructuring in auth-critical code under apps/web (excluding audit_* artifacts).

## 4. Files changed

| Area | Files |
|------|--------|
| **Server helpers** | lib/supabase/server.ts (added safeGetSession) |
| **Shared libs** | lib/supabase/rpc.ts, lib/api/engine.ts, lib/auth/admin.ts, lib/auth/tenant.ts, lib/domain/tenants/tenant.service.ts |
| **Pages** | app/[locale]/page.tsx, app/[locale]/(dashboard)/team/page.tsx, app/[locale]/(dashboard)/portfolio/page.tsx, app/[locale]/(dashboard)/projects/[id]/page.tsx, app/[locale]/(dashboard)/projects/[id]/ai/page.tsx |
| **API routes** | app/api/tenant/accept-invite/route.ts, app/api/tenant/revoke/route.ts, app/api/tenant/invitations/route.ts, app/api/projects/[id]/upload/route.ts, app/api/projects/[id]/poll-status/route.ts, app/api/analysis/process/route.ts, app/api/v1/org/tenants/route.ts, app/api/v1/org/metrics/overview/route.ts, app/api/_debug/auth/route.ts |
| **Client** | components/ai/AiActionPanel.tsx, lib/features/ai/components/CopilotChatPanel.tsx, lib/features/ai/api/useCopilotThread.ts, app/[locale]/invite/accept/page.tsx, src/features/admin/ai/api/useAdminTenants.ts, useAiSloDaily.ts, useAiSecurityEvents.ts, useAiUsageSummary.ts, useRequestById.ts, useRecentIssues.ts, useAiBreakerState.ts |
| **Tests** | app/api/analysis/process/route.test.ts (mock getSessionUser) |
| **Docs** | docs/hardening/AUTH_PATTERN_AUDIT.md, DASHBOARD_SSR_HARDENING_MAP.md, API_AUTH_HARDENING_REPORT.md, ENV_VALIDATION_REPORT.md, OBSERVABILITY_NOTES.md |

## 5. Tests added/updated

- **Existing:** lib/supabase/middleware.test.ts (4 tests) — already covered middleware safe getUser.  
- **Updated:** app/api/analysis/process/route.test.ts — mock @/lib/supabase/server to export getSessionUser; 401 test mocks getSessionUser to return null.  
- **No new test file** added; coverage extended by fixing the process route test to match the new route implementation.

## 6. Validation results

- **Lint:** Passed.  
- **Unit tests:** 364 passed (77 test files).  
- **Dashboard smoke script:** apps/web/scripts/smoke/dashboard_smoke.sh exists and checks health, /dashboard, /ru/dashboard (no 500).  
- **Production build:** Not run in this session; recommend running `npm run build` (and cf:build if applicable) before merge.

## 7. Remaining risks

- **audit_* / audit_web_* artifacts:** Not refactored; they are legacy copies. If they are ever used, they still contain unsafe patterns.  
- **Env:** Missing NEXT_PUBLIC_SUPABASE_* in production can still lead to createClient() or downstream Supabase calls failing; layout and middleware handle them with redirect or null user, so 500 from auth destructuring is removed.  
- **Third-party/Supabase:** Future change to Auth API response shape could require updates; current code is defensive with optional chaining and null coalescing.

## 8. References

- docs/hardening/AUTH_PATTERN_AUDIT.md — full list of findings and fix status.  
- docs/hardening/DASHBOARD_SSR_HARDENING_MAP.md — critical vs optional loaders, failure model.  
- docs/hardening/API_AUTH_HARDENING_REPORT.md — API routes and shared libs updated.  
- docs/hardening/ENV_VALIDATION_REPORT.md — env behavior and recommendations.  
- docs/hardening/OBSERVABILITY_NOTES.md — logging and safe observability.
