# Release Hardening — Governed AI Runner Registration

Date: 2026-09-06
Scope: GitHub Actions workflow registration only
Master tracker: #282

## Confirmed blocker

The default-branch workflow `.github/workflows/governed-ai-pr-e2e-runner.yml` is intended to be manual-only (`workflow_dispatch`).

GitHub nevertheless created failed `push` runs with zero jobs for this workflow on current `main` and hardening branches. That behavior is consistent with workflow-definition validation failure rather than a normal E2E test failure.

## Root cause

The `Seal private key preflight` step contained an invalid YAML scalar:

```yaml
run: "${{ steps.pin_bun.outputs.bun_path }}" trusted-runner-ops/apps/web/lib/ops/governed-ai-pr-e2e-runner.seal-preflight.mjs
```

A quoted scalar ended before the command arguments, leaving extra tokens on the same YAML value.

## Forward fix

Convert that command to a block scalar:

```yaml
run: |
  "${{ steps.pin_bun.outputs.bun_path }}" trusted-runner-ops/apps/web/lib/ops/governed-ai-pr-e2e-runner.seal-preflight.mjs
```

No workflow security behavior is changed:
- still manual-only;
- same six jobs;
- same protected staging environment;
- same deployment binding;
- same sanitized harness and sealed evidence chain;
- same fail-closed verdict.

## Registration evidence

Before the fix, GitHub created zero-job failed `push` runs for the workflow, including on current `main` SHA `143930fd...`.

After pushing the corrected workflow branch, querying Actions runs for head `c00757da...` returned zero workflow runs. A valid manual-only workflow should not run on branch push, so this is the expected registration behavior.

## Regression

`governed-ai-pr-e2e-runner.workflow-registration.test.ts` locks:
- manual-only trigger;
- absence of the invalid inline quoted `run:` scalar;
- block-scalar form for the seal preflight;
- presence of the six-job fail-closed architecture.

## Safety

- no E2E dispatch
- no staging environment approval
- no secret use
- no deploy
- no product code change
- Draft PR only
