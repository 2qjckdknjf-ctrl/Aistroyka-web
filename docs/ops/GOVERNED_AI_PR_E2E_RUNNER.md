# Governed AI PR E2E runner (registered manual workflow)

## Purpose

Run authenticated 25-step governed AI + owner evidence E2E against a **Vercel Preview** for an **open same-repo PR**, without merging product code to `main`.

Workflow: `.github/workflows/governed-ai-pr-e2e-runner.yml` (must exist on **`main`** after infra PR #245 merge).

## Architecture (three jobs)

### Job 1 — `trust-boundary-preflight`

- **No** `environment: staging`
- **No** secrets
- Must run from **`refs/heads/main`** workflow definition only
- Validates: confirmation string, numeric PR, 40-hex SHA, **exact** Preview hostname, open same-repo non-fork PR, SHA equals live PR head
- Read-only GitHub Environment check: `staging` must exist with **non-empty** `protection_rules` including `required_reviewers`
- Outputs **canonical** Preview base URL from trusted constants (never forwards raw operator input)

### Job 2 — `governed-ai-pr-e2e`

- Runs only when Job 1 succeeds **and** `github.ref == refs/heads/main` **and** confirmation matches **and** staging environment is protected
- **`environment: staging`** (owner must approve deployment before secrets are exposed)
- Checkout exact verified PR SHA into `pr-workspace/`
- Trusted redaction helper checked out from workflow ref into `trusted-runner-ops/`
- Vercel bypass preflight → E2E → redacted artifact

### Job 3 — `governed-ai-pr-e2e-verdict`

- Fail closed if Job 2 is skipped or failed (prevents false-green when secret job is blocked)

## Canonical Preview hostname

Exact allowlist only — **no wildcards**:

`https://aistroyka-web-web-v7jq-git-fea-3e326e-2qjckdknjf-ctrls-projects.vercel.app`

Source of truth: `apps/web/lib/ops/governed-ai-pr-e2e-runner.constants.ts`

Changing the Preview alias requires a reviewed constants + workflow update.

## Security

See `GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`.

- No `pull_request_target`
- No `SUPABASE_SERVICE_ROLE_KEY` (PR-checked-out code must not receive service role)
- Pinned action SHAs; minimal permissions
- Required `PILOT_SMOKE_PROJECT_ID_STAGING` **variable** (no auto project discovery)
- Raw E2E stdout/stderr never printed to job logs; raw files deleted before upload

## Owner setup sequence

See `GOVERNED_AI_PR_E2E_OWNER_SECRET_SETUP.md`.

1. Merge infra PR #245 to `main`
2. Create/verify GitHub Environment `staging`
3. Add **required reviewer** protection (`protection_rules` must not be empty)
4. Confirm environment metadata via GitHub Settings (workflow fails with `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` until configured)
5. Add environment secrets (not repository-wide secrets when avoidable)
6. Add `PILOT_SMOKE_PROJECT_ID_STAGING` environment variable
7. Dispatch workflow from **`main`**
8. Owner manually approves environment deployment when prompted
9. Review redacted artifact only

## Dispatch inputs

| Input | Example |
|-------|---------|
| `pull_request_number` | `244` |
| `target_sha` | Full 40-char PR head SHA |
| `preview_base_url` | Exact canonical URL above |
| `confirmation` | `RUN_GOVERNED_AI_STAGING_E2E` |

## Invalid targets

- Wildcard or lookalike `vercel.app` hosts
- `staging.aistroyka.ai` when SHA is `main`, not PR head
- Preview whose health SHA ≠ input `target_sha`
- Dispatch from feature-branch workflow YAML
- Dispatch while `staging` environment has empty `protection_rules`
