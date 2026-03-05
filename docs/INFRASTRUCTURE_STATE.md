# Infrastructure State

**Scope:** Cloudflare Workers, OpenNext build, Supabase, env, deployment, wrangler.

---

## 1. Cloudflare Workers

| Item | Status | Details |
|------|--------|---------|
| Adapter | **Configured** | @opennextjs/cloudflare; `opennextjs-cloudflare build` in apps/web. |
| wrangler.toml | **Present** | name, compatibility_date, compatibility_flags (nodejs_compat, global_fetch_strictly_public), main = ".open-next/worker.js", assets from .open-next/assets. |
| Environments | **Present** | dev (default), staging, production; each with name and assets; production has services binding (WORKER_SELF_REFERENCE). |
| Routes | **Manual** | Comments state routes managed manually in Cloudflare Dashboard; CI must not create/update/delete routes (permission 10000). |
| Secrets | **External** | Not in repo; use dashboard or .dev.vars (local). Scripts: cf:secrets, set-cf-secrets.sh. |

**Build:** `npm run cf:build` → opennextjs-cloudflare build → .open-next/. Deploy: `wrangler deploy` (with --env for staging/production).

---

## 2. OpenNext Build

| Item | Status |
|------|--------|
| Package | @opennextjs/cloudflare ^1.16.4 |
| Script | `opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion` |
| Output | .open-next/ (worker.js + assets) |
| Next version | 14.2.18 |

**Verification:** Build success depends on Next 14 compatibility with OpenNext; no separate “cf build” script at root other than delegation to apps/web cf:build.

---

## 3. Supabase Connection

| Item | Status | Details |
|------|--------|---------|
| URL / anon key | **Env** | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (getPublicEnv / lib/config). |
| Service role | **Env** | SUPABASE_SERVICE_ROLE_KEY; getAdminClient() returns null if unset. |
| Server client | **Working** | createServerClient with cookies (@supabase/ssr). |
| Middleware | **Working** | updateSession in lib/supabase/middleware. |

**Migrations:** 35+ in apps/web/supabase/migrations. Run via scripts (e.g. db:migrate / run-migrations.mjs). No Supabase CLI config in repo snippet; migrations are SQL files.

---

## 4. Environment Variables

| Variable | Purpose |
|----------|---------|
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase client |
| SUPABASE_SERVICE_ROLE_KEY | Admin operations (jobs, rate-limit, usage, etc.) |
| OPENAI_API_KEY, OPENAI_VISION_MODEL, OPENAI_VISION_TIMEOUT_MS, OPENAI_RETRY_ON_5XX | AI analyze-image |
| NODE_ENV | test/production behavior |
| Stripe (if used) | Billing (optional runtime per ADR) |

Docs reference ENV_CLOUDFLARE.md, CICD_PHASE5_ENV_VARS.md, etc. for full lists. Build and runtime both need Supabase and (for AI) OpenAI; Cloudflare secrets must be set in dashboard or via set-cf-secrets.sh.

---

## 5. Deployment Pipeline

| Item | Status |
|------|--------|
| CI (GitHub Actions) | apps/web/.github/workflows/ci.yml, deploy.yml |
| Build | next build + opennextjs-cloudflare build |
| Deploy | wrangler deploy (dev/staging/production via --env) |
| Lockfile | apps/web/package-lock.json (root package.json delegates to apps/web) |

**Deployment readiness:** Build and deploy commands are defined; success depends on env and secrets in CI and Cloudflare. No “deployment dry run” script in package.json; manual `wrangler deploy --dry-run` (or equivalent) can be used for verification.

---

## 6. Runtime Dependencies

- **Next.js 14**, React 18, @supabase/ssr, @supabase/supabase-js.
- **Node compat:** wrangler compatibility_flags include nodejs_compat (for Node APIs in Worker).
- **Outbound:** HTTPS to Supabase, OpenAI (api.openai.com); no explicit allowlist in repo.

---

## 7. Verification Checklist

| Check | How |
|-------|-----|
| Build | `cd apps/web && npm run cf:build` |
| Tests | `npm run test` (Vitest) in apps/web |
| Deployment dry run | `wrangler deploy --dry-run` (from apps/web or with config path) |
| Env | Ensure NEXT_PUBLIC_* and SUPABASE_SERVICE_ROLE_KEY (and OPENAI_* if using AI) set in Cloudflare and locally |

---

## 8. Gaps / Risks

- **Root `app/`:** Unclear if any build or deploy uses it; could cause confusion or duplicate routes if mounted.
- **engine/Aistroyk:** Not part of main build or deploy; separate migrations and dist.
- **Cron:** Job processing is HTTP-triggered; no wrangler cron or external scheduler mentioned in repo; production may rely on external cron calling /api/v1/jobs/process.
