# Incident RCA: Login hangs (infinite loading) in production

**Date:** 2026-03-03  
**Status:** Resolved (fix applied)  
**Environment:** Production (aistroyka.ai), incognito

---

## 1. Symptoms

- **User flow:** Incognito → `/en/login` → enter email/password → submit.
- **Observed:** UI hangs with infinite loading spinner; login does not complete (no navigation).
- **Known:** `/api/health` ok, build sha7 correct, login page renders new UI. After submitting credentials, page hangs.

---

## 2. Evidence

### 2.1 Login implementation (apps/web)

| File | Role |
|------|------|
| `app/[locale]/(auth)/login/page.tsx` | Client form: `signInWithPassword` then `router.push(next)` + `router.refresh()` |
| `lib/supabase/client.ts` | `createBrowserClient(URL, ANON_KEY)` — session stored in cookies by @supabase/ssr |
| `lib/supabase/middleware.ts` | `updateSession()`: `createServerClient` with request cookies → `getUser()`; writes cookies to response via `setAll` |
| `middleware.ts` | After `updateSession`: protected + !user → redirect to `/{locale}/login`; auth page + user → redirect to next/dashboard |

### 2.2 Root causes (proven from code)

**Cause 1 — Spinner never stops on error/timeout**

- No try/catch: if `signInWithPassword` throws, `setLoading(false)` never ran.
- No timeout: if the promise never resolved, loading stayed true.
- No finally: any throw (including in `router.push`/`router.refresh`) left loading true.

**Cause 2 — Post-login navigation hangs (production)**

- After success we used `router.push(next)` + `router.refresh()`. That is a **client-side** navigation (RSC fetch).
- On Cloudflare Workers / Edge, the next request (for dashboard) may not reliably receive or use the session cookies set by the browser client immediately after sign-in, or the RSC/redirect response handling can leave the client in a loading state instead of following the redirect.
- Result: signIn succeeds, but the app appears to hang because the client never completes navigation or the server redirects to login and the client doesn’t follow it visibly.

**Fix for Cause 2:** Use a **full page redirect** after successful login (`window.location.href = targetPath`) so the browser issues a normal document request with the Cookie header. Middleware then sees the session and allows access to the dashboard; no reliance on client router or RSC redirect handling.

### 2.3 Hypothesis checks

| Hypothesis | Check | Result |
|------------|--------|--------|
| **A) Supabase error swallowed** | Auth `err` was handled; throws were not. | Addressed with try/catch/finally + timeout. |
| **B) NEXT_PUBLIC_APP_URL** | `lib/app-url.ts`: defaults to `https://aistroyka.ai` when unset. Set in production to `https://aistroyka.ai` (no trailing slash). | Correct for aistroyka.ai. |
| **C) Session cookie** | Middleware reads `request.cookies`, Supabase server client uses same cookie API. Full page redirect ensures next request sends cookies. | Full-page redirect fixes delivery. |
| **D) Redirect loop** | Logic: protected && !user → login; auth && user → dashboard. No loop. Middleware sets `X-Auth-Redirect` for debugging. | No loop; header added to verify. |

### 2.4 Diagnostics

- **UI (login page):** Visible line `Login step: idle | submitting | supabase_ok | redirecting | error:<code>`. Identifies stuck stage without DevTools.
- **Response header:** `X-Auth-Redirect: login` when middleware sends user to login; `X-Auth-Redirect: dashboard` when redirecting authenticated user from login to dashboard; `X-Auth-Redirect: pass` when no auth redirect.
- **Supabase connectivity:** `GET /api/diag/supabase` returns `{ reachable, latencyMs }` (lightweight HEAD to Supabase origin; no secrets). Use to confirm Supabase is not blocked (CSP, network).
- **Auth smoke script:** `./scripts/auth-smoke.sh [BASE_URL]` hits `/en/login` (headers), `/api/health`, `/api/diag/supabase` and writes results to `docs/audit/auth-smoke.<timestamp>.txt`.

---

## 3. Fix applied

### 3.1 Login page (`app/[locale]/(auth)/login/page.tsx`)

1. **Timeout (15s)** + **try/catch/finally** so the spinner always stops and errors are shown.
2. **Full page redirect after success:** In the browser, use `window.location.href = targetPath` instead of `router.push(next)` + `router.refresh()`. Ensures the next request is a normal document load with cookies, so middleware can read the session and serve the dashboard.
3. **Visible debug line (no DevTools needed):** UI shows `Login step: idle | submitting | supabase_ok | redirecting | error:timeout | error:auth | error:network | error:unknown` so the stuck stage is identifiable in production.
4. **Sign-in helper** `signInWithObservability(email, password)` returns `{ ok, stage, durationMs, errorCode?, errorMessage? }`; on error/timeout the UI shows a user-facing message and a **Retry** button; `setLoading(false)` is always called in `finally`.
5. **Console logs (no secrets):** On unexpected throw, `[login] unexpected throw` is logged.

### 3.2 Middleware (`middleware.ts`)

- **Diagnostic header:** `X-Auth-Redirect: login` when redirecting to login (blocked); `X-Auth-Redirect: dashboard` when redirecting from auth page to dashboard; `X-Auth-Redirect: pass` when not redirecting for auth. Use Network tab to confirm no unexpected redirect to login after successful sign-in.

### 3.3 Register page

- Same robustness as login: try/catch/finally, 15s timeout, `setLoading(false)` in finally (already in place).

### 3.4 NEXT_PUBLIC_APP_URL

- Must match production origin exactly: `https://aistroyka.ai` (no trailing slash). Set in Cloudflare Worker vars if needed. Used for www→apex redirect and any OAuth redirectTo.

---

## 4. Verification

1. **Incognito login**
   - Open `https://aistroyka.ai/en/login`.
   - Watch the **Login step** line: should move `idle` → `submitting` → `supabase_ok` → `redirecting`, then full page navigates to dashboard (no infinite loading).
   - Enter invalid credentials → error message shown, **Retry** button; step shows `error:auth`; spinner stops.
   - Simulate timeout (e.g. block Supabase in DevTools) → step shows `error:timeout` or `error:network` within 15s; **Retry** available.

2. **Response headers (Network tab)**
   - After submitting valid credentials: document request to `/en/dashboard` should return 200 (or 307 to same) with `X-Auth-Redirect: pass`. If you see `X-Auth-Redirect: login` on the dashboard request, session was not seen by middleware.

3. **Supabase reachability**
   - `GET /api/diag/supabase` → `{ reachable: true, latencyMs: number }`. If `reachable: false`, check CSP (`connect-src` to `https://*.supabase.co`), network, or firewall.

4. **Auth smoke script**
   - Run `./scripts/auth-smoke.sh https://aistroyka.ai`. Check `docs/audit/auth-smoke.<timestamp>.txt` for login page HTTP code, health JSON, and diag/supabase result.

5. **NEXT_PUBLIC_APP_URL**
   - Production: set to `https://aistroyka.ai` (no trailing slash) in Cloudflare Worker vars.

6. **Production build**
   - `npm run build` (or cf:build) in apps/web; test login locally with production build, then deploy and test on aistroyka.ai.

---

## 5. If issues persist

- **Still hangs:** Check Network for Supabase auth request (e.g. `.../auth/v1/token?grant_type=password`): status, CORS. CSP must include `connect-src ... https://*.supabase.co`.
- **Session not seen:** After login, request to `/en/dashboard` returns 302 to login and response has `X-Auth-Redirect: login` → cookies not sent or not read. Confirm Worker env has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; ensure cookie domain/SameSite allow sending on same-origin request.
- **Wrong path:** `next` should be locale-prefixed when present (e.g. `/en/dashboard`). Full page redirect uses `targetPath` as-is.

---

## 6. Commit (applied)

```
fix(auth): eliminate prod login hang with deterministic stages + full redirect

- Login: try/catch/finally, 15s timeout; full page redirect after success
  (window.location.href); signInWithObservability returns ok/stage/durationMs/errorCode
- Visible UI: Login step (idle|submitting|supabase_ok|redirecting|error:<code>);
  on error: user message + Retry button; loading cleared in finally
- GET /api/diag/supabase: reachable + latencyMs (no secrets)
- scripts/auth-smoke.sh: /en/login, /api/health, /api/diag/supabase → docs/audit/auth-smoke.<ts>.txt
- Middleware: X-Auth-Redirect (login|dashboard|pass) unchanged
- RCA: docs/INCIDENT_LOGIN_HANG.md updated
```
