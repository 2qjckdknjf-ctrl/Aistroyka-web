# Wave 3 — GitHub secret and workflow report

**Date (UTC):** 2026-03-28

## Secret requirement

| Name | Used by | Purpose |
|------|---------|---------|
| **`PILOT_SMOKE_BEARER_PRODUCTION`** | `.github/workflows/deploy-cloudflare-prod.yml` → reusable `pilot-smoke.yml` | Non-empty **Supabase user JWT** (no `Bearer` prefix in secret; workflow adds `Bearer `) for `AUTH_HEADER` in `scripts/smoke/pilot_launch.sh` |

The **deploy** job also runs a step **Verify pilot smoke secret** that fails the job if this secret is empty.

## Action taken

- **Set secret:** `printf %s "$ACCESS_TOKEN" | gh secret set PILOT_SMOKE_BEARER_PRODUCTION --repo 2qjckdknjf-ctrl/Aistroyka-web`
- **Token source:** Same Supabase **password grant** JWT as pilot smoke user (`SMOKE_EMAIL` / `SMOKE_PASSWORD` via local env — not logged in repo).

## Verification

- **Secret visible in API list:** `CLOUDFLARE_*`, **`PILOT_SMOKE_BEARER_PRODUCTION`**
- **Workflow:** `gh workflow run deploy-cloudflare-prod.yml --ref main`
- **Run:** `23692586207` — **`conclusion: success`**
- **Pilot smoke step:** `PASS` health, config, cron-tick, ops/metrics; `pilot_launch done`

## Operational note (P1)

Supabase **access tokens expire**. For long-term CI stability, replace with a **refreshable** credential strategy (e.g. scheduled rotation, or a dedicated machine user + password in a **rotated** secret). Not a Wave 3 code change.

## Blocker before this sprint

**Missing secret** — **resolved** by setting `PILOT_SMOKE_BEARER_PRODUCTION`.
