# Environment matrix (vars, scope, required)

**Date:** 2026-03-05  
**Purpose:** Variable names, scope, required flag, and prod/staging presence (no values).

---

## PROD (aistroyka-web-production)

| Variable | Scope | Required | Prod |
|----------|--------|----------|------|
| NEXT_PUBLIC_APP_ENV | build | Yes | production |
| NEXT_PUBLIC_APP_URL | build/runtime | Yes | https://aistroyka.ai |
| NEXT_PUBLIC_SUPABASE_URL | build/runtime | Yes | present/missing |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | build/runtime | Yes | present/missing |
| SUPABASE_SERVICE_ROLE_KEY | server only | Yes | present/missing |
| NEXT_PUBLIC_BUILD_SHA | build | Optional | set in CI |
| NEXT_PUBLIC_BUILD_TIME | build | Optional | set in CI |
| OPENAI_API_KEY | server only | If AI used | present/missing |
| AI_ANALYSIS_URL | server only | Optional | present/missing |
| FCM_* (push) | server only | If push used | present/missing |
| STRIPE_* | server only | If billing | present/missing |

---

## STAGING (aistroyka-web-staging)

| Variable | Scope | Required | Staging |
|----------|--------|----------|---------|
| NEXT_PUBLIC_APP_ENV | build | Yes | staging |
| NEXT_PUBLIC_APP_URL | build/runtime | Yes | https://staging.aistroyka.ai |
| NEXT_PUBLIC_SUPABASE_URL | build/runtime | Yes | present/missing (staging project) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | build/runtime | Yes | present/missing |
| SUPABASE_SERVICE_ROLE_KEY | server only | Yes | present/missing |
| (others as above) | | | staging values |

---

## Scope

- **build:** Injected at build time; NEXT_PUBLIC_* baked into client bundle.
- **runtime:** Available in Worker at runtime (Dashboard vars/secrets).
- **server only:** Never expose to client; use only in API routes/server code.
