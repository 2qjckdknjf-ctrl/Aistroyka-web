# Multi-environment deployment — final report

**Date:** 2026-03-05

---

## Summary

- **Staging** and **production** are clearly separated by branch (develop / main), Worker name (aistroyka-web-staging / aistroyka-web-production), and env vars.
- **Build pipeline** is normalized: single package manager (bun), install from root, build via `bun run cf:build`. No npm in the pipeline; prebuild removed.
- **Health** exposes optional `env` (staging | production) and buildStamp; **smoke scripts** added for staging and prod.
- **Documentation** added: audit, ADR, env matrix, staging setup, production config, release flow, canonical Cloudflare build.

---

## Cloudflare projects / Workers

| Worker name | Branch | Domain(s) |
|-------------|--------|-----------|
| aistroyka-web-production | main | aistroyka.ai, www.aistroyka.ai |
| aistroyka-web-staging | develop | staging.aistroyka.ai (to be set in Dashboard + DNS), workers.dev |
| aistroyka-web-dev | — | Local / dev only |

Single repo, single wrangler.toml in apps/web; envs selected via `wrangler deploy --env staging|production`.

---

## Branch mapping

| Branch | Workflow | Deploy target |
|--------|----------|----------------|
| main | deploy-cloudflare-prod.yml | aistroyka-web-production |
| develop | deploy-cloudflare-staging.yml | aistroyka-web-staging |

---

## Build / install commands (canonical)

- **Install:** `bun install --frozen-lockfile` (from repo root).
- **Build:** `bun run cf:build` (from repo root; runs OpenNext in apps/web).

For Cloudflare Builds UI, use the same (see docs/CLOUDFLARE-BUILD-CANONICAL.md). Do **not** use `cd apps/web && npm install && bun run build`.

---

## Environment variables

- **Production Worker:** Set in Dashboard (Build + Runtime). NEXT_PUBLIC_* at build time; secrets at runtime. CI sets NEXT_PUBLIC_APP_ENV=production, NEXT_PUBLIC_BUILD_SHA, NEXT_PUBLIC_BUILD_TIME.
- **Staging Worker:** Same structure; use staging Supabase (and other) keys. CI sets NEXT_PUBLIC_APP_ENV=staging.
- See **docs/ENVIRONMENT-MATRIX-20260305.md** for the full matrix (no secret values).

---

## Smoke tests

- **Staging:** `cd apps/web && bun run smoke:staging` (default: https://staging.aistroyka.ai).
- **Production:** `cd apps/web && bun run smoke:prod` (default: https://aistroyka.ai).

Both check GET /api/v1/health (HTTP 200 or 503 and valid JSON).

---

## What was done in repo

1. **apps/web/package.json:** Removed prebuild (npm install in packages/contracts). Deploy scripts use `bun run` instead of `npm run`. Added smoke:staging, smoke:prod.
2. **GitHub Actions:** HUSKY=0 for deploy jobs; NEXT_PUBLIC_APP_ENV=staging|production set before build.
3. **apps/web/lib/config/public.ts:** NEXT_PUBLIC_APP_ENV in PublicConfig and getPublicConfig().
4. **apps/web/lib/controllers/health.ts:** Optional `env` in health response.
5. **packages/contracts:** HealthResponseSchema extended with optional `env`.
6. **scripts:** smoke-staging.sh, smoke-prod.sh (executable).
7. **docs:** REPORT-ENV-AUDIT-20260305.md, ADR-DEPLOYMENT-ARCHITECTURE-20260305.md, CLOUDFLARE-BUILD-CANONICAL.md, ENVIRONMENT-MATRIX-20260305.md, STAGING-SETUP-20260305.md, PRODUCTION-CONFIG-20260305.md, RELEASE-FLOW-20260305.md, this report.

---

## Backlog / temporary compromises

- **staging.aistroyka.ai:** DNS and custom domain must be set in Cloudflare Dashboard and zone; not automated in repo. Steps in STAGING-SETUP-20260305.md.
- **Next.js 14.2.18:** Security advisory (upgrade to patched version). Plan upgrade in a separate change; not done in this rollout.
- **develop branch:** If it does not exist, create from main and push; staging workflow triggers on develop.
- **Supabase:** Staging may share one Supabase project with different anon key or use a separate project; document choice and keep staging keys only in staging Worker.

---

## Rollback

- **Build command:** Revert to previous in Cloudflare if needed: e.g. restore `cd apps/web && npm install && bun run build` only if a critical issue blocks `bun run cf:build`; then fix forward to bun-only.
- **DNS:** Revert CNAME/records for staging.aistroyka.ai to previous target or remove; production apex/www unchanged unless you changed them.
- **Deploy:** Redeploy previous commit: checkout commit, run `bun run cf:build` then `npx wrangler deploy --env production` (or staging) from apps/web.
- **Proxy:** If proxy breaks accessibility, set record to DNS-only temporarily and fix SSL/Worker binding.

---

## Immediate hardening backlog

- Upgrade Next.js to a version that addresses the 2025-12-11 security advisory.
- Ensure no server-only env (e.g. SUPABASE_SERVICE_ROLE_KEY) is exposed to client or in logs.
- Keep DEBUG_* and ENABLE_DIAG_ROUTES off in production.
- Consider required status checks on main (e.g. CI success) before merge.
