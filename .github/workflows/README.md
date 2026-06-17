# GitHub Actions — operator notes

Canonical workflows live in this directory. Deploy truth: `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`.

## iOS Layer B E2E (live pilot)

| File | Trigger | Purpose |
|------|---------|---------|
| `ios-e2e-integration.yml` | **`workflow_dispatch` only** | Mobile API chain + Manager/Worker live UITests on `macos-latest` |

**Secrets:** `PILOT_E2E_EMAIL`, `PILOT_E2E_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`, `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`. Optional: `PILOT_E2E_BASE_URL`, `PILOT_E2E_PROJECT_ID`.

**Run:** Actions → *iOS Layer B E2E (live pilot)* → *Run workflow*.

**Phantom push failure:** When this file is merged to `main`, GitHub may show a 0s failed run on `push` because the workflow has no `push` trigger jobs. The job is guarded with `if: github.event_name == 'workflow_dispatch'`. Safe to ignore — use manual dispatch.

## Layer A iOS smoke (PR gate)

| File | Trigger | Purpose |
|------|---------|---------|
| `ios-ui-smoke.yml` | PR (`ios/**`, not md-only) + `workflow_dispatch` | Login-surface UITests, no live API |
