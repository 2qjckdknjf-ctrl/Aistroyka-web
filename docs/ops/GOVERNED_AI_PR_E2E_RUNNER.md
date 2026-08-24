# Governed AI PR E2E runner (registered manual workflow)

## Purpose

Run authenticated 25-step governed AI + owner evidence E2E against a **Vercel Preview** for an **open same-repo PR**, without merging product code to `main`.

Workflow: `.github/workflows/governed-ai-pr-e2e-runner.yml` (must exist on **`main`** after infra PR #245 merge).

## Architecture (two jobs)

### Job 1 — `trust-boundary-preflight`

- **No** `environment: staging`
- **No** secrets
- Validates: confirmation string, numeric PR, 40-hex SHA, allowlisted Preview host, open same-repo non-fork PR, SHA equals live PR head

### Job 2 — `governed-ai-pr-e2e`

- **`environment: staging`** (required reviewers recommended)
- Checkout exact verified SHA; run `scripts/pilot/governed-ai-owner-evidence-staging-e2e.mjs` from that commit
- Vercel bypass preflight → E2E → redacted artifact

## Security

See `GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`.

- No `pull_request_target`
- No `SUPABASE_SERVICE_ROLE_KEY` (PR-checked-out code must not receive service role)
- Pinned action SHAs; minimal permissions
- Required `PILOT_SMOKE_PROJECT_ID_STAGING` **variable** (no auto project discovery)

## Owner setup

See `GOVERNED_AI_PR_E2E_OWNER_SECRET_SETUP.md`.

## Dispatch inputs

| Input | Example |
|-------|---------|
| `pull_request_number` | `244` |
| `target_sha` | Full 40-char PR head SHA |
| `preview_base_url` | `https://aistroyka-web-web-v7jq-git-fea-....vercel.app` |
| `confirmation` | `RUN_GOVERNED_AI_STAGING_E2E` |

## Invalid targets

- `staging.aistroyka.ai` when SHA is `main`, not PR head
- Preview whose health SHA ≠ input `target_sha`
