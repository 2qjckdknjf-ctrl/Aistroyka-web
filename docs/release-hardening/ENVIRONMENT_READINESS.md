# Environment readiness

**Purpose:** Ensure production and pilot deployments have correct, safe environment configuration.

## Validation script

From **repo root**:

```bash
node scripts/validate-release-env.mjs
```

- Loads `apps/web/.env.local` and `apps/web/.env` if present (for local runs).
- Validates **names only** (no secret values in output).
- Writes `reports/release-hardening/env-validation-report.md` and `.json`.
- Exit code: 0 = PASS or PASS_WITH_WARNINGS, 1 = FAIL.

For **production** validation, run with production env (e.g. in CI or after sourcing production vars):

```bash
NODE_ENV=production node scripts/validate-release-env.mjs
```

## Categories

| Category | Description |
|----------|-------------|
| **required_web** | Needed for app to run: Supabase URL/anon key, app URL, NODE_ENV |
| **required_jobs** | Service role key; when REQUIRE_CRON_SECRET=true, CRON_SECRET must be set |
| **required_ai** | At least one provider key (OPENAI, ANTHROPIC, GEMINI) for AI features |
| **required_billing** | Stripe keys and webhook secret if using billing |
| **required_push** | FCM or APNS vars if using push |
| **debug_forbidden_in_prod** | DEBUG_AUTH, DEBUG_DIAG, ENABLE_DIAG_ROUTES must be unset or false in production |

## Verdicts

- **PASS:** All critical vars present; no forbidden flags in prod; cron configured when required.
- **PASS_WITH_WARNINGS:** Minimal run OK; optional (AI, billing, push) not configured.
- **FAIL:** Missing critical vars, or forbidden debug flags set in production, or cron required but CRON_SECRET missing.

## Centralized config

App code should read config via:

- `@/lib/config` — getPublicConfig, getServerConfig, getDebugConfig, hasSupabaseEnv, isOpenAIConfigured, etc.
- `@/lib/config/release-env` — validateReleaseEnv() for startup or script use.

No ad-hoc `process.env` for app config outside `lib/config`.

## Example .env files

- `apps/web/.env.example` — full template with sections.
- `apps/web/.env.production.example` — production minimum and forbidden list.
- `apps/web/.env.staging.example` — staging minimum.

## Release verdict for env

Before pilot or production deploy:

1. Run `node scripts/validate-release-env.mjs` with target env (e.g. NODE_ENV=production).
2. Resolve any FAIL (critical missing or forbidden in prod).
3. For PASS_WITH_WARNINGS, confirm which optional features (AI, billing, push) are intentionally off.
4. Ensure Cloudflare (or host) has all required variables set; re-run validation after deploy if possible.
