# STAGE 04 — Database / Supabase / Migrations Readiness Report

## 1. Goal

Verify migration integrity and publication-critical schema readiness for Supabase-backed runtime.

## 2. Files inspected

- `apps/web/supabase/migrations/*.sql` (111 files)
- `scripts/release/check-migrations.sh`
- `docs/pilot-launch/DB_MIGRATION_APPLY_SEQUENCE.md`
- `docs/ENVIRONMENT-VARIABLES.md`
- migration-related docs under `docs/db`, `docs/release`, `docs/closure`

## 3. Findings

1. Local migration chain is structurally sane:
   - no future-dated migrations
   - no timestamp ordering breaks
   - total: 111 migration files
2. Publication-critical domains exist in migration set:
   - tenant/memberships
   - projects/project_members
   - worker tasks/reports
   - upload sessions/media-related layers
   - project documents
   - project cost items
   - project milestones
   - audit retention/audit layers
   - alerts/ops layers
3. Supabase CLI is installed (`v2.75.0`) but remote project access is not currently authorized in this environment.
4. Remote checks failed with auth blocker:
   - `supabase migration list --workdir apps/web` -> unauthorized (401)
   - `supabase db push --dry-run --workdir apps/web` -> unauthorized (401)

## 4. Changes made

1. Added operator-ready DB checklist:
   - `docs/publication-readiness/STAGE_04_DB_READINESS_CHECKLIST.md`
2. No schema code changes were applied in this stage.

## 5. Validation commands

```bash
bash scripts/release/check-migrations.sh
supabase --version
supabase migration list --workdir apps/web
supabase db push --dry-run --workdir apps/web
```

## 6. Validation result

- Migration sanity script: PASSED.
- Supabase CLI availability: PASSED.
- Remote migration reconciliation/dry-run: BLOCKED by missing DB auth (`SUPABASE_DB_PASSWORD` / linked authenticated project).

## 7. Remaining gaps

1. Live migration parity vs target production DB is unverified.
2. Live table existence and RLS posture are not proven from this environment.
3. Safe pending migration apply requires authenticated operator execution.

## 8. Blockers

- **BLOCKED_EXTERNAL:** Missing authorized Supabase DB credentials/context for target project.

## 9. Commit hash

Pending (generated after commit in this stage).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

BLOCKED_EXTERNAL

## 12. Exact operator command sequence

```bash
supabase login
supabase link --workdir apps/web --project-ref <PROJECT_REF>
export SUPABASE_DB_PASSWORD='<db_password>'
supabase migration list --workdir apps/web
supabase db push --dry-run --workdir apps/web
supabase db push --workdir apps/web
```

