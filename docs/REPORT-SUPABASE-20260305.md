# Supabase: PROD + STAGING (Phase 5)

**Date:** 2026-03-05  
**Purpose:** Two environments; env vars and Auth redirect URLs; health check behavior.

---

## 1. Projects

- **Preferred:** Two Supabase projects (prod and staging). Separate data and Auth config.
- **If only one project:** Document as temporary; use schema/namespace isolation and list risks. Plan second project for staging.

---

## 2. Env vars (names only; values present/missing per env)

**Cloudflare PROD Worker (aistroyka-web-production):**

| Variable | Scope | Required | Notes |
|----------|--------|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | build/runtime | Yes | Prod project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | build/runtime | Yes | Prod anon key |
| SUPABASE_SERVICE_ROLE_KEY | server only | Yes | Never expose to client |
| NEXT_PUBLIC_APP_URL | build/runtime | Yes | https://aistroyka.ai |
| NEXT_PUBLIC_APP_ENV | build | Yes | production |
| NEXT_PUBLIC_BUILD_SHA, NEXT_PUBLIC_BUILD_TIME | build | Optional | From CI |
| OPENAI_API_KEY | server only | If using AI | |
| AI_ANALYSIS_URL | server only | Optional | In-app or external |

**Cloudflare STAGING Worker (aistroyka-web-staging):**

- Same variable **names**, **staging** values.
- NEXT_PUBLIC_APP_URL = https://staging.aistroyka.ai
- NEXT_PUBLIC_APP_ENV = staging
- NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY = staging project.

---

## 3. Auth redirect URLs (Supabase Dashboard)

In each Supabase project → **Authentication** → **URL Configuration** → **Redirect URLs**:

**Prod project:**

- https://aistroyka.ai/**
- https://www.aistroyka.ai/** (if auth callbacks can land on www before redirect)

**Staging project:**

- https://staging.aistroyka.ai/**

OAuth providers (Google, etc.): ensure callback URLs in the provider console include the above per environment (prod vs staging project).

---

## 4. Health check and env

- **Endpoint:** GET /api/v1/health (and GET /api/health with Link to v1).
- **Behavior:** Returns JSON: `ok`, `db`, `aiConfigured`, `openaiConfigured`, `supabaseReachable`, `serviceRoleConfigured`, optional `env` (value of NEXT_PUBLIC_APP_ENV), `buildStamp`, optional `reason`/`message`. No secrets; only booleans and env name.
- **Supabase check:** Uses anon client to `tenants` select limit 1; on missing env returns 503 and `reason: "missing_supabase_env"`. Safe for prod/staging to distinguish by `env` in response.

---

## 5. DB and migrations

- Migrations in repo: apply to **staging** first (e.g. via CI or runbook); then to **prod** via release process.
- RLS: prod must not be “open”; staging may be looser only if intentional and documented.

---

## 6. Scripts (repo)

- `apps/web/scripts/set-cf-secrets.sh` — reads .env.production / .env.staging and sets Worker secrets (VAR_NAMES only in docs; do not log values).
- `apps/web/scripts/set-supabase-auth-urls.mjs` — if present, can automate redirect URL list; otherwise configure manually in Dashboard.
