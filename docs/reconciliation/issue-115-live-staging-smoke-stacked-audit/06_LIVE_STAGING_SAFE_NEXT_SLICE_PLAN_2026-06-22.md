# Live / Staging Safe Next Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Small PR

After PR #109 merges and `main` validation passes, the safest ops follow-up is:

**Operator-safe smoke runbook/checklist PR, no runtime changes.**

This should consolidate current smoke policy and evidence format without changing workflows or secrets.

## Proposed Scope

Allowed future slice:

- add/refresh a single runbook under `docs/runbooks/` or `docs/release/`
- document staging vs production smoke approval rules
- document safe smoke user lifecycle
- document cleanup evidence requirements
- document platform auth blockers
- link existing scripts/workflows

## Expected Files

Possible files:

- `docs/runbooks/LIVE_STAGING_SMOKE_POLICY.md`
- `docs/release/STRICT_PILOT_SMOKE_ENV_RUNBOOK.md`
- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`
- issue/PR comments linking the final policy

Avoid in first slice:

- workflow changes
- smoke script changes
- secret changes
- Auth Admin scripts
- deployment changes
- production smoke execution

## Required Checks

- docs review
- no secret values
- no code changes
- existing full validation if policy PR is stacked near runtime work

## Manual / Operator-Gated

Remain manual/operator-gated:

- production smoke
- Auth Admin user creation
- live Supabase mutation
- Cloudflare deploy
- Vercel/Cloudflare/GitHub setting changes
- Supabase migration apply
- stakeholder finance sanity with live credentials

## No Deploy / No Live Mutation Rule

This issue #115 audit does not authorize any live smoke or deploy. Future runbook PR also should not perform live mutation; it should prepare the gate.

## Slice Verdict

Next safe ops slice: docs/runbook/checklist PR after PR #109 merge.

Safe before PR #109 merges: NO.
