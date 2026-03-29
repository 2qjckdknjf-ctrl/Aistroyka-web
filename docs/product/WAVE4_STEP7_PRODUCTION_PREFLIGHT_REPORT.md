# Wave 4 Step 7 — Production preflight report

**Date:** 2026-03-29  
**Target:** AISTROYKA project `vthfrxehrursfloevnlp` (linked)

## C1 — Commands

```bash
cd apps/web
supabase link --project-ref vthfrxehrursfloevnlp --yes
supabase migration list
```

## C2 — Drift vs staging session

Same physical project was used for the **staging** apply in the blocker-resolution sprint; **no** second staging ref was proven in CI. **Remote history** after that work included repair of orphan versions and `--include-all` gap fill — **same** chain as current `main` migrations.

## C3 — Remote-only orphan versions

**After** repair in staging sprint: **none** remaining for this project (see `migration list` — no rows with Remote-only and empty Local).

## C4 — Step 7 versions on remote

`migration list` tail (representative): **`20260329140000`–`20260329160000`** present on **both** Local and Remote columns.

## C5 — HiProject (`dqtvxmqyrkxnptqswwyh`)

**Preflight:** `supabase link` **failed** — project **paused**. **No** migration list obtained. **Do not** assume parity with AISTROYKA.

## C6 — Decision

Proceed with **AISTROYKA** preflight only; HiProject blocked until unpaused and designated.
