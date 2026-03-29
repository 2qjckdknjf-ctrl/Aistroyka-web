# Wave 4 Step 7 — RLS closure summary

**Date:** 2026-03-29

## What shipped

- **SQL helpers:** `is_internal_tenant_reader_for_tenant`, `is_portal_stakeholder_for_project`, `is_portal_stakeholder_for_document`.  
- **RLS rewrite:** Internal-only vs portal project-scoped **SELECT**; **writes** internal-only on project data; tenant-wide internal tables deny **stakeholder**.  
- **Legacy fix:** `UPDATE tenant_members SET role = stakeholder` for active `project_stakeholders` still on `viewer`.  
- **Follow-up migrations:** Remaining tenant-wide tables (sync, jobs, feature flags, entitlements, audit insert, identity, export, photo).  
- **Tests:** `rls-stakeholder-predicates.test.ts` + full suite green.

## Docs

1. `WAVE4_STEP7_RLS_INVENTORY.md`  
2. `WAVE4_STEP7_RLS_BACKEND_REPORT.md`  
3. `WAVE4_STEP7_LEGACY_REMEDIATION_REPORT.md`  
4. `WAVE4_STEP7_RLS_PROOF_REPORT.md`  
5. `WAVE4_STEP7_RLS_VALIDATION_REPORT.md`  
6. `WAVE4_STEP7_RLS_POST_AUDIT.md`  
7. `WAVE4_STEP7_RLS_SUMMARY.md` (this file)

## Apply order

Filenames in repo (date-gate rename from `202603301*`):  
`20260329130000_tenant_members_stakeholder_role.sql` → `20260329140000_stakeholder_rls_isolation.sql` → `20260329150000_stakeholder_rls_remaining.sql` → `20260329160000_stakeholder_rls_identity_export_photo.sql` (after prerequisites such as `20260329120000_project_stakeholders.sql`).
