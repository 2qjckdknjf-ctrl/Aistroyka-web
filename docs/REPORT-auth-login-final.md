# Auth login fix — final report (Cloudflare/OpenNext)

## Step 0 — Current status (facts, before changes)

**A) Login entry point**
- **Page:** `apps/web/app/[locale]/(auth)/login/page.tsx` (client component).
- **Handler:** `doSignIn()` on form submit → calls `signInAction(email, password, traceId)` from `./actions.ts`.
- **Current implementation:** Server action in `app/[locale]/(auth)/login/actions.ts`; uses `createClient()` from `@/lib/supabase/server` (which uses `cookies()` from `next/headers`).

**B) Auth model**
- **Where signInWithPassword runs:** Server (inside server action).
- **Where session is stored:** Server action uses `lib/supabase/server.ts` → `cookieStore.set()` in `setAll`. So session is intended to be in **cookies** (response of the server action). On Cloudflare/OpenNext, server action response may not reliably carry Set-Cookie to the client, which would explain redirect back to /login.
- **How middleware checks session:** `updateSession()` in `lib/supabase/middleware.ts` uses `createServerClient` with `request.cookies.getAll()` and writes to `response.cookies`. It calls `supabase.auth.getUser()`. So middleware reads session from **cookies** only.

**C) Root cause**
1. Session must be in cookies so middleware sees it. Server actions on Edge (OpenNext/Cloudflare) may not attach Set-Cookie to the RPC response in a way the browser persists.
2. "error:unknown" appears when errors are not surfaced (e.g. from server action throw or network) without Supabase message or traceId.

**Conclusion:** Move login to a **route handler** POST /api/auth/login that explicitly sets Set-Cookie on the response and return JSON; client uses fetch and then router.push + refresh. Enforce env checks and add debug endpoint.

---

## Changes made

- **Step 1:** traceId on every attempt; all errors show Supabase message or generic + traceId; structured logs (traceId, step, status, code, message) without password.
- **Step 2:** `assertSupabasePublicEnv()` and `assertSupabaseServerEnv()` in env.ts; login page shows "Supabase env missing" and disables submit when env absent; middleware returns 503 in dev/preview with which env is missing (no values).
- **Step 3:** POST /api/auth/login route handler with createServerClient and cookie adapter; response includes Set-Cookie; login form uses fetch to this endpoint, then router.push + router.refresh. Server action removed from login flow (route handler is primary).
- **Step 4:** GET /api/_debug/auth (dev/preview or DEBUG_AUTH=true) returns hasCookies, cookieNames, hasSupabaseUser, userId, traceId; middleware unchanged (already consistent).
- **Step 5:** `npm run cf:build` passes. (ESLint plugin conflict warning may appear; build continues.)
- **Step 6:** GET /api/health/auth smoke; npm script `smoke:auth` runs curl to /api/health/auth (dev server must be running).
- **Step 7:** This report, commits, push.

---

## How to verify

### Local (Next dev)
```bash
cd apps/web && npm run dev
```
- Open http://localhost:3000/en/login, sign in with valid credentials.
- **Proof 1:** In DevTools → Network, select the login request (POST to /api/auth/login or the action). Response headers must include **Set-Cookie** with `sb-` cookies.
- **Proof 2:** After redirect to dashboard, open http://localhost:3000/api/_debug/auth (dev). Response must show `hasSupabaseUser: true`, `userId` set.
- **Proof 3:** F5 on dashboard — user must remain logged in.

### Local (Cloudflare build)
```bash
cd apps/web && npm run cf:build
```
- Build must complete successfully (ESLint config conflicts are pre-existing; compile must pass).

### Smoke (curl)

With dev server running (`npm run dev` in apps/web):

```bash
# 1) Health auth — must show hasSupabaseEnv and authConfigured true
curl -s http://localhost:3000/api/health/auth
# Expect: {"hasSupabaseEnv":true,"authConfigured":true}

# 2) Debug auth (dev) — without cookies: hasSupabaseUser false; after login in browser, same URL shows true
curl -s http://localhost:3000/api/_debug/auth
# Expect (not logged in): {"hasCookies":false,"cookieNames":[],"hasSupabaseUser":false,"traceId":"..."}
# After login in browser, open in browser: http://localhost:3000/api/_debug/auth → hasSupabaseUser: true

# 3) npm script (requires dev server)
cd apps/web && npm run smoke:auth
```

---

## Required env (names only)

- **NEXT_PUBLIC_SUPABASE_URL** — Supabase project URL (set at build time for Cloudflare so client bundle has it).
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** — Supabase anon key (build time for Cloudflare).

Optional for debug:
- **DEBUG_AUTH** — set to allow GET /api/_debug/auth in production (default: only in dev/preview).

---

## File list (changed/added)

| File | Change |
|------|--------|
| `apps/web/lib/env.ts` | assertSupabasePublicEnv(), assertSupabaseServerEnv() |
| `apps/web/app/[locale]/(auth)/login/page.tsx` | fetch POST /api/auth/login; env alert "Supabase env missing"; errors + traceId; no server action |
| `apps/web/app/api/auth/login/route.ts` | **New** POST handler, Supabase server client, Set-Cookie on response |
| `apps/web/app/api/_debug/auth/route.ts` | **New** GET (dev/preview or DEBUG_AUTH=true): hasCookies, cookieNames, hasSupabaseUser, userId |
| `apps/web/lib/supabase/middleware.ts` | 503 body lists which env is missing (no values) |
| `apps/web/package.json` | script smoke:auth (curl /api/health/auth) |
| `docs/REPORT-auth-login-final.md` | This report |

Unchanged but used: `apps/web/app/[locale]/(auth)/login/actions.ts` (kept; not used by login page anymore). Middleware and /api/health/auth unchanged in logic.

---

## Proof checklist (Definition of Done)

1. **Set-Cookie in login response:** In DevTools → Network, after submitting login, select the request to `/api/auth/login`. Response headers must contain `Set-Cookie` with `sb-` cookies (e.g. `sb-<project>-auth-token`).
2. **GET /api/_debug/auth after login:** With dev server running, log in then open `http://localhost:3000/api/_debug/auth`. Response must show `hasSupabaseUser: true` and `userId` set.
3. **F5 on dashboard:** After login and redirect to dashboard, refresh the page; user must remain logged in (no redirect to /login).
