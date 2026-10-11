# Verified DB migration receipts

The five source files in [receipts](DB_MIGRATION_RECEIPTS_2026-10-11.json) have already been applied to live AISTROYKA under four remote migration IDs. The base intake and status guard were combined in one atomic transaction. Do not replay source files because their original timestamps are absent from the remote history. No remote history was deleted, rewritten or repaired.

Supabase CLI compares migration timestamps, not semantic SQL equivalence ([official migration list/repair reference](https://supabase.com/docs/reference/cli/supabase-migration-list)). A broad db push --include-all can therefore classify these original versions as pending. First obtain a fresh read-only supabase_list_migrations export for vthfrxehrursfloevnlp, wrapped as {"project_ref":"vthfrxehrursfloevnlp","migrations":[...]}, and save locally. It contains metadata only; never put credential values in this export.

```sh
python3 scripts/ops/migration_receipts_preflight.py --history-json /absolute/path/live-history.json
python3 scripts/ops/migration_receipts_preflight.py --history-json /absolute/path/live-history.json \
  --candidate apps/web/supabase/migrations/20261003170000_customer_intake_drafts.sql
```

First command verifies source SHA-256 and actual remote version/name matches. Second must return ALREADY_APPLIED_DO_NOT_REPLAY, exit 3. Missing/changed receipts or wrong project stop with exit 1. --bulk-apply is blocked (exit 3). An unreceipted candidate is merely CANDIDATE_NOT_PROVEN_APPLIED; it grants no permission and still requires actual schema/tenant/role/concurrency checks and the protected delivery path. Receipt verification does not prove all historical migration drift has been reconciled or that current schema has not changed; recheck target SQL definitions/grants separately.

Seven guard tests run in required CI. The owner already authorized the completed operations; remaining product/store/legal/billing evidence is a separate concern. Staging and production web currently use the same database project, so a staging hostname alone is not DB isolation. The pre-apply PostgreSQL/PostgREST test database was loopback-only with synthetic data.
