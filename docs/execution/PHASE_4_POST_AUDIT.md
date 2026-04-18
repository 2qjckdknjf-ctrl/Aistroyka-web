# Phase 4 — Post-Audit (Slice 1)

**Date:** 2026-04-18  
**State:** first hardening slice implemented and validated.

## Findings

### P0

- None.

### P1

1. Operational secrets for fallback smoke auth are not configured:
   - `PILOT_SMOKE_EMAIL_STAGING`
   - `PILOT_SMOKE_PASSWORD_STAGING`
   - `NEXT_PUBLIC_SUPABASE_URL_STAGING`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
2. Static bearer currently used by smoke does not satisfy tenant auth for `ops/metrics` (runtime `401`).

### P2

1. Workflow triggering without `--ref` can execute default-branch workflow versions, which can hide branch-level hardening changes during validation.

## Phase 4 closure verdict (current)

- **NO** (hardening loop not fully closed yet).

## Required next action

- Configure the fallback secret set for staging and rerun deploy+smoke on branch ref.
