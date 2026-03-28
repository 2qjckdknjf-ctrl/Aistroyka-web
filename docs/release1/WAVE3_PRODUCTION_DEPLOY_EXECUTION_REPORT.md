# Wave 3 — Production deploy execution report

**Date (UTC):** 2026-03-28

## Objective

Align live `buildStamp` with `main` containing Wave 3 and fix CI `cf:build` breakage caused by missing exports on `origin/main`.

## Root cause (pre-fix)

- `report.service.ts` on `main` imported `notifyProjectManagers` / `notifyTenantManagers` and called `repo.getProjectIdForReport`, but **`origin/main` lacked** the corresponding implementations in:
  - `apps/web/lib/domain/reports/report.repository.ts`
  - `apps/web/lib/domain/notifications/manager-notifications.repository.ts`  
- **GitHub Actions** `Deploy Cloudflare (Production)` failed at `bun run cf:build` with TypeScript / export errors (see run logs before this fix).
- **Live** `GET /api/v1/health` showed **`sha7: 3d329d3`** (stale) because production had not picked up a successful build containing the Wave 3 closure state.

## Fix applied (minimal)

- **Commit:** `f941d0e2` — `fix(web): align report.repository + manager-notifications with report.service (CI cf:build)`
- **Files:** only the two repository modules above (exports restored / aligned).

## Deploy path used

| Mechanism | Target | Result |
|-----------|--------|--------|
| `git push origin main` | GitHub `main` | Success (`07f7b8b4..f941d0e2`) |
| Vercel (Git integration) | Production project for `www.aistroyka.ai` | **Observed:** health `buildStamp.sha7` → **`f941d0e`** |
| GitHub Actions `deploy-cloudflare-prod.yml` | Worker `aistroyka-web-production` | **Deploy succeeded**; job **failed** after deploy on missing `PILOT_SMOKE_BEARER_PRODUCTION` |

## Times (approximate UTC)

- Push: ~2026-03-28 **19:03–19:04** (per Actions run start)
- Vercel / health alignment: verified within minutes after push

## Success / failure

- **Vercel production alignment:** **Success** (health stamp matches `f941d0e`).
- **Cloudflare Worker bundle publish:** **Success** (wrangler “Deployed aistroyka-web-production”).
- **Cloudflare workflow overall:** **Failure** (non-blocking for Vercel domain) — empty `PILOT_SMOKE_BEARER_PRODUCTION` secret.
