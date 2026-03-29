# Wave 4 Step 7 — Blocker path truth

**Date:** 2026-03-29

## Canonical path

| Step | Action |
|------|--------|
| 1 | Repo root: `bash scripts/release/check-migrations.sh` |
| 2 | `cd apps/web` — all Supabase CLI commands |
| 3 | `supabase link --project-ref <STAGING_REF>` (or use existing link) |
| 4 | `supabase migration list` — compare Local / Remote |
| 5 | **Remote-only versions** without local files: `supabase migration repair --status reverted <version>…` **only** after audit (see drift decision) |
| 6 | **Gap** (local migrations older than last remote, not in history): `supabase db push --include-all` (dry-run then apply) |
| 7 | CI: `.github/workflows/apply-migrations.yml` — now uses `supabase db push --include-all` for dry-run and apply |

## Today’s effective UTC date (gate)

**Recorded at resolution:** **2026-03-29** (UTC).

## Is `20260330*` still blocked by `check-migrations.sh`?

**Was:** YES — script uses `TODAY=$(date -u +%Y%m%d)` and rejects `ts > ${TODAY}235959`.

**Resolution:** Step 7 migration files were **renamed** to `20260329110000` … `20260329160000` (same calendar day as UTC date above), so the **preflight passes** without waiting for 2026-03-30.

## Safe ordering

1. Understand drift (`migration list`).  
2. Resolve **remote-only** history (repair **or** add matching files — we used **repair** after audit).  
3. Resolve **date gate** (rename unapplied files — proven unapplied on target before rename).  
4. `db push --include-all --dry-run` → `db push --include-all`.  
5. Fix **SQL** if apply fails; re-push failed migration only.  
6. **Production** only after staging proof and explicit production project ref.
