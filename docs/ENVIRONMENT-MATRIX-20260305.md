# Environment variables matrix

**Date:** 2026-03-05  
**Scope:** apps/web (Next.js + OpenNext Cloudflare). Values are **not** listed; only presence and scope.

---

## Build-time (NEXT_PUBLIC_*)

Set in Cloudflare Build environment or in CI before `bun run cf:build`. Inlined into client bundle.

| Variable | Scope | Required | Production | Staging | Notes |
|----------|--------|----------|------------|---------|--------|
| NEXT_PUBLIC_SUPABASE_URL | public | yes | ✓ | ✓ | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | public | yes | ✓ | ✓ | Anon key (safe for client) |
| NEXT_PUBLIC_APP_URL | public | no | ✓ | ✓ | Canonical app URL (e.g. https://aistroyka.ai) |
| NEXT_PUBLIC_BUILD_SHA | public | no | ✓ (CI) | ✓ (CI) | Git SHA for build stamp |
| NEXT_PUBLIC_BUILD_TIME | public | no | ✓ (CI) | ✓ (CI) | Build timestamp |
| NEXT_PUBLIC_APP_ENV | public | no | ✓=production | ✓=staging | For UI/env banner and health |

---

## Runtime (server / Worker secrets)

Set in Cloudflare Worker → Settings → Variables and secrets. Not in repo.

| Variable | Scope | Required | Production | Staging | Notes |
|----------|--------|----------|------------|---------|--------|
| SUPABASE_SERVICE_ROLE_KEY | server | recommended | ✓ | ✓ | Server-side Supabase; use staging key for staging Worker |
| OPENAI_API_KEY | server | no | optional | optional | Vision/LLM |
| OPENAI_VISION_MODEL | server | no | optional | optional | e.g. gpt-4o |
| AI_ANALYSIS_URL | server | no | optional | optional | External AI job URL |
| STRIPE_SECRET_KEY | server | no | ✓ (prod) | optional | Billing |
| STRIPE_WEBHOOK_SECRET | server | no | ✓ (prod) | optional | Webhook signing |
| CRON_SECRET | server | no | optional | optional | Cron auth |
| FCM_* / APNS_* | server | no | optional | optional | Push notifications |
| DEBUG_AUTH / DEBUG_DIAG | server | no | never prod | optional | Diag routes |
| ENABLE_DIAG_ROUTES | server | no | never prod | optional | |

---

## Rules

- **Production secrets** must not be used in the staging Worker.
- **Staging secrets** (e.g. separate Supabase project or keys) must not be used in the production Worker.
- Set **NEXT_PUBLIC_APP_URL** per environment (production: https://aistroyka.ai; staging: https://staging.aistroyka.ai or workers.dev URL).
- **NEXT_PUBLIC_APP_ENV** is set in GitHub Actions (production vs staging); if building from Cloudflare UI, set it in Build env.
