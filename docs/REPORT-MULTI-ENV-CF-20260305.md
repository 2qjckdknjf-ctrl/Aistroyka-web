# Enterprise multi-env on Cloudflare (Phase 4)

**Date:** 2026-03-05  
**Purpose:** PROD and STAGING as separate Workers; same repo and build; staging.aistroyka.ai for STAGING.

---

## 1. Chosen approach: same repo, separate Workers (wrangler envs)

- **Option B (in-repo):** One Cloudflare Workers “project” (one wrangler.toml), two Worker names: `aistroyka-web-production`, `aistroyka-web-staging`. Branch-based deploys: main → production, staging → staging.
- **Option A (separate Pages/Workers project)** was not chosen: same codebase and build artifact are reused; only env vars and routes/domains differ.

---

## 2. Git branches and deploys

| Branch   | Deploy target   | Worker name               | Domain              |
|----------|-----------------|---------------------------|---------------------|
| main     | PROD            | aistroyka-web-production  | aistroyka.ai, www   |
| staging  | STAGING         | aistroyka-web-staging     | staging.aistroyka.ai |

- **main:** CI runs `bun run cf:build` then `wrangler deploy --env production` (from apps/web). Custom domains aistroyka.ai and www attached in Dashboard to this Worker.
- **staging:** CI runs same build then `wrangler deploy --env staging`. Custom domain staging.aistroyka.ai attached to aistroyka-web-staging.

---

## 3. Build (identical for both)

- **Install:** `bun install --frozen-lockfile` (root).
- **Build:** `bun run cf:build` (root). Single artifact: `.open-next/worker.js` + `.open-next/assets`.
- **Deploy:** From apps/web: `npx wrangler deploy --env production` or `--env staging`. Same artifact; different Worker name and env vars.

---

## 4. Environment variables per Worker

Set in Cloudflare Dashboard per Worker (Variables and Secrets):

**PROD (aistroyka-web-production):**

- NEXT_PUBLIC_APP_ENV = production
- NEXT_PUBLIC_APP_URL = https://aistroyka.ai
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (prod project)
- SUPABASE_SERVICE_ROLE_KEY (prod)
- (+ BUILD_SHA/BUILD_TIME in CI; OPENAI, FCM, etc. as needed)

**STAGING (aistroyka-web-staging):**

- NEXT_PUBLIC_APP_ENV = staging
- NEXT_PUBLIC_APP_URL = https://staging.aistroyka.ai
- Same var names, staging Supabase (and other) values.

---

## 5. Domains in Dashboard

- **aistroyka-web-production:** Add custom domains `aistroyka.ai`, `www.aistroyka.ai` (Dashboard → Worker → Settings → Domains). www → 301 to apex via Redirect Rules (see REPORT-DNS-DOMAINS).
- **aistroyka-web-staging:** Add custom domain `staging.aistroyka.ai`.

---

## 6. Validation

- **Staging:** Open https://staging.aistroyka.ai → app loads. Call https://staging.aistroyka.ai/api/v1/health → JSON with `env: "staging"` (if NEXT_PUBLIC_APP_ENV is exposed there).
- **Prod:** https://aistroyka.ai and https://www.aistroyka.ai (redirect to apex) → app loads; /api/v1/health returns env=production.

---

## 7. CI workflows

- Repo workflows (e.g. deploy-cloudflare-prod.yml, deploy-cloudflare-staging.yml) trigger on push to main / staging; each sets NEXT_PUBLIC_APP_ENV and deploys the corresponding env. See docs/RELEASE-FLOW-* for full flow.
