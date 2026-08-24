# Governed AI PR E2E runner (registered manual workflow)

## Purpose

Run authenticated 25-step governed AI + owner evidence E2E against a **Vercel Preview** for an **open same-repo PR**, without merging product code to `main`.

Workflow: `.github/workflows/governed-ai-pr-e2e-runner.yml` (must exist on **`main`**).

## Architecture (four jobs)

### Job 1 — `trust-boundary-preflight`

- **No** `environment: staging`
- **No** secrets
- Must run from **`refs/heads/main`** workflow definition only
- Validates: confirmation string, numeric PR, 40-hex SHA, positive decimal `deployment_id`, open same-repo non-fork PR, SHA equals live PR head
- Fetches GitHub Deployment by ID; binds SHA/environment/Vercel integration/latest success status/`environment_url`
- Compares operator `preview_base_url` to trusted deployment URL
- Read-only GitHub Environment check: protected `staging` with required reviewers + main-only deployment branch policy
- Outputs **canonical** Preview base URL from GitHub deployment metadata (never forwards raw operator input)
- Uploads sanitized `deployment-binding-evidence.json` artifact (no secrets)

### Job 2 — `governed-ai-pr-e2e`

- Runs only when Job 1 succeeds **and** `github.ref == refs/heads/main` **and** confirmation matches **and** staging environment is protected
- **`environment: staging`** (owner must approve deployment before secrets are exposed)
- Revalidates PR head + deployment binding **before** PR checkout
- Checkout exact verified PR SHA into `pr-workspace/`
- Trusted deployment-binding helpers checked out from workflow ref into `trusted-runner-ops/`
- Vercel bypass preflight → E2E harness only (raw `e2e-result.json` uploaded for Job 3; retention 1 day)
- **Does not** run trusted redaction or verdict validation in-process with PR-controlled code

### Job 3 — `governed-ai-pr-e2e-postprocess`

- Fresh runner VM (process isolation from PR-controlled E2E)
- **`environment: staging`** (for `REDACT_*` secrets only)
- Downloads raw E2E artifact; checks out trusted redactor/verdict from workflow ref
- Redacts evidence; validates harness exit code **0**, exact verdict **`PROVEN`**, and **25/25 step results with exact status `PASS`**
- Uploads redacted artifact only (14-day retention); deletes raw files before finish
- `BLOCKED_EXTERNAL` / partial optional steps are **blockers**, not acceptable warnings

### Job 4 — `governed-ai-pr-e2e-verdict`

- Fail closed if Job 2 or Job 3 is skipped or failed (prevents false-green when secret jobs are blocked)

## Preview URL trust model

**Do not** pin a static Preview hostname on `main`.

For each dispatch, operator supplies the GitHub **Deployment ID** for the Vercel Preview (from PR deployment/checks). The runner validates:

1. Deployment belongs to `2qjckdknjf-ctrl/Aistroyka-web`
2. Deployment SHA = `target_sha`
3. Environment = `Preview`
4. Created by trusted Vercel GitHub integration
5. Latest status = `success` with `environment_url`
6. Operator `preview_base_url` exactly matches trusted URL

Source of truth modules:

- `apps/web/lib/ops/governed-ai-pr-e2e-runner.deployment-binding.ts`
- `apps/web/lib/ops/governed-ai-pr-e2e-runner.constants.ts`

## Security

See `GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`.

- No `pull_request_target`
- No `SUPABASE_SERVICE_ROLE_KEY` (PR-checked-out code must not receive service role)
- Pinned action SHAs; minimal permissions
- Required `PILOT_SMOKE_PROJECT_ID_STAGING` **variable** (no auto project discovery)
- Raw E2E stdout/stderr never printed to job logs; raw files deleted in Job 3 before redacted upload

## Owner setup sequence

See `GOVERNED_AI_PR_E2E_OWNER_SECRET_SETUP.md`.

## Dispatch inputs

| Input | Example |
|-------|---------|
| `pull_request_number` | `244` |
| `target_sha` | Full 40-char PR head SHA |
| `deployment_id` | GitHub Deployment ID (e.g. `6064462333`) |
| `preview_base_url` | Exact URL from deployment status `environment_url` |
| `confirmation` | `RUN_GOVERNED_AI_STAGING_E2E` |

### Example (do not run without owner gates)

```bash
gh workflow run "Governed AI PR E2E runner (manual)" \
  --repo 2qjckdknjf-ctrl/Aistroyka-web \
  --ref main \
  -f pull_request_number=244 \
  -f target_sha=628bb6b1ac08c1fffe9078ff6627774995c95fdb \
  -f deployment_id=6064462333 \
  -f preview_base_url=https://aistroyka-web-web-v7jq-8of2zsc02-2qjckdknjf-ctrls-projects.vercel.app \
  -f confirmation=RUN_GOVERNED_AI_STAGING_E2E
```

## Invalid targets

- Deployment for a different SHA/repo/environment
- Untrusted deployment creator
- Wildcard or lookalike `vercel.app` hosts not matching GitHub deployment metadata
- `staging.aistroyka.ai` when SHA is not PR head
- Preview whose health SHA ≠ input `target_sha`
- Dispatch from feature-branch workflow YAML
