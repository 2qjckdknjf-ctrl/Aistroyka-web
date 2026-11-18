# Hosted apply — private helper grants + platform job binding — 2026-10-28

## Scope

Apply the already-merged SQL from:

- PR #447 `harden_private_helper_execute_grants`
- PR #457 `ai_analysis_platform_job_binding`

Active project: AISTROYKA `vthfrxehrursfloevnlp` (eu-central-1). No business data mutation.

## Applied versions (MCP `apply_migration`)

| Repo file | Remote name | Remote version |
|---|---|---|
| `20261013090432_harden_private_helper_execute_grants.sql` | `harden_private_helper_execute_grants` | `20261028121959` |
| `20261028120000_ai_analysis_platform_job_binding.sql` | `ai_analysis_platform_job_binding` | `20261028122004` |

Timestamp skew between repo filenames and remote versions is expected for MCP apply; object SQL equivalence is the contract.

## Verification

Private helpers (sample):

- `project_belongs_to_tenant` / membership helpers: `anon_exec=false`, `auth_exec=true`, `service_exec=true`
- Trigger guards (`enforce_*`, `media_protect_file_url`, `jobs_protect_payload_project_tenant`): `anon_exec=false`, `auth_exec=false`, `service_exec=true`

`ai_analysis.platform_job_id`:

- column present (`uuid`, nullable)
- unique partial index `one_ai_analysis_per_platform_job` present

## Runtime note

At apply time, production health already served `buildStamp.sha7=037aca9` (#457 merge). Staging later advanced through #448/#449 merges. Live Worker upload→job→result→retry→review remains a separate evidence scenario after the human-review gate ships.

## Verdict

**YES** for hosted apply of #447/#447 SQL and schema binding. Not a claim of full Vision/Graph lineage completion.
