# Inventory: Cloudflare PROD, DNS, Vercel, Supabase

**Date:** 2026-03-05  
**Purpose:** Phase 0 — current state (no changes). PROD hosting = Cloudflare (OpenNext/Workers).

---

## 1. Cloudflare setup (from repo)

### Workers (wrangler.toml)

| Env         | Worker name               | Main / assets                    |
|------------|---------------------------|----------------------------------|
| default    | aistroyka-web-dev         | .open-next/worker.js, .open-next/assets |
| env.dev    | aistroyka-web-dev         | same                            |
| env.staging| aistroyka-web-staging     | same                            |
| env.production | aistroyka-web-production | same                            |

- **Routes:** Managed manually in Cloudflare Dashboard (wrangler comments: pattern aistroyka.ai, www.aistroyka.ai, zone aistroyka.ai).
- **Build (from docs):** Install from repo root: `bun install --frozen-lockfile`. Build: `bun run cf:build`. Root directory: empty (root `/`).
- **Env vars (names only):** NEXT_PUBLIC_APP_ENV, NEXT_PUBLIC_BUILD_SHA, NEXT_PUBLIC_BUILD_TIME, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, SUPABASE_SERVICE_ROLE_KEY. Status: set in CI (stamp + APP_ENV); secrets via Dashboard or `scripts/set-cf-secrets.sh` (present/missing per env).

### Pages vs Workers

- App is deployed as **Workers** (wrangler.toml, main = .open-next/worker.js). Not Pages.
- Custom domains (aistroyka.ai, www, staging) are attached to Workers in Dashboard.

---

## 2. DNS (zone aistroyka.ai)

**Source:** Script `apps/web/scripts/cf-dns-setup-aistroyka.mjs` and docs. **Current live state must be read in Cloudflare Dashboard → DNS.**

- **Apex (@):** Script creates A @ → 192.0.2.1 (proxied, TTL 1) if missing. Production should point to Workers (often via CNAME flattening or A to Cloudflare).
- **www:** Script creates CNAME www → aistroyka.ai (proxied). Canonical policy: www → 301 to apex (via Redirect Rules, not DNS only).
- **staging:** Script creates CNAME staging → STAGING_CNAME_TARGET if set; otherwise “add custom domain staging.aistroyka.ai in Dashboard”.
- **Proxy:** Proxied (orange) for Cloudflare to serve traffic.
- **Rollback:** Document current records (type, name, content, proxy, TTL) before changes; revert in Dashboard if needed.

---

## 3. Vercel

- **Rule:** PROD domain (aistroyka.ai, www) must not be owned by Vercel. Cloudflare is the only owner for PROD.
- **Check in Vercel Dashboard:** Projects → each project → Settings → Domains. If aistroyka.ai or www.aistroyka.ai is added → remove them.
- **Allowed:** Preview or marketing on other hostnames (e.g. marketing.aistroyka.ai) if needed; not apex/www.
- **DNS:** Vercel must not add/verify records for apex/www to avoid conflicts.

---

## 4. Supabase

### Projects

- **Preferred:** Two projects (prod + staging). If only one exists, create staging or document single-project isolation and risks.
- **URLs:** Prod: https://&lt;project-ref&gt;.supabase.co; Staging: https://&lt;staging-ref&gt;.supabase.co.

### Env vars (names only; values present/missing in respective env)

**PROD (Cloudflare Worker production):**

- NEXT_PUBLIC_SUPABASE_URL — required  
- NEXT_PUBLIC_SUPABASE_ANON_KEY — required  
- NEXT_PUBLIC_APP_URL — required (e.g. https://aistroyka.ai)  
- SUPABASE_SERVICE_ROLE_KEY — server-only, required for admin  
- NEXT_PUBLIC_APP_ENV=production — set in CI  
- NEXT_PUBLIC_BUILD_SHA, NEXT_PUBLIC_BUILD_TIME — set in CI  
- OPENAI_API_KEY, AI_ANALYSIS_URL — if used

**STAGING:**

- Same names, staging values; NEXT_PUBLIC_APP_ENV=staging; NEXT_PUBLIC_APP_URL=https://staging.aistroyka.ai.

### Auth redirect URLs (to be set in Supabase Dashboard)

- **Prod:** https://aistroyka.ai/** and optionally https://www.aistroyka.ai/**  
- **Staging:** https://staging.aistroyka.ai/**  
- OAuth callbacks must include the above per environment.

---

## 5. Repo build pipeline

- **Root:** `bun install --frozen-lockfile`, `bun run cf:build` (cf:build = build:contracts then apps/web cf:build).
- **apps/web cf:build:** Next (standalone) + fix-standalone symlink + opennextjs-cloudflare build --skipNextBuild.
- **Internal package:** @aistroyka/contracts built to dist; main/types/exports point to dist; build:contracts runs first.
- **CI:** GitHub Actions run from repo root; no `npm install` in apps/web; single install at root.

---

## 6. Known issues (from prior work)

- **OpenNext styled-jsx:** cf:build can fail at “Bundling the OpenNext server” with “Could not resolve ./dist/index” for styled-jsx. This is an OpenNext/Next 15 compatibility issue, not contracts. To be addressed in Phase 1.
- **Dashboard build command:** Must be set manually to `bun run cf:build` and root empty (see CLOUDFLARE-DASHBOARD-FIX-BUILD-20260305.md).

---

*Inventory complete. No changes made. Proceed to Phase 1 (build invariants + green cf:build).*
