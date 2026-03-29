# Wave 4 Step 7 — Production path truth

**Date:** 2026-03-29

## Canonical production apply path

1. **GitHub Actions (recommended for audit trail):**  
   **Actions** → **Apply Supabase migrations** → `workflow_dispatch` → target **`production`** → ref **`main`**.  
   Uses secrets in GitHub Environment **`production`**: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`.

2. **Local CLI (operator):**  
   ```bash
   cd apps/web
   supabase link --project-ref "$SUPABASE_PROJECT_REF"
   supabase migration list
   supabase db push --include-all --dry-run --yes
   supabase db push --include-all --yes
   ```

## Production Supabase target (this org)

`supabase projects list` (access token–scoped) shows:

| Name | Reference ID | Notes |
|------|----------------|-------|
| **AISTROYKA** | `vthfrxehrursfloevnlp` | Active; **linked** for CLI in this session; matches app `NEXT_PUBLIC_SUPABASE_URL` host used for development. |
| **HiProject** | `dqtvxmqyrkxnptqswwyh` | **Paused** at time of check — `supabase link` returns “project is paused”. **Not** used for rollout here. |

**Conclusion:** Production web DB for the shipped product is **AISTROYKA** (`vthfrxehrursfloevnlp`). **HiProject** is out of scope until unpaused and explicitly designated.

## Blocker (if using HiProject)

Unpause in Supabase Dashboard or do not treat as migration target.
