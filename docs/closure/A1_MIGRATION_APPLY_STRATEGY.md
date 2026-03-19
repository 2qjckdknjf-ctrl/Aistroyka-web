# A1 Migration Apply — Strategy

**Purpose:** Chosen strategy for closing the migration-apply release-discipline tail.  
**Date:** 2026-03-16

---

## Current state

- **Check:** Migration sanity script (`scripts/release/check-migrations.sh`) exists but is **not** run in any CI workflow. Deploy workflows do not run it.
- **Apply:** Manual only: operator runs `scripts/release/apply-migrations.sh` (or `supabase db push` in `apps/web`) with a locally linked project, or applies via Supabase Dashboard / one-off scripts.
- **Risk:** Wrong target (e.g. production instead of staging), no enforced preflight (list/repair), no approval for production, no audit trail in GitHub Actions.

See `docs/closure/A1_MIGRATION_APPLY_INVENTORY.md` for full inventory.

---

## Chosen strategy

**Option 2 (acceptable):** Dedicated **workflow_dispatch** migration workflow with explicit target selection, strict validation, no secret leakage, clear runbook, and explicit operator evidence.

- **Why not Option 1 (protected environment approval as primary):** GitHub Environments are **available** but not yet used in this repo. The workflow is implemented to **use** `environment: ${{ inputs.target }}` so that, once "staging" and "production" environments exist and "production" has required reviewers, production runs will wait for approval. That gives a path to Option 1 without blocking closure.
- **Why not full automation on push:** Automatic DB mutation on push was explicitly rejected: "DO NOT invent unsafe automatic DB mutation just to make the workflow look fully automated." Production apply must require explicit human action.
- **Why Option 2 over Option 3:** A workflow is realistic: Supabase CLI can run in CI with token + project ref; no blocker to a workflow_dispatch job. Option 3 (script + runbook only) would be used only if workflow were blocked.

---

## Why more aggressive automation was rejected

- **Auto-apply on push to main:** Would mutate production DB without explicit operator confirmation; violates the non-negotiable principle.
- **Auto-apply after deploy:** Same risk; also couples DB apply to deploy, which increases blast radius and makes rollback semantics unclear.
- **Silent apply in same job as deploy:** Would hide DB mutation inside a generic deploy job; forbidden by requirement "Do not hide DB mutation inside a generic deploy job."

---

## Staging path

1. Operator goes to Actions → **Apply Supabase migrations** → Run workflow.
2. Select **Target:** `staging`.
3. (Optional) If GitHub Environment "staging" exists with protection, complete any required steps.
4. Workflow runs: migration sanity → install Supabase CLI → link to staging project ref → `supabase migration list` (preflight) → `supabase db push`.
5. Success/failure and logs are visible in the workflow run.

Secrets: `SUPABASE_ACCESS_TOKEN` (repo or environment); staging project ref via environment secret `SUPABASE_PROJECT_REF` in environment "staging" or repo secret if single project.

---

## Production path

1. Operator goes to Actions → **Apply Supabase migrations** → Run workflow.
2. Select **Target:** `production`.
3. If Environment "production" has **required reviewers**, the job waits for approval before running.
4. After approval (or if no protection), job runs same steps as staging against production project ref.
5. Success/failure and logs are visible in the workflow run.

Production safety control: **Explicit workflow_dispatch** (no trigger on push) + **optional Environment approval** when "production" environment is configured with required reviewers.

---

## Required secrets / config

| Name | Where | Purpose |
|------|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | Repo secrets (or in each environment) | Supabase CLI auth for link and db push |
| `SUPABASE_PROJECT_REF` | Environment "staging" and/or "production" (or repo if single project) | Project ref for `supabase link --project-ref` |

- Do **not** log or echo tokens or project refs. Workflow uses `${{ secrets.SUPABASE_ACCESS_TOKEN }}` and masks values.
- If only one Supabase project is used for both, one repo-level `SUPABASE_PROJECT_REF` is enough; then staging vs production is logical (same DB). For two DBs, use environment-specific secrets.

---

## Enforced controls (repo/workflow)

1. **No push trigger:** Workflow runs only on `workflow_dispatch`. No automatic run on push to main or develop.
2. **Explicit target:** Operator must choose `staging` or `production`; workflow uses that to select environment and project ref.
3. **Migration sanity:** Workflow runs `scripts/release/check-migrations.sh` before any DB action; fails the job if invalid.
4. **Preflight:** Workflow runs `supabase migration list` before apply so drift is visible in logs.
5. **Dry-run:** Workflow runs `supabase db push --dry-run` before real push; shows which migrations would be applied (no DB changes). Log boundaries "--- DRY RUN ---" and "--- APPLY BOUNDARY ---" make the apply step explicit in logs.
6. **Secrets:** Token and project ref from secrets; not echoed; GitHub masks secret values in logs.
7. **Audit:** Every apply is a workflow run with commit SHA, actor, and timestamp.

## Optional controls (operator-configured)

8. **Production approval:** If GitHub Environment "production" has **Required reviewers** (Settings → Environments → production), the job waits for approval before running. Not verifiable from repo; operator must configure per `docs/closure/A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md`.
9. **Prevent self-review:** If the GitHub plan supports it, enable on the production environment so the person who triggered the run cannot approve it.

## Exact remaining limitations

- Migration sanity is **not** wired into deploy workflows (only into the migration-apply workflow). Adding it to deploy is a separate gate decision (not in A1 scope).
- If `supabase migration list` shows history mismatch, the workflow does **not** auto-repair; the runbook tells the operator to resolve (repair or abort) before re-running.
- Rollback of migrations is out of scope; runbook references "fix forward or restore from backup" per existing docs.
- **Dry-run:** `supabase db push --dry-run` shows which migrations would be applied but does **not** validate that the SQL will execute successfully (Supabase CLI limitation). It is a preview only.
- **GitHub environment enforcement:** Whether production has required reviewers is external (Settings access). Repo provides the workflow and the setup doc; verification is operator responsibility.

## Production safety truth (as of access audit)

Production is **not verified** as protected from this context. No tool or MCP here can read GitHub Settings → Environments. Therefore: **production is externally blocked for verification** until an operator confirms in GitHub that the "production" environment exists and, if desired, has required reviewers (and prevent self-review) configured. Do not claim production approval is active without that verification. See `docs/closure/A1_MIGRATION_APPLY_ACCESS_AUDIT.md` and `A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md`.
