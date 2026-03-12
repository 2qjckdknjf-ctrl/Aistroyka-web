# Dashboard Server Render Fix Report

## ROOT CAUSE

Server-side crash on `/ru/dashboard` (and any `/[locale]/dashboard`) was caused by **unsafe destructuring of Supabase `auth.getUser()`** and **lack of defensive handling** in the dashboard SSR chain:

1. **Unsafe destructuring**  
   `const { data: { user } } = await supabase.auth.getUser()` throws if:
   - `getUser()` rejects (e.g. network, invalid session, Auth server error),
   - or the response shape is missing `data` (e.g. edge runtimes, or certain error responses).

2. **Layout**  
   Used `data.user` after `getUser()`. If `data` was ever `undefined`, access to `data.user` would throw.  
   `requireAdmin(supabase)` was not wrapped in try/catch; it internally uses the same unsafe `getUser()` destructuring, so any failure there crashed the whole layout.

3. **Dashboard page**  
   Called `createClient()` and `getUser()` again and destructured `data.user` without guards. A second failure (e.g. cookies/edge) or null `data` caused a Server Component render exception.

4. **Tenant context (API)**  
   `getTenantContextFromRequest()` used the same unsafe pattern; fixed for consistency so API routes do not crash on auth edge cases.

So the **exact** failing SSR path was: layout or page calling `getUser()`, then destructuring `data.user` when `data` could be missing, or `getUser()`/`createClient()` throwing without a catch.

---

## FILES CHANGED

| File | Change |
|------|--------|
| `apps/web/lib/supabase/server.ts` | Added `getSessionUser(supabase)` that returns `{ id, email } \| null` and never throws (try/catch + safe `res?.data?.user`). |
| `apps/web/app/[locale]/(dashboard)/layout.tsx` | Use `getSessionUser(supabase)` instead of raw `getUser()`; wrap `requireAdmin(supabase)` in try/catch and treat throw as non-admin; add dev-only diagnostic logs (SSR started, auth resolved/failed, requireAdmin resolved/failed). |
| `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` | Use `getSessionUser(supabase)`; wrap `createClient()` + `getSessionUser()` in try/catch and use `user?.email ?? "—"` so page does not crash if auth fails on the page. |
| `apps/web/src/features/admin/auth/requireAdmin.ts` | Replace unsafe `getUser()` destructuring with safe `res?.data?.user ?? null` and try/catch; return `{ allowed: false, adminTenantIds: [] }` on throw. |
| `apps/web/lib/tenant/tenant.context.ts` | Replace unsafe `getUser()` destructuring with try/catch and `res?.data?.user ?? null`; on throw return absent tenant context. |

---

## SSR CALLS THAT COULD FAIL (AND HOW THEY’RE PROTECTED)

- **createClient()** — Can throw (e.g. cookies in Edge). Layout: try/catch → redirect to login. Page: try/catch → show "—" for email.
- **supabase.auth.getUser()** — Can reject or return missing `data`. Replaced by `getSessionUser()` (try/catch + safe access) in layout and page; same pattern in requireAdmin and tenant.context.
- **requireAdmin(supabase)** — Can throw if internal `getUser()` or DB access fails. Layout: try/catch → treat as non-admin, layout still renders.
- **getTranslations / getLocale** — Not wrapped; failure would still be a Server Component error. Auth path is now safe so the main crash source is removed.

---

## PROTECTION MEASURES

- **Safe auth helper**  
  `getSessionUser(supabase)` centralizes safe auth read: no throw, returns `null` on any failure.

- **Layout**  
  Auth path uses `getSessionUser`; `requireAdmin` is try/catch’d so layout never crashes from admin check.

- **Dashboard page**  
  Auth only used for display; createClient + getSessionUser in try/catch with fallback UI (`user?.email ?? "—"`).

- **requireAdmin**  
  Safe `getUser()` handling and try/catch; returns “not admin” instead of throwing.

- **Tenant context**  
  Safe `getUser()` and try/catch; returns absent context instead of throwing.

- **Diagnostic logging (dev only)**  
  In layout: `[dashboard layout] SSR started`, `auth resolved`, `auth failed`, `requireAdmin resolved` / `requireAdmin failed` so the failing step is visible when debugging.

---

## HOW TO REPRODUCE

1. Log in so the session is valid.
2. Open `/ru/dashboard` or `/en/dashboard` (or `/dashboard` → redirects to `/en/dashboard`).
3. Before fix: generic “An error occurred in the Server Components render…” and production Server Components render error in console.
4. After fix: dashboard renders; if auth fails only on the page, email shows "—" and rest of dashboard still loads.

To simulate auth issues (optional):

- Temporarily break Supabase URL/key in env and reload dashboard → layout should redirect to login with `?session_error=1`.
- In dev, logs show which step failed (auth resolved/failed, requireAdmin resolved/failed).

---

## VALIDATION

- **Login → /ru/dashboard**  
  Page loads; header shows “Signed in as &lt;email&gt;” and KPIs/recent projects (or loading/error states from client components).
- **Login → /dashboard**  
  Redirects to `/en/dashboard`; same behaviour as above.
- **No session**  
  Layout redirects to `/[locale]/login` (or `?session_error=1` if createClient/getUser throws).
- **Tenant missing**  
  Dashboard does not depend on tenant in layout/page SSR; client fetches (e.g. ops overview) may return 401/403 and show ErrorState, no full-page crash.
- **Supabase unreachable**  
  Layout getSessionUser returns null → redirect to login; no uncaught exception.

---

## ROOT CAUSE

Unsafe destructuring of `supabase.auth.getUser()` (`const { data: { user } } = ...`) and missing try/catch around `createClient()` and `requireAdmin()` in the dashboard SSR path. When `data` was missing or `getUser()`/`createClient()` threw, the Server Component render crashed with a generic error.

---

## FILES CHANGED

- `apps/web/lib/supabase/server.ts` — added `getSessionUser()`
- `apps/web/app/[locale]/(dashboard)/layout.tsx` — safe auth + requireAdmin try/catch + dev logs
- `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` — safe auth + try/catch fallback
- `apps/web/src/features/admin/auth/requireAdmin.ts` — safe getUser + try/catch
- `apps/web/lib/tenant/tenant.context.ts` — safe getUser + try/catch

---

## VALIDATION RESULT

- Dashboard no longer crashes on load after login.
- Missing or invalid session leads to redirect to login instead of a generic Server Component error.
- requireAdmin or auth failures in layout do not crash the layout; admin section is hidden when not admin or on error.
- Dev-only logs allow correlating “dashboard SSR started”, “auth resolved/failed”, and “requireAdmin resolved/failed” when debugging.
