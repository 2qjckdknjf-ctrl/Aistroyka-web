# Phase 3 / A4 — Env / config inventory — AISTROYKA

**Date:** 2026-03-19  
**Scope:** Web deploy (staging/prod), migrations, pilot smoke, runtime env.  
**Gate script:** `scripts/release/check-env-config.sh` (modes: deploy-staging, deploy-production, migrations, pilot-smoke).

---

## 1. Staging deploy

| Variable/secret | Scope | Used by | Required? | Where it lives | Repo-only validation |
|-----------------|--------|---------|-----------|----------------|----------------------|
| `CLOUDFLARE_API_TOKEN` | CI secret | deploy job → wrangler | Yes | GitHub repository secret | **Yes** — script checks presence |
| `CLOUDFLARE_ACCOUNT_ID` | CI secret | deploy job → wrangler | Yes | GitHub repository secret | **Yes** — script checks presence |
| `NEXT_PUBLIC_SUPABASE_URL` | Runtime/public | Worker env.staging | Yes (app) | Cloudflare Worker vars | No — external |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Runtime/public | Auth, API | Yes | Cloudflare Worker secret/vars | No — external |
| `NEXT_PUBLIC_APP_URL` | Runtime/public | Links, callbacks | Yes | Cloudflare Worker vars | No — external |
| `PILOT_SMOKE_BEARER_STAGING` | CI secret | pilot-smoke job | Yes | GitHub repository secret | No — verified by pilot-smoke job step |

---

## 2. Production deploy

| Variable/secret | Scope | Used by | Required? | Where it lives | Repo-only validation |
|-----------------|--------|---------|-----------|----------------|----------------------|
| `CLOUDFLARE_API_TOKEN` | CI secret | deploy job → wrangler | Yes | GitHub repository secret | **Yes** — script checks presence |
| `CLOUDFLARE_ACCOUNT_ID` | CI secret | deploy job → wrangler | Yes | GitHub repository secret | **Yes** — script checks presence |
| `NEXT_PUBLIC_SUPABASE_URL` | Runtime/public | Worker env.production vars | Yes | wrangler.deploy.toml + CF | Partially — key in repo |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Runtime/public | Auth, health | Yes | Cloudflare Worker secret | No — external |
| `NEXT_PUBLIC_APP_URL` | Runtime/public | URLs, health | Yes | wrangler.deploy.toml + CF | Partially — key in repo |
| `REQUIRE_CRON_SECRET` | Runtime | Cron protection | Recommended true | Cloudflare Worker env | No — documented only |
| `CRON_SECRET` | Secret | Cron auth | When REQUIRE_CRON_SECRET=true | Cloudflare Worker secret | No — external |
| `PILOT_SMOKE_BEARER_PRODUCTION` | CI secret | pilot-smoke job | Yes | GitHub repository secret | No — verified by pilot-smoke job step |

---

## 3. Migration apply

| Variable/secret | Scope | Used by | Required? | Where it lives | Repo-only validation |
|-----------------|--------|---------|-----------|----------------|----------------------|
| `SUPABASE_ACCESS_TOKEN` | CI secret | Supabase CLI auth | Yes | GitHub repo or environment secret | **Yes** — script checks presence |
| `SUPABASE_PROJECT_REF` | CI secret | supabase link / db push | Yes | GitHub environment secret (staging/production) or repo | **Yes** — script checks presence |

---

## 4. Pilot smoke

| Variable/secret | Scope | Used by | Required? | Where it lives | Repo-only validation |
|-----------------|--------|---------|-----------|----------------|----------------------|
| `pilot_smoke_bearer` (input secret) | CI secret | Authorization header | Yes | Passed from caller (PILOT_SMOKE_BEARER_*) | No — verified in workflow step |
| `cron_secret` (input secret) | CI secret | x-cron-secret (optional) | When app requires | Passed from caller | No |
| `BASE_URL` (input) | Workflow input | Target URL for smoke | Yes | Hard-coded in deploy workflows | **Yes** — script validates format when set |

---

## 5. App runtime / build-time public vars

| Variable | Category | Required? | Where | Repo-only validation |
|----------|----------|----------|-------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | required_web | Yes | Cloudflare/Vercel env | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required_web | Yes | Cloudflare/Vercel secret | No |
| `NEXT_PUBLIC_APP_URL` | required_web | Yes | Cloudflare/Vercel env | No |
| `NODE_ENV` | required_web | Yes | Runtime | No |
| `SUPABASE_SERVICE_ROLE_KEY` | required_jobs | Yes (admin/cron) | Secret store | No |
| `REQUIRE_CRON_SECRET` / `CRON_SECRET` | required_jobs | Conditional | Cloudflare env | No |
| AI / billing / push vars | optional per feature | Optional | Secret stores | No — see ENVIRONMENT-VARIABLES.md |

Source of truth: `docs/ENVIRONMENT-VARIABLES.md`, `apps/web/lib/config/release-env.ts`, `scripts/validate-release-env.mjs`.

---

## 6. What repo-only validation can prove

- **Deploy (staging/production):** Script fails fast if `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` is not set in the job env (injected from GitHub secrets by the workflow).
- **Migrations:** Script fails fast if `SUPABASE_ACCESS_TOKEN` or `SUPABASE_PROJECT_REF` is not set in the job env.
- **Pilot-smoke:** Script validates `BASE_URL` format (http(s)://) when provided; workflow always passes `base_url` from caller. Bearer secret presence is verified by a separate workflow step, not by this script.
- **External:** Real secret values, Cloudflare Worker vars/secrets, and GitHub secret configuration cannot be fully verified from repo context.

---

## 7. Biggest config risk

**Production Worker missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`.**  
It is not stored in repo (correct); it must be set in Cloudflare Dashboard for the production Worker. If missing, health returns 503, auth fails, and the site appears broken. The deploy and patch steps can still succeed, so the gate cannot detect this from CI alone. **Mitigation:** Operator checklist and post-deploy smoke (health/config endpoints); document in runbook that ANON_KEY must be set in Cloudflare before or right after first production deploy.
