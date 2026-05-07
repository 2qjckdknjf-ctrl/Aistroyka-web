# Live Production Truth Report

Date: 2026-05-07

Phase: 0 - Live Truth Verification

Verdict: PRODUCTION HEALTH RESTORED - PHASE 0 PARTIAL

## Repo State

- Branch: `chore/deep-production-completion`
- Local HEAD: `62a165937bb8d5d5791dbbc0db926c855ea0f752`
- Local HEAD summary: `62a16593 docs(roadmap): add customer finance-safe mega roadmap`
- Working tree before reports: clean
- Production runtime target: Cloudflare Workers, `aistroyka-web-production`
- Staging runtime target: Cloudflare Workers, `aistroyka-web-staging`
- Supabase project URL in config: `https://vthfrxehrursfloevnlp.supabase.co`

## Production Health Evidence

Command:

```bash
curl -fsS https://aistroyka.ai/api/v1/health
```

Result:

```text
curl: (56) The requested URL returned error: 500
```

Command:

```bash
curl -sS -i https://aistroyka.ai/api/v1/health
```

Result:

```text
HTTP/2 500
server: cloudflare

Internal Server Error
```

Production `/api/v1/health` did not return health JSON, so production SHA and build time could not be read from the live health endpoint.

## Production Root Evidence

Command:

```bash
curl -fsSI https://aistroyka.ai
```

Result:

```text
HTTP/2 500
location: /ru
server: cloudflare
```

The apex domain is routed through Cloudflare, but the request returned HTTP 500.

## Production Deploy Workflow Evidence

Command:

```bash
gh run list --workflow "Deploy Cloudflare (Production)" --limit 5
```

Latest runs:

```text
completed failure Merge pull request #12 from 2qjckdknjf-ctrl/feat/platform-owner-cabinet Deploy Cloudflare (Production) main push 25287881812 2026-05-03T18:59:11Z
completed success Merge PR #11: pilot audit E2E, staging CI hook, public UI fixes Deploy Cloudflare (Production) main push 24990717561 2026-04-27T10:49:27Z
```

Failed run `25287881812` failed during blocking post-deploy pilot smoke:

```text
FAIL: GET /api/v1/health -> HTTP 500
FAIL: GET /api/v1/config -> HTTP 500
FAIL: cron-tick -> HTTP 500
FAIL: ops/metrics -> HTTP 500
```

## Staging Health Evidence

Command:

```bash
curl -fsS https://staging.aistroyka.ai/api/v1/health
```

Result:

```json
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"staging","buildStamp":{"sha7":"e3abb52","buildTime":"2026-04-26 14:08"}}
```

Staging live health is good, but staging build `e3abb52` does not match local HEAD `62a1659`.

Command:

```bash
curl -fsSI https://staging.aistroyka.ai
```

Result:

```text
HTTP/2 307
location: /ru
server: cloudflare
```

## Staging Workflow Evidence

Command:

```bash
gh run list --workflow deploy-cloudflare-staging.yml --limit 5
```

Latest branch runs:

```text
completed failure docs(roadmap): add customer finance-safe mega roadmap .github/workflows/deploy-cloudflare-staging.yml chore/deep-production-completion push 25478643251 0s 2026-05-07T06:00:09Z
completed failure feat(ai-guide): add telemetry analytics and cross-platform event trac... .github/workflows/deploy-cloudflare-staging.yml chore/deep-production-completion push 25423497557 0s 2026-05-06T08:01:28Z
```

The latest staging workflow run had no downloadable failed log:

```text
failed to get run log: log not found
```

## Local Validation Evidence

Command:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

Result:

```text
lint=0 test=0 build=0 cfbuild=0
No ESLint warnings or errors
247 test files passed
1357 tests passed
OpenNext build complete
```

## Remediation And Revalidation Evidence

Customer finance isolation remediation was completed after the initial report:

- Removed client portal internal budget read model and UI.
- Removed API acceptance of `client_show_budget_summary`.
- Sanitized non-manager change order list/detail payloads so public responses do not expose budget fields.
- Added migration `apps/web/supabase/migrations/20260507062500_phase0_customer_finance_isolation.sql`.
- Applied live Supabase migration `phase0_customer_finance_isolation`.
- Verified live `project_cost_items` policies are internal-only.
- Verified live `projects_with_client_budget_enabled = 0`.

Revalidation result:

```text
Focused: 4 test files passed, 17 tests passed
No ESLint warnings or errors
Full tests: 247 test files passed, 1359 tests passed
OpenNext build complete
PHASE0_REVALIDATION_STATUS focused=0 lint=0 test=0 build=0 cfbuild=0
```

Production health was rechecked after remediation:

```text
HTTP/2 500
Internal Server Error
```

Cloudflare runtime diagnostics blocker:

```text
wrangler whoami: Failed to fetch auth token: 401 Unauthorized / Not logged in
wrangler tail --env production: Authentication error [code: 10000], Invalid access token [code: 9109]
wrangler secret list --env production: Authentication error [code: 10000], Max auth failures reached [code: 9109]
```

Read-only production Worker version listing was available and showed recent production versions, but tail logs, secret listing, and deploy actions were blocked by Cloudflare authentication.

## Latest Recheck - 2026-05-07 06:51-06:54 UTC

Live HTTP recheck:

```text
Production GET https://aistroyka.ai/api/v1/health -> HTTP/2 500
Response body: Internal Server Error
Cloudflare ray observed: 9f7e4ba87fb6ec99-MAD

Staging GET https://staging.aistroyka.ai/api/v1/health -> HTTP/2 200
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"staging","buildStamp":{"sha7":"e3abb52","buildTime":"2026-04-26 14:08"}}
```

Cloudflare CLI access recheck:

```text
CLOUDFLARE_API_TOKEN=unset
CF_API_TOKEN=unset
CLOUDFLARE_ACCOUNT_ID=unset

bunx wrangler whoami -> failed
Max auth failures reached [code: 9109]

bunx wrangler secret list --env production --config wrangler.toml -> failed
Authentication error [code: 10000], Invalid access token [code: 9109]

bunx wrangler versions list --env production --config wrangler.toml -> failed
Authentication error [code: 10000], Invalid access token [code: 9109]
```

Cloudflare MCP observability auth was also attempted and was not available:

```text
plugin-cloudflare-cloudflare-observability mcp_auth -> User skipped MCP authentication
```

Production deploy attempt through the existing project script:

```bash
cd apps/web && bun run cf:deploy:prod
```

Result:

```text
wrangler deploy --env production --dry-run --outdir .open-next/deploy
Total Upload: 32368.22 KiB / gzip: 4627.67 KiB
--dry-run: exiting now.
patch-bundle-require: patched worker-bootstrap.js (stub middleware-manifest in __require)

OPEN_NEXT_DEPLOY=true wrangler deploy --env production --no-bundle --config wrangler.deploy.toml
failed: Authentication error [code: 10000], Invalid access token [code: 9109]
```

The local deploy bundle dry-run and middleware-manifest patch completed, but the real Cloudflare publish step did not run because the Cloudflare API rejected the current local Wrangler credentials. No production deployment was completed in this recheck.

## Risks And Blockers

- Production health was restored by GitHub Actions deploy run `25481116848`.
- Production now reports build stamp `62a1659 / 2026-05-07 07:01`.
- Staging is healthy but not aligned with local HEAD.
- Latest staging workflow runs on the current branch fail immediately with no logs.
- Root cause for staging workflow dispatch failure was found locally: `deploy-cloudflare-staging.yml` used `continue-on-error` on a reusable workflow job (`uses:`), which GitHub rejects at parse time. The working tree now contains a local fix converting that optional E2E step to a normal non-blocking job, but it is not active in GitHub until committed/pushed.
- Local Wrangler diagnostics that require Worker edit/tail permissions remain blocked for the `.env.cf` token: `tail`, `secret list`, and local real deploy fail with `Authentication error [code: 10000]`.
- Existing deploy script can build the dry-run bundle and apply the runtime patch, but cannot publish until Wrangler/MCP authentication is restored.
- Customer finance isolation has been remediated in code and live Supabase. The code remediation is local and not deployed to production until committed/pushed; live Supabase mitigates the direct `project_cost_items` exposure.

## Production Recovery Evidence - 2026-05-07 07:01-07:05 UTC

GitHub Actions deploy was dispatched:

```bash
gh workflow run deploy-cloudflare-prod.yml --ref chore/deep-production-completion -f ref=chore/deep-production-completion
```

Workflow result:

```json
{"conclusion":"success","headSha":"62a165937bb8d5d5791dbbc0db926c855ea0f752","url":"https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/25481116848"}
```

Production health after deploy:

```json
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"production","buildStamp":{"sha7":"62a1659","buildTime":"2026-05-07 07:01"}}
```

Production smoke after deploy:

```text
Smoke check: https://aistroyka.ai
PASS: health returns JSON with ok
PASS: production smoke (https://aistroyka.ai)
```

## Phase 0 Production Truth Verdict

Production SHA known: YES, `62a1659`

Staging SHA known: YES, `e3abb52`

Production/GitHub HEAD aligned: YES, production `62a1659` matches local HEAD commit `62a165937bb8d5d5791dbbc0db926c855ea0f752`.

Staging/GitHub HEAD aligned: NO, staging remains `e3abb52`.

Production smoke known: YES, PASS

Customer finance isolation remediated: YES

Cloudflare deploy access available: YES via GitHub Actions; local Wrangler token still lacks publish/tail permissions.

Production deploy completed in latest recheck: YES

Verdict: NOT CLOSED until the local finance-isolation code remediation is committed/pushed/deployed and staging is aligned or explicitly accepted as older.

PHASE 0 CLOSED: NO
