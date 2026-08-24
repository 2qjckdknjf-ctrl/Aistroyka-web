# Staging Migration Apply Manifest — Pilot Governed AI

**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244  
**Branch:** `feature/pilot-governed-ai-owner-evidence-2026-08-24`  
**Date:** 2026-08-24  
**Status:** `READY_FOR_STAGING_APPLY` (local gates green; owner authorization required for remote apply)

## Migration

| Field | Value |
|-------|-------|
| Filename | `20260824120000_pilot_governed_ai_evidence.sql` |
| Type | **Additive** (no DROP TABLE / TRUNCATE) |
| Tables | `visual_evidence_records`, `ai_action_audit_records`, `report_completeness_evaluations` |
| Triggers | `trg_visual_evidence_project_consistency` |
| Local contract tests | PASS (`pilot-governed-ai-migration.contract.test.ts`) |
| Remote apply | **NOT APPLIED** |

Compute checksum before apply:

```bash
shasum -a 256 apps/web/supabase/migrations/20260824120000_pilot_governed_ai_evidence.sql
```

## Target environment

| Field | Value |
|-------|-------|
| Supabase project | **AISTROYKA** (ref `vthfrxehrursfloevnlp`, eu-central-1) |
| Environment | **Staging only** — production blocked in this PR |
| Production ref | Must differ — do not apply to production in this slice |

## Preflight (before apply)

1. Confirm PR CI green on head SHA.
2. Confirm migration checksum matches manifest.
3. Confirm no destructive SQL (`grep -i 'drop table\\|truncate'` → empty).
4. Run local contract test: `bun run --cwd apps/web vitest run lib/domain/visual-evidence/pilot-governed-ai-migration.contract.test.ts`
5. Owner explicit approval: `STAGING_MIGRATION_APPLY=YES`

## Apply command (owner-authorized only)

```bash
# From repo root with Supabase CLI linked to staging project AISTROYKA
supabase db push --linked
# OR apply single file via dashboard SQL editor after review
```

## Post-apply smoke (do not mark PASS until executed)

1. Verify tables exist: `\d visual_evidence_records`, `\d ai_action_audit_records`, `\d report_completeness_evaluations`
2. Verify RLS enabled on all three tables
3. Worker submit report on staging → completeness API returns status
4. Manager approve → `owner_visible=true` on eligible evidence (not internal)
5. Owner portal visual-progress returns `signed_image_url` (no `object_path` / `file_url` in JSON)
6. Cross-tenant request → 403/404
7. Governed AI dry-run → audit row inserted, no writes

## Rollback / forward-fix

- Forward-fix preferred (additive migration only).
- Rollback requires manual table drop — **not recommended** without owner DBA review.

## Backfill

- Default: **reveal nothing**
- Dry-run manifest: `node scripts/pilot/owner-evidence-backfill-manifest.mjs --dry-run`
- Remote backfill: **NOT AUTHORIZED** in this PR
