# Staging Migration Apply Manifest — Pilot Governed AI (Reconciled)

**PR:** https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/244  
**Branch:** `feature/pilot-governed-ai-owner-evidence-2026-08-24`  
**Date:** 2026-08-24  
**Status:** **CLOSED** — staging history aligned; forward-fix `20260824150000` applied

## Migrations (ordered, in scope)

| Version | File | Staging |
|---------|------|---------|
| `20260824122312` | `pilot_governed_ai_evidence_staging_compat.sql` | applied |
| `20260824122423` | `pilot_governed_ai_evidence_search_path_hardening.sql` | applied |
| `20260824123120` | `pilot_visual_evidence_report_project_consistency_compat.sql` | applied |
| `20260824150000` | `pilot_governed_ai_evidence_security_hardening.sql` | applied |

**Removed (do not apply):** `20260824120000_pilot_governed_ai_evidence.sql`

**Deferred (not in PR #244):** initplan performance follow-up — see `PERFORMANCE_ADVISOR_FOLLOWUP_PILOT_GOVERNED_AI_RLS_INITPLAN_2026-08-24.md`

## Checksum

| Scope | SHA-256 |
|-------|---------|
| Forward-fix only (`20260824150000`) | `60ca456431a7fb2870aa5e765cc0fee66d8837c767b147f76adf927c4a0e449a` |

## Target environment

| Field | Value |
|-------|-------|
| Supabase project | **AISTROYKA** staging (`vthfrxehrursfloevnlp`) |
| Production | **NOT TOUCHED** |
| Backfill | **NONE** |

## Remaining gate

Authenticated 25-step E2E on Vercel Preview (via registered runner PR #245 + staging secrets).
