# A1 Migration Apply — Access Audit

**Purpose:** Explicit record of what access is available vs not available for closing A1 (migration apply strategy) using MCP, plugins, and tooling. No assumptions; verified or explicitly blocked.  
**Date:** 2026-03-16

---

## 1. What was tested

| Capability | How tested | Result |
|------------|------------|--------|
| **GitHub: gh CLI** | `which gh`; `gh auth status`; `gh api repos/.../actions/workflows` | **gh installed** at `/usr/local/bin/gh`. **Not authenticated:** "You are not logged into any GitHub hosts" / "To use GitHub CLI in automation, set the GH_TOKEN environment variable." Without GH_TOKEN, no API calls (workflows, runs, Settings, Secrets, Environments) are possible. |
| **GitHub: Repository** | Read/write files in repo | **YES.** Can read and edit repo files (workflows, scripts, docs). |
| **GitHub: Actions workflows** | Read `.github/workflows/apply-migrations.yml` | **YES (read-only from repo).** Cannot list runs, trigger workflow_dispatch, or read run logs without GitHub API/auth. |
| **GitHub: Settings / Environments** | No MCP for GitHub; gh api without token fails | **NO.** No tool or MCP in this workspace can read or modify GitHub Settings → Environments. Cannot create or verify environments `staging` / `production`. |
| **GitHub: Secrets** | No MCP for GitHub Secrets; gh requires GH_TOKEN | **NO.** Cannot read, set, or verify repository or environment secrets (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF). |
| **GitHub: Trigger workflow** | workflow_dispatch requires GitHub API with repo scope | **NO.** Cannot trigger "Apply Supabase migrations" from this context. (gh workflow run would require `gh auth login` or GH_TOKEN.) |
| **GitHub: Read workflow run logs** | No API/MCP to fetch run by ID or list runs | **NO.** Cannot retrieve run ID, run URL, or step logs after a run. |
| **Supabase: MCP** | call_mcp_tool for list_projects (plugin-supabase-supabase / user-supabase) | **Partial.** Supabase-related MCP servers exist (e.g. user-supabase with list_migrations, apply_migration, etc.). Project ref **vthfrxehrursfloevnlp** (AISTROYKA) is documented from prior verification. MCP auth is separate from GitHub; cannot inject Supabase token into GitHub Secrets. |
| **Supabase: Credentials for workflow** | Workflow runs on GitHub runners | **NO.** Workflow needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in GitHub Secrets. Those must be set by an operator in GitHub Settings; not settable from this context. |
| **Update docs in repo** | Edit files under docs/closure/ | **YES.** Can create and update all A1 closure docs. |

---

## 2. Access summary

| Area | Available | Not available |
|------|------------|----------------|
| **GitHub repo (files)** | Read and write repo files | — |
| **GitHub API / Actions** | — | List workflows, trigger workflow_dispatch, list runs, read run logs (all require authenticated gh or GitHub API token) |
| **GitHub Settings** | — | Environments (create/verify staging, production), protection rules, required reviewers |
| **GitHub Secrets** | — | Read or set repository/environment secrets |
| **Supabase** | Project ref known (vthfrxehrursfloevnlp); MCP tools may exist for migrations | Cannot set GitHub secrets; workflow runs on GitHub with operator-provided credentials |
| **Docs** | Create/update closure docs | — |

---

## 3. Blockers for full A1 closure from this context

1. **No authenticated GitHub access**  
   Without `GH_TOKEN` (or interactive `gh auth login`), the following cannot be done from this context: trigger the migration workflow, list or read workflow runs, verify or create Environments, verify or set Secrets.

2. **No GitHub Settings / Environments access**  
   No MCP or tool can open GitHub Settings → Environments. Therefore: existence of `staging` and `production` environments, required reviewers on production, and prevent self-review are **not verifiable** here. They must be configured and verified by an operator.

3. **No GitHub Secrets access**  
   SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set in the repo (or per environment) by an operator. Their presence cannot be verified from here; creating or updating them is not possible.

4. **No real staging run**  
   A real staging run requires either: (a) triggering the workflow (needs GitHub API/auth) and (b) the workflow having secrets already set. Since (a) is not available and (b) cannot be verified here, a live staging run **cannot be executed** from this context. Evidence must be produced by an operator per `docs/closure/A1_MIGRATION_APPLY_LIVE_EVIDENCE.md`.

---

## 4. What can be closed from this context

- **Repo and workflow:** Implemented and validated by inspection (workflow_dispatch only, target selection, environment, sanity, preflight, dry-run, apply, log boundaries, no secret echo).
- **Docs:** All A1 closure docs can be created or updated to reflect reality (verified vs not verified, executed vs blocked).
- **Blocker documentation:** Exact missing permissions and operator steps can be written so that an operator can complete the last mile (Environments, Secrets, one staging run, evidence capture) with no ambiguity.

---

## 5. Operator action list (to remove blockers)

| # | Missing | System | Where | Required | Next step after operator does it |
|---|--------|--------|-------|----------|----------------------------------|
| 1 | Create/verify Environments | GitHub | Settings → Environments | Environments named `staging` and `production` | Run workflow with target staging/production; environment will be used. |
| 2 | Set secrets | GitHub | Settings → Secrets and variables → Actions (and/or Environments) | SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF | Workflow can link and run db push. |
| 3 | Production protection (optional) | GitHub | Settings → Environments → production | Required reviewers (and Prevent self-review if desired) | Production runs wait for approval. |
| 4 | One staging run | GitHub | Actions → Apply Supabase migrations → Run workflow | Target = staging; branch e.g. develop | Capture run ID, URL, commit, step results; fill `docs/closure/A1_MIGRATION_APPLY_LIVE_EVIDENCE.md`. |
| 5 | Document production safety | Repo / internal | After verifying production environment | Note in LIVE_EVIDENCE or runbook: "Production has N required reviewers; prevent self-review on/off" | A1 evidence and validation complete. |

---

## 6. Conclusion

**Access is not sufficient** to fully close A1 from this context. Repo implementation and documentation are complete; the remaining steps (Environments, Secrets, one real staging run, evidence capture, production protection verification) depend on **GitHub authentication and Settings access**, which are not available to the automation. The blockers are **external** (permissions and credentials), not design or implementation gaps. Verdict: **A1_PARTIAL_EXTERNAL_BLOCKER** until an operator performs the actions in §5 and records evidence.
