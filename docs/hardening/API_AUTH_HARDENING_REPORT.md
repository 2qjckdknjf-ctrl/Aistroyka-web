# API auth hardening report

**Branch:** hardening/dashboard-auth-middleware-sweep

## Summary

All API routes and server paths that used unsafe `const { data: { user } } = await supabase.auth.getUser()` or similar have been refactored to use `getSessionUser(supabase)` from `@/lib/supabase/server`, which never throws and returns `{ id, email? } | null`.

## Routes updated

| Route | Change |
|-------|--------|
| app/api/tenant/accept-invite/route.ts | getSessionUser(supabase) |
| app/api/tenant/revoke/route.ts | getSessionUser(supabase) |
| app/api/tenant/invitations/route.ts | getSessionUser(supabase) |
| app/api/projects/[id]/upload/route.ts | getSessionUser(supabase) |
| app/api/projects/[id]/poll-status/route.ts | getSessionUser(supabase) |
| app/api/analysis/process/route.ts | getSessionUser(supabase) |
| app/api/v1/org/tenants/route.ts | getSessionUser(supabase) |
| app/api/v1/org/metrics/overview/route.ts | getSessionUser(supabase) |
| app/api/_debug/auth/route.ts | createClient + getSessionUser (dynamic import to avoid circular deps) |

## Shared libs used by API

| Lib | Change |
|-----|--------|
| lib/supabase/rpc.ts | getSessionUser(supabase) in createProject, listProjectsForUser, triggerAnalysisForMedia |
| lib/api/engine.ts | Safe res?.data?.user ?? null in getOrCreateTenantForCurrentUser |
| lib/auth/admin.ts | getSessionUser(supabase) in isAdmin |
| lib/auth/tenant.ts | getSessionUser(supabase) in getRoleInTenant |
| lib/domain/tenants/tenant.service.ts | getSessionUser(supabase) in getOrCreateTenantForUser |

## Status codes

- Unauthorized (no user): 401 where appropriate.
- Forbidden (no tenant / insufficient role): 403 where appropriate.
- No accidental 500 from null destructuring; getSessionUser returns null and callers check and return 401 or redirect.
