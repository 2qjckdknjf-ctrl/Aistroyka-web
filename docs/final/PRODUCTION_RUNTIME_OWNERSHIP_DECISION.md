# Production Runtime Ownership Decision

Date: 2026-04-25

## Final Decision Status

**DECIDED_CLOUDFLARE**

Cloudflare Worker is the authoritative production runtime path for AISTROYKA.

This decision is based on repo configuration, active GitHub Actions workflows, Wrangler production config, staging runtime proof, release documentation, and the latest successful Cloudflare production workflow run. Current public production DNS still routes `aistroyka.ai` and `www.aistroyka.ai` to Vercel, so production deploy must not proceed until DNS and Cloudflare route ownership are aligned.

## Current Branch And Commit

- Branch: `hotfix/phase2-document-runtime-closure`
- Current commit: `296a401af8c9dccd81b9a32751a61ccc87345a65`
- Current sha7: `296a401`

## Staging Runtime Proof Summary

Latest staging closure proved the Cloudflare path works for the fixed runtime branch:

- Staging URL: `https://staging.aistroyka.ai`
- Staging server: `cloudflare`
- Staging deployed sha7: `3e363e3`
- `/api/v1/health`: `200`
- `/api/health`: `200`
- `/api/v1/worker`: `200` compatibility discovery catalog
- `/api/v1/worker` no longer returns `501 worker_stub`
- GitHub Actions staging deploy and blocking pilot smoke succeeded.

## Production Live Observation

Safe public checks were run only; no production deploy, DNS change, secrets, or database changes were performed.

### Apex: `https://aistroyka.ai/api/v1/health`

- HTTP status: `307`
- `server`: `Vercel`
- Redirect target: `https://www.aistroyka.ai/api/v1/health`
- `x-vercel-id`: present

### WWW: `https://www.aistroyka.ai/api/v1/health`

- HTTP status: `200`
- `server`: `Vercel`
- `x-vercel-id`: present
- `x-matched-path`: `/api/v1/health`
- `x-vercel-cache`: `MISS`
- Safe body excerpt:

```json
{"ok":true,"db":"ok","aiConfigured":false,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"buildStamp":{"sha7":"488683f","buildTime":""}}
```

Current production public runtime is therefore Vercel, and it is serving old code with `buildStamp.sha7 = 488683f`.

## DNS And Routing Observation

### Apex DNS

`dig aistroyka.ai` returned:

- A record: `216.198.79.1`

The HTTP response from the apex is Vercel and redirects to `www`.

### WWW DNS

`dig www.aistroyka.ai` returned:

- CNAME: `91612e169816f344.vercel-dns-017.com.`
- A records via the CNAME: `216.198.79.65`, `64.29.17.65`

`dig CNAME www.aistroyka.ai` returned:

- CNAME: `91612e169816f344.vercel-dns-017.com.`

This confirms `www.aistroyka.ai` is explicitly routed to Vercel DNS.

## Repo Workflow Inventory

### Active Cloudflare Workflows

`.github/workflows/deploy-cloudflare-prod.yml`:

- Name: `Deploy Cloudflare (Production)`
- Trigger: push to `main` and manual `workflow_dispatch`
- Manual input: `ref`
- Build: `bun run cf:build`
- Bundle preparation: Wrangler dry-run output plus `scripts/patch-bundle-require.cjs`
- Deploy: `npx wrangler deploy --env production --no-bundle --config wrangler.deploy.toml`
- Production worker: `aistroyka-web-production`
- Blocking post-deploy smoke: reusable `pilot-smoke` with `base_url: https://aistroyka.ai`

`.github/workflows/deploy-cloudflare-staging.yml`:

- Name: `Deploy Cloudflare (Staging)`
- Trigger: push to `develop` and manual `workflow_dispatch`
- Build/deploy strategy mirrors production.
- Staging worker: `aistroyka-web-staging`
- Blocking post-deploy smoke: reusable `pilot-smoke` with `base_url: https://staging.aistroyka.ai`

`.github/workflows/ci-check.yml`:

- PR validation runs install, lint, tests, and `bun run cf:build`.
- CI validates the Cloudflare/OpenNext bundle path, not Vercel.

### Latest Production Workflow Evidence

Latest production workflow run inspected:

- Run ID: `24781207994`
- Status: `success`
- Head SHA: `f93993412ab799b66bb3098f49933286e48c2ce6`
- Jobs succeeded:
  - `Build and deploy to production`
  - `Post-deploy pilot smoke (blocking) / Post-deploy pilot smoke`
  - `Post-deploy AI Phase 5 gate (non-blocking)`
- Deploy step succeeded: `Deploy to Cloudflare (production, patched bundle)`

This proves an active Cloudflare production pipeline exists and can deploy the Worker. It does not prove public production DNS is routed to that Worker.

## Cloudflare Config Inventory

`apps/web/wrangler.toml`:

- Default worker: `aistroyka-web-dev`
- Staging worker: `aistroyka-web-staging`
- Production worker: `aistroyka-web-production`
- Production app URL: `https://aistroyka.ai`
- Production route comments include:
  - `aistroyka.ai`
  - `aistroyka.ai/*`
  - `www.aistroyka.ai`
  - `www.aistroyka.ai/*`
- Route comments explicitly say routes are managed manually in Cloudflare Dashboard.

`apps/web/wrangler.deploy.toml`:

- Staging worker: `aistroyka-web-staging`
- Production worker: `aistroyka-web-production`
- Production deploy bundle entry: `.open-next/deploy/worker-bootstrap.js`
- Production app URL: `https://aistroyka.ai`
- Production AI analysis URL: `https://aistroyka.ai/api/ai/analyze-image`

`package.json` and `apps/web/package.json`:

- Root `cf:build` builds contracts and the web Cloudflare bundle.
- Root `cf:deploy:prod` uses Wrangler production dry-run, bundle patching, and `wrangler.deploy.toml`.
- App `cf:deploy:prod` and `deploy:prod` point to the same Cloudflare production path.

## Vercel Config Inventory

`apps/web/vercel.json` exists and defines:

- `installCommand`: root npm install with contracts build
- `buildCommand`: contracts build plus web build

There is no `.vercel/` project directory in the repo.

There are no GitHub Actions workflows for Vercel deployment in `.github/workflows`.

Vercel docs exist and are contradictory in age and intent:

- `docs/DEPLOY_VERCEL_STATUS.md` says Vercel is not the production deploy target and production is Cloudflare, but it also says no `vercel.json` was present at that time. That statement is now stale because `apps/web/vercel.json` exists.
- `docs/DEPLOY-VERCEL.md`, `docs/REPORT-VERCEL-CLOUDFLARE-SEPARATION.md`, and `docs/RELEASE_VERCEL_PROD_2026-03-05.md` document a Vercel deployment path and Vercel/Cloudflare separation.
- `docs/REPORT-VERCEL-CLOUDFLARE-SEPARATION.md` frames Vercel as a normal Next.js build path and Cloudflare/OpenNext as a separate preserved path.
- `docs/release/STEP13_RELEASE_VERCEL_RECONCILIATION.md` explicitly says operator must confirm whether production is Cloudflare or Vercel.

The repo therefore contains a viable Vercel build configuration, but not an active repo-owned Vercel production workflow.

## Contradictions Found

1. Public production routing points to Vercel, but repo production workflow deploys to Cloudflare Worker `aistroyka-web-production`.
2. Latest successful Cloudflare production workflow deployed commit `f9399341`, but public production health reports old Vercel build stamp `488683f`.
3. Staging is now proven on Cloudflare, while public production is Vercel, creating staging/production runtime mismatch.
4. Some older docs say Vercel is not used, while newer Vercel docs describe Vercel production hardening and deployment.
5. Wrangler production route definitions are commented out because routes are manually managed in Cloudflare Dashboard, so repo config alone cannot prove public DNS is attached to the Worker.

## Platform Decision Analysis

### Option A: Cloudflare Authoritative Production

Pros:

- Staging is already live and verified on Cloudflare.
- Production GitHub Actions workflow is active and deploys Cloudflare Worker `aistroyka-web-production`.
- Latest production Cloudflare workflow run succeeded.
- Root and app package scripts prioritize `cf:build` and Wrangler deploys.
- `AGENTS.md` records production deploy path as Cloudflare Workers.
- Wrangler production config and patched deploy bundle path are maintained.
- Keeping staging and production on the same runtime reduces drift and OpenNext/runtime mismatch.

Risks:

- Current public production DNS is Vercel.
- Cloudflare Dashboard routes for apex and `www` must be verified or corrected manually.
- DNS cutover can impact traffic if not coordinated.
- Supabase redirect URLs, app URL, and any external callbacks must be checked for the final canonical host.

### Option B: Vercel Authoritative Production

Pros:

- Current public production traffic is already served by Vercel.
- DNS for `www.aistroyka.ai` explicitly points to Vercel.
- Vercel build config exists in `apps/web/vercel.json`.
- Vercel deployment docs exist.

Risks:

- Staging and production would run on different platforms.
- Repo-owned production workflow would be misleading or dangerous unless disabled/rewritten.
- CI currently validates Cloudflare bundle output.
- Recent staging closure and worker runtime proof are Cloudflare-specific.
- Cloudflare production workflow already runs and can deploy, but would not be the public runtime.
- Vercel is currently serving old build `488683f`, so it is not demonstrating current branch correctness.

### Option C: Unresolved

Not selected. The repo and staging evidence are strong enough to choose Cloudflare as authoritative, while treating live Vercel routing as the concrete external alignment blocker.

## Recommended Authoritative Production Runtime

**Cloudflare Worker should be authoritative for production.**

Reason:

- The active repo-controlled production deployment path is Cloudflare.
- The verified staging runtime is Cloudflare.
- The production workflow has a successful Cloudflare deploy history.
- The project memory and multiple deployment docs identify Cloudflare Workers as the production target.
- Vercel exists as a live legacy or alternate runtime, but it is currently serving old code and is not aligned with staging.

## Required Operator Actions

Before any production deploy or production cutover:

1. Confirm in Cloudflare Dashboard that Worker `aistroyka-web-production` has the expected latest deployment and environment variables.
2. Confirm Cloudflare routes for:
   - `aistroyka.ai`
   - `aistroyka.ai/*`
   - `www.aistroyka.ai`
   - `www.aistroyka.ai/*`
3. Decide canonical host behavior:
   - apex primary with optional `www` redirect, or
   - `www` primary with apex redirect.
4. Update DNS so the chosen production host routes to Cloudflare rather than Vercel.
5. Verify Supabase auth Site URL and redirect URLs match the chosen canonical production host.
6. Decide what to do with Vercel:
   - disconnect production domain,
   - keep only preview deployments,
   - or document it as legacy/backup and prevent accidental production ownership.
7. After routing is aligned, dispatch or push the Cloudflare production workflow with an explicit ref and verify live `/api/v1/health`, `/api/health`, and `/api/v1/worker`.

## Do Not Do Yet

- Do not deploy production before route ownership is aligned.
- Do not change DNS without operator approval and dashboard access.
- Do not remove `apps/web/vercel.json` until the team decides whether Vercel remains useful for previews.
- Do not delete Cloudflare config; it is the recommended authoritative path.
- Do not claim production smoke closure while public production still reports Vercel `buildStamp.sha7 = 488683f`.

## Final Recommendation

Production runtime ownership: **DECIDED_CLOUDFLARE**

Next step: **production Cloudflare route alignment**.

Specifically, verify and align Cloudflare routes/DNS for `aistroyka.ai` and `www.aistroyka.ai`, then run a controlled Cloudflare production deployment and live health/worker verification. Vercel should be removed from public production ownership or explicitly downgraded to preview/legacy status.
