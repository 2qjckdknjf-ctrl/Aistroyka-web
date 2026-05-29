# Supabase performance advisors — unused index triage (2026-05-29)

## Current state (after RLS policy split)

| Advisor | Count | Status |
|---------|------:|--------|
| `multiple_permissive_policies` | 0 | Cleared (PR #58, #59) |
| `unused_index` | 305 | Deferred |
| `auth_db_connections_absolute` | 1 | INFO — dashboard/Supabase config |

Security advisors: **0 WARN** (leaked password protection enabled via PR #56–#57).

## Why `unused_index` is deferred

Supabase flags indexes with `idx_scan = 0` in `pg_stat_user_indexes`. On the pilot project this includes:

- FK helper indexes (`idx_fkfix_*`)
- Tenant/project composite indexes for dashboard and mobile sync paths
- AI and billing tables with low or no production traffic yet

Mass-dropping 305 indexes risks regressions once pilot traffic grows. Several flagged indexes are clearly intentional (e.g. `tenant_id`, `project_id`, `created_at` composites).

## Recommended next pass (traffic-backed)

1. After 2–4 weeks of representative production load, re-export performance advisors.
2. For each candidate drop, confirm:
   - Not backing a UNIQUE/PK constraint
   - Not the only index on an FK column used in joins
   - Not a strict prefix duplicate of another index on the same table
3. Drop in small batches (≤20 indexes) with before/after query plans on hot paths (`worker_reports`, `project_documents`, `analysis_jobs`, sync cursors).

## RLS changes shipped

- `20260529103000_rls_split_overlapping_all_policies.sql` — split/remove overlapping `FOR ALL` policies
- `20260529104500_project_defects_insert_policy_merge.sql` — merged portal + internal INSERT on `project_defects`

Access semantics unchanged; fewer policies evaluated per query.
