# Environment & deployment audit

**Date:** 2026-03-05  
**Purpose:** Fix current state before enterprise multi-env rollout.

---

## 1. Repository

### 1.1 Root `package.json`

| Item | Value |
|------|--------|
| `name` | AISTROYKA-WEB-CF-CHECK |
| `packageManager` | bun@1.2.15 |
| `workspaces` | apps/web, packages/contracts, packages/contracts-openapi, packages/api-client |
| `build` | cd apps/web && bun run build |
| `cf:build` | cd apps/web && bun run cf:build |
| `cf:deploy` | cd apps/web && bun run cf:deploy |

- Single package manager: **bun**.
- Root has no `prepare` / husky.

### 1.2 `apps/web/package.json`

| Item | Value |
|------|--------|
| `build` | next build |
| `prebuild` | npm install --prefix ../../packages/contracts |
| `cf:build` | opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion |
| `cf:deploy` | wrangler deploy |
| `cf:deploy:staging` | wrangler deploy --env staging |
| `cf:deploy:prod` | wrangler deploy --env production |
| `prepare` | husky |
| `deploy` / `deploy:staging` / `deploy:prod` | npm run cf:build && … |

**Issues:**

- **Mixed package manager in pipeline:** `prebuild` runs `npm install` in packages/contracts. CI/Cloudflare may run `bun install` at root then `bun run build`; build script runs `next build` (no cf:build at root build). So Cloudflare “user build command” that uses `cd apps/web && npm install && bun run build` introduces **npm** and diverges from repo standard (bun only).
- **Husky:** `prepare` runs husky; in CI without `.git` this can log “.git can't be found” but does not fail the build.

### 1.3 `packages/contracts/package.json`

- `dependencies`: zod ^3.23.8.
- `main` / `types`: src/index.ts (source).

### 1.4 Wrangler

- **apps/web/wrangler.toml** (used by CI): no `account_id` in file (CI passes CLOUDFLARE_ACCOUNT_ID).
- Envs: **dev** (default), **staging**, **production**.
- Worker names: aistroyka-web-dev, aistroyka-web-staging, aistroyka-web-production.
- Production routes for aistroyka.ai / www.aistroyka.ai are commented; “Routes are managed manually in Cloudflare Dashboard”.
- **Root wrangler.toml**: has account_id, env.production (workers_dev = false), env.staging (workers_dev = true). Root wrangler is not used by current GitHub Actions (workflows use apps/web).

### 1.5 Next.js / OpenNext

- **next.config.js:** transpilePackages [@aistroyka/contracts], webpack alias for zod (require.resolve from __dirname). OpenNext init in try/catch.
- **Build:** Must run from apps/web so `@/` and next config apply. Root `bun run build` runs `next build` in apps/web (not OpenNext). Root `bun run cf:build` runs OpenNext in apps/web.
- No open-next.config.ts in apps/web (mentioned in PROD_RESTORE_REPORT as empty in root).

### 1.6 Lockfiles

- Root: **bun.lock** (bun workspaces).
- apps/web: **package-lock.json** (npm) and **bun.lock** (bun). Dual lockfiles present; CI uses root `bun install --frozen-lockfile` only.

### 1.7 Deploy scripts

- **scripts/set-cf-secrets.sh:** Reads .env.production(.local), uploads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, SUPABASE_SERVICE_ROLE_KEY via `wrangler secret put`. Arg: dev | staging | production.
- **scripts/cf-fix-domain-aistroyka.mjs**, **cf-dns-setup-aistroyka.mjs:** Domain/route helpers.

---

## 2. Cloudflare (from repo and docs)

- **Deploy target:** Workers (OpenNext output: .open-next/worker.js + assets).
- **Workers:** aistroyka-web-production (production), aistroyka-web-staging (staging), aistroyka-web-dev (dev).
- **Production:** workers_dev = false; custom domains only (aistroyka.ai, www.aistroyka.ai) — routes set in Dashboard.
- **Staging:** workers_dev = true (workers.dev URL).
- **Build/install:** If using Cloudflare Pages/Workers Builds, user-configured build command seen in logs was `cd apps/web && npm install && bun run build` — mixes npm and bun and differs from GitHub Actions (bun only + cf:build).
- **Root directory:** If build runs from repo root, root directory is empty or “.”; build command then must `cd apps/web` and run the right script.

---

## 3. DNS (from docs and wrangler comments)

- **aistroyka.ai / www.aistroyka.ai:** Assigned to aistroyka-web-production via Dashboard routes (not in wrangler.toml).
- **staging.aistroyka.ai:** Not present in wrangler; no CNAME in repo. Staging currently uses workers.dev only.
- **SSL/TLS:** Assumed Full (strict) for custom domains; not specified in repo.

---

## 4. Runtime

- **Health:** GET /api/health, GET /api/v1/health; use getHealthResponse() (db, aiConfigured, openaiConfigured, supabaseReachable, serviceRoleConfigured, buildStamp).
- **Build stamp:** NEXT_PUBLIC_BUILD_SHA, NEXT_PUBLIC_BUILD_TIME (set in CI); getBuildStamp() in config; BuildStamp component shows sha7 + time.
- **Env:** Centralized in lib/config (public.ts, server.ts, debug.ts). No NEXT_PUBLIC_APP_ENV yet; NEXT_PUBLIC_VERCEL_ENV / NEXT_PUBLIC_ENV used in some components for “staging” detection.

---

## 5. Branch strategy

| Branch | Workflow | Deploy target |
|--------|----------|----------------|
| **main** | deploy-cloudflare-prod.yml | Production (aistroyka-web-production) |
| **develop** | deploy-cloudflare-staging.yml | Staging (aistroyka-web-staging) |

- **develop** may not exist locally (only main and feature branches observed); remote may have it or it is created when needed.
- No branch named **staging**; staging deploy is tied to **develop**.

---

## 6. Summary of issues

1. **Build pipeline split:** Cloudflare build command in logs used `cd apps/web && npm install && bun run build` (next build only, npm install). GitHub Actions use `bun install --frozen-lockfile` (root) and `bun run cf:build` (OpenNext). Need single canonical: install from root with bun, build from root that runs OpenNext in apps/web.
2. **prebuild uses npm:** apps/web prebuild runs `npm install --prefix ../../packages/contracts`. Should use bun for consistency or be redundant if root install already installs workspace deps.
3. **Staging domain:** staging.aistroyka.ai not configured; staging only on workers.dev.
4. **Env separation:** set-cf-secrets reads .env.production for all envs; no dedicated .env.staging or Dashboard env separation documented.
5. **NEXT_PUBLIC_APP_ENV:** Not set; useful for UI to show “staging” vs “production”.
6. **Next.js 14.2.18:** Security warning in npm (upgrade to patched version recommended).

---

## 7. What is already in good shape

- Single packageManager at root (bun).
- Workspaces and contracts with zod; next.config fixes zod resolution.
- Wrangler multi-env (dev/staging/production) and separate worker names.
- GitHub Actions: install from root, cf:build, deploy from apps/web with correct wrangler env.
- Health endpoint and build stamp in config and UI.
- No secrets in repo; wrangler secrets for sensitive vars.
- Routes for production managed in Dashboard (no route conflicts in wrangler).
