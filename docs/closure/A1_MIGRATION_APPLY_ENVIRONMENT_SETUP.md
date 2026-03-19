# A1 Migration Apply — GitHub Environment Setup

**Purpose:** Exact operator steps to configure GitHub Environments so the Apply Supabase migrations workflow has correct secrets and, for production, optional approval enforcement.  
**Date:** 2026-03-16

---

## Status

GitHub Environment configuration is **not** verifiable from repo-only tooling. The workflow references `environment: ${{ github.event.inputs.target }}` (staging or production). If the named environments do not exist, GitHub creates them on first use with no protection rules. **To enforce production approval, an operator must configure the "production" environment explicitly.**

This doc is the single source of truth for what to configure and how.

---

## 1. Create environments (if absent)

1. Open the repo on GitHub.
2. **Settings** → **Environments** (left sidebar under "Code and automation").
3. If **staging** is not listed, click **New environment**, name it exactly `staging`, click **Configure environment**.
4. If **production** is not listed, click **New environment**, name it exactly `production`, click **Configure environment**.

Names must be lowercase `staging` and `production` to match the workflow input options.

---

## 2. Environment secrets

For each environment (staging, production) you can use either:

- **Repository secrets** — same `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` for both if you have one Supabase project; workflow will use them when the job runs with that environment.
- **Environment secrets** — different values per environment (e.g. different Supabase project refs for staging vs production).

**To add repository secrets:**

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**: name `SUPABASE_ACCESS_TOKEN`, value = your Supabase access token (e.g. from Supabase Dashboard → Account → Access Tokens).
3. **New repository secret**: name `SUPABASE_PROJECT_REF`, value = your Supabase project reference ID (from the project URL: `https://supabase.com/dashboard/project/<SUPABASE_PROJECT_REF>`).

**To add environment secrets (per-environment):**

1. **Settings** → **Environments** → click **staging** (or **production**).
2. Under **Environment secrets**, **Add secret**: `SUPABASE_ACCESS_TOKEN`, then `SUPABASE_PROJECT_REF`.
3. Repeat for the other environment with the appropriate values.

Environment secrets override repository secrets when the job runs with that environment.

---

## 3. Production approval (required reviewers)

To require a human approval before the production migration job runs:

1. **Settings** → **Environments** → **production**.
2. Under **Environment protection rules**, enable **Required reviewers**.
3. Add one or more GitHub users or teams as reviewers. These identities must have permission to approve workflow runs.
4. (Recommended) If your plan supports it, enable **Prevent self-review** so the person who triggered the run cannot approve it. If the option is not visible, your plan may not support it; document that in your internal runbook.

**Verified by:** Manual check in GitHub Settings → Environments → production. Repo-only validation cannot confirm this; an operator must verify and document (e.g. in A1_MIGRATION_APPLY_LIVE_EVIDENCE.md or internal checklist).

---

## 4. What the workflow expects

| Item | Expectation |
|------|-------------|
| Environments | Names `staging` and `production` (created automatically on first run if missing, or created by operator per above). |
| Secrets | `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` available to the job (repo-level or environment-level). |
| Production approval | Optional. If "production" has Required reviewers, the job waits for approval before running. |

---

## 5. External limitation

- **Branch restrictions** on environments (e.g. "production" only from `main`) are optional. If used, ensure the workflow's default ref (main for production, develop for staging) matches your rules; otherwise the operator must supply the correct ref in the workflow input.
- **Prevent self-review** and **Required reviewers** depend on GitHub plan and repo permissions. If options are missing, document the limitation and rely on workflow_dispatch + explicit target selection as the control.

---

## 6. Verification checklist (operator)

After configuration, confirm:

- [ ] Environments **staging** and **production** exist (Settings → Environments).
- [ ] For production: **Required reviewers** is configured (and **Prevent self-review** if available).
- [ ] Secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are set (repository and/or per environment) and not visible in logs.
- [ ] One test run with target **staging** (and optionally **production** after approval) to confirm the job can link and run Supabase CLI.

Document the outcome (e.g. "Production environment has 2 required reviewers; prevent self-review enabled") in your internal runbook or in `docs/closure/A1_MIGRATION_APPLY_LIVE_EVIDENCE.md` when you capture the first successful run.
