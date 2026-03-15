# Production runtime incident triage

**Date:** 2026-03-15  
**Status:** All production URLs return 500.  
**Broken ref:** 419bcdd9 (main). Known good (brand): ed3e6b59.

## 1. Exact failing URLs

| URL | Result |
|-----|--------|
| https://aistroyka.ai/ | 500 Internal Server Error |
| https://aistroyka.ai/api/health | 500 Internal Server Error |
| https://aistroyka.ai/api/v1/health | 500 Internal Server Error |

All three return HTTP 500 with body "Internal Server Error" (generic).

## 2. workers.dev

Production worker name: `aistroyka-web-production`.  
workers.dev URL format: `https://aistroyka-web-production.<account>.workers.dev`.  
Live check: not performed (URL requires account subdomain). If both workers.dev and custom domain return 500, issue is runtime/bootstrap, not domain or cache.

## 3. Runtime error (to be captured)

- **Source:** Run `npx wrangler tail --env production` from `apps/web` with valid Cloudflare API token, then request the URLs above. First exception in logs = root cause.
- **If tail unavailable:** Root cause inferred from codebase and deploy flow (see PROD_RUNTIME_ROOT_CAUSE_ANALYSIS.md).

## 4. First failing file/module (hypothesis until logs confirm)

- **Likely:** Worker bootstrap / request dispatch — dynamic `require` of `middleware-manifest.json` or similar in the deployed bundle (OpenNext/Cloudflare Workers).
- **Alternative:** Missing Worker env vars causing throw before route (e.g. in config/middleware) — less likely because health handler returns 503 on missing Supabase env, not 500.

## 5. Reproduces on workers.dev vs custom domain

- Custom domain (aistroyka.ai): 500 on /, /api/health, /api/v1/health.
- workers.dev: to be verified; if both fail, issue is runtime/bootstrap, not domain/cache.

## 6. Deploy context

- Build: Next + OpenNext + patch-worker-bypass-api-middleware + patch-server-handler-require-middleware-manifest.
- Deploy: `wrangler deploy --dry-run --outdir .open-next/deploy` → `node scripts/patch-bundle-require.cjs` → verify stub in bundle → `wrangler deploy --env production --no-bundle --config wrangler.deploy.toml`.
- Production main: `.open-next/deploy/worker-bootstrap.js` (patched). Production vars in wrangler: `NEXT_PUBLIC_SUPABASE_URL` only; `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_APP_URL` must be set in Dashboard/secrets.
