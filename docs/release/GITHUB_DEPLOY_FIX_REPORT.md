# GitHub Deploy Fix Report

Date: 2026-05-19 (UTC+2)

## Scope
- Deploy pipeline stabilization only (GitHub Actions + Cloudflare deploy path).
- No product feature work.
- No Android/iOS code changes.
- No production database mutation.

## Root Cause
- Deploy workflows accepted `workflow_dispatch` ref input directly in checkout.
- A failed deploy run used an invalid/non-resolvable ref string, causing checkout fetch failure before build/deploy.

## Changes Applied

### 1) `.github/workflows/deploy-cloudflare-prod.yml`
- Added `Resolve deploy ref` step.
- Added `Validate deploy ref` step:
  - allows full 40-char SHA;
  - otherwise validates branch/tag existence via `git ls-remote`.
- Updated checkout to use resolved ref output.

### 2) `.github/workflows/deploy-cloudflare-staging.yml`
- Same `Resolve deploy ref` and `Validate deploy ref` guard before checkout.
- Updated checkout to use resolved ref output.
- Aligned staging defaults with repository branch reality:
  - push trigger branch `main` (from `develop`);
  - workflow_dispatch default `ref=main` (from `develop`);
  - updated header comment accordingly.

### 3) Evidence Doc
- Added `docs/release/GITHUB_DEPLOY_FAILURE_AUDIT.md` with failure evidence, workflow classification, secrets presence check, and rerun evidence.

## Validation

Local:
- `bash -n scripts/smoke/pilot_launch.sh` ✅
- YAML parse check (`ruby` + `YAML.load_file`) for modified deploy workflows ✅
- `bash scripts/release/check-env-config.sh deploy-staging` ❌ locally without CI secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — expected outside GitHub Actions secret context.

GitHub Actions:
- Triggered: `Deploy Cloudflare (Staging)` with `ref=main`
- Run ID: `26122362951`
- Result: ✅ **success**
- Blocking deploy + blocking smoke path passed.

## Residual Notes
- Optional job `Post-deploy Playwright pilot E2E (optional)` failed due missing `PILOT_E2E_*` secrets and is non-blocking (`continue-on-error: true`), so deploy status remained green.
