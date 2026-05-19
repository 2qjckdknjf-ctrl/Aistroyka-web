# GitHub Deploy Failure Audit

Date: 2026-05-19 (UTC+2)  
Repository: `2qjckdknjf-ctrl/Aistroyka-web`

## 1) Latest Failed Deploy/Release Evidence

### Primary failed run (latest in deploy path with step-level logs)
- Workflow: `Deploy Cloudflare (Production)`
- Run ID: `25507056496`
- Branch/ref: `main` (workflow_dispatch)
- Event: `workflow_dispatch`
- Failing job: `Build and deploy to production`
- Failing step: `Run actions/checkout@v4`
- Failure phase: **before deploy** (checkout stage)
- Exact error lines:
  - `ref: c014dedcd026fe8c9e9d0d62a8a00f`
  - `git fetch ... +refs/heads/c014dedcd026fe8c9e9d0d62a8a00f* ...`
  - `The process '/usr/bin/git' failed with exit code 1`
  - `##[error]The process '/usr/bin/git' failed with exit code 1`
- Root-cause classification: **wrong/invalid checkout ref input** (branch/tag/SHA resolution issue).

### Newer failed staging run (no step logs available)
- Workflow: `Deploy Cloudflare (Staging)`
- Run ID: `25506747821`
- Branch/ref: `main`
- Event: `push`
- GitHub report: `This run likely failed because of a workflow file issue.`
- `jobs: []` in run metadata (no executable job logs retrievable via `gh run view --log`).

## 2) Workflow Inventory and Classification

Scanned files under `.github/workflows`:

### A. Deploy workflows
- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`

### B. Migration workflows
- `apply-migrations.yml` **not present** in current repository state.

### C. Smoke workflows
- `.github/workflows/pilot-smoke.yml`
- `.github/workflows/android-instrumented-smoke.yml`
- `.github/workflows/ios-ui-smoke.yml`

### D. Reusable workflows
- `.github/workflows/pilot-smoke.yml` (`workflow_call`)
- `.github/workflows/pilot-e2e-audit.yml` (`workflow_call` + `workflow_dispatch`)

### E. Irrelevant to deploy failure path
- `.github/workflows/ci-check.yml`
- `.github/workflows/ai-phase5-slo-schedule.yml`
- mobile smoke workflows (`android-instrumented-smoke.yml`, `ios-ui-smoke.yml`)

## 3) Known Failure Pattern Audit

- Wrong checkout ref handling: **FOUND** in deploy workflows (manual ref used directly without validation).
- Supabase CLI install via `npm install -g supabase`: **NOT FOUND** (no migration workflow present).
- YAML structural error in current deploy files: no structural issue detected by inspection after fix.
- Smoke gate design: **OK** (`pilot-smoke` is blocking via `needs: deploy` in deploy workflows).

## 4) Secret Presence Check (names only)

Checked via `gh secret list` (values not printed).

Present:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `PILOT_SMOKE_BEARER_STAGING`
- `PILOT_SMOKE_BEARER_PRODUCTION`
- `NEXT_PUBLIC_SUPABASE_URL_STAGING`
- `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`

Not present in current repo secrets list (may be optional depending on workflow paths):
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `CRON_SECRET`
- `PILOT_SMOKE_BEARER_PRODUCTION`/`PILOT_SMOKE_BEARER_STAGING` were present (not missing)
- `NEXT_PUBLIC_APP_URL` (deploy workflows hardcode URLs instead of reading secret)
- `SYSTEM_API_KEY`

## 5) Selected Repair Path

Chosen path: **CASE A — checkout branch/ref problem**  
Reason: latest deploy failure with full logs fails directly at checkout due invalid ref resolution in the deploy path.

## 6) Rerun Evidence After Fix

Triggered workflow:
- `Deploy Cloudflare (Staging)`
- Run ID: `26122362951`
- Branch: `docs/pr13-release-closure`
- Event: `workflow_dispatch`
- Input ref: `main`

Proof points from logs:
- `Validate deploy ref` step succeeded with `DEPLOY_REF: main`
- Log line: `Resolved deploy ref: main`
- `actions/checkout@v4` executed with `ref: main` and succeeded
- Deploy step `Deploy to Cloudflare (staging, patched bundle)` succeeded
- Blocking reusable smoke job succeeded: `Post-deploy pilot smoke (blocking)`

Final run conclusion:
- Workflow conclusion: `success`
- Note: optional job `Post-deploy Playwright pilot E2E (optional)` failed at secrets check (`Require pilot E2E secrets`) but is configured with `continue-on-error: true`, so it did not block deploy completion.
