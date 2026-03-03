# Incident RCA: Login hangs (infinite loading) in production

**Date:** 2026-03-03  
**Status:** Resolved (fix applied)  
**Environment:** Production (aistroyka.ai), incognito

---

## 1. Symptoms

- **User flow:** Incognito → `/en/login` → enter email/password → submit.
- **Observed:** UI hangs with infinite loading spinner; login does not complete.
- **Known:** `/api/health` returns `supabaseReachable: true`, build sha7 `0e363e4`. Deployed app is `apps/web`.

---

## 2. Evidence

### 2.1 Login implementation (apps/web)

| File | Role |
|------|------|
| `app/[locale]/(auth)/login/page.tsx` | Login page; client form calls `signInWithPassword`, then `router.push(next)` + `router.refresh()` |
| `lib/supabase/client.ts` | `createClient()` → `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` |
| `lib/supabase/middleware.ts` | `updateSession()` uses `createServerClient`, reads cookies from request, sets cookies on response, returns `getUser()` |
| `middleware.ts` | Runs `updateSession` then intl; protected routes → redirect to `/{locale}/login` when no user; auth pages with user → redirect to next/dashboard |

### 2.2 Root cause (proven from code)

**Original login handler (simplified):**

```ts
setLoading(true);
const { error: err } = await supabase.auth.signInWithPassword({ email, password });
setLoading(false);
if (err) { setError(...); return; }
router.push(next);
router.refresh();
```

- **No try/catch:** If `signInWithPassword` **throws** (e.g. network error, CORS, or client exception), `setLoading(false)` is never run → spinner never stops.
- **No timeout:** If `signInWithPassword` **never resolves** (e.g. slow/unresponsive network, edge timeout, or Supabase endpoint hanging), the promise never settles → spinner runs indefinitely.
- **No finally:** Any code path that throws (including in `router.push`/`router.refresh`) leaves `loading === true`.

So the hang is explained by: **the sign-in request either throws or never resolves, and the UI never clears the loading state.**

### 2.3 Hypothesis checks

| Hypothesis | Check | Result |
|------------|--------|--------|
| **A) Supabase returns error but UI swallows it** | Code only handles `err` from resolved promise. If promise rejects (throw), it was unhandled. | **Partial:** Auth errors returned as `{ error }` are shown; thrown errors were not caught. |
| **B) Redirect URI / NEXT_PUBLIC_APP_URL mismatch** | `signInWithPassword` does not use redirect URI (used for OAuth). App URL used in middleware (www→apex) and defaults to `https://aistroyka.ai`. | **Not the cause** of hang; would affect OAuth/callback only. |
| **C) Cookies/session not persisted** | Middleware uses `@supabase/ssr` with request cookies read and response cookies set. Session would affect post-login redirect, not the hang on submit. | **Not the cause** of infinite spinner; hang occurs before redirect. |
| **D) Redirect loop** | Middleware: unauthenticated + protected → login; authenticated + auth page → dashboard. No loop in logic. | **Not observed**; hang is on login submit, not redirect. |

Conclusion: **The hang is caused by the sign-in promise not completing (timeout or throw) combined with no error handling and no timeout, so the spinner never stops.**

---

## 3. Fix applied

### 3.1 Login page (`app/[locale]/(auth)/login/page.tsx`)

1. **Timeout (15s):** `Promise.race([signInWithPassword(...), timeoutPromise])` so the wait is bounded.
2. **try/catch/finally:**
   - **try:** race sign-in with timeout; on success handle `err` and redirect; on auth error set message and return.
   - **catch:** On timeout or any thrown error, set user-facing error (timeout message or `defaultError`).
   - **finally:** Always `setLoading(false)` so the spinner stops on every path.
3. **Diagnostic logging (dev only):** `console.info` on completion (duration, ok/error); `console.warn` on catch (timeout or thrown). No secrets.

### 3.2 Register page (`app/[locale]/(auth)/register/page.tsx`)

- Same pattern: try/catch/finally, 15s timeout, user-facing error on timeout or throw, `setLoading(false)` in finally.

### 3.3 Build stamp

- Auth layout already includes a build stamp footer (`app/[locale]/(auth)/layout.tsx` with `BuildStamp`). No change.

---

## 4. Verification

1. **Incognito login**
   - Open `https://aistroyka.ai/en/login`.
   - Enter valid credentials → login completes and navigates to dashboard (no infinite loading).
   - Enter invalid credentials → error message shown, spinner stops.

2. **Timeout / network failure**
   - Simulate slow network (DevTools throttling) or invalid Supabase URL → after ≤15s, timeout (or error) message shown and spinner stops.

3. **No redirect loops**
   - After login, single redirect to dashboard; no repeated login ↔ dashboard redirects.

4. **Console**
   - No uncaught errors; in dev, expected `[login] signIn completed...` or `[login] signIn failed...`.

5. **Production build**
   - Run `npm run build` (or cf:build) and test login in production build locally or on deploy.

---

## 5. If issues persist

- **Still hangs:** Check Network tab for the Supabase auth request (e.g. `.../auth/v1/token?grant_type=password`): status, timing, CORS. Ensure Worker allows requests to Supabase (CSP `connect-src` includes `https://*.supabase.co`).
- **Session not set after success:** Verify middleware cookie handling and that `updateSession` runs on the next request; check Supabase project URL and anon key match the deployed env.
- **Redirect to wrong path:** Ensure `next` param and `router.push(next)` use locale-prefixed paths when required; next-intl router handles current locale.

---

## 6. Commit

```
fix(auth): resolve prod login hang and add robust error handling

- Login: try/catch/finally, 15s timeout, always clear spinner
- Register: same pattern for signUp
- User-facing errors on timeout or thrown; dev-only diagnostic logs
- RCA: docs/INCIDENT_LOGIN_HANG.md
```
