# Production Cloudflare Route Alignment Report

Date: 2026-04-25

## Final Verdict

**ROUTE_ALIGNMENT_READY**

The exact production Cloudflare/DNS actions are documented and no code changes are required before the operator can proceed. Route alignment is **not yet verified**: current public production traffic still resolves to Vercel and local Wrangler/Cloudflare Dashboard access is unavailable in this shell.

Do not run a production deploy until either:

- live route checks prove `aistroyka.ai` and `www.aistroyka.ai` hit Cloudflare Worker, or
- the operator explicitly confirms the Cloudflare route/DNS alignment is complete.

## Current Branch And Commit

- Branch: `hotfix/phase2-document-runtime-closure`
- Current commit: `296a401af8c9dccd81b9a32751a61ccc87345a65`
- Current sha7: `296a401`

Existing unstaged repo state at report time:

- `docs/final/PRODUCTION_RUNTIME_OWNERSHIP_DECISION.md` is untracked.
- This report is also untracked until committed.

## Current Live DNS And Routing Status

Safe public checks only were performed. No production deploy, DNS change, route change, feature code change, secret access, or database action was performed.

### Apex Health: `https://aistroyka.ai/api/v1/health`

Command:

```bash
curl -I https://aistroyka.ai/api/v1/health
curl -sS https://aistroyka.ai/api/v1/health
```

Observed:

- HTTP status: `307`
- `server`: `Vercel`
- Redirect: `https://www.aistroyka.ai/api/v1/health`
- `x-vercel-id`: present
- Body: `Redirecting...`

### WWW Health: `https://www.aistroyka.ai/api/v1/health`

Command:

```bash
curl -I https://www.aistroyka.ai/api/v1/health
curl -sS https://www.aistroyka.ai/api/v1/health
```

Observed:

- HTTP status: `200`
- `server`: `Vercel`
- `x-vercel-id`: present
- `x-matched-path`: `/api/v1/health`
- `x-vercel-cache`: `MISS`
- `buildStamp.sha7`: `488683f`
- `buildStamp.buildTime`: empty

Safe body excerpt:

```json
{"ok":true,"db":"ok","aiConfigured":false,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"buildStamp":{"sha7":"488683f","buildTime":""}}
```

### DNS

Command:

```bash
dig aistroyka.ai
dig www.aistroyka.ai
dig CNAME www.aistroyka.ai
```

Observed:

- `aistroyka.ai` A record: `216.198.79.1`
- `www.aistroyka.ai` CNAME: `91612e169816f344.vercel-dns-017.com.`
- Vercel CNAME target A records observed:
  - `216.198.79.65`
  - `64.29.17.65`

Conclusion: public production routing is still Vercel-owned. Route alignment is not live-verified.

## Current Production Server Evidence

Current public production evidence:

- Apex redirects to `www`.
- Apex response is from Vercel.
- `www` response is from Vercel.
- `www` DNS explicitly points to Vercel.
- Public production still serves old build `488683f`.

There was no Cloudflare `server` header on production public health checks. Cloudflare production routing is not currently visible from public DNS/HTTP evidence.

## Cloudflare Worker And Config Evidence

### Wrangler Config

`apps/web/wrangler.toml` defines:

- Production Worker: `aistroyka-web-production`
- Production app URL: `https://aistroyka.ai`
- Production self-reference service: `aistroyka-web-production`
- Production route examples for:
  - `aistroyka.ai`
  - `aistroyka.ai/*`
  - `www.aistroyka.ai`
  - `www.aistroyka.ai/*`

Important config comment:

```text
Routes are managed manually in Cloudflare Dashboard. CI must not create/update/delete routes (permission 10000).
```

`apps/web/wrangler.deploy.toml` defines:

- Production Worker: `aistroyka-web-production`
- Production entrypoint: `.open-next/deploy/worker-bootstrap.js`
- Production app URL: `https://aistroyka.ai`
- Production AI analysis URL: `https://aistroyka.ai/api/ai/analyze-image`

### GitHub Workflow

`.github/workflows/deploy-cloudflare-prod.yml` defines:

- Workflow: `Deploy Cloudflare (Production)`
- Trigger: push to `main` and manual `workflow_dispatch`
- Build: `bun run cf:build`
- Deploy command: `npx wrangler deploy --env production --no-bundle --config wrangler.deploy.toml`
- Expected Worker: `aistroyka-web-production`
- Blocking post-deploy smoke against `https://aistroyka.ai`

Latest inspected production workflow evidence:

- Latest run ID: `24781207994`
- Status: `success`
- Head SHA: `f93993412ab799b66bb3098f49933286e48c2ce6`
- Successful job: `Build and deploy to production`
- Successful step: `Deploy to Cloudflare (production, patched bundle)`
- Blocking `pilot_launch.sh` smoke job completed successfully in the workflow.

This proves the repo has an active Cloudflare production deploy pipeline. It does **not** prove public DNS currently reaches that Worker.

### Package Scripts

Root `package.json`:

- `cf:build`: builds contracts and Cloudflare web bundle.
- `cf:deploy:prod`: uses Wrangler production dry-run, patches bundle, then deploys with `wrangler.deploy.toml`.

`apps/web/package.json`:

- `cf:deploy:prod`: same Cloudflare production deploy path.
- `cf:fix-domain`: script that edits/removes Cloudflare Worker routes.
- `cf:dns-setup`: script that creates/updates Cloudflare DNS records.

The DNS/route scripts require `CLOUDFLARE_API_TOKEN` and perform state-changing actions, so they were inspected but not run.

## Wrangler And Cloudflare Access

Read-only Wrangler checks attempted:

```bash
npx wrangler --version
npx wrangler whoami
npx wrangler deployments list --env production --config apps/web/wrangler.deploy.toml
```

Observed:

- Wrangler version: `4.69.0`
- `wrangler whoami` failed:

```text
Failed to fetch auth token: 400 Bad Request
Not logged in.
```

Because local Wrangler auth is unavailable, the deployment list command could not run. Direct Cloudflare Worker deployment and route inspection requires operator Cloudflare Dashboard access or authenticated Wrangler/API access.

## Route Status Answers

1. Does Worker `aistroyka-web-production` exist?
   - Not directly verifiable from local Wrangler because auth is missing.
   - Strong indirect evidence exists: the production GitHub Actions deploy step to Cloudflare succeeded for `aistroyka-web-production`.

2. What was the latest deployed Worker version?
   - Not directly verifiable from local Wrangler.
   - Latest successful GitHub production workflow deployed head SHA `f93993412ab799b66bb3098f49933286e48c2ce6`.

3. Are custom routes configured for `aistroyka.ai/*` and `www.aistroyka.ai/*`?
   - Not verifiable without Cloudflare Dashboard/API access.
   - Repo comments say production routes are manually managed in Cloudflare Dashboard.
   - Public DNS/HTTP evidence shows current production is Vercel, so either routes are missing, DNS is bypassing them, or the domain is still Vercel-authoritative.

4. Are route definitions managed manually in Dashboard?
   - Yes, per `apps/web/wrangler.toml` comments.

5. Is any route currently missing?
   - Exact Cloudflare route status is unknown without Dashboard/API access.
   - Public behavior proves the effective production route alignment is missing or not active.

## Required External Operator Actions

Perform these in Cloudflare Dashboard. Do not remove Vercel production routing until rollback expectations are clear.

1. Open the Cloudflare account that owns `aistroyka.ai`.
2. Select domain `aistroyka.ai`.
3. Go to **Workers & Pages**.
4. Open Worker `aistroyka-web-production`.
5. Open **Settings** / **Triggers** / **Routes**.
6. Confirm the Worker exists and has a recent deployment.
7. Ensure Worker routes exist and point to `aistroyka-web-production`:
   - `aistroyka.ai/*`
   - `www.aistroyka.ai/*`
8. Go to **DNS** for `aistroyka.ai`.
9. Remove or replace the Vercel CNAME for `www`:
   - current Vercel target: `91612e169816f344.vercel-dns-017.com`
10. Ensure `www.aistroyka.ai` is proxied through Cloudflare.
11. Ensure the apex `aistroyka.ai` is also proxied through Cloudflare.
12. Decide canonical host:
   - preferred for current continuity: keep `www.aistroyka.ai` primary and make apex redirect to `www`, or
   - switch to apex primary and make `www` redirect to apex.
13. Verify SSL/TLS mode for the zone.
14. Verify Vercel no longer owns the production custom domain:
   - disconnect production domain in Vercel, or
   - downgrade Vercel to preview/legacy only.
15. Confirm Supabase auth configuration matches the final host.

## Route Alignment Checklist

Complete before production deploy:

- [ ] Cloudflare Worker `aistroyka-web-production` exists.
- [ ] Latest intended production Worker deployment is visible in Cloudflare Dashboard.
- [ ] `aistroyka.ai/*` route is attached to `aistroyka-web-production`.
- [ ] `www.aistroyka.ai/*` route is attached to `aistroyka-web-production`.
- [ ] `www.aistroyka.ai` no longer CNAMEs to Vercel.
- [ ] `aistroyka.ai` no longer routes to Vercel.
- [ ] Both apex and `www` are proxied through Cloudflare.
- [ ] Apex behavior is decided.
- [ ] Supabase Site URL is checked.
- [ ] Supabase redirect URLs include the final canonical host.
- [ ] Vercel production domain is disconnected or downgraded to preview/legacy.
- [ ] Rollback route/DNS plan is documented.
- [ ] Post-operator public checks show no Vercel headers.

## Supabase Redirect URL Checks Required

In Supabase Dashboard, verify:

- Site URL matches the final canonical production host.
- Redirect URLs include:
  - `https://aistroyka.ai/**`
  - `https://www.aistroyka.ai/**`
  - any staging URL still used for smoke/testing, such as `https://staging.aistroyka.ai/**`
- Mobile callback/deep-link URLs are preserved if already configured.

Do not change Supabase secrets. Only verify and align URL allowlists as needed.

## Rollback Plan

Before cutover, record current DNS state:

- Apex A record: `216.198.79.1`
- `www` CNAME: `91612e169816f344.vercel-dns-017.com.`

Rollback options:

1. Restore `www.aistroyka.ai` CNAME to `91612e169816f344.vercel-dns-017.com.` if Cloudflare routing fails and Vercel must temporarily resume serving production.
2. Restore apex behavior to the prior Vercel redirect path if needed.
3. Disable or remove the Cloudflare Worker routes for `aistroyka.ai/*` and `www.aistroyka.ai/*` only if they are confirmed to be the cause of outage.
4. Re-run public health checks after rollback:
   - `curl -I https://aistroyka.ai/api/v1/health`
   - `curl -I https://www.aistroyka.ai/api/v1/health`
   - `curl -sS https://www.aistroyka.ai/api/v1/health`

## Post-Operator Verification Commands

After the operator aligns Cloudflare routes and DNS, run:

```bash
curl -I https://aistroyka.ai/api/v1/health
curl -I https://www.aistroyka.ai/api/v1/health
curl -sS https://aistroyka.ai/api/v1/health
curl -sS https://www.aistroyka.ai/api/v1/health
curl -i https://aistroyka.ai/api/v1/worker
curl -i https://www.aistroyka.ai/api/v1/worker
dig aistroyka.ai
dig www.aistroyka.ai
dig CNAME www.aistroyka.ai
```

Expected after route alignment:

- `server` should no longer be `Vercel`.
- `x-vercel-*` headers should disappear.
- `www.aistroyka.ai` should no longer CNAME to `*.vercel-dns-*.com`.
- Requests should hit Cloudflare/Worker routing.
- `/api/v1/health` should not 500.
- `/api/v1/worker` should not return `501 worker_stub`.

Expected after the later production Cloudflare deploy:

- `buildStamp.sha7` should match the deployed Cloudflare production commit.
- `/api/v1/worker` should return the compatibility discovery catalog.

## Next Step

Operator must complete Cloudflare Dashboard/DNS alignment, then run the post-operator verification commands above.

Only after route alignment is verified or explicitly confirmed should the team proceed to the next stage: controlled production deploy to Cloudflare.
