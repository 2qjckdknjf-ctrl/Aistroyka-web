# Deployment Drift Closure Report

Date: 2026-04-25

## Verdict

**STAGING DRIFT CLOSED**

Staging now serves the current fixed branch head and no longer returns the old `/api/v1/worker` `501 worker_stub` response.

## Current Branch And Commit

- Branch: `hotfix/phase2-document-runtime-closure`
- Deployed commit: `3e363e38f966a12345de789fd70cb957eedf0bfe`
- Deployed sha7: `3e363e3`
- Original fixed commit from smoke context: `3efaea2a6caa86f134daaaceec0b91ab8bed81c5`
- Relationship: `3efaea2a6caa86f134daaaceec0b91ab8bed81c5` is an ancestor of deployed HEAD.

## Remote Branch Status

- `origin/hotfix/phase2-document-runtime-closure` exists.
- Remote branch points to `3e363e38f966a12345de789fd70cb957eedf0bfe`.
- Local branch tracks `origin/hotfix/phase2-document-runtime-closure`.

## Deployment Path Inspected

Staging deploy path:

- Workflow: `.github/workflows/deploy-cloudflare-staging.yml`
- Trigger: automatic on push to `develop`, manual via `workflow_dispatch`
- Manual input: `ref`
- Checkout: `actions/checkout@v4` with `ref: ${{ github.event.inputs.ref || github.ref }}`
- Build: `bun run cf:build`
- Bundle patch: `npx wrangler deploy --env staging --dry-run --outdir .open-next/deploy` then `node scripts/patch-bundle-require.cjs`
- Deploy: `npx wrangler deploy --env staging --no-bundle --config wrangler.deploy.toml`
- Worker: `aistroyka-web-staging`
- Public staging URL: `https://staging.aistroyka.ai`

Production deploy path:

- Workflow: `.github/workflows/deploy-cloudflare-prod.yml`
- Trigger: automatic on push to `main`, manual via `workflow_dispatch`
- Worker: `aistroyka-web-production`
- Expected Cloudflare production URL: `https://aistroyka.ai`
- Live smoke previously showed `https://www.aistroyka.ai` responding from Vercel, so production hosting still needs an explicit deploy-path decision before any production rollout.

## Workflow Used

- Command: `gh workflow run deploy-cloudflare-staging.yml -r hotfix/phase2-document-runtime-closure -f ref=hotfix/phase2-document-runtime-closure`
- Run ID: `24930727071`
- Run URL: `https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24930727071`
- Head SHA: `3e363e38f966a12345de789fd70cb957eedf0bfe`

## Deploy Result

GitHub Actions completed successfully.

Successful jobs:

- `Build and deploy to staging`
- `Post-deploy pilot smoke (blocking) / Post-deploy pilot smoke`
- `Post-deploy AI Phase 5 gate (non-blocking)`

The workflow emitted non-blocking cache and Node.js 20 deprecation annotations, but the deploy and post-deploy smoke jobs completed with `success`.

## Staging Health Result

Command:

```bash
curl -i https://staging.aistroyka.ai/api/v1/health
```

Result:

- HTTP status: `200`
- Server: `cloudflare`
- `ok`: `true`
- `env`: `staging`
- `buildStamp.sha7`: `3e363e3`
- `buildStamp.buildTime`: `2026-04-25 12:18`

Safe body excerpt:

```json
{"ok":true,"db":"ok","env":"staging","buildStamp":{"sha7":"3e363e3","buildTime":"2026-04-25 12:18"}}
```

Legacy health endpoint:

```bash
curl -i https://staging.aistroyka.ai/api/health
```

Result:

- HTTP status: `200`
- Server: `cloudflare`
- `Link: </api/v1/health>; rel="successor"`
- `buildStamp.sha7`: `3e363e3`

## Staging Worker Result

Command:

```bash
curl -i https://staging.aistroyka.ai/api/v1/worker
```

Result:

- HTTP status: `200`
- Server: `cloudflare`
- No `501 worker_stub`
- Response is the new compatibility discovery catalog.

Safe body excerpt:

```json
{"ok":true,"service":"worker","status":"available","message":"Use canonical worker subroutes for tasks, reports, sync, uploads, and config."}
```

The response also includes canonical route guidance for worker tasks, day start/end, reports, sync, upload sessions, config, and projects.

## Authenticated Smoke

Local shell auth material check:

- `AUTH_HEADER`: missing
- `CRON_SECRET`: missing
- `PROJECT_ID`: missing
- `SMOKE_EMAIL`: missing
- `SMOKE_PASSWORD`: missing

No separate local authenticated smoke was run because local auth material is absent.

GitHub Actions staging did run the blocking reusable `pilot-smoke` job with repository staging secrets, including `pilot_launch.sh`, and the job completed successfully.

## Missing Credentials

For local/manual authenticated smoke, operator input is still needed:

- `AUTH_HEADER` with a staging user bearer token, or staging `SMOKE_EMAIL` and `SMOKE_PASSWORD`
- `CRON_SECRET` if cron-protected checks are expected
- `PROJECT_ID` for project-specific read-only route checks

## Production Deploy Recommendation

Do not deploy production until the production hosting path is explicitly decided.

Current evidence:

- Staging is Cloudflare and now closed on deployed head `3e363e3`.
- Previous live smoke showed production `www.aistroyka.ai` responding from Vercel with old build stamp `488683f`.
- Repo workflows expect Cloudflare production deploy to `aistroyka-web-production`.

Recommended next step:

1. Decide whether production canonical runtime should be Cloudflare Worker or Vercel.
2. If Cloudflare is authoritative, verify DNS/routes for `aistroyka.ai` and `www.aistroyka.ai` before production workflow dispatch.
3. Only after routing is clear, deploy production using an explicit ref and verify `/api/v1/health`, `/api/health`, and `/api/v1/worker`.

## Final Verdict

**STAGING DRIFT CLOSED**

Closure criteria met:

- Staging deploy succeeded.
- Staging health build stamp matches deployed fixed branch head `3e363e3`.
- Staging `/api/v1/worker` no longer returns `501 worker_stub`.
- Staging `/api/v1/worker` returns the compatibility discovery response.

Production remains out of scope for this step and must not be deployed until the production deploy-path decision is made.
