# Smoke / Ops Asset Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

No smoke scripts were executed. No secret values were printed. Environment was inspected by variable name only.

## Smoke Scripts Found

Representative scripts:

- `scripts/smoke/pilot_launch.sh`
- `scripts/smoke/check_pilot_prereqs.sh`
- `scripts/smoke/ios_mobile_api_chain.sh`
- `scripts/smoke/ai_live_provider.sh`
- `scripts/smoke/bootstrap_smoke_user.mjs`
- `scripts/smoke/attach_smoke_user_tenant.mjs`
- `scripts/release/smoke-gate.sh`
- `scripts/mobile/smoke-mobile.sh`
- `scripts/mobile/smoke-push.sh`
- `ios/scripts/run-ios-uitest-smoke-local.sh`
- `apps/web/scripts/smoke-staging.sh`
- `apps/web/scripts/smoke-prod.sh`

## Workflow Assets Found

Relevant workflows:

- `.github/workflows/ci-check.yml`
- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`
- `.github/workflows/pilot-smoke.yml`
- `.github/workflows/pilot-e2e-audit.yml`
- `.github/workflows/ios-ui-smoke.yml`
- `.github/workflows/ios-e2e-integration.yml`
- `.github/workflows/android-instrumented-smoke.yml`
- `.github/workflows/ai-live-provider-gate.yml`
- `.github/workflows/release-go-no-go-council.yml`
- `.github/workflows/supabase-auth-hibp.yml`

## Runbooks / Docs Found

Representative docs:

- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`
- `docs/release/STRICT_PILOT_SMOKE_ENV_RUNBOOK.md`
- `docs/release/PHASE3_PILOT_SMOKE_USAGE.md`
- `docs/release/FINAL_OPERATOR_ONLY_CHECKLIST.md`
- `docs/release/PRODUCTION_RELEASE_GO_NO_GO.md`
- `docs/reconciliation/PR_109_AUTH_RUNTIME_FINAL_EVIDENCE_2026-06-20.md`
- many historical `docs/release*`, `docs/release1`, and `docs/reconciliation` gate reports

Historical docs contain stale failure/success snapshots and must be treated as evidence, not current truth, unless revalidated.

## Env Variable Names Observed

Names only, values not printed:

- `DATABASE_URL`
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `REQUIRE_CRON_SECRET`
- `SMOKE_EMAIL`
- `SMOKE_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Example files also define names such as:

- `PLAYWRIGHT_BASE_URL`
- `E2E_LOCALE`
- `E2E_DEVICE_ID`
- `E2E_TENANT_ID`
- `E2E_PROJECT_ID`
- `AUTH_HEADER`
- `COOKIE`
- `CRON_SECRET`
- `STAKEHOLDER_SMOKE_EMAIL`
- `STAKEHOLDER_SMOKE_PASSWORD`
- `STAKEHOLDER_FINANCE_BASE_URL`
- `PILOT_SMOKE_BEARER_STAGING`
- `PILOT_SMOKE_BEARER_PRODUCTION`
- `PILOT_E2E_BASE_URL`
- `PILOT_E2E_EMAIL`
- `PILOT_E2E_PASSWORD`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Risk Classification

|Asset type|Risk|Reason|
|---|---|---|
|Read-only prereq checks|Low|Can run without network/mutation when carefully scoped.|
|Pilot smoke against staging|Medium|May run cron/metrics and authenticated tenant checks.|
|Pilot smoke against production|High|Hits live production endpoints and may exercise cron/jobs.|
|Auth Admin smoke user scripts|High|Can create users and tenant memberships with service-role material.|
|Deploy workflows|High|Can mutate Cloudflare runtime and Worker secrets.|
|AI live-provider smoke|Medium/high|Can call live providers and must distinguish fallback vs live result.|
|Stakeholder finance sanity|High value, medium risk|Protects customer-finance boundary but requires dedicated credentials.|

## Inventory Verdict

The repo contains enough smoke assets for staging/prod gates, but policy must distinguish prereq checks, staging smoke, production smoke, user lifecycle mutation, and deployment-triggering workflows.
