# Governed AI PR E2E runner — owner secret setup

Configure staging credentials **without pasting values into PRs, chat, or commits**.

## Vercel — automation bypass

1. Open Vercel → project **`aistroyka-web-web-v7jq`**
2. **Settings** → **Deployment Protection**
3. Enable **Protection Bypass for Automation** (if not already)
4. Create or copy the **Automation Bypass** secret
5. Store it as GitHub secret `VERCEL_AUTOMATION_BYPASS_SECRET` (see GitHub section below)

Do not append bypass tokens to Preview URLs in workflow inputs or documentation.

## GitHub — protected `staging` environment

1. Repository **Settings** → **Environments** → **`staging`**
2. Enable **Required reviewers** (owner approval before secrets are exposed to the job)
3. Add **Environment secrets**:

| Secret | Purpose |
|--------|---------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel Deployment Protection bypass header |
| `PILOT_E2E_MANAGER_EMAIL` | Manager QA account (distinct from worker) |
| `PILOT_E2E_MANAGER_PASSWORD` | Manager QA password |

4. Verify these **already exist** at repository or environment level:

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

## Not required

- **`SUPABASE_SERVICE_ROLE_KEY_STAGING`** — intentionally **not** used by the runner (PR-checked-out code must not receive service-role keys)

## After setup

1. Merge infra PR #245 to `main`
2. Dispatch **Governed AI PR E2E runner** with PR #244 head SHA and matching Vercel Preview URL

See also: `docs/ops/GOVERNED_AI_PR_E2E_RUNNER.md`, `docs/ops/GOVERNED_AI_PR_E2E_RUNNER_THREAT_MODEL.md`
