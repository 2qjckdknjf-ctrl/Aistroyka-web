# GitHub Deploy Exact Ref Validation Fix Report

Date: 2026-05-20 (UTC+2)  
Repository: `2qjckdknjf-ctrl/Aistroyka-web`  
Branch: `fix/deploy-exact-ref-validation`  
PR: [#19](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/19)

## Root Cause

Deploy workflows validated refs with:

`git ls-remote --exit-code --heads --tags "$REPO_URL" "$DEPLOY_REF"`

This treats `DEPLOY_REF` as a pattern, not an exact ref, so invalid/non-exact values could pass validation and then fail in `actions/checkout`.

## Files Changed

- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`

## Old Behavior

- Branch/tag checks were pattern-based, not exact.
- Full SHA handling did not enforce strict remote existence.
- Optional post-deploy jobs could checkout a weaker ref expression (`github.event.inputs.ref || github.ref`) instead of the validated deploy ref.

## New Behavior

### Exact validation rules

`Validate deploy ref` now enforces:

1. Empty ref fails immediately.
2. Only full SHA (`^[0-9a-f]{40}$`) is accepted as commit input.
3. Full SHA must exist in remote refs (direct `ls-remote` check plus exact SHA fallback).
4. Partial SHA (`^[0-9a-f]{7,39}$`) is explicitly rejected.
5. Branches must match exactly: `refs/heads/$DEPLOY_REF`.
6. Tags must match exactly: `refs/tags/$DEPLOY_REF`.
7. Any other value fails fast with clear error before checkout.

### Ref propagation hardening

Deploy job now exports:

- `outputs.deploy_ref: ${{ steps.deploy_ref.outputs.ref }}`

Optional post-deploy jobs use that output for checkout:

- `ref: ${{ needs.deploy.outputs.deploy_ref }}`

This keeps all jobs on the same validated ref.

## Verification

### YAML validation

- Ruby YAML parse check passed for both deploy workflow files.

### Local behavior simulation (no deploy)

- `DEPLOY_REF=main` -> pass (`Resolved deploy ref as exact branch: refs/heads/main`)
- `DEPLOY_REF=does-not-exist` -> fail with exact-ref error before checkout

### Staging workflow run

- Workflow: `Deploy Cloudflare (Staging)`
- Run ID: `26160163522`
- Trigger: `gh workflow run "Deploy Cloudflare (Staging)" -r fix/deploy-exact-ref-validation -f ref=main`
- Result: `success`

Evidence:

- Validate step log includes `Resolved deploy ref as exact branch: refs/heads/main`
- Checkout ran with `ref: main` and succeeded
- Build succeeded
- `Deploy to Cloudflare (staging, patched bundle)` succeeded
- Blocking `Post-deploy pilot smoke (blocking)` succeeded

Non-blocking note:

- `Post-deploy Playwright pilot E2E (optional)` failed at `Require pilot E2E secrets` because `PILOT_E2E_*` secrets are missing; this job is `continue-on-error: true` and does not block deploy.

## Final Verdict

DEPLOY REF VALIDATION FIXED: YES  
STAGING DEPLOY PASSED: YES  
PRODUCTION DEPLOY TESTED: NO  
REMAINING BLOCKER: NONE
