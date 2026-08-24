# Governed AI PR E2E runner (registered manual workflow)

## Purpose

Run authenticated 25-step governed AI + owner evidence E2E against a **Vercel Preview** deployment for an **open same-repo PR**, without merging the PR to register product code on `main`.

The workflow file lives on **`main`** (`.github/workflows/governed-ai-pr-e2e-runner.yml`). The executable E2E script is taken from the **exact verified PR head SHA** checked out after GitHub API trust-boundary validation.

## Security properties

- Trigger: `workflow_dispatch` only
- Protected environment: `staging`
- Permissions: `contents: read`, `pull-requests: read` (no write permissions)
- No `pull_request_target`
- No migration apply, no production deploy, no PR merge
- PR must be open, same-repo, non-fork; input `target_sha` must equal live PR head SHA (fail closed on drift)
- Preview URL must be `https://*.vercel.app` without bypass query params
- Secrets are never printed; artifacts are redacted (no cookies, tokens, signed URLs, or passwords)
- Third-party actions pinned by immutable commit SHA

## Required repository secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel Deployment Protection bypass header |
| `PILOT_SMOKE_EMAIL_STAGING` | Worker QA login |
| `PILOT_SMOKE_PASSWORD_STAGING` | Worker QA login |
| `PILOT_E2E_MANAGER_EMAIL` | Manager QA login (distinct identity) |
| `PILOT_E2E_MANAGER_PASSWORD` | Manager QA login |
| `STAKEHOLDER_SMOKE_EMAIL` | Owner/stakeholder QA login |
| `STAKEHOLDER_SMOKE_PASSWORD` | Owner/stakeholder QA login |
| `NEXT_PUBLIC_SUPABASE_URL_STAGING` | Staging Supabase alignment check |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING` | Worker storage upload JWT helper |

Optional (recommended):

| Secret | Purpose |
|--------|---------|
| `PILOT_SMOKE_PROJECT_ID_STAGING` | Pin QA project |
| `SUPABASE_SERVICE_ROLE_KEY_STAGING` | Post-run cleanup only |
| `PILOT_E2E_STAKEHOLDER_REVOKED_*` | Step 23 revoked persona |
| `PILOT_E2E_CROSS_TENANT_*` | Step 24 cross-tenant persona |

## Manual dispatch inputs

| Input | Example |
|-------|---------|
| `pull_request_number` | `244` |
| `target_sha` | Full PR head SHA (must match live PR head) |
| `preview_base_url` | `https://aistroyka-web-web-v7jq-git-fea-3e326e-2qjckdknjf-ctrls-projects.vercel.app` |
| `confirmation` | `RUN_GOVERNED_AI_STAGING_E2E` |

## Preflight

1. GitHub API validates PR #, open state, same-repo, non-fork, head SHA
2. Checkout exact `target_sha`; verify `git rev-parse HEAD`
3. Secret presence check (names only)
4. `GET /api/v1/health` on Preview with bypass header — must not be 302; `buildStamp.sha7` must match `target_sha`; `db` must be `ok`
5. Staging Supabase ref check via secret URL host (no value logged)

## Not valid E2E targets

- `https://staging.aistroyka.ai` when `buildStamp.sha7` is `main`, not the PR head
- Cloudflare Workers commit previews without Vercel bypass preflight
- Any Preview whose health SHA ≠ input `target_sha`

## Owner sequence

1. Merge this infra PR to `main` (owner approval)
2. Add missing secrets listed above
3. Dispatch workflow for PR #244 with current head SHA and matching Vercel Preview URL
4. After PASS, mark product PR #244 Ready for review (separate step; do not merge via this workflow)
