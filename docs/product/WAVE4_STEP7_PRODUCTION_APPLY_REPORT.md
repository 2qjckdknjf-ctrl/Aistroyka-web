# Wave 4 Step 7 — Production apply report

**Date:** 2026-03-29  
**Status:** **NOT EXECUTED — BLOCKED**

## D1 — Preconditions

Per mission: production apply **only after** successful staging proof. Staging apply did **not** complete (see `WAVE4_STEP7_STAGING_APPLY_REPORT.md`).

## D2 — Production-specific notes

- GitHub Environment **`production`** must supply `SUPABASE_PROJECT_REF` for the **production** Supabase project (distinct from staging).
- Same CLI sequence as workflow: `migration list` → `db push --dry-run` → `db push`.

## D3 — Dry-run / apply

**Not run.** Blocked by staging failure and by not invoking production workflow from this environment.

## Blocker

| Priority | Blocker |
|----------|---------|
| **P0** | Staging not proven; production apply **must not** proceed first. |
| **P0** | Same class of **migration history drift** may exist on production — must be confirmed with `supabase migration list` against production ref **before** any push. |
