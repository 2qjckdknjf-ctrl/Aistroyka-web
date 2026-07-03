# Cloud / Database / Deployment Access Audit — AISTROYKA

> Stage D of the Project Operating System setup. Read-only. **No secret values recorded** — variable names and configuration presence only.
> Date: 2026-06-30

## 1. Supabase (database + auth)

| Item | Status |
|---|---|
| Active production project | **AISTROYKA** — ref `vthfrxehrursfloevnlp`, region eu-central-1 (per AGENTS facts; ref also hardcoded in `ci-check.yml`). |
| Migrations location | `apps/web/supabase/migrations/` — **150 migration files**. |
| Local Supabase state | `apps/web/supabase/.temp/` exists; `.env`/`.temp` secret files gitignored. |
| Supabase CLI locally | **MISSING** → cannot run `supabase migration list` / `db diff` / `db push` locally yet. |
| MCP Supabase | `user-supabase` + `plugin-supabase-supabase` servers available as an alternative to CLI (use `list_tables`, `get_advisors`, `apply_migration` with care). |
| Legacy project | `aistroyka-release1` (paused) = cold backup only — do NOT use as live runtime. |

> **Migration caution (AGENTS fact):** MCP `apply_migration` records remote versions with a different timestamp than repo filenames → repo↔remote history skew accumulates. Reconcile (object/SQL equivalence, non-destructive) before relying on CLI push/diff. **No migration apply is performed in this setup.**

## 2. Cloudflare (production runtime + DNS)

| Item | Status |
|---|---|
| Runtime owner | **Cloudflare Workers** (OpenNext). Configs: root `wrangler.toml`, `apps/web/wrangler.toml`, `apps/web/wrangler.deploy.toml`. |
| Canonical production domain | `aistroyka.ai` (+ `www.aistroyka.ai`). |
| Staging | `staging.aistroyka.ai`. |
| `.com` domains | `aistroyka.com` / `www.aistroyka.com` = 301 redirect-only → `https://aistroyka.ai` (worker in `apps/cloudflare-com-redirect`). |
| Build command | `bun run cf:build` (sequential with `bun run build`, never parallel). |
| Deploy verification | `GET /api/v1/health` → `buildStamp.sha7` (first 7 chars of deployed commit SHA). |
| Wrangler locally | 4.69.0 present (deploy still gated on Cloudflare creds — none assumed present locally). |

## 3. Vercel

- `.vercel/project.json` present (npm preview path). Vercel is a **preview/secondary** surface; canonical production is Cloudflare. See `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`.

## 4. CI/CD workflows (`.github/workflows/`, 17 files)

| Workflow | Role |
|---|---|
| `ci-check.yml` | **PR merge gate**: validate npm lock → bun install → i18n:check → lint → typecheck → test → release:check → cf:build (no deploy). |
| `deploy-cloudflare-staging.yml` | Deploy to staging on merge to `main`; may call reusable `pilot-e2e-audit.yml`. |
| `deploy-cloudflare-prod.yml` | Production deploy via `workflow_run` after staging verify. |
| `pilot-smoke.yml`, `pilot-e2e-audit.yml` | Pilot smoke + E2E audit. |
| `ios-e2e-integration.yml`, `ios-ui-smoke.yml`, `android-instrumented-smoke.yml` | Mobile CI. |
| `ai-live-provider-gate.yml`, `ai-phase5-slo-schedule.yml` | AI live-provider gate + SLO schedule. |
| `supabase-auth-hibp.yml`, `supabase-auth-db-conn-percent.yml` | Supabase auth ops. |
| `gdpr-deletion-processor.yml` | GDPR deletion processor. |
| `release-go-no-go-council.yml`, `aistroyka-com-redirect-setup.yml` | Release gate + .com redirect setup. |

**Canonical production chain:** merge to `main` → Deploy Cloudflare (Staging) → verify staging → Deploy Cloudflare (Production) via `workflow_run`. **Not** local `wrangler` when no Cloudflare creds present.

## 5. Required secrets referenced by workflows (names only — values NOT recorded)

```
CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
NEXT_PUBLIC_SUPABASE_URL_STAGING, NEXT_PUBLIC_SUPABASE_URL_PRODUCTION
NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING, NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION
SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY, ANTHROPIC_API_KEY
CRON_SECRET
PILOT_SMOKE_*  (BEARER/EMAIL/PASSWORD/PROJECT_ID × PRODUCTION/STAGING)
PILOT_E2E_BASE_URL, PILOT_E2E_EMAIL, PILOT_E2E_PASSWORD, PILOT_E2E_PROJECT_ID
STAKEHOLDER_SMOKE_EMAIL, STAKEHOLDER_SMOKE_PASSWORD
```

> These are **GitHub Actions secrets** — managed in the repo settings, not in the working tree. This audit cannot read their values and does not need to.

## 6. Local env-file references (presence only)

Present (gitignored, values not read): `.env.local`, `.env.pilot`, `.env.locales`.
Templates (committed, safe): `.env.example`, `.env.local.example`, `.env.e2e.example`, `.env.pilot.example`, `.dev.vars.example`.
Documented in `docs/ENVIRONMENT-VARIABLES.md`. Required for web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.

## 7. Access summary

| Capability | Locally now | Notes |
|---|---|---|
| Web validate (lint/type/test/cf:build) | YES | Needs `NEXT_PUBLIC_*` for cf:build. |
| Supabase migration list/diff via CLI | NO | CLI missing; use MCP or install CLI. |
| Cloudflare deploy via wrangler | NO (assumed) | No Cloudflare creds assumed; deploy belongs to CI chain. |
| Production deploy | OPERATOR/CI only | Never local wrangler without creds + approval. |
| Reading GH Actions secret values | NO | By design. |

## 8. What requires operator action

1. Install Supabase CLI **or** confirm MCP-only migration workflow for DB ops.
2. Confirm GitHub Actions secrets above are all set (owner can verify in repo settings).
3. Any production deploy or DB migration apply requires explicit owner approval and goes through the CI chain — not part of this setup.
