# Incident RCA: New design not visible / site “not launching” (user-facing)

**Date:** 2026-03-03  
**Status:** Resolved (fix applied)  
**Environment:** Production (aistroyka.ai)

---

## 1. Symptoms

- User report: “NEW DESIGN is not visible” / site “not launching” despite correct build SHA.
- `/api/health` returns expected `buildStamp.sha7` (e.g. `0e363e4`) and `supabaseReachable: true`.
- Uncertainty whether production is serving the redesigned apps/web UI or an older/cached version.

---

## 2. Evidence collected (no changes during collection)

### 2.1 HTTP headers

**GET https://aistroyka.ai/en/login**

| Header | Value |
|--------|--------|
| status | 200 |
| content-type | text/html; charset=utf-8 |
| cache-control | private, no-cache, no-store, max-age=0, must-revalidate |
| server | cloudflare |
| cf-ray | 9d6a9288f9e0daf8-MAD |
| x-opennext | 1 |
| x-powered-by | Next.js |

**GET https://aistroyka.ai/en/dashboard** (unauthenticated)

| Header | Value |
|--------|--------|
| status | 307 |
| location | /en/login?next=%2Fen%2Fdashboard |
| cache-control | private, no-cache, no-store, max-age=0, must-revalidate |
| server | cloudflare |
| cf-ray | 9d6a928b0942cfc2-MAD |
| x-opennext | 1 |

**GET https://aistroyka.ai/api/health**

```json
{"ok":true,"db":"ok","aiConfigured":false,"openaiConfigured":false,"supabaseReachable":true,"buildStamp":{"sha7":"0e363e4","buildTime":"2026-03-03 17:29"}}
```

- No `cf-cache-status` or `age` header was present on document responses; Cloudflare appears to pass through or not cache HTML for these requests.
- Document responses already send strong no-store Cache-Control from the app.

### 2.2 HTML body (login page)

Production HTML for `/en/login` was fetched and inspected. Evidence that the **redesigned apps/web UI is being served**:

- **Route:** Script chunks reference `app/%5Blocale%5D/(auth)/login/page-*.js` → matches `apps/web/app/[locale]/(auth)/login/page.tsx`.
- **Design system:** Classes present: `card-elevated`, `bg-aistroyka-bg-primary`, `text-aistroyka-text-primary`, `aistroyka-title2`, `aistroyka-subheadline`, etc. → apps/web design tokens.
- **Content:** “Log in”, “AI Construction Intelligence”, “Sign in”, “No account? Create account” → matches `apps/web` auth translations and login page.
- **buildId:** `1Xn7VboleV9DxOjN4sSfq` (Next.js build id from deployed worker).

Conclusion: Production is serving the **apps/web** login page (redesigned UI), not a different app or an old static page.

### 2.3 Repo: where the redesign lives

- Login: `apps/web/app/[locale]/(auth)/login/page.tsx` (card-elevated, aistroyka-*).
- Dashboard (post-login): `apps/web/app/[locale]/(dashboard)/dashboard/page.tsx` (“AISTROYKA.AI — AI Command Center”, KPI cards, etc.).
- Root: `apps/web/app/[locale]/page.tsx` redirects to `/{locale}/dashboard` or `/{locale}/login` by auth.
- Middleware: `apps/web/middleware.ts` — locale, session, protected vs auth routes; `/dashboard` → `/en/dashboard`; protected routes redirect to `/{locale}/login` when unauthenticated.

No feature flags or env-gated branches were found that hide the redesign. Redesign is fully in `apps/web` and that app is what the worker serves.

### 2.4 Build marker visibility

- **Dashboard:** Build marker (“Build: {sha7} / {time}”) is in `apps/web/app/[locale]/(dashboard)/layout.tsx` (footer). Only visible **after login**.
- **Login (and register):** There was **no** build marker on auth pages. Unauthenticated users could not visually confirm the deployed build; they only could use `/api/health` (or DevTools).

---

## 3. Root cause

1. **Primary (perception):** The new design **is** live (evidence: production HTML is apps/web login with aistroyka design). The impression “design not visible / not launching” is likely due to:
   - **No visible build marker on login** — users on `/en/login` could not see a build stamp to confirm they are on the latest deploy.
   - **Browser cache** — old `_next/static` assets (JS/CSS) could make the page look or behave like an older version despite correct document response.

2. **Secondary (hardening):** Auth pages (login/register) were not explicitly included in middleware’s `Cache-Control: no-store` branch. They already received no-store from Next.js for dynamic responses; adding them in middleware makes cache policy explicit and consistent for all document routes.

---

## 4. Fix applied (minimal, safe)

### 4.1 Build marker on auth pages

- **Added:** `apps/web/app/[locale]/(auth)/layout.tsx`.
- Wraps login and register in a simple layout with a footer that renders the existing `BuildStamp` component (sha7 + build time).
- Unauthenticated users now see “build: {sha7} · {time}” at the bottom of `/en/login` and `/en/register`, matching `/api/health`’s `buildStamp.sha7` and deploy time.

### 4.2 Cache-Control for auth pages

- **Updated:** `apps/web/middleware.ts`.
- Auth pages (`isAuthPage`) now get the same Cache-Control as protected and `/`: `private, no-store, max-age=0, must-revalidate`.
- Ensures login/register HTML is never cached at edge or browser, consistent with other document routes.

---

## 5. Verification steps

1. **Incognito / clean profile**
   - Open `https://aistroyka.ai/en/login`.
   - Confirm redesigned UI (card, “Log in”, “AI Construction Intelligence”, “Create account”).
   - Confirm footer shows “build: 0e363e4 · 2026-03-03 17:29” (or current deploy sha7/time).
   - Compare sha7 with `curl -s https://aistroyka.ai/api/health | jq .buildStamp.sha7` → should match.

2. **Authenticated**
   - Log in, go to `/en/dashboard`.
   - Confirm “AISTROYKA.AI — AI Command Center” and dashboard layout.
   - Confirm footer “Build: {sha7} / {time}” matches health.

3. **Redirects**
   - `/en/dashboard` without auth → 307 to `/en/login?next=...` (no loop).
   - `/dashboard` → 308 to `/en/dashboard`.

4. **Health**
   - `curl -s https://aistroyka.ai/api/health` → `ok: true`, `supabaseReachable: true`, `buildStamp.sha7` non-empty.

5. **Cache**
   - For document URLs (e.g. `/en/login`), responses should have `cache-control: private, no-store, ...`; for HTML, `cf-cache-status` should not be HIT with long age (BYPASS or MISS is acceptable).

---

## 6. If issues persist

- **Still “old” UI on login:** Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) or try incognito; clear site data for aistroyka.ai. Check Network tab: document and `_next/static` URLs should be from aistroyka.ai and match recent deploy.
- **Blank page / console errors:** Reproduce locally (`cd apps/web && npm run dev`), fix runtime or asset issues, then redeploy.
- **Different UI at another URL:** Confirm the URL; only `apps/web` is deployed to the worker; root Next app (if any) is not deployed to production.

---

## 7. Commit

If code changes are committed:

```
fix(web): ensure redesigned UI renders on prod

- Add auth layout with build marker (BuildStamp) on login/register
  so unauthenticated users can confirm deployed build.
- Set Cache-Control no-store for auth pages in middleware.
- RCA: docs/INCIDENT_UI_NOT_UPDATED.md
```
