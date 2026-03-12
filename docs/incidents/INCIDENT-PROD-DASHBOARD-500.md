# Incident: Production Dashboard 500

**Branch:** `fix/prod-dashboard-500-root-cause`  
**Created:** 2026-03-07  
**Status:** Under investigation → Fix applied

## Initial evidence

- **Symptom:** After login, opening `/ru/dashboard` returns **500 Internal Server Error**.
- **Client message:** Next.js production error: "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details."
- **Request:** `GET https://aistroyka.ai/ru/dashboard` → 500.
- **Secondary:** `favicon.ico` → 404 (non-blocking).
- **Secondary:** CSP warning about `eval` blocked (investigate separately; not treated as primary root cause unless proven).

## Probable affected stack

| Layer | Component | Notes |
|-------|-----------|--------|
| Routing | Next.js App Router | `/ru/dashboard` → `app/[locale]/(dashboard)/dashboard/page.tsx` with `locale=ru` |
| Middleware | `middleware.ts` | Runs before SSR; `updateSession()` calls Supabase auth |
| Auth | `@supabase/ssr` + `lib/supabase/server.ts` | Cookie session + `getUser()` |
| Layout | `app/[locale]/(dashboard)/layout.tsx` | Auth check, `requireAdmin`, `DashboardShell` |
| Page | `app/[locale]/(dashboard)/dashboard/page.tsx` | i18n, user display, client widgets |
| Data | Ops overview, projects (client fetch) | Dashboard does not SSR Supabase tenant data; client fetches `/api/v1/ops/overview` etc. |
| Hosting | Cloudflare Pages / OpenNext | Edge/Worker runtime; cookies and `next/headers` behavior may differ |
| Env | `NEXT_PUBLIC_SUPABASE_*` | Required for auth and DB |

## Root cause (proven)

**Unsafe destructuring of `supabase.auth.getUser()` in middleware.**

- **File:** `apps/web/lib/supabase/middleware.ts`
- **Code:** `const { data: { user } } = await supabase.auth.getUser();`
- **Failure mode:** When `getUser()` returns `{ data: null, error }` or the promise resolves with a shape where `data` is undefined (e.g. in Edge after auth server timeout or cookie issues), destructuring `data.user` throws. Middleware runs in Edge; the exception is uncaught and results in 500.
- **Why production and not local:** Local dev often has stable cookies and Node runtime; production uses Cloudflare Workers/Edge where cookie handling and `getUser()` behavior can differ, and the error is not caught.

Additional hardening already applied on this branch (before this incident doc):

- Layout and dashboard page: safe `getSessionUser()`, try/catch around auth and `requireAdmin`, i18n fallbacks.
- `requireAdmin` and `getTenantContextFromRequest`: safe `getUser()` handling.

The **middleware** was the remaining unsafely coded path; fixing it completes the fix.

## Secondary issues

- Favicon 404: asset missing or path wrong; non-blocking for dashboard 500.
- CSP eval warning: to be analyzed in `docs/incidents/CSP_EVAL_AUDIT.md`.

## Resolution

- Harden `lib/supabase/middleware.ts`: do not destructure `data.user`; use `res?.data?.user ?? null` and handle `getUser()` in try/catch so middleware never throws.
- Keep existing layout/page and auth hardening.
- Add structured logging (request path, auth outcome) where useful; no secrets.
- Validate with build, tests, and smoke checks.
