# STAGE 01 — Production Deployment Truth Report

## 1. Goal

Establish the real production deployment path for AISTROYKA, verify live health endpoints, and ensure health metadata can expose deploy identity (sha/build time/environment) for trustworthy release verification.

## 2. Files inspected

- `apps/web/wrangler.toml`
- `apps/web/wrangler.deploy.toml`
- `apps/web/vercel.json`
- `.github/workflows/deploy-cloudflare-prod.yml`
- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/ci-check.yml`
- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`
- `apps/web/app/api/v1/health/route.ts`
- `apps/web/app/api/health/route.ts`
- `apps/web/lib/controllers/health.ts`
- `apps/web/lib/config/public.ts`
- `packages/contracts/src/schemas/health.schema.ts`

## 3. Findings

1. Canonical production runtime is Cloudflare Workers + OpenNext, not Vercel runtime.
2. Canonical production deploy flow is `.github/workflows/deploy-cloudflare-prod.yml` on `main` (or manual `workflow_dispatch` with explicit ref).
3. Staging deploy flow is `.github/workflows/deploy-cloudflare-staging.yml` to `staging.aistroyka.ai`.
4. Live health checks were reachable and successful:
   - `https://aistroyka.ai/api/v1/health` -> HTTP 200
   - `https://aistroyka.ai/api/health` -> HTTP 200
   - `https://www.aistroyka.ai/api/v1/health` -> HTTP 200
5. Live payloads returned `ok/db` but currently missed `buildStamp` and `env`, which weakens production commit truth verification.

## 4. Changes made

1. Hardened health environment reporting fallback:
   - Updated `apps/web/lib/controllers/health.ts` to use `NODE_ENV` when `NEXT_PUBLIC_APP_ENV` is not available.
2. Added deploy-time runtime metadata injection for Cloudflare deploys:
   - Updated `.github/workflows/deploy-cloudflare-prod.yml` deploy step to pass:
     - `NEXT_PUBLIC_BUILD_SHA`
     - `NEXT_PUBLIC_BUILD_TIME`
     - `NEXT_PUBLIC_APP_ENV=production`
   - Updated `.github/workflows/deploy-cloudflare-staging.yml` deploy step to pass:
     - `NEXT_PUBLIC_BUILD_SHA`
     - `NEXT_PUBLIC_BUILD_TIME`
     - `NEXT_PUBLIC_APP_ENV=staging`

This ensures future deployed health responses can include stable build identity metadata.

## 5. Validation commands

```bash
curl -i -sS https://aistroyka.ai/api/v1/health
curl -sS https://aistroyka.ai/api/v1/health
curl -sS https://aistroyka.ai/api/health
curl -sS https://www.aistroyka.ai/api/v1/health
bun run --cwd apps/web test app/api/v1/health/route.test.ts app/api/health/route.test.ts lib/config/config.test.ts
```

## 6. Validation result

- Health routes are reachable on production domains and return HTTP 200.
- Targeted tests passed (`26/26` tests).
- Existing live deployment still shows payload without `buildStamp` and `env`; this is expected until next deploy runs with updated workflow vars.

## 7. Remaining gaps

1. Need one production deploy after this change to confirm runtime `buildStamp` appears in live health output.
2. Production commit SHA can only be considered fully proven after post-deploy curl response includes `buildStamp.sha7` and `buildStamp.buildTime`.

## 8. Blockers

- None for repository-side implementation.
- External operator action required: run production deploy pipeline to apply runtime var injection.

## 9. Commit hash

Pending (generated after commit in this stage).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

PARTIAL

