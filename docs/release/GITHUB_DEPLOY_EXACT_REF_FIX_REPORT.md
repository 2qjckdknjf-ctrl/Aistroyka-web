# GitHub Deploy Exact Ref Validation Fix Report

Date: 2026-05-20 (UTC+2)
Repository: `2qjckdknjf-ctrl/Aistroyka-web`
Branch: `fix/deploy-exact-ref-validation`
PR: [#19](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/19)

## Root Cause

The deploy workflows validated ref inputs using:

`git ls-remote --exit-code --heads --tags "$REPO_URL" "$DEPLOY_REF"`

That call treats the final argument as a pattern, not an exact ref name. A non-exact match could pass validation and then fail later in `actions/checkout`.

## Files Changed

- `.github/workflows/deploy-cloudflare-staging.yml`
- `.github/workflows/deploy-cloudflare-prod.yml`

## Old Behavior

- Branch/tag checks were pattern-based, not exact.
- Full SHA path accepted any 40-char hex string without strict remote existence checks.
- Optional post-deploy jobs used `github.event.inputs.ref || github.ref` directly, which could diverge from the validated deploy ref.

## New Behavior

### Exact validation rules

Both workflows now enforce the following in `Validate deploy ref`:

1. Empty ref is rejected immediately.
2. Full SHA is allowed only for **40-char hex** (`^[0-9a-f]{40}$`).
3. Full SHA must be found in remote refs (`git ls-remote` direct check, then exact SHA presence fallback).
4. Partial SHA (`^[0-9a-f]{7,39}$`) is explicitly rejected.
5. Branches are validated only via exact `refs/heads/$DEPLOY_REF`.
6. Tags are validated only via exact `refs/tags/$DEPLOY_REF`.
7. Any other value fails fast before checkout with an explicit error.

### Ref propagation hardening

`deploy` job now exports:

- `outputs.deploy_ref: ${{ steps.deploy_ref.outputs.ref }}`

Optional post-deploy jobs now use:

- `ref: ${{ needs.deploy.outputs.deploy_ref }}`

This guarantees they checkout the same validated ref used by the deploy job.

## Verification

### YAML structure

- `ruby -e 'require "yaml"; YAML.load_file(...); puts "YAML OK"'` passed for both workflow files.

### Local validation simulation

- `DEPLOY_REF=main` -> passed with `Resolved deploy ref as exact branch: refs/heads/main`
- `DEPLOY_REF=does-not-exist` -> failed with explicit exact-ref error before checkout

### Staging workflow run

- Workflow: `Deploy Cloudflare (Staging)`
- Run ID: `26160163522`
- Trigger: `gh workflow run "Deploy Cloudflare (Staging)" -r fix/deploy-exact-ref-validation -f ref=main`
- Result: `success`

Evidence from logs:

- `Validate deploy ref` prints `Resolved deploy ref as exact branch: refs/heads/main`
- `actions/checkout@v4` uses `ref: main` and succeeds
- `Build (OpenNext Cloudflare)` succeeds
- `Deploy to Cloudflare (staging, patched bundle)` succeeds
- Blocking smoke job `Post-deploy pilot smoke (blocking)` succeeds

Non-blocking note:

- Optional `Post-deploy Playwright pilot E2E (optional)` failed at `Require pilot E2E secrets` (expected with missing `PILOT_E2E_*` secrets), does not block deploy because `continue-on-error: true`.

## Final Verdict

DEPLOY REF VALIDATION FIXED: YES
STAGING DEPLOY PASSED: YES
PRODUCTION DEPLOY TESTED: NO
REMAINING BLOCKER: NONE
