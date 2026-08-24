# Staging Migration Apply Manifest — Pilot Governed AI (Reconciled)

**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244  
**Branch:** `feature/pilot-governed-ai-owner-evidence-2026-08-24`  
**Date:** 2026-08-24  
**Status:** `PARTIAL` — staging history reconciled; forward-fix `20260824150000` pending owner DB apply

## Migrations (ordered)

| Version | File | Purpose |
|---------|------|---------|
| `20260824122312` | `pilot_governed_ai_evidence_staging_compat.sql` | Create tables + baseline RLS |
| `20260824122423` | `pilot_governed_ai_evidence_search_path_hardening.sql` | `SECURITY INVOKER` + fixed `search_path` |
| `20260824123120` | `pilot_visual_evidence_report_project_consistency_compat.sql` | Task-only project consistency trigger |
| `20260824150000` | `pilot_governed_ai_evidence_security_hardening.sql` | Server-owned writes, visibility guard, policy split |

**Removed (do not apply):** `20260824120000_pilot_governed_ai_evidence.sql`

## Checksum (combined SHA-256 of all four files)

```
5a5281209ca52377951213d3a79563310da77d8760a96a20cfb5b06758e83b80
```

## Target environment

| Field | Value |
|-------|-------|
| Supabase project | **AISTROYKA** (ref `vthfrxehrursfloevnlp`, eu-central-1) |
| Environment | **Staging only** |
| Production | **NOT TOUCHED** |
| Backfill | **NONE** |

## Staging state (2026-08-24)

- Versions `20260824122312`, `20260824122423`, `20260824123120`: **already applied** on staging before this commit
- Version `20260824150000`: **pending** — `supabase db push` blocked by pre-existing unrelated remote/local migration drift (84 remote-only versions)

See `docs/reports/STAGING_APPLY_REPORT_PILOT_GOVERNED_AI_2026-08-24.md` for apply evidence and owner repair path.

## Post-apply smoke (required before READY_FOR_REVIEW)

1. Verify RLS policies: no client INSERT on audit/completeness
2. Worker submit → completeness API
3. Governed AI dry-run → audit row (service role)
4. Manager approve → `owner_visible=true`
5. Owner portal → `signed_image_url` only
6. Cross-tenant → 403/404
7. Revoked stakeholder → no access

Script: `node scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs` (requires `PILOT_E2E_*` in operator env)
