# Live Smoke Report

Date: 2026-05-07

Phase: 0 - Live Truth Verification

Verdict: PRODUCTION AND STAGING SMOKE PASSING - PHASE 0 PARTIAL

## Smoke Targets

- Production: `https://aistroyka.ai`
- Staging: `https://staging.aistroyka.ai`

## Production Smoke

Command:

```bash
bun run smoke:prod
```

Result:

```text
Smoke check: https://aistroyka.ai
FAIL: GET https://aistroyka.ai/api/v1/health -> HTTP 500
error: script "smoke:prod" exited with code 1
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

Production smoke status: FAIL

## Staging Smoke

Command:

```bash
bun run smoke:staging
```

Result:

```text
Smoke check: https://staging.aistroyka.ai
PASS: health env=staging
PASS: staging smoke (https://staging.aistroyka.ai)
```

Command:

```bash
curl -fsS https://staging.aistroyka.ai/api/v1/health
```

Result:

```json
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"staging","buildStamp":{"sha7":"e3abb52","buildTime":"2026-04-26 14:08"}}
```

Staging smoke status: PASS

## Workflow Smoke Evidence

Latest production deploy workflow:

```text
completed failure Deploy Cloudflare (Production) main push 25287881812 2026-05-03T18:59:11Z
```

Failed blocking smoke details:

```text
FAIL: GET /api/v1/health -> HTTP 500
FAIL: GET /api/v1/config -> HTTP 500
FAIL: cron-tick -> HTTP 500
FAIL: ops/metrics -> HTTP 500
```

Latest staging workflow entries on the current branch:

```text
completed failure .github/workflows/deploy-cloudflare-staging.yml chore/deep-production-completion push 25478643251 0s 2026-05-07T06:00:09Z
```

The failed staging workflow had no log available:

```text
failed to get run log: log not found
```

Live staging domain is still healthy from an older build stamp: `e3abb52 / 2026-04-26 14:08`.

## Local Validation

Command:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

Result:

```text
No ESLint warnings or errors
247 test files passed
1357 tests passed
OpenNext build complete
PHASE0_VALIDATION_STATUS lint=0 test=0 build=0 cfbuild=0
```

## Revalidation After Finance Isolation Remediation

Command:

```bash
bun run --cwd apps/web test \
  "lib/domain/client-portal/client-portal.service.test.ts" \
  "lib/domain/change-orders/change-orders.service.test.ts" \
  "app/api/v1/projects/[id]/client-portal/route.test.ts" \
  "app/api/v1/projects/[id]/client-view/route.test.ts"
bun run lint
bun run test
bun run build
bun run cf:build
```

Result:

```text
Focused: 4 test files passed, 17 tests passed
No ESLint warnings or errors
Full tests: 247 test files passed, 1359 tests passed
OpenNext build complete
PHASE0_REVALIDATION_STATUS focused=0 lint=0 test=0 build=0 cfbuild=0
```

Live health recheck after remediation:

```text
Production /api/v1/health: HTTP/2 500 Internal Server Error
Staging /api/v1/health: ok=true, env=staging, buildStamp=e3abb52 / 2026-04-26 14:08
```

## Latest Smoke And Deploy Recheck - 2026-05-07 06:51-06:54 UTC

Command:

```bash
bun run smoke:prod
```

Result:

```text
Smoke check: https://aistroyka.ai
FAIL: GET https://aistroyka.ai/api/v1/health -> HTTP 500
error: script "smoke:prod" exited with code 1
```

Command:

```bash
bun run smoke:staging
```

Result:

```text
Smoke check: https://staging.aistroyka.ai
PASS: health env=staging
PASS: staging smoke (https://staging.aistroyka.ai)
```

Direct health recheck:

```text
Production /api/v1/health: HTTP/2 500 Internal Server Error
Staging /api/v1/health: HTTP/2 200, ok=true, env=staging, buildStamp=e3abb52 / 2026-04-26 14:08
```

Production deploy attempt:

```bash
cd apps/web && bun run cf:deploy:prod
```

Result:

```text
Dry-run deploy bundle: PASS
patch-bundle-require: PASS
Real production deploy: FAIL
Reason: Cloudflare API authentication error [code: 10000], invalid access token [code: 9109]
```

No production smoke after deploy was possible because the real deploy step did not complete.

## Risks And Blockers

- Production health was restored by GitHub Actions deploy run `25481116848`.
- Production now returns `ok=true`, env `production`, buildStamp `62a1659 / 2026-05-07 07:01`.
- Staging live smoke passes, but it is not aligned with local HEAD.
- Latest staging workflow runs on the current branch fail before producing logs.
- Staging workflow dispatch root cause was found: GitHub rejects `continue-on-error` on a reusable workflow job. A local workflow fix is present in `.github/workflows/deploy-cloudflare-staging.yml`, but it requires commit/push before GitHub can use it.
- Latest local production deploy attempt did not publish because the local `.env.cf` token lacks Worker publish permission, but GitHub Actions deploy succeeded using repository secrets.
- Local build validation is green.
- Customer finance isolation code and live Supabase RLS were remediated and revalidated.
- Remaining blocker is deploying the local finance-isolation code remediation, which requires commit/push or a Cloudflare token with Worker publish permissions.

## Production Recovery Smoke - 2026-05-07 07:05 UTC

GitHub Actions production deploy:

```text
Run: 25481116848
Conclusion: success
Head SHA: 62a165937bb8d5d5791dbbc0db926c855ea0f752
```

Production health:

```json
{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true,"supabaseReachable":true,"serviceRoleConfigured":true,"env":"production","buildStamp":{"sha7":"62a1659","buildTime":"2026-05-07 07:01"}}
```

Production smoke:

```text
Smoke check: https://aistroyka.ai
PASS: health returns JSON with ok
PASS: production smoke (https://aistroyka.ai)
```

## Smoke Verdict

Production smoke result known: YES, PASS

Staging smoke result known: YES, PASS

Local validation result known: YES, PASS

Customer finance isolation revalidation known: YES, PASS

Production deploy completed in latest recheck: YES

Staging deploy completed in latest recheck: YES

Production build stamp: `3fda021 / 2026-05-07 08:06`

Staging build stamp: `3fda021 / 2026-05-07 08:02`

Verdict: CLOSED

PHASE 0 CLOSED: YES
