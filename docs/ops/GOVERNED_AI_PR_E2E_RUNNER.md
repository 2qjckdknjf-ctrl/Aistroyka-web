# Governed AI PR E2E runner (registered manual workflow)

## Purpose

Run authenticated 25-step governed AI + owner evidence E2E against a **Vercel Preview** for an **open same-repo PR**, without merging product code to `main`.

Workflow: `.github/workflows/governed-ai-pr-e2e-runner.yml` (must exist on **`main`**).

## Architecture (six jobs)

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

### Job 2 — `governed-ai-pr-e2e-staging-gate`

- Runs only when Job 1 succeeds **and** `github.ref == refs/heads/main` **and** confirmation matches **and** staging environment is protected
- **`environment: staging`** (owner must approve deployment before secrets are exposed)
- Revalidates PR head + deployment binding — **no PR checkout**
- Secret-name preflight including `GOVERNED_E2E_SEAL_PRIVATE_KEY` (fail closed if missing)
- Vercel bypass + deployment SHA preflight

### Job 3 — `governed-ai-pr-e2e-harness`

- **`environment: staging`**
- Checkout exact verified PR SHA into `pr-workspace/` with `persist-credentials: false`
- Trusted harness runner ops from workflow ref in `trusted-runner-ops/`
- E2E via sanitized `env -i` subprocess (`run-harness.mjs`) — no `GITHUB_*` / `ACTIONS_*` passed to PR-controlled `node`
- Post-E2E deployment + PR head revalidation
- Stage raw harness transfer files (`e2e-result.json`, stderr, exit code); upload **harness transfer artifact only** (no encryption in harness UID)
- **Does not** seal, save Actions cache, or run redaction/verdict

### Job 4 — `governed-ai-pr-e2e-seal`

- Fresh runner VM; **no PR checkout**; `contents: read` only (no `actions: write`)
- Trusted dispatch-pinned seal ops only
- Downloads harness transfer artifact; seals with RSA-OAEP + AES-256-GCM (committed public key)
- Verifies manifest binding + AEAD authentication with `GOVERNED_E2E_SEAL_PRIVATE_KEY`
- Uploads **authenticated sealed bundle artifact** for postprocess (no Actions cache)

### Job 5 — `governed-ai-pr-e2e-postprocess`

- Fresh runner VM
- **`environment: staging`** (for `REDACT_*` + seal private key)
- Downloads sealed artifact from seal job (run-scoped name); unseal to private workspace
- Trusted redactor/verdict from workflow ref (`REDACT_*` includes QA persona emails)
- Uploads redacted artifact only (14-day retention); deletes raw files before finish

### Job 6 — `governed-ai-pr-e2e-verdict`

- Fail closed if staging gate, harness, seal, or postprocess is skipped or failed

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
- `apps/web/lib/ops/governed-ai-pr-e2e-runner.seal-crypto.ts`

## Security

See `GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`.

- No `pull_request_target`
- No `SUPABASE_SERVICE_ROLE_KEY` (PR-checked-out code must not receive service role)
- Pinned action SHAs; minimal permissions
- Required `PILOT_SMOKE_PROJECT_ID_STAGING` **variable** (no auto project discovery)
- Required `GOVERNED_E2E_SEAL_PRIVATE_KEY` on protected `staging` (see `GOVERNED_AI_PR_E2E_OWNER_SECRET_SETUP.md`)
- Raw E2E stdout/stderr never printed to job logs; plaintext deleted before encrypted artifact upload

## Dispatch inputs

| Input | Required | Notes |
|-------|----------|-------|
| `pull_request_number` | yes | Open same-repo PR |
| `target_sha` | yes | 40 lowercase hex chars; must equal live PR head |
| `deployment_id` | yes | Positive decimal GitHub Deployment ID |
| `preview_base_url` | yes | Must match deployment latest success `environment_url` |
| `confirmation` | yes | Exact `RUN_GOVERNED_AI_STAGING_E2E` |

## Owner setup

See `GOVERNED_AI_PR_E2E_OWNER_SECRET_SETUP.md`.
