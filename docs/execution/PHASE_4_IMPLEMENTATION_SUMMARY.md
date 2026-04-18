# Phase 4 — Implementation Summary (Slice 1)

**Date:** 2026-04-18  
**Status:** In progress (first hardening slice implemented locally).

## Implemented in this slice

1. Updated `scripts/smoke/pilot_launch.sh`:
   - extracted token mint logic into reusable function,
   - added retry flow for `ops/metrics` when primary bearer returns `401`,
   - preserves existing cookie and direct bearer behavior.

2. Updated reusable workflow `.github/workflows/pilot-smoke.yml`:
   - added optional secrets for fallback auth:
     - `smoke_email`
     - `smoke_password`
     - `supabase_url`
     - `supabase_anon_key`
   - forwards these env vars into smoke script.

3. Updated deploy callers:
   - `.github/workflows/deploy-cloudflare-staging.yml`
   - `.github/workflows/deploy-cloudflare-prod.yml`
   - both now pass optional environment-specific fallback secrets to reusable smoke workflow.

## Local verification

- `bash -n scripts/smoke/pilot_launch.sh` -> PASS

## Next step

- Push Phase 4 slice commit and verify via staging deploy workflow run evidence.
