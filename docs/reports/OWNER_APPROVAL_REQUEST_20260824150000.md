# Owner approval request — migration `20260824150000`

**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244  
**Date:** 2026-08-24  
**Verdict gate:** Required before `READY_FOR_REVIEW`

## Required owner marker

Set in **operator environment only** (never in PR, chat, or commits):

```bash
export STAGING_MIGRATION_20260824150000_APPLY=YES
```

This marker is **separate** from any prior approval for `20260824120000`.

## Migration under approval

| Field | Value |
|-------|-------|
| Version | `20260824150000` |
| File | `apps/web/supabase/migrations/20260824150000_pilot_governed_ai_evidence_security_hardening.sql` |
| SHA-256 | `60ca456431a7fb2870aa5e765cc0fee66d8837c767b147f76adf927c4a0e449a` |
| HEAD SHA (at request time) | `4a025c9dff555c188d6e43f1052c3a3c8d097c47` |
| Target ref | `vthfrxehrursfloevnlp` (AISTROYKA staging, eu-central-1) |
| Production | **FORBIDDEN** |
| Backfill | **NO** |

## What it changes (additive forward-fix)

- Drops legacy broad/client-writable policies on pilot tables
- Recreates split RLS policies with `(select auth.uid())` pattern
- `service_role`-only writes for `ai_action_audit_records` and `report_completeness_evaluations`
- Adds `guard_visual_evidence_visibility_columns()` trigger (`SECURITY INVOKER`, fixed `search_path`)
- Stakeholder read uses `project_stakeholders.status = 'active'`

**No** `DROP TABLE`, **no** `TRUNCATE`, **no** data backfill.

## Preflight (owner or agent after marker)

1. Confirm Supabase project ref = `vthfrxehrursfloevnlp`
2. Confirm remote history contains `20260824122312`, `20260824122423`, `20260824123120`
3. Confirm `20260824150000` **absent** from remote history
4. Confirm checksum matches manifest
5. Provide `SUPABASE_DB_PASSWORD` or working Supabase Management API token in operator env (not in chat)

## Apply options (in order)

1. Supabase SQL editor — paste migration file contents on **staging only**
2. Supabase CLI with operator env: `supabase db push` (may require migration history repair for unrelated drift)
3. Approved CI workflow with environment protection

After apply:

```bash
supabase migration repair --status applied 20260824150000
```

(Only if SQL applied manually and history row missing.)

## Post-apply verification

- Remote history includes `20260824150000`
- Policies: `ai_action_audit_service_role`, `report_completeness_service_role` exist
- Authenticated direct INSERT to audit/completeness denied
- Trigger `trg_visual_evidence_visibility_guard` exists
- Supabase security advisor: no new ERROR/WARN on pilot objects
- Row counts on pilot tables unchanged (no backfill)

## E2E credentials (separate gate)

Repository has `PILOT_SMOKE_*_STAGING` GitHub secrets but **not** `PILOT_E2E_*`. For local/CI authenticated E2E, provide in operator env or GitHub secrets:

| Variable | Persona |
|----------|---------|
| `PILOT_E2E_EMAIL` / `PILOT_E2E_PASSWORD` | Worker (minimum) |
| `PILOT_E2E_MANAGER_EMAIL` / `PILOT_E2E_MANAGER_PASSWORD` | Manager approval steps |
| `PILOT_E2E_OWNER_EMAIL` / `PILOT_E2E_OWNER_PASSWORD` | Owner portal steps |
| `PILOT_E2E_BASE_URL` | `https://staging.aistroyka.ai` (or PR preview with Vercel bypass) |
| `PILOT_E2E_PROJECT_ID` | Optional QA project UUID |

**Note:** `staging.aistroyka.ai` health @ 2026-08-24 showed `buildStamp.sha7=587ef4c` (main), not PR head. E2E for PR API changes requires staging deploy of PR branch **or** Vercel preview with protection bypass.

Script: `node scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs`

## Rollback / incident

Forward-fix only. Do **not** drop tables. If partial apply, inspect live policies and re-run idempotent migration SQL.
