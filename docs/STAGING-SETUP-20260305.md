# Staging environment setup

**Date:** 2026-03-05

---

## One-shot setup (from repo root or apps/web)

```bash
cd apps/web && bun run setup-staging
```

This script: creates branch `develop` if missing, runs DNS setup (if `CLOUDFLARE_API_TOKEN` set), uploads secrets to Worker from `.env.staging` if present. Then push: `git push -u origin develop`. See **docs/CLOUDFLARE-BUILD-CANONICAL.md** for Cloudflare Build commands.

---

## Branch and deploy

- **Branch:** `develop` (push triggers deploy-cloudflare-staging.yml).
- **Worker:** aistroyka-web-staging.
- **Build:** Same as production (`bun install --frozen-lockfile`, `bun run cf:build` from root). CI sets `NEXT_PUBLIC_APP_ENV=staging`.

---

## Custom domain (staging.aistroyka.ai)

1. In Cloudflare Dashboard → **Workers & Pages** → **aistroyka-web-staging** → **Settings** → **Domains & routes** (or **Triggers**), add custom domain **staging.aistroyka.ai** (Cloudflare may create the DNS record for you).
2. **Or** create CNAME via API: from apps/web run `CLOUDFLARE_API_TOKEN=… STAGING_CNAME_TARGET=<target> node scripts/cf-dns-setup-aistroyka.mjs` (use the target shown when adding the custom domain in the Worker).
3. **Or** in **DNS** for zone aistroyka.ai add manually: Type CNAME, Name staging, Target (from step 1), Proxy on; SSL Full (strict).
4. Ensure no other Worker or Page uses the same route for staging.aistroyka.ai.

---

## Environment variables (staging Worker)

**Option A — script:** Create `.env.staging` (or `.env.staging.local`) from `.env.staging.example` with staging values, then run `./scripts/set-cf-secrets.sh staging` from apps/web. This uploads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, SUPABASE_SERVICE_ROLE_KEY to Worker aistroyka-web-staging.

**Option B — Dashboard:** Set in **Workers & Pages → aistroyka-web-staging → Settings → Variables and secrets**.

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
