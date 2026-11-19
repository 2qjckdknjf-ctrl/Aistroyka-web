# GitHub Actions — operator notes

Canonical workflows live in this directory. Deploy truth: `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`.

## Runtime health monitor

| File | Trigger | Purpose |
|------|---------|---------|
| `runtime-health-monitor.yml` | `schedule` every 30 min + `workflow_dispatch` | Read-only `GET /api/v1/health` on production and staging (`scripts/ops/runtime_health_probe.py`) |

A failing probe (not HTTP 200 with `ok: true`, after one retry) fails the run and opens or comments on a single issue labelled `runtime-incident`. The first healthy run afterwards comments and closes it. No secrets beyond the default `GITHUB_TOKEN` (`issues: write`).

## iOS Layer B E2E (live pilot)

| File | Trigger | Purpose |
|------|---------|---------|
| `ios-e2e-integration.yml` | **`workflow_dispatch` only** | Mobile API chain + Manager/Worker live UITests on `macos-latest` |

**Secrets:** `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`, `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`, and pilot credentials via `PILOT_E2E_EMAIL`/`PILOT_E2E_PASSWORD` **or** `PILOT_SMOKE_EMAIL_PRODUCTION`/`PILOT_SMOKE_PASSWORD_PRODUCTION`. Optional: `PILOT_E2E_BASE_URL`, `PILOT_E2E_PROJECT_ID`.

**Run:** Actions → *iOS Layer B E2E (live pilot)* → *Run workflow*.

Push events run a no-op placeholder job so merges do not show a phantom 0s failure when every real job is skipped.

## Layer A iOS smoke (PR gate)

| File | Trigger | Purpose |
|------|---------|---------|
| `ios-ui-smoke.yml` | PR (`ios/**`, not md-only) + `workflow_dispatch` | Login-surface UITests, no live API |
