# Operator Gate Checklist

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Pre-Smoke Checks

- Confirm target branch/commit SHA.
- Confirm environment: local, preview, staging, or production.
- Confirm target base URL.
- Confirm canonical runtime owner: Cloudflare Workers for production.
- Confirm PR/branch CI status.
- Confirm no unresolved P0 blockers.
- Confirm the smoke run is approved for its environment.

## Env Readiness

Check presence only, never print values:

- `BASE_URL`
- `AUTH_HEADER` or `COOKIE` or `SMOKE_EMAIL` + `SMOKE_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CRON_SECRET` when cron requires it
- `PILOT_E2E_BASE_URL`
- `PILOT_E2E_EMAIL`
- `PILOT_E2E_PASSWORD`
- `SUPABASE_ACCESS_TOKEN` only for CLI/project inspection tasks
- `SUPABASE_SERVICE_ROLE_KEY` only for approved Auth Admin lifecycle tasks

## Preview / Staging URL Checks

- Vercel preview may be platform-auth protected; distinguish platform auth failure from app failure.
- Cloudflare preview may require Access.
- Staging canonical URL is `https://staging.aistroyka.ai`.
- Production canonical URL is `https://aistroyka.ai`.

## Supabase Target Classification

Before mutation:

- verify project ref
- verify region/project name if tooling exposes it
- verify this is the intended AISTROYKA project
- verify it is not a legacy/cold-backup project unless operator explicitly selected it

## Role Matrix

For role-gated flows, define expected behavior before running:

- owner/admin
- project manager
- tenant member
- worker
- stakeholder/customer
- anonymous

## CSV / Data Safety Checks

For export/data smoke:

- verify safe headers/columns
- search sampled output for forbidden finance/customer/stakeholder/PII terms
- do not save sensitive CSV artifacts in repo
- do not expose media URLs or internal notes

## Cleanup Confirmation

Required for mutable smoke:

- list created users
- list created memberships
- list created records
- delete/disable as planned
- verify zero leftovers
- document cleanup result

## Evidence Format

Evidence should include:

- date/time
- branch/commit
- base URL
- environment
- commands run, with secrets omitted
- pass/fail per gate
- cleanup result
- links to CI runs or PR/issue comments

## Checklist Verdict

Operator gate checklist status: READY FOR USE AFTER PR #109 MERGE.
