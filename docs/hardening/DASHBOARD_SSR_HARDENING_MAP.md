# Dashboard SSR hardening map

**Branch:** hardening/dashboard-auth-middleware-sweep

## Critical loaders (must not crash)

| Loader | Location | Failure handling |
|--------|----------|------------------|
| Auth (user) | layout.tsx, dashboard/page.tsx | getSessionUser (never throws); try/catch + redirect to login on throw from createClient |
| headers() | layout.tsx | try/catch; default locale fallback |
| requireAdmin | layout.tsx | try/catch; isAdmin = false on throw |
| getTranslations / getLocale | dashboard/page.tsx | try/catch; FALLBACK_T, locale "en" |
| createClient | layout, page | try/catch in layout (redirect); try/catch in page (user = null fallback) |

## Optional / non-critical (isolated)

| Source | Location | Failure handling |
|--------|----------|------------------|
| Ops overview | DashboardOpsOverviewClient (client fetch) | useQuery + ErrorState; does not crash page |
| Recent projects | DashboardRecentProjectsClient (client fetch) | QueryBoundary + empty/error state |
| Other dashboard widgets | Client components | Each uses useQuery/QueryBoundary or equivalent |

## Failure model

- **Critical path:** Layout resolves auth and locale; on any throw or null user → redirect to `/[locale]/login` (or `?session_error=1`). requireAdmin throw → treat as non-admin.
- **Page:** i18n and auth in try/catch; missing user shows "—" for email; page still renders.
- **Client widgets:** Failures show ErrorState or empty state; no full-page crash.

## Remaining risks

- getTranslations/getLocale could throw before try/catch if called in a different order; current order is try/catch first. Low.
- Third-party or Supabase client change to response shape; current code uses optional chaining throughout.
