# Release flow

**Date:** 2026-03-05

---

## Branch mapping

| Branch | Environment | Deploy trigger |
|--------|-------------|----------------|
| **main** | Production | Push to main → deploy-cloudflare-prod.yml |
| **develop** | Staging | Push to develop → deploy-cloudflare-staging.yml |

---

## How to ship changes

### 1. Feature / fix

- Work on a **feature branch** (e.g. `feature/xyz` or `fix/abc`).
- Open a PR into **develop** (or main if bypassing staging).
- CI runs lint, test, and (if configured) cf:build. Fix any failures.

### 2. Deploy to staging

- **Merge** the PR into **develop**.
- GitHub Actions run **Deploy Cloudflare (Staging)**.
- Check:
  - Actions tab: build and deploy steps are green.
  - Open staging URL (workers.dev or https://staging.aistroyka.ai): login, dashboard, key flows.
  - Run from repo: `cd apps/web && bun run smoke:staging` (or `npm run smoke:staging`).
  - Optional: GET https://staging.../api/v1/health → body should include `"env":"staging"` and buildStamp.

### 3. Deploy to production

- When staging is verified, open a PR **develop → main** (or merge develop into main).
- **Merge to main**.
- GitHub Actions run **Deploy Cloudflare (Production)**.
- Check:
  - Actions tab: deploy step is green.
  - https://aistroyka.ai and https://aistroyka.ai/api/v1/health respond.
  - Run: `cd apps/web && bun run smoke:prod`.
  - Optional: confirm build stamp on dashboard matches the deployed commit.

---

## When to use production only

- Hotfix: branch from **main**, fix, PR to **main**. Deploy runs on merge. Prefer also porting the fix to **develop**.
- Avoid merging untested code straight to main; use staging first when possible.

---

## Required checks (recommended)

- In GitHub: **Branch protection** for **main** (and optionally develop):
  - Require status checks to pass (e.g. “Build and deploy to production” or “Build and deploy to staging” can be optional; at least require “lint/test” or “CI” if you have a separate CI workflow).
  - Require PR before merge.
- No mandatory “smoke pass” in CI in this doc; you can add a job that runs `smoke:staging` / `smoke:prod` after deploy if desired.
