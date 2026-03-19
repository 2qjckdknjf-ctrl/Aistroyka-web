# A1 Migration Apply — Runbook

**Purpose:** Operator runbook for applying Supabase migrations to staging and production.  
**Date:** 2026-03-16

---

## Prerequisites

- Migrations in `apps/web/supabase/migrations/` are committed and pushed (branch that you intend to apply).
- GitHub repo has secrets configured (see **Required secrets** below).
- For **production:** Only designated release operators should run production apply; use Environment "production" with required reviewers if available.

**Required secrets**

- **SUPABASE_ACCESS_TOKEN** — Supabase access token (Settings → Access Tokens or equivalent). Stored in repo or environment secrets; never logged.
- **SUPABASE_PROJECT_REF** — Supabase project reference ID (e.g. from project URL). Use environment secrets for "staging" and "production" if you have two projects, or one repo secret if single project.

**GitHub Environments:** The workflow uses `environment: staging` or `environment: production`. Ensure these environments exist (Settings → Environments). Add the secrets above to each environment (or at repo level for a single project). For production, you can set required reviewers on the "production" environment to add an approval gate. See `docs/closure/A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md` for exact setup steps.

**Workflow steps (in order):** Check required secrets → Checkout → Migration sanity check → Setup Supabase CLI → Link Supabase project → Preflight (migration list) → Dry-run (preview) → Apply migrations (db push) → Post-apply summary.

---

## How to run staging migration apply

1. In GitHub: **Actions** → **Apply Supabase migrations** → **Run workflow**.
2. Choose branch (e.g. `develop` or the branch with migrations you want).
3. Set **Target** to `staging`.
4. Click **Run workflow**.
5. Wait for the job. If Environment "staging" has protection rules, complete them.
6. Check the job log:
   - **Success:** Steps "Dry-run (preview migrations to apply)" and "Apply migrations (db push)" complete; apply step shows "--- APPLY COMPLETE ---" and Supabase CLI success (or "Already up to date").
   - **Failure:** See "What to do if command fails" below.

---

## How to run production migration apply

1. In GitHub: **Actions** → **Apply Supabase migrations** → **Run workflow**.
2. Choose branch (e.g. `main` — only apply migrations that are already merged and intended for production).
3. Set **Target** to `production`.
4. Click **Run workflow**.
5. If Environment **production** has **required reviewers**, the job will wait for approval. Designated approver(s) approve the run.
6. After approval (or if no protection), the job runs. Check the job log for success or failure.

**Who should approve/execute production apply:** Release operator or designated DBA/backend lead. Same role that would run `supabase db push` manually; workflow only moves the action into CI with audit trail and optional approval.

---

## Expected success output

- **Migration sanity:** Log line like "Migration sanity check PASSED (N migrations)".
- **Preflight:** "Preflight — migration list" step shows local and remote list; remote may show applied versions.
- **Dry-run:** "Dry-run (preview migrations to apply)" step shows "--- DRY RUN ---" and which migrations would be applied (or that there are none); "--- END DRY RUN ---".
- **Apply:** "Apply migrations (db push)" step shows "--- APPLY BOUNDARY ---", then Supabase CLI output ("Applying migration ..." or "Already up to date"), then "--- APPLY COMPLETE ---".
- **Job:** Green check; Post-apply summary shows Target, Ref, Commit, Actor.

---

## What to do if command fails

- **Sanity check failed:** Fix migration filenames (no future-dated, no duplicate timestamps, strict order). Re-run after fix.
- **Link failed:** Check SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF for the chosen target. Ensure token is valid and project ref matches the correct Supabase project.
- **supabase db push failed:** Read the error in the log. Common cases:
  - **History mismatch:** Remote has migrations not in local or vice versa. Do **not** blindly re-push. See "What to do if migration history is out of sync."
  - **SQL error:** A migration failed (e.g. object already exists, constraint violation). Fix forward (new migration or fix in branch) and re-run after code fix; or resolve in Supabase Dashboard and use repair if needed.
- **Job timeout:** Rare; retry. If it persists, run apply locally with `scripts/release/apply-migrations.sh` and document in the run.

---

## What to do if migration history is out of sync

- Run `supabase migration list` locally (or inspect the workflow log) to compare local vs remote.
- **Do not** patch tables manually to "match" history; use the **official repair flow** when appropriate.
- **When to use official migration repair:** When the remote `supabase_migrations.schema_migrations` table has incorrect or missing rows (e.g. migration was applied by hand or from another branch and history diverged). Use `supabase migration repair --status applied <version>` or `--status reverted <version>` per Supabase docs to align history, then re-run apply.
- **When NOT to proceed:** When you are unsure which project the workflow targeted, when the branch does not match the intended codebase, or when repair would mark as applied a migration that was never run. Resolve drift with the team before applying.

---

## When NOT to proceed

- Do not run production apply from a feature branch unless explicitly agreed (e.g. hotfix). Prefer applying from `main` after migrations are merged.
- Do not run apply if migration sanity check has not passed (fix filenames first).
- Do not run production apply without confirming the correct Supabase project (project ref) and that required reviewers (if any) are available.
- Do not paste or log SUPABASE_ACCESS_TOKEN or database URLs.

---

## When to use official migration repair flow

- Remote migration history is out of sync with reality (e.g. migration was applied manually or version numbers were remapped).
- Supabase CLI refuses to push because it thinks a migration is already applied (or not) and you have verified the actual schema state.
- After repairing, re-run the workflow or run `supabase db push` locally and verify.

See `docs/db/STEP13_MIGRATION_GOVERNANCE_SAFEGUARDS.md` and Supabase docs for `supabase migration repair`.

---

## Reference

- Migration order and verify queries: `docs/pilot-launch/DB_MIGRATION_APPLY_SEQUENCE.md`
- Governance and anti-patterns: `docs/db/STEP13_MIGRATION_GOVERNANCE_SAFEGUARDS.md`
- Inventory and strategy: `docs/closure/A1_MIGRATION_APPLY_INVENTORY.md`, `docs/closure/A1_MIGRATION_APPLY_STRATEGY.md`
- Access audit (what can/cannot be done from automation): `docs/closure/A1_MIGRATION_APPLY_ACCESS_AUDIT.md`
- Environment setup: `docs/closure/A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md`
- Validation and live evidence: `docs/closure/A1_MIGRATION_APPLY_VALIDATION.md`, `docs/closure/A1_MIGRATION_APPLY_LIVE_EVIDENCE.md`
