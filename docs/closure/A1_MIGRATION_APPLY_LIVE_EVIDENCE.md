# A1 Migration Apply — Live Evidence

**Purpose:** Record of live workflow execution (or exact procedure to produce it). Required to close A1 with real evidence.  
**Date:** 2026-03-16

---

## Live execution status

| Run type | Executed | Evidence |
|----------|----------|----------|
| Staging workflow run | **YES** | **23239792676** (apply fix) and **23239866842** (docs commit `44ce72d4`): both **success**, `ref=main`, `target=staging`. |
| Production workflow run | **NO** | — |

**Staging A1 path:** Closed for apply workflow. Evidence: `A1_STAGING_MIGRATION_MISMATCH_AUDIT.md` §10–11; commit `106e7233`.

**Blocker for automated live run (historical):** Where GitHub/gh secrets are unavailable, staging runs cannot be triggered from automation alone.

### Access check (MCP / tooling)

| Capability | Available | Notes |
|------------|------------|--------|
| **GitHub: Actions** | **NO** | No MCP for GitHub Actions; no way to list or trigger workflows from this context. |
| **GitHub: Settings** | **NO** | Cannot read or change repo Settings. |
| **GitHub: Environments** | **NO** | Cannot create or verify Environments (staging, production). |
| **GitHub: Secrets** | **NO** | Cannot read or set repository/environment secrets. Cannot safely create SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF from here. |
| **GitHub: Trigger workflow** | **NO** | `gh` CLI present but not authenticated (no GH_TOKEN); no API/MCP to run `workflow_dispatch`. |
| **Supabase: Identify project ref** | **YES** | Supabase MCP `list_projects` works. Project **AISTROYKA** ref: `vthfrxehrursfloevnlp` (ACTIVE_HEALTHY). |
| **Supabase: Auth for migration workflow** | **NO** | Workflow runs on GitHub runners and needs SUPABASE_ACCESS_TOKEN in GitHub Secrets. MCP uses its own Supabase auth; I cannot put that token into GitHub Secrets. |
| **Read workflow run logs** | **NO** | No gh, no GitHub API/MCP to fetch run logs or run ID/URL. |
| **Update docs in repo** | **YES** | Can edit files; docs updated with this access report. |

**Conclusion:** Full A1 closure (create Environments, set Secrets, trigger staging run, collect evidence) **cannot** be done from this context. See `docs/closure/A1_MIGRATION_APPLY_ACCESS_AUDIT.md` for the full access audit. Missing: authenticated GitHub access (GH_TOKEN or gh auth) to trigger workflow and read runs, and GitHub Settings/Secrets access. Operator must run the workflow once and fill the evidence table.

---

## Operator procedure to produce staging evidence

After the first successful **staging** run, an operator should fill the evidence table below (or append a new row) so A1 has concrete proof.

### Steps

1. Ensure **staging** environment and secrets are configured per `docs/closure/A1_MIGRATION_APPLY_ENVIRONMENT_SETUP.md`.
2. In GitHub: **Actions** → **Apply Supabase migrations** → **Run workflow**.
3. Set **Target** to `staging`. Set **ref** to `main` (required if `develop` lacks `scripts/release/`). Run workflow.
4. Wait for the job to complete. If it fails, fix (secrets, link, migration history) and re-run.
5. When the run succeeds, capture:
   - **Workflow run ID** (e.g. from the run URL: `.../actions/runs/<run_id>`).
   - **Run URL** (permalink to the run).
   - **Commit SHA** (from the run summary or Post-apply summary step).
   - **Target** (staging).
   - **Migration sanity:** Passed (step "Migration sanity check").
   - **Migration list:** Ran (step "Preflight — migration list").
   - **Dry-run:** Ran (step "Dry-run (preview migrations to apply)"); note if it reported migrations to apply or "no new migrations".
   - **Db push:** No-op (already up to date) or applied N migrations (from log).
   - **Final status:** success / failure.

6. Paste or summarize the **Post-apply summary** step output (Target, Ref, Commit, Actor).
7. Update this file: set "Staging workflow run" to **YES** and fill the evidence table.

### Evidence table (staging success 2026-03-18)

| Field | Value |
|-------|--------|
| Workflow run ID | 23239866842 (latest green) |
| Run URL | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/23239866842 |
| Commit SHA | 44ce72d4 (main) |
| Branch / ref | main |
| Target | staging |
| Migration sanity | PASSED |
| Migration list ran | YES |
| Dry-run ran | YES (PASS) |
| Db push result | aligned / no pending after local CLI push |
| Final status | success |

---

## Production evidence (optional for A1 closure)

Production run evidence is optional for A1 closure but recommended for audit. If production has required reviewers, document that approval was required and obtained before the run. Do **not** run production apply solely to generate evidence; run it when a release requires it.

---

## Why this was not executed in this task

The automation context (Cursor/agent) does not have:

- Access to the repo’s GitHub Actions secrets.
- Permission to trigger workflows with real credentials.
- Access to GitHub Settings to create or verify Environments and protection rules.

Therefore live execution is an **external** step. This file and the operator procedure above give a precise, repeatable way to produce and record evidence so A1 can be marked closed once the first staging run is documented.
