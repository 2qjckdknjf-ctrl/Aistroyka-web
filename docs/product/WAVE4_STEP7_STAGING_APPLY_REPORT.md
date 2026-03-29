# Wave 4 Step 7 — Staging apply report

**Date:** 2026-03-29  
**Status:** **NOT COMPLETED — BLOCKED**

## B1 — Auth / link context

- **GitHub Actions:** Staging apply was **not** executed from this environment (no access to GitHub secrets / workflow runner).
- **Local CLI:** Session had a linked Supabase project under `apps/web` (see migration list evidence below). **Environment identity** (staging vs prod vs dev) was **not** verified against GitHub Environment names.

## B2 — Migration sanity (`check-migrations.sh`)

**Command:** `bash scripts/release/check-migrations.sh`  
**Result:** **FAILED**

**Reason:** Migrations `20260330120000` … `20260330190000` are considered **future-dated** when `TODAY` (UTC) is **2026-03-29** (`ts > today` in script). The workflow runs this check **before** dry-run; **staging apply via CI would fail this gate until UTC date ≥ 2026-03-30** unless the check script or migration timestamps are adjusted by policy.

## B3 — Before apply: `supabase migration list` (local, linked project)

**Command:** `cd apps/web && supabase migration list`  
**Evidence (excerpt):** Step 7 files present **locally** with **empty Remote** column (not applied on linked DB):

- `20260330150000` … `20260330190000` — local only  
- Similarly, several other local migrations from `20260323*` onward show **not** applied on remote.

**Critical mismatch — remote-only versions not in repo:**

| Local | Remote | Note |
|-------|--------|------|
| | `20260325063743` | **Remote only** — no file in `apps/web/supabase/migrations/` |
| | `20260325142157` | **Remote only** — no file in `apps/web/supabase/migrations/` |

## B4 — Dry-run

**Command:** `cd apps/web && supabase db push --dry-run --yes`  
**Result:** **FAILED (exit 1)**

**CLI message (substance):**

- `Remote migration versions not found in local migrations directory.`
- Suggested repair (informational only — **not executed**):  
  `supabase migration repair --status reverted 20260325063743 20260325142157`  
  plus guidance to align with `supabase db pull` if needed.

**Interpretation:** **`db push` cannot proceed** until migration history alignment is resolved per `docs/closure/A1_MIGRATION_APPLY_RUNBOOK.md` (repair vs pull vs team decision). **Do not** run repair blindly.

## B5 — Apply

**Not executed.** Blocked by dry-run failure and by policy (no blind repair).

## Blocker summary (staging)

| Priority | Blocker |
|----------|---------|
| **P0** | **History drift:** remote has `20260325063743`, `20260325142157` not present in repository — `db push` refuses. |
| **P1** | **CI date gate:** `check-migrations.sh` fails until UTC calendar ≥ **2026-03-30** for `20260330*` filenames (or policy change to filenames). |
