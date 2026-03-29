# Wave 4 Step 7 — Production rollout git truth

**Date:** 2026-03-29

## A1 — Scope

Commit **`fc710fe6`** contains **only** Wave 4 Step 7 rollout / migration unblock work (staged explicitly; no unrelated workspace files).

## A2 — Included in commit

- `apps/web/supabase/migrations/20260329100000` … `20260329160000` (Step 7 chain + portal prerequisites)
- `apps/web/supabase/migrations/20260329140000_stakeholder_rls_isolation.sql` — worker RLS fix (`task_id` → `worker_tasks.project_id`; `worker_day` internal-only)
- `.github/workflows/apply-migrations.yml` — `supabase db push --include-all` for dry-run and apply
- `scripts/release/apply-migrations.sh` — `--include-all`
- `apps/web/lib/tenant/rls-stakeholder-predicates.test.ts`
- Blocker / rollout / RLS summary docs under `docs/product/WAVE4_STEP7_*`

## A3 — Remote

| Item | Value |
|------|--------|
| Branch | `main` |
| Commit | `fc710fe6f76273dc276e0f7383cd6a403fb265b5` |
| `origin/main` | matches local HEAD at push time |

## A4 — Push

**Pushed:** `main` → `origin/main` successfully after commit.

## A5 — Follow-up (production evidence docs)

**Commit:** `94e94afc` — adds `WAVE4_STEP7_PRODUCTION_*.md` evidence pack; **pushed** to `origin/main`.
