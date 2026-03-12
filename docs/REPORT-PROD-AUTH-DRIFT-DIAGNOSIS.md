# Production auth drift — diagnosis

**Date:** 2026-03-07  
**Incident:** ops/metrics returns 401 with valid user JWT (Bearer).

---

## 1. Expected auth path (code)

| File | Usage |
|------|--------|
| `apps/web/app/api/v1/ops/metrics/route.ts` | Uses `createClientFromRequest(request)` and `getTenantContextFromRequest(request)` — Bearer path present. |
| `apps/web/lib/supabase/server.ts` | `createClientFromRequest(request)` reads `Authorization: Bearer <token>`, rejects service_role, creates client with JWT. |
| `apps/web/lib/tenant/tenant.context.ts` | `getTenantContextFromRequest(request)` calls `createClientFromRequest(request)`, then `supabase.auth.getUser()`. |

**Conclusion:** Route and libs correctly use request-scoped client and Bearer; no cookie-only path in ops/metrics.

---

## 2. Commit containing Bearer hardening

- **Commit:** `2ad42578` — `docs(prod): final smoke green proof + smoke auth/runbook`
- **Branch:** `release/phase5-2-1`
- **HEAD:** `2ad42578dd9bcfa9140e88aa992ee099691a35ba`
- **Remote:** `origin/release/phase5-2-1` = `2ad42578` (in sync).

---

## 3. Production deployment target

| Item | Value |
|------|--------|
| Worker name (prod) | `aistroyka-web-production` |
| Wrangler env | `--env production` |
| Config | `apps/web/wrangler.toml` → `[env.production]`, deploy via `wrangler.deploy.toml` (patched bundle). |
| Domain | https://aistroyka.ai |
| Deploy command | `bun run deploy:prod` → `cf:build` + `cf:deploy:prod:patched` |

---

## 4. Suspected root cause

**Runtime env in production:**  
`getPublicConfig()` / `getPublicEnv()` read `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. On Cloudflare Workers these come from **runtime** (Dashboard Variables / Secrets or wrangler `[vars]`), not from the build machine.

**Hypothesis:**  
In production, one or both of these are missing or point to a **different** Supabase project. Then:

- JWT is issued by project A (e.g. `vthfrxehrursfloevnlp.supabase.co`).
- Worker uses project B (or empty) for `getUser()`.
- JWT from A is invalid for B → `getUser()` returns null → 401 "Authentication required".

**Expected prod commit:** Same as current HEAD (`2ad42578`) after a clean deploy from this branch.

---

## 5. Actions

1. **Env consistency:** Ensure production Worker has:
   - `NEXT_PUBLIC_SUPABASE_URL` = same Supabase project URL used for sign-in (e.g. `https://vthfrxehrursfloevnlp.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key of that same project (set via Dashboard or `wrangler secret put`; do not commit).
2. **Redeploy** from current branch so prod runs the Bearer path from commit `2ad42578`.
3. **Re-run smoke** after deploy; if still 401, re-check production env in Cloudflare Dashboard.
