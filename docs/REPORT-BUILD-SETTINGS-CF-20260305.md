# Cloudflare build settings (Phase 2)

**Date:** 2026-03-05  
**Purpose:** Canonical build configuration for Workers (PROD/STAGING). Apply in Cloudflare Dashboard — plugin is read-only.

---

## 1. Build configuration (Dashboard)

Configure **Workers & Pages** → **aistroyka-web-production** (and staging Worker if separate) → **Settings** → **Build**.

| Setting | Value | Notes |
|--------|--------|--------|
| **Root directory** | `/` (or empty = repo root) | Build from monorepo root. |
| **Install command** | `bun install --frozen-lockfile` | Single install from root; no install in apps/web. |
| **Build command** | `bun run cf:build` | Runs build:contracts → apps/web cf:build (Next standalone + fix-standalone + ensure-styled-jsx-dist + opennextjs-cloudflare build). |
| **Output directory** | (Workers: not used; Worker entry = .open-next/worker.js) | For Pages-style assets: `.open-next/assets` if ever needed. |

---

## 2. Environment variables (names only)

Set in Dashboard → Worker → **Settings** → **Variables and Secrets** (or in Build env for build-time only).

**Build-time (recommended for NEXT_PUBLIC_*):**

- `NEXT_PUBLIC_APP_ENV` = `production` (PROD) or `staging` (STAGING)
- `WRANGLER_BUILD_PLATFORM` = `node` (if required by OpenNext)
- `WRANGLER_BUILD_CONDITIONS` = `` (empty string) if needed to avoid wrong conditions
- `NEXT_PUBLIC_BUILD_SHA` — set in CI (e.g. `github.sha`)
- `NEXT_PUBLIC_BUILD_TIME` — set in CI
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` — e.g. `https://aistroyka.ai` (PROD) or `https://staging.aistroyka.ai` (STAGING)

**Runtime / secrets (never in client):**

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (if used)
- Other server-only vars per project (FCM, Stripe, etc.)

Status: **present** / **missing** per env in Dashboard; do not log values.

---

## 3. What changed (from previous state)

- **Before:** Build command often `bun run build` or `cd apps/web && npm install && bun run build` → Next-only or wrong cwd; zod / styled-jsx issues.
- **After:** Install from root; Build = `bun run cf:build`; Root = repo root. OpenNext produces `.open-next/worker.js`; styled-jsx fix via `ensure-styled-jsx-dist.cjs`.

---

## 4. Cache and redeploy

- **Clear build cache:** Dashboard → Builds → clear cache (if available), then trigger redeploy.
- **Redeploy:** Push to main (PROD) or staging (STAGING), or use **Retry** on last build.

---

## 5. Verification

- Build logs show: `bun install --frozen-lockfile`, then `bun run cf:build`, then OpenNext “Worker saved in .open-next/worker.js”.
- No `npm install` in apps/web; no “Could not resolve” for styled-jsx or zod.
