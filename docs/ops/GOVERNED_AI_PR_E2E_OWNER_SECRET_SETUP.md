# Governed AI PR E2E runner — owner secret setup

Configure staging credentials **without pasting values into PRs, chat, or commits**.

## Owner setup sequence (required order)

1. **Merge infra PR #245** into `main` (registers workflow on default branch).
2. Open GitHub → repository **Settings** → **Environments** → create or verify **`staging`**.
3. Enable **Required reviewers** for `staging` (owner approval before secrets deploy).
4. Confirm `protection_rules` is **not empty** (workflow preflight fails with `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` until configured).
5. **Only then** add environment secrets and the QA project variable below.
6. Dispatch **Governed AI PR E2E runner** from **`main`** with exact PR head SHA and canonical Preview URL.
7. When GitHub prompts for environment approval, **owner manually approves** the deployment.
8. Review the **redacted** workflow artifact only (never paste secrets into dispatch inputs).

Prefer **Environment secrets/variables** on protected `staging` over repository-wide secrets for runner credentials.

## Vercel — automation bypass

1. Open Vercel → project **`aistroyka-web-web-v7jq`**
2. **Settings** → **Deployment Protection**
3. Enable **Protection Bypass for Automation** (if not already)
4. Create or copy the **Automation Bypass** secret
5. Store it as GitHub Environment secret `VERCEL_AUTOMATION_BYPASS_SECRET` on **`staging`**

Do not append bypass tokens to Preview URLs in workflow inputs or documentation.

## GitHub — protected `staging` environment

1. Repository **Settings** → **Environments** → **`staging`**
2. **Required reviewers** — add at least one owner reviewer (mandatory before first dispatch)
3. Add **Environment secrets**:

| Secret | Purpose |
|--------|---------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel Deployment Protection bypass header |
| `PILOT_E2E_MANAGER_EMAIL` | Manager QA account (distinct from worker) |
| `PILOT_E2E_MANAGER_PASSWORD` | Manager QA password |

4. Verify these exist (move to Environment if currently repository-level):

| Secret | Purpose |
|--------|---------|
| `PILOT_SMOKE_EMAIL_STAGING` | Worker QA login |
| `PILOT_SMOKE_PASSWORD_STAGING` | Worker QA password |
| `STAKEHOLDER_SMOKE_EMAIL` | Owner/stakeholder QA login |
| `STAKEHOLDER_SMOKE_PASSWORD` | Owner/stakeholder QA password |
| `NEXT_PUBLIC_SUPABASE_URL_STAGING` | Staging Supabase (must reference `vthfrxehrursfloevnlp`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING` | Staging anon key |

5. Add **Environment variable** (not secret):

| Variable | Purpose |
|----------|---------|
| `PILOT_SMOKE_PROJECT_ID_STAGING` | Pinned disposable QA project UUID |

Optional (steps 23–24 only if dedicated personas exist):

- `PILOT_E2E_STAKEHOLDER_REVOKED_EMAIL` / `PILOT_E2E_STAKEHOLDER_REVOKED_PASSWORD`
- `PILOT_E2E_CROSS_TENANT_EMAIL` / `PILOT_E2E_CROSS_TENANT_PASSWORD`

## Canonical Preview URL for dispatch

Exact hostname only (no wildcards):

`https://aistroyka-web-web-v7jq-git-fea-3e326e-2qjckdknjf-ctrls-projects.vercel.app`

If Vercel changes the branch Preview alias, update `governed-ai-pr-e2e-runner.constants.ts` via a reviewed infra change.

## Not required

- **`SUPABASE_SERVICE_ROLE_KEY_STAGING`** — intentionally **not** used by the runner (PR-checked-out code must not receive service-role keys)

## Preflight blockers (expected before setup complete)

| Code | Meaning |
|------|---------|
| `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` | Add required reviewers to `staging` |
| `BLOCKED_STAGING_ENVIRONMENT_METADATA` | Environment API unavailable or misconfigured |
| Missing secret names | Add required Environment secrets/variable |

See also: `docs/ops/GOVERNED_AI_PR_E2E_RUNNER.md`, `docs/ops/GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`
