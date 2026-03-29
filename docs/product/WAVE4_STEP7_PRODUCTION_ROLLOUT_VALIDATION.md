# Wave 4 Step 7 — Production rollout validation

**Date:** 2026-03-29

## Checks

| Check | Result |
|-------|--------|
| `bash scripts/release/check-migrations.sh` | **PASS** (79 migrations) |
| `npm run test --prefix apps/web -- lib/tenant/rls-stakeholder-predicates.test.ts --run` | **PASS** |
| `supabase db push --include-all --dry-run --yes` (AISTROYKA) | **PASS** — up to date |
| `supabase db push --include-all --yes` (AISTROYKA) | **PASS** — up to date |

## Not run

Full `apps/web` Vitest suite (optional regression sweep).
