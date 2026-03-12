# Dashboard dataflow map

**Route:** `/ru/dashboard` → `app/[locale]/(dashboard)/layout.tsx` + `app/[locale]/(dashboard)/dashboard/page.tsx` with `locale=ru`.

## SSR data sources (server)

| Source | Location | Called in | Truth | Success shape | Failure handling | Can crash page? |
|--------|----------|-----------|--------|----------------|------------------|-----------------|
| `headers()` | next/headers | Layout | Request | `Headers` | try/catch → default locale | No (guarded) |
| `createClient()` | lib/supabase/server | Layout, Page | Cookies + env | SupabaseClient | try/catch → redirect or fallback | No (guarded) |
| `getSessionUser(supabase)` | lib/supabase/server | Layout, Page | Supabase Auth | `{ id, email? } \| null` | never throws, returns null | No |
| `requireAdmin(supabase)` | requireAdmin.ts | Layout | tenant_members | `{ allowed, adminTenantIds }` | try/catch → isAdmin=false | No (guarded) |
| `getTranslations("dashboard")` | next-intl/server | Page | i18n messages | `(key)=>string` | try/catch → FALLBACK_T | No (guarded) |
| `getLocale()` | next-intl/server | Page | i18n | string | try/catch → "en" | No (guarded) |

Dashboard page does **not** load projects, ops overview, or tenant data on the server; those are client-side only.

## Middleware (before SSR)

| Step | Location | Data | Failure handling | Can cause 500? |
|------|----------|------|------------------|----------------|
| `updateSession(request)` | lib/supabase/middleware.ts | `getUser()` → user | **Fixed:** try/catch + `res?.data?.user ?? null` | No (after fix) |
| `intlMiddleware(request)` | next-intl | locale routing | next-intl internal | Unlikely |
| Protected path check | middleware.ts | pathWithoutLoc, user | Redirect to login if no user | No |

**Root cause of 500:** Middleware previously used unsafe `const { data: { user } } = await supabase.auth.getUser()`. When `data` was null/undefined, destructuring threw and middleware returned 500. Fixed by safe access and try/catch.

## Client-side data (after hydration)

| Source | Component | API | Failure handling | Can crash full page? |
|--------|-----------|-----|------------------|----------------------|
| Ops overview | DashboardOpsOverviewClient | GET /api/v1/ops/overview | useQuery + ErrorState | No (isolated UI) |
| Projects list | DashboardRecentProjectsClient | GET /api/projects | QueryBoundary + empty/error state | No (isolated) |

## Auth flow summary

1. **Middleware:** `updateSession()` → safe `getUser()` → if no user and path protected → redirect to `/${locale}/login`.
2. **Layout:** `createClient()` + `getSessionUser()` in try/catch → if throw or no user → redirect to login. `requireAdmin()` in try/catch → at most isAdmin=false.
3. **Page:** Same auth in try/catch for display only; layout already enforced access.

## Env dependencies

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: required for auth and client creation. Missing in prod → hasSupabaseEnv() false → middleware returns 503 or continues with null user; layout createClient() may throw → caught and redirect.
