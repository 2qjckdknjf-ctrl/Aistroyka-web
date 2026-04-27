# HOTFIX — Final verdict (Team / invitations / smoke)

**Date:** 2026-03-27

## Migration status

| Item | Status |
|------|--------|
| `public.tenant_invitations` exists on linked Supabase | **YES** (DDL applied via Supabase SQL execution; ledger row `20260326120000` recorded) |
| Repo file | `apps/web/supabase/migrations/20260326120000_tenant_invitations.sql` |

## Invite flow status

| Item | Status |
|------|--------|
| Missing-table / schema-cache errors for `tenant_invitations` | **Resolved** on remote DB |
| Team/API invite contract vs DB | **Aligned** (table + RLS + grants match repo migration) |

## Smoke status

| Check | Result |
|-------|--------|
| `GET /api/v1/health` | **200** (pilot smoke) |
| `GET /api/v1/config` | **200** |
| `POST /api/v1/admin/jobs/cron-tick` | **200** |
| `GET /api/v1/ops/metrics` | **200** (after smoke user tenant + membership repair) |

**Command verified:**  
`set -a && . apps/web/.env.local && set +a && export BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.aistroyka.ai}" && bash scripts/smoke/pilot_launch.sh`  
**Exit code:** `0`

## Changed files (this unblock episode)

**Database (remote):**

- DDL: `tenant_invitations` + indexes + RLS + grants.
- Data: new `tenants` row for smoke pilot workspace + `tenant_members` owner row for smoke user.
- Ledger: `supabase_migrations.schema_migrations` row for `20260326120000`.

**Repository:**

- No additional code changes were required beyond what already existed from the prior hotfix (migration file + API error mapping). Documentation under `docs/release1/` was added/updated for this execution.

## Verdict

**FULLY_FIXED** for this contour:

- Real database has `tenant_invitations`.
- Smoke user has valid tenant context and sufficient role for `ops/metrics`.
- Pilot smoke script passes end-to-end against production `BASE_URL` with local `.env.local`.

**Blocker:** none identified for the stated scope.
