# Scripts Inventory — AISTROYKA

> Stage F. Catalogue of repo scripts with safety classification for desktop vs cloud agents.
> Not rewritten or modified — inventory only. Date: 2026-06-30.
> Columns: **Local** = safe to run on a dev machine · **Cloud** = safe for an unattended cloud agent · **Secrets** = needs secret values · **Destructive** = mutates prod/DB/remote state.

## Root `package.json` scripts

| Script | Command | Purpose | Local | Cloud | Secrets | Destructive |
|---|---|---|---|---|---|---|
| `dev` | `cd apps/web && bun run dev` | Local dev server | Yes | No (long-running) | env only | No |
| `build` | contracts + web build | Production-style build | Yes | Yes | build-time `NEXT_PUBLIC_*` | No |
| `cf:build` | contracts + OpenNext/Workers bundle | Cloudflare bundle (no deploy) | Yes | Yes | build-time `NEXT_PUBLIC_*` | No |
| `cf:deploy*` | wrangler deploy (staging/prod) | **Deploy to Cloudflare** | No (operator) | **No** | Yes (CF creds) | **Yes** |
| `lint` | ESLint | Lint web | Yes | Yes | No | No |
| `i18n:check` | `node scripts/i18n/check-messages.js` | i18n message parity | Yes | Yes | No | No |
| `test` | contracts build + web unit tests | Unit tests | Yes | Yes | No (mock admin) | No |
| `audit:e2e` | `scripts/audit/run_e2e_audit.sh` | E2E audit | Yes | Conditional | Yes (creds) | No |
| `smoke:prod` | `apps/web/scripts/smoke-prod.sh` | Production smoke | Yes | Conditional | Yes | No |
| `smoke:staging` | `apps/web/scripts/smoke-staging.sh` | Staging smoke | Yes | Conditional | Yes | No |
| `smoke:pilot` | `scripts/smoke/pilot_launch.sh` | Pilot smoke | Yes | Conditional | Yes | No |
| `smoke:pilot:check` | `scripts/smoke/check_pilot_prereqs.sh` | Pilot prereq check | Yes | Yes | partial | No |
| `smoke:security-headers` | `scripts/smoke/security_headers.sh` | Security headers smoke | Yes | Yes | No | No |
| `audit:pilot` | `scripts/audit/run-pilot-audit.sh` | Pilot audit | Yes | Conditional | Yes | No |
| `release:check` | `scripts/release-readiness-check.mjs` | Release readiness policy | Yes | Yes | placeholder ok | No |
| `postinstall` | `scripts/ensure-swc-native.cjs` | Ensure SWC native binary | Yes | Yes | No | No |

## `scripts/` subtrees

| Path | Purpose | Local | Cloud | Secrets | Destructive |
|---|---|---|---|---|---|
| `ci/validate-npm-lock.cjs` | Validate root npm lock for Vercel path | Yes | Yes | No | No |
| `i18n/check-messages.js` | i18n parity (used by `i18n:check`) | Yes | Yes | No | No |
| `release/check-migrations.sh` | Migration sanity (no apply) | Yes | Yes | No | No |
| `release/apply-migrations.sh` | **`supabase db push --include-all`** | Operator only | **No** | Yes | **Yes (DB)** |
| `release/check-env-config.sh` | Env config check | Yes | Yes | reads names | No |
| `release/smoke-gate.sh` | Release smoke gate | Yes | Conditional | Yes | No |
| `db/seed_local_pilot.sql` | Seed LOCAL pilot data | Local only | No | No | Yes (local DB) |
| `db/remap_migration_versions_*.sql` | Migration version remap (one-off) | Operator only | No | No | **Yes (DB)** |
| `smoke/ai_live_provider.sh` | AI live-provider gate (`--require-live`) | Yes | Conditional | Yes (AI keys) | No |
| `smoke/*` (other) | API/AI/dashboard/security smokes | Yes | Conditional | mostly Yes | No |
| `smoke/bootstrap_smoke_user.mjs`, `seed_pilot_project.mjs`, `attach_smoke_user_tenant.mjs` | Seed/attach smoke fixtures | Caution | No | Yes (service role) | **Yes (DB writes)** |
| `audit/*` | E2E/pilot audit runners + report writers | Yes | Conditional | some Yes | No |
| `scan-secrets-history.sh` | **Non-destructive** secret audit | Yes | Yes | No | No |
| `release-readiness-check.mjs`, `validate-release-env.mjs` | Release/env validation | Yes | Yes | reads env | No |
| `ensure-swc-native.cjs` | postinstall SWC native | Yes | Yes | No | No |
| `ios/*`, `mobile/*`, `maestro/*` | Mobile build/test helpers | Yes (macOS) | No | some | No |
| `android/*` | Android helpers | Yes (SDK) | No | some | No |
| `bootstrap_local_supabase.sh` | Bootstrap LOCAL Supabase | Local only | No | No | Yes (local) |
| `kill-hanging-dev.sh` | Kill stuck dev processes | Yes | No | No | Local only |
| `verify-prod-*.sh`, `prod-verify.sh` | Production verification probes | Yes | Conditional | some | No |

## Pilot / Day-0 additions (2026-08)

Read-only probes. Do not treat HTTP 200 on forgot-password as mailbox-delivery proof.

| Path | Purpose | Local | Cloud | Secrets | Destructive |
|---|---|---|---|---|---|
| `scripts/pilot/verify_forgot_password_route.sh` | `POST /api/v1/auth/forgot-password` live-or-404 (`400`/`200`/`429`/`503` = route live) | Yes | Yes | No | No |
| `scripts/pilot/run_day0_staging_rehearsal.sh` | Staging Day-0 rehearsal (includes forgot-password probe) | Yes | Conditional | env / intake file | No |

Password recovery runbook: `docs/auth/PASSWORD_RECOVERY.md`.

## Auth provider operator scripts (2026-08)

These PATCH live Supabase Auth on project `vthfrxehrursfloevnlp`. Operator-only. Never invent Apple/Google/SMS credentials.

| Path | Purpose | Local | Cloud | Secrets | Destructive |
|---|---|---|---|---|---|
| `apps/web/scripts/set-supabase-auth-urls.mjs` | **Merge** Site URL + Redirect URLs (keeps iOS schemes) | Operator | **No** | `SUPABASE_ACCESS_TOKEN` | **Yes (Auth URLs)** |
| `apps/web/scripts/enable-auth-apple.mjs` | Enable Apple provider from an existing `.p8` | Operator | **No** | token + `.p8` | **Yes (Auth)** |
| `apps/web/scripts/enable-auth-google.mjs` | Enable Google provider from existing OAuth client | Operator | **No** | token + client id/secret | **Yes (Auth)** |
| `apps/web/scripts/enable-auth-phone-otp.mjs` | Phone OTP `--status` / `--disable` / `--enable` (enable refuses without SMS creds) | Operator | `--status` only | token | `--enable`/`--disable` **Yes** |

Website acquisition: `docs/growth/WEBSITE_ACQUISITION.md`. Auth inventory: `docs/auth/MULTI_PROVIDER_AUTH_INVENTORY.md`.

## Duplicate-suffixed scripts (cleanup candidates — not modified)

- `scripts/release-readiness-check (1).mjs`
- `scripts/validate-release-env (1).mjs`
- `apps/web/wrangler (1).deploy.toml`

These look like accidental copies. Leave for owner decision (HARD RULE: no deletion here).

## Rules of thumb

- **Cloud agents:** stick to `lint`, `i18n:check`, `test`, `cf:build`, `release:check`, `validate-npm-lock`, `check-migrations`, `scan-secrets-history`. These need no secrets and are non-destructive.
- **Anything that deploys, applies migrations, or seeds a DB** is operator-only and requires explicit approval.
- Smokes marked "Conditional" run in cloud only when their `PILOT_*` / base-URL / bearer secrets are configured as CI secrets.
