# Wave 4 Step 7 — Blocker resolution validation

**Date:** 2026-03-29

## Checks

| Check | Command / action | Result |
|-------|------------------|--------|
| Migration sanity | `bash scripts/release/check-migrations.sh` | **PASS** |
| Focused test | `npm run test --prefix apps/web -- lib/tenant/rls-stakeholder-predicates.test.ts --run` | **PASS** |
| Staging apply | `supabase db push --include-all --yes` (after repair + SQL fix) | **PASS** (exit 0) |
| Migration list | `supabase migration list` | Step 7 versions **on remote** |

## Not run

- Full `apps/web` Vitest suite (optional follow-up).  
- `npm run build` (no app TS changes beyond comment).  
- Production dry-run.

## Workflow file

`.github/workflows/apply-migrations.yml` — `--include-all` added to dry-run and apply.

## Remaining risks

- **P2:** Staging **linked** project identity not cryptographically tied to GitHub **staging** env in this doc — operator confirms.  
- **P2:** Exact SQL of removed remote-only migrations unknown.  
- **P2:** Production not yet applied.
