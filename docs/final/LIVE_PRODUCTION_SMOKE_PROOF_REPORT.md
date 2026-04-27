# Live Production Smoke Proof Report

Date: 2026-04-25

## Final Verdict

NOT CLOSED.

Public health works on both reachable runtimes, but neither live environment is running the latest branch commit that closed the P1 repo-visible blockers. Both production and staging still return `501 worker_stub` for `/api/v1/worker`.

Authenticated smoke and post-login dashboard verification could not be run because no runtime auth material was available in the shell.

## Current Repo State

- Branch: `hotfix/phase2-document-runtime-closure`
- Local short SHA: `3efaea2a`
- Local full SHA: `3efaea2a6caa86f134daaaceec0b91ab8bed81c5`
- Working tree before report: clean

## Deployment Target Truth

Production deploy workflow:

- File: `.github/workflows/deploy-cloudflare-prod.yml`
- Auto trigger: push to `main`
- Manual trigger: `workflow_dispatch` with optional `ref`
- Target URL used by workflow smoke: `https://aistroyka.ai`
- Expected Cloudflare Worker: `aistroyka-web-production`
- Workflow sets:
  - `NEXT_PUBLIC_BUILD_SHA=${{ github.sha }}`
  - `NEXT_PUBLIC_BUILD_TIME=<UTC date>`
  - `NEXT_PUBLIC_APP_ENV=production`

Staging deploy workflow:

- File: `.github/workflows/deploy-cloudflare-staging.yml`
- Auto trigger: push to `develop`
- Manual trigger: `workflow_dispatch` with optional `ref`
- Target URL used by workflow smoke: `https://staging.aistroyka.ai`
- Expected Cloudflare Worker: `aistroyka-web-staging`
- Workflow sets:
  - `NEXT_PUBLIC_BUILD_SHA=${{ github.sha }}`
  - `NEXT_PUBLIC_BUILD_TIME=<UTC date>`
  - `NEXT_PUBLIC_APP_ENV=staging`

Wrangler targets:

- `apps/web/wrangler.toml`
  - dev: `aistroyka-web-dev`
  - staging: `aistroyka-web-staging`
  - production: `aistroyka-web-production`
- `apps/web/wrangler.deploy.toml`
  - staging patched bundle: `.open-next/deploy/worker-bootstrap.js`
  - production patched bundle: `.open-next/deploy/worker-bootstrap.js`

Health/build stamp implementation:

- Shared controller: `apps/web/lib/controllers/health.ts`
- V1 route: `apps/web/app/api/v1/health/route.ts`
- Legacy route: `apps/web/app/api/health/route.ts`
- Health includes `buildStamp.sha7` when `NEXT_PUBLIC_BUILD_SHA` is configured.

## Live Public Health Results

### Production Apex

Command:

```bash
curl -i https://aistroyka.ai/api/v1/health
curl -i https://aistroyka.ai/api/health
curl -i https://aistroyka.ai/api/v1/worker
```

Observed:

- `https://aistroyka.ai/api/v1/health` -> `HTTP 307`, redirects to `https://www.aistroyka.ai/api/v1/health`
- `https://aistroyka.ai/api/health` -> `HTTP 307`, redirects to `https://www.aistroyka.ai/api/health`
- `https://aistroyka.ai/api/v1/worker` -> `HTTP 307`, redirects to `https://www.aistroyka.ai/api/v1/worker`
- Server: `Vercel`

### Production Canonical Host

Command:

```bash
curl -i https://www.aistroyka.ai/api/v1/health
curl -i https://www.aistroyka.ai/api/health
curl -i https://www.aistroyka.ai/api/v1/worker
```

Observed:

- `GET /api/v1/health` -> `HTTP 200`
  - Safe body excerpt:
    - `ok: true`
    - `db: "ok"`
    - `supabaseReachable: true`
    - `serviceRoleConfigured: true`
    - `buildStamp.sha7: "488683f"`
  - Server: `Vercel`
- `GET /api/health` -> `HTTP 200`
  - Safe body excerpt:
    - `ok: true`
    - `db: "ok"`
    - `buildStamp.sha7: "488683f"`
  - Server: `Vercel`
- `GET /api/v1/worker` -> `HTTP 501`
  - Safe body excerpt:
    - `error: "Not implemented"`
    - `code: "worker_stub"`
    - `docs: "SPEC-API-VERSIONING.md"`
  - Server: `Vercel`

Conclusion:

- Production health works.
- Production is not serving the current local branch commit `3efaea2a`.
- Production is serving an older build stamp `488683f`.
- Production `/api/v1/worker` still fails the P1 smoke because it returns `501 worker_stub`.

### Staging

Command:

```bash
curl -i https://staging.aistroyka.ai/api/v1/health
curl -i https://staging.aistroyka.ai/api/health
curl -i https://staging.aistroyka.ai/api/v1/worker
```

Observed:

- `GET /api/v1/health` -> `HTTP 200`
  - Safe body excerpt:
    - `ok: true`
    - `db: "ok"`
    - `aiConfigured: true`
    - `openaiConfigured: true`
    - `supabaseReachable: true`
    - `serviceRoleConfigured: true`
    - `env: "staging"`
    - `buildStamp.sha7: "b2b316d"`
    - `buildTime: "2026-04-22 12:52"`
  - Server: `cloudflare`
- `GET /api/health` -> `HTTP 200`
  - Safe body excerpt:
    - `ok: true`
    - `db: "ok"`
    - `env: "staging"`
    - `buildStamp.sha7: "b2b316d"`
  - Server: `cloudflare`
- `GET /api/v1/worker` -> `HTTP 501`
  - Safe body excerpt:
    - `error: "Not implemented"`
    - `code: "worker_stub"`
    - `docs: "SPEC-API-VERSIONING.md"`
  - Server: `cloudflare`

Conclusion:

- Staging health works.
- Staging is not serving the current local branch commit `3efaea2a`.
- Staging is serving old build stamp `b2b316d`.
- Staging `/api/v1/worker` still fails the P1 smoke because it returns `501 worker_stub`.

## Authenticated API Smoke

Not run.

Credential availability check:

```bash
AUTH_HEADER=missing
CRON_SECRET=missing
PROJECT_ID=missing
SMOKE_EMAIL=missing
SMOKE_PASSWORD=missing
```

Missing inputs needed to run authenticated smoke truthfully:

- Bearer token for a real smoke user:
  - `AUTH_HEADER="Authorization: Bearer <user_access_token>"`
- Optional cron secret for cron-tick checks:
  - `CRON_SECRET="<redacted>"`
- Optional known project id for project-scoped read-only route checks:
  - `PROJECT_ID=<project_id>`
- Alternatively, smoke user login material:
  - `SMOKE_EMAIL`
  - `SMOKE_PASSWORD`
  - Supabase URL/anon key if deriving token locally.

Because these were unavailable, `scripts/smoke/pilot_launch.sh` was not run and authenticated success was not claimed.

## Dashboard Route Smoke

Authenticated dashboard/e2e smoke was not run because no browser auth/session or smoke credentials were available.

Unauthenticated route probes:

- Production `GET https://www.aistroyka.ai/en/dashboard/uploads` -> `HTTP 307`
  - `location: /en/login?next=%2Fen%2Fdashboard%2Fuploads`
  - This proves auth middleware recognizes the route path enough to redirect, but it does not prove authenticated page success.
- Staging `GET https://staging.aistroyka.ai/en/dashboard/uploads` -> `HTTP 307`
  - `location: /en/login?next=%2Fen%2Fdashboard%2Fuploads`
  - Body contained dashboard uploads page chunk references, but this is still not authenticated proof.

Dashboard uploads route status:

- Post-login dashboard route is not live-proven in this run.
- Required next input: authenticated browser/e2e credentials or a reusable session setup.

## Read-Only Feature Route Results

Unauthenticated checks only:

Production:

- `GET /api/v1/config` -> `HTTP 200`
  - Safe body excerpt: `flags: {}`, `clientProfile: "web"`
- `GET /api/v1/projects` -> `HTTP 401`
  - Safe body excerpt: `error: "Unauthorized"`
- `GET /api/v1/ops/metrics` -> `HTTP 401`
  - Safe body excerpt: `error: "Authentication required"`

Staging:

- `GET /api/v1/config` -> `HTTP 200`
  - Safe body excerpt: `flags: {}`, `clientProfile: "web"`
- `GET /api/v1/projects` -> `HTTP 401`
  - Safe body excerpt: `error: "Unauthorized"`
- `GET /api/v1/ops/metrics` -> `HTTP 401`
  - Safe body excerpt: `error: "Authentication required"`

Authenticated read-only feature routes were not run because no bearer token was available.

## Local Repo Validation

Commands:

```bash
git status --short --branch
bun run test
bun run cf:build
bash scripts/release/check-migrations.sh
```

Results:

- `git status --short --branch` -> clean branch before report creation:
  - `## hotfix/phase2-document-runtime-closure...origin/hotfix/phase2-document-runtime-closure`
- `bun run test` -> passed:
  - `234 passed (234)`
  - `1295 passed (1295)`
- `bun run cf:build` -> passed:
  - Next.js compiled successfully.
  - OpenNext build complete.
  - `.open-next/worker.js` generated.
  - `patch-worker-bypass-api-middleware` applied.
  - `patch-server-handler-require-middleware-manifest` applied.
- `bash scripts/release/check-migrations.sh` -> passed:
  - `Migration sanity check PASSED (96 migrations)`

## Failures Found

1. Production deployment drift:
   - Expected local branch/SHA: `hotfix/phase2-document-runtime-closure` / `3efaea2a`
   - Live production build stamp: `488683f`
   - Live production server: `Vercel`
   - Live production `/api/v1/worker`: `501 worker_stub`

2. Staging deployment drift:
   - Expected local branch/SHA: `hotfix/phase2-document-runtime-closure` / `3efaea2a`
   - Live staging build stamp: `b2b316d`
   - Live staging server: `cloudflare`
   - Live staging `/api/v1/worker`: `501 worker_stub`

3. Authenticated smoke blocked:
   - No bearer token, cron secret, project id, smoke email, or smoke password available.

4. Dashboard uploads post-login smoke blocked:
   - No authenticated browser/session/e2e credentials available.

## Fixes Made

None.

This sprint was verification-only. No feature code, migrations, auth changes, or deployment changes were made.

## External Blockers / Needed Operator Inputs

To continue toward live smoke closure:

1. Deploy current branch commit `3efaea2a` or merge/deploy it to the target environment.
   - Production auto-deploy path is `main`.
   - Staging auto-deploy path is `develop`.
   - Manual workflow dispatch can deploy a specific ref if approved.
2. Provide authenticated smoke material:
   - `AUTH_HEADER="Authorization: Bearer <user_access_token>"`
   - Optional `CRON_SECRET`
   - Optional `PROJECT_ID`
3. Provide dashboard/e2e auth material or session setup to verify `/dashboard/uploads` after login.

## Final Verdict

NOT CLOSED.

Reason:

- Health works live on production and staging.
- However, live `/api/v1/worker` still returns `501 worker_stub` on both production and staging.
- Live deployments do not match the current repo commit that closed the P1 blockers.
- Authenticated smoke could not run because credentials were unavailable.
- Dashboard uploads route could not be proven after authentication.
