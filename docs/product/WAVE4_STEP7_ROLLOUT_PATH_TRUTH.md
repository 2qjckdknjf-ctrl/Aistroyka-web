# Wave 4 Step 7 — Rollout path truth (repo-authoritative)

**Date:** 2026-03-29  
**Operator:** Cursor / local CLI session (evidence captured in rollout reports)

## A1 — Canonical apply path

| Layer | Mechanism |
|-------|-----------|
| **Primary (CI)** | GitHub Actions workflow `.github/workflows/apply-migrations.yml` — `workflow_dispatch`, target `staging` or `production` |
| **Working directory** | `apps/web` (all `supabase` CLI steps use `working-directory: apps/web`) |
| **CLI** | Official Supabase CLI via `supabase/setup-cli@v1` (workflow) or local install |
| **Commands** | `supabase link --project-ref "$SUPABASE_PROJECT_REF"` → `supabase migration list` → `supabase db push --dry-run --yes` → `supabase db push --yes` |
| **Preflight** | `bash scripts/release/check-env-config.sh migrations` (requires `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`) |
| **Sanity** | `bash scripts/release/check-migrations.sh` — filename timestamps, no duplicates, **no future-dated migrations vs UTC today** |

## A2 — Alternate local operator path

| Script | Purpose |
|--------|---------|
| `scripts/release/apply-migrations.sh` | From repo root; `cd apps/web` and `supabase db push` (expects prior `supabase link`) |
| `apps/web` `npm run db:migrate` | `scripts/run-migrations.mjs` — direct `SUPABASE_DB_URL` execution of SQL files; **does not** use Supabase migration history the same way as `db push`; use only if explicitly agreed (not the default CI path) |

## A3 — Staging vs production targets

| Target | How ref is chosen |
|--------|-------------------|
| **staging** | GitHub Environment **`staging`** — secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` scoped to that environment |
| **production** | GitHub Environment **`production`** — same secret **names**, different values |

The workflow does **not** embed project IDs in the repo; operators configure them in GitHub.

## A4 — Required auth / secrets (never log values)

- `SUPABASE_ACCESS_TOKEN` — Supabase dashboard access token  
- `SUPABASE_PROJECT_REF` — project ref for the **selected** environment  

## A5 — Branch defaults (workflow)

- `staging` default ref: `develop` (if `ref` input empty)  
- `production` default ref: `main`  

## A6 — Local link state (this workspace)

A developer machine may have `apps/web/supabase` linked via `supabase link`; **project ref** is not a secret but is **environment-specific**. Rollout evidence in this sprint used whatever project was linked locally — **not** a substitute for GitHub Environment staging/production unless explicitly confirmed.
