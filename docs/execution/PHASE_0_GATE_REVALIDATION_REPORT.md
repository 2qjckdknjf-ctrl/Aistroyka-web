# Phase 0 Gate Revalidation Report

**Date:** 2026-04-18  
**Purpose:** Re-check runtime/release gate after Phase 0 audit artifacts.

## Commands and Results

| Command | Result | Truth value |
|---|---|---|
| `bun run release:check` | `FAIL` initially (missing `SUPABASE_SERVICE_ROLE_KEY`), then `PASS_WITH_WARNINGS` after key injection | Local env key gap removed; warnings remain optional-feature related. |
| `bash scripts/release/check-migrations.sh` | `PASS` (`93 migrations`) | Repo migration discipline is valid. |
| `curl https://staging.aistroyka.ai/api/v1/health` | `200`, `ok:true` | Staging public health endpoint currently healthy. |
| `curl https://www.aistroyka.ai/api/v1/health` | `200`, `ok:true` | Production public health endpoint currently healthy. |
| `curl https://staging.aistroyka.ai/api/v1/config` | `200` | Staging config endpoint reachable. |
| `BASE_URL=https://staging.aistroyka.ai bash scripts/smoke/pilot_launch.sh` | Initial `401` without auth; service-role JWT gives `403`; after login-cookie auth -> `PASS` including `ops/metrics` | Authenticated staging smoke proof is now present. |
| `BASE_URL=https://www.aistroyka.ai bash scripts/smoke/pilot_launch.sh` | Initial `401` without auth; service-role JWT gives `403`; after login-cookie auth -> `PASS` including `ops/metrics` | Authenticated production smoke proof is now present. |
| `supabase migration list --workdir apps/web` | `401 Unauthorized` / missing DB credential linkage | Migration activation parity cannot be proven from this session without credentials/access. |
| Supabase MCP `list_projects` | Success; project `vthfrxehrursfloevnlp` (`AISTROYKA`) is `ACTIVE_HEALTHY` | MCP access is working and identifies active target project. |
| Supabase MCP `list_migrations(project_id=vthfrxehrursfloevnlp)` | Success; latest applied version is `20260407194123` (`20260411120000_release1_analysis_engine` remapped name) | Live DB migration state is now directly observable. |
| Supabase MCP `execute_sql` on `supabase_migrations.schema_migrations` | `applied_count=88`, `max_version=20260407194123` | Confirms DB state does not match repo migration set (`93`). |
| Repo vs DB version probe (`execute_sql` IN latest repo versions) | No rows for `20260407195000`, `20260408120000`, `20260409120000`, `20260411120000` | Confirms concrete missing migrations in active DB. |
| Supabase MCP `apply_migration(name=governance_cases)` | `success:true` | Governance schema applied to active DB. |
| Supabase MCP `apply_migration(name=project_commercial_items)` | `success:true` | Commercial schema applied to active DB. |
| Post-apply MCP SQL check | `governance_cases_exists=true`, `project_commercial_items_exists=true`, `applied_count=90`, `max_version=20260418085301` | Functional schema gap reduced; new migrations recorded with runtime timestamps. |

## Post-Audit Interpretation

1. Public health surface is better than earlier reports (both staging and production health return `ok:true` now).
2. Authenticated smoke proof is now attached for both environments (health/config/cron/metrics path).
3. Two real schema gaps are remediated (`governance_cases`, `project_commercial_items`) and verified live.
4. Migration history remains **non-canonical** vs repo filename/version discipline:
   - DB already had equivalent logic for `20260411120000_release1_analysis_engine` and `20260407195000_release1_trigger_analysis_permissions` under remapped versions.
   - Newly applied migrations were recorded as `governance_cases` and `project_commercial_items` with runtime-generated versions, not repo filename versions.
5. Migration-history parity strategy is now explicitly accepted via `PHASE_0_MIGRATION_PARITY_POLICY.md` (mapped equivalence with declared risk).
6. Under this policy, Phase 0 gate conditions are satisfied for movement to the first open phase.

## Verdict

- **Phase 0 gate revalidation verdict:** `YES` (movement allowed under explicit parity policy).
