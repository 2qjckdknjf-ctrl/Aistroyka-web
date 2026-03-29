# Wave 4 Step 7 — Rollout summary

**Date:** 2026-03-29  
**Outcome:** **Rollout not completed** — blockers documented with CLI evidence.

## What was supposed to happen

Apply, in order:

1. `20260330150000_tenant_members_stakeholder_role.sql`  
2. `20260330170000_stakeholder_rls_isolation.sql`  
3. `20260330180000_stakeholder_rls_remaining.sql`  
4. `20260330190000_stakeholder_rls_identity_export_photo.sql`  

…via canonical **`apps/web` + `supabase db push`** (GitHub workflow or approved local operator).

## What actually happened (this sprint)

- **Rollout path** documented (`WAVE4_STEP7_ROLLOUT_PATH_TRUTH.md`).  
- **Local evidence:** `migration list` shows Step 7 migrations **pending** on linked DB; **remote-only** migration versions exist that are **absent from the repo**.  
- **`db push --dry-run` failed** — apply **stopped** (no blind repair).  
- **`check-migrations.sh` failed** on **2026-03-29** UTC for `20260330*` filenames.  
- **Staging/production GitHub Actions** were **not** executed from here.  
- **Verification SQL** not run post-apply.

## Documents

1. `WAVE4_STEP7_ROLLOUT_PATH_TRUTH.md`  
2. `WAVE4_STEP7_STAGING_APPLY_REPORT.md`  
3. `WAVE4_STEP7_STAGING_VERIFICATION_REPORT.md`  
4. `WAVE4_STEP7_PRODUCTION_APPLY_REPORT.md`  
5. `WAVE4_STEP7_PRODUCTION_VERIFICATION_REPORT.md`  
6. `WAVE4_STEP7_ROLLOUT_VALIDATION_REPORT.md`  
7. `WAVE4_STEP7_ROLLOUT_POST_AUDIT.md`  
8. `WAVE4_STEP7_ROLLOUT_SUMMARY.md` (this file)

## Rollout-complete: **NO**
