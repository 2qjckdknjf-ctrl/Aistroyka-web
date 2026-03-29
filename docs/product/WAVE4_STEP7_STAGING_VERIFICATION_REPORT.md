# Wave 4 Step 7 — Staging verification report

**Date:** 2026-03-29  
**Status:** **NOT EXECUTED** (staging migrations not applied — see staging apply report)

## Intended verification (when apply succeeds)

From `WAVE4_STEP7_LEGACY_REMEDIATION_REPORT.md`:

```sql
select tm.id, tm.user_id, tm.tenant_id, tm.role
from public.tenant_members tm
join public.project_stakeholders ps
  on ps.user_id = tm.user_id and ps.tenant_id = tm.tenant_id and ps.status = 'active'
where tm.role = 'viewer';
-- Expect 0 rows after Step 7 migration apply
```

From migrations `20260330170000_stakeholder_rls_isolation.sql`, confirm **existence** (as superuser or dashboard SQL):

- Functions: `is_internal_tenant_reader_for_tenant`, `is_portal_stakeholder_for_project`, `is_portal_stakeholder_for_document`
- Policies named e.g. `projects_select_portal`, `projects_write_internal` (replacing broad tenant-only policies)

## What was run in this sprint

- **No** post-apply SQL against staging — apply blocked.
- **No** live portal/API smoke against staging URLs — not in scope without successful apply and URL/credentials.

## Blocker

Verification requires **successful staging apply** first.
