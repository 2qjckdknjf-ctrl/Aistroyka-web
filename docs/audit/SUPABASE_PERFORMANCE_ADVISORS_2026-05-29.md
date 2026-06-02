# Supabase performance advisors — unused index triage (2026-05-29)

## Current state (after RLS policy split)

| Advisor | Count | Status |
|---------|------:|--------|
| `multiple_permissive_policies` | 0 | Cleared (PR #58, #59) |
| `unused_index` | 215 | Batch 1–4 (−74) + batch 5 (−16) |
| `unindexed_foreign_keys` | 66 | INFO — expected after batches 2–5 |
| `auth_db_connections_absolute` | 0 | Cleared — Auth pool set to 17% via workflow |

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

## Index batch 1 (`20260529113000`)

Dropped 23 indexes that duplicated unique/PK or named indexes on the same column(s), e.g.:

- `idx_fkfix_*` duplicates of `idx_*` on FK columns
- `idx_*` duplicates of unique constraints (`user_identities`, `worker_day`, `proof_pack_shares`, etc.)
- Prefix duplicates covered by composite unique/PK (`tenant_members.tenant_id`, etc.)

Advisor count: `unused_index` 305 → 282.

## Index batch 2 (`20260529120000`)

Dropped 23 unused `idx_fkfix_*` indexes on audit/event tables where the primary entity timeline index remains (e.g. `defect_id`, `request_id`, `document_id`). Also dropped `idx_fkfix_ai_run_records_df7c76ebea` covered by `idx_ai_run_records_project`.

Advisor count: `unused_index` 282 → 259.

## Index batch 3 (`20260529130000`)

Dropped 18 unused `idx_fkfix_*` indexes on `project_defects` and `project_change_orders` (linked-entity and actor FK helpers). Each table keeps project-scoped list indexes (`idx_project_defects_project`, `idx_change_orders_project`, `idx_*_project_id`, partial blocking index on defects).

Advisor count: `unused_index` 259 → 241; `unindexed_foreign_keys` 22 → 40 (INFO, acceptable on pilot traffic — restore targeted FK indexes if reverse-lookup joins appear in slow query logs).

## Index batch 4 (`20260529140000`)

Dropped 10 unused `idx_fkfix_*` indexes on `project_client_requests` (actor FK helpers) and `project_documents` (actor/linked-entity FK helpers). Each table keeps project-scoped indexes (`idx_project_client_requests_project`, `idx_project_documents_project`, status partials, tenant indexes).

Advisor count: `unused_index` 241 → 231; `unindexed_foreign_keys` 40 → 50 (INFO).

## Index batch 5 (`20260529150000`)

Dropped 16 unused `idx_fkfix_*` on `governance_cases`, `project_issues`, `customer_estimates`, `project_commercial_items`, `ai_optimization_decisions`, plus `tenant_id` fkfix on `ai_memory_records` (covered by composite indexes). Kept `project_id`/`user_id`/`superseded_by` fkfix on `ai_memory_records` (sole single-column FK helpers).

Advisor count: `unused_index` 231 → 215; `unindexed_foreign_keys` 50 → 66 (INFO).

## RLS changes shipped

- `20260529103000_rls_split_overlapping_all_policies.sql` — split/remove overlapping `FOR ALL` policies
- `20260529104500_project_defects_insert_policy_merge.sql` — merged portal + internal INSERT on `project_defects`

Access semantics unchanged; fewer policies evaluated per query.
