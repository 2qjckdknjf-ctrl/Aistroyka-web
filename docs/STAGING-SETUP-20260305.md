# Staging environment setup

**Date:** 2026-03-05

---

## Branch and deploy

- **Branch:** `develop` (push triggers deploy-cloudflare-staging.yml).
- **Worker:** aistroyka-web-staging.
- **Build:** Same as production (`bun install --frozen-lockfile`, `bun run cf:build` from root). CI sets `NEXT_PUBLIC_APP_ENV=staging`.

---

## Custom domain (staging.aistroyka.ai)

1. In Cloudflare Dashboard → **Workers & Pages** → **aistroyka-web-staging** → **Settings** → **Domains & routes** (or **Triggers**), add custom domain **staging.aistroyka.ai**.
2. In **DNS** for zone aistroyka.ai, add:
   - **Type:** CNAME  
   - **Name:** staging  
   - **Target:** (value provided by Cloudflare when you add the custom domain to the Worker, e.g. aistroyka-web-staging.workers.dev or the assigned hostname)  
   - **Proxy:** Proxied (orange) or DNS only as needed; SSL Full (strict) recommended.
3. Ensure no other Worker or Page uses the same route for staging.aistroyka.ai.

---

## Environment variables (staging Worker)

Set in **Workers & Pages → aistroyka-web-staging → Settings → Variables and secrets**.

**Build-time (if using Cloudflare Build UI):**  
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL (e.g. https://staging.aistroyka.ai), NEXT_PUBLIC_APP_ENV=staging.  
When using GitHub Actions, these are set in the workflow; ensure Dashboard Build env for staging does not override with production values.

**Runtime (secrets):**  
Use **staging** Supabase (and other services) keys only. Do not reuse production SUPABASE_SERVICE_ROLE_KEY or Stripe keys.

---

## Verification

- **workers.dev:** After deploy, open the staging workers.dev URL from the deploy log; login and dashboard should load.
- **staging.aistroyka.ai:** After DNS and custom domain are set, open https://staging.aistroyka.ai and check health: GET https://staging.aistroyka.ai/api/v1/health → `env: "staging"` in JSON.
- Run: `bun run smoke:staging` (or `npm run smoke:staging`) from apps/web.
