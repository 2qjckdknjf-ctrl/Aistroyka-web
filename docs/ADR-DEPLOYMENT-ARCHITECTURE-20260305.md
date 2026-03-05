# ADR: Deployment architecture (multi-environment)

**Date:** 2026-03-05  
**Status:** Accepted

---

## Context

We need two clear environments: **Staging** (safe testing) and **Production** (stable users), with predictable pipeline, separate env vars, and minimal regression risk.

---

## Decision

### One Cloudflare account, one Workers app, branch-based envs

- **Single codebase** and **single wrangler.toml** in `apps/web` with three wrangler envs: `dev`, `staging`, `production`.
- **One Worker per environment:** aistroyka-web-dev, aistroyka-web-staging, aistroyka-web-production (same build artifact, different Worker names and bindings).
- **Branch → environment mapping:**
  - **main** → deploy to **production** (aistroyka-web-production).
  - **develop** → deploy to **staging** (aistroyka-web-staging).
- **No separate Cloudflare “project” per env:** we use the same GitHub repo and the same build; only the wrangler `--env` and Dashboard config (domains, vars) differ. This keeps one source of truth (wrangler.toml), one CI workflow per branch, and simpler secrets (per-Worker in Dashboard).

### Why not two separate Cloudflare “projects”

- Two projects (e.g. “aistroyka-web-staging” and “aistroyka-web-prod” as separate Pages/Workers projects) would duplicate build configuration and require two deploy pipelines or two repos/roots. Current setup already gives **logical separation** (different Workers, different routes, different env vars per Worker). For enterprise predictability we rely on **branch discipline** and **per-Worker env/secrets** rather than separate projects.
- If the organization later requires strict project-level isolation (e.g. different Cloudflare accounts), this can be revisited; the same wrangler.toml and build can target another account via CLOUDFLARE_ACCOUNT_ID and a different API token.

### Domains

- **Production:** aistroyka.ai (canonical), www.aistroyka.ai → 301 to apex or vice versa (configured in Dashboard/DNS). Routes attached to aistroyka-web-production.
- **Staging:** staging.aistroyka.ai (CNAME to Worker or Workers custom domain). workers.dev URL remains available for aistroyka-web-staging unless disabled.

### Build pipeline

- **Install:** From repo root, `bun install --frozen-lockfile` (single package manager).
- **Build:** From repo root, `bun run cf:build` (runs OpenNext in apps/web). No `npm install` in pipeline.
- **Deploy:** From apps/web, `npx wrangler deploy --env production` or `--env staging` (GitHub Actions use production on main, staging on develop).

---

## Consequences

- Staging and production are clearly separated by Worker name, branch, and domain.
- Env vars and secrets are set per Worker in Cloudflare Dashboard (no mixing).
- One build artifact; same code path for both envs except env-specific vars.
- Staging branch is **develop**; if the team prefers a branch named **staging**, the workflow can be updated to trigger on `staging` instead of `develop`.
