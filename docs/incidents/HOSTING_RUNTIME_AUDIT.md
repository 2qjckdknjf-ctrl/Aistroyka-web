# Hosting & runtime audit (dashboard 500)

## Stack

- **Hosting:** Cloudflare Workers (OpenNext adapter).
- **Build:** `cf:build` → Next standalone + OpenNext Cloudflare build + patches (fix-standalone, ensure-styled-jsx-dist, patch-worker-bypass-api-middleware, patch-server-handler-require-middleware-manifest).
- **Runtime:** Workers with `nodejs_compat`, `global_fetch_strictly_public`.
- **Config:** `wrangler.toml` / `wrangler.deploy.toml`; production vars include `NEXT_PUBLIC_SUPABASE_URL`; anon key via secrets.

## /ru/dashboard handling

- Next.js App Router: `/ru/dashboard` matches `app/[locale]/(dashboard)/dashboard/page.tsx` with `locale=ru`.
- Middleware runs first (matcher includes all non-static routes); then Worker invokes server handler for the page.
- No separate Cloudflare rule for `/ru/dashboard`; behavior is the same as other locale-prefixed app routes.

## Edge vs Node assumptions

| API | Used in dashboard path | Edge-safe? | Notes |
|-----|------------------------|------------|--------|
| `cookies()` | createClient() in layout/page | Yes (Next/OpenNext) | Can throw in some Edge contexts; guarded by try/catch. |
| `headers()` | Layout | Yes | Guarded by try/catch; default locale fallback. |
| `supabase.auth.getUser()` | Middleware, getSessionUser, requireAdmin | Can return null/throw in Edge | All call sites now use safe access + try/catch. |
| next-intl getTranslations/getLocale | Page | Can throw if messages missing | Page wraps in try/catch with fallbacks. |

## Findings

1. **Middleware runs in Edge** and was the only remaining place with unsafe `getUser()` destructuring; that has been fixed.
2. **Standalone + OpenNext** output is used; patches address Worker-incompatible require and middleware manifest. No evidence that dashboard route is excluded or handled differently.
3. **Env:** Production must have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or equivalent) set; missing env can cause createClient/getUser to fail; layout and middleware now handle failures without 500.
4. **Stale build:** If a previous deploy had the old middleware code, 500 would persist until a new deploy with the safe middleware is applied.

## Recommendation

- Deploy the branch that includes the middleware fix and existing layout/page hardening.
- Confirm production env has both Supabase vars set.
- If 500 persists, capture Worker logs (e.g. Cloudflare dashboard) for the failing request to see any remaining throw.
